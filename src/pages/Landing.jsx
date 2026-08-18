import { useEffect, useLayoutEffect, useRef } from "react";
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
  { tag: "FRONTEND", icon: "fa-brands fa-react", title: "React + Vite", body: "Component tree for every workspace view — dashboard, chat, AI panel, vault — with Vite's HMR for fast local iteration." },
  { tag: "BACKEND", icon: "fa-solid fa-server", title: "Appwrite", body: "Auth, database (6 collections), file storage, and Teams-based permissions — no custom backend server to maintain." },
  { tag: "REALTIME", icon: "fa-solid fa-tower-broadcast", title: "Appwrite Realtime (WebSockets)", body: "Powers live chat, typing indicators, presence, and the notification feed — subscriptions, not polling loops." },
  { tag: "AI", icon: "fa-solid fa-bolt", title: "Groq · GPT-OSS 120B", body: "Served via an Appwrite Cloud Function so the API key never touches the client — inference for the in-app AI workspace." },
  { tag: "STYLING", icon: "fa-brands fa-css3-alt", title: "Tailwind CSS", body: "Utility-first styling with a custom design-token config — colors, spacing, and typography scale defined once, reused everywhere." },
  { tag: "HOSTING", icon: "fa-solid fa-cloud-arrow-up", title: "Vercel", body: "Static frontend deploy with preview builds on every push — Appwrite Cloud handles everything stateful." },
];

const FEED = [
  { icon: "fa-solid fa-user-plus", who: "priya", text: "joined #nexus-frontend", time: "2s" },
  { icon: "fa-solid fa-message", who: "", text: "3 new messages in #general", time: "4m" },
  { icon: "fa-solid fa-file-lines", who: "", text: "spec.md uploaded to vault", time: "9m" },
  { icon: "fa-solid fa-robot", who: "", text: "AI workspace answered 2 prompts", time: "14m" },
];

const CODE_LINES = [
  [["kw", "import"], [" { Teams } "], ["kw", "from"], [" "], ["str", '"appwrite"'], [";"]],
  [[""]],
  [["kw", "const"], [" invite = "], ["kw", "await"], [" "], ["fn", "teams.createMembership"], ["({"]],
  [["  projectId,"]],
  [["  role: "], ["str", '"editor"'], [","]],
  [["com", "  // self-heals if signup happens out of order"]],
  [["});"]],
];

