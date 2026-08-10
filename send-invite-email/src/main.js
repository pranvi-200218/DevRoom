import { Client, Users, Messaging, Databases, Teams, Permission, Role, ID, Query } from "node-appwrite";

const databaseId = "6a4f2d95001d70a443fb";
const projectsCollectionId = "projects";
const membersCollectionId = "members";
const activityCollectionId = "activity";
const notificationsCollectionId = "notifications";

async function logActivity(databases, projectId, type, { actorName, detail } = {}, errorLog = console.warn) {
    try {
        await databases.createDocument(databaseId, activityCollectionId, ID.unique(), {
            projectId,
            type,
            actorName: actorName || "Someone",
            detail: detail || "",
        });
    } catch (err) {
        errorLog(`Failed to log activity: ${err.message}`);
    }
}

async function notifyUser(databases, userId, { type, message, projectId }, errorLog = console.warn) {
    try {
        await databases.createDocument(databaseId, notificationsCollectionId, ID.unique(), {
            userId,
            type,
            message,
            projectId: projectId || null,
            read: false,
        }, [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
        ]);
    } catch (err) {
        errorLog(`Failed to notify ${userId}: ${err.message}`);
    }
}

async function handleJoinViaLink({ projectId, userId, email, name }, databases, teams, log, error) {
    const project = await databases.getDocument(databaseId, projectsCollectionId, projectId);
    if (!project.teamId) throw new Error(`Project ${projectId} has no teamId. Run the Teams migration first.`);

    const existing = await databases.listDocuments(databaseId, membersCollectionId, [
        Query.equal("projectId", projectId),
        Query.equal("userId", userId),
        Query.limit(1),
    ]);
    if (existing.documents.length > 0 && existing.documents[0].status === "active") {
        log(`${email} is already an active member of ${projectId}`);
        return { alreadyMember: true };
    }

    const role = "Viewer";
    const childPermissions = [
        Permission.read(Role.team(project.teamId)),
        Permission.update(Role.team(project.teamId)),
        Permission.delete(Role.team(project.teamId)),
    ];

    // Team membership FIRST — same reasoning as handleLink: don't mark the
    // member record "active" until Appwrite actually granted team access.
    await teams.createMembership(project.teamId, [teamRoleFor(role)], undefined, userId);

    if (existing.documents.length > 0) {
        await databases.updateDocument(databaseId, membersCollectionId, existing.documents[0].$id, {
            userId,
            status: "active",
        });
    } else {
        await databases.createDocument(databaseId, membersCollectionId, ID.unique(), {
            projectId,
            userId,
            email,
            name: name || email.split("@")[0],
            role,
            status: "active",
            invitedBy: null,
        }, childPermissions);
    }

    await logActivity(databases, projectId, "member_joined", { actorName: name || email }, error);
    await notifyUser(databases, userId, {
        type: "invited",
        message: `You joined "${project.name}" as ${role}`,
        projectId,
    }, error);

    if (project.ownerId) {
        await notifyUser(databases, project.ownerId, {
            type: "invited",
            message: `${name || email} joined "${project.name}" via invite link`,
            projectId,
        }, error);
    }

    log(`${email} joined ${projectId} via invite link as ${role}`);
    return { joined: true, role };
}

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
        try {
            const project = await databases.getDocument(databaseId, projectsCollectionId, invite.projectId);
            if (!project.teamId) {
                error(`Project ${invite.projectId} has no teamId — skipping team membership for ${email}. Run the Teams migration.`);
                continue;
            }

            // Team membership FIRST — this is the step that actually grants
            // access. Only flip status to "active" (and notify) once it has
            // genuinely succeeded, so a scope/permission failure here never
            // leaves a member record that *looks* active but has no real
            // team access, and never gone silently unnoticed.
            await teams.createMembership(project.teamId, [teamRoleFor(invite.role)], undefined, userId);

            await databases.updateDocument(databaseId, membersCollectionId, invite.$id, {
                userId,
                status: "active",
            });

            await logActivity(databases, invite.projectId, "member_joined", { actorName: email }, error);
            await notifyUser(databases, userId, {
                type: "invited",
                message: `You joined "${project.name}" as ${invite.role}`,
                projectId: invite.projectId,
            }, error);

            linkedCount++;
        } catch (err) {
            error(`Could not link ${email} to project ${invite.projectId}: ${err.message}`);
        }
    }

    log(`Linked ${linkedCount} invite(s) for ${email}`);
    return { linked: linkedCount };
}

async function handleUpdateMemberRole({ projectId, userId, role }, databases, teams, log) {
    const project = await databases.getDocument(databaseId, projectsCollectionId, projectId);
    if (!project.teamId) throw new Error(`Project ${projectId} has no teamId.`);

    const memberships = await teams.listMemberships(project.teamId, [Query.equal("userId", userId)]);
    if (memberships.memberships.length === 0) {
        throw new Error(`${userId} is not a member of this project's team.`);
    }

    await teams.updateMembership(project.teamId, memberships.memberships[0].$id, [teamRoleFor(role)]);

    await notifyUser(databases, userId, {
        type: "role_changed",
        message: `Your role in "${project.name}" changed to ${role}`,
        projectId,
    });

    log(`Updated ${userId}'s team role to ${teamRoleFor(role)} for project ${projectId}`);
    return { success: true };
}

async function handleRemoveMember({ projectId, userId }, databases, teams, log) {
    const project = await databases.getDocument(databaseId, projectsCollectionId, projectId);
    if (!project.teamId) throw new Error(`Project ${projectId} has no teamId.`);

    const memberships = await teams.listMemberships(project.teamId, [Query.equal("userId", userId)]);
    if (memberships.memberships.length > 0) {
        await teams.deleteMembership(project.teamId, memberships.memberships[0].$id);
    }

    await notifyUser(databases, userId, {
        type: "removed",
        message: `You were removed from "${project.name}"`,
        projectId: null,
    });

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

    if (body.action === "joinViaLink") {
        const { projectId, userId, email, name } = body;
        if (!projectId || !userId || !email) {
            return res.json({ error: "Missing projectId, userId, or email." }, 400);
        }
        try {
            const databases = new Databases(client);
            const teams = new Teams(client);
            const result = await handleJoinViaLink({ projectId, userId, email, name }, databases, teams, log, error);
            return res.json(result);
        } catch (err) {
            error(`joinViaLink action error: ${err.message}`);
            return res.json({ error: err.message }, 500);
        }
    }

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

        const message = await messaging.createEmail(
            ID.unique(),
            subject,
            html, [], [userId], [], [], [], [],
            false,
            true
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