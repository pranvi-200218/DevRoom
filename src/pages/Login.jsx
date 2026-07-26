import { useState } from "react";
import { useAuth } from "../context/UserContext";

export default function Login() {
  const { signup, login } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    if (!email.trim() || !password) {
      setFormError("Email and password are required.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setFormError("Enter your name.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signup(email.trim(), password, name.trim());
      } else {
        await login(email.trim(), password);
      }
      // On success, UserProvider's auth state updates and the app re-renders past this screen.
    } catch (err) {
      setFormError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="glass rounded-xl p-8 w-full max-w-sm primary-glow text-center">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-primary text-[24px]">waving_hand</span>
        </div>
        <h2 className="font-headline-md text-headline-md text-white mb-2">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-sm text-on-surface-variant mb-6">
          {mode === "login" ? "Sign in to DevRoom OS." : "Set up your DevRoom OS account."}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={40}
              className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-sm text-center text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-sm text-center text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8 characters)"
            minLength={8}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-sm text-center text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {formError && <p className="text-error text-xs">{formError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {submitting ? "Please wait…" : mode === "login" ? "Sign In" : "Sign Up"}
          </button>
        </form>
        <button
          onClick={() => {
            setFormError(null);
            setMode((m) => (m === "login" ? "signup" : "login"));
          }}
          className="mt-4 text-xs text-primary hover:underline"
        >
          {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}