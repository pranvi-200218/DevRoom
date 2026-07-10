import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useResources } from "../hooks/useResources";
import { useProject } from "../hooks/useProjects";
import { relativeTime, formatBytes, isRecent, fileVisual } from "../lib/format";

export default function ResourceVault() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { project } = useProject(projectId);
  const [currentFolder, setCurrentFolder] = useState(null); // {id, name} | null
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

  const recentFiles = files.filter((f) => isRecent(f.$createdAt));
  const olderFiles = files.filter((f) => !isRecent(f.$createdAt));

  return (
    <>
    {/* Sidebar Navigation */}
    <aside className="w-sidebar-width h-screen fixed left-0 top-0 bg-surface-container-low dark:bg-surface-container-low border-r border-outline-variant/10 flex flex-col h-full py-6 px-4 z-50">
        <div className="mb-10 px-2">
            <h1 className="font-headline-md text-headline-md font-bold text-primary dark:text-primary">DevRoom OS</h1>
            <p className="font-body-sm text-body-sm opacity-50">Engineering Workspace</p>
        </div>
        <nav className="flex-1 space-y-1">
            <div onClick={() => navigate(`/project/${projectId}/chat`)} className="cursor-pointer active:scale-95 duration-200 flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors font-body-sm text-body-sm">
                <span className="material-symbols-outlined">chat</span>
                <span>Chat</span>
            </div>
            <div onClick={() => navigate(`/project/${projectId}/ai`)} className="cursor-pointer active:scale-95 duration-200 flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors font-body-sm text-body-sm">
                <span className="material-symbols-outlined">smart_toy</span>
                <span>AI Assistant</span>
            </div>
            <div className="cursor-pointer active:scale-95 duration-200 flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors font-body-sm text-body-sm">
                <span className="material-symbols-outlined">description</span>
                <span>Docs</span>
            </div>
            <div className="cursor-pointer active:scale-95 duration-200 flex items-center gap-3 px-3 py-2 bg-surface-container-highest text-primary font-medium rounded-lg font-body-sm text-body-sm">
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>folder_open</span>
                <span>Resources</span>
            </div>
            <div className="cursor-pointer active:scale-95 duration-200 flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors font-body-sm text-body-sm">
                <span className="material-symbols-outlined">send</span>
                <span>Submissions</span>
            </div>
        </nav>
        <div className="pt-6 border-t border-outline-variant/10 space-y-1">
            <div className="cursor-pointer active:scale-95 duration-200 flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors font-body-sm text-body-sm">
                <span className="material-symbols-outlined">settings</span>
                <span>Settings</span>
            </div>
            <div className="cursor-pointer active:scale-95 duration-200 flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors font-body-sm text-body-sm">
                <span className="material-symbols-outlined">notifications</span>
                <span>Notifications</span>
            </div>
        </div>
    </aside>
    {/* Main Content Canvas */}
    <main className="ml-sidebar-width min-h-screen bg-background">
        {/* Top Navigation */}
        <header className="flex justify-between items-center h-16 px-gutter sticky top-0 bg-surface/80 dark:bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 z-40">
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
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-all cursor-pointer">
<span className="material-symbols-outlined">account_tree</span>
</button>
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-all cursor-pointer">
<span className="material-symbols-outlined">cloud_done</span>
</button>
                    <div className="w-8 h-8 rounded-full bg-surface-variant ml-2 overflow-hidden border border-outline-variant/20">
                        <img className="w-full h-full object-cover" data-alt="Close-up portrait of a professional software engineer with glasses, looking focused against a dark background with subtle blue light bokeh. Professional and modern tech photography style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDost60FcqyQ_ogOSUxuBKb8AdC5Iu599437Ke-Ng-cV9Rn0GoZhG2FFRbhJjK6IqxiDxKeOVDJWJedB2P_XlD64oMOMvHRdTxlZFcKd_QkYqpmTAhKG4GIMPeeiROi4w-iu0cXRvma2nOkWw9hkuRfPTY40XIDnWIZXcklMoZ7KKMrSeqAla1RVea9N80eyOlrtGbbGqhE_kAH3-Rf4_50OqclhEk6t_Av2HYTC3hfWpsZMM3twvFGMAehaq7NkJwa8F6FFWDGiFo"
                        />
                    </div>
                </div>
            </div>
        </header>
        {/* View Controls & Breadcrumbs */}
        <section className="px-gutter pt-8 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                  {currentFolder ? currentFolder.name : "Resource Hub"}
                </h2>
                {currentFolder && (
                  <button onClick={() => setCurrentFolder(null)} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to root
                  </button>
                )}
                <div className="flex items-center gap-2 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/10">
                    <button className="p-1.5 bg-surface-variant text-primary rounded-md shadow-sm">
<span className="material-symbols-outlined text-[20px]">grid_view</span>
</button>
                    <button className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors">
<span className="material-symbols-outlined text-[20px]">list</span>
</button>
                </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-caps text-label-caps hover:bg-primary-container transition-colors shadow-lg shadow-primary/10 active:scale-95 disabled:opacity-50">
<span className="material-symbols-outlined text-[18px]">upload_file</span>
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
        {/* Content Area */}
        <div className="px-gutter pb-12 space-y-8">
            {/* Folder Hierarchy (Horizontal Scroll) */}
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
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
      <span className="material-symbols-outlined text-secondary text-[32px]">folder</span>
      <div>
          <p className="font-body-sm text-body-sm font-medium text-on-surface truncate">{folder.name}</p>
      </div>
  </div>
))}
{!currentFolder && (
  <div onClick={handleCreateFolder} className="flex-shrink-0 w-48 p-4 rounded-xl file-card flex flex-col gap-3 group cursor-pointer">
      <span className="material-symbols-outlined text-on-surface-variant text-[32px]">create_new_folder</span>
      <div className="flex items-center h-full">
          <p className="font-body-sm text-body-sm font-medium text-on-surface-variant">Create New</p>
      </div>
  </div>
)}
            </div>
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer bg-surface-container-lowest/50 ${dragOver ? "border-primary bg-primary/5" : "border-outline-variant/30 hover:border-primary/50 hover:bg-primary/5"}`}
            >
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">cloud_upload</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface">Drag files here to upload or <span className="text-primary font-medium underline">browse</span></p>
            </div>
            {/* Recent & Files Grid */}
            <div>
                <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Recent Uploads
                </h3>
                {loading && <p className="text-sm text-on-surface-variant">Loading…</p>}
                {!loading && error && <p className="text-sm text-error">{error}</p>}
                {!loading && !error && recentFiles.length === 0 && (
                  <p className="text-sm text-on-surface-variant">No recent uploads. Drag a file above to get started.</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
{recentFiles.map((file) => {
  const visual = fileVisual(file.mimeType);
  const isImage = file.mimeType?.startsWith("image/");
  return (
    <div key={file.$id} className="rounded-xl file-card recent-glow flex flex-col overflow-hidden group">
        <div className="h-32 bg-surface-container-highest flex items-center justify-center p-4 relative overflow-hidden">
          {isImage ? (
            <img src={getFileUrl(file.storageFileId)} alt={file.name} className="w-full h-full object-cover" />
          ) : (
            <span className={`material-symbols-outlined text-[64px] ${visual.color} opacity-40`}>{visual.icon}</span>
          )}
        </div>
        <div className="p-4 flex flex-col gap-2">
            <div className="flex justify-between items-start">
                <span className={`px-2 py-0.5 rounded ${visual.bg} ${visual.color} font-code-sm text-[10px] uppercase font-bold`}>{visual.label}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={getFileUrl(file.storageFileId)} target="_blank" rel="noreferrer" className="text-on-surface-variant hover:text-on-surface">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                  </a>
                  <button onClick={(e) => handleDeleteFile(e, file)} className="text-on-surface-variant hover:text-error">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
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
            </div>
            {/* Secondary List for older files */}
            <div className="mt-12">
                <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-4">Internal Assets</h3>
                {!loading && !error && olderFiles.length === 0 && (
                  <p className="text-sm text-on-surface-variant">Nothing here yet.</p>
                )}
                <div className="space-y-2">
{olderFiles.map((file) => {
  const visual = fileVisual(file.mimeType);
  return (
    <div key={file.$id} className="glass-panel-vault p-4 rounded-xl flex items-center justify-between hover:bg-surface-variant/20 transition-all cursor-pointer group">
        <div className="flex items-center gap-4">
            <span className={`material-symbols-outlined ${visual.color} text-[28px]`}>{visual.icon}</span>
            <div>
                <p className="font-body-sm text-body-sm font-medium text-on-surface">{file.name}</p>
                <p className="font-code-sm text-code-sm text-on-surface-variant">{relativeTime(file.$createdAt)} • {formatBytes(file.size)}</p>
            </div>
        </div>
        <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <a href={getFileUrl(file.storageFileId)} target="_blank" rel="noreferrer" className="p-2 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">download</span></a>
            <button onClick={(e) => handleDeleteFile(e, file)} className="p-2 text-on-surface-variant hover:text-error transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
        </div>
    </div>
  );
})}
                </div>
            </div>
        </div>
    </main>
    {/* Floating Tooltip/Status Bar */}
    <div className="fixed bottom-6 right-6 glass-panel-vault px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl z-50 border-primary/20">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#8aebff]"></div>
            <span className="font-code-sm text-code-sm text-on-surface">Storage: {formatBytes(totalBytes)} used</span>
        </div>
        <div className="w-px h-4 bg-outline-variant/30"></div>
        <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">sync</span>
            <span className="font-code-sm text-code-sm text-on-surface-variant">Synced</span>
        </div>
    </div>
    </>
  );
}
