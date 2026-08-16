import { useRef, useState } from "react";
import { gsap } from "gsap";
import { useParams, useNavigate } from "react-router-dom";
import usePageEntrance from "../hooks/usePageEntrance";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/Dialog";
import { useProject, useProjects } from "../hooks/useProjects";
import { useUser } from "../context/UserContext";
import { syncProjectAccess } from "../lib/syncProjectAccess";
import { mi } from "../lib/icons";

const ICONS = ["layers", "api", "terminal", "auto_awesome", "database", "rocket_launch", "bolt"];

export default function ProjectSettings() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const currentUser = useUser();
  const toast = useToast();
  const confirm = useConfirm();
  const dangerZoneRef = useRef(null);
  const { project, loading, error } = useProject(projectId);
  usePageEntrance([loading]);
  const { updateProject, deleteProject } = useProjects();

  const isOwner = project?.ownerId === currentUser.$id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("layers");
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [repairing, setRepairing] = useState(false);
  const [repairResult, setRepairResult] = useState(null);

  async function handleRepairAccess() {
    setRepairing(true);
    setRepairResult(null);
    try {
      await syncProjectAccess(projectId);
      setRepairResult("Access permissions repaired successfully.");
      toast.show("Access permissions repaired.", { type: "success" });
    } catch (err) {
      setRepairResult(`Repair failed: ${err.message}`);
      toast.show("Repair failed.", { type: "error" });
    } finally {
      setRepairing(false);
    }
  }

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
      toast.show("Project settings saved.", { type: "success" });
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setFormError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  function shakeDangerZone() {
    if (!dangerZoneRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      dangerZoneRef.current,
      { x: 0 },
      { x: 10, duration: 0.08, repeat: 5, yoyo: true, ease: "power1.inOut", clearProps: "x" }
    );
  }

  async function handleDelete() {
    if (!isOwner) {
      shakeDangerZone();
      return;
    }
    const ok = await confirm({ title: `Delete "${project.name}"?`, message: "This can't be undone.", tone: "danger", confirmLabel: "Delete" });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteProject(projectId);
      navigate("/dashboard");
    } catch (err) {
      toast.show(err.message || "Failed to delete project.", { type: "error" });
      shakeDangerZone();
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
          onClick={() => navigate("/dashboard")}
          className="bg-primary text-on-primary px-5 py-2 rounded font-bold text-sm hover:brightness-110 active:scale-95 transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="gsap-panel ml-sidebar-width min-h-screen bg-background px-gutter py-10 max-w-2xl">
      <button onClick={() => navigate(`/project/${projectId}`)} className="text-xs text-primary hover:underline flex items-center gap-1 mb-6">
        <i className={`${mi("arrow_back")} text-[14px]`} /> Back to {project.name}
      </button>

      <h1 className="font-headline-lg text-headline-lg text-white mb-1">Project Settings</h1>
      <p className="text-on-surface-variant text-sm mb-4">Manage this project's name, description, and icon.</p>

      <button
        onClick={() => navigate(`/project/${projectId}/members`)}
        className="flex items-center gap-2 text-xs text-on-surface-variant hover:text-primary mb-8 transition-colors"
      >
        <i className={`${mi("group")} text-[14px]`} />
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
                <i className={`${mi(i)} text-[20px]`} />
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

      <div className="glass rounded-xl p-6 mb-8">
        <h3 className="font-bold text-sm mb-1 text-white">Repair Access</h3>
        <p className="text-on-surface-variant text-xs mb-4">
          If chat, AI, or files aren't loading for members (a leftover permissions issue), use this to
          force-recompute who can access this project and its data.
        </p>
        <button
          onClick={handleRepairAccess}
          disabled={repairing}
          className="border border-primary/40 text-primary px-4 py-2 rounded text-sm font-bold hover:bg-primary/10 transition-colors disabled:opacity-50"
        >
          {repairing ? "Repairing…" : "Repair Access"}
        </button>
        {repairResult && <p className="text-xs mt-3 text-on-surface-variant">{repairResult}</p>}
      </div>

      <div ref={dangerZoneRef} className="glass rounded-xl p-6 border border-error/20">
        <h3 className="text-error font-bold text-sm mb-1">Danger Zone</h3>
        <p className="text-on-surface-variant text-xs mb-4">
          Deleting a project removes it permanently. It does not currently delete its messages, files, or members —
          those become orphaned records tied to a project that no longer exists.
        </p>
        {!isOwner && (
          <p className="text-on-surface-variant text-xs mb-3 italic">
            Only the project owner can delete this project.
          </p>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting || !isOwner}
          title={!isOwner ? "Only the project owner can delete this project." : undefined}
          className="border border-error/40 text-error px-4 py-2 rounded text-sm font-bold hover:bg-error/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? "Deleting…" : "Delete Project"}
        </button>
      </div>
    </div>
  );
}