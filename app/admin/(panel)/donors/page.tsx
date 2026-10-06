"use client";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { formatCurrency } from "@/lib/format";
import { useEffect,useState } from "react";
interface Donor {
    id: string;
    name: string;
    email: string;
    totalDonated: number;
    donationCount: number;
    createdAt: string;
    emailVerified: boolean;
}
export const dynamic = "force-dynamic";
export default function DonorsPage() {
    const [donors, setDonors] = useState<Donor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 50;
    useEffect(() => {
        setLoading(true);
        setError("");
        adminFetch("/api/admin/users?role=DONOR")
            .then(r => { if (!r.ok)
            throw new Error("Failed"); return r.json(); })
            .then(d => { setDonors(d.users || []); setLoading(false); })
            .catch(() => { setError("Failed to load donors."); setLoading(false); });
    }, []);
    const totalDonated = donors.reduce((sum, d) => sum + Number(d.totalDonated || 0), 0);
    const allFiltered = donors.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.email?.toLowerCase().includes(search.toLowerCase())).sort((a, b) => Number(b.totalDonated || 0) - Number(a.totalDonated || 0));
    const totalPages = Math.ceil(allFiltered.length / PAGE_SIZE);
    const filtered = allFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return (<div className="p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink mb-1">Donor Accounts</h1>
          <p className="text-muted text-sm">{donors.length} donors shown · ${totalDonated.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} raised by shown donors</p>
        </div>
        <a href="/api/admin/users/export?role=DONOR" className="flex items-center gap-2 border border-line text-muted hover:border-brand hover:text-brand font-semibold rounded-xl px-4 py-2.5 text-sm transition">
          <Icon name="file-text" size={14}/> Export CSV
        </a>
        <input type="search" placeholder="Search by name or email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="rounded-xl border border-line bg-white py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 w-64"/>
      </div>

      {error && (<div className="bg-danger/8 border border-danger/20 rounded-xl p-4 mb-4 flex items-center gap-3">
          <Icon name="x" size={16} className="text-danger"/>
          <span className="text-danger text-sm">{error}</span>
        </div>)}
      {loading ? (<div className="text-center py-16 text-muted">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
          Loading donors…
        </div>) : (<div className="bg-white rounded-xl2 border border-line overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-dashbg border-b border-line text-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left py-3 px-4">#</th>
                <th className="text-left py-3 px-4">Donor</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Total Donated</th>
                <th className="text-left py-3 px-4">Donations</th>
                <th className="text-left py-3 px-4">Verified</th>
                <th className="text-left py-3 px-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((d, i) => (<tr key={d.id} className="hover:bg-dashbg/50 transition">
                  <td className="py-3 px-4 text-muted text-xs font-mono">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="py-3 px-4 font-semibold text-ink"><a href={`/admin/donors/${d.id}`} className="hover:text-brand transition">{d.name || "—"}</a></td>
                  <td className="py-3 px-4 text-muted">{d.email}</td>
                  <td className="py-3 px-4 font-bold text-brand">{formatCurrency(d.totalDonated || 0)}</td>
                  <td className="py-3 px-4 text-muted">{d.donationCount || 0}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 ${d.emailVerified ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                      <Icon name={d.emailVerified ? "check" : "minus"} size={10}/>
                      {d.emailVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted text-xs">{new Date(d.createdAt).toLocaleDateString("en-GB")}</td>
                </tr>))}
              {filtered.length === 0 && (<tr><td colSpan={7} className="py-12 text-center text-muted">No donors found.</td></tr>)}
            </tbody>
          </table>
        </div>)}
    </div>);
}
