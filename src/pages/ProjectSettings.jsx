import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProject, useProjects } from "../hooks/useProjects";

const ICONS = ["layers", "api", "terminal", "auto_awesome", "database", "rocket_launch", "bolt"];

export default function ProjectSettings() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { project, loading, error } = useProject(projectId);
  const { updateProject, deleteProject } = useProjects();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("layers");
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState(null);

  if (project && !initialized) {
    setName(project.name || "");
    setDescription(project.description || "");
    setIcon(project.icon || "layers");
    setInitialized(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Project name is required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    setSaved(false);
    try {
      await updateProject(projectId, { name: name.trim(), description: description.trim(), icon });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setFormError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${project.name}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await deleteProject(projectId);
      navigate("/");
    } catch (err) {
      alert(err.message || "Failed to delete project.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="ml-sidebar-width min-h-screen flex items-center justify-center text-on-surface-variant">
        Loading settings…
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="ml-sidebar-width min-h-screen flex flex-col items-center justify-center gap-4 text-center px-8">
        <p className="text-white font-medium">Project not found</p>
        <p className="text-on-surface-variant text-sm max-w-sm">{error || "This project may have been deleted."}</p>
        <button
          onClick={() => navigate("/")}
          className="bg-primary text-on-primary px-5 py-2 rounded font-bold text-sm hover:brightness-110 active:scale-95 transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="ml-sidebar-width min-h-screen bg-background px-gutter py-10 max-w-2xl">
      <button onClick={() => navigate(`/project/${projectId}`)} className="text-xs text-primary hover:underline flex items-center gap-1 mb-6">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to {project.name}
      </button>

      <h1 className="font-headline-lg text-headline-lg text-white mb-1">Project Settings</h1>
      <p className="text-on-surface-variant text-sm mb-4">Manage this project's name, description, and icon.</p>

      <button
        onClick={() => navigate(`/project/${projectId}/members`)}
        className="flex items-center gap-2 text-xs text-on-surface-variant hover:text-primary mb-8 transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">group</span>
        Manage members →
      </button>

      <form onSubmit={handleSave} className="glass rounded-xl p-6 space-y-5 mb-8">
        <div>
          <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-2">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-2">Icon</label>
          <div className="flex gap-2 flex-wrap">
            {ICONS.map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => setIcon(i)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                  icon === i ? "border-primary bg-primary/10 text-primary" : "border-outline-variant/20 text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{i}</span>
              </button>
            ))}
          </div>
        </div>
        {formError && <p className="text-error text-xs">{formError}</p>}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-on-primary px-5 py-2 rounded font-bold text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {saved && <span className="text-primary text-xs font-medium">Saved.</span>}
        </div>
      </form>

      <div className="glass rounded-xl p-6 border border-error/20">
        <h3 className="text-error font-bold text-sm mb-1">Danger Zone</h3>
        <p className="text-on-surface-variant text-xs mb-4">
          Deleting a project removes it permanently. It does not currently delete its messages, files, or members —
          those become orphaned records tied to a project that no longer exists.
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="border border-error/40 text-error px-4 py-2 rounded text-sm font-bold hover:bg-error/10 transition-colors disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete Project"}
        </button>
      </div>
    </div>
  );
}