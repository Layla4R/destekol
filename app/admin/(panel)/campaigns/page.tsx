"use client";
import { useToast } from "@/components/admin/Toast";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { formatCurrency,formatNumber } from "@/lib/format";
import Link from "next/link";
import { useEffect,useRef,useState } from "react";
interface Campaign {
    id: string;
    title: string;
    slug: string;
    goalAmount: string;
    raisedAmount: string;
    donorCount: number;
    isActive: boolean;
    isFeatured: boolean;
    isZakatable?: boolean;
    country?: string;
    defaultAmount?: number;
}
export const dynamic = "force-dynamic";
export default function AdminCampaignsList() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();
    const [camPage, setCamPage] = useState(1);
    const CAM_PAGE_SIZE = 50;
    // Clear selection when page changes to avoid cross-page selection confusion
    function goPage(p: number) { setCamPage(p); setSelected(new Set()); }
    const { toast } = useToast();
    async function load() {
        setLoading(true);
        setError("");
        try {
            const res = await adminFetch("/api/admin/campaigns");
            if (!res.ok) {
                setError("Failed to load campaigns");
                setLoading(false);
                return;
            }
            const data = await res.json();
            setCampaigns(data.campaigns || []);
        }
        catch {
            setError("Network error");
        }
        setLoading(false);
    }
    useEffect(() => { load(); }, []);
    async function toggle(id: string, key: "isActive" | "isFeatured", value: boolean) {
        setCampaigns(p => p.map(c => c.id === id ? { ...c, [key]: value } : c));
        try {
            const res = await adminFetch(`/api/admin/campaigns/${id}`, {
                method: "PATCH", body: JSON.stringify({ [key]: value }),
            });
            if (!res.ok)
                throw new Error();
        }
        catch {
            setCampaigns(p => p.map(c => c.id === id ? { ...c, [key]: !value } : c));
        }
    }
    async function remove(id: string, title: string) {
        if (!confirm(`Delete "${title}"? This cannot be undone.`))
            return;
        try {
            const res = await adminFetch(`/api/admin/campaigns/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                toast(d.error || "Failed to delete", "error");
                return;
            }
            setCampaigns(p => p.filter(c => c.id !== id));
            toast("Campaign deleted successfully.");
        }
        catch {
            toast("Network error — could not delete.", "error");
        }
    }
    function toggleSelect(id: string) {
        setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }
    async function bulkSetActive(active: boolean) {
        if (!selected.size)
            return;
        setBulkLoading(true);
        const ids = [...selected];
        setCampaigns(p => p.map(c => ids.includes(c.id) ? { ...c, isActive: active } : c));
        await Promise.allSettled(ids.map(id => adminFetch(`/api/admin/campaigns/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: active }) })));
        setSelected(new Set());
        setBulkLoading(false);
    }
    async function bulkDelete() {
        if (!selected.size)
            return;
        if (!confirm(`Delete ${selected.size} campaign(s)? This cannot be undone.`))
            return;
        if (!confirm(`Delete ${selected.size} campaign(s)? This cannot be undone.`))
            return;
        setBulkLoading(true);
        const ids = [...selected];
        const results = await Promise.allSettled(ids.map(id => adminFetch(`/api/admin/campaigns/${id}`, { method: "DELETE" }).then(async (r) => {
            if (!r.ok) {
                const d = await r.json().catch(() => ({}));
                throw new Error(d.error || "Failed");
            }
            return id;
        })));
        const deleted = results.filter(r => r.status === "fulfilled").map(r => (r as any).value);
        const failed = results.filter(r => r.status === "rejected");
        setCampaigns(p => p.filter(c => !deleted.includes(c.id)));
        if (failed.length > 0) {
            const reasons = [...new Set(failed.map(r => (r as any).reason?.message || "Failed"))];
            toast(`${failed.length} campaign(s) not deleted: ${reasons.join("; ")}`, "error");
        }
        setSelected(new Set());
        setBulkLoading(false);
    }
    const allFiltered = campaigns.filter(c => !debouncedSearch || c.title.toLowerCase().includes(debouncedSearch.toLowerCase()) || c.slug.includes(debouncedSearch.toLowerCase()));
    const totalCamPages = Math.ceil(allFiltered.length / CAM_PAGE_SIZE);
    const filtered = allFiltered.slice((camPage - 1) * CAM_PAGE_SIZE, camPage * CAM_PAGE_SIZE);
    return (<div className="p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink mb-1">Campaigns</h1>
          <p className="text-muted text-sm">{campaigns.length} campaigns · Manage donation campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"/>
            <input type="search" placeholder="Search by title or slug…" value={search} onChange={e => {
            setSearch(e.target.value);
            setCamPage(1);
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => setDebouncedSearch(e.target.value), 300);
        }} className="pl-8 pr-4 py-2.5 border border-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 w-48 bg-white"/>
          </div>
          <a href="/api/admin/campaigns/export" className="flex items-center gap-2 border border-line text-muted hover:border-brand hover:text-brand font-bold rounded-xl px-4 py-2.5 text-sm transition">
            <Icon name="file-text" size={14}/> Export CSV
          </a>
          <Link href="/admin/campaigns/new" className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl px-5 py-2.5 text-sm transition">
            <Icon name="plus" size={16}/> New Campaign
          </Link>
        </div>
      </div>

      {selected.size > 0 && (<div className="flex items-center gap-3 mb-4 px-4 py-3 bg-brand/5 border border-brand/20 rounded-xl">
          <span className="text-sm font-semibold text-brand">{selected.size} selected</span>
          <div className="flex gap-2 ms-auto">
            <button onClick={() => bulkSetActive(true)} disabled={bulkLoading} className="text-xs font-bold bg-success/10 text-success border border-success/20 rounded-lg px-3 py-1.5 transition">Activate All</button>
            <button onClick={() => bulkSetActive(false)} disabled={bulkLoading} className="text-xs font-bold bg-warning/10 text-warning border border-warning/20 rounded-lg px-3 py-1.5 transition">Deactivate All</button>
            <button onClick={bulkDelete} disabled={bulkLoading} className="text-xs font-bold bg-danger/10 text-danger border border-danger/20 rounded-lg px-3 py-1.5 transition">Delete Selected</button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-muted hover:text-ink transition">Cancel</button>
          </div>
        </div>)}
      {error && (<div className="bg-danger/8 border border-danger/20 rounded-xl p-4 mb-4 flex items-center gap-3">
          <Icon name="x" size={16} className="text-danger"/>
          <span className="text-danger text-sm">{error}</span>
          <button onClick={load} className="ml-auto text-xs font-bold text-danger underline">Retry</button>
        </div>)}

      {loading ? (<div className="bg-white rounded-2xl border border-line p-16 text-center">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
          <p className="text-muted text-sm">Loading campaigns…</p>
        </div>) : (<div className="bg-white rounded-2xl border border-line overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-dashbg border-b border-line text-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 w-8">
                  <input type="checkbox" className="rounded" ref={el => { if (el) {
            const some = filtered.some(c => selected.has(c.id));
            const all = filtered.length > 0 && filtered.every(c => selected.has(c.id));
            el.indeterminate = some && !all;
            el.checked = all;
        } }} onChange={e => setSelected(e.target.checked ? new Set(filtered.map(c => c.id)) : new Set())}/>
                </th>
                <th className="text-left py-3 px-4">Campaign</th>
                <th className="text-left py-3 px-4">Progress</th>
                <th className="text-left py-3 px-4">Country</th>
                <th className="text-left py-3 px-4">Featured</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map(c => {
                const pct = Math.min(100, Math.round((Number(c.raisedAmount) / (Number(c.goalAmount) || 1)) * 100));
                return (<tr key={c.id} className="hover:bg-dashbg/50 transition">
                    <td className="py-3 px-3"><input type="checkbox" className="rounded" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)}/></td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-ink truncate">{c.title}</div>
                      <div className="text-xs text-muted font-mono">{c.slug}</div>
                      {c.isZakatable && (<span className="inline-flex items-center gap-1 text-[10px] bg-success/10 text-success rounded-full px-2 py-0.5 font-semibold mt-0.5">
                          <Icon name="check" size={9}/> Zakatable
                        </span>)}
                    </td>
                    <td className="py-3 px-4 min-w-[160px]">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-brand">{formatCurrency(Number(c.raisedAmount))}</span>
                        <span className="text-muted">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-line rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full" style={{ width: `${pct}%` }}/>
                      </div>
                      <div className="text-[10px] text-muted mt-0.5">{formatNumber(c.donorCount)} donors · Goal: {formatCurrency(Number(c.goalAmount))}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-muted">{c.country || "—"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => toggle(c.id, "isFeatured", !c.isFeatured)} className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${c.isFeatured ? "bg-brand" : "bg-line"}`}>
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${c.isFeatured ? "left-4" : "left-0.5"}`}/>
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => toggle(c.id, "isActive", !c.isActive)} className={`text-xs font-bold rounded-full px-2.5 py-1 transition ${c.isActive ? "bg-success/10 text-success hover:bg-success/20" : "bg-muted/10 text-muted hover:bg-muted/20"}`}>
                        {c.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/admin/campaigns/${c.id}`} className="flex items-center gap-1.5 text-xs font-bold bg-brand text-white rounded-lg px-3 py-1.5 hover:bg-brand-dark transition">
                          <Icon name="layers" size={12}/> Edit
                        </Link>
                        <a href={`/campaigns/${c.slug}`} target="_blank" className="flex items-center gap-1 text-xs border border-line text-muted rounded-lg px-2.5 py-1.5 hover:border-brand hover:text-brand transition">
                          <Icon name="globe" size={12}/>
                        </a>
                        <button onClick={() => remove(c.id, c.title)} className="flex items-center gap-1 text-xs border border-line text-muted rounded-lg px-2.5 py-1.5 hover:border-danger hover:text-danger transition">
                          <Icon name="trash" size={12}/>
                        </button>
                      </div>
                    </td>
                  </tr>);
            })}
              {filtered.length === 0 && !loading && (<tr><td colSpan={7} className="py-12 text-center text-muted">
                  {debouncedSearch ? `No campaigns match "${debouncedSearch}"` : "No campaigns yet."}
                </td></tr>)}
            </tbody>
          </table>
        </div>)}
      {totalCamPages > 1 && (<div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted">Showing {allFiltered.length === 0 ? 0 : (camPage - 1) * CAM_PAGE_SIZE + 1}–{Math.min(camPage * CAM_PAGE_SIZE, allFiltered.length)} of {allFiltered.length} campaigns</p>
          <div className="flex gap-2">
            <button onClick={() => goPage(camPage - 1)} disabled={camPage === 1} className="px-4 py-2 border border-line rounded-xl text-sm hover:border-brand hover:text-brand disabled:opacity-30 transition">← Prev</button>
            <span className="px-4 py-2 text-sm text-muted">Page {camPage} of {totalCamPages}</span>
            <button onClick={() => goPage(camPage + 1)} disabled={camPage === totalCamPages} className="px-4 py-2 border border-line rounded-xl text-sm hover:border-brand hover:text-brand disabled:opacity-30 transition">Next →</button>
          </div>
        </div>)}
    </div>);
}
