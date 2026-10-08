"use client";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import Link from "next/link";
import { useEffect,useState } from "react";
interface ReportData {
    period: number;
    currency:string;
    grossDonations: number;
    totalRefunds: number;
    netDonations: number;
    periodStart: string;
    periodEnd: string;
    generatedAt: string;
    source: string;
    methodology: string;
    totalRaised: number;
    totalPrev: number;
    changePercent: number | null;
    donationCount: number;
    monthlyCount: number;
    byGateway: Record<string, number>;
    topCampaigns: {
        id: string;
        title: string;
        slug: string;
        amount: number;
        count: number;
    }[];
    chart: {
        day: string;
        amount: number;
    }[];
}
export default function ReportsPage() {
    const [data, setData] = useState<ReportData | null>(null);
    const [currency,setCurrency]=useState('USD');
    const [period, setPeriod] = useState("30");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        setData(null);
        adminFetch(`/api/admin/reports?period=${period}&currency=${currency}`)
            .then(r => { if (!r.ok)
            throw new Error("Failed"); return r.json(); })
            .then(d => { if (active) { setData(d); setLoading(false); } })
            .catch(() => { if (active) { setError("Failed to load reports. Check your connection."); setLoading(false); } });
        return () => { active = false; };
    }, [period,currency]);
    const maxChart = data ? Math.max(...data.chart.map(c => c.amount), 1) : 1;
    const sortedGateways = data ? Object.entries(data.byGateway).sort((a, b) => b[1] - a[1]) : [];
    const topGateway = sortedGateways.length > 0 ? sortedGateways[0] : null;
    function exportCSV() {
        if (!data)
            return;
        function q(v: unknown) {
            const sv = String(v ?? "");
            const safe = /^[=+@\-]/.test(sv) ? "'" + sv : sv;
            return /[,"\r\n]/.test(safe) ? '"' + safe.replace(/"/g, '""') + '"' : safe;
        }
        const lines: string[] = [
            "Destekol Donation Report",
            `Period Start,${data.periodStart}`,
            `Period End,${data.periodEnd}`,
            `Generated,${data.generatedAt}`,
            `Currency,${data.currency}`,
            `Source,${q(data.source)}`,
            `Methodology,${q(data.methodology)}`,
            "",
            "=== Summary ===",
            `Gross Donations,${data.currency} ${data.grossDonations.toFixed(2)}`,
            `Confirmed Refunds,${data.currency} ${data.totalRefunds.toFixed(2)}`,
            `Net Donations,${data.currency} ${data.netDonations.toFixed(2)}`,
            `Donation Count,${data.donationCount}`,
            `Monthly Donation Records,${data.monthlyCount}`,
            ...(data.changePercent != null ? [`vs Previous Period,${data.changePercent >= 0 ? "+" : ""}${data.changePercent}%`] : []),
            "",
            "=== By Gateway ===",
            "Gateway,Amount",
            ...Object.entries(data.byGateway).map(([k, v]) => `${q(k)},${currency} ${Number(v).toFixed(2)}`),
            "",
            "=== Top Campaigns ===",
            "Campaign,Amount,Donations",
            ...data.topCampaigns.map(c => `${q(c.title)},${currency} ${c.amount.toFixed(2)},${c.count}`),
            "",
            "=== Daily Breakdown ===",
            "Date,Amount",
            ...data.chart.map(c => `${c.day},${c.amount.toFixed(2)}`),
        ];
        const csv = "\uFEFF" + lines.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Destekol-report-${period}d-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
    return (<div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink mb-1">Analytics & Reports</h1>
          <p className="text-muted text-sm">Donation performance and trends</p>
        </div>
        <div className="flex gap-2 flex-wrap"><select aria-label="Report currency" value={currency} onChange={e=>setCurrency(e.target.value)} className="rounded-xl border border-line px-3">{['USD','TRY','EUR','GBP','RUB'].map(c=><option key={c}>{c}</option>)}</select>
          {[["7", "7 Days"], ["30", "30 Days"], ["90", "90 Days"], ["365", "1 Year"]].map(([v, l]) => (<button key={v} onClick={() => setPeriod(v)} className={`px-4 py-2 rounded-xl text-sm font-bold transition border ${period === v ? "bg-brand text-white border-brand" : "border-line text-muted hover:border-brand hover:text-brand bg-white"}`}>
              {l}
            </button>))}
          <button onClick={exportCSV} disabled={!data} className="flex items-center gap-2 border border-brand text-brand font-bold rounded-xl px-4 py-2 text-sm hover:bg-brand hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed">
            <Icon name="file-text" size={14}/> Export CSV
          </button>
        </div>
      </div>

      {error && (<div className="bg-danger/8 border border-danger/20 rounded-xl p-4 flex items-center gap-3">
          <Icon name="x" size={16} className="text-danger shrink-0"/>
          <span className="text-danger text-sm">{error}</span>
        </div>)}
      {loading ? (<div className="bg-white rounded-2xl border border-line p-16 text-center">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
          <p className="text-muted text-sm">Loading reports…</p>
        </div>) : data && (<>
          {/* KPI Cards */}
          <div className="rounded-xl border border-line bg-white p-4 text-xs text-muted leading-relaxed">
            <p><strong>Actual recorded results · {data.currency}</strong> · {data.periodStart.slice(0,10)} — {data.periodEnd.slice(0,10)} (UTC)</p>
            <p>Source: {data.source}. Updated: {new Date(data.generatedAt).toLocaleString('en-GB')}.</p>
            <p>{data.methodology}</p>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[
                { label: "Gross Donations", value: `${data.currency} ${data.grossDonations.toFixed(2)}`, icon: "wallet" as const, sub: 'Before refunds' },
                { label: "Confirmed Refunds", value: `${data.currency} ${data.totalRefunds.toFixed(2)}`, icon: "wallet" as const, sub: 'Partial and full; for donations in this period' },
                { label: "Net Donations", value: `${currency} ${data.totalRaised.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: "wallet" as const,
                    sub: data.changePercent !== null ? `${data.changePercent >= 0 ? "+" : ""}${data.changePercent}% vs prev period` : "" },
                { label: "Donations", value: data.donationCount.toLocaleString(), icon: "heart" as const, sub: `${data.monthlyCount} recurring` },
                { label: "Average Gross Donation", value: data.donationCount > 0 ? `${currency} ${(data.grossDonations / data.donationCount).toFixed(2)}` : currency+" 0", icon: "bar-chart" as const, sub: `over ${data.period} days` },
                { label: "Top Gateway", value: topGateway?.[0] || "—", icon: "shield-check" as const,
                    sub: topGateway ? `${currency} ${Number(topGateway?.[1]).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "" },
            ].map(card => (<div key={card.label} className="bg-white rounded-xl2 border border-line p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display text-2xl font-extrabold text-brand mb-1">{card.value}</div>
                    <div className="text-xs text-muted">{card.label}</div>
                    {card.sub && <div className="text-xs text-muted/70 mt-0.5">{card.sub}</div>}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-brand/8 text-brand flex items-center justify-center shrink-0">
                    <Icon name={card.icon} size={18}/>
                  </div>
                </div>
              </div>))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Daily chart */}
            <div className="lg:col-span-2 bg-white rounded-xl2 border border-line p-6">
              <h2 className="font-display font-bold text-ink mb-5">Net Donations by Donation Date (UTC)</h2>
              <div className="flex items-end gap-1 h-48">
                {data.chart.map((c) => {
                const pct = Math.max(4, Math.round((c.amount / maxChart) * 100));
                const label = new Date(c.day + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                return (<div key={c.day} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {c.amount > 0 && (<div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                          {currency} {c.amount}
                        </div>)}
                      <div className="w-full rounded-t-md bg-brand/10 relative overflow-hidden" style={{ height: "120px" }}>
                        <div className="absolute bottom-0 left-0 right-0 bg-brand rounded-t-md" style={{ height: `${pct}%` }}/>
                      </div>
                      {data.period <= 90 && <span className="text-[10px] text-muted">{label}</span>}
                      {data.period > 90 && data.chart.indexOf(c) % Math.ceil(data.chart.length / 12) === 0 && (<span className="text-[9px] text-muted">{label}</span>)}
                    </div>);
            })}
              </div>
            </div>

            {/* Gateway + Campaigns */}
            <div className="space-y-4">
              {/* By Gateway */}
              <div className="bg-white rounded-xl2 border border-line p-5">
                <h2 className="font-display font-bold text-ink mb-4 text-sm">By Gateway</h2>
                {sortedGateways.map(([gw, amt]) => {
                const pct = Math.round((amt / (data.totalRaised || 1)) * 100);
                return (<div key={gw} className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-ink">{gw}</span>
                        <span className="text-muted">{pct}% · {currency} {amt.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-line rounded-full h-2">
                        <div className="bg-brand h-2 rounded-full" style={{ width: `${pct}%` }}/>
                      </div>
                    </div>);
            })}
                {Object.keys(data.byGateway).length === 0 && <p className="text-muted text-sm">No data</p>}
              </div>

              {/* Top Campaigns */}
              <div className="bg-white rounded-xl2 border border-line p-5">
                <h2 className="font-display font-bold text-ink mb-4 text-sm">Top Campaigns</h2>
                {data.topCampaigns.map((c) => (<Link key={c.slug} href={`/admin/campaigns/${c.id}`} className="flex items-center justify-between mb-3 group">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="text-xs font-medium text-ink truncate group-hover:text-brand transition">{c.title}</div>
                      <div className="text-xs text-muted">{c.count} donations</div>
                    </div>
                    <span className="text-sm font-bold text-brand shrink-0">{currency} {c.amount.toLocaleString()}</span>
                  </Link>))}
                {data.topCampaigns.length === 0 && <p className="text-muted text-sm">No campaign donations yet</p>}
              </div>
            </div>
          </div>

          {/* Export */}
          <div className="flex gap-3">
            <a href="/api/admin/donations/export" className="flex items-center gap-2 border border-brand text-brand font-bold rounded-xl px-5 py-2.5 text-sm hover:bg-brand hover:text-white transition">
              <Icon name="file-text" size={15}/> Export Donations CSV
            </a>
            <a href={`/api/admin/subscribers/export`} className="flex items-center gap-2 border border-line text-muted font-bold rounded-xl px-5 py-2.5 text-sm hover:border-brand hover:text-brand transition">
              <Icon name="mail" size={15}/> Export Subscribers CSV
            </a>
          </div>
        </>)}
    </div>);
}
