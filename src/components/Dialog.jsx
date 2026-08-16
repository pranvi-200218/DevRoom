import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { mi } from "../lib/icons";

const DialogContext = createContext(null);

/**
 * Replaces window.confirm() / window.prompt() app-wide with an animated,
 * on-brand modal instead of the native browser popup. Wrap the app once
 * with <DialogProvider>, then anywhere:
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "Remove member?", tone: "danger" }))) return;
 *
 *   const prompt = usePrompt();
 *   const name = await prompt({ title: "Folder name", placeholder: "e.g. Design assets" });
 *   if (name === null) return; // cancelled
 */
export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null); // { mode, title, message, tone, defaultValue, placeholder, resolve }

  const confirm = useCallback(
    ({ title = "Are you sure?", message, tone = "default", confirmLabel = "Confirm", cancelLabel = "Cancel" } = {}) =>
      new Promise((resolve) => {
        setDialog({ mode: "confirm", title, message, tone, confirmLabel, cancelLabel, resolve });
      }),
    []
  );

  const prompt = useCallback(
    ({ title = "Enter a value", message, defaultValue = "", placeholder = "", confirmLabel = "Save", cancelLabel = "Cancel" } = {}) =>
      new Promise((resolve) => {
        setDialog({ mode: "prompt", title, message, defaultValue, placeholder, confirmLabel, cancelLabel, resolve });
      }),
    []
  );

  function settle(value) {
    dialog?.resolve(value);
    setDialog(null);
  }

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}
      {dialog && <DialogModal dialog={dialog} onSettle={settle} />}
    </DialogContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useConfirm must be used inside <DialogProvider>");
  return ctx.confirm;
}

export function usePrompt() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("usePrompt must be used inside <DialogProvider>");
  return ctx.prompt;
}

function DialogModal({ dialog, onSettle }) {
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const [value, setValue] = useState(dialog.defaultValue || "");
  const isDanger = dialog.tone === "danger";

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set([backdropRef.current, panelRef.current], { opacity: 1, y: 0, scale: 1 });
    } else {
      const ctx = gsap.context(() => {
        gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
        gsap.fromTo(panelRef.current, { opacity: 0, y: 20, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "power3.out" });
      });
      return () => ctx.revert();
    }
    if (dialog.mode === "prompt") inputRef.current?.focus();
  }, [dialog.mode]);

  function close(result) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { onSettle(result); return; }
    gsap.to(panelRef.current, { opacity: 0, y: 12, scale: 0.97, duration: 0.18, ease: "power2.in" });
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.18, delay: 0.02, onComplete: () => onSettle(result) });
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") close(dialog.mode === "confirm" ? false : null);
    if (e.key === "Enter" && dialog.mode === "prompt") close(value);
  }

  return (
    <div
      ref={backdropRef}
      onClick={() => close(dialog.mode === "confirm" ? false : null)}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-[350] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl w-full max-w-sm p-6 border border-outline-variant/10"
      >
        <div className="flex items-start gap-3 mb-2">
          {isDanger && (
            <div className="w-9 h-9 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
              <i className={`${mi("warning")} text-error text-[18px]`} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">{dialog.title}</h3>
            {dialog.message && <p className="text-sm text-on-surface-variant mt-1">{dialog.message}</p>}
          </div>
        </div>

        {dialog.mode === "prompt" && (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={dialog.placeholder}
            className="w-full mt-3 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => close(dialog.mode === "confirm" ? false : null)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 transition-colors"
          >
            {dialog.cancelLabel}
          </button>
          <button
            onClick={() => close(dialog.mode === "confirm" ? true : value)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors active:scale-95 ${
              isDanger ? "bg-error text-on-error hover:brightness-110" : "bg-primary text-on-primary hover:brightness-110"
            }`}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}