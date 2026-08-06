import { databases, appwriteConfig, Query } from "./appwrite";
import { buildProjectPermissions } from "./permissions";

const {
    databaseId,
    projectsCollectionId,
    membersCollectionId,
    messagesCollectionId,
    aiMessagesCollectionId,
    foldersCollectionId,
    filesCollectionId,
} = appwriteConfig;

// Call this any time membership changes for a project: an invite gets
// accepted, a role changes, or a member is removed. It recalculates who
// should have access and re-applies that access at the Appwrite permission
// level on the project doc AND every existing message/file/folder that
// belongs to it (so newly-added members can see history, and removed
// members immediately lose access even to things Appwrite is now caching).
//
// Requires "Document Security" to be enabled on each of these collections
// in the Appwrite Console — otherwise these per-document permissions are
// ignored and the collection-level permissions apply instead.
export async function syncProjectAccess(projectId) {
    const project = await databases.getDocument(databaseId, projectsCollectionId, projectId);

    const membersRes = await databases.listDocuments(databaseId, membersCollectionId, [
        Query.equal("projectId", projectId),
        Query.equal("status", "active"),
        Query.limit(200),
    ]);

    const permissions = buildProjectPermissions({ ownerId: project.ownerId, members: membersRes.documents });
    console.log("syncProjectAccess: computed permissions ->", JSON.stringify(permissions));
    console.log("syncProjectAccess: project.ownerId ->", JSON.stringify(project.ownerId));
    console.log("syncProjectAccess: active members ->", membersRes.documents.map((m) => ({ id: m.$id, userId: m.userId, role: m.role })));

    await databases.updateDocument(databaseId, projectsCollectionId, projectId, {}, permissions);

    const collectionsToSync = [messagesCollectionId, aiMessagesCollectionId, foldersCollectionId, filesCollectionId];

    for (const collectionId of collectionsToSync) {
        const res = await databases.listDocuments(databaseId, collectionId, [
            Query.equal("projectId", projectId),
            Query.limit(500),
        ]);
        await Promise.all(
            res.documents.map((doc) =>
                databases.updateDocument(databaseId, collectionId, doc.$id, {}, permissions).catch(() => {})
            )
        );
    }

    return permissions;
}