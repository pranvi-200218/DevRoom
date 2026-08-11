import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";

/**
 * DevRoom OS — public landing page.
 * Every feature named below is real and shipped: Teams-based permissions,
 * shareable invite links, live notifications, real-time chat, AI workspace
 * (Groq/llama-3.3-70b), resource vault, activity feed. Nothing fictional.
 *
 * Drop this in at src/pages/Landing.jsx and add a public route above the
 * RequireAuth boundary in App.jsx, e.g.:
 *   <Route path="/welcome" element={<Landing />} />
 * (RequireAuth currently wraps the whole router, so this page needs to sit
 * outside that wrapper, or RequireAuth needs a public-path allowlist.)
 *
 * ICONS: this page uses Font Awesome (<i className="fa-solid fa-...">).
 * Add the CDN link to index.html's <head>, right under your existing
 * Material Symbols / Geist font links:
 *   <link rel="stylesheet"
 *     href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css" />
 * (Only this page needs it — your other pages still use Material Symbols,
 * so both fonts can load side by side without conflict.)
 */

// Tailwind's JIT scanner can't see classes built from template strings like
// `bg-${accent}/10`, so accent styling is mapped to full static class names.
const ACCENTS = {
  primary: { icon: "text-primary", chip: "bg-primary/10" },
  secondary: { icon: "text-secondary", chip: "bg-secondary/10" },
};

const FEATURES = [
  {
    icon: "fa-solid fa-user-shield",
    accent: "primary",
    title: "Teams-Based Permissions",
    body: "Access control built on Appwrite Teams, not per-document ACLs — every member's role is enforced at the platform level, not patched together client-side.",
  },
  {
    icon: "fa-solid fa-link",
    accent: "secondary",
    title: "One-Click Invite Links",
    body: "Share a single link, not a form. New members land in /join, get auto-verified against pending invites, and self-heal into the right team even if they sign up out of order.",
  },
  {
    icon: "fa-solid fa-bell",
    accent: "primary",
    title: "Real-Time Notifications",
    body: "A live WebSocket feed — role changes, new members, and project activity land instantly via a dedicated notifications collection, not a polling hack.",
  },
  {
    icon: "fa-solid fa-comments",
    accent: "secondary",
    title: "Team Chat",
    body: "Per-project chat rooms so discussion stays attached to the work, not scattered across five other apps.",
  },
  {
    icon: "fa-solid fa-robot",
    accent: "primary",
    title: "AI Workspace",
    body: "An in-app assistant running on Groq's llama-3.3-70b — ask questions about the project without leaving the workspace.",
  },
  {
    icon: "fa-solid fa-box-archive",
    accent: "secondary",
    title: "Resource Vault",
    body: "Per-member file storage via Appwrite Storage — specs, assets, and links live next to the project they belong to.",
  },
];

const STACK = [
  { name: "React", icon: "fa-brands fa-react" },
  { name: "Appwrite", icon: "fa-solid fa-server" },
  { name: "Tailwind CSS", icon: "fa-solid fa-swatchbook" },
  { name: "Groq / Llama 3.3", icon: "fa-solid fa-bolt" },
  { name: "WebSockets", icon: "fa-solid fa-arrows-rotate" },
  { name: "Vercel", icon: "fa-solid fa-rocket" },
];

const STEPS = [
  { n: "01", title: "Create a workspace", body: "Sign in and spin up a project in seconds." },
  { n: "02", title: "Invite your team", body: "Send a link. Roles and access sync automatically on signup." },
  { n: "03", title: "Work in one place", body: "Chat, AI workspace, and resource vault — no context switching." },
  { n: "04", title: "Track everything", body: "A live activity feed keeps the whole team in sync." },
];

