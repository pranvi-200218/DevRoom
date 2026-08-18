import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import usePageEntrance from "../hooks/usePageEntrance";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/Dialog";
import { useMembers } from "../hooks/useMembers";
import { useProject } from "../hooks/useProjects";
import { useUser } from "../context/UserContext";
import { useProfiles } from "../hooks/useProfiles";
import { relativeTime } from "../lib/format";
import NotificationBell from "../components/NotificationBell";
import { mi } from "../lib/icons";
import Loader from "../components/Loader";

const ROLES = ["Owner", "Editor", "Viewer"];

function initials(nameOrEmail) {
  const base = nameOrEmail || "?";
  const parts = base.split(/[@\s._-]+/).filter(Boolean);
  return (parts[0]?.[0] || "?").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
}

function Avatar({ label, avatarUrl }) {
  if (avatarUrl) {
    return (
      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
        <img src={avatarUrl} alt={label} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-lg bg-surface-container-highest border border-white/10 flex items-center justify-center text-sm font-bold text-primary">
      {initials(label)}
    </div>
  );
}

export default function MemberManagement() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
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
  const profiles = useProfiles(activeMembers.map((m) => m.userId));

  usePageEntrance([loading]);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Editor");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const filteredMembers = activeMembers.filter((m) => {
    const term = memberSearch.trim().toLowerCase();
    if (!term) return true;
    return (m.name || "").toLowerCase().includes(term) || (m.email || "").toLowerCase().includes(term);
  });

  async function handleCopyInviteLink() {
    const link = `${window.location.origin}/join/${projectId}`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.show(`Couldn't copy automatically — invite link: ${link}`, { type: "info", duration: 6000 });
    }
  }

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

  async function handleRoleChange(id, role, el) {
    try {
      await updateRole(id, role);
      if (el && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.fromTo(el, { scale: 1.15, color: "#8aebff" }, { scale: 1, duration: 0.4, ease: "back.out(2)", clearProps: "color" });
      }
      toast.show(`Role updated to ${role}.`, { type: "success" });
    } catch (err) {
      toast.show(err.message || "Failed to update role.", { type: "error" });
    }
  }

  async function handleRemove(id) {
    const ok = await confirm({ title: "Remove this member?", tone: "danger", confirmLabel: "Remove" });
    if (!ok) return;
    const row = document.querySelector(`[data-member-row="${id}"]`);
    try {
      if (row && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        await new Promise((resolve) => {
          gsap.to(row, { opacity: 0, x: 24, duration: 0.3, ease: "power2.in", onComplete: resolve });
        });
      }
      await removeMember(id);
      toast.show("Member removed.", { type: "success" });
    } catch (err) {
      toast.show(err.message || "Failed to remove member.", { type: "error" });
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
    <aside className="gsap-sidebar w-sidebar-width h-full fixed left-0 top-0 bg-surface-dim border-r border-white/5 flex flex-col p-4 z-50">
        <div className="mb-8 px-2">
            <h1 className="font-headline-md text-headline-md font-bold text-primary">DevRoom</h1>
            <p className="text-on-surface-variant text-[12px] opacity-70">Collaborative Space</p>
        </div>
        <nav className="flex-1 space-y-1">
            <a onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }} className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-on-surface-variant hover:bg-white/5 hover:text-on-surface" href="#">
                <i className={`${mi("home")} text-[20px]`} />
                <span className="font-body-sm">Home</span>
            </a>
            <a onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }} className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-on-surface-variant hover:bg-white/5 hover:text-on-surface" href="#">
                <i className={`${mi("account_tree")} text-[20px]`} />
                <span className="font-body-sm">Projects</span>
            </a>
            <a onClick={(e) => { e.preventDefault(); navigate(`/project/${projectId}/settings`); }} className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-on-surface-variant hover:bg-white/5 hover:text-on-surface" href="#">
                <i className={`${mi("settings")} text-[20px]`} />
                <span className="font-body-sm">Settings</span>
            </a>
        </nav>
        <div className="mt-auto pt-4 border-t border-white/5">
            <button onClick={() => navigate("/dashboard")} className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-on-primary rounded-lg font-medium active:scale-95 transition-all duration-100">
