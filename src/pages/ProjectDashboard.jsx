import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import usePageEntrance from "../hooks/usePageEntrance";
import { useProject } from "../hooks/useProjects";
import { useMembers } from "../hooks/useMembers";
import { useResources } from "../hooks/useResources";
import { useMessages } from "../hooks/useMessages";
import { useActivity } from "../hooks/useActivity";
import { useUser } from "../context/UserContext";
import { relativeTime, fileVisual } from "../lib/format";
import { describeActivity, activityIcon } from "../lib/activity";
import NotificationBell from "../components/NotificationBell";

function initials(nameOrEmail) {
  const base = nameOrEmail || "?";
  const parts = base.split(/[@\s._-]+/).filter(Boolean);
  return (parts[0]?.[0] || "?").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
}

function Avatar({ label, size = "w-10 h-10 text-sm" }) {
  return (
    <div className={`${size} rounded-full bg-surface-container-highest border-2 border-surface flex items-center justify-center font-bold text-primary shrink-0`}>
      {initials(label)}
    </div>
  );
}

export default function ProjectDashboard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const currentUser = useUser();
  const { project, loading, error } = useProject(projectId);
  const { activeMembers, pendingInvites, loading: membersLoading } = useMembers(projectId);
  const { files, loading: filesLoading } = useResources(projectId);
  const { messages, loading: messagesLoading } = useMessages(projectId, "general");
  const { activity, loading: activityLoading } = useActivity(projectId, 12);

  usePageEntrance([loading]);

  const [headerSearch, setHeaderSearch] = useState("");

  const totalMembers = activeMembers.length + pendingInvites.length;
  const onboardingPct = totalMembers > 0 ? Math.round((activeMembers.length / totalMembers) * 100) : 0;

  const filesByType = useMemo(() => {
    const buckets = {};
    files.forEach((f) => {
      const { label } = fileVisual(f.mimeType || "");
      buckets[label] = (buckets[label] || 0) + 1;
    });
    return Object.entries(buckets).sort((a, b) => b[1] - a[1]);
  }, [files]);
  const maxBucket = Math.max(1, ...filesByType.map(([, count]) => count));

  function handleHeaderSearchKeyDown(e) {
    if (e.key !== "Enter") return;
    const term = headerSearch.trim().toLowerCase();
    if (!term) return;
    const memberHit = activeMembers.some(
      (m) => m.name?.toLowerCase().includes(term) || m.email?.toLowerCase().includes(term)
    );
    const fileHit = files.some((f) => f.name?.toLowerCase().includes(term));
    if (memberHit) {
      navigate(`/project/${projectId}/members`);
    } else if (fileHit) {
      navigate(`/project/${projectId}/resources`);
    } else {
      alert(`No matches for "${headerSearch.trim()}" in this project's members or files.`);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-on-surface-variant">
        Loading project…
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-8">
        <p className="text-white font-medium">Project not found</p>
        <p className="text-on-surface-variant text-sm max-w-sm">{error || "This project may have been deleted."}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-primary text-on-primary px-5 py-2 rounded font-bold text-sm hover:brightness-110 active:scale-95 transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <>
    {/* SideNavBar (Shared Component) */}
    <aside className="gsap-sidebar w-sidebar-width h-full fixed left-0 top-0 bg-surface-dim border-r border-white/5 flex flex-col p-4 z-50">
        <div className="mb-10 px-2">
            <h1 className="font-headline-md text-headline-md font-bold text-primary">DevRoom</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant opacity-70">Collaborative Space</p>
        </div>
        <nav className="flex-1 space-y-1">
            <a onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors bg-surface-container-high text-primary font-medium active:scale-95 duration-100" href="#">
                <span className="material-symbols-outlined" data-icon="home">home</span>
                <span className="font-body-sm text-body-sm">Home</span>
            </a>
            <a onClick={() => navigate("/dashboard")} className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-on-surface-variant hover:text-on-surface hover:bg-white/5 active:scale-95 duration-100 cursor-pointer">
                <span className="material-symbols-outlined" data-icon="account_tree">account_tree</span>
                <span className="font-body-sm text-body-sm">Projects</span>
            </a>
            <a onClick={() => navigate(`/project/${projectId}/settings`)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-on-surface-variant hover:text-on-surface hover:bg-white/5 active:scale-95 duration-100 cursor-pointer">
                <span className="material-symbols-outlined" data-icon="settings">settings</span>
                <span className="font-body-sm text-body-sm">Settings</span>
            </a>
        </nav>
        <div className="mt-auto pt-6">
            <button onClick={() => navigate("/dashboard")} className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-lg font-medium hover:brightness-110 transition-all active:scale-95">
<span className="material-symbols-outlined text-[20px]" data-icon="add">add</span>
<span className="font-body-sm text-body-sm">New Project</span>
</button>
        </div>
    </aside>
    {/* TopNavBar (Shared Component) */}
    <header className="gsap-topbar h-16 fixed top-0 right-0 z-40 bg-surface/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-gutter ml-sidebar-width w-[calc(100%-260px)]">
        <div className="flex items-center gap-4 bg-surface-container-lowest border border-white/5 rounded-lg px-3 py-1.5 w-96 focus-within:ring-1 focus-within:ring-primary transition-all">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]" data-icon="search">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-body-sm w-full placeholder:text-on-surface-variant/50"
              placeholder="Search members or files..."
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              onKeyDown={handleHeaderSearchKeyDown}
            />
            <span className="text-on-surface-variant/30 text-[10px] font-code-sm border border-white/10 rounded px-1">↵</span>
        </div>
        <div className="flex items-center gap-4">
            <NotificationBell />
            <button onClick={() => navigate(`/project/${projectId}/settings`)} className="h-8 w-8 rounded-full overflow-hidden border border-white/10" title={currentUser.name}>
                <img className="w-full h-full object-cover" alt={currentUser.name} src={currentUser.avatarUrl} />
            </button>
        </div>
    </header>
    {/* Main Content Canvas */}
    <main className="ml-sidebar-width pt-16 h-screen overflow-hidden flex">
        {/* Scrollable Dashboard Area */}
        <div className="gsap-panel flex-1 overflow-y-auto custom-scrollbar p-gutter space-y-8 max-w-container-max">
            {/* Header Section */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <nav className="flex items-center gap-2 text-on-surface-variant mb-2">
                        <span onClick={() => navigate("/dashboard")} className="text-label-caps font-label-caps cursor-pointer hover:text-on-surface">Projects</span>
                        <span className="material-symbols-outlined text-[14px]" data-icon="chevron_right">chevron_right</span>
                        <span className="text-label-caps font-label-caps text-primary">{project.name}</span>
                    </nav>
                    <h2 className="font-headline-lg text-headline-lg text-white">{project.name}</h2>
                    <p className="text-on-surface-variant font-body-sm mt-1 max-w-lg">{project.description || "No description yet."}</p>
                </div>
                <div className="flex items-center -space-x-3">
                    {!membersLoading &&
                      activeMembers.slice(0, 3).map((m) => (
                        <div key={m.$id} title={m.name || m.email} className="border-2 border-surface rounded-full">
                          <Avatar label={m.name || m.email} />
                        </div>
                      ))}
                    {!membersLoading && activeMembers.length > 3 && (
                      <div className="w-10 h-10 rounded-full border-2 border-surface bg-surface-container-highest flex items-center justify-center text-xs font-bold text-on-surface-variant">
                        +{activeMembers.length - 3}
                      </div>
                    )}
                    <button onClick={() => navigate(`/project/${projectId}/members`)} className="w-10 h-10 rounded-full border-2 border-dashed border-white/20 bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all active:scale-90" title="Manage members">
<span className="material-symbols-outlined" data-icon="add">add</span>
</button>
                </div>
            </section>
            {/* Bento Status Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 glass-panel-dash p-8 rounded-xl relative overflow-hidden group">

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <span className="text-label-caps font-label-caps text-primary border border-primary/20 bg-primary/5 px-2 py-1 rounded">Team Onboarding</span>
                            <h3 className="text-headline-md font-code-sm mt-4">{onboardingPct}<span className="text-lg text-on-surface-variant">% Active</span></h3>
                            <p className="text-on-surface-variant font-body-sm mt-2">
                              {totalMembers === 0
                                ? "No team members yet — invite someone to get started."
                                : `${activeMembers.length} active member${activeMembers.length === 1 ? "" : "s"}, ${pendingInvites.length} pending invite${pendingInvites.length === 1 ? "" : "s"}.`}
                            </p>
                        </div>
                        <div className="mt-8">
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                <div className="bg-primary h-full primary-glow transition-all" style={{ width: `${onboardingPct}%` }}></div>
                            </div>
                            <div className="flex justify-between mt-3 text-label-caps font-label-caps text-on-surface-variant opacity-60">
                                <span>Active: {activeMembers.length}</span>
                                <span>Pending: {pendingInvites.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="glass-panel-dash p-8 rounded-xl flex flex-col justify-between border-primary/20 primary-glow">
                    <div>
                        <span className="material-symbols-outlined text-primary text-[32px]" data-icon="schedule">schedule</span>
                        <h3 className="font-headline-md text-headline-md mt-4">Last Activity</h3>
                    </div>
                    <div>
                        <p className="text-white font-code-sm text-body-lg">Updated {relativeTime(project.$updatedAt)}</p>
                        <p className="text-on-surface-variant font-code-sm text-[13px] mt-1">Created {relativeTime(project.$createdAt)}</p>
                    </div>
                </div>
            </section>
            {/* Quick Link Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div onClick={() => navigate(`/project/${projectId}/ai`)} className="glass-panel-dash p-6 rounded-xl group hover:border-primary/40 transition-all cursor-pointer">
                    <div className="w-11 h-11 rounded-full border border-primary/30 flex items-center justify-center text-primary mb-6 group-hover:border-primary group-hover:bg-primary/5 transition-all">
                        <span className="material-symbols-outlined text-[22px]" data-icon="terminal">terminal</span>
                    </div>
                    <h4 className="font-headline-md text-[20px] mb-2">AI Workspace</h4>
                    <p className="text-on-surface-variant font-body-sm mb-4">Integrated LLM for code generation and architectural reasoning.</p>
                    <div className="flex items-center text-primary text-label-caps font-label-caps gap-2 group-hover:translate-x-1 transition-transform">
                        <span>Launch Instance</span>
                        <span className="material-symbols-outlined text-[16px]" data-icon="arrow_forward">arrow_forward</span>
                    </div>
                </div>
                <div onClick={() => navigate(`/project/${projectId}/resources`)} className="glass-panel-dash p-6 rounded-xl group hover:border-secondary/40 transition-all cursor-pointer">
                    <div className="w-11 h-11 rounded-full border border-secondary/30 flex items-center justify-center text-secondary mb-6 group-hover:border-secondary group-hover:bg-secondary/5 transition-all">
                        <span className="material-symbols-outlined text-[22px]" data-icon="folder_managed">folder_managed</span>
                    </div>
                    <h4 className="font-headline-md text-[20px] mb-2">Resource Vault</h4>
                    <p className="text-on-surface-variant font-body-sm mb-4">
                      {filesLoading ? "Loading files…" : `${files.length} file${files.length === 1 ? "" : "s"} stored.`}
                    </p>
                    <div className="flex items-center text-secondary text-label-caps font-label-caps gap-2 group-hover:translate-x-1 transition-transform">
                        <span>Browse Assets</span>
                        <span className="material-symbols-outlined text-[16px]" data-icon="arrow_forward">arrow_forward</span>
                    </div>
                </div>
                <div onClick={() => navigate(`/project/${projectId}/chat`)} className="glass-panel-dash p-6 rounded-xl group hover:border-tertiary/40 transition-all cursor-pointer">
                    <div className="w-11 h-11 rounded-full border border-tertiary/30 flex items-center justify-center text-tertiary mb-6 group-hover:border-tertiary group-hover:bg-tertiary/5 transition-all">
                        <span className="material-symbols-outlined text-[22px]" data-icon="forum">forum</span>
                    </div>
                    <h4 className="font-headline-md text-[20px] mb-2">Team Chat</h4>
                    <p className="text-on-surface-variant font-body-sm mb-4">
                      {messagesLoading ? "Loading messages…" : `${messages.length} message${messages.length === 1 ? "" : "s"} in #general.`}
                    </p>
                    <div className="flex items-center text-tertiary text-label-caps font-label-caps gap-2 group-hover:translate-x-1 transition-transform">
                        <span>Open Chat</span>
                        <span className="material-symbols-outlined text-[16px]" data-icon="arrow_forward">arrow_forward</span>
                    </div>
                </div>
            </section>
            {/* Metrics / Charts Section */}
            <section className="glass-panel-dash rounded-xl p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="font-headline-md text-headline-md">Files by Type</h3>
                    <span className="text-label-caps font-label-caps text-on-surface-variant">{files.length} total</span>
                </div>
                {filesLoading ? (
                  <div className="h-48 flex items-center justify-center text-on-surface-variant text-sm">Loading files…</div>
                ) : filesByType.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center gap-3 text-center">
                    <span className="material-symbols-outlined text-[40px] text-outline-variant">folder_off</span>
                    <p className="text-on-surface-variant text-sm">No files uploaded yet.</p>
                    <button
                      onClick={() => navigate(`/project/${projectId}/resources`)}
                      className="text-primary text-sm font-bold hover:underline"
                    >
                      Upload the first one
                    </button>
                  </div>
                ) : (
                  <div className="h-48 flex items-end justify-between gap-4">
                    {filesByType.map(([label, count]) => (
                      <div key={label} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                        <div className="w-full flex-1 flex items-end">
                          <div
                            className="w-full bg-primary/40 hover:bg-primary/60 rounded-t-sm transition-colors relative"
                            style={{ height: `${Math.max(8, (count / maxBucket) * 100)}%` }}
                          >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-primary font-code-sm text-[11px]">{count}</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wide">{label}</span>
                      </div>
                    ))}
                  </div>
                )}
            </section>
        </div>
        {/* Recent Activity Feed (Sidebar) */}
        <aside className="w-80 border-l border-white/5 bg-surface-container-lowest overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5">
                <h3 className="text-label-caps font-label-caps text-on-surface-variant flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${activityLoading ? "bg-secondary animate-pulse" : "bg-primary"}`}></span> Recent Activity
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                {activityLoading && (
                  <p className="text-on-surface-variant text-sm">Loading activity…</p>
                )}
                {!activityLoading && activity.length === 0 && (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-[32px] text-outline-variant mb-2 block">history</span>
                    <p className="text-on-surface-variant text-sm">Nothing has happened here yet.</p>
                  </div>
                )}
                {!activityLoading &&
                  activity.map((a) => (
                    <div key={a.$id} className="flex gap-3 group">
                        <div className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[15px]">{activityIcon(a.type)}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="font-body-sm text-body-sm text-on-surface leading-snug">{describeActivity(a)}</p>
                            <p className="text-[11px] text-on-surface-variant mt-0.5 font-code-sm">{relativeTime(a.$createdAt)}</p>
                        </div>
                    </div>
                  ))}
            </div>
            <button
              onClick={() => navigate(`/project/${projectId}/chat`)}
              className="p-4 border-t border-white/5 text-center text-primary text-xs font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">forum</span>
              {messagesLoading ? "Open chat" : `Open chat · ${messages.length} message${messages.length === 1 ? "" : "s"}`}
            </button>
        </aside>
    </main>
    </>
  );
}