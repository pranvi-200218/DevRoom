import { useCallback, useEffect, useRef, useState } from "react";
import client, { databases, storage, appwriteConfig, ID, Query } from "../lib/appwrite";
import { useUser } from "../context/UserContext";
import { getProjectPermissions } from "../lib/permissions";

const {
    databaseId,
    messagesCollectionId,
    typingCollectionId,
    presenceCollectionId,
    chatAttachmentsBucketId,
} = appwriteConfig;

const TYPING_STALE_MS = 4000;
const PRESENCE_STALE_MS = 30000;
const PRESENCE_HEARTBEAT_MS = 15000;

export function useMessages(projectId, channelId = "general") {
    const user = useUser();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const typingDocId = useRef(null);

    // ---- initial load + realtime subscription for messages ----
    useEffect(() => {
        if (!projectId) return;
        let cancelled = false;
        setLoading(true);
        setError(null);

        databases
            .listDocuments(databaseId, messagesCollectionId, [
                Query.equal("projectId", projectId),
                Query.equal("channelId", channelId),
                Query.orderAsc("$createdAt"),
                Query.limit(200),
            ])
            .then((res) => {
                if (!cancelled) setMessages(res.documents);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || "Failed to load messages.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        const unsubscribe = client.subscribe(
            `databases.${databaseId}.collections.${messagesCollectionId}.documents`,
            (event) => {
                const doc = event.payload;
                if (doc.projectId !== projectId || doc.channelId !== channelId) return;

                if (event.events.some((e) => e.endsWith(".create"))) {
                    setMessages((prev) => (prev.some((m) => m.$id === doc.$id) ? prev : [...prev, doc]));
                } else if (event.events.some((e) => e.endsWith(".update"))) {
                    setMessages((prev) => prev.map((m) => (m.$id === doc.$id ? doc : m)));
                } else if (event.events.some((e) => e.endsWith(".delete"))) {
                    setMessages((prev) => prev.filter((m) => m.$id !== doc.$id));
                }
            }
        );

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [projectId, channelId]);

    const sendMessage = useCallback(
        async({ text, replyToId = null, attachment = null }) => {
            let attachmentFileId = null;
            let attachmentName = null;
            if (attachment) {
                const uploaded = await storage.createFile(chatAttachmentsBucketId, ID.unique(), attachment);
                attachmentFileId = uploaded.$id;
                attachmentName = attachment.name;
            }
            const permissions = await getProjectPermissions(projectId);
            return databases.createDocument(databaseId, messagesCollectionId, ID.unique(), {
                projectId,
                channelId,
                authorId: user.$id,
                authorName: user.name,
                authorAvatar: user.avatarUrl,
                text,
                replyToId,
                pinned: false,
                attachmentFileId,
                attachmentName,
            }, permissions);
        }, [projectId, channelId, user]
    );

    const togglePin = useCallback(
        (id) => {
            const target = messages.find((m) => m.$id === id);
            if (!target) return Promise.resolve();
            return databases.updateDocument(databaseId, messagesCollectionId, id, { pinned: !target.pinned });
        }, [messages]
    );

    const deleteMessage = useCallback((id) => {
        return databases.deleteDocument(databaseId, messagesCollectionId, id);
    }, []);

    const getAttachmentUrl = useCallback((fileId) => {
        return storage.getFileView(chatAttachmentsBucketId, fileId);
    }, []);

    // ---- typing indicator: upsert a doc on keystroke, clear on send/blur ----
    const setTyping = useCallback(
        async(isTyping) => {
            try {
                if (isTyping) {
                    if (!typingDocId.current) {
                        const doc = await databases.createDocument(databaseId, typingCollectionId, ID.unique(), {
                            projectId,
                            channelId,
                            userId: user.$id,
                            userName: user.name,
                        });
                        typingDocId.current = doc.$id;
                    } else {
                        await databases.updateDocument(databaseId, typingCollectionId, typingDocId.current, {
                            $updatedAt: new Date().toISOString(),
                        });
                    }
                } else if (typingDocId.current) {
                    await databases.deleteDocument(databaseId, typingCollectionId, typingDocId.current);
                    typingDocId.current = null;
                }
            } catch {
                // best-effort — typing indicators shouldn't block the chat if this fails
            }
        }, [projectId, channelId, user]
    );

    useEffect(() => {
        return () => {
            if (typingDocId.current) {
                databases.deleteDocument(databaseId, typingCollectionId, typingDocId.current).catch(() => {});
            }
        };
    }, []);

    const [typingUsers, setTypingUsers] = useState([]);
    useEffect(() => {
        if (!projectId) return;
        let poll;
        async function refreshTyping() {
            try {
                const res = await databases.listDocuments(databaseId, typingCollectionId, [
                    Query.equal("projectId", projectId),
                    Query.equal("channelId", channelId),
                ]);
                const now = Date.now();
                setTypingUsers(
                    res.documents.filter(
                        (d) => d.userId !== user.$id && now - new Date(d.$updatedAt).getTime() < TYPING_STALE_MS
                    )
                );
            } catch {
                // ignore transient errors on poll
            }
        }
        refreshTyping();
        poll = setInterval(refreshTyping, 2000);
        return () => clearInterval(poll);
    }, [projectId, channelId, user.$id]);

    const term = searchTerm.trim().toLowerCase();
    const filteredMessages = term ? messages.filter((m) => m.text?.toLowerCase().includes(term)) : messages;
    const pinnedMessages = messages.filter((m) => m.pinned);

    return {
        messages: filteredMessages,
        pinnedMessages,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        sendMessage,
        togglePin,
        deleteMessage,
        getAttachmentUrl,
        setTyping,
        typingUsers,
    };
}

export function usePresence(projectId) {
    const user = useUser();
    const [onlineUsers, setOnlineUsers] = useState([]);
    const presenceDocId = useRef(null);

    useEffect(() => {
        if (!projectId) return;
        let heartbeat;
        let poll;

        async function beat() {
            try {
                if (!presenceDocId.current) {
                    const existing = await databases.listDocuments(databaseId, presenceCollectionId, [
                        Query.equal("projectId", projectId),
                        Query.equal("userId", user.$id),
                    ]);
                    if (existing.documents.length > 0) {
                        presenceDocId.current = existing.documents[0].$id;
                        await databases.updateDocument(databaseId, presenceCollectionId, presenceDocId.current, {
                            $updatedAt: new Date().toISOString(),
                        });
                    } else {
                        const doc = await databases.createDocument(databaseId, presenceCollectionId, ID.unique(), {
                            projectId,
                            userId: user.$id,
                            userName: user.name,
                            avatarUrl: user.avatarUrl,
                        });
                        presenceDocId.current = doc.$id;
                    }
                } else {
                    await databases.updateDocument(databaseId, presenceCollectionId, presenceDocId.current, {
                        $updatedAt: new Date().toISOString(),
                    });
                }
            } catch {
                // presence is best-effort
            }
        }

        async function refreshOnline() {
            try {
                const res = await databases.listDocuments(databaseId, presenceCollectionId, [
                    Query.equal("projectId", projectId),
                ]);
                const now = Date.now();
                setOnlineUsers(res.documents.filter((d) => now - new Date(d.$updatedAt).getTime() < PRESENCE_STALE_MS));
            } catch {
                // ignore transient errors on poll
            }
        }

        beat();
        refreshOnline();
        heartbeat = setInterval(beat, PRESENCE_HEARTBEAT_MS);
        poll = setInterval(refreshOnline, 5000);

        return () => {
            clearInterval(heartbeat);
            clearInterval(poll);
            if (presenceDocId.current) {
                databases.deleteDocument(databaseId, presenceCollectionId, presenceDocId.current).catch(() => {});
            }
        };
    }, [projectId, user]);

    return { onlineUsers };
}