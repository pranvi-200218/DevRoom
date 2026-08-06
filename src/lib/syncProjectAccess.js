import { databases, appwriteConfig, Query } from "./appwrite";
import { buildProjectDocPermissions, buildChildPermissions } from "./permissions";

const {
    databaseId,
    projectsCollectionId,
    membersCollectionId,
    messagesCollectionId,
    aiMessagesCollectionId,
    foldersCollectionId,
    filesCollectionId,
} = appwriteConfig;

// One-off repair tool: re-applies team-based permissions to a project doc
// and everything that belongs to it. The project doc itself gets
// owner-scoped write/delete (safe — only ever re-applied by this script,
// running with elevated/owner context); everything else gets the unscoped
// "any team member" permission set, since those documents get created by
// whichever member happens to be active at the time (owner, editor, or
// viewer), and a role-scoped grant only works for the role the creating
// session actually holds.
export async function syncProjectAccess(projectId) {
    const project = await databases.getDocument(databaseId, projectsCollectionId, projectId);
    if (!project.teamId) {
        throw new Error(`Project ${projectId} has no teamId — run the Teams migration first.`);
    }

    const projectPermissions = buildProjectDocPermissions(project.teamId);
    const childPermissions = buildChildPermissions(project.teamId);

    await databases.updateDocument(databaseId, projectsCollectionId, projectId, {}, projectPermissions);

    const collectionsToSync = [messagesCollectionId, aiMessagesCollectionId, foldersCollectionId, filesCollectionId, membersCollectionId];

    for (const collectionId of collectionsToSync) {
        const res = await databases.listDocuments(databaseId, collectionId, [
            Query.equal("projectId", projectId),
            Query.limit(500),
        ]);
        await Promise.all(
            res.documents.map((doc) =>
                databases.updateDocument(databaseId, collectionId, doc.$id, {}, childPermissions).catch(() => {})
            )
        );
    }

    return { projectPermissions, childPermissions };
}