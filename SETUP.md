# DevRoom OS — Setup

## Install

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Without a `.env`, every page runs against
placeholder Appwrite IDs — you'll see loading states fall back to
"Failed to fetch" / empty states everywhere. That's expected until you
connect a real project (below).

## Connect Appwrite

1. Create a project at [cloud.appwrite.io](https://cloud.appwrite.io) (or point at a self-hosted instance).
2. Create a database. Note its **Database ID**.
3. Copy `.env.example` to `.env` and fill in your endpoint/project ID/database ID.
4. Create the collections and buckets below. **Permissions**: since auth is
   intentionally skipped, set every collection/bucket's Read/Create/Update/Delete
   permissions to **Any**. Insecure by design — fine for local dev, not for
   production. Swap for per-user permissions once real auth exists.

### Collections

| Collection ID | Attributes |
|---|---|
| `projects` | `name` (string, req), `description` (string), `icon` (string), `status` (string), `pinned` (bool), `ownerId` (string) |
| `members` | `projectId` (string, req), `userId` (string), `email` (string, req), `name` (string), `role` (string), `status` (string), `invitedBy` (string) |
| `folders` | `projectId` (string, req), `name` (string, req), `parentId` (string, nullable) |
| `files` | `projectId` (string, req), `folderId` (string, nullable), `name` (string, req), `storageFileId` (string, req), `mimeType` (string), `size` (integer), `uploadedBy` (string) |
| `messages` | `projectId` (string, req), `channelId` (string, req), `authorId` (string), `authorName` (string), `authorAvatar` (string), `text` (string, size 5000), `replyToId` (string, nullable), `pinned` (bool), `attachmentFileId` (string, nullable), `attachmentName` (string, nullable) |
| `typing` | `projectId` (string, req), `channelId` (string, req), `userId` (string, req), `userName` (string) |
| `presence` | `projectId` (string, req), `userId` (string, req), `userName` (string), `avatarUrl` (string) |
| `ai_messages` | `projectId` (string, req), `room` (string, req), `role` (string, req), `content` (string, size 20000), `pinned` (bool), `authorId` (string) |

For `messages` and `ai_messages`, enable **Realtime** on the collection
(default-on for Appwrite Cloud) — Team Chat subscribes to it live.

### Storage buckets

| Bucket ID | Used by |
|---|---|
| `resources` | Resource Vault file uploads |
| `chat-attachments` | Team Chat file attachments |

### Deploy the AI Workspace function

The frontend can't call Anthropic directly — that would leak your API key.
`functions/ai-chat/` is a ready-to-deploy Appwrite Function that proxies the
call server-side.

1. In the Appwrite console: Functions → Create Function → Node.js runtime.
2. Deploy `functions/ai-chat/` (via the console's manual upload, or the
   [Appwrite CLI](https://appwrite.io/docs/tooling/command-line/installation): `appwrite deploy function`).
3. Set an environment variable on the function: `ANTHROPIC_API_KEY` = your real key.
4. Note the function's **Function ID** and put it in `.env` as `VITE_APPWRITE_AI_CHAT_FUNCTION_ID`.
5. Grant the function's execute permission to **Any** (same caveat as above — no auth yet).

Fill in the rest of `.env` (copy from `.env.example`) with your real IDs, then restart `npm run dev`.

## What's wired up

- **Home** — fetch/create/edit/delete/search/pin projects.
- **Project Workspace** — fetches the real project by ID, "Project not found" fallback. AI Workspace / Resource Vault quick-links navigate to real routes.
- **Member Management** — invite (creates a pending record), change role, remove, resend invite.
- **Resource Vault** — folders, file upload/delete via Appwrite Storage, search, human-readable file sizes, image previews.
- **Team Chat** — realtime send/receive via Appwrite Realtime, pin, delete own messages, search, file attachments, a working typing indicator (polled, not a true push subscription) and online-users presence (heartbeat-based).
- **AI Workspace** — all 6 rooms, conversation history per room, markdown + code-block rendering, pin, search, calls the `ai-chat` Appwrite Function for real Claude responses.

## What's still static

- Multi-channel chat (sidebar shows `frontend-core` / `sprint-planning` / `deployment-logs` as static threads) — only the single `general` channel is functional.
- Message reply-threading UI, reactions, GitHub bot messages — visual only.
- Sprint progress, commit velocity, activity feed on the Project Dashboard.
- Token usage %, "Knowledge Base" bento cards, "Explore Library" on AI Workspace — decorative, no backing schema.
- Prompt Library, Documents, Project Links, Universal Search, Activity Timeline, Notifications, Submission Center, Presentation Studio, Architecture Canvas, Whiteboard, GitHub Integration — not built (no UI existed for most of these in the original mockups either).

## Auth

Skipped entirely per spec. `src/context/UserContext.jsx` provides a single
hardcoded mock user (`Alex Rivera`) used as the author/owner on everything created.
