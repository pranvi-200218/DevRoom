import { useState, useEffect } from "react";

const ICONS = ["layers", "api", "terminal", "auto_awesome", "database", "rocket_launch", "bolt"];

export default function ProjectFormModal({ initial, onClose, onSubmit, submitLabel }) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [icon, setIcon] = useState(initial?.icon || "layers");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Project name is required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit({ name: name.trim(), description: description.trim(), icon });
      onClose();
    } catch (err) {
      setFormError(err.message || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="glass rounded-xl p-6 w-full max-w-md primary-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-headline-md text-headline-md text-white mb-4">
          {initial ? "Edit Project" : "Create New Project"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-2">
              Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Quantum Engine"
              className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={3}
              className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-2">
              Icon
            </label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map((i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                    icon === i
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-outline-variant/20 text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{i}</span>
                </button>
              ))}
            </div>
          </div>

          {formError && <p className="text-error text-xs">{formError}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface text-sm font-medium px-4 py-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-on-primary px-5 py-2 rounded font-bold text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? "Saving…" : submitLabel || "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
