import { useCallback, useEffect, useState } from "react";
import { databases, functions, appwriteConfig, ID, Query } from "../lib/appwrite";
import { useUser } from "../context/UserContext";

const { databaseId, membersCollectionId, sendInviteFunctionId } = appwriteConfig;

export function useMembers(projectId) {
    const user = useUser();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMembers = useCallback(async() => {
        if (!projectId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await databases.listDocuments(databaseId, membersCollectionId, [
                Query.equal("projectId", projectId),
                Query.orderAsc("$createdAt"),
                Query.limit(100),
            ]);
            setMembers(res.documents);
        } catch (err) {
            setError(err.message || "Failed to load members.");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const inviteMember = useCallback(
        async({ email, role, projectName, inviterName }) => {
            const doc = await databases.createDocument(databaseId, membersCollectionId, ID.unique(), {
                projectId,
                userId: null,
                email,
                name: email.split("@")[0],
                role: role || "Viewer",
                status: "pending",
                invitedBy: user.$id,
            });
            setMembers((prev) => [...prev, doc]);

            // Best-effort: don't fail the invite creation if the email fails to send.
            // The pending record above is the source of truth either way.
            try {
                await functions.createExecution(
                    sendInviteFunctionId,
                    JSON.stringify({ to: email, role: role || "Viewer", projectName, inviterName }),
                    false
                );
            } catch (err) {
                console.warn("Invite saved, but the email failed to send:", err.message);
            }

            return doc;
        }, [projectId, user.$id]
    );

    const updateRole = useCallback(async(id, role) => {
        const doc = await databases.updateDocument(databaseId, membersCollectionId, id, { role });
        setMembers((prev) => prev.map((m) => (m.$id === id ? doc : m)));
        return doc;
    }, []);

    const removeMember = useCallback(async(id) => {
        await databases.deleteDocument(databaseId, membersCollectionId, id);
        setMembers((prev) => prev.filter((m) => m.$id !== id));
    }, []);

    const resendInvite = useCallback(async(id, { projectName, inviterName } = {}) => {
        // Re-stamps invitedBy/updatedAt so "Sent Xh ago" reflects the resend.
        const doc = await databases.updateDocument(databaseId, membersCollectionId, id, {
            invitedBy: user.$id,
        });
        setMembers((prev) => prev.map((m) => (m.$id === id ? doc : m)));

        // Best-effort: don't fail the resend if the email fails to send.
        try {
            await functions.createExecution(
                sendInviteFunctionId,
                JSON.stringify({ to: doc.email, role: doc.role, projectName, inviterName }),
                false
            );
        } catch (err) {
            console.warn("Invite re-stamped, but the email failed to send:", err.message);
        }

        return doc;
    }, [user.$id]);

    const activeMembers = members.filter((m) => m.status === "active");
    const pendingInvites = members.filter((m) => m.status === "pending");

    return {
        members,
        activeMembers,
        pendingInvites,
        loading,
        error,
        inviteMember,
        updateRole,
        removeMember,
        resendInvite,
        refetch: fetchMembers,
    };
}