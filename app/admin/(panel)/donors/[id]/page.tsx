import Icon from "@/components/icons";
import { requirePermission } from "@/lib/admin-access";
import { hasPermission } from "@/lib/permissions";
import { formatCurrency } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound,redirect } from "next/navigation";
export const revalidate = 0;
export default async function DonorProfilePage({ params }: {
    params: {
        id: string;
    };
}) {
    let session;
    try {
        session = await requirePermission("users.view", undefined, params.id);
    }
    catch {
        redirect("/admin/forbidden");
    }
    const supabase = getSupabase();
    const { data: user } = await supabase.from("User").select("id,name,email,createdAt,emailVerified,totalDonated,donationCount,lastLoginAt").eq("role", "DONOR").eq("isStaff", false).eq("id", params.id).maybeSingle();
    await requirePermission("donations.view", undefined, params.id);
    // Fetch donations by userId OR donorEmail (guest donations may not have userId)
    const [byUserId, byEmail] = await Promise.all([
        supabase.from("Donation")
            .select("*, campaign:Campaign(id, title, slug)")
            .eq("userId", params.id)
            .order("createdAt", { ascending: false })
            .limit(200),
        user?.email
            ? supabase.from("Donation")
                .select("*, campaign:Campaign(id, title, slug)")
                .eq("donorEmail", user.email)
                .is("userId", null) // Only email-only records (avoid duplicates)
                .order("createdAt", { ascending: false })
                .limit(200)
            : Promise.resolve({ data: [] }),
    ]);
    const donationMap = new Map<string, any>();
    for (const d of [...(byUserId.data || []), ...(byEmail.data || [])]) {
        donationMap.set(d.id, d);
    }
    const donations = Array.from(donationMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 200);
    if (!user)
        notFound();
    const totalDonated = (donations || []).filter((d: any) => d.status === "COMPLETED")
        .reduce((sum: number, d: any) => sum + Number(d.amount), 0);
    return (<div className="p-6 sm:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/donors" className="text-muted hover:text-ink transition">
          <Icon name="arrow-left" size={18}/>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">{user.name || "Anonymous"}</h1>
          <p className="text-muted text-sm">{user.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-line rounded-2xl p-5">
          <div className="text-2xl font-extrabold text-brand mb-1">{formatCurrency(totalDonated)}</div>
          <div className="text-xs text-muted">Total Donated</div>
        </div>
        <div className="bg-white border border-line rounded-2xl p-5">
          <div className="text-2xl font-extrabold text-ink mb-1">{(donations || []).filter((d: any) => d.status === "COMPLETED").length}</div>
          <div className="text-xs text-muted">Completed Donations</div>
        </div>
        <div className="bg-white border border-line rounded-2xl p-5">
          <div className="text-2xl font-extrabold text-ink mb-1">
            {new Date(user.createdAt).toLocaleDateString("en-GB")}
          </div>
          <div className="text-xs text-muted">Member Since</div>
        </div>
      </div>

      {/* Donation history */}
      <div className="bg-white border border-line rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between">
          <h2 className="font-display font-bold text-ink">Donation History</h2>
          {(donations || []).length >= 200 && (<span className="text-xs text-warning font-semibold">⚠ Showing first 200 — more may exist</span>)}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-dashbg border-b border-line text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left py-3 px-4">Amount</th>
              <th className="text-left py-3 px-4">Campaign</th>
              <th className="text-left py-3 px-4">Gateway</th>
              <th className="text-left py-3 px-4">Frequency</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(donations || []).map((d: any) => (<tr key={d.id} className="hover:bg-dashbg/50 transition">
                <td className="py-3 px-4 font-bold text-brand">
                  {formatCurrency(Number(d.amount), (d.currency || "usd").toUpperCase())}
                </td>
                <td className="py-3 px-4 text-muted">
                  {d.campaign ? (<Link href={`/admin/campaigns/${(d.campaign as any).id || ""}`} className="hover:text-brand transition">
                      {(d.campaign as any).title}
                    </Link>) : "—"}
                </td>
                <td className="py-3 px-4 text-muted">{d.provider}</td>
                <td className="py-3 px-4 text-muted">{d.frequency === "MONTHLY" ? "Monthly" : "One-time"}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-bold rounded-full px-2.5 py-1 ${d.status === "COMPLETED" ? "bg-success/10 text-success" :
                d.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                    d.status === "FAILED" ? "bg-red-100 text-red-600" :
                        "bg-orange-100 text-orange-600"}`}>{d.status.charAt(0) + d.status.slice(1).toLowerCase()}</span>
                </td>
                <td className="py-3 px-4 text-muted text-xs">{new Date(d.createdAt).toLocaleDateString("en-GB")}</td>
              </tr>))}
            {!donations?.length && (<tr><td colSpan={6} className="py-12 text-center text-muted">No donations yet.</td></tr>)}
            {(donations?.length || 0) >= 200 && (<tr><td colSpan={6} className="py-4 text-center text-xs text-muted bg-dashbg">
                Showing first 200 donations — export CSV for full history
              </td></tr>)}
          </tbody>
        </table>
      </div>
    </div>);
}
