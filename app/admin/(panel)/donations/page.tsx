import DonationRefundAction from '@/components/admin/DonationRefundAction';
import DonationsFilters from "@/components/admin/DonationsFilters";
import Icon from "@/components/icons";
import { requirePermission } from "@/lib/admin-access";
import { hasPermission } from "@/lib/permissions";
import { formatCurrency } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";
import { redirect } from "next/navigation";
export const revalidate = 0;
function refundRemaining(d:any){return Number(d.amount)-(d.isTest?(d.refunds||[]).filter((r:any)=>r.status==='SUCCEEDED').reduce((sum:number,r:any)=>sum+Number(r.amount),0):Number(d.refundedAmount));}
const STATUS_LABEL: Record<string, string> = {
    PENDING: "Pending", COMPLETED: "Completed", FAILED: "Failed", REFUNDED: "Refunded",
};
const STATUS_STYLE: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    COMPLETED: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-600",
    REFUNDED: "bg-orange-100 text-orange-600",
};
export default async function AdminDonationsPage({ searchParams, }: {
    searchParams: {
        page?: string;
        status?: string;
        campaign?: string;
        q?: string;
    };
}) {
    let session;
    try {
        session = await requirePermission("donations.view");
    }
    catch {
        redirect("/admin/forbidden");
    }
    const page = Math.max(1, parseInt(searchParams?.page || "1"));
    const PAGE_SIZE = 50;
    const from = (page - 1) * PAGE_SIZE;
    const supabase = getSupabase();
    const statusFilter = searchParams?.status || "";
    const campaignFilter = searchParams?.campaign || "";
    const q = searchParams?.q?.trim() || "";
    const { data: campaigns } = await supabase
        .from("Campaign").select("id, title").order("title");
    let query = supabase
        .from("Donation")
        .select("*, order:PayTROrder(callbackStatus), refunds:DonationRefund(status,amount,providerRefundId,reason), campaign:Campaign(title), userId", { count: "exact" })
        .order("createdAt", { ascending: false });
    if (statusFilter)
        query = query.eq("status", statusFilter);
    if (campaignFilter)
        query = query.eq("campaignId", campaignFilter);
    if (q)
        query = query.or(`donorName.ilike.%${q}%,donorEmail.ilike.%${q}%`);
    const { data: donations, count } = await query.range(from, from + PAGE_SIZE - 1);
    const rows = donations || [];
    const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
    // Build base params string for pagination links
    const baseParams = [
        statusFilter && `status=${statusFilter}`,
        campaignFilter && `campaign=${campaignFilter}`,
        q && `q=${encodeURIComponent(q)}`,
    ].filter(Boolean).join("&");
    function pageLink(p: number) {
        return `?page=${p}${baseParams ? `&${baseParams}` : ""}`;
    }
    return (<div className="p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink mb-1">Donations</h1>
          <p className="text-muted text-sm">
            {count ?? 0} total · Page {page} of {Math.max(1, totalPages)}
            {statusFilter && <span className="ml-2 font-semibold text-brand">· {STATUS_LABEL[statusFilter]}</span>}
          </p>
        </div>
        <a href={`/api/admin/donations/export${baseParams ? `?${baseParams}` : ""}`} className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl px-5 py-2.5 text-sm transition">
          <Icon name="file-text" size={16}/> Export CSV
        </a>
      </div>

      {/* Filters — client component for onChange */}
      <DonationsFilters campaigns={campaigns || []} statusFilter={statusFilter} campaignFilter={campaignFilter} q={q}/>

      {/* Table */}
      <div className="bg-white border border-line rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-dashbg border-b border-line text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left py-3 px-4">Donor</th>
              <th className="text-left py-3 px-4">Amount</th>
              <th className="text-left py-3 px-4">Campaign</th>
              <th className="text-left py-3 px-4">Gateway</th>
              <th className="text-left py-3 px-4">Frequency</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Date</th>
              <th className="text-left py-3 px-4">Receipt #</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((d: any) => (<tr key={d.id} className="hover:bg-dashbg/50 transition">
                <td className="py-3 px-4">
                  {d.userId && !d.isAnonymous ? (<Link href={`/admin/donors/${d.userId}`} className="block hover:text-brand transition">
                      <div className="font-medium text-ink">{d.donorName || "—"}</div>
                      {d.donorEmail && <div className="text-xs text-muted">{d.donorEmail}</div>}
                    </Link>) : (<>
                      <div className="font-medium text-ink">{d.isAnonymous ? "Anonymous" : (d.donorName || "—")}</div>
                      {!d.isAnonymous && d.donorEmail && <div className="text-xs text-muted">{d.donorEmail}</div>}
                    </>)}
                </td>
                <td className="py-3 px-4 font-bold text-brand">
                  {formatCurrency(Number(d.amount), (d.currency || "usd").toUpperCase())}
                </td>
                <td className="py-3 px-4 text-muted">{d.campaign?.title || "—"}</td>
                <td className="py-3 px-4 text-muted">{d.provider || "—"}</td>
                <td className="py-3 px-4 text-muted">
                  {d.frequency === "MONTHLY" ? "Monthly" : "One-time"}
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${STATUS_STYLE[d.status] || "bg-muted/10 text-muted"}`}>
                    {STATUS_LABEL[d.status] || d.status}
                  </span>
                  {d.refunds?.length>0&&<details className="mt-2 text-xs max-w-xs"><summary>Refund history</summary>{d.refunds.map((r:any)=><p key={r.providerRefundId} className="mt-2 break-words">{r.status}: {formatCurrency(Number(r.amount),(d.currency||'USD').toUpperCase())} · {r.providerRefundId} · {r.reason}</p>)}</details>}
                  {d.refunds?.filter((r:any)=>r.status==='PENDING').map((r:any)=><p key={r.providerRefundId} className="text-xs text-amber-700">Refund pending reconciliation: {r.providerRefundId}</p>)}
                  {d.isTest&&<div className="text-xs text-amber-700">Test transaction — excluded from funds</div>}
                  {d.provider==='PAYTR'&&(d.status==='COMPLETED'||d.isTest&&d.order?.callbackStatus==='success')&&refundRemaining(d)>0&&hasPermission(session,'donations.refund')&&<DonationRefundAction id={d.id} remaining={refundRemaining(d)} currency={d.currency?.toUpperCase()||'USD'}/>}
                  {d.subscriptionStatus && <div className="mt-2 text-xs text-muted">Subscription: {d.subscriptionStatus}</div>}
                  {Number(d.refundedAmount) > 0 && <div className="mt-2 text-xs text-orange-700">{d.refundStatus === 'PARTIAL' ? 'Partial refund' : 'Full refund'}: {formatCurrency(Number(d.refundedAmount), (d.currency || 'usd').toUpperCase())}</div>}
                </td>
                <td className="py-3 px-4 text-muted text-xs">
                  {new Date(d.createdAt).toLocaleDateString("en-GB")}
                </td>
                <td className="py-3 px-4 text-muted text-xs font-mono">
                  {d.receiptNumber || "—"}
                </td>
              </tr>))}
            {rows.length === 0 && (<tr>
                <td colSpan={8} className="py-12 text-center text-muted">
                  {q || statusFilter || campaignFilter
                ? "No donations match your filters."
                : "No donations yet."}
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (<div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted">{count ?? 0} total donations</p>
          <div className="flex gap-2">
            {page > 1 && (<a href={pageLink(page - 1)} className="px-4 py-2 border border-line rounded-xl text-sm hover:border-brand hover:text-brand transition">
                ← Prev
              </a>)}
            <span className="px-4 py-2 text-sm text-muted">Page {page} of {totalPages}</span>
            {page < totalPages && (<a href={pageLink(page + 1)} className="px-4 py-2 border border-line rounded-xl text-sm hover:border-brand hover:text-brand transition">
                Next →
              </a>)}
          </div>
        </div>)}
    </div>);
}
