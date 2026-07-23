// Appwrite Function — deploy this separately in the Appwrite console
// (or via the Appwrite CLI). It sends the invite email using Appwrite's
// own built-in Messaging feature — no third-party email API key needed.
//
// ONE-TIME SETUP (Appwrite Console):
// 1. Go to Messaging → Providers → add an Email provider (SMTP, or any
//    supported provider) and make sure it's enabled/verified.
// 2. Go to this Function's Settings → "Execute Access" / API key section
//    and enable a Dynamic API key for the function, with these scopes:
//      users.read, users.write, messages.write
//    (If you'd rather use a static key, create one under
//    Console → Overview → API Keys with the same scopes, and set it as
//    an environment variable named APPWRITE_API_KEY on this function.)
//
// Request body (JSON): { to, role, projectName, inviterName }
// Response body (JSON): { success: true } on success, { error: string } on failure

import { Client, Users, Messaging, ID, Query } from "node-appwrite";

export default async({ req, res, log, error }) => {
    if (req.method !== "POST") {
        return res.json({ error: "Use POST." }, 405);
    }

    let body;
    try {
        body = JSON.parse(req.body || "{}");
    } catch {
        return res.json({ error: "Invalid JSON body." }, 400);
    }

    const { to, role = "Viewer", projectName = "a DevRoom OS project", inviterName = "Someone" } = body;
    if (!to || typeof to !== "string") {
        return res.json({ error: "Missing 'to' email address." }, 400);
    }

    const apiKey = req.headers["x-appwrite-key"] || process.env.APPWRITE_API_KEY || "";
    if (!apiKey) {
        error("No API key available (dynamic key header missing and APPWRITE_API_KEY not set).");
        return res.json({ error: "Server misconfiguration: missing API key." }, 500);
    }

    const client = new Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(apiKey);

    const users = new Users(client);
    const messaging = new Messaging(client);

    try {
        // Appwrite Messaging sends to existing Appwrite users, not raw email
        // strings — so we find-or-create a bare user account for the invitee.
        // This gives them an email "target" that Messaging can deliver to.
        let userId;
        const existing = await users.list([Query.equal("email", to)]);
        if (existing.total > 0) {
            userId = existing.users[0].$id;
        } else {
            const created = await users.create(ID.unique(), to);
            userId = created.$id;
        }

        const subject = `${inviterName} invited you to ${projectName} on DevRoom OS`;
        const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="margin-bottom: 8px;">You're invited to ${escapeHtml(projectName)}</h2>
        <p style="color: #555; line-height: 1.5;">
          ${escapeHtml(inviterName)} invited you to join <b>${escapeHtml(projectName)}</b>
          on DevRoom OS as a <b>${escapeHtml(role)}</b>.
        </p>
        <p style="color: #555; line-height: 1.5;">
          Sign in to DevRoom OS with this email address (${escapeHtml(to)}) to accept the invite.
        </p>
      </div>
    `;
        const text = `${inviterName} invited you to join "${projectName}" on DevRoom OS as a ${role}. Sign in with ${to} to accept.`;

        await messaging.createEmail(
            ID.unique(),
            subject,
            text, [], // topics
            [userId], // users
            [], // targets
            [], // cc
            [], // bcc
            [], // attachments
            false, // draft
            html
        );

        return res.json({ success: true });
    } catch (err) {
        error(`Failed to send invite email: ${err.message}`);
        return res.json({ error: err.message || "Failed to send invite email." }, 500);
    }
};

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}