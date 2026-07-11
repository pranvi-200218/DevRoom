import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMembers } from "../hooks/useMembers";
import { useProject } from "../hooks/useProjects";
import { useUser } from "../context/UserContext";
import { relativeTime } from "../lib/format";

const ROLES = ["Owner", "Editor", "Viewer"];

function initials(nameOrEmail) {
  const base = nameOrEmail || "?";
  const parts = base.split(/[@\s._-]+/).filter(Boolean);
  return (parts[0]?.[0] || "?").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
}

function Avatar({ label }) {
  return (
    <div className="w-10 h-10 rounded-lg bg-surface-container-highest border border-white/10 flex items-center justify-center text-sm font-bold text-primary">
      {initials(label)}
    </div>
  );
}

export default function MemberManagement() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const currentUser = useUser();
  const { project } = useProject(projectId);
  const {
    activeMembers,
    pendingInvites,
    loading,
    error,
    inviteMember,
    updateRole,
    removeMember,
    resendInvite,
  } = useMembers(projectId);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Editor");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  async function handleInvite(e) {
    e.preventDefault();
    if (!email.trim()) {
      setFormError("Enter an email address.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await inviteMember({
        email: email.trim(),
        role,
        projectName: project?.name || "a DevRoom OS project",
        inviterName: currentUser.name,
      });
      setEmail("");
    } catch (err) {
      setFormError(err.message || "Failed to send invite.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id) {
    if (!window.confirm("Remove this member?")) return;
    try {
      await removeMember(id);
    } catch (err) {
      alert(err.message || "Failed to remove member.");
    }
  }

  function handleExportCsv() {
    const rows = [["Name", "Email", "Role", "Status"]];
    activeMembers.forEach((m) => rows.push([m.name || "", m.email || "", m.role || "", m.status || ""]));
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(project?.name || "project").replace(/\s+/g, "-").toLowerCase()}-members.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return (
    <>
    {/* SideNavBar */}
    <aside className="w-sidebar-width h-full fixed left-0 top-0 bg-surface-dim border-r border-white/5 flex flex-col p-4 z-50">
        <div className="mb-8 px-2">
            <h1 className="font-headline-md text-headline-md font-bold text-primary">DevRoom</h1>
            <p className="text-on-surface-variant text-[12px] opacity-70">Collaborative Space</p>
        </div>
        <nav className="flex-1 space-y-1">
            <a onClick={(e) => { e.preventDefault(); navigate("/"); }} className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-on-surface-variant hover:bg-white/5 hover:text-on-surface" href="#">
                <span className="material-symbols-outlined text-[20px]">home</span>
                <span className="font-body-sm">Home</span>
            </a>
            <a onClick={(e) => { e.preventDefault(); navigate("/"); }} className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-on-surface-variant hover:bg-white/5 hover:text-on-surface" href="#">
                <span className="material-symbols-outlined text-[20px]">account_tree</span>
                <span className="font-body-sm">Projects</span>
            </a>
            <a onClick={(e) => { e.preventDefault(); navigate(`/project/${projectId}/settings`); }} className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-on-surface-variant hover:bg-white/5 hover:text-on-surface" href="#">
                <span className="material-symbols-outlined text-[20px]">settings</span>
                <span className="font-body-sm">Settings</span>
            </a>
        </nav>
        <div className="mt-auto pt-4 border-t border-white/5">
            <button onClick={() => navigate("/")} className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-on-primary rounded-lg font-medium active:scale-95 transition-all duration-100">
<span className="material-symbols-outlined text-[18px]">add</span>
<span>New Project</span>
</button>
            <div className="mt-6 flex items-center gap-3 px-2">
                <img className="w-8 h-8 rounded-full border border-white/10 object-cover" alt={currentUser.name}
                    src={currentUser.avatarUrl}
                />
                <div className="overflow-hidden">
                    <p className="text-body-sm font-medium truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">Pro Plan</p>
                </div>
            </div>
        </div>
    </aside>
    {/* TopNavBar */}
    <header className="h-16 fixed top-0 right-0 z-40 bg-surface/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-gutter ml-sidebar-width w-[calc(100%-260px)]">
        <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md group focus-within:ring-1 focus-within:ring-primary rounded-lg transition-all duration-200">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                <input className="w-full bg-surface-container-lowest border-none rounded-lg pl-10 pr-4 py-2 text-body-sm focus:ring-0 placeholder:text-on-surface-variant/50" placeholder="Search members..." type="text" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-white/10 text-[10px] text-on-surface-variant font-code-sm">
                    ⌘K
                </div>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors" title="Notifications aren't built yet">
<span className="material-symbols-outlined">notifications</span>
</button>
            <div className="w-8 h-8 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center overflow-hidden">
                <img className="w-full h-full object-cover" data-alt="A sleek, minimalist profile avatar represention, rendered in a 3D isometric style with soft shadows and a cool color palette of deep grays and electric cyans. The lighting is focused and clean, embodying a high-end tech aesthetic."
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxuBhjIK1K1VpegiE1WbIlUxuE1Zbsg2OuXBf5J6Nlj-JQ2ARWVQP2fVnYG-b92DfXhcJQcJno-cGmu5vru0UySFVA9SaZRfZVWBPV2Mhv03NhQIhEp2UAk95k1vojXmTvI1T5HeyCm8-Ydp30rjmYD9fPlNcnKzAz_7WMEkBggBKy_-tFDfjsJXMgKxq8gsH1GJTZCRiPmGpihEpGJQ_vJqY0KOgGr_8TyAqPdgzbtZgVGZD52t4WKanrt6HoCe-vz5Glf_0g_jI"
                />
            </div>
        </div>
    </header>
    {/* Main Content Canvas */}
    <main className="ml-sidebar-width pt-16 min-h-screen bg-background">
        <div className="max-w-container-max mx-auto px-margin-desktop py-10">
            {/* Header Section */}
            <div className="mb-10">
                <div className="flex items-end gap-3 mb-2">
                    <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Member Management</h2>
                    <span className="bg-surface-container-high px-3 py-1 rounded-full text-label-caps text-primary border border-primary/20 mb-2">Team ({activeMembers.length})</span>
                </div>
                <p className="text-on-surface-variant font-body-lg max-w-2xl">Manage your team's access, invite new collaborators, and control permission levels for this workspace.</p>
            </div>
            <div className="grid grid-cols-12 gap-8">
                {/* Invite Section - Left Column (Bento Style) */}
                <div className="col-span-12 lg:col-span-4 space-y-8">
                    <section className="glass-panel-members rounded-xl p-6 shadow-2xl relative overflow-hidden group">
                        {/* Decorative glow */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                        <div className="relative z-10">
                            <h3 className="text-body-lg font-semibold text-on-surface mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">person_add</span> Invite New Member
                            </h3>
                            <form className="space-y-4" onSubmit={handleInvite}>
                                <div className="space-y-2">
                                    <label className="text-label-caps text-on-surface-variant">Email Address</label>
                                    <div className="relative primary-glow-focus rounded-lg">
                                        <input
                                          value={email}
                                          onChange={(e) => setEmail(e.target.value)}
                                          className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-3 text-body-sm focus:border-primary focus:ring-0 transition-all placeholder:text-on-surface-variant/30" placeholder="colleague@company.com" type="email" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-label-caps text-on-surface-variant">Assigned Role</label>
                                    <select
                                      value={role}
                                      onChange={(e) => setRole(e.target.value)}
                                      className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-3 text-body-sm focus:border-primary focus:ring-0 appearance-none transition-all cursor-pointer">
{ROLES.map((r) => (
  <option key={r} value={r}>{r}</option>
))}
</select>
                                </div>
                                {formError && <p className="text-error text-xs">{formError}</p>}
                                <div className="pt-2">
                                    <button disabled={submitting} className="w-full py-3 bg-primary text-on-primary rounded-lg font-bold text-label-caps tracking-widest uppercase hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50" type="submit">
                                        {submitting ? "Sending…" : "Send Invite"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>
                    <section className="glass-panel-members rounded-xl p-6">
                        <h3 className="text-body-lg font-semibold text-on-surface mb-4">Pending Invitations</h3>
                        <div className="space-y-4">
{pendingInvites.length === 0 && (
  <p className="text-xs text-on-surface-variant">No pending invitations.</p>
)}
{pendingInvites.map((invite) => (
  <div key={invite.$id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
      <div className="overflow-hidden">
          <p className="text-body-sm font-medium truncate">{invite.email}</p>
          <p className="text-[11px] text-on-surface-variant">Sent {relativeTime(invite.$updatedAt)} • {invite.role}</p>
      </div>
      <div className="flex items-center gap-1">
          <button onClick={() => resendInvite(invite.$id)} className="p-2 text-on-surface-variant hover:text-primary transition-colors" title="Resend">
<span className="material-symbols-outlined text-[18px]">refresh</span>
</button>
          <button onClick={() => removeMember(invite.$id)} className="p-2 text-on-surface-variant hover:text-error transition-colors" title="Cancel">
<span className="material-symbols-outlined text-[18px]">close</span>
</button>
      </div>
  </div>
))}
                        </div>
                    </section>
                </div>
                {/* Current Members List - Right Column */}
                <div className="col-span-12 lg:col-span-8">
                    <div className="glass-panel-members rounded-xl overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <h3 className="font-semibold text-on-surface">Active Members</h3>
                            <button onClick={handleExportCsv} disabled={activeMembers.length === 0} className="text-label-caps text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
<span className="material-symbols-outlined text-[16px]">download</span>
                                Export List
                            </button>
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-label-caps text-on-surface-variant border-b border-white/5">
                                        <th className="px-6 py-4 font-semibold">User</th>
                                        <th className="px-6 py-4 font-semibold">Role</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
{loading && (
  <tr><td colSpan={3} className="px-6 py-8 text-center text-on-surface-variant text-sm">Loading members…</td></tr>
)}
{!loading && error && (
  <tr><td colSpan={3} className="px-6 py-8 text-center text-error text-sm">{error}</td></tr>
)}
{!loading && !error && activeMembers.length === 0 && (
  <tr><td colSpan={3} className="px-6 py-8 text-center text-on-surface-variant text-sm">No members yet. Invite someone above.</td></tr>
)}
{!loading && !error && activeMembers.map((member) => (
  <tr key={member.$id} className="hover:bg-white/5 transition-colors group">
      <td className="px-6 py-4">
          <div className="flex items-center gap-3">
              <Avatar label={member.name || member.email} />
              <div>
                  <p className="font-medium text-on-surface flex items-center gap-2">
                      {member.name || member.email}
                  </p>
                  <p className="text-[12px] text-on-surface-variant">{member.email}</p>
              </div>
          </div>
      </td>
      <td className="px-6 py-4">
          <select
            value={member.role}
            onChange={(e) => updateRole(member.$id, e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-body-sm text-on-surface hover:text-primary cursor-pointer p-0">
{ROLES.map((r) => (
  <option key={r} value={r}>{r}</option>
))}
</select>
      </td>
      <td className="px-6 py-4 text-right">
          <button onClick={() => handleRemove(member.$id)} className="opacity-0 group-hover:opacity-100 p-2 text-on-surface-variant hover:text-error transition-all">
<span className="material-symbols-outlined text-[20px]">delete_outline</span>
</button>
      </td>
  </tr>
))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex justify-between items-center text-[12px] text-on-surface-variant">
                            <span>Showing {activeMembers.length} of {activeMembers.length} members</span>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 rounded border border-white/10 transition-colors opacity-40 cursor-not-allowed" disabled title="Pagination isn't built yet — this shows everyone">Previous</button>
                                <button className="px-3 py-1 rounded border border-white/10 transition-colors opacity-40 cursor-not-allowed" disabled title="Pagination isn't built yet — this shows everyone">Next</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
    </>
  );
}