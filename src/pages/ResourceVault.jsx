import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import usePageEntrance from "../hooks/usePageEntrance";
import { useResources } from "../hooks/useResources";
import { useProject } from "../hooks/useProjects";
import { useUser, useAuth } from "../context/UserContext";
import { relativeTime, formatBytes, isRecent, fileVisual } from "../lib/format";
import NotificationBell from "../components/NotificationBell";
import FilePreviewModal from "../components/FilePreviewModal";
import { SkeletonGrid, SkeletonFileCard, SkeletonFileRow } from "../components/Skeleton";
import { mi } from "../lib/icons";

export default function ResourceVault() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { project } = useProject(projectId);
  usePageEntrance();
  const currentUser = useUser();
  const { logout } = useAuth();
  const [currentFolder, setCurrentFolder] = useState(null);
  const {
    folders,
    files,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    totalBytes,
    createFolder,
    uploadFile,
    deleteFile,
    deleteFolder,
    getFileUrl,
  } = useResources(projectId, currentFolder?.id || null);

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [previewFile, setPreviewFile] = useState(null);

  async function handleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        await uploadFile(file);
      }
    } catch (err) {
      alert(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateFolder() {
    const name = window.prompt("Folder name");
    if (!name || !name.trim()) return;
    try {
      await createFolder(name.trim());
    } catch (err) {
      alert(err.message || "Failed to create folder.");
    }
  }

  async function handleDeleteFile(e, file) {
    e.stopPropagation();
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    try {
      await deleteFile(file);
    } catch (err) {
      alert(err.message || "Failed to delete file.");
    }
  }

  async function handleLogout() {
    if (!window.confirm("Log out of DevRoom OS?")) return;
    await logout();
  }

  const recentFiles = files.filter((f) => isRecent(f.$createdAt));
  const olderFiles = files.filter((f) => !isRecent(f.$createdAt));

  return (
    <>
    <aside className="gsap-sidebar w-sidebar-width h-screen fixed left-0 top-0 bg-surface-container-low dark:bg-surface-container-low border-r border-outline-variant/10 flex flex-col h-full py-6 px-4 z-50">
        <div className="mb-10 px-2">
            <h1 className="font-headline-md text-headline-md font-bold text-primary dark:text-primary">DevRoom OS</h1>
            <p className="font-body-sm text-body-sm opacity-50">Engineering Workspace</p>
        </div>
        <nav className="flex-1 space-y-1">
            <div onClick={() => navigate(`/project/${projectId}/chat`)} className="cursor-pointer active:scale-95 duration-200 flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors font-body-sm text-body-sm">
                <i className={`${mi("chat")}`} />
                <span>Chat</span>
            </div>
            <div onClick={() => navigate(`/project/${projectId}/ai`)} className="cursor-pointer active:scale-95 duration-200 flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors font-body-sm text-body-sm">
                <i className={`${mi("smart_toy")}`} />
                <span>AI Assistant</span>
            </div>
            <div className="cursor-pointer active:scale-95 duration-200 flex items-center gap-3 px-3 py-2 bg-surface-container-highest text-primary font-medium rounded-lg font-body-sm text-body-sm">
                <i className={`${mi("folder_open")}`} style={{fontVariationSettings: "'FILL' 1"}} />
                <span>Resources</span>
            </div>
        </nav>
        <div className="pt-6 border-t border-outline-variant/10 space-y-1">
            <div onClick={() => navigate(`/project/${projectId}/settings`)} className="cursor-pointer active:scale-95 duration-200 flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors font-body-sm text-body-sm">
                <i className={`${mi("settings")}`} />
                <span>Settings</span>
            </div>
            <div onClick={handleLogout} className="cursor-pointer active:scale-95 duration-200 flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors font-body-sm text-body-sm">
                <i className={`${mi("logout")}`} />
                <span>Log out</span>
            </div>
        </div>
    </aside>
    <main className="ml-sidebar-width min-h-screen bg-background">
        <header className="gsap-topbar flex justify-between items-center h-16 px-gutter sticky top-0 bg-surface/80 dark:bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 z-40">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="text-on-surface-variant font-label-caps text-label-caps">{project?.name || "Project"}</span>
                    <span className="text-outline-variant">/</span>
                    <span className="text-primary font-bold font-label-caps text-label-caps">{project ? `Updated ${relativeTime(project.$updatedAt)}` : ""}</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative group">
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-surface-container-lowest border-none rounded-lg py-2 pl-10 pr-4 text-body-sm focus:ring-1 focus:ring-primary w-64 transition-all" placeholder="Search resources..." type="text" />
                    <i className={`${mi("search")} absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]`} />
                </div>
                <div className="flex items-center gap-2">
                    <i className={`${mi("account_tree")} text-outline-variant/50 p-2`} title="Workspace" />
                    <i className={`${mi("cloud_done")} text-primary/60 p-2`} title="All changes saved" />
                    <NotificationBell />
                    <div className="w-8 h-8 rounded-full bg-surface-variant ml-2 overflow-hidden border border-outline-variant/20">
                        {currentUser.avatarUrl ? (
                          <img className="w-full h-full object-cover" alt={currentUser.name} src={currentUser.avatarUrl} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary font-bold text-xs">
                            {(currentUser.name || "?")[0].toUpperCase()}
                          </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
        <section className="px-gutter pt-8 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                  {currentFolder ? currentFolder.name : "Resource Hub"}
                </h2>
                {currentFolder && (
                  <button onClick={() => setCurrentFolder(null)} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <i className={`${mi("arrow_back")} text-[16px]`} /> Back to root
                  </button>
                )}
                <div className="flex items-center gap-2 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/10">
                    <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-surface-variant text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>
                      <i className={`${mi("grid_view")} text-[20px]`} />
                    </button>
                    <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-surface-variant text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>
                      <i className={`${mi("list")} text-[20px]`} />
                    </button>
                </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-caps text-label-caps hover:bg-primary-container transition-colors shadow-lg shadow-primary/10 active:scale-95 disabled:opacity-50">
              <i className={`${mi("upload_file")} text-[18px]`} />
                {uploading ? "UPLOADING…" : "UPLOAD RESOURCE"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
        </section>
        <div className="px-gutter pb-12 space-y-8">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
{!currentFolder && folders.map((folder) => (
  <div
    key={folder.$id}
    onClick={() => setCurrentFolder({ id: folder.$id, name: folder.name })}
    className="flex-shrink-0 w-48 p-4 rounded-xl file-card flex flex-col gap-3 group cursor-pointer relative"
  >
      <button
        onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete folder "${folder.name}"?`)) deleteFolder(folder.$id); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error transition-opacity"
      >
        <i className={`${mi("close")} text-[16px]`} />
      </button>
      <i className={`${mi("folder")} text-secondary text-[32px]`} />
      <div>
          <p className="font-body-sm text-body-sm font-medium text-on-surface truncate">{folder.name}</p>
      </div>
  </div>
))}
{!currentFolder && (
  <div onClick={handleCreateFolder} className="flex-shrink-0 w-48 p-4 rounded-xl file-card flex flex-col gap-3 group cursor-pointer">
      <i className={`${mi("create_new_folder")} text-on-surface-variant text-[32px]`} />
      <div className="flex items-center h-full">
          <p className="font-body-sm text-body-sm font-medium text-on-surface-variant">Create New</p>
      </div>
  </div>
)}
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer bg-surface-container-lowest/50 ${dragOver ? "border-primary bg-primary/5" : "border-outline-variant/30 hover:border-primary/50 hover:bg-primary/5"}`}
            >
                <i className={`${mi("cloud_upload")} text-on-surface-variant group-hover:text-primary transition-colors`} />
                <p className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface">Drag files here to upload or <span className="text-primary font-medium underline">browse</span></p>
            </div>
            <div>
                <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Recent Uploads
                </h3>
                {loading && <p className="text-sm text-on-surface-variant">Loading…</p>}
                {!loading && error && <p className="text-sm text-error">{error}</p>}
                {!loading && !error && recentFiles.length === 0 && (
                  <p className="text-sm text-on-surface-variant">No recent uploads. Drag a file above to get started.</p>
                )}
                {viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
{loading && Array.from({ length: 8 }).map((_, i) => <SkeletonFileCard key={i} />)}
{!loading && recentFiles.map((file) => {
  const visual = fileVisual(file.mimeType);
  const isImage = file.mimeType?.startsWith("image/");
  return (
    <div key={file.$id} onClick={() => setPreviewFile(file)} className="rounded-xl file-card recent-glow flex flex-col overflow-hidden group cursor-pointer">
        <div className="h-32 bg-surface-container-highest flex items-center justify-center p-4 relative overflow-hidden">
          {isImage ? (
            <img src={getFileUrl(file.storageFileId)} alt={file.name} className="w-full h-full object-cover" />
          ) : (
            <i className={`${mi(visual.icon)} text-[64px] ${visual.color} opacity-40`} />
          )}
        </div>
        <div className="p-4 flex flex-col gap-2">
            <div className="flex justify-between items-start">
                <span className={`px-2 py-0.5 rounded ${visual.bg} ${visual.color} font-code-sm text-[10px] uppercase font-bold`}>{visual.label}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={getFileUrl(file.storageFileId)} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="text-on-surface-variant hover:text-on-surface">
                    <i className={`${mi("download")} text-[18px]`} />
                  </a>
                  <button onClick={(e) => handleDeleteFile(e, file)} className="text-on-surface-variant hover:text-error">
                    <i className={`${mi("delete")} text-[18px]`} />
                  </button>
                </div>
            </div>
            <p className="font-body-sm text-body-sm font-medium text-on-surface truncate">{file.name}</p>
            <p className="font-code-sm text-code-sm text-on-surface-variant">{relativeTime(file.$createdAt)} • {formatBytes(file.size)}</p>
        </div>
    </div>
  );
})}
                </div>
                )}
                {viewMode === "list" && (
                <div className="space-y-2">
{loading && Array.from({ length: 5 }).map((_, i) => <SkeletonFileRow key={i} />)}
{!loading && recentFiles.map((file) => {
  const visual = fileVisual(file.mimeType);
  return (
    <div key={file.$id} onClick={() => setPreviewFile(file)} className="glass-panel-vault p-3 rounded-xl flex items-center justify-between hover:bg-surface-variant/20 transition-all group cursor-pointer">
        <div className="flex items-center gap-3 min-w-0">
            <i className={`${mi(visual.icon)} ${visual.color} text-[22px] flex-shrink-0`} />
            <div className="min-w-0">
                <p className="font-body-sm text-body-sm font-medium text-on-surface truncate">{file.name}</p>
                <p className="font-code-sm text-code-sm text-on-surface-variant">{relativeTime(file.$createdAt)} • {formatBytes(file.size)}</p>
            </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <a href={getFileUrl(file.storageFileId)} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="p-2 text-on-surface-variant hover:text-primary"><i className={`${mi("download")} text-[18px]`} /></a>
            <button onClick={(e) => handleDeleteFile(e, file)} className="p-2 text-on-surface-variant hover:text-error"><i className={`${mi("delete")} text-[18px]`} /></button>
        </div>
    </div>
  );
})}
                </div>
                )}
            </div>
            <div className="mt-12">
                <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-4">Internal Assets</h3>
                {!loading && !error && olderFiles.length === 0 && (
                  <p className="text-sm text-on-surface-variant">Nothing here yet.</p>
                )}
                <div className="space-y-2">
{loading && Array.from({ length: 4 }).map((_, i) => <SkeletonFileRow key={i} />)}
{!loading && olderFiles.map((file) => {
  const visual = fileVisual(file.mimeType);
  return (
    <div key={file.$id} onClick={() => setPreviewFile(file)} className="glass-panel-vault p-4 rounded-xl flex items-center justify-between hover:bg-surface-variant/20 transition-all cursor-pointer group">
        <div className="flex items-center gap-4">
            <i className={`${mi(visual.icon)} ${visual.color} text-[28px]`} />
            <div>
                <p className="font-body-sm text-body-sm font-medium text-on-surface">{file.name}</p>
                <p className="font-code-sm text-code-sm text-on-surface-variant">{relativeTime(file.$createdAt)} • {formatBytes(file.size)}</p>
            </div>
        </div>
        <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <a href={getFileUrl(file.storageFileId)} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="p-2 text-on-surface-variant hover:text-primary transition-colors"><i className={`${mi("download")} text-[20px]`} /></a>
            <button onClick={(e) => handleDeleteFile(e, file)} className="p-2 text-on-surface-variant hover:text-error transition-colors"><i className={`${mi("delete")} text-[20px]`} /></button>
        </div>
    </div>
  );
})}
                </div>
            </div>
        </div>
    </main>
    <FilePreviewModal
      file={previewFile}
      url={previewFile ? getFileUrl(previewFile.storageFileId) : null}
      onClose={() => setPreviewFile(null)}
    />
    <div className="fixed bottom-6 right-6 glass-panel-vault px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl z-50 border-primary/20">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#8aebff]"></div>
            <span className="font-code-sm text-code-sm text-on-surface">Storage: {formatBytes(totalBytes)} used</span>
        </div>
        <div className="w-px h-4 bg-outline-variant/30"></div>
        <div className="flex items-center gap-2">
            <i className={`${mi("sync")} text-on-surface-variant text-[18px]`} />
            <span className="font-code-sm text-code-sm text-on-surface-variant">Synced</span>
        </div>
    </div>
    </>
  );
}