export default function Landing() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const termResultRef = useRef(null);

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

  // --- everything GSAP-timeline / ScrollTrigger driven ---
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // scroll progress bar
      gsap.to(".dr-progress", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: rootRef.current, start: "top top", end: "bottom bottom", scrub: 0.3 },
      });

      // magnetic buttons
      rootRef.current.querySelectorAll(".dr-magnetic").forEach((m) => {
        const target = m.querySelector("a, button") || m;
        const onMouseMove = (e) => {
          const r = m.getBoundingClientRect();
          const relX = e.clientX - r.left - r.width / 2;
          const relY = e.clientY - r.top - r.height / 2;
          gsap.to(target, { x: relX * 0.35, y: relY * 0.45, duration: 0.4, ease: "power3.out" });
        };
        const onLeave = () => gsap.to(target, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" });
        m.addEventListener("mousemove", onMouseMove);
        m.addEventListener("mouseleave", onLeave);
      });

      // split hero title into per-char spans, animate in
      const lines = rootRef.current.querySelectorAll(".dr-hero-title .dr-line span");
      lines.forEach((span) => {
        const text = span.textContent;
        span.innerHTML = "";
        [...text].forEach((ch) => {
          const s = document.createElement("span");
          s.textContent = ch === " " ? "\u00A0" : ch;
          s.style.display = "inline-block";
          span.appendChild(s);
        });
      });

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.set(".dr-hero-title .dr-line span span", { yPercent: 120 })
        .to(".dr-nav", { borderBottomColor: "rgba(255,255,255,0.07)", duration: 0.1 })
        .to(".dr-eyebrow", { opacity: 1, duration: 0.5 }, 0.1)
        .to(".dr-hero-title .dr-line span span", { yPercent: 0, duration: 1.1, stagger: 0.018 }, 0.25)
        .to(".dr-hero-sub", { opacity: 1, duration: 0.7 }, "-=0.5")
        .to(".dr-hero-cta", { opacity: 1, duration: 0.7 }, "-=0.5")
        .fromTo(".dr-term", { opacity: 0, y: 40, rotateX: 8 }, { opacity: 1, y: 0, rotateX: 0, duration: 1, ease: "power3.out" }, 0.5)
        .add(() => typeTerminalResult(), "+=0.1");

      function typeTerminalResult() {
        const el = termResultRef.current;
        if (!el) return;
        const full = " member added · role synced · notified";
        let i = 0;
        const iv = setInterval(() => {
          el.innerHTML =
            '<span class="dr-term-num">9</span><i class="fa-solid fa-check dr-term-ok"></i><span class="dr-term-ok">' +
            full.slice(0, i) +
            '</span><span class="dr-term-cursor"></span>';
          i++;
          if (i > full.length) clearInterval(iv);
        }, 22);
      }

      // stat counters
      rootRef.current.querySelectorAll(".dr-stat-num").forEach((el) => {
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || "";
        ScrollTrigger.create({
          trigger: el,
          start: "top 90%",
          once: true,
          onEnter: () => {
            const obj = { val: 0 };
            gsap.to(obj, {
              val: target,
              duration: 1.4,
              ease: "power2.out",
              onUpdate: () => { el.textContent = Math.round(obj.val) + suffix; },
            });
          },
        });
      });

      // generic reveal utilities
      gsap.utils.toArray(".dr-reveal-up").forEach((el) => {
        gsap.fromTo(el, { opacity: 0, y: 36 }, {
          opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
      gsap.utils.toArray(".dr-reveal-eyebrow").forEach((el) => {
        gsap.fromTo(el, { opacity: 0, x: -16 }, {
          opacity: 1, x: 0, duration: 0.7, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
        });
      });

      // feature cards stagger
      gsap.utils.toArray(".dr-feat-card").forEach((el, i) => {
        gsap.fromTo(el, { opacity: 0, y: 44 }, {
          opacity: 1, y: 0, duration: 0.8, delay: (i % 2) * 0.12, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
        });
      });

      // arch cards stagger
      ScrollTrigger.create({
        trigger: ".dr-arch-grid",
        start: "top 85%",
        onEnter: () => gsap.to(".dr-arch-card", { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power3.out" }),
      });

      // feed items stagger
      ScrollTrigger.create({
        trigger: ".dr-feed-list",
        start: "top 85%",
        onEnter: () => gsap.to(".dr-feed-item", { opacity: 1, x: 0, duration: 0.6, stagger: 0.12, ease: "power3.out" }),
      });

      // feature card mouse-follow glow
      rootRef.current.querySelectorAll(".dr-feat-card").forEach((card) => {
        const glow = card.querySelector(".dr-feat-glow");
        if (!glow) return;
        card.addEventListener("mousemove", (e) => {
          const r = card.getBoundingClientRect();
          gsap.to(glow, { x: e.clientX - r.left - 110, y: e.clientY - r.top - 110, duration: 0.3 });
        });
      });

      // Fonts / late-loading content can change layout after the initial
      // measure. Re-measure once everything has actually settled so scroll
      // positions for the reveal animations above stay accurate.
      requestAnimationFrame(() => ScrollTrigger.refresh());
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }
      window.addEventListener("load", () => ScrollTrigger.refresh());
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
      <nav className="dr-nav">
        <div className="dr-logo"><i className="fa-solid fa-terminal dr-chev" /> DevRoom</div>
        <div className="dr-nav-links">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#stack">Tech Stack</a>
          <a href="https://github.com/pranvi-200218/DevRoom" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-github" /> Source</a>
        </div>
        <div className="dr-nav-right">
          <button onClick={() => navigate("/dashboard")} className="dr-signin">Sign in</button>
          <span className="dr-magnetic">
            <button onClick={() => navigate("/dashboard")} className="dr-btn dr-btn-primary">Open Workspace</button>
          </span>
        </div>
      </nav>

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
              <span className="dr-magnetic">
                <button onClick={() => navigate("/dashboard")} className="dr-btn dr-btn-primary dr-big">
                  Launch Workspace <i className="fa-solid fa-arrow-right" />
                </button>
              </span>
              <span className="dr-magnetic">
                <a href="https://github.com/pranvi-200218/DevRoom" target="_blank" rel="noopener noreferrer" className="dr-btn dr-btn-ghost dr-big">
                  <i className="fa-brands fa-github" /> View source
                </a>
              </span>
            </div>
          </div>

          <div className="dr-term">
            <div className="dr-term-bar">
              <div className="dr-term-dot" style={{ background: "#ff5f57" }} />
              <div className="dr-term-dot" style={{ background: "#febc2e" }} />
              <div className="dr-term-dot" style={{ background: "#28c840" }} />
              <span style={{ marginLeft: 6 }}>devroom — invite.js</span>
            </div>
            <div className="dr-term-body">
              {CODE_LINES.map((tokens, i) => (
                <div className="dr-term-line" key={i}>
                  <span className="dr-term-num">{i + 1}</span>
                  {tokens.map((t, j) =>
                    Array.isArray(t) ? (
                      <span key={j} className={t[0] ? `dr-tok-${t[0]}` : undefined}>{t[1] ?? t[0]}</span>
                    ) : (
                      <span key={j}>{t}</span>
                    )
                  )}
                </div>
              ))}
              <div className="dr-term-line" ref={termResultRef}><span className="dr-term-num">9</span></div>
            </div>
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
              <div className="dr-flow-card dr-reveal-up" key={s.n} style={{ transitionDelay: `${i * 0.06}s` }}>
                <div className="dr-flow-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
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
          <div className="dr-arch-grid">
            {ARCH.map((a) => (
              <div className="dr-arch-card" key={a.title}>
                <span className="dr-arch-tag">{a.tag}</span>
                <span className="dr-arch-icon"><i className={a.icon} /></span>
                <h3>{a.title}</h3>
                <p>{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA + LIVE FEED ---------- */}
      <section>
        <div className="dr-wrap">
          <div className="dr-cta-split">
            <div className="dr-cta-left">
              <div className="dr-sec-eyebrow" style={{ marginBottom: 20 }}>SEE IT RUNNING</div>
              <h2 style={{ marginBottom: 16 }}>See it running.</h2>
              <p>Open the live workspace or check the source — every feature on this page is real code, not a mockup.</p>
              <div className="dr-cta-row" style={{ opacity: 1 }}>
                <span className="dr-magnetic">
                  <button onClick={() => navigate("/dashboard")} className="dr-btn dr-btn-primary dr-big">
                    Launch Workspace <i className="fa-solid fa-arrow-right" />
                  </button>
                </span>
                <span className="dr-magnetic">
                  <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="dr-btn dr-btn-ghost dr-big">
                    <i className="fa-brands fa-github" /> View Source
                  </a>
                </span>
              </div>
            </div>
            <div className="dr-cta-right">
              <div className="dr-term-bar" style={{ borderRadius: 0 }}>
                <div className="dr-term-dot" style={{ background: "#ff5f57" }} />
                <div className="dr-term-dot" style={{ background: "#febc2e" }} />
                <div className="dr-term-dot" style={{ background: "#28c840" }} />
                <span style={{ marginLeft: 6 }}>devroom · live activity</span>
              </div>
              <div className="dr-feed-list">
                {FEED.map((f, i) => (
                  <div className="dr-feed-item" key={i}>
                    <span>
                      <i className={f.icon} style={{ color: "var(--dr-cyan)", marginRight: 8 }} />
                      {f.who && <span className="dr-feed-who">{f.who} </span>}
                      {f.text}
                    </span>
                    <span className="dr-feed-time">{f.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="dr-footer">
        <div className="dr-wrap" style={{ display: "flex", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: 10 }}>
          <div className="dr-logo">DevRoom</div>
          <div>© 2026 DevRoom · Built by Pranvi Srivastava.</div>
        </div>
      </footer>
    </div>
  );
}

const DR_STYLES = `
.dr-landing{
  --dr-bg:#06070a; --dr-bg-2:#0a0c11; --dr-panel:#0e1117; --dr-panel-2:#12161e;
  --dr-line:rgba(255,255,255,0.07); --dr-line-2:rgba(255,255,255,0.12);
  --dr-text:#e7e9ee; --dr-text-dim:#8b93a3; --dr-text-faint:#575f6e;
  --dr-cyan:#5eead4; --dr-cyan-dim:rgba(94,234,212,0.14); --dr-violet:#a78bfa; --dr-amber:#fbbf6a;
  --dr-mono:'JetBrains Mono', monospace; --dr-sans:'Geist', sans-serif;
  position:relative; background:
    radial-gradient(1200px 600px at 15% -10%, rgba(94,234,212,0.05), transparent 60%),
    radial-gradient(900px 500px at 90% 10%, rgba(167,139,250,0.04), transparent 55%),
    var(--dr-bg);
  color:var(--dr-text); font-family:var(--dr-sans); overflow-x:clip; cursor:default;
}
.dr-landing *{ box-sizing:border-box; }
.dr-landing ::selection{ background:var(--dr-cyan); color:#04140f; }
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
@media(max-width:900px){ .dr-cursor-dot,.dr-cursor-ring{ display:none; } }

.dr-wrap{ max-width:1180px; margin:0 auto; padding:0 32px; }
.dr-progress{ position:fixed; top:0; left:0; height:2px; width:100%; z-index:60; background:linear-gradient(90deg,var(--dr-cyan),var(--dr-violet)); transform-origin:left; transform:scaleX(0); }

.dr-nav{ position:fixed; top:0; left:0; right:0; z-index:50; display:flex; align-items:center; justify-content:space-between;
  padding:20px 32px; backdrop-filter:blur(14px); background:rgba(6,7,10,0.55); border-bottom:1px solid transparent; }
.dr-logo{ display:flex; align-items:center; gap:9px; font-family:var(--dr-mono); font-style:italic; font-weight:700; font-size:15px; letter-spacing:0.02em; }
.dr-chev{ color:var(--dr-cyan); }
.dr-nav-links{ display:flex; gap:34px; font-family:var(--dr-mono); font-style:italic; font-size:13px; color:var(--dr-text-dim); }
.dr-nav-links a{ position:relative; transition:color .25s; }
.dr-nav-links a::after{ content:''; position:absolute; left:0; bottom:-6px; width:0; height:1px; background:var(--dr-cyan); transition:width .3s cubic-bezier(.65,0,.35,1); }
.dr-nav-links a:hover{ color:var(--dr-text); }
.dr-nav-links a:hover::after{ width:100%; }
.dr-nav-right{ display:flex; align-items:center; gap:22px; }
.dr-signin{ font-family:var(--dr-mono); font-style:italic; font-size:13px; color:var(--dr-text-dim); }
.dr-btn{ font-family:var(--dr-mono); font-style:italic; font-size:13px; font-weight:600; padding:10px 18px; border-radius:7px; display:inline-flex; align-items:center; gap:8px; }
.dr-btn-primary{ background:var(--dr-cyan); color:#04140f; }
.dr-btn-ghost{ border:1px solid var(--dr-line-2); color:var(--dr-text); background:rgba(255,255,255,0.02); }
@media(max-width:900px){ .dr-nav-links{ display:none; } }

.dr-hero{ padding:170px 0 90px; position:relative; }
.dr-hero-grid{ display:grid; grid-template-columns:1.05fr 1fr; gap:60px; align-items:start; }
@media(max-width:980px){ .dr-hero-grid{ grid-template-columns:1fr; } }
.dr-eyebrow{ font-family:var(--dr-mono); font-style:italic; font-size:12.5px; color:var(--dr-cyan); letter-spacing:0.04em; display:flex; align-items:center; gap:10px; margin-bottom:26px; opacity:0; }
.dr-dot{ width:6px; height:6px; border-radius:50%; background:var(--dr-cyan); box-shadow:0 0 10px var(--dr-cyan); }
.dr-hero-title{ font-family:var(--dr-sans); font-weight:800; font-size:clamp(38px,5vw,60px); line-height:1.06; letter-spacing:-0.02em; margin-bottom:24px; }
.dr-line{ display:block; overflow:hidden; }
.dr-line span{ display:inline-block; will-change:transform; }
.dr-highlight{ color:var(--dr-cyan); font-style:normal; }
.dr-hero-sub{ font-size:16.5px; line-height:1.7; color:var(--dr-text-dim); max-width:480px; margin-bottom:34px; opacity:0; }
.dr-hero-sub b{ color:var(--dr-text); font-weight:600; }
.dr-cta-row{ display:flex; gap:14px; flex-wrap:wrap; }
.dr-hero-cta{ opacity:0; }
.dr-big{ padding:14px 24px; font-size:14px; border-radius:9px; }
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

.dr-arch-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.dr-arch-card{ background:var(--dr-panel); border:1px solid var(--dr-line); border-radius:12px; padding:26px; opacity:0; transform:translateY(30px); position:relative; }
.dr-arch-tag{ position:absolute; top:22px; right:22px; font-family:var(--dr-mono); font-style:italic; font-size:10px; color:var(--dr-text-faint); letter-spacing:0.08em; }
.dr-arch-card h3{ font-size:16px; font-weight:700; margin:16px 0 10px; }
.dr-arch-card p{ font-size:13.5px; color:var(--dr-text-dim); line-height:1.6; }
.dr-arch-icon{ font-size:20px; }
@media(max-width:900px){ .dr-arch-grid{ grid-template-columns:1fr; } }

.dr-cta-split{ display:grid; grid-template-columns:1fr 1fr; border:1px solid var(--dr-line-2); border-radius:16px; overflow:hidden; background:linear-gradient(160deg, var(--dr-panel), var(--dr-bg-2)); }
.dr-cta-left{ padding:56px; }
.dr-cta-left h2{ margin-bottom:16px; }
.dr-cta-left p{ color:var(--dr-text-dim); font-size:15px; line-height:1.7; margin-bottom:32px; max-width:400px; }
.dr-cta-right{ background:var(--dr-panel-2); border-left:1px solid var(--dr-line); }
.dr-feed-item{ display:flex; justify-content:space-between; gap:12px; padding:16px 22px; border-bottom:1px solid var(--dr-line); font-family:var(--dr-mono); font-style:italic; font-size:12.5px; color:var(--dr-text-dim); opacity:0; transform:translateX(16px); }
.dr-feed-who{ color:var(--dr-cyan); }
.dr-feed-time{ color:var(--dr-text-faint); flex-shrink:0; }
@media(max-width:900px){ .dr-cta-split{ grid-template-columns:1fr; } .dr-cta-right{ border-left:none; border-top:1px solid var(--dr-line); } }

.dr-footer{ border-top:1px solid var(--dr-line); padding:30px 0; display:flex; justify-content:space-between; font-family:var(--dr-mono); font-style:italic; font-size:12px; color:var(--dr-text-faint); }
.dr-footer .dr-logo{ font-size:13px; }
@media(max-width:600px){ .dr-footer{ flex-direction:column; gap:10px; text-align:center; } }
`;