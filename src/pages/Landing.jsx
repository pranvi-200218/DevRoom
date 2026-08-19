import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    icon: "fa-solid fa-user-shield",
    title: "Teams-Based Permissions",
    body: "Access control built on Appwrite Teams, not per-document ACLs — every member's role is enforced at the platform level, not patched together client-side.",
    tag: "role: owner | editor | viewer → enforced server-side",
  },
  {
    icon: "fa-solid fa-link",
    title: "One-Click Invite Links",
    body: "Share a link. New members self-heal into the right team even if signup happens out of order.",
  },
  {
    icon: "fa-solid fa-bell",
    title: "Real-Time Notifications",
    body: "A live WebSocket feed — role changes and activity land instantly, no polling.",
  },
];

const STATS = [
  { count: 6, suffix: "", label: "Appwrite collections" },
  { count: 2, suffix: "", label: "Cloud Functions" },
  { count: 100, suffix: "%", label: "real-time sync" },
  { count: 0, suffix: "", label: "polling hacks" },
];

const STEPS = [
  { n: "01", title: "Create a workspace", body: "Sign in and spin up a project in seconds." },
  { n: "02", title: "Invite your team", body: "Send a link. Roles and access sync automatically on signup." },
  { n: "03", title: "Work in one place", body: "Chat, AI workspace, and resource vault — no context switching." },
  { n: "04", title: "Track everything", body: "A live activity feed keeps the whole team in sync." },
];

const ARCH = [
  { tag: "FRONTEND", icon: "fa-brands fa-react", title: "React + Vite", body: "Component tree for every workspace view — dashboard, chat, AI panel, vault — with Vite's HMR for fast local iteration.", meta: "7 route-level views" },
  { tag: "BACKEND", icon: "fa-solid fa-server", title: "Appwrite", body: "Auth, database (6 collections), file storage, and Teams-based permissions — no custom backend server to maintain.", meta: "6 collections · 3 buckets" },
  { tag: "REALTIME", icon: "fa-solid fa-tower-broadcast", title: "Appwrite Realtime (WebSockets)", body: "Powers live chat, typing indicators, presence, and the notification feed — subscriptions, not polling loops.", meta: "0 polling loops" },
  { tag: "AI", icon: "fa-solid fa-bolt", title: "Groq · GPT-OSS 120B", body: "Served via an Appwrite Cloud Function so the API key never touches the client — inference for the in-app AI workspace.", meta: "Key never hits client" },
  { tag: "STYLING", icon: "fa-brands fa-css3-alt", title: "Tailwind CSS", body: "Utility-first styling with a custom design-token config — colors, spacing, and typography scale defined once, reused everywhere.", meta: "1 token config" },
  { tag: "HOSTING", icon: "fa-solid fa-cloud-arrow-up", title: "Vercel", body: "Static frontend deploy with preview builds on every push — Appwrite Cloud handles everything stateful.", meta: "Preview build / push" },
];

const SCREENS = [
  { id: "chat", label: "Team Chat", route: "/project/nova", file: "team-chat.jpeg", icon: "fa-solid fa-comments",
    title: "Real-time team chat.", body: "A dedicated space for the whole team to communicate while the project is being built. Members can exchange threaded messages, pin important notes, use formatting tools, see typing activity, and keep shared links in context — with updates synced live through WebSockets." },
  { id: "members", label: "Member Management", route: "/project/nova/members", file: "member-management.jpeg", icon: "fa-solid fa-users-gear",
    title: "Role-based member access.", body: "Manage the people working on a project from one place. Invite teammates through email or shareable links, assign Owner, Editor, or Viewer roles, and control who can access the workspace. Permissions are handled through Appwrite Teams so access stays consistent instead of relying on fragile client-side checks." },
  { id: "ai", label: "AI Workspace", route: "/project/nova/ai", file: "ai-workspace.jpeg", icon: "fa-solid fa-robot",
    title: "An AI panel, built in.", body: "An in-app AI workspace that lets the team ask questions, understand project context, and get help without switching to another tool. Requests are routed through an Appwrite Cloud Function, keeping the model integration inside DevRoom while ensuring the API key never reaches the client." },
  { id: "vault", label: "Resource Vault", route: "/project/nova/resources", file: "resource-vault.jpeg", icon: "fa-solid fa-folder-open",
    title: "One place for every file.", body: "A centralized resource space for everything the project needs — documents, references, specifications, and other files. Upload and preview resources, keep them organized, and rely on the same team-based permissions so members see and manage only what their project role allows." },
];

const CHALLENGES = [
  {
    icon: "fa-solid fa-users-gear",
    title: "Client-side SDKs can't grant cross-user permissions",
    body: "Appwrite's client SDK blocks a logged-in user from writing permissions for someone else — which breaks 'invite a teammate' as a flow. Rebuilt access control on Appwrite Teams so membership, not per-document ACLs, drives who can see what.",
  },
  {
    icon: "fa-solid fa-user-lock",
    title: "Auth migrated mid-project without breaking existing sessions",
    body: "Started on localStorage-based identity to move fast, then swapped in real Appwrite auth once multi-device access mattered — without a hard cutover that would've logged everyone out.",
  },
  {
    icon: "fa-solid fa-envelope-circle-check",
    title: "Invite links collided with existing accounts",
    body: "Inviting an email that already had an account threw a 409 on signup. Fixed with a password-recovery-based join flow instead of a raw create-account call, so both new and existing users land in the same place.",
  },
];

const FEED = [
  { icon: "fa-solid fa-user-plus", who: "priya", text: "joined #nexus-frontend", time: "2s" },
  { icon: "fa-solid fa-message", who: "", text: "3 new messages in #general", time: "4m" },
  { icon: "fa-solid fa-file-lines", who: "", text: "spec.md uploaded to vault", time: "9m" },
  { icon: "fa-solid fa-robot", who: "", text: "AI workspace answered 2 prompts", time: "14m" },
];

