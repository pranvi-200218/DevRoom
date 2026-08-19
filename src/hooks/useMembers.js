import { useCallback, useEffect, useState } from "react";
import { databases, functions, appwriteConfig, ID, Query } from "../lib/appwrite";
import { useUser } from "../context/UserContext";
import { getProjectPermissions } from "../lib/permissions";

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
            // Team-based permissions (same as project/messages/files) so every
            // existing team member can see the members list, not just whoever
            // sent this particular invite.
            const permissions = await getProjectPermissions(projectId);
            const doc = await databases.createDocument(
                databaseId,
                membersCollectionId,
                ID.unique(), {
                    projectId,
                    userId: null,
                    email,
                    name: email.split("@")[0],
                    role: role || "Viewer",
                    status: "pending",
                    invitedBy: user.$id,
                },
                permissions
            );
            setMembers((prev) => [...prev, doc]);

            // Best-effort: don't fail the invite creation if the email fails to send.
            // The pending record above is the source of truth either way.
            try {
                await functions.createExecution(
                    sendInviteFunctionId,
                    JSON.stringify({ to: email, role: role || "Viewer", projectName, inviterName, projectId }),
                    true
                );
            } catch (err) {
                console.warn("Invite saved, but the email failed to send:", err.message);
            }

            return doc;
        }, [projectId, user.$id]
    );

    const updateRole = useCallback(async(id, role) => {
        // Owner row is synthesized (not a real doc) — there's nothing to update in the DB.
        if (id.startsWith("owner-")) {
            console.warn("The project owner's role can't be changed here.");
            return null;
        }
        const doc = await databases.updateDocument(databaseId, membersCollectionId, id, { role });
        setMembers((prev) => prev.map((m) => (m.$id === id ? doc : m)));

        // Changing someone's role also has to change their role inside the
        // project's Appwrite Team (owner/editor/viewer) — that's what
        // actually controls their write/delete access at the Appwrite level.
        // Only active members with a linked account have a team membership.
        if (doc.userId) {
            try {
                await functions.createExecution(
                    sendInviteFunctionId,
                    JSON.stringify({ action: "updateMemberRole", projectId, userId: doc.userId, role }),
                    false
                );
            } catch (err) {
                console.warn("Role saved, but syncing team access failed:", err.message);
            }
        }
        return doc;
    }, [projectId]);

    const removeMember = useCallback(async(id) => {
        // Owner row is synthesized (not a real doc) — nothing to delete.
        if (id.startsWith("owner-")) {
            console.warn("The project owner can't be removed.");
            return;
        }
        const target = members.find((m) => m.$id === id);
        await databases.deleteDocument(databaseId, membersCollectionId, id);
        setMembers((prev) => prev.filter((m) => m.$id !== id));

        if (target?.userId) {
            try {
                await functions.createExecution(
                    sendInviteFunctionId,
                    JSON.stringify({ action: "removeMember", projectId, userId: target.userId }),
                    false
                );
            } catch (err) {
                console.warn("Member removed, but revoking team access failed:", err.message);
            }
        }
    }, [projectId, members]);

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
                JSON.stringify({ to: doc.email, role: doc.role, projectName, inviterName, projectId }),
                true
            );
        } catch (err) {
            console.warn("Invite re-stamped, but the email failed to send:", err.message);
        }

        return doc;
    }, [user.$id]);

    const activeFromDocs = members.filter((m) => m.status === "active");
    const pendingInvites = members.filter((m) => m.status === "pending");

    // The project owner/creator never gets a row in the members collection —
    // that only happens through the invite flow (pending -> active). Without
    // this, the owner is invisible in "Active Members" even though they have
    // full access to the project. Synthesize a row for them if one doesn't
    // already exist so they show up in the list too.
    const hasOwnerDoc = activeFromDocs.some((m) => m.userId === user.$id);
    const activeMembers = hasOwnerDoc ?
        activeFromDocs : [{
                $id: `owner-${user.$id}`,
                projectId,
                userId: user.$id,
                email: user.email,
                name: user.name,
                role: "Owner",
                status: "active",
            },
            ...activeFromDocs,
        ];

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