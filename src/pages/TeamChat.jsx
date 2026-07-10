import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMessages, usePresence } from "../hooks/useMessages";
import { useProject } from "../hooks/useProjects";
import { useUser } from "../context/UserContext";
import { relativeTime } from "../lib/format";

const CHANNEL = "general";

export default function TeamChat() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const user = useUser();
  const { project } = useProject(projectId);
  const {
    messages,
    pinnedMessages,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    sendMessage,
    togglePin,
    deleteMessage,
    getAttachmentUrl,
    setTyping,
    typingUsers,
  } = useMessages(projectId, CHANNEL);
  const { onlineUsers } = usePresence(projectId);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  function handleDraftChange(value) {
    setDraft(value);
    setTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => setTyping(false), 2500);
  }

  async function handleSend() {
    if (!draft.trim() && !attachment) return;
    setSending(true);
    setTyping(false);
    clearTimeout(typingTimeout.current);
    try {
      await sendMessage({ text: draft.trim(), attachment });
      setDraft("");
      setAttachment(null);
    } catch (err) {
      alert(err.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
    {/* Sidebar Navigation */}
    <aside className="w-sidebar-width h-screen fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant/10 flex flex-col py-6 px-4 z-50">
        <div className="mb-8 px-2 flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-xl" style={{fontVariationSettings: "'FILL' 1"}}>terminal</span>
            </div>
            <div className="flex flex-col">
                <h1 className="font-headline-md text-headline-md font-bold text-primary leading-none">DevRoom OS</h1>
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Engineering Workspace</span>
            </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
            <div className="px-2 mb-2">
                <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Main Modules</span>
            </div>
            <a className="flex items-center gap-3 px-3 py-2 bg-surface-container-highest text-primary font-medium rounded-lg cursor-pointer active:scale-95 duration-200 transition-colors">
                <span className="material-symbols-outlined text-lg" style={{fontVariationSettings: "'FILL' 1"}}>chat</span>
                <span className="font-body-sm text-body-sm">Chat</span>
            </a>
            <a onClick={() => navigate(`/project/${projectId}/ai`)} className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors rounded-lg cursor-pointer active:scale-95 duration-200">
                <span className="material-symbols-outlined text-lg">smart_toy</span>
                <span className="font-body-sm text-body-sm">AI Assistant</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors rounded-lg cursor-pointer active:scale-95 duration-200" href="#">
                <span className="material-symbols-outlined text-lg">description</span>
                <span className="font-body-sm text-body-sm">Docs</span>
            </a>
            <a onClick={() => navigate(`/project/${projectId}/resources`)} className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors rounded-lg cursor-pointer active:scale-95 duration-200">
                <span className="material-symbols-outlined text-lg">folder_open</span>
                <span className="font-body-sm text-body-sm">Resources</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors rounded-lg cursor-pointer active:scale-95 duration-200" href="#">
                <span className="material-symbols-outlined text-lg">send</span>
                <span className="font-body-sm text-body-sm">Submissions</span>
            </a>
            <div className="pt-6 px-2 mb-2">
                <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Active Threads</span>
            </div>
            <div className="space-y-0.5">
                <div className="flex items-center gap-2 px-3 py-1.5 text-on-surface-variant hover:text-primary transition-all cursor-pointer text-sm group">
                    <span className="text-outline group-hover:text-primary">#</span>
                    <span>frontend-core</span>
                </div>
                <div className="flex items-center justify-between px-3 py-1.5 bg-surface-variant/20 border-l-2 border-primary text-on-surface font-medium cursor-pointer text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-primary">#</span>
                        <span>sprint-planning</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(138,235,255,0.6)]"></div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 text-on-surface-variant hover:text-primary transition-all cursor-pointer text-sm group">
                    <span className="text-outline group-hover:text-primary">#</span>
                    <span>deployment-logs</span>
                </div>
            </div>
        </nav>
        <div className="mt-auto space-y-1">
            <a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors rounded-lg cursor-pointer active:scale-95 duration-200" href="#">
                <span className="material-symbols-outlined text-lg">settings</span>
                <span className="font-body-sm text-body-sm">Settings</span>
            </a>
            <div className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors rounded-lg cursor-pointer active:scale-95 duration-200">
                <span className="material-symbols-outlined text-lg">notifications</span>
                <span className="font-body-sm text-body-sm">Notifications</span>
                <span className="ml-auto bg-error text-on-error text-[10px] px-1.5 rounded-full font-bold">3</span>
            </div>
            <div className="pt-4 flex items-center gap-3 px-2">
                <img className="w-10 h-10 rounded-lg object-cover ring-1 ring-outline/20" data-alt="Close up portrait of a senior developer with glasses, cinematic lighting, ultra-detailed, 8k resolution, modern professional aesthetic, deep blacks and tech-focused background"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAefsNnQKIZ0GT4_HocMT70tdc02G1i4rQHmRlTS7WJMFZYBzY9c7O8s-aMq6HO2PHCtn0GdAT5j-26nKOYVNxMnV6NtGHpuXp_NBXsSPz8XBFvfwho7BVL1KioaY-KB2Ms9TjWUhRs0UI5Pr0gnbWrr3ZWpD_M8nFlwpcaYkHkqBgTIEx60UKBjSYTzba4Mk47u_w6l2ynbN0_pqo5hdt-xcjeiHnX-CDd7c5hl28QKPDD5ruROBHQ5-50Ut-_14lS2wFPXNVafJk"
                />
                <div className="flex flex-col overflow-hidden">
                    <span className="font-bold text-sm truncate">{user.name}</span>
                    <span className="text-[10px] text-primary">Senior Arch</span>
                </div>
            </div>
        </div>
    </aside>
    {/* Main Content Area */}
    <main className="ml-sidebar-width h-screen flex flex-col relative overflow-hidden bg-surface-container-lowest">
        {/* Top Navigation Bar */}
        <header className="flex justify-between items-center h-16 px-gutter bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 sticky top-0 z-40">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="font-label-caps text-label-caps text-on-surface-variant tracking-widest">{(project?.name || "PROJECT").toUpperCase()}</span>
                    <span className="text-outline-variant">/</span>
                    <span className="font-label-caps text-label-caps text-primary font-bold tracking-widest">#{CHANNEL.toUpperCase()}</span>
                </div>
                <div className="h-4 w-px bg-outline-variant/30"></div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">push_pin</span>
                    <span className="text-xs font-medium">{pinnedMessages.length} Pinned</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
                    </div>
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg pl-10 pr-4 py-1.5 text-xs w-64 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all" placeholder="Search messages..." type="text"
                    />
                    <div className="absolute right-3 top-1.5 px-1.5 py-0.5 rounded border border-outline-variant/50 text-[10px] text-on-surface-variant font-mono">⌘K</div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-all cursor-pointer">
<span className="material-symbols-outlined">account_tree</span>
</button>
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-all cursor-pointer">
<span className="material-symbols-outlined">cloud_done</span>
</button>
                </div>
            </div>
        </header>
        {/* Messaging Layout */}
        <section className="flex flex-1 overflow-hidden">
            {/* Message List */}
            <div ref={scrollRef} className="flex-1 flex flex-col overflow-y-auto pt-6 px-gutter bg-surface custom-scrollbar">
                {loading && <p className="text-sm text-on-surface-variant text-center">Loading messages…</p>}
                {!loading && error && <p className="text-sm text-error text-center">{error}</p>}
                {!loading && !error && messages.length === 0 && (
                  <p className="text-sm text-on-surface-variant text-center">No messages yet. Say hi 👋</p>
                )}
                <div className="space-y-6 pb-10">
{messages.map((msg) => {
  const isOwn = msg.authorId === user.$id;
  return (
    <div key={msg.$id} className="flex gap-4 group">
        <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center mt-1 text-xs font-bold text-primary flex-shrink-0">
          {(msg.authorName || "?").slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold text-sm">{msg.authorName}{isOwn ? " (you)" : ""}</span>
                <span className="text-[10px] text-outline-variant">{relativeTime(msg.$createdAt)}</span>
                {msg.pinned && <span className="material-symbols-outlined text-primary text-[14px]" style={{fontVariationSettings: "'FILL' 1"}}>push_pin</span>}
            </div>
            <div className="bg-surface-container/50 p-4 rounded-xl rounded-tl-none border border-outline-variant/10 message-gradient relative hover:border-outline-variant/30 transition-colors">
                {msg.text && <p className="text-on-surface leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>}
                {msg.attachmentFileId && (
                  <a href={getAttachmentUrl(msg.attachmentFileId)} target="_blank" rel="noreferrer" className="mt-3 bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 flex items-center gap-3 max-w-sm hover:border-secondary/50 cursor-pointer transition-all">
                      <div className="w-10 h-10 bg-secondary/10 rounded flex items-center justify-center">
                          <span className="material-symbols-outlined text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>description</span>
                      </div>
                      <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-bold truncate">{msg.attachmentName}</span>
                      </div>
                      <span className="material-symbols-outlined ml-auto text-on-surface-variant text-lg">download</span>
                  </a>
                )}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => togglePin(msg.$id)} title="Pin" className="p-1 text-on-surface-variant hover:text-primary">
                      <span className="material-symbols-outlined text-[16px]">push_pin</span>
                    </button>
                    {isOwn && (
                      <button onClick={() => deleteMessage(msg.$id)} title="Delete" className="p-1 text-on-surface-variant hover:text-error">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
})}
{typingUsers.length > 0 && (
  <p className="text-xs text-on-surface-variant italic pl-14">
    {typingUsers.map((t) => t.userName).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing…
  </p>
)}
                </div>
            </div>
            {/* Thread/Side Panel (Hidden on Mobile) */}
            <div className="hidden lg:flex flex-col w-80 bg-surface-container-low border-l border-outline-variant/10">
                <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
                    <h3 className="font-bold text-sm">Channel Info</h3>
                    <span className="material-symbols-outlined text-on-surface-variant text-lg">info</span>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div>
                        <span className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-3">Description</span>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{project?.description || "No description set for this project yet."}</p>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-3">Online Now ({onlineUsers.length})</span>
                        <div className="grid grid-cols-4 gap-2">
{onlineUsers.length === 0 && (
  <p className="text-[11px] text-on-surface-variant col-span-4">No one else is online right now.</p>
)}
{onlineUsers.map((u) => (
  <div key={u.$id} title={u.userName} className="w-full aspect-square rounded-lg bg-surface-container-highest flex items-center justify-center border border-outline-variant/10 group cursor-pointer overflow-hidden relative text-[10px] font-bold text-primary">
      {(u.userName || "?").slice(0, 2).toUpperCase()}
      <div className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-primary border border-surface"></div>
  </div>
))}
                        </div>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-3">Shared Links</span>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 group cursor-pointer">
                                <div className="p-1.5 bg-surface-variant rounded">
                                    <span className="material-symbols-outlined text-sm">link</span>
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-[11px] font-medium truncate">figma.com/file/alpha-ui...</span>
                                    <span className="text-[9px] text-outline-variant">Shared by Elena</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        {/* Message Input Bar */}
        <footer className="p-gutter pt-0 bg-surface">
            <div className="max-w-4xl mx-auto glass-panel-chat border border-outline-variant/20 rounded-2xl overflow-hidden shadow-2xl relative">
                {/* Action Bar */}
                <div className="px-4 py-2 flex items-center gap-2 border-b border-outline-variant/5 bg-surface-container-lowest/50">
                    <button className="p-1.5 text-on-surface-variant hover:text-primary transition-all rounded hover:bg-surface-variant/30">
<span className="material-symbols-outlined text-lg">format_bold</span>
</button>
                    <button className="p-1.5 text-on-surface-variant hover:text-primary transition-all rounded hover:bg-surface-variant/30">
<span className="material-symbols-outlined text-lg">format_italic</span>
</button>
                    <button className="p-1.5 text-on-surface-variant hover:text-primary transition-all rounded hover:bg-surface-variant/30">
<span className="material-symbols-outlined text-lg">code</span>
</button>
                    <div className="h-4 w-px bg-outline-variant/20 mx-1"></div>
                    <button onClick={() => fileInputRef.current?.click()} className={`p-1.5 transition-all rounded hover:bg-surface-variant/30 ${attachment ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}>
<span className="material-symbols-outlined text-lg">attach_file</span>
</button>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setAttachment(e.target.files[0] || null)} />
                    <button className="p-1.5 text-on-surface-variant hover:text-primary transition-all rounded hover:bg-surface-variant/30">
<span className="material-symbols-outlined text-lg">mood</span>
</button>
                </div>
                {attachment && (
                  <div className="px-4 pt-2 flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    {attachment.name}
                    <button onClick={() => setAttachment(null)} className="text-error hover:underline">remove</button>
                  </div>
                )}
                {/* Input Area */}
                <div className="p-4 flex items-end gap-3">
                    <textarea
                      value={draft}
                      onChange={(e) => handleDraftChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={() => setTyping(false)}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1 resize-none h-10 max-h-32 font-body-sm leading-relaxed" placeholder={`Message #${CHANNEL}...`} rows="1"></textarea>
                    <button onClick={handleSend} disabled={sending} className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:shadow-[0_0_15px_rgba(138,235,255,0.4)] active:scale-95 transition-all disabled:opacity-50">
<span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>send</span>
</button>
                </div>
            </div>
            <div className="text-center mt-3">
                <span className="text-[10px] text-outline-variant font-mono"><b>Return</b> to send • <b>Shift+Return</b> for new line</span>
            </div>
        </footer>
        {/* Command Palette Overlay (Hidden by Default, can be toggled) */}
        <div className="hidden fixed inset-0 z-[60] flex items-start justify-center pt-32 bg-background/60 backdrop-blur-sm" id="cmd-palette">
            <div className="w-full max-w-lg glass-panel-chat border border-primary/20 rounded-xl shadow-[0_0_40px_rgba(138,235,255,0.1)] overflow-hidden">
                <div className="p-4 flex items-center gap-3 border-b border-outline-variant/20">
                    <span className="material-symbols-outlined text-primary">terminal</span>
                    <input className="bg-transparent border-none focus:ring-0 flex-1 text-sm text-on-surface" placeholder="Run a command..." type="text" />
                </div>
                <div className="p-2 space-y-1">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-variant/30 border-l-2 border-primary group cursor-pointer">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-sm">person_search</span>
                            <span className="text-xs font-medium">Find user @dev...</span>
                        </div>
                        <span className="text-[10px] text-outline-variant font-mono">U</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-variant/30 group cursor-pointer transition-all">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-sm">history</span>
                            <span className="text-xs font-medium">Jump to recent threads</span>
                        </div>
                        <span className="text-[10px] text-outline-variant font-mono">J</span>
                    </div>
                </div>
            </div>
        </div>
    </main>
    </>
  );
}