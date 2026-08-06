import { Permission, Role } from "appwrite";
import { databases, appwriteConfig } from "./appwrite";

// IMPORTANT Appwrite rule: a session can only grant a ROLE-SCOPED permission
// (e.g. `team:ID/owner`, `team:ID/editor`) if the CURRENT session itself
// holds that exact role. It can always grant the UNSCOPED `team:ID` (just
// "any member of this team"), regardless of which role it personally has.
//
// That means: if we stamp `write(team:ID/editor)` onto a document's
// permissions, only a session that is itself an editor can successfully
// create that document — an owner-session trying to create the same kind of
// document with that same permission list gets a 401, because the owner
// doesn't hold the "editor" role. Since messages/files/etc. get created by
// whichever member happens to be using the app at that moment (owner,
// editor, or viewer), role-scoped grants break for whoever isn't that role.
//
// So: the PROJECT document itself is only ever created once, by whoever is
// about to become its owner — for that one write, owner-scoped permissions
// are safe. Everything that hangs off the project (messages, ai_messages,
// files, folders, typing, presence, and the members list) gets created by
// arbitrary team members over time, so those use the unscoped team role —
// any member can read/write. Fine-grained "viewers can't post" enforcement
// stays a UI-level concern rather than an Appwrite-level one.

// Permissions for the PROJECT document itself. Always created by the owner,
// so owner-scoped write/delete is safe here.
export function buildProjectDocPermissions(teamId) {
    if (!teamId) return [];
    return [
        Permission.read(Role.team(teamId)),
        Permission.write(Role.team(teamId, "owner")),
        Permission.delete(Role.team(teamId, "owner")),
    ];
}

// Permissions for everything that belongs to a project (messages,
// ai_messages, folders, files, typing, presence, members). Unscoped team
// role, so it works no matter which member (owner/editor/viewer) is the one
// actually creating the document at that moment.
export function buildChildPermissions(teamId) {
    if (!teamId) return [];
    return [
        Permission.read(Role.team(teamId)),
        Permission.write(Role.team(teamId)),
    ];
}

// Backwards-compatible name some call sites still import — same as the
// project-doc variant, kept so nothing breaks if referenced directly.
export const buildProjectPermissions = buildProjectDocPermissions;

// Fetches a project's teamId and returns the permission set that should be
// used for anything created underneath it (messages, ai_messages, files,
// folders, typing, presence). Falls back to an empty array if the fetch
// fails, so a permissions hiccup never blocks someone from sending a message.
export async function getProjectPermissions(projectId) {
    try {
        const project = await databases.getDocument(appwriteConfig.databaseId, appwriteConfig.projectsCollectionId, projectId);
        return buildChildPermissions(project.teamId);
    } catch (err) {
        console.warn(`Could not fetch permissions for project ${projectId}:`, err.message);
        return [];
    }
}