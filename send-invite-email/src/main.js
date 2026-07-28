// Appwrite Function — deploy this separately in the Appwrite console
// (or via the Appwrite CLI). It does TWO things, based on body.action:
//   action: "invite" (default) — sends the invite email via Messaging
//   action: "link"             — links a newly signed-up user to any
//                                 pending invites matching their email,
//                                 and refreshes project permissions
// (Combined into one function because free-tier Appwrite only allows 2
// functions total — this reuses the send-invite-email slot instead of
// needing a third function.)
//
// ONE-TIME SETUP (Appwrite Console):
// 1. Messaging → Providers → add + verify an Email provider.
// 2. This Function's Settings → Scopes (Dynamic API key), enable:
//      users.read, users.write, messages.write, databases.read, databases.write
//
// invite request body:  { to, role, projectName, inviterName, projectId }
// link request body:    { action: "link", userId, email }

import { Client, Users, Messaging, Databases, Permission, Role, ID, Query } from "node-appwrite";

const databaseId = "6a4f2d95001d70a443fb";
const projectsCollectionId = "projects";
const membersCollectionId = "members";
const messagesCollectionId = "messages";
const aiMessagesCollectionId = "ai_messages";
const foldersCollectionId = "folders";
const filesCollectionId = "files";

function buildProjectPermissions(ownerId, members) {
    const perms = [
        Permission.read(Role.user(ownerId)),
        Permission.write(Role.user(ownerId)),
        Permission.delete(Role.user(ownerId)),
    ];
    for (const m of members) {
        if (!m.userId || m.userId === ownerId) continue;
        perms.push(Permission.read(Role.user(m.userId)));
        if (m.role === "Editor" || m.role === "Owner") {
            perms.push(Permission.write(Role.user(m.userId)));
        }
    }
    return perms;
}

async function handleLink({ userId, email }, databases, log, error) {
    const pending = await databases.listDocuments(databaseId, membersCollectionId, [
        Query.equal("email", email),
        Query.equal("status", "pending"),
        Query.limit(50),
    ]);

    const affectedProjectIds = new Set();
    for (const invite of pending.documents) {
        await databases.updateDocument(databaseId, membersCollectionId, invite.$id, {
            userId,
            status: "active",
        });
        affectedProjectIds.add(invite.projectId);
    }

    for (const projectId of affectedProjectIds) {
        const project = await databases.getDocument(databaseId, projectsCollectionId, projectId);
        const activeMembers = await databases.listDocuments(databaseId, membersCollectionId, [
            Query.equal("projectId", projectId),
            Query.equal("status", "active"),
            Query.limit(200),
        ]);
        const permissions = buildProjectPermissions(project.ownerId, activeMembers.documents);
        await databases.updateDocument(databaseId, projectsCollectionId, projectId, {}, permissions);

        for (const collectionId of[messagesCollectionId, aiMessagesCollectionId, foldersCollectionId, filesCollectionId]) {
            const docs = await databases.listDocuments(databaseId, collectionId, [
                Query.equal("projectId", projectId),
                Query.limit(500),
            ]);
            await Promise.all(
                docs.documents.map((d) =>
                    databases.updateDocument(databaseId, collectionId, d.$id, {}, permissions).catch(() => {})
                )
            );
        }
    }

    log(`Linked ${pending.documents.length} invite(s) for ${email} across ${affectedProjectIds.size} project(s)`);
    return { linked: affectedProjectIds.size };
}

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

    const apiKey = req.headers["x-appwrite-key"] || process.env.APPWRITE_API_KEY || "";
    if (!apiKey) {
        error("No API key available (dynamic key header missing and APPWRITE_API_KEY not set).");
        return res.json({ error: "Server misconfiguration: missing API key." }, 500);
    }

    const client = new Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(apiKey);

    if (body.action === "link") {
        const { userId, email } = body;
        if (!userId || !email) {
            return res.json({ error: "Missing userId or email." }, 400);
        }
        try {
            const databases = new Databases(client);
            const result = await handleLink({ userId, email }, databases, log, error);
            return res.json(result);
        } catch (err) {
            error(`link action error: ${err.message}`);
            return res.json({ error: err.message }, 500);
        }
    }

    // ---- default: send invite email ----
    const { to, role = "Viewer", projectName = "a DevRoom OS project", inviterName = "Someone" } = body;
    if (!to || typeof to !== "string") {
        return res.json({ error: "Missing 'to' email address." }, 400);
    }
    log(`Inviting ${to} as ${role} to "${projectName}" (invited by ${inviterName})`);

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
            log(`Found existing user ${userId} for ${to}`);
        } else {
            const created = await users.create(ID.unique(), to);
            userId = created.$id;
            log(`Created new user ${userId} for ${to}`);
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

        const message = await messaging.createEmail(
            ID.unique(),
            subject,
            html, // content — this is the body Appwrite sends
            [], // topics
            [userId], // users
            [], // targets
            [], // cc
            [], // bcc
            [], // attachments
            false, // draft
            true // html — tells Appwrite to treat `content` above as HTML
        );

        log(`Messaging.createEmail returned message ${message.$id} with status: ${message.status}`);
        return res.json({ success: true, messageId: message.$id, status: message.status });
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