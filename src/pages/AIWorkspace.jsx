import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useAIChat, AI_ROOMS } from "../hooks/useAIChat";
import { useProject } from "../hooks/useProjects";
import { useMembers } from "../hooks/useMembers";
import { useResources } from "../hooks/useResources";
import { useUser } from "../context/UserContext";
import { relativeTime, fileVisual } from "../lib/format";
import NotificationBell from "../components/NotificationBell";
import { mi } from "../lib/icons";
const ROOM_DOTS = {
  frontend: "bg-cyan-400",
  backend: "bg-purple-400",
  "ui-ux": "bg-orange-400",
  research: "bg-green-400",
  documentation: "bg-blue-400",
  presentation: "bg-pink-400",
};

const STARTER_PROMPTS = [
  "Explain the architecture of this project in a few sentences.",
  "Suggest a folder structure for a new feature module.",
];

function initials(nameOrEmail) {
  const base = nameOrEmail || "?";
  const parts = base.split(/[@\s._-]+/).filter(Boolean);
  return (
    (parts[0]?.[0] || "?").toUpperCase() + (parts[1]?.[0] || "").toUpperCase()
  );
}

export default function AIWorkspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(AI_ROOMS[0].id);
  const currentUser = useUser();
  const { project } = useProject(projectId);
  const { activeMembers } = useMembers(projectId);
  const { files } = useResources(projectId);
  const {
    messages,
    pinnedMessages,
    loading,
    sending,
    error,
    searchTerm,
    setSearchTerm,
    sendPrompt,
    togglePin,
  } = useAIChat(projectId, room);

  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, sending]);

  async function handleSend(promptOverride) {
    const prompt = (promptOverride ?? draft).trim();
    if (!prompt || sending) return;
    setDraft("");
    try {
      await sendPrompt(prompt);
    } catch {
      // error state is already surfaced via the hook's `error`
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const activeRoom = AI_ROOMS.find((r) => r.id === room);
  const pinnedPrompts = pinnedMessages.filter((m) => m.role === "user");

  return (
    <>
      {/* Background Decoration */}

      {/* SideNavBar (Shared Component Identity) */}
      <aside className="w-sidebar-width h-screen fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant/10 flex flex-col py-6 px-4 z-50">
        <div className="mb-10 px-2">
          <h1 className="font-headline-md text-headline-md font-extrabold text-primary tracking-tighter">
            DevRoom OS
          </h1>
          <p className="text-on-surface-variant font-label-caps text-[10px] tracking-widest mt-1">
            ENGINEERING WORKSPACE
          </p>
        </div>
        <nav className="flex-1 space-y-1 custom-scrollbar overflow-y-auto">
          <div className="mb-6">
            <p className="px-2 mb-2 text-[10px] font-bold text-outline uppercase tracking-widest">
              Core
            </p>
            <a
              onClick={() => navigate(`/project/${projectId}/chat`)}
              className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors cursor-pointer active:scale-95 duration-200"
            >
              <i className={`${mi("chat")} text-[20px]`} />
              <span>Chat</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2 bg-surface-container-highest text-primary font-medium rounded-lg cursor-pointer transition-all active:scale-95 duration-200">
              <i className={`${mi("smart_toy")} text-[20px]`} />
              <span>AI Assistant</span>
            </a>
            <a
              onClick={() => navigate(`/project/${projectId}/resources`)}
              className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors cursor-pointer active:scale-95 duration-200"
            >
              <i className={`${mi("folder_open")} text-[20px]`} />
              <span>Resources</span>
            </a>
          </div>
          <div className="mb-6">
            <p className="px-2 mb-2 text-[10px] font-bold text-outline uppercase tracking-widest">
              AI Rooms
            </p>
            <div className="space-y-1">
              {AI_ROOMS.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setRoom(r.id)}
                  className={`relative flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer group transition-colors ${
                    room === r.id
                      ? "text-on-surface bg-surface-variant/20"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/20"
                  }`}
                >
                  <div
                    className={`active-tab-indicator ${room === r.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  ></div>
                  <span
                    className={`w-2 h-2 rounded-full ${ROOM_DOTS[r.id] || "bg-cyan-400"}`}
                  ></span>
                  <span>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </nav>
        <div className="pt-6 border-t border-outline-variant/10 space-y-1">
          <a
            onClick={() => navigate(`/project/${projectId}/settings`)}
            className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 rounded-lg transition-colors cursor-pointer"
          >
            <i className={`${mi("settings")} text-[20px]`} />
            <span>Settings</span>
          </a>
          <div className="flex items-center gap-3 px-3 py-3 mt-4 glass-panel-ai rounded-xl">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20">
              <img
                className="w-full h-full object-cover"
                alt={currentUser.name}
                src={currentUser.avatarUrl}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{currentUser.name}</p>
              <p className="text-[10px] text-primary/70 uppercase">
                {currentUser.tier}
              </p>
            </div>
          </div>
        </div>
      </aside>
      {/* TopNavBar (Shared Component Identity) */}
      <header className="ml-sidebar-width h-16 px-gutter flex justify-between items-center sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant font-label-caps text-label-caps uppercase">
              Workspace
            </span>
            <i className={`${mi("chevron_right")} text-[16px] text-outline`} />
            <span className="text-primary font-bold font-label-caps text-label-caps uppercase">
              {activeRoom?.label} Room
            </span>
          </div>
          <div className="h-4 w-[1px] bg-outline-variant/30"></div>
          <div className="flex items-center gap-4">
            <span className="text-primary font-bold font-label-caps text-label-caps cursor-pointer">
              {project?.name || "Project"}
            </span>
            <span className="text-on-surface-variant font-label-caps text-label-caps cursor-pointer hover:text-primary transition-all">
              {project ? `Updated ${relativeTime(project.$updatedAt)}` : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <div className="relative group">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant/20 rounded-full py-1.5 pl-9 pr-4 text-xs w-64 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              placeholder="Search this conversation..."
              type="text"
            />
            <i className={`${mi("search")} absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-outline group-focus-within:text-primary`} />
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 flex items-center justify-center text-outline-variant/50 hover:text-primary transition-colors"
            title="Back to Projects"
          >
            <i className={mi("account_tree")} />
          </button>
          <i
            className={`${mi(error ? "cloud_off" : loading || sending ? "cloud_sync" : "cloud_done")} w-10 h-10 flex items-center justify-center ${error ? "text-error" : loading || sending ? "text-outline-variant" : "text-primary/60"}`}
            title={
              error
                ? "Sync failed"
                : loading
                  ? "Loading…"
                  : sending
                    ? "Sending…"
                    : "All changes saved"
            }
          />
        </div>
      </header>
      {/* Main Workspace Layout */}
      <main className="ml-sidebar-width h-[calc(100vh-64px)] flex">
        {/* Center: AI Conversation Area */}
        <section className="flex-1 flex flex-col min-w-0 bg-surface-container-lowest relative">
          <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar space-y-10">
            {loading && (
              <p className="text-sm text-on-surface-variant text-center">
                Loading conversation…
              </p>
            )}
            {!loading && error && (
              <p className="text-sm text-error text-center max-w-2xl mx-auto">
                {error}
              </p>
            )}
            {!loading && messages.length === 0 && !error && (
              <div className="max-w-2xl mx-auto text-center space-y-6 py-10">
                <p className="text-on-surface-variant text-sm">
                  Start a conversation in the {activeRoom?.label} room.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {STARTER_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSend(p)}
                      className="glass-panel-ai p-4 rounded-xl border border-primary/10 hover:border-primary/40 text-left text-sm text-on-surface-variant hover:text-on-surface transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg) =>
              msg.role === "user" ? (
                <div
                  key={msg.$id}
                  className="max-w-3xl mx-auto w-full flex flex-col items-end"
                >
                  <div className="glass-panel-ai p-5 rounded-2xl rounded-tr-none border-l-4 border-l-primary max-w-[90%] relative group">
                    <p className="text-body-lg font-body-lg text-on-surface whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                    <button
                      onClick={() => togglePin(msg.$id)}
                      className={`absolute -top-2 -left-2 w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center transition-opacity ${msg.pinned ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-primary"}`}
                    >
                      <i className={`${mi("push_pin")} text-[14px]`} />
                    </button>
                  </div>
                  <span className="text-[10px] text-outline mt-2 font-label-caps">
                    SENT
                  </span>
                </div>
              ) : (
                <div
                  key={msg.$id}
                  className="max-w-4xl mx-auto w-full space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/40 shadow-[0_0_15px_rgba(138,235,255,0.2)]">
                      <i className={`${mi("smart_toy")} text-primary text-[20px]`} />
                    </div>
                    <div className="flex-1 space-y-4 min-w-0">
                      <div className="prose prose-invert max-w-none text-body-lg font-body-lg leading-relaxed text-on-surface-variant">
                        <ReactMarkdown
                          components={{
                            code({ inline, className, children, ...props }) {
                              if (inline) {
                                return (
                                  <code
                                    className="text-primary bg-primary/10 px-1 rounded"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              }
                              return (
                                <div className="rounded-xl overflow-hidden border border-outline-variant/20 bg-[#0B0D12] code-glow my-3">
                                  <pre className="p-5 overflow-x-auto font-code-sm text-code-sm leading-relaxed text-on-surface">
                                    <code>{children}</code>
                                  </pre>
                                </div>
                              );
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => togglePin(msg.$id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[12px] ${msg.pinned ? "border-primary/50 text-primary bg-primary/5" : "border-outline-variant/30 hover:bg-primary/5 hover:border-primary/50 text-outline hover:text-primary"}`}
                        >
                          <i className={`${mi("push_pin")} text-[16px]`} />
                          {msg.pinned ? "Pinned" : "Pin"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ),
            )}
            {sending && (
              <div className="max-w-4xl mx-auto w-full flex items-center gap-4 text-on-surface-variant text-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/40 animate-pulse">
                  <i className={`${mi("smart_toy")} text-primary text-[20px]`} />
                </div>
                Thinking…
              </div>
            )}
            <div ref={scrollRef} />
          </div>
          {/* Input Area */}
          <div className="p-gutter pt-0">
            <div className="max-w-4xl mx-auto glass-panel-ai rounded-2xl p-2 border border-outline-variant/20 shadow-2xl">
              <div className="flex items-end gap-2 p-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-body-lg resize-none py-3 custom-scrollbar max-h-48"
                  placeholder="Type your command..."
                  rows="1"
                ></textarea>
                <div className="flex items-center gap-2 mb-1 mr-1">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-highest/50 border border-outline-variant/30 text-[10px] text-outline font-mono">
                    <span>Claude</span>
                  </div>
                  <button
                    onClick={() => handleSend()}
                    disabled={sending}
                    className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center hover:shadow-[0_0_20px_rgba(138,235,255,0.4)] transition-all active:scale-95 disabled:opacity-50"
                  >
                    <i className={mi("send")} />
                  </button>
                </div>
              </div>
            </div>
            <div className="max-w-4xl mx-auto flex justify-center mt-2">
              <p className="text-[10px] text-outline uppercase tracking-[0.2em]">
                DevRoom Engine v2.4.1 • Low Latency Mode
              </p>
            </div>
          </div>
        </section>
        {/* Right: Context Panel */}
        <aside className="w-[320px] h-full border-l border-outline-variant/10 bg-surface-container-low flex flex-col hidden lg:flex">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            {/* Pinned Prompts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <i className={`${mi("push_pin")} text-primary text-[18px]`} />
                  <h3 className="font-bold text-[11px] uppercase tracking-widest text-on-surface">
                    Pinned Prompts
                  </h3>
                </div>
                <span className="text-[10px] text-outline font-mono">
                  {String(pinnedPrompts.length).padStart(2, "0")}
                </span>
              </div>
              <div className="space-y-3">
                {pinnedPrompts.length === 0 && (
                  <p className="text-xs text-on-surface-variant">
                    Pin a prompt from the conversation to see it here.
                  </p>
                )}
                {pinnedPrompts.map((p) => (
                  <div
                    key={p.$id}
                    className="p-3 rounded-xl bg-surface-container/50 border border-outline-variant/10 hover:border-primary/20 transition-all cursor-pointer group"
                    onClick={() => setDraft(p.content)}
                  >
                    <p className="text-xs text-on-surface-variant group-hover:text-on-surface line-clamp-2">
                      "{p.content}"
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[9px] text-outline px-1.5 py-0.5 rounded bg-surface-variant/30">
                        {activeRoom?.label?.toUpperCase()}
                      </span>
                      <i className={`${mi("open_in_new")} text-[14px] text-outline opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Recent Files */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <i className={`${mi("bookmark")} text-primary text-[18px]`} />
                  <h3 className="font-bold text-[11px] uppercase tracking-widest text-on-surface">
                    Recent Files
                  </h3>
                </div>
                <span className="text-[10px] text-outline font-mono">
                  {files.length}
                </span>
              </div>
              <div className="space-y-2">
                {files.length === 0 && (
                  <div className="p-3 rounded-xl bg-surface-container/50 border border-outline-variant/10 text-center">
                    <p className="text-xs text-on-surface-variant mb-2">
                      No files uploaded yet.
                    </p>
                    <button
                      onClick={() =>
                        navigate(`/project/${projectId}/resources`)
                      }
                      className="text-primary text-[11px] font-bold hover:underline"
                    >
                      Upload one
                    </button>
                  </div>
                )}
                {files.slice(0, 4).map((f) => {
                  const { icon, color } = fileVisual(f.mimeType || "");
                  return (
                    <div
                      key={f.$id}
                      onClick={() =>
                        navigate(`/project/${projectId}/resources`)
                      }
                      className="p-3 rounded-xl bg-surface-container/50 border border-outline-variant/10 flex items-center gap-3 hover:bg-surface-variant/30 transition-colors cursor-pointer"
                    >
                      <i className={`${mi(icon)} text-[18px] ${color || "text-cyan-400"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium leading-tight truncate">
                          {f.name}
                        </p>
                        <p className="text-[9px] text-outline">
                          {relativeTime(f.$createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Footer Meta */}
          <div className="p-6 border-t border-outline-variant/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {activeMembers.slice(0, 3).map((m) => (
                  <div
                    key={m.$id}
                    title={m.name || m.email}
                    className="w-6 h-6 rounded-full border-2 border-surface-container-low bg-surface-variant flex items-center justify-center text-[8px] font-bold text-primary overflow-hidden"
                  >
                    {initials(m.name || m.email)}
                  </div>
                ))}
                {activeMembers.length > 3 && (
                  <div className="w-6 h-6 rounded-full border-2 border-surface-container-low bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                    +{activeMembers.length - 3}
                  </div>
                )}
                {activeMembers.length === 0 && (
                  <span className="text-[10px] text-outline">
                    No members yet
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate(`/project/${projectId}/members`)}
                className="text-[10px] text-outline uppercase font-medium hover:text-primary transition-colors"
              >
                Collaborators
              </button>
            </div>
          </div>
        </aside>
      </main>
    </>
  );
}