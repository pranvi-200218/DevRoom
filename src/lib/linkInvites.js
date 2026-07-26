import { databases, appwriteConfig, Query } from "./appwrite";
import { syncProjectAccess } from "./syncProjectAccess";

const { databaseId, membersCollectionId } = appwriteConfig;

// Call this once right after a user logs in or signs up. It finds any
// pending invites sent to their email, attaches their real account ($id)
// to those member records, and refreshes Appwrite permissions on the
// affected projects so the new member can actually see them.
export async function linkPendingInvites(userId, email) {
    if (!email) return 0;

    const res = await databases.listDocuments(databaseId, membersCollectionId, [
        Query.equal("email", email),
        Query.equal("status", "pending"),
        Query.limit(50),
    ]);

    const affectedProjectIds = new Set();

    for (const invite of res.documents) {
        await databases.updateDocument(databaseId, membersCollectionId, invite.$id, {
            userId,
            status: "active",
        });
        affectedProjectIds.add(invite.projectId);
    }

    for (const projectId of affectedProjectIds) {
        await syncProjectAccess(projectId).catch((err) => {
            console.warn(`Failed to sync access for project ${projectId}:`, err.message);
        });
    }

    return affectedProjectIds.size;
}