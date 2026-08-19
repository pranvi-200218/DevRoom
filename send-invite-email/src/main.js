import {
    Client,
    Users,
    Messaging,
    Databases,
    Teams,
    Permission,
    Role,
    ID,
    Query
} from "node-appwrite";

const databaseId = "6a4f2d95001d70a443fb";
const projectsCollectionId = "projects";
const membersCollectionId = "members";
const activityCollectionId = "activity";
const notificationsCollectionId = "notifications";

async function logActivity(
    databases,
    projectId,
    type, { actorName, detail } = {},
    errorLog = console.warn
) {
    try {
        await databases.createDocument(
            databaseId,
            activityCollectionId,
            ID.unique(), {
                projectId,
                type,
                actorName: actorName || "Someone",
                detail: detail || "",
            }
        );
    } catch (err) {
        errorLog(`Failed to log activity: ${err.message}`);
    }
}

async function notifyUser(
    databases,
    userId, { type, message, projectId },
    errorLog = console.warn
) {
    try {
        await databases.createDocument(
            databaseId,
            notificationsCollectionId,
            ID.unique(), {
                userId,
                type,
                message,
                projectId: projectId || null,
                read: false,
            }, [
                Permission.read(Role.user(userId)),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ]
        );
    } catch (err) {
        errorLog(`Failed to notify ${userId}: ${err.message}`);
    }
}

async function handleJoinViaLink({ projectId, userId, email, name },
    databases,
    teams,
    log,
    error
) {
    const project = await databases.getDocument(
        databaseId,
        projectsCollectionId,
        projectId
    );

    if (!project.teamId) {
        throw new Error(
            `Project ${projectId} has no teamId. Run the Teams migration first.`
        );
    }

    const existing = await databases.listDocuments(
        databaseId,
        membersCollectionId, [
            Query.equal("projectId", projectId),
            Query.equal("userId", userId),
            Query.limit(1),
        ]
    );

    if (
        existing.documents.length > 0 &&
        existing.documents[0].status === "active"
    ) {
        log(`${email} is already an active member of ${projectId}`);
        return { alreadyMember: true };
    }

    const role = "Viewer";

    const childPermissions = [
        Permission.read(Role.team(project.teamId)),
        Permission.update(Role.team(project.teamId)),
        Permission.delete(Role.team(project.teamId)),
    ];

    await teams.createMembership(
        project.teamId, [teamRoleFor(role)],
        undefined,
        userId
    );

    if (existing.documents.length > 0) {
        await databases.updateDocument(
            databaseId,
            membersCollectionId,
            existing.documents[0].$id, {
                userId,
                status: "active",
            }
        );
    } else {
        await databases.createDocument(
            databaseId,
            membersCollectionId,
            ID.unique(), {
                projectId,
                userId,
                email,
                name: name || email.split("@")[0],
                role,
                status: "active",
                invitedBy: null,
            },
            childPermissions
        );
    }

    await logActivity(
        databases,
        projectId,
        "member_joined", { actorName: name || email },
        error
    );

    await notifyUser(
        databases,
        userId, {
            type: "invited",
            message: `You joined "${project.name}" as ${role}`,
            projectId,
        },
        error
    );

    if (project.ownerId) {
        await notifyUser(
            databases,
            project.ownerId, {
                type: "invited",
                message: `${name || email} joined "${project.name}" via invite link`,
                projectId,
            },
            error
        );
    }

    log(`${email} joined ${projectId} via invite link as ${role}`);

    return { joined: true, role };
}

function teamRoleFor(memberRole) {
    if (memberRole === "Owner") return "owner";
    if (memberRole === "Editor") return "editor";
    return "viewer";
}

async function handleLink({ userId, email },
    databases,
    teams,
    log,
    error
) {
    const pending = await databases.listDocuments(
        databaseId,
        membersCollectionId, [
            Query.equal("email", email),
            Query.equal("status", "pending"),
            Query.limit(50),
        ]
    );

    let linkedCount = 0;

    for (const invite of pending.documents) {
        try {
            const project = await databases.getDocument(
                databaseId,
                projectsCollectionId,
                invite.projectId
            );

            if (!project.teamId) {
                error(
                    `Project ${invite.projectId} has no teamId — skipping team membership for ${email}. Run the Teams migration.`
                );
                continue;
            }

            await teams.createMembership(
                project.teamId, [teamRoleFor(invite.role)],
                undefined,
                userId
            );

            await databases.updateDocument(
                databaseId,
                membersCollectionId,
                invite.$id, {
                    userId,
                    status: "active",
                }
            );

            await logActivity(
                databases,
                invite.projectId,
                "member_joined", { actorName: email },
                error
            );

            await notifyUser(
                databases,
                userId, {
                    type: "invited",
                    message: `You joined "${project.name}" as ${invite.role}`,
                    projectId: invite.projectId,
                },
                error
            );

            linkedCount++;
        } catch (err) {
            error(
                `Could not link ${email} to project ${invite.projectId}: ${err.message}`
            );
        }
    }

    log(`Linked ${linkedCount} invite(s) for ${email}`);

    return { linked: linkedCount };
}

