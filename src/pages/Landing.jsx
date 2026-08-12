import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";

gsap.registerPlugin(ScrollTrigger, TextPlugin);

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
 *
 * GSAP: uses gsap + ScrollTrigger + TextPlugin, all bundled in the `gsap`
 * package you already have installed (^3.15). No extra install needed.
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
    tag: "role: owner | editor | viewer",
  },
  {
    icon: "fa-solid fa-link",
    accent: "secondary",
    title: "One-Click Invite Links",
    body: "Share a single link, not a form. New members land in /join, get auto-verified against pending invites, and self-heal into the right team even if they sign up out of order.",
    tag: "self-heals on out-of-order signup",
  },
  {
    icon: "fa-solid fa-bell",
    accent: "primary",
    title: "Real-Time Notifications",
    body: "A live WebSocket feed — role changes, new members, and project activity land instantly via a dedicated notifications collection, not a polling hack.",
    tag: "0 polling hacks",
  },
  {
    icon: "fa-solid fa-comments",
    accent: "secondary",
    title: "Team Chat",
    body: "Per-project chat rooms so discussion stays attached to the work, not scattered across five other apps.",
    tag: "scoped per project",
  },
  {
    icon: "fa-solid fa-robot",
    accent: "primary",
    title: "AI Workspace",
    body: "An in-app assistant running on Groq's llama-3.3-70b — ask questions about the project without leaving the workspace.",
    tag: "groq / llama-3.3-70b",
  },
  {
    icon: "fa-solid fa-box-archive",
    accent: "secondary",
    title: "Resource Vault",
    body: "Per-member file storage via Appwrite Storage — specs, assets, and links live next to the project they belong to.",
    tag: "appwrite storage",
  },
];

const STACK = [
  { name: "React + Vite", icon: "fa-brands fa-react", cat: "frontend", body: "Component tree for every workspace view — dashboard, chat, AI panel, vault — with Vite's HMR for fast local iteration." },
  { name: "Appwrite", icon: "fa-solid fa-server", cat: "backend", body: "Auth, database (6 collections), file storage, and Teams-based permissions — no custom backend server to maintain." },
  { name: "Realtime / WebSockets", icon: "fa-solid fa-arrows-rotate", cat: "realtime", body: "Powers live chat, typing indicators, presence, and the notification feed — subscriptions, not polling loops." },
  { name: "Groq · Llama 3.3 70B", icon: "fa-solid fa-bolt", cat: "ai", body: "Served via an Appwrite Cloud Function so the API key never touches the client — inference for the in-app AI workspace." },
  { name: "Tailwind CSS", icon: "fa-solid fa-swatchbook", cat: "styling", body: "Utility-first styling with a custom design-token config — colors, spacing, and typography scale defined once, reused everywhere." },
  { name: "Vercel", icon: "fa-solid fa-rocket", cat: "hosting", body: "Static frontend deploy with preview builds on every push — Appwrite Cloud handles everything stateful." },
];

const STEPS = [
  { n: "01", title: "Create a workspace", body: "Sign in and spin up a project in seconds.", icon: "fa-solid fa-square-plus" },
  { n: "02", title: "Invite your team", body: "Send a link. Roles and access sync automatically on signup.", icon: "fa-solid fa-paper-plane" },
  { n: "03", title: "Work in one place", body: "Chat, AI workspace, and resource vault — no context switching.", icon: "fa-solid fa-layer-group" },
  { n: "04", title: "Track everything", body: "A live activity feed keeps the whole team in sync.", icon: "fa-solid fa-chart-line" },
];

const STATS = [
  { value: 6, suffix: "", label: "Appwrite collections" },
  { value: 2, suffix: "", label: "Cloud Functions" },
  { value: 100, suffix: "%", label: "real-time sync" },
  { value: 0, suffix: "", label: "polling hacks" },
];

const ACTIVITY_LINES = [
  { icon: "fa-solid fa-user-plus", text: "priya joined #nexus-frontend", time: "2m" },
  { icon: "fa-solid fa-comment", text: "3 new messages in #general", time: "4m" },
  { icon: "fa-solid fa-file-arrow-up", text: "spec.md uploaded to vault", time: "9m" },
  { icon: "fa-solid fa-robot", text: "AI workspace answered 2 prompts", time: "14m" },
];

