import { databases, appwriteConfig, ID } from "./appwrite";
import { getProjectPermissions } from "./permissions";

const { databaseId, activityCollectionId } = appwriteConfig;

// Fire-and-forget: logs a real event to the project's activity feed.
// Never throws — a logging failure should never block the actual action
// (uploading a file, inviting a member, etc.) from succeeding.
export async function logActivity(projectId, type, { actorName, detail } = {}) {
    try {
        const permissions = await getProjectPermissions(projectId);
        await databases.createDocument(databaseId, activityCollectionId, ID.unique(), {
            projectId,
            type,
            actorName: actorName || "Someone",
            detail: detail || "",
        }, permissions);
    } catch (err) {
        console.warn(`Failed to log activity (${type}) for project ${projectId}:`, err.message);
    }
}

export function describeActivity(a) {
    switch (a.type) {
        case "project_created":
            return `${a.actorName} created this project`;
        case "project_updated":
            return `${a.actorName} updated the project details`;
        case "file_uploaded":
            return `${a.actorName} uploaded ${a.detail || "a file"}`;
        case "folder_created":
            return `${a.actorName} created a folder${a.detail ? ` "${a.detail}"` : ""}`;
        case "member_invited":
            return `${a.actorName} invited ${a.detail || "someone"}`;
        case "member_joined":
            return `${a.actorName} joined the project`;
        case "role_changed":
            return `${a.actorName}'s role changed to ${a.detail || "a new role"}`;
        case "member_removed":
            return `${a.actorName} was removed from the project`;
        default:
            return `${a.actorName} did something`;
    }
}

export function activityIcon(type) {
    switch (type) {
        case "project_created":
            return "add_circle";
        case "project_updated":
            return "edit";
        case "file_uploaded":
            return "upload_file";
        case "folder_created":
            return "create_new_folder";
        case "member_invited":
            return "person_add";
        case "member_joined":
            return "how_to_reg";
        case "role_changed":
            return "manage_accounts";
        case "member_removed":
            return "person_remove";
        default:
            return "bolt";
    }
}