async function handleUpdateMemberRole({ projectId, userId, role },
    databases,
    teams,
    log
) {
    const project = await databases.getDocument(
        databaseId,
        projectsCollectionId,
        projectId
    );

    if (!project.teamId) {
        throw new Error(`Project ${projectId} has no teamId.`);
    }

    const memberships = await teams.listMemberships(
        project.teamId, [Query.equal("userId", userId)]
    );

    if (memberships.memberships.length === 0) {
        throw new Error(
            `${userId} is not a member of this project's team.`
        );
    }

    await teams.updateMembership(
        project.teamId,
        memberships.memberships[0].$id, [teamRoleFor(role)]
    );

    await notifyUser(databases, userId, {
        type: "role_changed",
        message: `Your role in "${project.name}" changed to ${role}`,
        projectId,
    });

    log(
        `Updated ${userId}'s team role to ${teamRoleFor(
      role
    )} for project ${projectId}`
    );

    return { success: true };
}

async function handleRemoveMember({ projectId, userId },
    databases,
    teams,
    log
) {
    const project = await databases.getDocument(
        databaseId,
        projectsCollectionId,
        projectId
    );

    if (!project.teamId) {
        throw new Error(`Project ${projectId} has no teamId.`);
    }

    const memberships = await teams.listMemberships(
        project.teamId, [Query.equal("userId", userId)]
    );

    if (memberships.memberships.length > 0) {
        await teams.deleteMembership(
            project.teamId,
            memberships.memberships[0].$id
        );
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

    const apiKey =
        req.headers["x-appwrite-key"] ||
        process.env.APPWRITE_API_KEY ||
        "";

    if (!apiKey) {
        error(
            "No API key available (dynamic key header missing and APPWRITE_API_KEY not set)."
        );

        return res.json({ error: "Server misconfiguration: missing API key." },
            500
        );
    }

    const client = new Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(apiKey);

    if (body.action === "joinViaLink") {
        const { projectId, userId, email, name } = body;

        if (!projectId || !userId || !email) {
            return res.json({ error: "Missing projectId, userId, or email." },
                400
            );
        }

        try {
            const databases = new Databases(client);
            const teams = new Teams(client);

            const result = await handleJoinViaLink({ projectId, userId, email, name },
                databases,
                teams,
                log,
                error
            );

            return res.json(result);
        } catch (err) {
            error(`joinViaLink action error: ${err.message}`);
            return res.json({ error: err.message }, 500);
        }
    }

    if (body.action === "link") {
        const { userId, email } = body;

        if (!userId || !email) {
            return res.json({ error: "Missing userId or email." },
                400
            );
        }

        try {
            const databases = new Databases(client);
            const teams = new Teams(client);

            const result = await handleLink({ userId, email },
                databases,
                teams,
                log,
                error
            );

            return res.json(result);
        } catch (err) {
            error(`link action error: ${err.message}`);
            return res.json({ error: err.message }, 500);
        }
    }

    if (body.action === "updateMemberRole") {
        const { projectId, userId, role } = body;

        if (!projectId || !userId || !role) {
            return res.json({ error: "Missing projectId, userId, or role." },
                400
            );
        }

        try {
            const databases = new Databases(client);
            const teams = new Teams(client);

            const result = await handleUpdateMemberRole({ projectId, userId, role },
                databases,
                teams,
                log
            );

            return res.json(result);
        } catch (err) {
            error(`updateMemberRole action error: ${err.message}`);
            return res.json({ error: err.message }, 500);
        }
    }

    if (body.action === "removeMember") {
        const { projectId, userId } = body;

        if (!projectId || !userId) {
            return res.json({ error: "Missing projectId or userId." },
                400
            );
        }

        try {
            const databases = new Databases(client);
            const teams = new Teams(client);

            const result = await handleRemoveMember({ projectId, userId },
                databases,
                teams,
                log
            );

            return res.json(result);
        } catch (err) {
            error(`removeMember action error: ${err.message}`);
            return res.json({ error: err.message }, 500);
        }
    }

    // ---------------------------------------------------------
    // SEND INVITE EMAIL
    // ---------------------------------------------------------

    const {
        to,
        role = "Viewer",
        projectName = "a DevRoom OS project",
        inviterName = "Someone",
    } = body;

    if (!to || typeof to !== "string") {
        return res.json({ error: "Missing 'to' email address." },
            400
        );
    }

    log(
        `Inviting ${to} as ${role} to "${projectName}" (invited by ${inviterName})`
    );

    const users = new Users(client);
    const messaging = new Messaging(client);

    try {
        let userId;

        const existing = await users.list([
            Query.equal("email", to),
        ]);

        if (existing.total > 0) {
            userId = existing.users[0].$id;

            log(`Found existing user ${userId} for ${to}`);
        } else {
            const created = await users.create(
                ID.unique(),
                to
            );

            userId = created.$id;

            log(`Created new user ${userId} for ${to}`);
        }

        // ---------------------------------------------------------
        // EMAIL SUBJECT
        // ---------------------------------------------------------

        const subject = `You're invited to ${projectName} on DevRoom`;

        // ---------------------------------------------------------
        // EMAIL HTML
        // ---------------------------------------------------------

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>DevRoom Invitation</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#090d16;
  font-family:Arial,Helvetica,sans-serif;
  color:#eef4fa;
">

  <div style="
    max-width:560px;
    margin:0 auto;
    padding:40px 20px;
  ">

    <!-- DEVROOM BRAND -->

    <div style="
      text-align:center;
      margin-bottom:28px;
    ">

      <div style="
        display:inline-block;
        color:#61d9f2;
        font-size:25px;
        font-weight:700;
        letter-spacing:-0.5px;
      ">
        DevRoom
      </div>

      <div style="
        color:#5f6d80;
        font-size:10px;
        margin-top:7px;
        letter-spacing:1.8px;
      ">
        COLLABORATE. BUILD. SHIP.
      </div>

    </div>


    <!-- MAIN CARD -->

    <div style="
      background:#141b29;
      border:1px solid rgba(180,205,230,0.13);
      border-radius:14px;
      padding:34px;
    ">

      <!-- BADGE -->

      <div style="
        display:inline-block;
        padding:7px 11px;
        border-radius:7px;
        background:rgba(97,217,242,0.09);
        border:1px solid rgba(97,217,242,0.18);
        color:#61d9f2;
        font-size:10px;
        font-weight:600;
        letter-spacing:0.9px;
        margin-bottom:18px;
      ">
        PROJECT INVITATION
      </div>


      <!-- HEADING -->

      <h1 style="
        margin:0 0 14px;
        font-size:26px;
        line-height:1.25;
        color:#eef4fa;
      ">
        You're invited to DevRoom.
      </h1>


      <!-- INVITATION TEXT -->

      <p style="
        margin:0 0 22px;
        color:#94a2b5;
        font-size:15px;
        line-height:1.7;
      ">

        <strong style="color:#eef4fa;">
          ${escapeHtml(inviterName)}
        </strong>

        invited you to join

        <strong style="color:#61d9f2;">
          ${escapeHtml(projectName)}
        </strong>

        as

        <strong style="color:#eef4fa;">
          ${escapeHtml(role)}
        </strong>.

      </p>


      <!-- PROJECT INFO -->

      <div style="
        background:#0d1320;
        border:1px solid rgba(180,205,230,0.09);
        border-radius:10px;
        padding:16px 18px;
        margin-bottom:26px;
      ">

        <div style="
          color:#5f6d80;
          font-size:10px;
          letter-spacing:1px;
          margin-bottom:7px;
        ">
          PROJECT
        </div>

        <div style="
          color:#eef4fa;
          font-size:15px;
          font-weight:600;
        ">
          ${escapeHtml(projectName)}
        </div>

        <div style="
          color:#77849a;
          font-size:12px;
          margin-top:8px;
        ">
          Role: ${escapeHtml(role)}
        </div>

      </div>


      <!-- DESCRIPTION -->

      <p style="
        color:#94a2b5;
        font-size:14px;
        line-height:1.7;
        margin:0 0 24px;
      ">
        DevRoom brings your team's conversations,
        resources, AI workspace and project work
        together in one place.
      </p>


      <!-- CTA -->

      <div style="
        text-align:center;
        margin:28px 0 24px;
      ">

        <a
          href="https://devroom-zeta.vercel.app/"
          style="
            display:inline-block;
            padding:13px 22px;
            background:#61d9f2;
            color:#071019;
            text-decoration:none;
            border-radius:9px;
            font-size:14px;
            font-weight:700;
          "
        >
          Open DevRoom →
        </a>

      </div>


      <!-- ACCOUNT INFO -->

      <p style="
        color:#5f6d80;
        font-size:11px;
        line-height:1.6;
        text-align:center;
        margin:0;
      ">

        Sign in using this email address
        to access your invitation:

        <br />

        <span style="color:#77849a;">
          ${escapeHtml(to)}
        </span>

      </p>

    </div>


    <!-- FOOTER -->

    <div style="
      text-align:center;
      padding:24px 10px;
      color:#4f5b6d;
      font-size:11px;
      line-height:1.6;
    ">

      DevRoom OS
      <br />

      Built for teams that build together.

    </div>

  </div>

</body>
</html>
`;

        // ---------------------------------------------------------
        // SEND EMAIL
        // ---------------------------------------------------------

        const message = await messaging.createEmail(
            ID.unique(),
            subject,
            html, [], [userId], [], [], [], [],
            false,
            true
        );

        log(
            `Messaging.createEmail returned message ${message.$id} with status: ${message.status}`
        );

        return res.json({
            success: true,
            messageId: message.$id,
            status: message.status,
        });

    } catch (err) {

        error(
            `Failed to send invite email: ${err.message}`
        );

        return res.json({
                error: err.message ||
                    "Failed to send invite email.",
            },
            500
        );
    }
};


// ---------------------------------------------------------
// HTML ESCAPE
// ---------------------------------------------------------

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}