export default function Landing() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [shotError, setShotError] = useState(false);
  const [activeScreen, setActiveScreen] = useState(0);
  const [screenImgError, setScreenImgError] = useState({});
  const screenFrameRef = useRef(null);

  function handleScreenTab(i) {
    if (i === activeScreen || !screenFrameRef.current) return;
    gsap.to(screenFrameRef.current, {
      opacity: 0, y: 14, duration: 0.22, ease: "power2.in",
      onComplete: () => {
        setActiveScreen(i);
        gsap.fromTo(screenFrameRef.current, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
      },
    });
  }

  // --- custom cursor (desktop only, matches prototype's mousemove + lerp ring) ---
  useEffect(() => {
    if (window.matchMedia("(max-width: 900px)").matches) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;
    let mx = 0, my = 0, rx = 0, ry = 0;

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      gsap.to(dot, { x: mx, y: my, duration: 0.05 });
    };
    const tick = () => {
      rx += (mx - rx) * 0.15;
      ry += (my - ry) * 0.15;
      gsap.set(ring, { x: rx, y: ry });
    };
    window.addEventListener("mousemove", onMove);
    gsap.ticker.add(tick);

    const hoverables = rootRef.current.querySelectorAll("a, button, .dr-magnetic");
    const onEnter = () => ring.classList.add("dr-ring-hover");
    const onLeave = () => ring.classList.remove("dr-ring-hover");
    hoverables.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    return () => {
      window.removeEventListener("mousemove", onMove);
      gsap.ticker.remove(tick);
      hoverables.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  // --- Product screenshot tilt ---
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (isTouch) return;

    const frames = Array.from(root.querySelectorAll(".dr-screen-tilt"));
    const cleanups = [];

    frames.forEach((frame) => {
      gsap.set(frame, {
        transformPerspective: 1000,
        transformStyle: "preserve-3d",
        transformOrigin: "center center",
        rotationX: 0,
        rotationY: 0,
      });

      const onMove = (e) => {
        const rect = frame.getBoundingClientRect();
        const px = Math.max(-1, Math.min(1, (e.clientX - rect.left) / rect.width - 0.5));
        const py = Math.max(-1, Math.min(1, (e.clientY - rect.top) / rect.height - 0.5));

        gsap.to(frame, {
          rotationY: px * 10,
          rotationX: -py * 8,
          scale: 1.015,
          duration: 0.35,
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      const onLeave = () => {
        gsap.to(frame, {
          rotationX: 0,
          rotationY: 0,
          scale: 1,
          duration: 0.65,
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      frame.addEventListener("mousemove", onMove);
      frame.addEventListener("mouseleave", onLeave);

      cleanups.push(() => {
        frame.removeEventListener("mousemove", onMove);
        frame.removeEventListener("mouseleave", onLeave);
        gsap.killTweensOf(frame);
        gsap.set(frame, { rotationX: 0, rotationY: 0, scale: 1 });
      });
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  // --- GSAP motion system ---
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // IMPORTANT:
      // The "Inside the App" section is intentionally NOT animated here.
      // Its existing screenshot/tab behavior is kept untouched.

      // Global page progress
      gsap.to(".dr-progress", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
        },
      });

      // Hero: cinematic but isolated from the product-screen section
      const heroTl = gsap.timeline({ defaults: { ease: "power4.out" } });
      heroTl
        .fromTo(".dr-nav", { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 })
        .fromTo(".dr-eyebrow", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55 }, 0.1)
        .fromTo(
          ".dr-hero-title .dr-line span span",
          { yPercent: 120 },
          { yPercent: 0, duration: 0.9, stagger: 0.018 },
          0.18
        )
        .fromTo(".dr-hero-sub", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.65)
        .fromTo(".dr-hero-cta", { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.75);

      // Hero screenshot gets its own parallax only.
      gsap.to(".dr-hero .dr-shot-frame", {
        y: -42,
        ease: "none",
        scrollTrigger: {
          trigger: ".dr-hero",
          start: "top top",
          end: "bottom top",
          scrub: 0.7,
        },
      });

      // Magnetic buttons
      rootRef.current.querySelectorAll(".dr-magnetic").forEach((m) => {
        const target = m.querySelector("a, button") || m;

        const onMove = (e) => {
          const r = m.getBoundingClientRect();
          gsap.to(target, {
            x: (e.clientX - (r.left + r.width / 2)) * 0.22,
            y: (e.clientY - (r.top + r.height / 2)) * 0.25,
            duration: 0.35,
            ease: "power3.out",
          });
        };

        const onLeave = () => {
          gsap.to(target, {
            x: 0,
            y: 0,
            duration: 0.6,
            ease: "elastic.out(1,0.45)",
          });
        };

        m.addEventListener("mousemove", onMove);
        m.addEventListener("mouseleave", onLeave);
      });

      // Section headings
      gsap.utils.toArray(".dr-reveal-eyebrow").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, x: -18 },
          {
            opacity: 1,
            x: 0,
            duration: 0.65,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          }
        );
      });

      gsap.utils.toArray(".dr-reveal-up").forEach((el) => {
        // Never touch the Inside the App rows.
        if (el.closest("#screens")) return;

        gsap.fromTo(
          el,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          }
        );
      });

      // Problem flow
      gsap.fromTo(
        ".dr-fragment-card",
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".dr-fragment-flow", start: "top 88%", once: true },
        }
      );

      // Architecture pipeline
      gsap.fromTo(
        ".dr-pipeline-node",
        { opacity: 0, y: 18, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: ".dr-arch-pipeline", start: "top 88%", once: true },
        }
      );
      gsap.fromTo(
        ".dr-pipeline-arrow",
        { opacity: 0, scaleX: 0.4 },
        {
          opacity: 1,
          scaleX: 1,
          duration: 0.45,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: { trigger: ".dr-arch-pipeline", start: "top 88%", once: true },
        }
      );

      // Feature cards
      gsap.utils.toArray(".dr-feat-card").forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 34, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.75,
            delay: (i % 2) * 0.05,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 90%", once: true },
          }
        );

        const glow = card.querySelector(".dr-feat-glow");
        if (glow) {
          const onMove = (e) => {
            const r = card.getBoundingClientRect();
            gsap.to(glow, {
              x: e.clientX - r.left - 110,
              y: e.clientY - r.top - 110,
              duration: 0.3,
              ease: "power2.out",
            });
          };
          card.addEventListener("mousemove", onMove);
        }
      });

      // Stats
      rootRef.current.querySelectorAll(".dr-stat-num").forEach((el) => {
        const target = parseFloat(el.dataset.count || "0");
        const suffix = el.dataset.suffix || "";
        const obj = { val: 0 };

        ScrollTrigger.create({
          trigger: el,
          start: "top 90%",
          once: true,
          onEnter: () => {
            gsap.to(obj, {
              val: target,
              duration: 1.35,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = Math.round(obj.val) + suffix;
              },
            });
          },
        });
      });

      gsap.fromTo(
        ".dr-stat",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: ".dr-stats", start: "top 88%", once: true },
        }
      );

      // Workflow
      gsap.fromTo(
        ".dr-flow-anim",
        { opacity: 0, y: 34 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".dr-flow-grid", start: "top 85%", once: true },
        }
      );

      // Architecture
      gsap.utils.toArray(".dr-arch-card").forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 28, x: i % 2 ? 12 : -12 },
          {
            opacity: 1,
            y: 0,
            x: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 88%", once: true },
          }
        );
      });

      // Engineering notes
      gsap.utils.toArray(".dr-challenge-item").forEach((item, i) => {
        gsap.fromTo(
          item,
          { opacity: 0, x: i % 2 ? 18 : -18 },
          {
            opacity: 1,
            x: 0,
            duration: 0.65,
            ease: "power3.out",
            scrollTrigger: { trigger: item, start: "top 90%", once: true },
          }
        );
      });

      // Why I built this
      const why = rootRef.current.querySelector(".dr-why-box");
      if (why) {
        gsap.fromTo(
          why,
          { opacity: 0, y: 34, scale: 0.985 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: why, start: "top 86%", once: true },
          }
        );
      }

      // Live preview lead-in above footer
      gsap.fromTo(
        ".dr-live-window",
        { opacity: 0, x: 45, rotateY: -3 },
        {
          opacity: 1,
          x: 0,
          rotateY: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: ".dr-live-preview", start: "top 84%", once: true },
        }
      );

      // Footer
      gsap.fromTo(
        ".dr-footer-grid, .dr-footer-bottom",
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".dr-footer", start: "top 92%", once: true },
        }
      );

      // Recalculate after assets settle.
      const refresh = () => ScrollTrigger.refresh();
      requestAnimationFrame(refresh);
      if (document.fonts?.ready) document.fonts.ready.then(refresh);
      window.addEventListener("load", refresh);
      setTimeout(refresh, 250);
    }, rootRef);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="dr-landing">
      <style>{DR_STYLES}</style>

      <div className="dr-grain" />
      <div className="dr-progress" />
      <div ref={ringRef} className="dr-cursor-ring" />
      <div ref={dotRef} className="dr-cursor-dot" />

      {/* ---------- NAV ---------- */}
      <div className="dr-nav-outer">
        <nav className="dr-nav">
          <div className="dr-logo">
            DevRoom
          </div>
          <div className="dr-nav-links">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#stack">Tech Stack</a>
            <a href="https://github.com/pranvi-200218/DevRoom" target="_blank" rel="noopener noreferrer">
              <img className="dr-gh-favicon" src="https://github.githubassets.com/favicons/favicon.svg" alt="" />
              Source
            </a>
          </div>
          <div className="dr-nav-right">
            <button onClick={() => navigate("/dashboard")} className="dr-signin">Sign in</button>
            {/* <span className="dr-magnetic">
              <button onClick={() => navigate("/dashboard")} className="dr-btn dr-btn-primary">Open Workspace</button>
            </span> */}
          </div>
        </nav>
      </div>

      {/* ---------- HERO ---------- */}
      <header className="dr-hero">
        <div className="dr-wrap dr-hero-grid">
          <div>
            <div className="dr-eyebrow"><span className="dr-dot" />Collaborative Room for Developers</div>
            <h1 className="dr-hero-title">
              <span className="dr-line"><span>Stop losing track</span></span>
              <span className="dr-line"><span>of who did <em className="dr-highlight">what</em>,</span></span>
              <span className="dr-line"><span>and when.</span></span>
            </h1>
            <p className="dr-hero-sub">
              DevRoom is a real-time collaboration platform — invite links, live permissions, team
              chat, and an AI workspace, built on <b>Appwrite Teams</b> instead of brittle per-user ACLs.
            </p>
            <div className="dr-hero-cta dr-cta-row">
              <div className="dr-magnetic">
                <button onClick={() => navigate("/dashboard")} className="dr-btn dr-btn-primary dr-big">
                  Launch Workspace <i className="fa-solid fa-arrow-right" />
                </button>
              </div>
              <div className="dr-magnetic">
                <a href="https://github.com/pranvi-200218/DevRoom" target="_blank" rel="noopener noreferrer" className="dr-btn dr-btn-ghost dr-big">
                  <i className="fa-brands fa-github" /> View source
                </a>
              </div>
            </div>
          </div>

          <div className="dr-shot-frame">
            <div className="dr-term-bar">
              <div className="dr-term-dot" style={{ background: "#ff5f57" }} />
              <div className="dr-term-dot" style={{ background: "#febc2e" }} />
              <div className="dr-term-dot" style={{ background: "#28c840" }} />
              <span style={{ marginLeft: 6 }}>devroom.app/project/nova</span>
            </div>
            {/* Drop your real screenshot at DevRoom/public/product-screenshot.png — this swaps in automatically. */}
            {shotError ? (
              <div className="dr-shot-placeholder">
                <i className="fa-solid fa-image" />
                <span>Product screenshot goes here</span>
                <span className="dr-shot-hint">public/product-screenshot.jpeg</span>
              </div>
            ) : (
              <img
                src="/product-screenshot.jpeg"
                alt="DevRoom OS product screenshot"
                className="dr-shot-img"
                onError={() => setShotError(true)}
              />
            )}
          </div>
        </div>

        <div className="dr-wrap dr-stats">
          {STATS.map((s) => (
            <div className="dr-stat" key={s.label}>
              <div className="dr-stat-num" data-count={s.count} data-suffix={s.suffix}>0</div>
              <div className="dr-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </header>

      {/* ---------- THE PROBLEM ---------- */}
      <section id="problem" className="dr-problem-section">
        <div className="dr-wrap">
          <div className="dr-sec-eyebrow dr-reveal-eyebrow">THE PROBLEM</div>
          <div className="dr-problem-head">
            <h2 className="dr-reveal-up">Hackathon work shouldn't live in six different tabs.</h2>
            <p className="dr-reveal-up">
              Before DevRoom, the project context is scattered across chats, documents,
              AI tools, file drives, and links. The hard part isn't creating another tool —
              it's keeping the team in the same context while the project moves.
            </p>
          </div>

          <div className="dr-fragment-flow dr-reveal-up">
            <div className="dr-fragment-card">
              <i className="fa-brands fa-whatsapp" />
              <strong>Team chat</strong>
              <span>decisions get buried</span>
            </div>
            <div className="dr-flow-arrow"><i className="fa-solid fa-arrow-right" /></div>
            <div className="dr-fragment-card">
              <i className="fa-regular fa-file-lines" />
              <strong>Docs & files</strong>
              <span>context gets scattered</span>
            </div>
            <div className="dr-flow-arrow"><i className="fa-solid fa-arrow-right" /></div>
            <div className="dr-fragment-card">
              <i className="fa-solid fa-robot" />
              <strong>AI tools</strong>
              <span>answers leave the workspace</span>
            </div>
            <div className="dr-flow-arrow"><i className="fa-solid fa-arrow-right" /></div>
            <div className="dr-fragment-card dr-fragment-result">
              <i className="fa-solid fa-cubes-stacked" />
              <strong>DevRoom</strong>
              <span>one project context</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section id="features">
        <div className="dr-wrap">
          <div className="dr-sec-eyebrow dr-reveal-eyebrow">WHAT'S ACTUALLY BUILT</div>
          <h2 className="dr-reveal-up">Every feature ships in the live app.</h2>
          <div className="dr-feat-grid">
            <div className="dr-feat-card dr-reveal-up">
              <div className="dr-feat-glow" />
              <div className="dr-feat-icon"><i className={FEATURES[0].icon} /></div>
              <h3>{FEATURES[0].title}</h3>
              <p>{FEATURES[0].body}</p>
              <div className="dr-feat-tag">{FEATURES[0].tag}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {FEATURES.slice(1).map((f) => (
                <div className="dr-feat-card dr-reveal-up" key={f.title}>
                  <div className="dr-feat-glow" />
                  <div className="dr-feat-icon"><i className={f.icon} /></div>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              ))}
            </div>
            <div className="dr-feat-card dr-feat-wide dr-reveal-up">
              <div className="dr-feat-glow" />
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div className="dr-feat-icon" style={{ marginBottom: 0 }}><i className="fa-solid fa-robot" /></div>
                <div>
                  <h3 style={{ marginBottom: 4 }}>AI Workspace</h3>
                  <p style={{ maxWidth: 520 }}>An in-app assistant running on Groq's GPT-OSS 120B — ask questions about the project without leaving the workspace.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div className="dr-feat-icon" style={{ marginBottom: 0 }}><i className="fa-solid fa-comments" /></div>
                <div className="dr-feat-icon" style={{ marginBottom: 0 }}><i className="fa-solid fa-box-archive" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- WORKFLOW ---------- */}
      <section id="workflow">
        <div className="dr-wrap">
          <div className="dr-sec-eyebrow dr-reveal-eyebrow">WORKFLOW</div>
          <h2 className="dr-reveal-up">From sign-in to shipped.</h2>
          <div className="dr-flow-grid">
            {STEPS.map((s, i) => (
              <div className="dr-flow-card dr-flow-anim" key={s.n}>
                <div className="dr-flow-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- PRODUCT SCREENS ---------- */}
      <section id="screens">
        <div className="dr-wrap">
          <div className="dr-sec-eyebrow dr-reveal-eyebrow">INSIDE THE APP</div>
          <h2 className="dr-reveal-up">Every surface, actually shipped.</h2>
          <p className="dr-reveal-up" style={{ color: "var(--dr-text-dim)", fontSize: 15, marginTop: -36, marginBottom: 50, maxWidth: 560 }}>
            Not mockups — these are the real routes, running on Appwrite.
          </p>

          <div className="dr-screens-list">
            {SCREENS.map((screen) => (
              <div className="dr-screen-row" key={screen.id}>
                <div className="dr-screen-copy">
                  <div className="dr-screen-tab dr-screen-tab-active">
                    <span className="dr-screen-tab-icon">
                      <i className={screen.icon} />
                    </span>
                    <span className="dr-screen-tab-text">
                      <span className="dr-screen-tab-label">{screen.label}</span>
                      <span className="dr-screen-tab-body">{screen.body}</span>
                    </span>
                  </div>
                </div>

                <div className="dr-screen-tilt">
                  <div className="dr-shot-frame dr-screen-frame" style={{ opacity: 1 }}>
                    <div className="dr-term-bar">
                      <div className="dr-term-dot" style={{ background: "#ff5f57" }} />
                      <div className="dr-term-dot" style={{ background: "#febc2e" }} />
                      <div className="dr-term-dot" style={{ background: "#28c840" }} />
                      <span style={{ marginLeft: 6 }}>devroom.app{screen.route}</span>
                    </div>
                    {screenImgError[screen.file] ? (
                      <div className="dr-shot-placeholder">
                        <i className={screen.icon} />
                        <span>{screen.title}</span>
                        <span className="dr-shot-hint">public/screens/{screen.file}</span>
                      </div>
                    ) : (
                      <img
                        src={`/screens/${screen.file}`}
                        alt={screen.label}
                        className="dr-shot-img"
                        onError={() =>
                          setScreenImgError((prev) => ({ ...prev, [screen.file]: true }))
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- ARCHITECTURE ---------- */}
      <section id="stack">
        <div className="dr-wrap">
          <div className="dr-sec-eyebrow dr-reveal-eyebrow">ARCHITECTURE</div>
          <h2 className="dr-reveal-up">What's actually running underneath.</h2>
          <p className="dr-reveal-up" style={{ color: "var(--dr-text-dim)", fontSize: 15, marginTop: -36, marginBottom: 50, maxWidth: 520 }}>
            No generic boilerplate — here's exactly what each piece of the stack does in this app.
          </p>
          <div className="dr-arch-pipeline dr-reveal-up">
            <div className="dr-pipeline-node">
              <span>01</span>
              <strong>User</strong>
              <small>Browser</small>
            </div>
            <i className="fa-solid fa-arrow-right dr-pipeline-arrow" />
            <div className="dr-pipeline-node">
              <span>02</span>
              <strong>React + Vite</strong>
              <small>UI & state</small>
            </div>
            <i className="fa-solid fa-arrow-right dr-pipeline-arrow" />
            <div className="dr-pipeline-node">
              <span>03</span>
              <strong>Appwrite</strong>
              <small>Auth · DB · Teams · Storage</small>
            </div>
            <i className="fa-solid fa-arrow-right dr-pipeline-arrow" />
            <div className="dr-pipeline-node">
              <span>04</span>
              <strong>Cloud Function</strong>
              <small>AI boundary</small>
            </div>
          </div>

          <div className="dr-arch-grid">
            {ARCH.map((a) => (
              <div className="dr-arch-card" key={a.title}>
                <span className="dr-arch-tag">{a.tag}</span>
                <span className="dr-arch-icon-box"><i className={a.icon} /></span>
                <h3>{a.title}</h3>
                <p>{a.body}</p>
                <div className="dr-arch-meta">{a.meta}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CHALLENGES SOLVED ---------- */}
      <section id="challenges">
        <div className="dr-wrap">
          <div className="dr-sec-eyebrow dr-reveal-eyebrow">ENGINEERING NOTES</div>
          <h2 className="dr-reveal-up">Problems I actually had to solve.</h2>
          <p className="dr-reveal-up" style={{ color: "var(--dr-text-dim)", fontSize: 15, marginTop: -36, marginBottom: 50, maxWidth: 560 }}>
            Not a tutorial clone — here's what broke, and how it got fixed.
          </p>
          <div className="dr-challenge-list">
            {CHALLENGES.map((c) => (
              <div className="dr-challenge-item dr-reveal-up" key={c.title}>
                <div className="dr-challenge-icon"><i className={c.icon} /></div>
                <div>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- WHY I BUILT THIS ---------- */}
      <section id="why">
        <div className="dr-wrap">
          <div className="dr-why-box dr-reveal-up">
            <div className="dr-why-icon"><i className="fa-solid fa-quote-left" /></div>
            <div className="dr-why-content">
              <div className="dr-sec-eyebrow" style={{ marginBottom: 14 }}>THE STORY</div>
              <h2 style={{ marginBottom: 22 }}>Why I built this.</h2>
              <p>
                Hackathon projects rarely happen in one place. Teams jump between WhatsApp for communication,
                Drive for files, separate AI tools for brainstorming, and different links or documents for keeping
                track of the project. As the work grows, important context gets scattered and it becomes difficult
                to know what the team has done, who has access, and where the latest resource actually lives.
              </p>
              <p>
                DevRoom was built to bring those pieces into one shared workspace — a place where the team can
                communicate, manage members and permissions, work with AI, and keep project resources together.
                The goal was not just to make another collaboration interface, but to solve the real friction that
                appears when a team is trying to build something quickly together.
              </p>
              {/* <div className="dr-why-tags">
                <span><i className="fa-solid fa-code-branch" /> Built solo, no boilerplate</span>
                <span><i className="fa-solid fa-bug" /> Real bugs, real fixes</span>
                <span><i className="fa-solid fa-graduation-cap" /> B.Tech CSE, ABES</span>
              </div> */}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- LIVE PREVIEW / FOOTER LEAD-IN ---------- */}
      <section className="dr-live-preview">
        <div className="dr-wrap dr-live-grid">
          <div className="dr-live-copy">
            <div className="dr-sec-eyebrow dr-reveal-eyebrow">SEE IT RUNNING</div>

            <h2 className="dr-live-title dr-reveal-up">
              Every feature here is<br />
              <span>real code.</span>
            </h2>

            <p className="dr-live-description dr-reveal-up">
              Open the live workspace or check the source — nothing
              on this page is a static mockup.
            </p>

            <div className="dr-live-actions dr-reveal-up">
              <div className="dr-magnetic">
                <a
                  href="https://github.com/pranvi-200218/DevRoom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dr-btn dr-btn-ghost dr-big"
                >
                  <i className="fa-brands fa-github" /> View Source
                </a>
              </div>
            </div>

            <div className="dr-live-meta dr-reveal-up">
              <span><i className="fa-solid fa-lock" /> Open source</span>
              <span><i className="fa-solid fa-user" /> Built solo</span>
              <span><i className="fa-solid fa-bolt" /> Live, not staged</span>
            </div>
            {/* <div className="dr-live-proofline dr-reveal-up">
              <span className="dr-live-proof-dot" /> This is a deployed product, not a concept page.
            </div> */}
          </div>

          <div className="dr-live-window dr-reveal-up">
            <div className="dr-live-window-bar">
              <div className="dr-term-dot" style={{ background: "#ff5f57" }} />
              <div className="dr-term-dot" style={{ background: "#febc2e" }} />
              <div className="dr-term-dot" style={{ background: "#28c840" }} />
              <span>devroom <b>•</b> live activity</span>
            </div>

            <div className="dr-live-feed">
              {FEED.map((item, i) => (
                <div className="dr-live-feed-row" key={`${item.text}-${i}`}>
                  <i className={`${item.icon} dr-live-feed-icon`} />
                  <div className="dr-live-feed-text">
                    {item.who && <strong>{item.who}</strong>}
                    <span>{item.who ? ` ${item.text}` : item.text}</span>
                  </div>
                  <time>{item.time}</time>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="dr-footer">
        <div className="dr-wrap">
          <div className="dr-footer-grid">
            <div className="dr-footer-brand">
              <div className="dr-logo">DevRoom</div>
              <p>
                Designed &amp; built by <b>Pranvi</b>.<br />
                Let's build something together.
              </p>
              <div className="dr-footer-social">
                <a href="https://github.com/pranvi-200218" target="_blank" rel="noopener noreferrer" title="GitHub">
                  <i className="fa-brands fa-github" />
                </a>
                {/* Update with real profile URLs before sharing this link */}
                <a href="https://www.linkedin.com/in/pranvisrivastava/" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                  <i className="fa-brands fa-linkedin" />
                </a>
                <a href="mailto:pranvi651work@gmail.com" target="_blank" rel="noopener noreferrer" title="Email">
                  <i className="fa-solid fa-envelope" />
                </a>
              </div>
            </div>

            <div className="dr-footer-col">
              <div className="dr-footer-heading">Product</div>
              <a href="#features">Features</a>
              <a href="#workflow">Workflow</a>
              <a href="#stack">Tech Stack</a>
              <a href="#challenges">Engineering Notes</a>
            </div>

            <div className="dr-footer-col">
              <div className="dr-footer-heading">Connect</div>
              <a href="https://github.com/pranvi-200218/DevRoom" target="_blank" rel="noopener noreferrer">Source Code</a>
              <a href="https://www.linkedin.com/in/pranvisrivastava/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a onClick={() => navigate("/dashboard")}>Open Workspace</a>
            </div>
          </div>

          <div className="dr-footer-bottom">
            <span>© 2026 DevRoom</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const DR_STYLES = `
.dr-landing{
  --dr-bg:#090d16; --dr-bg-2:#0d1320; --dr-panel:#141b29; --dr-panel-2:#192234;
  --dr-line:rgba(180,205,230,0.075); --dr-line-2:rgba(180,205,230,0.14);
  --dr-text:#eef4fa; --dr-text-dim:#94a2b5; --dr-text-faint:#5f6d80;
  --dr-cyan:#61d9f2; --dr-cyan-dim:rgba(97,217,242,0.11); --dr-violet:#8f91f7; --dr-amber:#e8c47a;
  --dr-orange:#61d9f2; --dr-orange-dim:rgba(97,217,242,0.11);
  --dr-mono:'JetBrains Mono', monospace; --dr-sans:'Geist', sans-serif;
  position:relative; background:
    radial-gradient(1100px 620px at 8% -12%, rgba(97,217,242,0.055), transparent 62%),
    radial-gradient(900px 520px at 92% 18%, rgba(152,153,245,0.045), transparent 58%),
    var(--dr-bg);
  color:var(--dr-text); font-family:var(--dr-sans); overflow-x:clip; cursor:default;
}
.dr-landing *{ box-sizing:border-box; }
.dr-feat-card,.dr-arch-card,.dr-challenge-item,.dr-why-box{
  background:linear-gradient(145deg,rgba(25,28,37,.82),rgba(18,20,28,.72));
  border-color:rgba(190,205,225,.10);
}
.dr-feat-card:hover,.dr-arch-card:hover{
  border-color:rgba(97,217,242,.25);
}

.dr-landing ::selection{ background:var(--dr-cyan); color:#04140b; }
.dr-landing h1,.dr-landing h2,.dr-landing h3{ margin:0; }
.dr-landing p{ margin:0; }
.dr-landing button{ font:inherit; border:none; background:none; cursor:pointer; }
.dr-landing a{ text-decoration:none; color:inherit; }

.dr-grain{ position:fixed; inset:0; pointer-events:none; z-index:60; opacity:0.035; mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
.dr-cursor-dot,.dr-cursor-ring{ position:fixed; top:0; left:0; pointer-events:none; z-index:70; border-radius:50%; transform:translate(-50%,-50%); }
.dr-cursor-dot{ width:6px; height:6px; background:var(--dr-cyan); }
.dr-cursor-ring{ width:34px; height:34px; border:1px solid rgba(94,234,212,0.4); transition:width .25s,height .25s,border-color .25s,background .25s; }
.dr-cursor-ring.dr-ring-hover{ width:56px; height:56px; background:rgba(94,234,212,0.08); border-color:var(--dr-cyan); }
@media(max-width:900px){ .dr-cursor-dot,.dr-cursor-ring{ display:none; } }\n@media(prefers-reduced-motion:reduce){ .dr-landing *, .dr-landing *::before, .dr-landing *::after{ scroll-behavior:auto !important; transition-duration:0.01ms !important; animation-duration:0.01ms !important; animation-iteration-count:1 !important; } }

.dr-wrap{ max-width:1180px; margin:0 auto; padding:0 32px; }
.dr-progress{ position:fixed; top:0; left:0; height:2px; width:100%; z-index:60; background:linear-gradient(90deg,var(--dr-cyan),var(--dr-violet)); transform-origin:left; transform:scaleX(0); }

.dr-nav-outer{ position:fixed; top:18px; left:0; right:0; z-index:50; display:flex; justify-content:center; padding:0 20px; }
.dr-nav{ width:100%; max-width:1180px; display:flex; align-items:center; justify-content:space-between;
  padding:10px 14px 10px 14px; backdrop-filter:blur(16px); background:rgba(25,28,37,0.82);
  border:1px solid var(--dr-line-2); border-radius:999px; box-shadow:0 14px 42px -16px rgba(0,0,0,0.65); }
.dr-logo{ display:flex; align-items:center; gap:10px; font-family:var(--dr-mono); font-style:italic; font-weight:700; font-size:15px; letter-spacing:0.02em; }
.dr-logo-icon{ width:32px; height:32px; border-radius:9px; border:1px solid rgba(94,234,212,0.35); background:var(--dr-cyan-dim);
  display:flex; align-items:center; justify-content:center; color:var(--dr-cyan); font-size:14px; flex-shrink:0; }
.dr-chev{ color:var(--dr-cyan); }
.dr-nav-links{ display:flex; align-items:center; gap:30px; font-family:var(--dr-mono); font-style:italic; font-size:13px; color:var(--dr-text-dim); }
.dr-nav-links a{ position:relative; transition:color .25s; display:inline-flex; align-items:center; gap:6px; }
.dr-nav-links a::after{ content:''; position:absolute; left:0; bottom:-6px; width:0; height:1px; background:var(--dr-cyan); transition:width .3s cubic-bezier(.65,0,.35,1); }
.dr-nav-links a:hover{ color:var(--dr-text); }
.dr-nav-links a:hover::after{ width:100%; }
.dr-gh-favicon{ width:14px; height:14px; border-radius:50%; opacity:0.85; }
.dr-nav-right{ display:flex; align-items:center; gap:18px; }
.dr-signin{ font-family:var(--dr-mono); font-style:italic; font-size:13px; color:var(--dr-text-dim); }
.dr-btn{ font-family:var(--dr-mono); font-style:italic; font-size:13px; font-weight:600; padding:10px 18px; border-radius:999px; display:inline-flex; align-items:center; gap:8px; }
.dr-btn-primary{ background:var(--dr-cyan); color:#04140b; }
.dr-btn-ghost{ border:1px solid var(--dr-line-2); color:var(--dr-text); background:rgba(255,255,255,0.02); }
.dr-hero .dr-btn, .dr-cta-left .dr-btn{ border-radius:9px; }
@media(max-width:900px){ .dr-nav-links{ display:none; } }

.dr-hero{ padding:150px 0 90px; position:relative; }
.dr-hero-grid{ display:grid; grid-template-columns:1.05fr 1fr; gap:60px; align-items:start; }
@media(max-width:980px){ .dr-hero-grid{ grid-template-columns:1fr; } }
.dr-eyebrow{ font-family:var(--dr-mono); font-style:italic; font-size:12.5px; color:var(--dr-cyan); letter-spacing:0.04em; display:flex; align-items:center; gap:10px; margin-bottom:26px; opacity:0; }
.dr-dot{ width:6px; height:6px; border-radius:50%; background:var(--dr-cyan); box-shadow:0 0 10px var(--dr-cyan); }
.dr-hero-title{ font-family:var(--dr-sans); font-weight:800; font-size:clamp(38px,5vw,60px); line-height:1.06; letter-spacing:-0.02em; margin-bottom:24px; }
.dr-line{ display:block; overflow:hidden; }
.dr-line span{ display:inline-block; will-change:transform; }
.dr-highlight{ color:var(--dr-orange); font-style:normal; }
.dr-hero-sub{ font-size:16.5px; line-height:1.7; color:var(--dr-text-dim); max-width:480px; margin-bottom:34px; opacity:0; }
.dr-hero-sub b{ color:var(--dr-text); font-weight:600; }
.dr-cta-row{ display:flex; gap:14px; flex-wrap:wrap; }
.dr-hero-cta{ opacity:1; visibility:visible; }
.dr-big{ padding:14px 24px; font-size:14px; border-radius:9px; }
.dr-hero-cta .dr-btn-primary,
.dr-cta-left .dr-btn-primary{
  display:inline-flex;
  opacity:1 !important;
  visibility:visible !important;
  background:var(--dr-cyan);
  color:#04140b !important;
  border:1px solid var(--dr-cyan);
  box-shadow:0 0 0 1px rgba(97,217,242,.08), 0 8px 28px rgba(97,217,242,.12);
}
.dr-hero-cta .dr-btn-primary:hover,
.dr-cta-left .dr-btn-primary:hover{
  filter:brightness(1.08);
}

.dr-magnetic{ display:inline-block; }

.dr-term{ background:var(--dr-panel); border:1px solid var(--dr-line-2); border-radius:12px; overflow:hidden;
  box-shadow:0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02); opacity:0; transform:perspective(1000px); }
.dr-term-bar{ display:flex; align-items:center; gap:10px; padding:12px 16px; background:var(--dr-panel-2); border-bottom:1px solid var(--dr-line); font-family:var(--dr-mono); font-style:italic; font-size:12px; color:var(--dr-text-faint); }
.dr-term-dot{ width:10px; height:10px; border-radius:50%; }
.dr-term-body{ padding:22px 20px; font-family:var(--dr-mono); font-style:italic; font-size:13px; line-height:1.85; }
.dr-term-line{ white-space:pre; color:var(--dr-text-dim); }
.dr-term-num{ display:inline-block; width:20px; color:var(--dr-text-faint); user-select:none; }
.dr-tok-kw{ color:var(--dr-violet); } .dr-tok-str{ color:var(--dr-amber); } .dr-tok-fn{ color:var(--dr-cyan); } .dr-tok-com{ color:var(--dr-text-faint); font-style:italic; }
.dr-term-cursor{ display:inline-block; width:7px; height:15px; background:var(--dr-cyan); vertical-align:middle; margin-left:2px; }
.dr-term-ok{ color:#5eead4; }

.dr-shot-frame{ position:relative; background:var(--dr-panel); border:1px solid var(--dr-line-2); border-radius:12px; overflow:hidden;
  box-shadow:0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02); opacity:0; transform:perspective(1000px); }
.dr-hero .dr-shot-frame{
  opacity:1;
  visibility:visible;
  border-color:rgba(97,217,242,.15);
  box-shadow:0 34px 90px -28px rgba(0,0,0,.72),0 0 0 1px rgba(97,217,242,.035);
}\n.dr-shot-img{ display:block; width:100%; height:auto; }
.dr-shot-placeholder{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px;
  min-height:340px; padding:40px 20px; color:var(--dr-text-faint); background:
    repeating-linear-gradient(135deg, rgba(255,255,255,0.02) 0 2px, transparent 2px 14px); }
.dr-shot-placeholder i{ font-size:28px; opacity:0.5; }
.dr-shot-placeholder span{ font-family:var(--dr-sans); font-size:14px; }
.dr-shot-hint{ font-family:var(--dr-mono); font-style:italic; font-size:12px; color:var(--dr-text-faint); opacity:0.7; }

.dr-stats{ display:grid; grid-template-columns:repeat(4,1fr); border-top:1px solid var(--dr-line); border-bottom:1px solid var(--dr-line); margin-top:90px; }
.dr-stat{ padding:34px 32px; border-right:1px solid var(--dr-line); }
.dr-stat:last-child{ border-right:none; }
.dr-stat-num{ font-family:var(--dr-mono); font-style:italic; font-size:34px; font-weight:700; color:var(--dr-cyan); }
.dr-stat-label{ font-family:var(--dr-mono); font-style:italic; font-size:12px; color:var(--dr-text-faint); margin-top:6px; }
@media(max-width:700px){ .dr-stats{ grid-template-columns:repeat(2,1fr); } .dr-stat{ border-bottom:1px solid var(--dr-line); } }

.dr-landing section{ padding:120px 0; position:relative; }
.dr-sec-eyebrow{ font-family:var(--dr-mono); font-style:italic; font-size:12px; color:var(--dr-cyan); letter-spacing:0.08em; margin-bottom:16px; }
.dr-landing h2{ font-size:clamp(28px,3.6vw,42px); font-weight:800; letter-spacing:-0.015em; margin-bottom:56px; max-width:640px; }

.dr-feat-grid{ display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--dr-line); border:1px solid var(--dr-line); border-radius:14px; overflow:hidden; }
.dr-feat-card{ background:var(--dr-panel); padding:36px; position:relative; overflow:hidden; }
.dr-feat-wide{ grid-column:1 / -1; display:flex; align-items:center; justify-content:space-between; gap:24px; flex-wrap:wrap; }
.dr-feat-icon{ width:38px; height:38px; border-radius:9px; background:var(--dr-cyan-dim); border:1px solid rgba(94,234,212,0.25); display:flex; align-items:center; justify-content:center; margin-bottom:20px; color:var(--dr-cyan); font-size:17px; }
.dr-feat-card h3{ font-size:18px; font-weight:700; margin-bottom:10px; }
.dr-feat-card p{ font-size:14px; line-height:1.65; color:var(--dr-text-dim); max-width:420px; }
.dr-feat-tag{ font-family:var(--dr-mono); font-style:italic; font-size:11.5px; color:var(--dr-text-faint); border-top:1px solid var(--dr-line); margin-top:24px; padding-top:16px; }
.dr-feat-glow{ position:absolute; width:220px; height:220px; border-radius:50%; background:radial-gradient(circle, rgba(94,234,212,0.12), transparent 70%); top:-80px; right:-80px; opacity:0; transition:opacity .4s; }
.dr-feat-card:hover .dr-feat-glow{ opacity:1; }
@media(max-width:900px){ .dr-feat-grid{ grid-template-columns:1fr; } }

.dr-flow-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-top:16px; }
.dr-flow-card{ background:var(--dr-panel); border:1px solid var(--dr-line); border-radius:14px; padding:32px 28px; }
.dr-flow-num{ font-family:var(--dr-mono); font-style:italic; font-size:44px; font-weight:800; color:var(--dr-cyan); line-height:1; margin-bottom:18px; }
.dr-flow-card h3{ font-size:19px; font-weight:700; margin-bottom:10px; }
.dr-flow-card p{ color:var(--dr-text-dim); font-size:14.5px; line-height:1.65; }
@media(max-width:980px){ .dr-flow-grid{ grid-template-columns:repeat(2,1fr); } }
@media(max-width:600px){ .dr-flow-grid{ grid-template-columns:1fr; } }

.dr-screens-layout{ display:grid; grid-template-columns:320px 1fr; gap:28px; align-items:start; }
.dr-screens-list{ display:flex; flex-direction:column; gap:52px; }
.dr-screen-row{ display:grid; grid-template-columns:0.9fr 1fr; gap:44px; align-items:center; opacity:1; }
.dr-screen-copy{ min-width:0; }
.dr-screen-copy .dr-screen-tab{ padding:24px 22px; border-color:var(--dr-line); background:rgba(14,17,23,0.48); box-shadow:0 18px 50px -30px rgba(0,0,0,0.65); }
.dr-screen-copy .dr-screen-tab:hover{ background:rgba(18,22,30,0.72); border-color:rgba(97,217,242,0.18); }
.dr-screen-tab-label{ position:relative; display:inline-flex; align-items:center; gap:8px; font-size:16px; }
.dr-screen-tab-label::after{ content:""; width:5px; height:5px; border-radius:50%; background:var(--dr-cyan); box-shadow:0 0 9px rgba(97,217,242,0.55); }
.dr-screen-tab-body{ font-size:14px; line-height:1.8; color:var(--dr-text-dim); }
.dr-screen-tilt{ width:100%; perspective:1000px; transform-style:preserve-3d; transform-origin:center center; will-change:transform; }
.dr-screen-frame{ width:100%; transform-origin:center center; }
.dr-screen-frame .dr-shot-img{ transition:none; will-change:transform; }
.dr-screen-frame::after{ content:''; position:absolute; inset:0; pointer-events:none; border-radius:inherit; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.018); }
.dr-screens-tabs{ display:flex; flex-direction:column; gap:8px; }
.dr-screen-tab{ display:flex; align-items:flex-start; gap:14px; text-align:left; padding:18px 18px; border-radius:12px;
  border:1px solid transparent; background:transparent; cursor:pointer; transition:background .25s, border-color .25s; }
.dr-screen-tab:hover{ background:var(--dr-panel); }
.dr-screen-tab-active{ background:var(--dr-panel); border-color:var(--dr-line-2); }
.dr-screen-tab-icon{ flex-shrink:0; width:38px; height:38px; border-radius:9px; display:flex; align-items:center; justify-content:center;
  font-size:15px; color:var(--dr-text-faint); background:var(--dr-panel-2); border:1px solid var(--dr-line); transition:color .25s, background .25s, border-color .25s; }
.dr-screen-tab-active .dr-screen-tab-icon{ color:var(--dr-cyan); background:var(--dr-cyan-dim); border-color:rgba(97,217,242,0.3); }
.dr-screen-tab-text{ display:flex; flex-direction:column; gap:5px; }
.dr-screen-tab-label{ font-size:14.5px; font-weight:700; color:var(--dr-text); }
.dr-screen-tab-body{ font-size:12.5px; line-height:1.6; color:var(--dr-text-faint); }
.dr-screen-tab-active .dr-screen-tab-body{ color:var(--dr-text-dim); }
.dr-screen-frame{ opacity:1 !important; }
@media(max-width:900px){ .dr-screen-row{ grid-template-columns:1fr; gap:18px; } .dr-screens-list{ gap:40px; } .dr-screen-copy .dr-screen-tab{ padding:20px; } }

.dr-arch-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.dr-arch-card{ background:var(--dr-panel); border:1px solid var(--dr-line); border-radius:12px; padding:26px; opacity:0; transform:translateY(30px); position:relative; display:flex; flex-direction:column; }
.dr-arch-tag{ position:absolute; top:22px; right:22px; font-family:var(--dr-mono); font-style:italic; font-size:10px; color:var(--dr-text-faint); letter-spacing:0.08em; }
.dr-arch-card h3{ font-size:16px; font-weight:700; margin:16px 0 10px; }
.dr-arch-card p{ font-size:13.5px; color:var(--dr-text-dim); line-height:1.6; flex-grow:1; }
.dr-arch-icon-box{ width:40px; height:40px; border-radius:10px; background:var(--dr-cyan-dim); display:flex; align-items:center; justify-content:center; font-size:17px; color:var(--dr-cyan); }
.dr-arch-meta{ margin-top:18px; padding-top:14px; border-top:1px solid var(--dr-line); font-family:var(--dr-mono); font-style:italic; font-size:11.5px; color:var(--dr-text-faint); }
@media(max-width:900px){ .dr-arch-grid{ grid-template-columns:1fr; } }

.dr-challenge-list{ display:flex; flex-direction:column; gap:14px; }
.dr-challenge-item{ display:flex; gap:20px; background:var(--dr-panel); border:1px solid var(--dr-line); border-radius:12px; padding:24px 26px; opacity:0; transform:translateY(30px); }
.dr-challenge-icon{ flex-shrink:0; width:42px; height:42px; border-radius:10px; background:var(--dr-panel-2); border:1px solid var(--dr-line); display:flex; align-items:center; justify-content:center; font-size:16px; color:var(--dr-cyan); }
.dr-challenge-item h3{ font-size:15.5px; font-weight:700; margin-bottom:8px; }
.dr-challenge-item p{ font-size:13.5px; color:var(--dr-text-dim); line-height:1.65; max-width:640px; }
@media(max-width:600px){ .dr-challenge-item{ flex-direction:column; gap:14px; } }

.dr-why-box{ position:relative; display:flex; gap:32px; background:linear-gradient(160deg, var(--dr-panel), var(--dr-bg-2));
  border:1px solid var(--dr-line-2); border-radius:16px; padding:48px 52px; opacity:0; transform:translateY(30px); overflow:hidden; }
.dr-why-box::before{ content:''; position:absolute; top:-40%; right:-10%; width:320px; height:320px; border-radius:50%;
  background:radial-gradient(circle, var(--dr-cyan-dim), transparent 70%); pointer-events:none; }
.dr-why-icon{ flex-shrink:0; width:46px; height:46px; border-radius:12px; background:var(--dr-cyan-dim); border:1px solid rgba(97,217,242,0.3);
  display:flex; align-items:center; justify-content:center; font-size:17px; color:var(--dr-cyan); }
.dr-why-content{ position:relative; z-index:1; max-width:680px; }
.dr-why-content p{ font-size:15px; line-height:1.8; color:var(--dr-text-dim); margin-bottom:16px; }
.dr-why-tags{ display:flex; flex-wrap:wrap; gap:10px; margin-top:26px; }
.dr-why-tags span{ display:inline-flex; align-items:center; gap:8px; font-family:var(--dr-mono); font-style:italic; font-size:12px;
  color:var(--dr-text-dim); background:var(--dr-panel-2); border:1px solid var(--dr-line); border-radius:999px; padding:8px 14px; }
.dr-why-tags span i{ color:var(--dr-cyan); font-size:11px; }
@media(max-width:700px){ .dr-why-box{ flex-direction:column; padding:32px 26px; } }

.dr-cta-split{ display:grid; grid-template-columns:1fr 1fr; border:1px solid var(--dr-line-2); border-radius:16px; overflow:hidden; background:linear-gradient(160deg, var(--dr-panel), var(--dr-bg-2)); }
.dr-cta-left{ padding:56px; }
.dr-cta-left h2{ margin-bottom:16px; }
.dr-cta-left p{ color:var(--dr-text-dim); font-size:15px; line-height:1.7; margin-bottom:32px; max-width:400px; }
.dr-cta-badges{ display:flex; gap:18px; margin-top:28px; flex-wrap:wrap; }
.dr-cta-badges span{ display:flex; align-items:center; gap:7px; font-family:var(--dr-mono); font-style:italic; font-size:12px; color:var(--dr-text-faint); }
.dr-cta-badges i{ color:var(--dr-cyan); font-size:11px; }
.dr-cta-right{ background:var(--dr-panel-2); border-left:1px solid var(--dr-line); }
.dr-feed-item{ display:flex; justify-content:space-between; gap:12px; padding:16px 22px; border-bottom:1px solid var(--dr-line); font-family:var(--dr-mono); font-style:italic; font-size:12.5px; color:var(--dr-text-dim); opacity:0; transform:translateX(16px); }
.dr-feed-who{ color:var(--dr-cyan); }
.dr-feed-time{ color:var(--dr-text-faint); flex-shrink:0; }
@media(max-width:900px){ .dr-cta-split{ grid-template-columns:1fr; } .dr-cta-right{ border-left:none; border-top:1px solid var(--dr-line); } }

.dr-footer{ border-top:1px solid var(--dr-line); padding:56px 0 24px; font-family:var(--dr-sans); font-size:13px; color:var(--dr-text-faint); }
.dr-footer-grid{ display:grid; grid-template-columns:1.6fr 1fr 1fr; gap:40px; padding-bottom:36px; }
.dr-footer .dr-logo{ font-family:var(--dr-mono); font-style:italic; font-size:14px; color:var(--dr-text); margin-bottom:10px; }
.dr-footer-brand{ max-width:360px; }
.dr-footer-brand p{ line-height:1.65; margin-bottom:18px; }
.dr-footer-social{ display:flex; gap:14px; }
.dr-footer-social a{ width:32px; height:32px; border-radius:8px; border:1px solid var(--dr-line); display:flex; align-items:center; justify-content:center; color:var(--dr-text-dim); transition:all 0.15s; }
.dr-footer-social a:hover{ color:var(--dr-cyan); border-color:var(--dr-cyan-dim); }
.dr-footer-heading{ font-family:var(--dr-mono); font-style:italic; font-size:11px; letter-spacing:0.06em; text-transform:uppercase; color:var(--dr-text-faint); margin-bottom:14px; }
.dr-footer-col{ display:flex; flex-direction:column; gap:10px; }
.dr-footer-col a{ color:var(--dr-text-dim); cursor:pointer; transition:color 0.15s; width:fit-content; }
.dr-footer-col a:hover{ color:var(--dr-cyan); }
.dr-footer-bottom{ display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap; padding-top:20px; border-top:1px solid var(--dr-line); font-family:var(--dr-mono); font-style:italic; font-size:11px; }
@media(max-width:800px){ .dr-footer-grid{ grid-template-columns:1fr; gap:28px; } }

/* ---------- LIVE PREVIEW / FOOTER LEAD-IN ---------- */
.dr-live-preview{
  padding:110px 0 105px;
  border-top:1px solid var(--dr-line);
  background:
    radial-gradient(circle at 78% 50%, rgba(97,217,242,.045), transparent 34%),
    var(--dr-bg);
}
.dr-live-grid{
  display:grid;
  grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);
  gap:58px;
  align-items:center;
}
.dr-live-copy{max-width:690px;}
.dr-live-title{
  margin:18px 0 24px;
  font-size:clamp(48px,5.4vw,78px);
  line-height:.98;
  letter-spacing:-.055em;
  color:var(--dr-text);
}
.dr-live-title span{color:#61d9f2;}
.dr-live-description{
  max-width:570px;
  margin:0 0 34px;
  color:var(--dr-text-dim);
  font-size:19px;
  line-height:1.7;
}
.dr-live-actions{
  display:flex;
  gap:12px;
  flex-wrap:wrap;
  margin-bottom:38px;
}
.dr-live-meta{
  display:flex;
  flex-wrap:wrap;
  gap:24px;
  color:var(--dr-text-dim);
  font-family:var(--dr-mono);
  font-size:12px;
  font-style:italic;
}
.dr-live-meta span{display:flex;align-items:center;gap:8px;}
.dr-live-meta i{color:#61d9f2;}
.dr-live-window{
  min-height:0;
  height:auto;
  overflow:hidden;
  border:1px solid rgba(255,255,255,.1);
  border-radius:13px;
  background:#141b29;
  box-shadow:0 28px 70px rgba(0,0,0,.28);
}
.dr-live-window-bar{
  height:48px;
  display:flex;
  align-items:center;
  gap:8px;
  padding:0 22px;
  border-bottom:1px solid rgba(255,255,255,.08);
  color:#687283;
  font-family:var(--dr-mono);
  font-size:14px;
  font-style:italic;
}
.dr-live-window-bar span{margin-left:7px;}
.dr-live-window-bar b{color:#3c4554;}
.dr-live-feed-row{
  min-height:64px;
  display:grid;
  grid-template-columns:28px 1fr auto;
  align-items:center;
  gap:14px;
  padding:0 26px;
  border-bottom:1px solid rgba(255,255,255,.07);
  color:#8d96a6;
  font-family:var(--dr-mono);
  font-size:14px;
}
.dr-live-feed-icon{color:#61d9f2;text-align:center;font-size:15px;}
.dr-live-feed-text strong{color:#61d9f2;font-weight:600;}
.dr-live-feed-row time{color:#5f6877;font-size:12px;}
@media(max-width:900px){
  .dr-live-preview{padding:80px 0;}
  .dr-live-grid{grid-template-columns:1fr;gap:40px;}
  .dr-live-window{min-height:0;}
}
@media(max-width:600px){
  .dr-live-title{font-size:clamp(44px,12vw,62px);}
  .dr-live-description{font-size:16px;}
  .dr-live-meta{gap:14px;flex-direction:column;}
  .dr-live-feed-row{min-height:58px;padding:0 16px;grid-template-columns:22px 1fr auto;font-size:12px;}
}


/* ---------- PROBLEM ---------- */
.dr-problem-section{padding:120px 0 100px;}
.dr-problem-head{
  display:grid;
  grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr);
  gap:70px;
  align-items:end;
  margin-bottom:58px;
}
.dr-problem-head h2{max-width:820px;}
.dr-problem-head p{
  color:var(--dr-text-dim);
  font-size:16px;
  line-height:1.8;
  max-width:510px;
  margin:0 0 5px;
}
.dr-fragment-flow{
  display:grid;
  grid-template-columns:1fr 30px 1fr 30px 1fr 30px 1.08fr;
  align-items:center;
  gap:12px;
}
.dr-fragment-card{
  min-height:150px;
  padding:24px;
  border:1px solid var(--dr-line-2);
  border-radius:13px;
  background:linear-gradient(145deg,rgba(25,28,37,.82),rgba(18,20,28,.76));
  display:flex;
  flex-direction:column;
  justify-content:center;
}
.dr-fragment-card i{
  color:#7f899a;
  font-size:19px;
  margin-bottom:18px;
}
.dr-fragment-card strong{
  color:var(--dr-text);
  font-size:15px;
  margin-bottom:6px;
}
.dr-fragment-card span{
  color:var(--dr-text-faint);
  font:12px/1.5 var(--dr-mono);
}
.dr-flow-arrow{
  color:#4f5868;
  text-align:center;
  font-size:12px;
}
.dr-fragment-result{
  border-color:rgba(97,217,242,.25);
  background:linear-gradient(145deg,rgba(97,217,242,.075),rgba(25,28,37,.88));
  box-shadow:0 18px 50px rgba(0,0,0,.18);
}
.dr-fragment-result i,.dr-fragment-result strong{color:var(--dr-cyan);}

/* ---------- ARCHITECTURE PIPELINE ---------- */
.dr-arch-pipeline{
  display:grid;
  grid-template-columns:1fr 36px 1.2fr 36px 1.5fr 36px 1.25fr;
  align-items:center;
  gap:10px;
  margin-bottom:52px;
  padding:20px;
  border:1px solid var(--dr-line);
  border-radius:14px;
  background:rgba(25,28,37,.48);
}
.dr-pipeline-node{
  min-height:92px;
  padding:16px 18px;
  border:1px solid var(--dr-line);
  border-radius:10px;
  background:rgba(15,16,21,.58);
  display:flex;
  flex-direction:column;
  justify-content:center;
}
.dr-pipeline-node span{
  color:var(--dr-cyan);
  font:11px/1 var(--dr-mono);
  margin-bottom:8px;
}
.dr-pipeline-node strong{font-size:14px;color:var(--dr-text);}
.dr-pipeline-node small{
  margin-top:5px;
  color:var(--dr-text-faint);
  font:11px/1.45 var(--dr-mono);
}
.dr-pipeline-arrow{color:#536071;text-align:center;font-size:12px;}

/* ---------- DEPLOYED PROOF ---------- */
.dr-live-proofline{
  margin-top:18px;
  color:var(--dr-text-faint);
  font:12px/1.5 var(--dr-mono);
  display:flex;
  align-items:center;
  gap:9px;
}
.dr-live-proof-dot{
  width:7px;height:7px;border-radius:50%;
  background:var(--dr-cyan);
  box-shadow:0 0 12px rgba(97,217,242,.45);
}

/* ---------- RESPONSIVE ---------- */
@media(max-width:1050px){
  .dr-problem-head{grid-template-columns:1fr;gap:24px;}
  .dr-fragment-flow{grid-template-columns:1fr;gap:10px;}
  .dr-flow-arrow{transform:rotate(90deg);height:18px;}
  .dr-arch-pipeline{grid-template-columns:1fr;gap:8px;}
  .dr-pipeline-arrow{transform:rotate(90deg);height:22px;}
}

`;