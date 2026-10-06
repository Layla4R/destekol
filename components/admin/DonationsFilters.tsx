"use client";
import Icon from "@/components/icons";
import { useRouter } from "next/navigation";
import { useRef,useState } from "react";
interface Campaign {
    id: string;
    title: string;
}
export default function DonationsFilters({ campaigns, statusFilter, campaignFilter, q, }: {
    campaigns: Campaign[];
    statusFilter: string;
    campaignFilter: string;
    q: string;
}) {
    const router = useRouter();
    const [search, setSearch] = useState(q);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();
    function buildUrl(params: Record<string, string>) {
        const p = new URLSearchParams();
        if (params.status)
            p.set("status", params.status);
        if (params.campaign)
            p.set("campaign", params.campaign);
        if (params.q)
            p.set("q", params.q);
        return "?" + p.toString();
    }
    function go(overrides: Partial<{
        status: string;
        campaign: string;
        q: string;
    }>) {
        const url = buildUrl({
            status: statusFilter,
            campaign: campaignFilter,
            q: search,
            ...overrides,
        });
        router.push(url);
    }
    return (<div className="flex flex-wrap gap-3 mb-4 items-center">
      {/* Search */}
      <div className="relative">
        <Icon name="search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"/>
        <input type="search" placeholder="Search by name or email…" value={search} onChange={e => {
            setSearch(e.target.value);
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => go({ q: e.target.value }), 500);
        }} onKeyDown={e => { if (e.key === "Enter") {
        clearTimeout(debounceRef.current);
        go({ q: search });
    } }} className="pl-8 pr-4 py-2 border border-line rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 w-52"/>
        <button onClick={() => go({ q: search })} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-brand text-white rounded-lg px-2 py-0.5 font-bold hover:bg-brand-dark transition">
          Go
        </button>
      </div>

      {/* Status buttons */}
      {["", "COMPLETED", "PENDING", "FAILED", "REFUNDED"].map(st => (<button key={st} onClick={() => go({ status: st })} className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${statusFilter === st ? "bg-brand text-white border-brand" : "border-line text-muted hover:border-brand hover:text-brand bg-white"}`}>
          {st === "" ? "All" : st.charAt(0) + st.slice(1).toLowerCase()}
        </button>))}

      {/* Campaign dropdown */}
      {campaigns.length > 0 && (<select value={campaignFilter} onChange={e => go({ campaign: e.target.value })} className="px-3 py-2 rounded-xl text-xs border border-line bg-white text-muted focus:outline-none focus:border-brand cursor-pointer">
          <option value="">All Campaigns</option>
          {campaigns.map(c => (<option key={c.id} value={c.id}>{c.title}</option>))}
        </select>)}

      {/* Clear filters */}
      {(statusFilter || campaignFilter || q) && (<button onClick={() => { setSearch(""); router.push("?"); }} className="flex items-center gap-1.5 text-xs text-muted hover:text-danger border border-line hover:border-danger rounded-xl px-3 py-2 transition">
          <Icon name="x" size={12}/> Clear
        </button>)}
    </div>);
}
