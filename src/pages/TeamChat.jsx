import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import usePageEntrance from "../hooks/usePageEntrance";
import { useToast } from "../components/Toast";
import { useMessages, usePresence } from "../hooks/useMessages";
import { useProject } from "../hooks/useProjects";
import { useUser } from "../context/UserContext";
import { relativeTime } from "../lib/format";
import { mi } from "../lib/icons";
import Loader from "../components/Loader";

const CHANNEL = "general";
const QUICK_EMOJIS = [
  { emoji: "😀", icon: "fa-regular fa-face-smile" },
  { emoji: "👍", icon: "fa-solid fa-thumbs-up" },
  { emoji: "🎉", icon: "fa-solid fa-champagne-glasses" },
  { emoji: "🚀", icon: "fa-solid fa-rocket" },
  { emoji: "❤️", icon: "fa-solid fa-heart" },
  { emoji: "👀", icon: "fa-solid fa-eye" },
  { emoji: "🔥", icon: "fa-solid fa-fire" },
  { emoji: "✅", icon: "fa-solid fa-circle-check" },
];
const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

export default function TeamChat() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const user = useUser();
  const { project } = useProject(projectId);
  usePageEntrance();
  const toast = useToast();
  const seenMsgIds = useRef(new Set());
  const messageListRef = useRef(null);
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
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const typingTimeout = useRef(null);
  const textareaRef = useRef(null);
  const emojiRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setEmojiOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleMessages = showPinnedOnly ? pinnedMessages : messages;

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!messageListRef.current) return;
    const fresh = [];
    visibleMessages.forEach((msg) => {
      if (!seenMsgIds.current.has(msg.$id)) {
        seenMsgIds.current.add(msg.$id);
        const el = messageListRef.current.querySelector(`[data-msg-id="${msg.$id}"]`);
        if (el) fresh.push(el);
      }
    });
    if (fresh.length) {
      gsap.fromTo(fresh, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: "power2.out" });
    }
  }, [visibleMessages]);

  const sharedLinks = useMemo(() => {
    const found = [];
    const seen = new Set();
    for (let i = messages.length - 1; i >= 0 && found.length < 5; i--) {
      const msg = messages[i];
      const matches = msg.text ? msg.text.match(URL_REGEX) : null;
      if (!matches) continue;
      for (const url of matches) {
        if (seen.has(url)) continue;
        seen.add(url);
        found.push({ url, authorName: msg.authorName, id: `${msg.$id}-${url}` });
        if (found.length >= 5) break;
      }
    }
    return found;
  }, [messages]);

  function handleDraftChange(value) {
    setDraft(value);
    setTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => setTyping(false), 2500);
  }

  function wrapSelection(marker) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = draft.slice(0, start);
    const selected = draft.slice(start, end);
    const after = draft.slice(end);
    const next = `${before}${marker}${selected || "text"}${marker}${after}`;
    handleDraftChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = selected ? end + marker.length * 2 : start + marker.length;
      el.setSelectionRange(cursor, cursor + (selected ? 0 : 4));
    });
  }

  function insertEmoji(emoji) {
    handleDraftChange(draft + emoji);
    setEmojiOpen(false);
    textareaRef.current?.focus();
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
      toast.show(err.message || "Failed to send message.", { type: "error" });
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
    <aside className="gsap-sidebar w-sidebar-width h-screen fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant/10 flex flex-col py-6 px-4 z-50">
        <div className="mb-8 px-2 flex items-center gap-3">
            <div className="flex flex-col">
                <h1 className="font-headline-md text-headline-md font-bold text-primary leading-none">DevRoom</h1>
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Engineering Workspace</span>
            </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
            <div className="px-2 mb-2">
                <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Main Modules</span>
            </div>
            <a className="flex items-center gap-3 px-3 py-2 bg-surface-container-highest text-primary font-medium rounded-lg cursor-pointer active:scale-95 duration-200 transition-colors">
                <i className={`${mi("chat")} text-lg`} />
                <span className="font-body-sm text-body-sm">Chat</span>
            </a>
            <a onClick={() => navigate(`/project/${projectId}/ai`)} className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors rounded-lg cursor-pointer active:scale-95 duration-200">
                <i className={`${mi("smart_toy")} text-lg`} />
                <span className="font-body-sm text-body-sm">AI Assistant</span>
            </a>
            <a onClick={() => navigate(`/project/${projectId}/resources`)} className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors rounded-lg cursor-pointer active:scale-95 duration-200">
                <i className={`${mi("folder_open")} text-lg`} />
                <span className="font-body-sm text-body-sm">Resources</span>
            </a>
        </nav>
        <div className="mt-auto space-y-1">
            <a onClick={() => navigate(`/project/${projectId}/settings`)} className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors rounded-lg cursor-pointer active:scale-95 duration-200">
                <i className={`${mi("settings")} text-lg`} />
                <span className="font-body-sm text-body-sm">Settings</span>
            </a>
            <div onClick={() => toast.show("No new notifications yet.", { type: "info" })} className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors rounded-lg cursor-pointer active:scale-95 duration-200">
                <i className={`${mi("notifications")} text-lg`} />
                <span className="font-body-sm text-body-sm">Notifications</span>
            </div>
            <div className="pt-4 flex items-center gap-3 px-2">
                <img className="w-10 h-10 rounded-lg object-cover ring-1 ring-outline/20" alt={user.name} src={user.avatarUrl} />
                <div className="flex flex-col overflow-hidden">
                    <span className="font-bold text-sm truncate">{user.name}</span>
                    <span className="text-[10px] text-primary">{user.tier}</span>
                </div>
            </div>
        </div>
    </aside>
    {/* Main Content Area */}
    <main className="ml-sidebar-width h-screen flex flex-col relative overflow-hidden bg-surface-container-lowest">
        {/* Top Navigation Bar */}
        <header className="gsap-topbar flex justify-between items-center h-16 px-gutter bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 sticky top-0 z-40">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="font-label-caps text-label-caps text-on-surface-variant tracking-widest">{(project?.name || "PROJECT").toUpperCase()}</span>
                    <span className="text-outline-variant">/</span>
                    <span className="font-label-caps text-label-caps text-primary font-bold tracking-widest">#{CHANNEL.toUpperCase()}</span>
                </div>
                <div className="h-4 w-px bg-outline-variant/30"></div>
                <button
                  onClick={() => setShowPinnedOnly((v) => !v)}
                  className={`flex items-center gap-2 transition-colors ${showPinnedOnly ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
                  title={showPinnedOnly ? "Showing pinned only — click to show all" : "Show pinned messages only"}
                >
                    <i className={`${mi("push_pin")} text-sm`} />
                    <span className="text-xs font-medium">{pinnedMessages.length} Pinned</span>
                </button>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <i className={`${mi("search")} text-on-surface-variant text-lg`} />
                    </div>
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg pl-10 pr-4 py-1.5 text-xs w-64 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all" placeholder="Search messages..." type="text"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate("/dashboard")} className="p-2 text-on-surface-variant hover:text-primary transition-all cursor-pointer" title="Back to Projects">
<i className={`${mi("account_tree")}`} />
</button>
                    <i
                      className={`${mi(error ? "cloud_off" : loading ? "cloud_sync" : "cloud_done")} p-2 ${error ? "text-error" : loading ? "text-outline-variant" : "text-primary"}`}
                      title={error ? "Sync failed" : loading ? "Syncing…" : "All changes saved"}
                     />
                </div>
            </div>
        </header>
        {/* Messaging Layout */}
        <section className="flex flex-1 overflow-hidden">
            {/* Message List */}
            <div ref={scrollRef} className="flex-1 flex flex-col overflow-y-auto pt-6 px-gutter bg-surface custom-scrollbar">
                {loading && <div className="flex justify-center py-4"><Loader label="loading_messages..." /></div>}
                {!loading && error && <p className="text-sm text-error text-center">{error}</p>}
                {!loading && !error && visibleMessages.length === 0 && (
                  <p className="text-sm text-on-surface-variant text-center">
                    {showPinnedOnly ? "No pinned messages yet." : "No messages yet. Say hi 👋"}
                  </p>
                )}
                <div className="space-y-6 pb-10" ref={messageListRef}>
{visibleMessages.map((msg) => {
  const isOwn = msg.authorId === user.$id;
  return (
    <div key={msg.$id} data-msg-id={msg.$id} className="flex gap-4 group">
        <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center mt-1 text-xs font-bold text-primary flex-shrink-0">
          {(msg.authorName || "?").slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold text-sm">{msg.authorName}{isOwn ? " (you)" : ""}</span>
                <span className="text-[10px] text-outline-variant">{relativeTime(msg.$createdAt)}</span>
                {msg.pinned && <i className={`${mi("push_pin")} text-primary text-[14px]`} />}
            </div>
            <div className="bg-surface-container/50 p-4 rounded-xl rounded-tl-none border border-outline-variant/10 message-gradient relative hover:border-outline-variant/30 transition-colors">
                {msg.text && <p className="text-on-surface leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>}
                {msg.attachmentFileId && (
                  <a href={getAttachmentUrl(msg.attachmentFileId)} target="_blank" rel="noreferrer" className="mt-3 bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 flex items-center gap-3 max-w-sm hover:border-secondary/50 cursor-pointer transition-all">
                      <div className="w-10 h-10 bg-secondary/10 rounded flex items-center justify-center">
                          <i className={`${mi("description")} text-secondary`} />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-bold truncate">{msg.attachmentName}</span>
                      </div>
                      <i className={`${mi("download")} ml-auto text-on-surface-variant text-lg`} />
                  </a>
                )}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => togglePin(msg.$id)} title="Pin" className="p-1 text-on-surface-variant hover:text-primary">
                      <i className={`${mi("push_pin")} text-[16px]`} />
                    </button>
                    {isOwn && (
                      <button onClick={() => deleteMessage(msg.$id)} title="Delete" className="p-1 text-on-surface-variant hover:text-error">
                        <i className={`${mi("delete")} text-[16px]`} />
                      </button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
})}
{typingUsers.length > 0 && (
  <div className="flex items-center gap-2 pl-14">
    <span className="text-xs text-on-surface-variant italic">
      {typingUsers.map((t) => t.userName).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing
    </span>
    <TypingDots />
  </div>
)}
                </div>
            </div>
            {/* Thread/Side Panel (Hidden on Mobile) */}
            <div className="hidden lg:flex flex-col w-80 bg-surface-container-low border-l border-outline-variant/10">
                <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
                    <h3 className="font-bold text-sm">Channel Info</h3>
                    <i className={`${mi("info")} text-on-surface-variant text-lg`} />
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
                            {sharedLinks.length === 0 && (
                              <p className="text-[11px] text-on-surface-variant">No links shared in this channel yet.</p>
                            )}
                            {sharedLinks.map((link) => (
                              <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 group cursor-pointer"
                              >
                                  <div className="p-1.5 bg-surface-variant rounded">
                                      <i className={`${mi("link")} text-sm`} />
                                  </div>
                                  <div className="flex flex-col overflow-hidden">
                                      <span className="text-[11px] font-medium truncate group-hover:text-primary">{link.url}</span>
                                      <span className="text-[9px] text-outline-variant">Shared by {link.authorName || "someone"}</span>
                                  </div>
                              </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
        {/* Message Input Bar */}
        <footer className="p-gutter pt-0 bg-surface">
            <div className="max-w-4xl mx-auto glass-panel-chat border border-outline-variant/20 rounded-2xl shadow-2xl relative">
                {/* Action Bar */}
                <div className="px-4 py-2 flex items-center gap-2 border-b border-outline-variant/5 bg-surface-container-lowest/50 rounded-t-2xl">
                    {/* <button onClick={() => wrapSelection("**")} title="Bold" className="p-1.5 text-on-surface-variant hover:text-primary transition-all rounded hover:bg-surface-variant/30">
<i className={`${mi("format_bold")} text-lg`} />
</button>
                    <button onClick={() => wrapSelection("_")} title="Italic" className="p-1.5 text-on-surface-variant hover:text-primary transition-all rounded hover:bg-surface-variant/30">
<i className={`${mi("format_italic")} text-lg`} />
</button>
                    <button onClick={() => wrapSelection("`")} title="Code" className="p-1.5 text-on-surface-variant hover:text-primary transition-all rounded hover:bg-surface-variant/30">
<i className={`${mi("code")} text-lg`} />
</button> */}
                    <div className="h-4 w-px bg-outline-variant/20 mx-1"></div>
                    <button onClick={() => fileInputRef.current?.click()} title="Attach file" className={`p-1.5 transition-all rounded hover:bg-surface-variant/30 ${attachment ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}>
<i className={`${mi("attach_file")} text-lg`} />
</button>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setAttachment(e.target.files[0] || null)} />
                    <div className="relative" ref={emojiRef}>
                      <button onClick={() => setEmojiOpen((v) => !v)} title="Emoji" className={`p-1.5 transition-all rounded hover:bg-surface-variant/30 ${emojiOpen ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}>
<i className={`${mi("mood")} text-lg`} />
</button>
                      {emojiOpen && (
                        <div className="absolute bottom-full mb-2 left-0 bg-surface-container-high border border-outline-variant/20 rounded-lg p-2 flex gap-1 shadow-xl z-10">
                          {QUICK_EMOJIS.map((item) => (
                            <button
                              key={item.emoji}
                              onClick={() => insertEmoji(item.emoji)}
                              title={item.emoji}
                              className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-variant/40 hover:scale-110 transition-all text-on-surface-variant hover:text-primary"
                            >
                              <i className={item.icon} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                </div>
                {attachment && (
                  <div className="px-4 pt-2 flex items-center gap-2 text-xs text-on-surface-variant">
                    <i className={`${mi("description")} text-[16px]`} />
                    {attachment.name}
                    <button onClick={() => setAttachment(null)} className="text-error hover:underline">remove</button>
                  </div>
                )}
                {/* Input Area */}
                <div className="p-4 flex items-end gap-3">
                    <textarea
                      ref={textareaRef}
                      value={draft}
                      onChange={(e) => handleDraftChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={() => setTyping(false)}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1 resize-none h-10 max-h-32 font-body-sm leading-relaxed" placeholder={`Message #${CHANNEL}...`} rows="1"></textarea>
                    <button onClick={handleSend} disabled={sending} className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:shadow-[0_0_15px_rgba(138,235,255,0.4)] active:scale-95 transition-all disabled:opacity-50">
<i className={`${mi("send")}`} />
</button>
                </div>
            </div>
            <div className="text-center mt-3">
                <span className="text-[10px] text-outline-variant font-mono"><b>Return</b> to send • <b>Shift+Return</b> for new line</span>
            </div>
        </footer>
    </main>
    </>
  );
}

function TypingDots() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dots = ref.current.querySelectorAll("span");
    const tl = gsap.timeline({ repeat: -1 });
    tl.to(dots, { y: -4, duration: 0.28, stagger: 0.12, ease: "power1.inOut", yoyo: true, repeat: 1 });
    return () => tl.kill();
  }, []);
  return (
    <span ref={ref} className="flex items-center gap-0.5">
      <span className="w-1 h-1 rounded-full bg-on-surface-variant inline-block" />
      <span className="w-1 h-1 rounded-full bg-on-surface-variant inline-block" />
      <span className="w-1 h-1 rounded-full bg-on-surface-variant inline-block" />
    </span>
  );
}