export default function Landing() {
  const navigate = useNavigate();
  const heroRef = useRef(null);

  useEffect(() => {
    if (!heroRef.current) return;
    const els = heroRef.current.querySelectorAll(".hero-in");
    gsap.fromTo(
      els,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" }
    );
  }, []);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-lg overflow-x-hidden">
      {/* ---------- NAV ---------- */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-white/5">
        <div className="h-16 max-w-container-max mx-auto px-margin-mobile lg:px-margin-desktop flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-terminal text-primary text-[20px]" />
            <span className="font-headline-md text-[18px] tracking-tight text-on-surface">DevRoom<span className="text-primary"> OS</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-body-sm text-on-surface-variant hover:text-on-surface transition-colors">Features</a>
            <a href="#workflow" className="text-body-sm text-on-surface-variant hover:text-on-surface transition-colors">How it works</a>
            <a href="#stack" className="text-body-sm text-on-surface-variant hover:text-on-surface transition-colors">Stack</a>
            <a
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-body-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1"
            >
              <i className="fa-solid fa-code-branch text-[14px]" /> Source
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="hidden sm:block text-body-sm text-on-surface-variant hover:text-on-surface px-3"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-caps text-label-caps hover:bg-primary-fixed-dim transition-all shadow-[0_0_20px_rgba(47,217,244,0.2)]"
            >
              Open Workspace
            </button>
          </div>
        </div>
      </header>

      {/* ---------- HERO ---------- */}
      <section ref={heroRef} className="relative pt-40 pb-24 px-margin-mobile lg:px-margin-desktop max-w-container-max mx-auto flex flex-col items-center text-center">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/15 blur-[130px] rounded-full" />
          <div className="absolute top-24 right-10 w-[350px] h-[350px] bg-secondary/10 blur-[110px] rounded-full" />
        </div>

        <p className="hero-in font-code-sm text-[13px] text-primary tracking-[0.15em] uppercase mb-5">
          A real-time workspace for dev teams
        </p>

        <h1 className="hero-in font-headline-lg text-[38px] md:text-[64px] leading-[1.08] tracking-tight max-w-4xl">
          Stop losing track of who did <span className="text-primary">what</span>, and when.
        </h1>

        <p className="hero-in font-body-lg text-[17px] md:text-[19px] text-on-surface-variant max-w-2xl mt-6 leading-relaxed">
          DevRoom OS is a real-time collaboration platform — invite links, live permissions,
          team chat, and an AI workspace, built on Appwrite Teams instead of brittle per-user ACLs.
        </p>

        <div className="hero-in flex flex-col sm:flex-row gap-4 mt-10">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-primary text-on-primary px-7 py-3.5 rounded-lg font-label-caps text-label-caps hover:bg-primary-fixed-dim transition-all shadow-[0_0_25px_rgba(47,217,244,0.25)] flex items-center gap-2 group"
          >
            Launch Workspace
            <i className="fa-solid fa-arrow-right text-[14px] group-hover:translate-x-1 transition-transform" />
          </button>
          <a
            href="#features"
            className="bg-surface-container-high/60 text-on-surface px-7 py-3.5 rounded-lg font-label-caps text-label-caps hover:bg-surface-container-highest transition-all border border-white/5 flex items-center gap-2"
          >
            <i className="fa-solid fa-eye text-[15px]" />
            See what's built
          </a>
        </div>

        {/* Product frame — swap the inner div's background for a real dashboard screenshot */}
        <div className="hero-in relative w-full max-w-5xl mt-20 rounded-2xl border border-white/10 bg-surface-container-highest shadow-2xl overflow-hidden">
          <div className="h-10 border-b border-white/5 bg-surface/60 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-error/70" />
            <div className="w-3 h-3 rounded-full bg-secondary/70" />
            <div className="w-3 h-3 rounded-full bg-primary/70" />
            <div className="ml-4 flex-1 h-6 bg-black/20 rounded border border-white/5 flex items-center justify-center">
              <span className="font-code-sm text-[11px] text-on-surface-variant">devroom.app/project/nexus</span>
            </div>
          </div>
          {/* Replace with an actual <img src="/screenshots/dashboard.png" /> of your dashboard */}
          <div className="w-full aspect-[16/8] bg-gradient-to-br from-surface-container-high to-surface-container-lowest flex items-center justify-center">
            <span className="font-code-sm text-[13px] text-on-surface-variant/60">[ dashboard screenshot goes here ]</span>
          </div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section id="features" className="py-24 px-margin-mobile lg:px-margin-desktop max-w-container-max mx-auto border-t border-white/5">
        <div className="flex flex-col items-start gap-3 mb-14">
          <span className="font-code-sm text-primary uppercase tracking-widest text-[12px]">What's actually built</span>
          <h2 className="font-headline-lg text-[28px] md:text-[42px] tracking-tight">Every feature below ships in the live app.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-surface-container-high rounded-2xl p-7 border border-white/5 hover:border-white/10 hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-11 h-11 rounded-xl ${ACCENTS[f.accent].chip} flex items-center justify-center mb-5`}>
                <i className={`${f.icon} ${ACCENTS[f.accent].icon} text-[19px]`} />
              </div>
              <h3 className="font-headline-md text-[18px] mb-2">{f.title}</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="workflow" className="py-24 px-margin-mobile lg:px-margin-desktop max-w-container-max mx-auto border-t border-white/5">
        <div className="flex flex-col items-center text-center gap-3 mb-16">
          <span className="font-code-sm text-primary uppercase tracking-widest text-[12px]">Workflow</span>
          <h2 className="font-headline-lg text-[28px] md:text-[42px] tracking-tight">From sign-in to shipped, in four steps.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          <div className="hidden lg:block absolute top-6 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
          {STEPS.map((s) => (
            <div key={s.n} className="flex flex-col gap-3 relative z-10">
              <span className="font-headline-md text-primary text-[22px]">{s.n}</span>
              <h3 className="font-headline-md text-[17px]">{s.title}</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- STACK ---------- */}
      <section id="stack" className="py-20 px-margin-mobile lg:px-margin-desktop max-w-container-max mx-auto border-t border-white/5">
        <div className="flex flex-col items-start gap-3 mb-10">
          <span className="font-code-sm text-primary uppercase tracking-widest text-[12px]">Under the hood</span>
          <h2 className="font-headline-lg text-[24px] md:text-[32px] tracking-tight">Built with</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {STACK.map((t) => (
            <div
              key={t.name}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-high border border-white/5 font-code-sm text-[13px] text-on-surface-variant"
            >
              <i className={`${t.icon} text-primary text-[14px]`} />
              {t.name}
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="py-24 px-margin-mobile lg:px-margin-desktop max-w-container-max mx-auto border-t border-white/5">
        <div className="rounded-2xl bg-surface-container-high border border-white/5 p-12 md:p-16 flex flex-col items-center text-center gap-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <h2 className="font-headline-lg text-[26px] md:text-[38px] tracking-tight relative z-10">See it running.</h2>
          <p className="font-body-sm text-on-surface-variant max-w-lg relative z-10">
            Open the live workspace or check the source — every feature on this page is real code, not a mockup.
          </p>
          <div className="flex gap-4 relative z-10">
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-primary text-on-primary px-7 py-3 rounded-lg font-label-caps text-label-caps hover:bg-primary-fixed-dim transition-all shadow-[0_0_20px_rgba(47,217,244,0.2)]"
            >
              Launch Workspace
            </button>
            <a
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface-container-highest text-on-surface px-7 py-3 rounded-lg font-label-caps text-label-caps border border-white/10 hover:bg-surface-variant transition-all"
            >
              View Source
            </a>
          </div>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-white/5 py-10 px-margin-mobile lg:px-margin-desktop max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="font-headline-md text-[15px] text-on-surface-variant">DevRoom<span className="text-primary"> OS</span></span>
        <span className="font-body-sm text-on-surface-variant/60 text-[13px]">Built by Pranvi Srivastava.</span>
      </footer>
    </div>
  );
}