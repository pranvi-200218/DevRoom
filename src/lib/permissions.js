import { Permission, Role } from "appwrite";
import { databases, appwriteConfig } from "./appwrite";

// Builds the permission list for a project and everything that belongs to
// it (messages, ai_messages, folders, files). This is the single source of
// truth for "who can see/edit this project's data" at the Appwrite level —
// not just in the UI.
//
// - Owner: read + write + delete
// - Editor: read + write
// - Viewer: read only
// - Pending invites (no real account yet, userId is null) are skipped —
//   they get access once they sign up and linkPendingInvites() runs.
export function buildProjectPermissions({ ownerId, members }) {
    const perms = [];

    if (ownerId) {
        perms.push(
            Permission.read(Role.user(ownerId)),
            Permission.write(Role.user(ownerId)),
            Permission.delete(Role.user(ownerId))
        );
    }

    for (const m of members) {
        if (!m.userId || m.userId === ownerId) continue; // no account yet, or already the owner
        perms.push(Permission.read(Role.user(m.userId)));
        if (m.role === "Editor" || m.role === "Owner") {
            perms.push(Permission.write(Role.user(m.userId)));
        }
    }

    return perms;
}

// Fetches a project's current $permissions so a newly-created message,
// ai_message, folder, or file can inherit the same access immediately —
// no need to re-derive it from the members list on every single send.
// Falls back to an empty array (collection-level default) if the fetch fails,
// so a permissions hiccup never blocks someone from sending a message.
export async function getProjectPermissions(projectId) {
    try {
        const project = await databases.getDocument(appwriteConfig.databaseId, appwriteConfig.projectsCollectionId, projectId);
        return project.$permissions || [];
    } catch (err) {
        console.warn(`Could not fetch permissions for project ${projectId}:`, err.message);
        return [];
    }
}