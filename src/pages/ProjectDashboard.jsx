import { useParams, useNavigate } from "react-router-dom";
import { useProject } from "../hooks/useProjects";

export default function ProjectDashboard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { project, loading, error } = useProject(projectId);

  if (loading) {
    return (
      <div className="ml-sidebar-width min-h-screen flex items-center justify-center text-on-surface-variant">
        Loading project…
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="ml-sidebar-width min-h-screen flex flex-col items-center justify-center gap-4 text-center px-8">
        <p className="text-white font-medium">Project not found</p>
        <p className="text-on-surface-variant text-sm max-w-sm">{error || "This project may have been deleted."}</p>
        <button
          onClick={() => navigate("/")}
          className="bg-primary text-on-primary px-5 py-2 rounded font-bold text-sm hover:brightness-110 active:scale-95 transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <>
    {/* SideNavBar (Shared Component) */}
    <aside className="w-sidebar-width h-full fixed left-0 top-0 bg-surface-dim border-r border-white/5 flex flex-col p-4 z-50">
        <div className="mb-10 px-2">
            <h1 className="font-headline-md text-headline-md font-bold text-primary">DevRoom</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant opacity-70">Collaborative Space</p>
        </div>
        <nav className="flex-1 space-y-1">
            <a onClick={(e) => { e.preventDefault(); navigate("/"); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors bg-surface-container-high text-primary font-medium active:scale-95 duration-100" href="#">
                <span className="material-symbols-outlined" data-icon="home">home</span>
                <span className="font-body-sm text-body-sm">Home</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-on-surface-variant hover:text-on-surface hover:bg-white/5 active:scale-95 duration-100" href="#">
                <span className="material-symbols-outlined" data-icon="account_tree">account_tree</span>
                <span className="font-body-sm text-body-sm">Projects</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-on-surface-variant hover:text-on-surface hover:bg-white/5 active:scale-95 duration-100" href="#">
                <span className="material-symbols-outlined" data-icon="settings">settings</span>
                <span className="font-body-sm text-body-sm">Settings</span>
            </a>
        </nav>
        <div className="mt-auto pt-6">
            <button onClick={() => navigate("/")} className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-lg font-medium hover:brightness-110 transition-all active:scale-95">
<span className="material-symbols-outlined text-[20px]" data-icon="add">add</span>
<span className="font-body-sm text-body-sm">New Project</span>
</button>
        </div>
    </aside>
    {/* TopNavBar (Shared Component) */}
    <header className="h-16 fixed top-0 right-0 z-40 bg-surface/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-gutter ml-sidebar-width w-[calc(100%-260px)]">
        <div className="flex items-center gap-4 bg-surface-container-lowest border border-white/5 rounded-lg px-3 py-1.5 w-96 focus-within:ring-1 focus-within:ring-primary transition-all">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]" data-icon="search">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-body-sm w-full placeholder:text-on-surface-variant/50" placeholder="Search commands or files..." type="text" />
            <span className="text-on-surface-variant/30 text-[10px] font-code-sm border border-white/10 rounded px-1">⌘K</span>
        </div>
        <div className="flex items-center gap-4">
            <button className="text-on-surface-variant hover:text-primary transition-colors relative">
<span className="material-symbols-outlined" data-icon="notifications">notifications</span>
<span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border-2 border-surface"></span>
</button>
            <div className="h-8 w-8 rounded-full overflow-hidden border border-white/10">
                <img className="w-full h-full object-cover" data-alt="A professional studio headshot of a software engineer with short hair, wearing a minimalist black turtleneck, set against a dark moody architectural background with cyan accent lighting and deep shadows."
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1sLc1AMfhCMEz-PjONtnzmRt4Lb3hzDtQMdBvNMY3g9LXygcehxDjGpKJjeGCymZNR5mAko2Tvlml2zZbXvKkUWUWtRJRx-kHG9wFUMBk9m169pita-XiTtfsAeczgywf-ts8antzQRBB3LSxvgC6T9Wjkf30jVRRrdBmmAN-Ay5R1mAr3qLY2q1nocgiklnlpy5kUTV3E-8hCtPZpfT6d_KjB3JlsV_7nmddSDR2OH1RC1-nmbppEKy578pxFtTFvT6KJr-59dw"
                />
            </div>
        </div>
    </header>
    {/* Main Content Canvas */}
    <main className="ml-sidebar-width pt-16 h-screen overflow-hidden flex">
        {/* Scrollable Dashboard Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-gutter space-y-8 max-w-container-max">
            {/* Header Section */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <nav className="flex items-center gap-2 text-on-surface-variant mb-2">
                        <span className="text-label-caps font-label-caps">Projects</span>
                        <span className="material-symbols-outlined text-[14px]" data-icon="chevron_right">chevron_right</span>
                        <span className="text-label-caps font-label-caps text-primary">{project.name}</span>
                    </nav>
                    <h2 className="font-headline-lg text-headline-lg text-white">{project.name}</h2>
                    <p className="text-on-surface-variant font-body-sm mt-1 max-w-lg">{project.description || "No description yet."}</p>
                </div>
                <div className="flex items-center -space-x-3">
                    <div className="w-10 h-10 rounded-full border-2 border-surface overflow-hidden group relative">
                        <img className="w-full h-full object-cover" data-alt="Close-up portrait of a woman with curly hair and glasses, working in a dimly lit developer environment with soft cyan reflections on her face from the computer screen." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9Es7MnznjIggRXoCqLG_zhPC5he4H0W9CxtYQ1mBOy61cxj7FYna4hP-KhOj96ZhCXtYRL_6fuhkx5OyqNDbleGjkFnOJe5Q_1wZVn_H93zDyQMvsgZ8tQu-93ID3Kj0sAvwzgWiD-IXO8eiuH2hxtJPfgkTwysbtmtUTmakDBXEbnXKimv4hP5kUuQiiNUQG8z2B85a_pj9w_t02RSG3JFjXe62O1C-im3qKntBUSdIkC7Ah_pQf2_e3sxhMD3dZ194-j34lbOg"
                        />
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-surface overflow-hidden group relative">
                        <img className="w-full h-full object-cover" data-alt="Candid shot of a young man with a beanie focused on a monitor, high-contrast dark mode lighting with a subtle purple glow in the background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBa-96lQ_HkOLRnfY9D47RbVU2sX2MHXsz06LJFKZns3LBluYSfNU4SQYB38SqdxPErjOFMy8H8e5Ekusg878gGe8bWEuDxCu61zNqpPGgTNtS_jljyBlAPSA7hyJvpeVcLUG7hNLLb_tS-CFwptK6x7_ogWKcOzuTRygGqr15UXpwip05T2pf3fH5WuQm3-AXPXxM9DguNe_kgaJzmECD-7_yxTVjXnJhmdgr3OBg9QlL4fAcfU3fkDxNgglRIiWvHTYrwf-AYPSc"
                        />
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-surface overflow-hidden group relative">
                        <img className="w-full h-full object-cover" data-alt="Detailed close-up of a person's hands typing on a mechanical keyboard with RGB lighting set to a deep electric blue, blurred technical documentation in the background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6RmthBrZW5M4xXPLrF-u3Ntime9QtXS6PkybvppRRmR8QdzQ9uC_rHpm1Nov2JN6-GTnc-7I9jJlfdbSHHbLdIn8VeBBaYJ3OZ2QGHeOG39grsvPAMpMHfk-1MinR4dnZgtpR33m-WKDu4UiwtxomL_suo_egpBk8MAk9cjzVBoyTSkY3l2NEFEKEANyQ-3okFa4Xwt89jby1R_EWIChV3OcKgfHca3sE0YFeNq4fsIpsNkdz-l5sftrTMnSx9a1SrsROq9I98CM"
                        />
                    </div>
                    <button className="w-10 h-10 rounded-full border-2 border-dashed border-white/20 bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all active:scale-90">
<span className="material-symbols-outlined" data-icon="add">add</span>
</button>
                </div>
            </section>
            {/* Bento Status Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 glass-panel-dash p-8 rounded-xl relative overflow-hidden group">

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <span className="text-label-caps font-label-caps text-primary border border-primary/20 bg-primary/5 px-2 py-1 rounded">Active Sprint</span>
                            <h3 className="text-headline-md font-headline-md mt-4">78% Complete</h3>
                            <p className="text-on-surface-variant font-body-sm mt-2">12 tasks remaining for MVP Alpha release. The team is ahead of schedule.</p>
                        </div>
                        <div className="mt-8">
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                <div className="bg-primary h-full w-[78%] primary-glow"></div>
                            </div>
                            <div className="flex justify-between mt-3 text-label-caps font-label-caps text-on-surface-variant opacity-60">
                                <span>Milestone: Base Architecture</span>
                                <span>Next: MVP Alpha</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="glass-panel-dash p-8 rounded-xl flex flex-col justify-between border-primary/20 primary-glow">
                    <div>
                        <span className="material-symbols-outlined text-primary text-[32px]" data-icon="rocket_launch">rocket_launch</span>
                        <h3 className="font-headline-md text-headline-md mt-4">Next Milestone</h3>
                    </div>
                    <div>
                        <p className="text-white font-medium text-body-lg">MVP Alpha Launch</p>
                        <p className="text-on-surface-variant font-body-sm mt-1">Scheduled for Friday, Oct 24</p>
                        <button className="mt-6 w-full py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-label-caps font-label-caps">View Roadmap</button>
                    </div>
                </div>
            </section>
            {/* Quick Link Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div onClick={() => navigate(`/project/${projectId}/ai`)} className="glass-panel-dash p-6 rounded-xl group hover:border-primary/40 transition-all cursor-pointer">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[28px]" data-icon="terminal">terminal</span>
                    </div>
                    <h4 className="font-headline-md text-[20px] mb-2">AI Workspace</h4>
                    <p className="text-on-surface-variant font-body-sm mb-4">Integrated LLM for code generation and architectural reasoning.</p>
                    <div className="flex items-center text-primary text-label-caps font-label-caps gap-2 group-hover:translate-x-1 transition-transform">
                        <span>Launch Instance</span>
                        <span className="material-symbols-outlined text-[16px]" data-icon="arrow_forward">arrow_forward</span>
                    </div>
                </div>
                <div onClick={() => navigate(`/project/${projectId}/resources`)} className="glass-panel-dash p-6 rounded-xl group hover:border-secondary/40 transition-all cursor-pointer">
                    <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[28px]" data-icon="folder_managed">folder_managed</span>
                    </div>
                    <h4 className="font-headline-md text-[20px] mb-2">Resource Vault</h4>
                    <p className="text-on-surface-variant font-body-sm mb-4">Secure repository for documentation, assets, and key secrets.</p>
                    <div className="flex items-center text-secondary text-label-caps font-label-caps gap-2 group-hover:translate-x-1 transition-transform">
                        <span>Browse Assets</span>
                        <span className="material-symbols-outlined text-[16px]" data-icon="arrow_forward">arrow_forward</span>
                    </div>
                </div>
                <div className="glass-panel-dash p-6 rounded-xl group hover:border-tertiary/40 transition-all cursor-pointer">
                    <div className="w-12 h-12 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary mb-6 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[28px]" data-icon="upload_file">upload_file</span>
                    </div>
                    <h4 className="font-headline-md text-[20px] mb-2">Submission Center</h4>
                    <p className="text-on-surface-variant font-body-sm mb-4">Central portal for build uploads and QA distribution.</p>
                    <div className="flex items-center text-tertiary text-label-caps font-label-caps gap-2 group-hover:translate-x-1 transition-transform">
                        <span>Submit Build</span>
                        <span className="material-symbols-outlined text-[16px]" data-icon="arrow_forward">arrow_forward</span>
                    </div>
                </div>
            </section>
            {/* Metrics / Charts Section */}
            <section className="glass-panel-dash rounded-xl p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="font-headline-md text-headline-md">Commit Velocity</h3>
                    <select className="bg-surface-container-lowest border-white/5 rounded-lg text-label-caps font-label-caps focus:ring-primary">
<option>Last 7 Days</option>
<option>Last 30 Days</option>
</select>
                </div>
                <div className="h-48 flex items-end justify-between gap-4">
                    {/* Bar Chart Simplified */}
                    <div className="flex-1 bg-white/5 rounded-t-sm hover:bg-primary/20 transition-colors h-[40%]"></div>
                    <div className="flex-1 bg-white/5 rounded-t-sm hover:bg-primary/20 transition-colors h-[65%]"></div>
                    <div className="flex-1 bg-white/5 rounded-t-sm hover:bg-primary/20 transition-colors h-[50%]"></div>
                    <div className="flex-1 bg-primary/40 rounded-t-sm h-[85%] relative">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-primary font-code-sm text-[11px]">89</div>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-t-sm hover:bg-primary/20 transition-colors h-[45%]"></div>
                    <div className="flex-1 bg-white/5 rounded-t-sm hover:bg-primary/20 transition-colors h-[60%]"></div>
                    <div className="flex-1 bg-white/5 rounded-t-sm hover:bg-primary/20 transition-colors h-[75%]"></div>
                    <div className="flex-1 bg-white/5 rounded-t-sm hover:bg-primary/20 transition-colors h-[30%]"></div>
                    <div className="flex-1 bg-white/5 rounded-t-sm hover:bg-primary/20 transition-colors h-[55%]"></div>
                </div>
            </section>
        </div>
        {/* Recent Activity Feed (Sidebar) */}
        <aside className="w-80 border-l border-white/5 bg-surface-container-lowest overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5">
                <h3 className="text-label-caps font-label-caps text-on-surface-variant flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> Recent Activity
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* Activity Item 1 */}
                <div className="flex gap-4 group">
                    <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                            <img className="w-full h-full object-cover" data-alt="Headshot of Elena, a software developer with a focused expression and minimal jewelry, in a sharp cinematic lighting setup featuring cool blue and deep grey tones." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZaoYoDUnTmg7d01Tf7rYbIlsxjJCOMMyy5p39aydFBFEdHx1VRb1YQ4moxsSArlASmb_cHMy-WJaBXrW-0WHCT8-YzWa3Ti4YdnsWuBXjyLXieIkjU9BDtsi23xNsyDcQOJNR4dK73UE-fKBy4liOQaMjcr7GQE26qtr2zAA-Vu7Nut326loFXjihbBAJ6HRamGrFaUQR9lGcVXjebqRotLxgLFFaxr8tAtkKGZo2hjCGY6bpKS3qalbNYElWi7sHPByfdAbFWy0"
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center border-2 border-surface-container-lowest">
                            <span className="material-symbols-outlined text-[10px] text-on-primary" data-icon="upload">upload</span>
                        </div>
                    </div>
                    <div>
                        <p className="font-body-sm text-body-sm"><span className="text-white font-medium">Elena</span> uploaded <span className="text-primary font-code-sm">auth_spec.pdf</span></p>
                        <p className="text-[12px] text-on-surface-variant mt-1">2 hours ago • Architecture</p>
                    </div>
                </div>
                {/* Activity Item 2 */}
                <div className="flex gap-4 group">
                    <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                            <img className="w-full h-full object-cover" data-alt="Close up of Marcus, an African American engineer with a confident look and glasses, illuminated by the soft glow of a nearby purple neon light in a high-tech office setting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHKcELO1acxffO0pQdULvYVUuh56e5_eDU6lchfsVUdiucKsNpLWAX9r4sRKzLH2h7M7o2GaC8IZVprbq2nzoyeoFZBGgWQb58FTACdeGcwKjZwqDcKGuZE6au7MlPowyOKVZoLQLbO8yXbOYzw2PP-Xg04Fk46sSDK3_fQc1os7zySpjtp_KK6sQY6HWpnar7rN1fGIaGCE_ME4BZ41WycqmCtEkcaK73qhgWy1B5YhC-Div6l5L3BnG8ky4PionVWyJrpXbRd_8"
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-secondary flex items-center justify-center border-2 border-surface-container-lowest">
                            <span className="material-symbols-outlined text-[10px] text-on-secondary" data-icon="push_pin">push_pin</span>
                        </div>
                    </div>
                    <div>
                        <p className="font-body-sm text-body-sm"><span className="text-white font-medium">Marcus</span> pinned a response in <span className="text-secondary font-medium">Frontend Room</span></p>
                        <p className="text-[12px] text-on-surface-variant mt-1">5 hours ago • Discussion</p>
                    </div>
                </div>
                {/* Activity Item 3 */}
                <div className="flex gap-4 group">
                    <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                            <img className="w-full h-full object-cover" data-alt="Portrait of Elena in profile, looking at a wall of screens with data visualizations, captured in a cinematic shallow depth of field with vibrant blue and magenta lighting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuhHiXlNjuxMYYVhSn4RJ51hOK0wBbZfBjs55F1MLwUl05Hn2AY3tRXTFEGDHmmWrkxDYiZFB3DsgkSClZvOYsJbw6iYBX-SRumqoxpcW3culls3fWdwkuspaJ9YPzZm7QqAa27J_K6vo13lJn13tKeEGA_aIXrXyIYfIbN_3AIuq15ACQvlfQAqOewIfEVoj12eIcUZmLsGLf7D60ldzVoMw44Qe_eAjnBfL9d-BtfidHKOdVzpDbRcoORFamjPNQwqr950XsODY"
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-tertiary flex items-center justify-center border-2 border-surface-container-lowest">
                            <span className="material-symbols-outlined text-[10px] text-on-tertiary" data-icon="merge_type">merge_type</span>
                        </div>
                    </div>
                    <div>
                        <p className="font-body-sm text-body-sm"><span className="text-white font-medium">Elena</span> merged PR <span className="text-tertiary font-code-sm">#402</span> into main</p>
                        <p className="text-[12px] text-on-surface-variant mt-1">8 hours ago • Engineering</p>
                    </div>
                </div>
                {/* Activity Item 4 */}
                <div className="flex gap-4 group opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                    <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-surface-variant text-[18px]" data-icon="robot_2">robot_2</span>
                        </div>
                    </div>
                    <div>
                        <p className="font-body-sm text-body-sm"><span className="text-white font-medium">DevRoom Bot</span> deployed build <span className="text-on-surface-variant font-code-sm">v0.8.2-beta</span></p>
                        <p className="text-[12px] text-on-surface-variant mt-1">Yesterday • DevOps</p>
                    </div>
                </div>
            </div>
            <div className="p-6 mt-auto">
                <button className="w-full py-2 bg-white/5 border border-white/5 rounded-lg text-label-caps font-label-caps hover:bg-white/10 transition-colors">
                    View Full Audit Log
                </button>
            </div>
        </aside>
    </main>
    </>
  );
}