<i className={`${mi("add")} text-[18px]`} />
<span>New Project</span>
</button>
            <div className="mt-6 flex items-center gap-3 px-2">
                <img className="w-8 h-8 rounded-full border border-white/10 object-cover" alt={currentUser.name}
                    src={currentUser.avatarUrl}
                />
                <div className="overflow-hidden">
                    <p className="text-body-sm font-medium truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">{currentUser.email}</p>
                </div>
            </div>
        </div>
    </aside>
    <header className="gsap-topbar h-16 fixed top-0 right-0 z-40 bg-surface/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-gutter ml-sidebar-width w-[calc(100%-260px)]">
        <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md group focus-within:ring-1 focus-within:ring-primary rounded-lg transition-all duration-200">
                <i className={`${mi("search")} absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]`} />
                <input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full bg-surface-container-lowest border-none rounded-lg pl-10 pr-4 py-2 text-body-sm focus:ring-0 placeholder:text-on-surface-variant/50" placeholder="Search members..." type="text" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-white/10 text-[10px] text-on-surface-variant font-code-sm">
                    ⌘K
                </div>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <NotificationBell />
            <button onClick={() => navigate(`/project/${projectId}/settings`)} className="w-8 h-8 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center overflow-hidden" title={currentUser.name}>
                <img className="w-full h-full object-cover" alt={currentUser.name}
                    src={currentUser.avatarUrl}
                />
            </button>
        </div>
    </header>
    <main className="gsap-panel ml-sidebar-width pt-16 min-h-screen bg-background">
        <div className="max-w-container-max mx-auto px-margin-desktop py-10">
            <div className="mb-10">
                <div className="flex items-end gap-3 mb-2">
                    <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Member Management</h2>
                    <span className="bg-surface-container-high px-3 py-1 rounded-full text-label-caps text-primary border border-primary/20 mb-2">Team ({activeMembers.length})</span>
                </div>
                <p className="text-on-surface-variant font-body-lg max-w-2xl">Manage your team's access, invite new collaborators, and control permission levels for this workspace.</p>
            </div>
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-4 space-y-8">
                    <section className="glass-panel-members rounded-xl p-6 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                        <div className="relative z-10">
                            <h3 className="text-body-lg font-semibold text-on-surface mb-6 flex items-center gap-2">
                                <i className={`${mi("person_add")} text-primary`} /> Invite New Member
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
                            <div className="flex items-center gap-3 my-6">
                                <div className="h-px flex-1 bg-outline-variant/20"></div>
                                <span className="text-[10px] text-outline uppercase tracking-widest">or</span>
                                <div className="h-px flex-1 bg-outline-variant/20"></div>
                            </div>
                            <button
                              type="button"
                              onClick={handleCopyInviteLink}
                              className="w-full py-3 bg-surface-container-highest border border-outline-variant/20 text-on-surface rounded-lg font-bold text-label-caps tracking-widest uppercase hover:border-primary/40 hover:text-primary active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                              <i className={`${mi(linkCopied ? "check" : "link")} text-[18px]`} />
                              {linkCopied ? "Link Copied" : "Copy Invite Link"}
                            </button>
                            <p className="text-[10px] text-on-surface-variant mt-2 text-center">
                              Anyone with this link can join as a Viewer. You can promote them afterwards.
                            </p>
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
          <button onClick={() => resendInvite(invite.$id, { projectName: project?.name || "a DevRoom OS project", inviterName: currentUser.name })} className="p-2 text-on-surface-variant hover:text-primary transition-colors" title="Resend">
<i className={`${mi("refresh")} text-[18px]`} />
</button>
          <button onClick={() => removeMember(invite.$id)} className="p-2 text-on-surface-variant hover:text-error transition-colors" title="Cancel">
<i className={`${mi("close")} text-[18px]`} />
</button>
      </div>
  </div>
))}
                        </div>
                    </section>
                </div>
                <div className="col-span-12 lg:col-span-8">
                    <div className="glass-panel-members rounded-xl overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <h3 className="font-semibold text-on-surface">Active Members</h3>
                            <button onClick={handleExportCsv} disabled={activeMembers.length === 0} className="text-label-caps text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
<i className={`${mi("download")} text-[16px]`} />
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
  <tr><td colSpan={3} className="px-6 py-8 text-center"><Loader label="loading_members..." /></td></tr>
)}
{!loading && error && (
  <tr><td colSpan={3} className="px-6 py-8 text-center text-error text-sm">{error}</td></tr>
)}
{!loading && !error && filteredMembers.length === 0 && (
  <tr><td colSpan={3} className="px-6 py-8 text-center text-on-surface-variant text-sm">
    {memberSearch ? `No members match "${memberSearch}".` : "No members yet. Invite someone above."}
  </td></tr>
)}
{!loading && !error && filteredMembers.map((member) => (
  <tr key={member.$id} data-member-row={member.$id} className="hover:bg-white/5 transition-colors group">
      <td className="px-6 py-4">
          <div className="flex items-center gap-3">
              <Avatar label={member.name || member.email} avatarUrl={profiles[member.userId]?.avatarUrl} />
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
            onChange={(e) => handleRoleChange(member.$id, e.target.value, e.target)}
            className="bg-transparent border-none focus:ring-0 text-body-sm text-on-surface hover:text-primary cursor-pointer p-0">
{ROLES.map((r) => (
  <option key={r} value={r}>{r}</option>
))}
</select>
      </td>
      <td className="px-6 py-4 text-right">
          <button onClick={() => handleRemove(member.$id)} className="opacity-0 group-hover:opacity-100 p-2 text-on-surface-variant hover:text-error transition-all">
<i className={`${mi("delete_outline")} text-[20px]`} />
</button>
      </td>
  </tr>
))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex justify-between items-center text-[12px] text-on-surface-variant">
                            <span>Showing {filteredMembers.length} of {activeMembers.length} members</span>
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