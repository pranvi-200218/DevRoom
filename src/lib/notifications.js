// Notification CREATION only happens server-side (in the send-invite-email
// function, using an API key) — a browser session can't grant
// Role.user(someOtherUserId) permissions, same restriction we hit with
// messages/team permissions earlier. This file only handles reading /
// marking-as-read, which a user's own session is always allowed to do on
// their own notification documents.
import { databases, appwriteConfig } from "./appwrite";

const { databaseId, notificationsCollectionId } = appwriteConfig;

export async function markNotificationRead(id) {
    return databases.updateDocument(databaseId, notificationsCollectionId, id, { read: true });
}

export async function markAllNotificationsRead(ids) {
    return Promise.all(ids.map((id) => markNotificationRead(id).catch(() => {})));
}

export function notificationIcon(type) {
    switch (type) {
        case "invited":
            return "person_add";
        case "role_changed":
            return "manage_accounts";
        case "removed":
            return "person_remove";
        default:
            return "notifications";
    }
}