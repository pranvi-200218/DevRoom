import { functions, appwriteConfig } from "./appwrite";

// Call this once right after a user logs in or signs up. It calls the
// send-invite-email function (which also handles linking — see its
// action: "link" branch) using a server-side API key, so it can bypass
// the client's own permission restrictions to find pending invites.
export async function linkPendingInvites(userId, email) {
    if (!email) return 0;
    try {
        const execution = await functions.createExecution(
            appwriteConfig.sendInviteFunctionId,
            JSON.stringify({ action: "link", userId, email }),
            false
        );
        const result = JSON.parse(execution.responseBody || "{}");
        return result.linked || 0;
    } catch (err) {
        console.warn("Failed to link pending invites:", err.message);
        return 0;
    }
}