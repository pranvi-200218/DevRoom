import { createContext, useCallback, useContext, useRef, useState } from "react";
import { gsap } from "gsap";
import { mi } from "../lib/icons";

const ToastContext = createContext(null);

const ICONS = {
  success: { icon: "check_circle", color: "text-tertiary" },
  error: { icon: "error", color: "text-error" },
  info: { icon: "info", color: "text-primary" },
};

/**
 * App-wide toast system. Wrap <App/> (or UserProvider) with <ToastProvider>,
 * then anywhere call:
 *   const toast = useToast();
 *   toast.show("Member removed", { type: "success" });
 * Replaces native alert()/confirm() feedback with an animated, non-blocking
 * slide-in — native browser alerts read as unfinished in a portfolio app.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback((message, opts = {}) => {
    const id = ++idRef.current;
    const type = opts.type || "info";
    const duration = opts.duration ?? 3200;
    setToasts((t) => [...t, { id, message, type }]);
    if (duration > 0) setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);

  return (
    <ToastContext.Provider value={{ show, remove }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-[400] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const ref = useRef(null);
  const meta = ICONS[toast.type] || ICONS.info;

  const enter = useCallback((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, x: 40, scale: 0.96 },
      { opacity: 1, x: 0, scale: 1, duration: 0.35, ease: "back.out(1.6)" }
    );
  }, []);

  const close = () => {
    gsap.to(ref.current, { opacity: 0, x: 40, scale: 0.96, duration: 0.25, ease: "power2.in", onComplete: onDismiss });
  };

  return (
    <div
      ref={(el) => { ref.current = el; if (el && !el.dataset.animated) { el.dataset.animated = "1"; enter(el); } }}
      className="glass rounded-xl px-4 py-3 flex items-start gap-3 shadow-lg pointer-events-auto border border-outline-variant/10"
    >
      <i className={`${mi(meta.icon)} ${meta.color} text-[20px] flex-shrink-0 mt-0.5`} />
      <p className="font-body-sm text-body-sm text-on-surface flex-1">{toast.message}</p>
      <button onClick={close} className="text-on-surface-variant hover:text-on-surface flex-shrink-0">
        <i className={`${mi("close")} text-[16px]`} />
      </button>
    </div>
  );
}