import { useState } from "react";
import { useUser } from "../context/UserContext";

export default function NameCaptureGate({ children }) {
  const user = useUser();
  const [draft, setDraft] = useState("");

  if (user.hasName) return children;

  function handleSubmit(e) {
    e.preventDefault();
    user.setName(draft || "Team Member");
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="glass rounded-xl p-8 w-full max-w-sm primary-glow text-center">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-primary text-[24px]">waving_hand</span>
        </div>
        <h2 className="font-headline-md text-headline-md text-white mb-2">Welcome to DevRoom</h2>
        <p className="text-sm text-on-surface-variant mb-6">
          What should we call you?
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Your name"
            maxLength={40}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-sm text-center text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold text-sm hover:brightness-110 active:scale-95 transition-all"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}