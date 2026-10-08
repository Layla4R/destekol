import SubscriberDeleteButton from "@/components/admin/SubscriberDeleteButton";
import Icon from "@/components/icons";
import { requirePermission } from "@/lib/admin-access";
import { hasPermission } from "@/lib/permissions";
import { getSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
export const revalidate = 0;
export default async function SubscribersPage({ searchParams }: {
    searchParams: {
        page?: string;
        q?: string;
    };
}) {
    let session;
    try {
        session = await requirePermission("subscribers.view");
    }
    catch {
        redirect("/admin/forbidden");
    }
    const page = Math.max(1, parseInt(searchParams?.page || "1"));
    const PAGE_SIZE = 100;
    const from = (page - 1) * PAGE_SIZE;
    const supabase = getSupabase();
    const q = searchParams?.q?.trim();
    let subQuery = supabase.from("Subscriber").select("id,email,createdAt,active,consentAt,consentLocale,consentVersion,unsubscribedAt", { count: "exact" }).order("createdAt", { ascending: false });
    if (q)
        subQuery = subQuery.ilike("email", `%${q}%`);
    const { data: subscribers, count } = await subQuery.range(from, from + PAGE_SIZE - 1);
    const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
    const rows = subscribers || [];
    return (<div className="p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink mb-1">Email Subscribers</h1>
          <p className="text-muted text-sm">{count || 0} subscribers in your newsletter list</p>
        </div>
        <a href={`/api/admin/subscribers/export${q ? `?q=${encodeURIComponent(q)}` : ""}`} className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl px-5 py-2.5 text-sm transition">
          <Icon name="file-text" size={16}/> Export CSV
        </a>
      </div>

      {/* Search */}
      <form method="get" className="mb-4">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input name="q" defaultValue={q} placeholder="Search by email…" className="pl-9 pr-4 py-2.5 border border-line rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand/30 bg-white"/>
        </div>
      </form>

      <div className="bg-white rounded-xl2 border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dashbg border-b border-line text-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left py-3 px-4">#</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Subscribed</th>
                <th className="text-left py-3 px-4">Status / Consent</th><th className="py-3 px-4"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((sub: any, i: number) => (<tr key={sub.id} className="hover:bg-dashbg/50 transition">
                  <td className="py-3 px-4 text-muted">{from + i + 1}</td>
                  <td className="py-3 px-4 font-medium text-ink">{sub.email}</td>
                  <td className="py-3 px-4 text-muted">{new Date(sub.createdAt).toLocaleDateString("en-GB")}</td>
                  <td className="py-3 px-4 text-xs">{sub.unsubscribedAt ? "Unsubscribed" : sub.active && sub.consentAt ? "Subscribed" : "Consent not recorded"}<br/>{sub.consentAt && new Date(sub.consentAt).toLocaleString()} {sub.consentLocale} {sub.consentVersion}</td><td className="py-3 px-4"><SubscriberDeleteButton id={sub.id}/></td>
                </tr>))}
              {rows.length === 0 && (<tr><td colSpan={5} className="py-12 text-center text-muted">No subscribers yet.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      {totalPages > 1 && (<div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted">{count} total subscribers</p>
          <div className="flex gap-2">
            {page > 1 && <a href={`?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className="px-4 py-2 border border-line rounded-xl text-sm hover:border-brand hover:text-brand transition">← Prev</a>}
            <span className="px-4 py-2 text-sm text-muted">Page {page} of {totalPages}</span>
            {page < totalPages && <a href={`?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className="px-4 py-2 border border-line rounded-xl text-sm hover:border-brand hover:text-brand transition">Next →</a>}
          </div>
        </div>)}
    </div>);
}
