"use client";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { ALL_PERMISSIONS,PERMISSION_GROUPS,PRESET_ROLES,PermissionId } from "@/lib/permissions";
import { useEffect,useState } from "react";
interface StaffMember {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
    isStaff: boolean;
    lastLoginAt?: string;
    createdAt: string;
    invitedBy?: string;
}
interface Invite {
    id: string;
    email: string;
    name: string;
    permissions: string[];
    invitedBy: string;
    expiresAt: string;
    acceptedAt?: string;
    createdAt: string;
}
function PermissionBadge({ perm }: {
    perm: string;
}) {
    const p = ALL_PERMISSIONS.find(x => x.id === perm);
    const colors: Record<string, string> = {
        Content: "bg-blue-50 text-blue-700 border-blue-100",
        Finance: "bg-green-50 text-green-700 border-green-100",
        Users: "bg-purple-50 text-purple-700 border-purple-100",
        Admin: "bg-red-50 text-red-700 border-red-100",
    };
    const cls = colors[p?.group || ""] || "bg-gray-50 text-gray-700";
    return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md border ${cls}`}>{p?.label || perm}</span>;
}
export default function StaffPage() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    // Open invite modal if URL has #invite hash
    useEffect(() => {
        if (typeof window !== "undefined" && window.location.hash === "#invite") {
            setShowInvite(true);
            // Clean hash without reload
            history.replaceState(null, "", window.location.pathname);
        }
    }, []);
    const [editUser, setEditUser] = useState<StaffMember | null>(null);
    // Invite form
    const [invEmail, setInvEmail] = useState("");
    const [invName, setInvName] = useState("");
    const [invPreset, setInvPreset] = useState<keyof typeof PRESET_ROLES>("editor");
    const [invPerms, setInvPerms] = useState<PermissionId[]>([...PRESET_ROLES.editor.permissions]);
    const [invLoading, setInvLoading] = useState(false);
    const [invError, setInvError] = useState("");
    const [invSuccess, setInvSuccess] = useState("");
    async function load() {
        const [usersRes, invitesRes] = await Promise.all([
            adminFetch("/api/admin/users").then(r => r.json()),
            adminFetch("/api/admin/invites").then(r => r.json()),
        ]);
        setStaff((usersRes.users || []).filter((u: StaffMember) => u.isStaff || u.role === "ADMIN"));
        setInvites(invitesRes.invites || []);
        setLoading(false);
    }
    useEffect(() => { load(); }, []);
    function applyPreset(preset: keyof typeof PRESET_ROLES) {
        setInvPreset(preset);
        if (preset !== "custom")
            setInvPerms([...PRESET_ROLES[preset].permissions as PermissionId[]]);
    }
    function togglePerm(id: PermissionId) {
        setInvPreset("custom");
        setInvPerms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    }
    function toggleGroupAll(group: string) {
        const groupPerms = ALL_PERMISSIONS.filter(p => p.group === group).map(p => p.id);
        const allOn = groupPerms.every(p => invPerms.includes(p));
        if (allOn)
            setInvPerms(p => p.filter(x => !groupPerms.includes(x)));
        else
            setInvPerms(p => [...new Set([...p, ...groupPerms])]);
        setInvPreset("custom");
    }
    async function sendInvite(e: React.FormEvent) {
        e.preventDefault();
        if (!invEmail || !invName) {
            setInvError("Name and email are required");
            return;
        }
        if (!invPerms.length) {
            setInvError("Select at least one permission");
            return;
        }
        setInvLoading(true);
        setInvError("");
        setInvSuccess("");
        try {
            const res = await adminFetch("/api/admin/invites", {
                method: "POST",
                body: JSON.stringify({ email: invEmail, name: invName, permissions: invPerms }),
            });
            const d = await res.json();
            if (!res.ok) {
                setInvError(d.error || "Failed to send invite");
                setInvLoading(false);
                return;
            }
            setInvSuccess(`Invitation sent to ${invEmail}`);
            setInvEmail("");
            setInvName("");
            setInvLoading(false);
            load();
            setTimeout(() => { setShowInvite(false); setInvSuccess(""); }, 3000);
        }
        catch {
            setInvError("Network error — could not send invitation.");
            setInvLoading(false);
        }
    }
    async function revokeInvite(id: string) {
        if (!confirm("Revoke this invitation?"))
            return;
        await adminFetch(`/api/admin/invites/${id}`, { method: "DELETE" });
        load();
    }
    async function resendInvite(inviteId: string, email: string, name: string, permissions: string[]) {
        try {
            // Delete old invite first to avoid ALREADY_INVITED error
            const delRes = await adminFetch(`/api/admin/invites/${inviteId}`, { method: "DELETE" });
            if (!delRes.ok) {
                alert("Failed to revoke old invitation — please try again");
                return;
            }
            // Create new invite — if this fails, old invite is gone (no fallback needed, user can reinvite)
            const res = await adminFetch("/api/admin/invites", {
                method: "POST",
                body: JSON.stringify({ email, name, permissions }),
            });
            if (res.ok) {
                alert(`Invitation resent to ${email}`);
            }
            else {
                const d = await res.json().catch(() => ({}));
                // Old invite was deleted — inform admin they need to re-invite
                alert((d.error || "Failed to send new invitation") + ". The old invitation has been revoked. Please send a new invite from the invite form.");
            }
        }
        catch {
            alert("Network error — the old invitation may have been revoked. Please check and re-invite if needed.");
        }
        load();
    }
    async function updateUserPerms(userId: string, permissions: string[], role: string) {
        if (!confirm(`Update permissions for this staff member? They will need to re-login to see changes.`))
            return;
        // Keep isStaff=true — staff members always retain staff status even if role changes
        await adminFetch(`/api/admin/users/${userId}`, {
            method: "PATCH",
            body: JSON.stringify({ role, permissions }), // isStaff stays true from original invite
        });
        setEditUser(null);
        load();
    }
    const inp = "w-full rounded-xl border border-line bg-dashbg py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30";
    return (<div className="p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink mb-1">Staff & Permissions</h1>
          <p className="text-muted text-sm">Manage admin staff members, roles, and access permissions</p>
        </div>
        <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl px-5 py-2.5 text-sm transition">
          <Icon name="plus" size={16}/> Invite Staff Member
        </button>
      </div>

      {/* ── Invite Modal ── */}
      {showInvite && (<div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget)
            setShowInvite(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-line">
              <h2 className="font-display font-extrabold text-ink text-lg">Invite Staff Member</h2>
              <button onClick={() => setShowInvite(false)} aria-label="Close Invite Modal" className="text-muted hover:text-ink"><Icon name="x" size={20}/></button>
            </div>
            <form onSubmit={sendInvite} className="p-6 space-y-6">
              {/* Basic info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="block text-xs text-muted font-semibold uppercase tracking-wider mb-1.5">Full Name</label>
                  <input required value={invName} onChange={e => setInvName(e.target.value)} className={inp} placeholder="Jane Smith"/></div>
                <div><label className="block text-xs text-muted font-semibold uppercase tracking-wider mb-1.5">Email Address</label>
                  <input required type="email" value={invEmail} onChange={e => setInvEmail(e.target.value)} className={inp} placeholder="jane@example.com"/></div>
              </div>

              {/* Preset roles */}
              <div>
                <label className="block text-xs text-muted font-semibold uppercase tracking-wider mb-3">Role Preset</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.entries(PRESET_ROLES) as [
                keyof typeof PRESET_ROLES,
                typeof PRESET_ROLES[keyof typeof PRESET_ROLES]
            ][]).map(([key, r]) => (<button key={key} type="button" onClick={() => applyPreset(key)} className={`text-left p-3 rounded-xl border-2 transition ${invPreset === key ? "border-brand bg-brand/5" : "border-line hover:border-brand/30"}`}>
                      <div className={`font-bold text-sm ${invPreset === key ? "text-brand" : "text-ink"}`}>{r.label}</div>
                      <div className="text-xs text-muted mt-0.5">{r.description}</div>
                    </button>))}
                </div>
              </div>

              {/* Granular permissions */}
              <div>
                <label className="block text-xs text-muted font-semibold uppercase tracking-wider mb-3">
                  Custom Permissions <span className="text-brand ml-1">({invPerms.length} selected)</span>
                </label>
                <div className="space-y-4">
                  {PERMISSION_GROUPS.map(group => {
                const groupPerms = ALL_PERMISSIONS.filter(p => p.group === group);
                const allOn = groupPerms.every(p => invPerms.includes(p.id));
                const someOn = groupPerms.some(p => invPerms.includes(p.id));
                const groupColors: Record<string, string> = {
                    Content: "text-blue-600", Finance: "text-green-600",
                    Users: "text-purple-600", Admin: "text-red-600",
                };
                return (<div key={group} className="bg-dashbg rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`font-bold text-sm ${groupColors[group]}`}>{group}</span>
                          <button type="button" onClick={() => toggleGroupAll(group)} className="text-xs text-brand hover:underline font-semibold">
                            {allOn ? "Deselect all" : "Select all"}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {groupPerms.map(perm => (<label key={perm.id} className={`flex items-center gap-2 cursor-pointer rounded-lg p-2 border transition ${invPerms.includes(perm.id) ? "border-brand bg-brand/5" : "border-transparent hover:bg-white"}`}>
                              <input type="checkbox" checked={invPerms.includes(perm.id)} onChange={() => togglePerm(perm.id)} className="accent-brand shrink-0"/>
                              <span className="text-xs font-medium text-ink">{perm.label}</span>
                            </label>))}
                        </div>
                      </div>);
            })}
                </div>
              </div>

              {invError && <p className="text-danger text-sm flex items-center gap-2 bg-danger/10 border border-danger/20 rounded-xl p-3"><Icon name="x" size={14}/>{invError}</p>}
              {invSuccess && <p className="text-success text-sm flex items-center gap-2 bg-success/10 border border-success/20 rounded-xl p-3"><Icon name="check" size={14}/>{invSuccess}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowInvite(false)} className="flex-1 border border-line rounded-xl py-3 text-sm font-semibold text-muted hover:bg-dashbg transition">Cancel</button>
                <button type="submit" disabled={invLoading} className="flex-1 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl py-3 text-sm transition disabled:opacity-60 flex items-center justify-center gap-2">
                  <Icon name="send" size={14}/>
                  {invLoading ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* ── Edit Permissions Modal ── */}
      {editUser && (<EditPermissionsModal user={editUser} onClose={() => setEditUser(null)} onSave={(perms, role) => updateUserPerms(editUser.id, perms || [], role)}/>)}

      {/* ── Current Staff ── */}
      <div className="mb-8">
        <h2 className="font-display font-bold text-ink text-sm uppercase tracking-wider mb-4">Active Staff Members ({staff.length})</h2>
        {loading ? <p className="text-muted text-sm">Loading...</p> : (<div className="space-y-3">
            {staff.map(u => (<div key={u.id} className="bg-white rounded-xl2 border border-line p-5 flex flex-wrap items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-sm shrink-0">
                  {u.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-ink">{u.name}</span>
                    {u.role === "ADMIN" && !u.isStaff && <span className="text-xs bg-danger/10 text-danger font-bold px-2 py-0.5 rounded-md">Super Admin</span>}
                  </div>
                  <div className="text-xs text-muted mt-0.5">{u.email}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {u.isStaff && u.permissions?.length > 0
                    ? u.permissions.slice(0, 6).map(p => <PermissionBadge key={p} perm={p}/>)
                    : <span className="text-xs bg-brand/10 text-brand font-bold px-2 py-0.5 rounded-md">All Permissions</span>}
                    {u.isStaff && u.permissions?.length > 6 && (<span className="text-xs bg-line text-muted font-semibold px-2 py-0.5 rounded-md">+{u.permissions.length - 6} more</span>)}
                  </div>
                  {u.invitedBy && <div className="text-xs text-muted mt-1">Invited by {u.invitedBy} · Joined {new Date(u.createdAt).toLocaleDateString("en-GB")}</div>}
                </div>
                {u.isStaff && (<button onClick={() => setEditUser(u)} className="flex items-center gap-1.5 text-xs border border-line rounded-lg px-3 py-2 text-muted hover:border-brand hover:text-brand transition font-semibold shrink-0">
                    <Icon name="settings" size={13}/> Edit Permissions
                  </button>)}
              </div>))}
            {staff.length === 0 && <p className="text-muted text-sm py-6 text-center">No staff members yet. Invite your first team member above.</p>}
          </div>)}
      </div>

      {/* ── Pending Invites ── */}
      {invites.length > 0 && (<div>
          <h2 className="font-display font-bold text-ink text-sm uppercase tracking-wider mb-4">Pending Invitations ({invites.filter(i => !i.acceptedAt).length})</h2>
          <div className="space-y-2">
            {invites.filter(i => !i.acceptedAt).map(inv => (<div key={inv.id} className="bg-white rounded-xl border border-line border-dashed p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink">{inv.name}</div>
                  <div className="text-xs text-muted">{inv.email} · Invited by {inv.invitedBy} · Expires {new Date(inv.expiresAt).toLocaleDateString("en-GB")}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {inv.permissions.slice(0, 4).map(p => <PermissionBadge key={p} perm={p}/>)}
                    {inv.permissions.length > 4 && <span className="text-xs bg-line text-muted font-semibold px-2 py-0.5 rounded-md">+{inv.permissions.length - 4} more</span>}
                  </div>
                </div>
                <span className="text-xs bg-warning/10 text-warning font-bold px-2.5 py-1 rounded-full shrink-0">Pending</span>
                <span className="text-xs text-muted">Expires {new Date(inv.expiresAt).toLocaleDateString("en-GB")}</span>
                <button onClick={() => resendInvite(inv.id, inv.email, inv.name, inv.permissions)} className="text-xs border border-brand text-brand font-semibold rounded-lg px-2.5 py-1.5 hover:bg-brand hover:text-white transition shrink-0">
                  Resend
                </button>
                <button onClick={() => revokeInvite(inv.id)} aria-label="اسم الزر" className="text-danger hover:text-danger/70 transition shrink-0">
                  <Icon name="trash" size={15}/>
                </button>
              </div>))}
          </div>
        </div>)}
    </div>);
}
// ── Edit Permissions sub-component ──
function EditPermissionsModal({ user, onClose, onSave }: {
    user: StaffMember;
    onClose: () => void;
    onSave: (perms: string[], role: string) => void;
}) {
    const [perms, setPerms] = useState<string[]>(user.permissions || []);
    const [role, setRole] = useState(user.role);
    function toggleP(id: string) {
        setPerms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    }
    return (<div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-line">
          <div>
            <h2 className="font-display font-extrabold text-ink">Edit Permissions</h2>
            <p className="text-muted text-sm">{user.name} — {user.email}</p>
          </div>
          <button onClick={onClose} aria-label="اسم الزر" className="text-muted hover:text-ink"><Icon name="x" size={20}/></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs text-muted font-semibold uppercase tracking-wider mb-2">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="w-full rounded-xl border border-line bg-dashbg py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
              <option value="ADMIN">Admin (Staff)</option>
              <option value="DONOR">Revoke Staff Access</option>
            </select>
          </div>
          {role === "ADMIN" && (<div className="space-y-4">
              <label className="block text-xs text-muted font-semibold uppercase tracking-wider">Permissions ({perms.length} selected)</label>
              {PERMISSION_GROUPS.map(group => (<div key={group} className="bg-dashbg rounded-xl p-4">
                  <div className="font-bold text-sm text-ink mb-3">{group}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_PERMISSIONS.filter(p => p.group === group).map(perm => (<label key={perm.id} className={`flex items-center gap-2 cursor-pointer rounded-lg p-2 border transition ${perms.includes(perm.id) ? "border-brand bg-brand/5" : "border-transparent hover:bg-white"}`}>
                        <input type="checkbox" checked={perms.includes(perm.id)} onChange={() => toggleP(perm.id)} className="accent-brand shrink-0"/>
                        <span className="text-xs font-medium text-ink">{perm.label}</span>
                      </label>))}
                  </div>
                </div>))}
            </div>)}
        </div>
        <div className="p-6 border-t border-line flex gap-3">
          <button onClick={onClose} className="flex-1 border border-line rounded-xl py-2.5 text-sm font-semibold text-muted hover:bg-dashbg transition">Cancel</button>
          <button onClick={() => onSave(perms, role)} className="flex-1 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl py-2.5 text-sm transition">
            Save Changes
          </button>
        </div>
      </div>
    </div>);
}
