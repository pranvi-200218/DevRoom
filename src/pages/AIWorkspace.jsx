import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useAIChat, AI_ROOMS } from "../hooks/useAIChat";
import { useProject } from "../hooks/useProjects";
import { useUser } from "../context/UserContext";
import { relativeTime } from "../lib/format";

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

export default function AIWorkspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(AI_ROOMS[0].id);
  const currentUser = useUser();
  const { project } = useProject(projectId);
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
            <h1 className="font-headline-md text-headline-md font-extrabold text-primary tracking-tighter">DevRoom OS</h1>
            <p className="text-on-surface-variant font-label-caps text-[10px] tracking-widest mt-1">ENGINEERING WORKSPACE</p>
        </div>
        <nav className="flex-1 space-y-1 custom-scrollbar overflow-y-auto">
            <div className="mb-6">
                <p className="px-2 mb-2 text-[10px] font-bold text-outline uppercase tracking-widest">Core</p>
                <a onClick={() => navigate(`/project/${projectId}/chat`)} className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors cursor-pointer active:scale-95 duration-200">
                    <span className="material-symbols-outlined text-[20px]" data-icon="chat">chat</span>
                    <span>Chat</span>
                </a>
                <a className="flex items-center gap-3 px-3 py-2 bg-surface-container-highest text-primary font-medium rounded-lg cursor-pointer transition-all active:scale-95 duration-200">
                    <span className="material-symbols-outlined text-[20px]" data-icon="smart_toy" data-weight="fill">smart_toy</span>
                    <span>AI Assistant</span>
                </a>
                <a onClick={() => navigate(`/project/${projectId}/resources`)} className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors cursor-pointer active:scale-95 duration-200">
                    <span className="material-symbols-outlined text-[20px]" data-icon="description">description</span>
                    <span>Docs</span>
                </a>
            </div>
            <div className="mb-6">
                <p className="px-2 mb-2 text-[10px] font-bold text-outline uppercase tracking-widest">AI Rooms</p>
                <div className="space-y-1">
{AI_ROOMS.map((r) => (
  <div
    key={r.id}
    onClick={() => setRoom(r.id)}
    className={`relative flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer group transition-colors ${
      room === r.id ? "text-on-surface bg-surface-variant/20" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/20"
    }`}
  >
      <div className={`active-tab-indicator ${room === r.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}></div>
      <span className={`w-2 h-2 rounded-full ${ROOM_DOTS[r.id] || "bg-cyan-400"}`}></span>
      <span>{r.label}</span>
  </div>
))}
                </div>
            </div>
        </nav>
        <div className="pt-6 border-t border-outline-variant/10 space-y-1">
            <a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 rounded-lg transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[20px]" data-icon="settings">settings</span>
                <span>Settings</span>
            </a>
            <div className="flex items-center gap-3 px-3 py-3 mt-4 glass-panel-ai rounded-xl">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20">
                    <img className="w-full h-full object-cover" data-alt="Close up portrait of a professional software engineer with a modern aesthetic, wearing dark tech-wear, lit by subtle cyan and purple neon lights in a high-tech studio environment." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXXjggHpwQhaNLrI75egd_LPLH-UkRpNd1joqujCgaJlNClDo2HTyAf6jaJy2maILuK5uFKLUIJCivm0fRmvBcL8BIZLMPDJX5qNDOsctMIBfV6pGAVMJxXX3bXmECGGlTf2MnOUsEtuJ10RT-3oziGozXnYMbjIiwtH6elFaFKxp3wtdUxytKsw6N9OMjJgYJ3e7P7LTsTCpHh7IHPbkO0mJdPh2xac_DAaHmtKsVhocb_FiW9Yiz0TkKb6GIL-mWqOdF8spMOWM"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-primary/70 uppercase">Pro Plan</p>
                </div>
            </div>
        </div>
    </aside>
    {/* TopNavBar (Shared Component Identity) */}
    <header className="ml-sidebar-width h-16 px-gutter flex justify-between items-center sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <span className="text-on-surface-variant font-label-caps text-label-caps uppercase">Workspace</span>
                <span className="material-symbols-outlined text-[16px] text-outline" data-icon="chevron_right">chevron_right</span>
                <span className="text-primary font-bold font-label-caps text-label-caps uppercase">{activeRoom?.label} Room</span>
            </div>
            <div className="h-4 w-[1px] bg-outline-variant/30"></div>
            <div className="flex items-center gap-4">
                <span className="text-primary font-bold font-label-caps text-label-caps cursor-pointer">{project?.name || "Project"}</span>
                <span className="text-on-surface-variant font-label-caps text-label-caps cursor-pointer hover:text-primary transition-all">{project ? `Updated ${relativeTime(project.$updatedAt)}` : ""}</span>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="relative group">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-surface-container-lowest border border-outline-variant/20 rounded-full py-1.5 pl-9 pr-4 text-xs w-64 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all" placeholder="Search this conversation..." type="text" />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-outline group-focus-within:text-primary" data-icon="search">search</span>
            </div>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-variant/50 transition-colors text-on-surface-variant">
<span className="material-symbols-outlined" data-icon="account_tree">account_tree</span>
</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-variant/50 transition-colors text-on-surface-variant">
<span className="material-symbols-outlined" data-icon="cloud_done" data-weight="fill">cloud_done</span>
</button>
        </div>
    </header>
    {/* Main Workspace Layout */}
    <main className="ml-sidebar-width h-[calc(100vh-64px)] flex">
        {/* Center: AI Conversation Area */}
        <section className="flex-1 flex flex-col min-w-0 bg-surface-container-lowest relative">
            <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar space-y-10">
                {loading && <p className="text-sm text-on-surface-variant text-center">Loading conversation…</p>}
                {!loading && error && (
                  <p className="text-sm text-error text-center max-w-2xl mx-auto">{error}</p>
                )}
                {!loading && messages.length === 0 && !error && (
                  <div className="max-w-2xl mx-auto text-center space-y-6 py-10">
                    <p className="text-on-surface-variant text-sm">Start a conversation in the {activeRoom?.label} room.</p>
                    <div className="grid grid-cols-1 gap-3">
{STARTER_PROMPTS.map((p) => (
  <button key={p} onClick={() => handleSend(p)} className="glass-panel-ai p-4 rounded-xl border border-primary/10 hover:border-primary/40 text-left text-sm text-on-surface-variant hover:text-on-surface transition-all">
    {p}
  </button>
))}
                    </div>
                  </div>
                )}
{messages.map((msg) =>
  msg.role === "user" ? (
    <div key={msg.$id} className="max-w-3xl mx-auto w-full flex flex-col items-end">
        <div className="glass-panel-ai p-5 rounded-2xl rounded-tr-none border-l-4 border-l-primary max-w-[90%] relative group">
            <p className="text-body-lg font-body-lg text-on-surface whitespace-pre-wrap break-words">{msg.content}</p>
            <button onClick={() => togglePin(msg.$id)} className={`absolute -top-2 -left-2 w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center transition-opacity ${msg.pinned ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-primary"}`}>
              <span className="material-symbols-outlined text-[14px]">push_pin</span>
            </button>
        </div>
        <span className="text-[10px] text-outline mt-2 font-label-caps">SENT</span>
    </div>
  ) : (
    <div key={msg.$id} className="max-w-4xl mx-auto w-full space-y-4">
        <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/40 shadow-[0_0_15px_rgba(138,235,255,0.2)]">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>smart_toy</span>
            </div>
            <div className="flex-1 space-y-4 min-w-0">
                <div className="prose prose-invert max-w-none text-body-lg font-body-lg leading-relaxed text-on-surface-variant">
                  <ReactMarkdown
                    components={{
                      code({ inline, className, children, ...props }) {
                        if (inline) {
                          return <code className="text-primary bg-primary/10 px-1 rounded" {...props}>{children}</code>;
                        }
                        return (
                          <div className="rounded-xl overflow-hidden border border-outline-variant/20 bg-[#0B0D12] code-glow my-3">
                            <pre className="p-5 overflow-x-auto font-code-sm text-code-sm leading-relaxed text-on-surface"><code>{children}</code></pre>
                          </div>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => togglePin(msg.$id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[12px] ${msg.pinned ? "border-primary/50 text-primary bg-primary/5" : "border-outline-variant/30 hover:bg-primary/5 hover:border-primary/50 text-outline hover:text-primary"}`}>
<span className="material-symbols-outlined text-[16px]">push_pin</span>
                        {msg.pinned ? "Pinned" : "Pin"}
                    </button>
                </div>
            </div>
        </div>
    </div>
  )
)}
{sending && (
  <div className="max-w-4xl mx-auto w-full flex items-center gap-4 text-on-surface-variant text-sm">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/40 animate-pulse">
          <span className="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
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
                          className="flex-1 bg-transparent border-none focus:ring-0 text-body-lg resize-none py-3 custom-scrollbar max-h-48" placeholder="Type your command..."
                            rows="1"></textarea>
                        <div className="flex items-center gap-2 mb-1 mr-1">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-highest/50 border border-outline-variant/30 text-[10px] text-outline font-mono">
                                <span>Claude</span>
                            </div>
                            <button onClick={() => handleSend()} disabled={sending} className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center hover:shadow-[0_0_20px_rgba(138,235,255,0.4)] transition-all active:scale-95 disabled:opacity-50">
<span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>send</span>
</button>
                        </div>
                    </div>
                </div>
                <div className="max-w-4xl mx-auto flex justify-center mt-2">
                    <p className="text-[10px] text-outline uppercase tracking-[0.2em]">DevRoom Engine v2.4.1 • Low Latency Mode</p>
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
                            <span className="material-symbols-outlined text-primary text-[18px]" data-icon="keep" data-weight="fill">keep</span>
                            <h3 className="font-bold text-[11px] uppercase tracking-widest text-on-surface">Pinned Prompts</h3>
                        </div>
                        <span className="text-[10px] text-outline font-mono">{String(pinnedPrompts.length).padStart(2, "0")}</span>
                    </div>
                    <div className="space-y-3">
{pinnedPrompts.length === 0 && (
  <p className="text-xs text-on-surface-variant">Pin a prompt from the conversation to see it here.</p>
)}
{pinnedPrompts.map((p) => (
  <div key={p.$id} className="p-3 rounded-xl bg-surface-container/50 border border-outline-variant/10 hover:border-primary/20 transition-all cursor-pointer group" onClick={() => setDraft(p.content)}>
      <p className="text-xs text-on-surface-variant group-hover:text-on-surface line-clamp-2">"{p.content}"</p>
      <div className="flex items-center justify-between mt-2">
          <span className="text-[9px] text-outline px-1.5 py-0.5 rounded bg-surface-variant/30">{activeRoom?.label?.toUpperCase()}</span>
          <span className="material-symbols-outlined text-[14px] text-outline opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
      </div>
  </div>
))}
                    </div>
                </div>
                {/* Saved Responses (Bento style items) */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]" data-icon="bookmark" data-weight="fill">bookmark</span>
                            <h3 className="font-bold text-[11px] uppercase tracking-widest text-on-surface">Knowledge Base</h3>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 relative h-32 rounded-2xl overflow-hidden group cursor-pointer border border-outline-variant/10">
                            <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700" data-alt="Abstract 3D digital art showcasing flowing code lines and neural network connections in electric cyan and deep obsidian colors, representing high-speed artificial intelligence computing."
                                style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD_WNM9kbGcVOmdCDTGO8RpyXG388JRspdMtSz7CUZxTzd2u4NfNDCw6jTMpeIfu7pFd7HPyd0S9R0BgPhP1qusvADWQ1E_xNasOxZMxMqP_6JgRNb3r1ab0NDgvTkT2HmyhEYdUnUE3eM2vQLYS-n34SGMSWFcS49A2S6Kye8b8QdGVuO7IOJE2GB78sj_SIACZx2bySx6F2SBiNV8-QxxjjOvufSVkx31Hj3x7E__xzYlgXwSVF30aHfsf1jrJCWBv11sbTjWcpA')"}}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
                            <div className="absolute bottom-3 left-3 right-3">
                                <p className="text-[10px] font-bold text-primary mb-1">BEST PRACTICE</p>
                                <p className="text-xs font-medium text-white line-clamp-2">Efficient State Hydration in SSR</p>
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-surface-container/50 border border-outline-variant/10 flex flex-col justify-between hover:bg-surface-variant/30 transition-colors cursor-pointer">
                            <span className="material-symbols-outlined text-purple-400 text-[18px] mb-2" data-icon="description">description</span>
                            <p className="text-[11px] font-medium leading-tight">API Schema Guide</p>
                        </div>
                        <div className="p-3 rounded-xl bg-surface-container/50 border border-outline-variant/10 flex flex-col justify-between hover:bg-surface-variant/30 transition-colors cursor-pointer">
                            <span className="material-symbols-outlined text-cyan-400 text-[18px] mb-2" data-icon="terminal">terminal</span>
                            <p className="text-[11px] font-medium leading-tight">CLI Shortcuts</p>
                        </div>
                    </div>
                </div>
                {/* Prompt Library Button */}
                <button className="w-full py-3 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all flex items-center justify-center gap-2 font-bold text-[11px] uppercase tracking-widest">
<span className="material-symbols-outlined text-[18px]" data-icon="library_books">library_books</span>
                    Explore Library
                </button>
            </div>
            {/* Footer Meta */}
            <div className="p-6 border-t border-outline-variant/10 space-y-4">
                <div className="flex items-center justify-between text-[10px] text-outline">
                    <span>TOKEN USAGE</span>
                    <span>72%</span>
                </div>
                <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[72%] shadow-[0_0_8px_rgba(138,235,255,0.5)]"></div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full border-2 border-surface-container-low bg-surface-variant flex items-center justify-center overflow-hidden">
                            <img className="w-full h-full object-cover" data-alt="Portrait of a diverse female developer with neon lighting in the background, sharp focus, professional tech aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGhyhJZBzSwBRug6Lgv8kT-4r0qA_5eLDtC8teLuwykLMBbanhVhkwXkJ_A8q5T8HjIvgU_f284vaaCUFKSK9lKOtoaxNgB4oSbgOG1UEPMfG0q2x7ue82A_i8ZqiEH7IO7bk_vGEXDlE1i1Bqu1hA5qB0dtFjwzftf_BsGNbtdu2RExJOxI7bUA2qdFWf3z4CPCljTDd44HRJsxl6aw3I7nPWPK660Cm4jH7RKFRB-0LFxE4WICzVdGL3f75R5MVCrOj_8qeWQ_U"
                            />
                        </div>
                        <div className="w-6 h-6 rounded-full border-2 border-surface-container-low bg-surface-variant flex items-center justify-center overflow-hidden">
                            <img className="w-full h-full object-cover" data-alt="Portrait of a male developer with glasses, futuristic background with blue and violet highlights, high quality digital photography." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDj6QRFKZg8qLk_5RD5puqWd2aFOiIx0UHsiz5P0_UnLE5-JS_imYgTvUWAJPmLywuVs4_IHypE3ij7vThdlBErBgtLb0BSKEbg2sfCTWjtFS1Xw7z0xB_lt6A_qm2XAoTx-426ZB8PdKqEWlx5n4gJj6NnLJ7z7PYBYr0JqsvVr0IHXxeAQRPPPwyWMyWwSD5sEBksOyWHhL_-3nvg7EJldQY3Tyu-LS31204nA9cZqq6AmwEzDXGNAnrokQTOJ_H-r3mnNGsxGk"
                            />
                        </div>
                        <div className="w-6 h-6 rounded-full border-2 border-surface-container-low bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                            +4
                        </div>
                    </div>
                    <span className="text-[10px] text-outline uppercase font-medium">Collaborators</span>
                </div>
            </div>
        </aside>
    </main>
    </>
  );
}