import { useState, useLayoutEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { gsap } from "gsap";
import { account } from "../lib/appwrite";

// Landed on from the recovery email link: /reset-password?userId=...&secret=...
export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const userId = params.get("userId");
  const secret = params.get("secret");
  const cardRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current, { opacity: 0, y: 24, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" });
    });
    return () => ctx.revert();
  }, []);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!userId || !secret) {
      setError("This link is invalid or expired. Ask for a new invite.");
      return;
    }
    setSubmitting(true);
    try {
      await account.updateRecovery(userId, secret, password);
      setDone(true);
      setTimeout(() => (window.location.href = "/"), 1200);
    } catch (err) {
      setError(err.message || "Couldn't set your password. The link may have expired.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div ref={cardRef} className="glass rounded-xl p-8 w-full max-w-sm primary-glow text-center">
        <h2 className="font-headline-md text-headline-md text-white mb-2">Set your password</h2>
        <p className="text-sm text-on-surface-variant mb-6">
          You were invited to a DevRoom OS project. Set a password to activate your account.
        </p>
        {done ? (
          <p className="text-primary text-sm">Password set! Redirecting…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min 8 characters)"
              minLength={8}
              className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-sm text-center text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {error && <p className="text-error text-xs">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? "Please wait…" : "Set password & continue"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}