export default function Landing() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const heroRef = useRef(null);
  const codeLineRefs = useRef([]);
  const statRefs = useRef([]);
  const trackRef = useRef(null);

  const [terminalDone, setTerminalDone] = useState(false);

  // ---------------- HERO ----------------
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.set(".hero-in", { opacity: 0, y: 24 })
        .set(".hero-char", { opacity: 0, y: "0.6em", rotateX: -60 })
        .set(".hero-terminal", { opacity: 0, y: 30, scale: 0.97 })
        .to(".nav-in", { opacity: 1, y: 0, duration: 0.5, stagger: 0.04 }, 0.1)
        .to(".hero-eyebrow", { opacity: 1, y: 0, duration: 0.5 }, 0.25)
        .to(
          ".hero-char",
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.7,
            stagger: { each: 0.015, from: "start" },
          },
          0.35
        )
        .to(".hero-in", { opacity: 1, y: 0, duration: 0.7, stagger: 0.09 }, "-=0.5")
        .to(".hero-terminal", { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "power4.out" }, "-=0.5")
        .add(typeTerminal, "-=0.35");

      // floating hero orbs — slow ambient drift, purely decorative
      gsap.to(".hero-orb-1", {
        x: 40,
        y: -30,
        duration: 9,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(".hero-orb-2", {
        x: -30,
        y: 40,
        duration: 11,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // parallax on scroll for hero art
      gsap.to(".hero-parallax", {
        yPercent: 18,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, rootRef);

    function typeTerminal() {
      const lines = gsap.utils.toArray(".term-line");
      const tl = gsap.timeline({ onComplete: () => setTerminalDone(true) });
      lines.forEach((line, i) => {
        const full = line.dataset.text || line.textContent;
        tl.to(
          line,
          {
            duration: Math.max(0.3, full.length * 0.018),
            text: { value: full },
            ease: "none",
          },
          i === 0 ? undefined : "+=0.06"
        );
      });
    }

    return () => ctx.revert();
  }, []);

  // ---------------- SCROLL-DRIVEN SECTIONS ----------------
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Section eyebrow + heading reveals (used across sections)
      gsap.utils.toArray(".reveal-head").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
          }
        );
      });

      // Feature cards — staggered rise with a subtle 3D tilt-in
      ScrollTrigger.batch(".feature-card", {
        start: "top 88%",
        onEnter: (batch) =>
          gsap.fromTo(
            batch,
            { opacity: 0, y: 50, rotateX: 8, transformPerspective: 800 },
            { opacity: 1, y: 0, rotateX: 0, duration: 0.65, stagger: 0.1, ease: "power3.out" }
          ),
        once: true,
      });

      // Animated counters
      statRefs.current.forEach((el, i) => {
        if (!el) return;
        const target = STATS[i].value;
        const counter = { val: 0 };
        ScrollTrigger.create({
          trigger: el,
          start: "top 90%",
          once: true,
          onEnter: () =>
            gsap.to(counter, {
              val: target,
              duration: 1.4,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = Math.round(counter.val) + STATS[i].suffix;
              },
            }),
        });
      });

      // Workflow — pinned horizontal-feel timeline: line draws in, steps pop
      gsap.fromTo(
        ".workflow-line-fill",
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          transformOrigin: "left center",
          scrollTrigger: {
            trigger: trackRef.current,
            start: "top 75%",
            end: "bottom 60%",
            scrub: 0.6,
          },
        }
      );
      gsap.utils.toArray(".workflow-step").forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: "back.out(1.6)",
            scrollTrigger: { trigger: el, start: "top 85%" },
            delay: i * 0.05,
          }
        );
      });

      // Stack cards — code-block style slide-in from alternating sides
      gsap.utils.toArray(".stack-card").forEach((el, i) => {
        const fromX = i % 2 === 0 ? -40 : 40;
        gsap.fromTo(
          el,
          { opacity: 0, x: fromX },
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%" },
          }
        );
      });

      // Live activity feed — lines cascade in like real notifications
      gsap.utils.toArray(".activity-line").forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, x: 20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            ease: "power2.out",
            delay: i * 0.12,
            scrollTrigger: { trigger: ".activity-feed", start: "top 80%" },
          }
        );
      });

      // Final CTA — scale-in glow
      gsap.fromTo(
        ".cta-panel",
        { opacity: 0, scale: 0.96 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: ".cta-panel", start: "top 85%" },
        }
      );

      // Sticky nav underline reacts to scroll progress (dev-flex touch)
      gsap.to(".scroll-progress", {
        scaleX: 1,
        ease: "none",
        transformOrigin: "left center",
        scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // Magnetic buttons — follows cursor slightly, snaps back on leave
  useEffect(() => {
    const magnets = rootRef.current.querySelectorAll(".magnetic");
    const handlers = [];
    magnets.forEach((el) => {
      const strength = 18;
      const onMove = (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: "power2.out" });
      };
      const onLeave = () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" });
      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
      handlers.push({ el, onMove, onLeave });
    });
    return () => handlers.forEach(({ el, onMove, onLeave }) => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    });
  }, []);

  const heroHeadline = "Stop losing track of who did what, and when.";
  const renderChars = (text) =>
    text.split("").map((ch, i) => (
      <span
        key={i}
        className="hero-char inline-block"
        style={ch === " " ? { width: "0.28em" } : undefined}
      >
        {ch}
      </span>
    ));

  return (
    <div ref={rootRef} className="min-h-screen bg-surface text-on-surface font-body-lg overflow-x-hidden">
      {/* scroll progress bar */}
      <div className="fixed top-0 left-0 w-full h-[2px] z-[60] bg-white/5">
        <div className="scroll-progress h-full w-full bg-gradient-to-r from-primary to-secondary scale-x-0" />
      </div>

      {/* ---------- NAV ---------- */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-white/5">
        <div className="h-16 max-w-container-max mx-auto px-margin-mobile lg:px-margin-desktop flex items-center justify-between">
          <div className="nav-in flex items-center gap-2 opacity-0 -translate-y-2">
            <i className="fa-solid fa-terminal text-primary text-[20px]" />
            <span className="font-headline-md text-[18px] tracking-tight text-on-surface">
              DevRoom<span className="text-primary"> OS</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {["#features", "#workflow", "#stack"].map((href, i) => (
              <a
                key={href}
                href={href}
                className="nav-in opacity-0 -translate-y-2 text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {["Features", "How it works", "Stack"][i]}
              </a>
            ))}
            <a
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-in opacity-0 -translate-y-2 text-body-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1"
            >
              <i className="fa-solid fa-code-branch text-[14px]" /> Source
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="nav-in opacity-0 -translate-y-2 hidden sm:block text-body-sm text-on-surface-variant hover:text-on-surface px-3"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="nav-in opacity-0 -translate-y-2 magnetic bg-primary text-on-primary px-4 py-2 rounded-lg font-label-caps text-label-caps hover:bg-primary-fixed-dim transition-colors shadow-[0_0_20px_rgba(47,217,244,0.2)]"
            >
              Open Workspace
            </button>
          </div>
        </div>
      </header>

      {/* ---------- HERO ---------- */}
      <section ref={heroRef} className="relative pt-40 pb-24 px-margin-mobile lg:px-margin-desktop max-w-container-max mx-auto flex flex-col items-center text-center">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none hero-parallax">
          <div className="hero-orb-1 absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/15 blur-[130px] rounded-full" />
          <div className="hero-orb-2 absolute top-24 right-10 w-[350px] h-[350px] bg-secondary/10 blur-[110px] rounded-full" />
        </div>

        <p className="hero-eyebrow opacity-0 -translate-y-2 font-code-sm text-[13px] text-primary tracking-[0.15em] uppercase mb-5">
          $ whoami --team-workspace
        </p>

        <h1
          className="font-headline-lg text-[38px] md:text-[64px] leading-[1.08] tracking-tight max-w-4xl"
          style={{ perspective: "600px" }}
        >
          {heroHeadline.split("what").map((chunk, i, arr) => (
            <span key={i}>
              {renderChars(chunk)}
              {i < arr.length - 1 && <span className="text-primary">{renderChars("what")}</span>}
            </span>
          ))}
        </h1>

        <p className="hero-in font-body-lg text-[17px] md:text-[19px] text-on-surface-variant max-w-2xl mt-6 leading-relaxed">
          DevRoom OS is a real-time collaboration platform — invite links, live permissions,
          team chat, and an AI workspace, built on Appwrite Teams instead of brittle per-user ACLs.
        </p>

        <div className="hero-in flex flex-col sm:flex-row gap-4 mt-10">
          <button
            onClick={() => navigate("/dashboard")}
            className="magnetic bg-primary text-on-primary px-7 py-3.5 rounded-lg font-label-caps text-label-caps hover:bg-primary-fixed-dim transition-colors shadow-[0_0_25px_rgba(47,217,244,0.25)] flex items-center gap-2 group"
          >
            Launch Workspace
            <i className="fa-solid fa-arrow-right text-[14px] group-hover:translate-x-1 transition-transform" />
          </button>
          <a
            href="#features"
            className="magnetic bg-surface-container-high/60 text-on-surface px-7 py-3.5 rounded-lg font-label-caps text-label-caps hover:bg-surface-container-highest transition-colors border border-white/5 flex items-center gap-2"
          >
            <i className="fa-solid fa-eye text-[15px]" />
            See what's built
          </a>
        </div>

        {/* Live-typing terminal — real invite.js flow, types itself out */}
        <div className="hero-terminal relative w-full max-w-3xl mt-20 rounded-2xl border border-white/10 bg-surface-container-highest shadow-2xl overflow-hidden text-left">
          <div className="h-10 border-b border-white/5 bg-surface/60 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-error/70" />
            <div className="w-3 h-3 rounded-full bg-secondary/70" />
            <div className={`w-3 h-3 rounded-full bg-primary/70 ${terminalDone ? "" : "animate-pulse"}`} />
            <span className="ml-4 font-code-sm text-[12px] text-on-surface-variant">devroom-os — invite.js</span>
          </div>
          <div className="p-5 font-code-sm text-[13px] leading-[1.8] overflow-x-auto">
            {[
              "import { Teams } from \"appwrite\";",
              "",
              "const invite = await teams.createMembership({",
              "  projectId,",
              "  role: \"editor\",",
              "  // self-heals if signup happens out of order",
              "});",
              "",
              "// ✓ member added · role synced · notified",
            ].map((line, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-on-surface-variant/40 select-none w-4 text-right">{line ? i + 1 : ""}</span>
                <span
                  ref={(el) => (codeLineRefs.current[i] = el)}
                  data-text={line}
                  className="term-line whitespace-pre text-on-surface"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- STATS ---------- */}
      <section className="py-16 px-margin-mobile lg:px-margin-desktop max-w-container-max mx-auto border-t border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <div key={s.label} className="flex flex-col gap-1">
              <span
                ref={(el) => (statRefs.current[i] = el)}
                className="font-headline-lg text-[36px] md:text-[44px] text-primary tabular-nums"
              >
                0{s.suffix}
              </span>
              <span className="font-code-sm text-[13px] text-on-surface-variant">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section id="features" className="py-24 px-margin-mobile lg:px-margin-desktop max-w-container-max mx-auto border-t border-white/5">
        <div className="reveal-head flex flex-col items-start gap-3 mb-14">
          <span className="font-code-sm text-primary uppercase tracking-widest text-[12px]">What's actually built</span>
          <h2 className="font-headline-lg text-[28px] md:text-[42px] tracking-tight">Every feature ships in the live app.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ perspective: "1000px" }}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="feature-card group bg-surface-container-high rounded-2xl p-7 border border-white/5 hover:border-white/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
            >
              <div className={`w-11 h-11 rounded-xl ${ACCENTS[f.accent].chip} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                <i className={`${f.icon} ${ACCENTS[f.accent].icon} text-[19px]`} />
              </div>
              <h3 className="font-headline-md text-[18px] mb-2">{f.title}</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed flex-1">{f.body}</p>
              <div className="mt-5 pt-4 border-t border-white/5">
                <span className="font-code-sm text-[11px] text-on-surface-variant/60">{f.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="workflow" className="py-24 px-margin-mobile lg:px-margin-desktop max-w-container-max mx-auto border-t border-white/5">
        <div className="reveal-head flex flex-col items-center text-center gap-3 mb-16">
          <span className="font-code-sm text-primary uppercase tracking-widest text-[12px]">Workflow</span>
          <h2 className="font-headline-lg text-[28px] md:text-[42px] tracking-tight">From sign-in to shipped.</h2>
        </div>
        <div ref={trackRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          <div className="hidden lg:block absolute top-6 left-0 w-full h-px bg-white/5">
            <div className="workflow-line-fill h-full w-full bg-gradient-to-r from-primary to-secondary scale-x-0" />
          </div>
          {STEPS.map((s) => (
            <div key={s.n} className="workflow-step flex flex-col gap-3 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-white/10 flex items-center justify-center mb-1">
                <i className={`${s.icon} text-primary text-[16px]`} />
              </div>
              <span className="font-code-sm text-primary/70 text-[12px] tracking-widest uppercase">Step {s.n}</span>
              <h3 className="font-headline-md text-[17px]">{s.title}</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- STACK ---------- */}
      <section id="stack" className="py-24 px-margin-mobile lg:px-margin-desktop max-w-container-max mx-auto border-t border-white/5">
        <div className="reveal-head flex flex-col items-start gap-3 mb-4">
          <span className="font-code-sm text-primary uppercase tracking-widest text-[12px]">Architecture</span>
          <h2 className="font-headline-lg text-[28px] md:text-[42px] tracking-tight">What's actually running underneath.</h2>
        </div>
        <p className="reveal-head font-body-sm text-on-surface-variant max-w-xl mb-14">
          No generic boilerplate — here's exactly what each piece of the stack does in this app.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STACK.map((t) => (
            <div
              key={t.name}
              className="stack-card group bg-surface-container-high rounded-2xl p-6 border border-white/5 hover:border-primary/20 transition-colors relative overflow-hidden"
            >
              <span className="absolute top-4 right-5 font-code-sm text-[10px] uppercase tracking-widest text-on-surface-variant/40">{t.cat}</span>
              <i className={`${t.icon} text-primary text-[20px] mb-4 block`} />
              <h3 className="font-headline-md text-[16px] mb-2">{t.name}</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed text-[13px]">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="py-24 px-margin-mobile lg:px-margin-desktop max-w-container-max mx-auto border-t border-white/5">
        <div className="cta-panel rounded-2xl bg-surface-container-high border border-white/5 p-10 md:p-14 grid grid-cols-1 lg:grid-cols-2 gap-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <div className="flex flex-col justify-center gap-5 relative z-10 text-left">
            <h2 className="font-headline-lg text-[26px] md:text-[36px] tracking-tight">See it running.</h2>
            <p className="font-body-sm text-on-surface-variant max-w-md">
              Open the live workspace or check the source — every feature on this page is real code, not a mockup.
            </p>
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => navigate("/dashboard")}
                className="magnetic bg-primary text-on-primary px-7 py-3 rounded-lg font-label-caps text-label-caps hover:bg-primary-fixed-dim transition-colors shadow-[0_0_20px_rgba(47,217,244,0.2)]"
              >
                Launch Workspace
              </button>
              <a
                href="https://github.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="magnetic bg-surface-container-highest text-on-surface px-7 py-3 rounded-lg font-label-caps text-label-caps border border-white/10 hover:bg-surface-variant transition-colors"
              >
                View Source
              </a>
            </div>
          </div>

          {/* mock live activity feed */}
          <div className="activity-feed relative z-10 rounded-xl border border-white/10 bg-surface/60 overflow-hidden">
            <div className="h-9 border-b border-white/5 flex items-center px-4 gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-error/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-secondary/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary/70" />
              <span className="ml-3 font-code-sm text-[11px] text-on-surface-variant">devroom-os · live activity</span>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {ACTIVITY_LINES.map((a) => (
                <div key={a.text} className="activity-line flex items-center gap-3 font-code-sm text-[12px]">
                  <i className={`${a.icon} text-primary/70 w-4`} />
                  <span className="text-on-surface-variant flex-1">{a.text}</span>
                  <span className="text-on-surface-variant/40">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-white/5 py-10 px-margin-mobile lg:px-margin-desktop max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="font-headline-md text-[15px] text-on-surface-variant">
          DevRoom<span className="text-primary"> OS</span>
        </span>
        <span className="font-body-sm text-on-surface-variant/60 text-[13px]">© 2026 DevRoom OS · Built by Pranvi Srivastava</span>
      </footer>
    </div>
  );
}