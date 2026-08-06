// Appwrite Function — deploy this separately in the Appwrite console
// (or via the Appwrite CLI). It does several things, based on body.action:
//   action: "invite" (default)   — sends the invite email via Messaging
//   action: "link"               — links a newly signed-up user to any
//                                   pending invites matching their email,
//                                   and adds them to each project's Team
//   action: "updateMemberRole"   — changes someone's role in a project's Team
//   action: "removeMember"       — removes someone from a project's Team
// (Combined into one function because free-tier Appwrite only allows 2
// functions total — this reuses the send-invite-email slot instead of
// needing a third function.)
//
// Access is now Team-based: each project has an Appwrite Team (project.teamId),
// and document permissions reference Role.team(teamId, role) rather than
// individual Role.user(userId) entries. A browser session can't grant
// Role.user(otherUserId) permissions to someone else (Appwrite rejects that
// with a 401 "Permissions must be one of..."), so adding/removing/promoting
// people in the Team has to happen server-side, with an API key — that's
// what this function does.
//
// ONE-TIME SETUP (Appwrite Console):
// 1. Messaging → Providers → add + verify an Email provider.
// 2. This Function's Settings → Scopes (Dynamic API key), enable:
//      users.read, users.write, messages.write, databases.read, databases.write, teams.read, teams.write
//
// invite request body:            { to, role, projectName, inviterName, projectId }
// link request body:              { action: "link", userId, email }
// updateMemberRole request body:  { action: "updateMemberRole", projectId, userId, role }
// removeMember request body:      { action: "removeMember", projectId, userId }

import { Client, Users, Messaging, Databases, Teams, ID, Query } from "node-appwrite";

const databaseId = "6a4f2d95001d70a443fb";
const projectsCollectionId = "projects";
const membersCollectionId = "members";

// Maps our app-level member role ("Owner" / "Editor" / "Viewer") to the
// Appwrite Team role string used in Role.team(teamId, role) permissions.
function teamRoleFor(memberRole) {
    if (memberRole === "Owner") return "owner";
    if (memberRole === "Editor") return "editor";
    return "viewer";
}

async function handleLink({ userId, email }, databases, teams, log, error) {
    const pending = await databases.listDocuments(databaseId, membersCollectionId, [
        Query.equal("email", email),
        Query.equal("status", "pending"),
        Query.limit(50),
    ]);

    let linkedCount = 0;
    for (const invite of pending.documents) {
        await databases.updateDocument(databaseId, membersCollectionId, invite.$id, {
            userId,
            status: "active",
        });

        try {
            const project = await databases.getDocument(databaseId, projectsCollectionId, invite.projectId);
            if (project.teamId) {
                // Server SDK + API key: membership is added directly, no
                // email-confirmation round-trip needed (that's only required
                // when a Client SDK sends the invite).
                await teams.createMembership({
                    teamId: project.teamId,
                    roles: [teamRoleFor(invite.role)],
                    userId,
                });
            } else {
                error(`Project ${invite.projectId} has no teamId — skipping team membership for ${email}. Run the Teams migration.`);
            }
        } catch (err) {
            // Already a member, or some other non-fatal hiccup — don't block
            // the rest of the invites over one project's team issue.
            error(`Could not add ${email} to team for project ${invite.projectId}: ${err.message}`);
        }

        linkedCount++;
    }

    log(`Linked ${linkedCount} invite(s) for ${email}`);
    return { linked: linkedCount };
}

async function handleUpdateMemberRole({ projectId, userId, role }, databases, teams, log) {
    const project = await databases.getDocument(databaseId, projectsCollectionId, projectId);
    if (!project.teamId) throw new Error(`Project ${projectId} has no teamId.`);

    const memberships = await teams.listMemberships({
        teamId: project.teamId,
        queries: [Query.equal("userId", userId)],
    });
    if (memberships.memberships.length === 0) {
        throw new Error(`${userId} is not a member of this project's team.`);
    }

    await teams.updateMembership({
        teamId: project.teamId,
        membershipId: memberships.memberships[0].$id,
        roles: [teamRoleFor(role)],
    });

    log(`Updated ${userId}'s team role to ${teamRoleFor(role)} for project ${projectId}`);
    return { success: true };
}

async function handleRemoveMember({ projectId, userId }, databases, teams, log) {
    const project = await databases.getDocument(databaseId, projectsCollectionId, projectId);
    if (!project.teamId) throw new Error(`Project ${projectId} has no teamId.`);

    const memberships = await teams.listMemberships({
        teamId: project.teamId,
        queries: [Query.equal("userId", userId)],
    });
    if (memberships.memberships.length > 0) {
        await teams.deleteMembership({
            teamId: project.teamId,
            membershipId: memberships.memberships[0].$id,
        });
    }

    log(`Removed ${userId} from team for project ${projectId}`);
    return { success: true };
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
            const teams = new Teams(client);
            const result = await handleLink({ userId, email }, databases, teams, log, error);
            return res.json(result);
        } catch (err) {
            error(`link action error: ${err.message}`);
            return res.json({ error: err.message }, 500);
        }
    }

    if (body.action === "updateMemberRole") {
        const { projectId, userId, role } = body;
        if (!projectId || !userId || !role) {
            return res.json({ error: "Missing projectId, userId, or role." }, 400);
        }
        try {
            const databases = new Databases(client);
            const teams = new Teams(client);
            const result = await handleUpdateMemberRole({ projectId, userId, role }, databases, teams, log);
            return res.json(result);
        } catch (err) {
            error(`updateMemberRole action error: ${err.message}`);
            return res.json({ error: err.message }, 500);
        }
    }

    if (body.action === "removeMember") {
        const { projectId, userId } = body;
        if (!projectId || !userId) {
            return res.json({ error: "Missing projectId or userId." }, 400);
        }
        try {
            const databases = new Databases(client);
            const teams = new Teams(client);
            const result = await handleRemoveMember({ projectId, userId }, databases, teams, log);
            return res.json(result);
        } catch (err) {
            error(`removeMember action error: ${err.message}`);
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