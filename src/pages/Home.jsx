import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../hooks/useProjects";
import { useUser, useAuth } from "../context/UserContext";
import ProjectFormModal from "../components/ProjectFormModal";
import NotificationBell from "../components/NotificationBell";
import { relativeTime } from "../lib/format";

const ICON_COLORS = {
  layers: { text: "text-primary", bg: "bg-primary/10" },
  api: { text: "text-secondary", bg: "bg-secondary/10" },
  terminal: { text: "text-on-surface-variant", bg: "bg-surface-variant" },
  auto_awesome: { text: "text-primary", bg: "bg-primary/10" },
  database: { text: "text-secondary", bg: "bg-secondary/10" },
  rocket_launch: { text: "text-tertiary", bg: "bg-tertiary/10" },
  bolt: { text: "text-primary", bg: "bg-primary/10" },
};

function iconColors(icon) {
  return ICON_COLORS[icon] || ICON_COLORS.layers;
}

export default function Home() {
  const navigate = useNavigate();
  const user = useUser();
  const { logout } = useAuth();
  const {
    projects,
    allProjects,
    pinnedProjects,
    recentProjects,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    createProject,
    updateProject,
    deleteProject,
    togglePin,
    refetch,
  } = useProjects();

  const mostRecentProject = allProjects[0] || null;
  const updatedThisWeek = allProjects.filter((p) => {
    const days = (Date.now() - new Date(p.$updatedAt).getTime()) / 86400000;
    return days <= 7;
  }).length;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const searchInputRef = useRef(null);
  const gridRef = useRef(null);

  // Subtle staggered entrance for project cards — plays once when the list
  // first has content (not on every re-render/pin-toggle, since that would
  // be distracting rather than delightful).
  useEffect(() => {
    if (loading || !gridRef.current) return;
    const cards = gridRef.current.querySelectorAll(".project-card");
    if (cards.length === 0) return;
    gsap.fromTo(
      cards,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.05, ease: "power2.out" }
    );
  }, [loading, viewMode]);

  // Track when the project list last finished loading, so the footer can
  // show a real "synced Xs ago" instead of a decorative fake stat.
  useEffect(() => {
    if (!loading) setLastSyncedAt(new Date());
  }, [loading]);

  // Live session uptime, counted from when Home mounted
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setUptimeSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "visible") refetch();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", refetch);
    const interval = setInterval(refetch, 45000);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", refetch);
      clearInterval(interval);
    };
  }, [refetch]);

  function formatUptime(totalSeconds) {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  async function openSharedVSCode() {
    const url = "https://vscode.dev";
    window.open(url, "_blank", "noopener,noreferrer");
    try {
      await navigator.clipboard.writeText(url);
      alert("VS Code opened in a new tab — link copied, share it with your team so everyone can join.");
    } catch {
      alert(`VS Code opened in a new tab — share this link with your team: ${url}`);
    }
  }

  function openCreateModal() {
    setEditingProject(null);
    setModalOpen(true);
  }

  async function handleLogout() {
    if (!window.confirm("Log out of DevRoom OS?")) return;
    await logout();
    // No route change needed — RequireAuth re-renders <Login/> automatically
    // once the context's `user` becomes null.
  }

  function openEditModal(e, project) {
    e.stopPropagation();
    setEditingProject(project);
    setModalOpen(true);
  }

  async function handleDelete(e, project) {
    e.stopPropagation();
    if (!window.confirm(`Delete "${project.name}"? This can't be undone.`)) return;
    try {
      await deleteProject(project.$id);
    } catch (err) {
      alert(err.message || "Failed to delete project.");
    }
  }

  function handlePinToggle(e, project) {
    e.stopPropagation();
    togglePin(project.$id).catch((err) => alert(err.message || "Failed to update pin."));
  }

  return (
    <>
      {modalOpen && (
        <ProjectFormModal
          initial={editingProject}
          submitLabel={editingProject ? "Save Changes" : "Create Project"}
          onClose={() => setModalOpen(false)}
          onSubmit={(data) => (editingProject ? updateProject(editingProject.$id, data) : createProject(data))}
        />
      )}
      <main className="min-h-screen relative flex flex-col">
        <header className="bg-surface/80 dark:bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 flex justify-end items-center h-16 px-gutter sticky top-0 z-40">
          <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-lg hidden md:block">
            <div className="glass h-10 rounded-lg flex items-center px-4 gap-3 hover:border-primary/30 transition-all primary-glow">
              <span className="material-symbols-outlined text-outline text-[20px]" data-icon="search">search</span>
              <input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects..."
                className="bg-transparent border-none focus:outline-none text-on-surface font-body-sm text-body-sm flex-1 placeholder:text-on-surface-variant"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-outline-variant/50" title="Workspace">account_tree</span>
            <span
              className={`material-symbols-outlined ${error ? "text-error" : loading ? "text-outline-variant/50" : "text-primary/60"}`}
              title={error ? "Sync failed" : loading ? "Syncing..." : "All changes saved"}
            >
              {error ? "cloud_off" : loading ? "cloud_sync" : "cloud_done"}
            </span>
            <div className="h-6 w-[1px] bg-outline-variant/30 mx-1"></div>
            <button
              onClick={openCreateModal}
              className="bg-primary text-on-primary px-4 py-1.5 rounded font-label-caps text-[11px] font-bold active:scale-95 duration-200"
            >
              NEW PROJECT
            </button>
            <div className="h-6 w-[1px] bg-outline-variant/30 mx-1"></div>
            <NotificationBell />
            <label
              className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant/20 cursor-pointer relative group flex-shrink-0"
              title="Change your avatar"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface-container-highest text-primary font-bold text-xs">
                  {(user.name || "?")[0].toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="material-symbols-outlined text-white text-[14px]">edit</span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={user.uploadingAvatar}
                onChange={async(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    await user.setAvatarFile(file);
                  } catch (err) {
                    alert(err.message || "Failed to upload avatar.");
                  }
                  e.target.value = "";
                }}
              />
            </label>
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-full text-outline-variant/60 hover:text-error hover:bg-error/10 transition-colors"
              title="Log out"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </header>
        <div className="p-gutter flex-1 max-w-[1440px] mx-auto w-full">
          <section className="mb-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-white mb-2">Welcome back, {user.name.split(" ")[0]}.</h2>
                <p className="text-on-surface-variant font-body-lg text-body-lg">
                  {mostRecentProject ? "Here's what happened while you were away." : "Create your first project to get started."}
                </p>
              </div>
            </div>
            {mostRecentProject && (
              <div
                onClick={() => navigate(`/project/${mostRecentProject.$id}`)}
                className="relative group cursor-pointer"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
                <div className="relative glass rounded-xl overflow-hidden p-8 flex flex-col md:flex-row items-center gap-8 border-primary/10">
                  <div className={`w-full md:w-1/3 aspect-video rounded-lg bg-surface-container shadow-2xl relative flex items-center justify-center ${iconColors(mostRecentProject.icon).bg}`}>
                    <span className={`material-symbols-outlined text-[64px] ${iconColors(mostRecentProject.icon).text}`}>
                      {mostRecentProject.icon || "layers"}
                    </span>
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Last Updated</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <span className="material-symbols-outlined text-sm">history</span>
                      <span className="font-label-caps text-[11px] tracking-widest font-bold">CONTINUE WORKING</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-white mb-3">{mostRecentProject.name}</h3>
                    <p className="text-on-surface-variant font-body-sm text-body-sm mb-6 max-w-xl">
                      {mostRecentProject.description || "No description yet."} Updated {relativeTime(mostRecentProject.$updatedAt)}.
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/project/${mostRecentProject.$id}`);
                        }}
                        className="bg-primary text-on-primary px-6 py-2.5 rounded font-bold text-sm flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                      >
                        Resume Session
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            <div className="md:col-span-4 space-y-gutter">
              <div className="flex items-center justify-between">
                <h4 className="font-headline-md text-headline-md text-white">Pinned</h4>
              </div>
              <div className="space-y-4">
                {loading && (
                  <>
                    <div className="glass p-4 rounded-xl h-[72px] animate-pulse" />
                    <div className="glass p-4 rounded-xl h-[72px] animate-pulse" />
                  </>
                )}
                {!loading &&
                  pinnedProjects.map((project) => {
                    const colors = iconColors(project.icon);
                    return (
                      <div
                        key={project.$id}
                        onClick={() => navigate(`/project/${project.$id}`)}
                        className="glass glass-hover p-4 rounded-xl flex items-center gap-4 transition-all group cursor-pointer project-card elevate-sm lift-hover hover:elevate-md"
                      >
                        <div className={`w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center ${colors.text} border border-outline-variant/20 group-hover:border-primary/50 transition-colors`}>
                          <span className="material-symbols-outlined text-[28px]">{project.icon || "layers"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{project.name}</p>
                          <p className="text-xs text-on-surface-variant truncate">{relativeTime(project.$updatedAt)}</p>
                        </div>
                        <span
                          onClick={(e) => handlePinToggle(e, project)}
                          className="material-symbols-outlined text-primary text-[20px] hover:scale-110 transition-transform"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          push_pin
                        </span>
                      </div>
                    );
                  })}
                {!loading && pinnedProjects.length === 0 && (
                  <div className="glass p-4 rounded-xl flex items-center gap-4 border-dashed border-outline-variant/30">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-outline-variant">
                      <span className="material-symbols-outlined text-[28px]">push_pin</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-outline-variant">No pinned projects yet</p>
                      <p className="text-xs text-on-surface-variant">Pin one from Recent Projects</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="md:col-span-8 space-y-gutter">
              <div className="flex items-center justify-between">
                <h4 className="font-headline-md text-headline-md text-white">Recent Projects</h4>
                <div className="flex items-center gap-2">
                  <div className="flex bg-surface-container-low rounded-lg p-1 border border-outline-variant/10">
                    <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-surface-variant text-primary" : "text-on-surface-variant hover:text-on-surface"}`}>
                      <span className="material-symbols-outlined text-[18px]">grid_view</span>
                    </button>
                    <button onClick={() => setViewMode("list")} className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-surface-variant text-primary" : "text-on-surface-variant hover:text-on-surface"}`}>
                      <span className="material-symbols-outlined text-[18px]">list</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-6" : "flex flex-col gap-3"}>
                {loading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={viewMode === "grid" ? "glass rounded-xl p-6 h-[200px] animate-pulse" : "glass rounded-xl h-16 animate-pulse"} />
                  ))}

                {!loading && error && (
                  <div className="sm:col-span-2 glass rounded-xl p-8 text-center border-error/30">
                    <p className="text-error font-medium mb-1">Couldn't load projects</p>
                    <p className="text-xs text-on-surface-variant mb-4">{error}</p>
                    <button onClick={refetch} className="text-primary text-sm font-bold hover:underline">
                      Try again
                    </button>
                  </div>
                )}

                {!loading && !error && recentProjects.length === 0 && pinnedProjects.length === 0 && (
                  <div className="sm:col-span-2 glass rounded-xl p-10 text-center">
                    <p className="text-white font-medium mb-1">No projects yet</p>
                    <p className="text-xs text-on-surface-variant mb-4">Create your first workspace to get started.</p>
                    <button
                      onClick={openCreateModal}
                      className="bg-primary text-on-primary px-5 py-2 rounded font-bold text-sm hover:brightness-110 active:scale-95 transition-all"
                    >
                      Create Project
                    </button>
                  </div>
                )}

                {!loading &&
                  !error &&
                  viewMode === "grid" &&
                  recentProjects.map((project) => {
                    const colors = iconColors(project.icon);
                    return (
                      <div
                        key={project.$id}
                        onClick={() => navigate(`/project/${project.$id}`)}
                        className="glass glass-hover rounded-xl p-6 transition-all group flex flex-col h-[200px] cursor-pointer relative project-card elevate-sm lift-hover hover:elevate-md"
                      >
                        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handlePinToggle(e, project)}
                            className="w-7 h-7 rounded-lg bg-surface-container-highest/80 flex items-center justify-center text-on-surface-variant hover:text-primary"
                            title="Pin"
                          >
                            <span className="material-symbols-outlined text-[16px]">push_pin</span>
                          </button>
                          <button
                            onClick={(e) => openEditModal(e, project)}
                            className="w-7 h-7 rounded-lg bg-surface-container-highest/80 flex items-center justify-center text-on-surface-variant hover:text-primary"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, project)}
                            className="w-7 h-7 rounded-lg bg-surface-container-highest/80 flex items-center justify-center text-on-surface-variant hover:text-error"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                        <div className="flex justify-between items-start mb-auto">
                          <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center ${colors.text}`}>
                            <span className="material-symbols-outlined text-[32px]">{project.icon || "layers"}</span>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-bold text-lg text-white mb-1 truncate">{project.name}</h5>
                          {project.description && (
                            <p className="text-xs text-on-surface-variant truncate mb-1">{project.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-on-surface-variant">{relativeTime(project.$updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {!loading &&
                  !error &&
                  viewMode === "list" &&
                  recentProjects.map((project) => {
                    const colors = iconColors(project.icon);
                    return (
                      <div
                        key={project.$id}
                        onClick={() => navigate(`/project/${project.$id}`)}
                        className="glass glass-hover rounded-xl px-4 py-3 transition-all group flex items-center gap-4 cursor-pointer"
                      >
                        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text} flex-shrink-0`}>
                          <span className="material-symbols-outlined text-[22px]">{project.icon || "layers"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-sm text-white truncate">{project.name}</h5>
                          {project.description && (
                            <p className="text-xs text-on-surface-variant truncate">{project.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-on-surface-variant flex-shrink-0 hidden sm:block">{relativeTime(project.$updatedAt)}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={(e) => handlePinToggle(e, project)} className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary" title="Pin">
                            <span className="material-symbols-outlined text-[16px]">push_pin</span>
                          </button>
                          <button onClick={(e) => openEditModal(e, project)} className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary" title="Edit">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button onClick={(e) => handleDelete(e, project)} className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error" title="Delete">
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {!loading && !error && (recentProjects.length > 0 || pinnedProjects.length > 0) && (
                  <div
                    onClick={openCreateModal}
                    className={
                      viewMode === "grid"
                        ? "glass glass-hover rounded-xl p-6 transition-all group flex flex-col h-[200px] border-dashed border-outline-variant/30 items-center justify-center text-center cursor-pointer"
                        : "glass glass-hover rounded-xl px-4 py-3 transition-all group flex items-center gap-4 border-dashed border-outline-variant/30 cursor-pointer"
                    }
                  >
                    <div className={viewMode === "grid" ? "w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform" : "w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary flex-shrink-0"}>
                      <span className="material-symbols-outlined text-[24px]">add_circle</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-sm sm:text-lg text-white">Create New Project</h5>
                      {viewMode === "grid" && <p className="text-xs text-on-surface-variant px-4">Start a blank workspace</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <section className="mt-gutter grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="glass rounded-xl p-5 border-l-2 border-l-primary">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Workspaces</p>
              <p className="text-2xl font-code-sm text-on-surface mt-1">
                {String(allProjects.length).padStart(2, "0")}
                <span className="text-xs font-body-sm text-on-surface-variant ml-2">
                  {pinnedProjects.length > 0 ? `${pinnedProjects.length} pinned` : "none pinned"}
                </span>
              </p>
            </div>
            <div className="glass rounded-xl p-5 border-l-2 border-l-secondary">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Last Touched</p>
              <p className="text-2xl font-code-sm text-on-surface mt-1 truncate">
                {mostRecentProject ? relativeTime(mostRecentProject.$updatedAt) : "—"}
                {mostRecentProject && (
                  <span className="text-xs font-body-sm text-on-surface-variant ml-2 truncate">{mostRecentProject.name}</span>
                )}
              </p>
            </div>
            <div className="glass rounded-xl p-5 border-l-2 border-l-tertiary">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Moved This Week</p>
              <p className="text-2xl font-code-sm text-on-surface mt-1">
                {String(updatedThisWeek).padStart(2, "0")}
                <span className="text-xs font-body-sm text-on-surface-variant ml-2">of {allProjects.length} total</span>
              </p>
            </div>
          </section>
        </div>
        <footer className="mt-auto h-12 border-t border-outline-variant/10 px-gutter flex items-center justify-between text-[11px] font-medium text-on-surface-variant uppercase tracking-widest">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${error ? "bg-error" : loading ? "bg-secondary animate-pulse" : "bg-primary"}`}></span>
              <span>{error ? "Error" : loading ? "Syncing" : "Ready"}</span>
            </div>
            <span>Session: {formatUptime(uptimeSeconds)}</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Synced {lastSyncedAt ? relativeTime(lastSyncedAt) : "—"}</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]" data-icon="person">person</span>
              {user?.name || user?.email || "—"}
            </span>
          </div>
        </footer>
      </main>
      <div
        onClick={openSharedVSCode}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all z-50 group"
        id="command-trigger"
      >
        <span className="material-symbols-outlined text-[28px]" data-icon="terminal" style={{fontVariationSettings: "'FILL' 1"}}>terminal</span>
        <div className="absolute right-full mr-4 bg-surface-container-high border border-outline-variant/20 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          <span className="font-label-caps text-[10px] font-bold text-white">Open Terminal (⌘ + `)</span>
        </div>
      </div>
    </>
  );
}