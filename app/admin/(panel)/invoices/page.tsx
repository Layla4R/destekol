import ResendButton from "@/components/admin/ResendButton";
import Icon from "@/components/icons";
import { requirePermission } from "@/lib/admin-access";
import { hasPermission } from "@/lib/permissions";
import { formatCurrency } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
export const revalidate = 0;
export default async function InvoicesPage({ searchParams }: {
    searchParams: {
        page?: string;
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
    const q = searchParams?.q?.trim();
    let query = supabase
        .from("Donation")
        .select("*, campaign:Campaign(title)", { count: "exact" })
        .eq("status", "COMPLETED")
        .order("createdAt", { ascending: false });
    if (q)
        query = query.or(`donorName.ilike.%${q}%,donorEmail.ilike.%${q}%,receiptNumber.ilike.%${q}%`);
    const { data: donations, count } = await query.range(from, from + PAGE_SIZE - 1);
    const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
    const rows = donations || [];
    return (<div className="p-6 sm:p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-extrabold text-ink mb-1">Invoices & Receipts</h1>
        <p className="text-muted text-sm">Generate and share donation receipts directly with donors</p>
      </div>

      {/* Search */}
      <form method="get" className="mb-4">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input name="q" defaultValue={q} placeholder="Search by name, email or receipt #…" className="pl-9 pr-4 py-2.5 border border-line rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand/30 bg-white"/>
        </div>
      </form>

      <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Icon name="help-circle" size={18} className="text-brand shrink-0 mt-0.5"/>
        <div className="text-sm text-brand">
          <strong>How to share a receipt:</strong> Click the receipt link to open it, then share the URL with the donor or use the Print button to save as PDF.
        </div>
      </div>

      <div className="bg-white rounded-xl2 border border-line overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-dashbg border-b border-line text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left py-3 px-4">Donor</th>
              <th className="text-left py-3 px-4">Amount</th>
              <th className="text-left py-3 px-4">Campaign</th>
              <th className="text-left py-3 px-4">Receipt #</th>
              <th className="text-left py-3 px-4">Date</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((d: any) => (<tr key={d.id} className="hover:bg-dashbg/50 transition">
                <td className="py-3 px-4">
                  <div className="font-medium text-ink">{d.isAnonymous ? "Anonymous" : d.donorName}</div>
                  <div className="text-xs text-muted">{d.donorEmail}</div>
                </td>
                <td className="py-3 px-4 font-bold text-brand">{formatCurrency(Number(d.amount))}</td>
                <td className="py-3 px-4 text-muted text-xs">{d.campaign?.title || "General"}</td>
                <td className="py-3 px-4 font-mono text-xs text-muted">{d.receiptNumber || d.id.slice(0, 8).toUpperCase()}</td>
                <td className="py-3 px-4 text-muted text-xs">{new Date(d.createdAt).toLocaleDateString("en-GB")}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 justify-center">
                    <a href={`/api/admin/invoices/${d.id}?format=html`} target="_blank" className="flex items-center gap-1.5 text-xs bg-brand text-white font-bold rounded-lg px-3 py-1.5 hover:bg-brand-dark transition">
                      <Icon name="eye" size={12}/> View
                    </a>
                    <ResendButton donationId={d.id} email={d.donorEmail}/>
                  </div>
                </td>
              </tr>))}
            {rows.length === 0 && (<tr><td colSpan={6} className="py-12 text-center text-muted">No completed donations yet.</td></tr>)}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (<div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted">{count} total invoices</p>
          <div className="flex gap-2">
            {page > 1 && <a href={`?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className="px-4 py-2 border border-line rounded-xl text-sm hover:border-brand hover:text-brand transition">← Prev</a>}
            <span className="px-4 py-2 text-sm text-muted">Page {page} of {totalPages}</span>
            {page < totalPages && <a href={`?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className="px-4 py-2 border border-line rounded-xl text-sm hover:border-brand hover:text-brand transition">Next →</a>}
          </div>
        </div>)}
    </div>);
}
