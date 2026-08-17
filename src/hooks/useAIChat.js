import { useCallback, useEffect, useState } from "react";
import { databases, functions, appwriteConfig, ID, Query } from "../lib/appwrite";
import { useUser } from "../context/UserContext";
import { getProjectPermissions } from "../lib/permissions";

const { databaseId, aiMessagesCollectionId, aiChatFunctionId } = appwriteConfig;

export const AI_ROOMS = [
    { id: "frontend", label: "Frontend", color: "text-primary" },
    { id: "backend", label: "Backend", color: "text-secondary" },
    { id: "ui-ux", label: "UI/UX", color: "text-tertiary" },
    { id: "research", label: "Research", color: "text-primary" },
    { id: "documentation", label: "Documentation", color: "text-secondary" },
    { id: "presentation", label: "Presentation", color: "text-tertiary" },
];

export function useAIChat(projectId, room) {
    const user = useUser();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchMessages = useCallback(async() => {
        if (!projectId || !room) return;
        setLoading(true);
        setError(null);
        try {
            const res = await databases.listDocuments(databaseId, aiMessagesCollectionId, [
                Query.equal("projectId", projectId),
                Query.equal("room", room),
                Query.orderAsc("$createdAt"),
                Query.limit(200),
            ]);
            setMessages(res.documents);
        } catch (err) {
            setError(err.message || "Failed to load conversation history.");
        } finally {
            setLoading(false);
        }
    }, [projectId, room]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    const sendPrompt = useCallback(
        async(prompt) => {
            setSending(true);
            setError(null);
            try {
                const permissions = await getProjectPermissions(projectId);
                console.log("PERMISSIONS DEBUG:", permissions);
                const userDoc = await databases.createDocument(databaseId, aiMessagesCollectionId, ID.unique(), {
                    projectId,
                    room,
                    role: "user",
                    content: prompt,
                    pinned: false,
                    authorId: user.$id,
                }, permissions);
                setMessages((prev) => [...prev, userDoc]);

                // Appwrite Function proxies the actual Anthropic call server-side so
                // the API key never touches the frontend. See /functions/ai-chat.
                const history = [...messages, userDoc].map((m) => ({ role: m.role, content: m.content }));
                const execution = await functions.createExecution(
                    aiChatFunctionId,
                    JSON.stringify({ prompt, history, room }),
                    false
                );

                let replyText;
                try {
                    const parsed = JSON.parse(execution.responseBody);
                    replyText = parsed.reply || parsed.error || "The AI function returned an empty response.";
                } catch {
                    replyText = "The AI function didn't return valid JSON. Check the function logs in Appwrite.";
                }

                const assistantDoc = await databases.createDocument(databaseId, aiMessagesCollectionId, ID.unique(), {
                    projectId,
                    room,
                    role: "assistant",
                    content: replyText,
                    pinned: false,
                    authorId: "assistant",
                }, permissions);
                setMessages((prev) => [...prev, assistantDoc]);
                return assistantDoc;
            } catch (err) {
                setError(err.message || "Failed to reach the AI function.");
                throw err;
            } finally {
                setSending(false);
            }
        }, [projectId, room, user.$id, messages]
    );

    const togglePin = useCallback(
        (id) => {
            const target = messages.find((m) => m.$id === id);
            if (!target) return Promise.resolve();
            return databases
                .updateDocument(databaseId, aiMessagesCollectionId, id, { pinned: !target.pinned })
                .then((doc) => {
                    setMessages((prev) => prev.map((m) => (m.$id === id ? doc : m)));
                    return doc;
                });
        }, [messages]
    );

    const term = searchTerm.trim().toLowerCase();
    const filteredMessages = term ? messages.filter((m) => m.content && m.content.toLowerCase().includes(term)) : messages;
    const pinnedMessages = messages.filter((m) => m.pinned);

    return {
        messages: filteredMessages,
        pinnedMessages,
        loading,
        sending,
        error,
        searchTerm,
        setSearchTerm,
        sendPrompt,
        togglePin,
        refetch: fetchMessages,
    };
}