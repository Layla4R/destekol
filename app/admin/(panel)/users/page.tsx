"use client";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { useEffect,useState } from "react";
interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    emailVerified: boolean;
    isStaff?: boolean;
    permissions?: string[];
    totalDonated: number;
    donationCount: number;
    createdAt: string;
    lastLoginAt?: string;
}
const ROLE_STYLE: Record<string, string> = {
    ADMIN: "bg-danger/10 text-danger",
    EDITOR: "bg-warning/10 text-warning",
    DONOR: "bg-success/10 text-success",
};
export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [truncated, setTruncated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 50;
    useEffect(() => {
        setLoading(true);
        setError("");
        adminFetch("/api/admin/users")
            .then(r => { if (!r.ok)
            throw new Error("Failed"); return r.json(); })
            .then(d => { setUsers(d.users || []); setTruncated(d.truncated || false); setLoading(false); })
            .catch(() => { setError("Failed to load users."); setLoading(false); });
    }, []);
    async function changeRole(id: string, role: string, currentRole: string) {
        if (role === currentRole)
            return;
        if (!confirm(`Change role from ${currentRole} to ${role}?`))
            return;
        await adminFetch(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) });
        setUsers(u => u.map(x => x.id === id ? { ...x, role } : x));
    }
    async function deleteUser(id: string, name: string) {
        if (!confirm(`Delete user "${name}"? This cannot be undone.`))
            return;
        try {
            const res = await adminFetch(`/api/admin/users/${id}`, { method: "DELETE" });
            if (res.ok)
                setUsers(u => u.filter(x => x.id !== id));
            else {
                const d = await res.json().catch(() => ({}));
                alert(d.error || "Failed to delete user");
            }
        }
        catch {
            alert("Network error");
        }
    }
    const allFiltered = users.filter(u => (u.name || "").toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
    const totalPages = Math.ceil(allFiltered.length / PAGE_SIZE);
    const filtered = allFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return (<div className="p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink mb-1">User Management</h1>
          <p className="text-muted text-sm">{users.length} registered users</p>
        </div>
        <div className="flex gap-2 items-center">
          <input type="search" placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="rounded-xl border border-line bg-white py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 w-64"/>
          <a href="/api/admin/users/export" className="flex items-center gap-2 border border-line text-muted hover:border-brand hover:text-brand font-bold rounded-xl px-4 py-2.5 text-sm transition">
            <Icon name="file-text" size={14}/> Export
          </a>
        </div>
      </div>

      {truncated && (<div className="bg-warning/8 border border-warning/20 rounded-xl p-3 mb-4 text-sm text-warning font-semibold">
          ⚠ Showing first 2,000 users — use search to find specific users or export CSV for full list.
        </div>)}
      {error && (<div className="bg-danger/8 border border-danger/20 rounded-xl p-4 mb-4 flex items-center gap-3">
          <Icon name="x" size={16} className="text-danger"/>
          <span className="text-danger text-sm">{error}</span>
        </div>)}
      <div className="bg-white rounded-xl2 border border-line overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-dashbg border-b border-line text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left py-3 px-4">User</th>
              <th className="text-left py-3 px-4">Role</th>
              <th className="text-left py-3 px-4">Donations</th>
              <th className="text-left py-3 px-4">Verified</th>
              <th className="text-left py-3 px-4">Last Login</th>
              <th className="text-left py-3 px-4">Joined</th>
              <th className="py-3 px-4"/>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (<tr><td colSpan={7} className="py-12 text-center text-muted">Loading...</td></tr>) : filtered.map(u => (<tr key={u.id} className="hover:bg-dashbg/50 transition">
                <td className="py-3 px-4">
                  <div className="font-medium text-ink">{u.name}</div>
                  <div className="text-xs text-muted">{u.email}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-xs font-bold rounded-full px-2.5 py-1 ${ROLE_STYLE[u.role] || ""}`}>{u.role}</span>
                    {u.isStaff && <span className="text-xs bg-brand/10 text-brand rounded-full px-2 py-0.5 font-semibold">Staff</span>}
                    {u.isStaff && u.permissions && u.permissions.length > 0 && (<span className="text-[10px] text-muted">{u.permissions.length} perms</span>)}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-semibold">${Number(u.totalDonated).toFixed(2)}</div>
                  <div className="text-xs text-muted">{u.donationCount} donations</div>
                </td>
                <td className="py-3 px-4">
                  {u.emailVerified ? <Icon name="check" size={16} className="text-success"/> : <Icon name="x" size={16} className="text-danger"/>}
                </td>
                <td className="py-3 px-4 text-xs text-muted">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("en-GB") : "—"}</td>
                <td className="py-3 px-4 text-xs text-muted">{new Date(u.createdAt).toLocaleDateString("en-GB")}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <select value={u.role} onChange={e => changeRole(u.id, e.target.value, u.role)} className="text-xs border border-line rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand/30 bg-white">
                      <option value="DONOR">Donor</option>
                      <option value="EDITOR">Editor</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    {u.role !== "ADMIN" && !u.isStaff && (<button onClick={() => deleteUser(u.id, u.name || u.email)} className="text-danger/50 hover:text-danger transition p-1 rounded" title="Delete user">
                        <Icon name="trash" size={13}/>
                      </button>)}
                  </div>
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (<div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted">{allFiltered.length} users</p>
          <div className="flex gap-2">
            {page > 1 && <button onClick={() => setPage(p => p - 1)} className="px-4 py-2 border border-line rounded-xl text-sm hover:border-brand hover:text-brand transition">← Prev</button>}
            <span className="px-4 py-2 text-sm text-muted">Page {page} of {totalPages}</span>
            {page < totalPages && <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 border border-line rounded-xl text-sm hover:border-brand hover:text-brand transition">Next →</button>}
          </div>
        </div>)}
    </div>);
}
