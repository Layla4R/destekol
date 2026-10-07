import Icon from "@/components/icons";
import { requireSuperAdmin } from "@/lib/auth";
import { requirePermission } from "@/lib/admin-access";
import { hasPermission } from "@/lib/permissions";
import { formatCurrency,formatNumber } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";
import { redirect } from "next/navigation";
export const revalidate = 0;
export default async function AdminDashboard() {
    let session;
    try {
        await requireSuperAdmin();
        session = await requirePermission("audit.view");
    }
    catch {
        redirect("/admin/forbidden");
    }
    const supabase = getSupabase();
    // حساب التواريخ مرة واحدة وبشكل دقيق
    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const since60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const since7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    // تحسين جذري للاستعلامات: طلب ما نحتاجه فقط وتوحيد الـ limits مع الموقع
    const [campaignsRes, donationsRes, subscribersRes, usersRes, recentDonationsRes, unreadMessagesRes, last30Res, prev30Res, recentAmountsRes] = await Promise.all([
        // 1. جلب أفضل 5 حملات فقط (لأن الواجهة تعرض 5)
        supabase.from("Campaign").select("id, title, raisedAmount, goalAmount, donorCount, isActive").order("raisedAmount", { ascending: false }).limit(5),
        // 2. توحيد الـ limit مع الموقع لعدم حدوث اختلاف في مجموع المبالغ
        supabase.from("Donation").select("amount", { count: "exact" }).eq("status", "COMPLETED").limit(50000),
        // 3. العدادات السريعة (بدون جلب البيانات كاملة، جلب الـ ID فقط للعد)
        supabase.from("Subscriber").select("id", { count: "exact", head: true }),
        supabase.from("User").select("id", { count: "exact", head: true }).eq("role", "DONOR"),
        // 4. أحدث 5 تبرعات
        supabase.from("Donation").select("id, amount, currency, donorName, donorEmail, userId, status, provider, frequency, createdAt, campaign:Campaign(title)").order("createdAt", { ascending: false }).limit(5),
        // 5. الرسائل غير المقروءة
        supabase.from("ContactMessage").select("id", { count: "exact", head: true }).eq("isRead", false),
        // 6. استعلامات التريند (النمو) مع تقليل حجم البيانات المسترجعة
        supabase.from("Donation").select("amount").eq("status", "COMPLETED").gte("createdAt", since30),
        supabase.from("Donation").select("amount").eq("status", "COMPLETED").gte("createdAt", since60).lt("createdAt", since30),
        supabase.from("Donation").select("amount, createdAt").eq("status", "COMPLETED").gte("createdAt", since7)
    ]);
    const campaigns = campaignsRes.data || [];
    const donationsData = donationsRes.data || [];
    // حساب المجموع بشكل دقيق ومتطابق مع صفحة الموقع
    const totalRaised = donationsData.reduce((s: number, d: any) => s + Number(d.amount), 0);
    const totalRaisedTruncated = donationsData.length >= 50000;
    const completedDonationsCount = donationsRes.count || 0;
    const subscribersCount = subscribersRes.count || 0;
    const donorAccounts = usersRes.count || 0;
    const recentDonations = recentDonationsRes.data || [];
    const unreadMessages = unreadMessagesRes.count || 0;
    // حساب مؤشر النمو (Trend)
    const last30Total = (last30Res.data || []).reduce((s: number, d: any) => s + Number(d.amount), 0);
    const prev30Total = (prev30Res.data || []).reduce((s: number, d: any) => s + Number(d.amount), 0);
    const trendPct = prev30Total > 0 ? Math.round(((last30Total - prev30Total) / prev30Total) * 100) : null;
    // بيانات المخطط البياني (Chart)
    const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().slice(0, 10);
    });
    const byDay: Record<string, number> = {};
    for (const day of last7)
        byDay[day] = 0;
    for (const d of recentAmountsRes.data || []) {
        const day = (d.createdAt as string)?.slice(0, 10);
        if (day && byDay[day] !== undefined)
            byDay[day] += Number(d.amount);
    }
    const maxDay = Math.max(...Object.values(byDay), 1);
    const cards: {
        label: string;
        value: string;
        icon: "wallet" | "hand-heart" | "shield-check" | "mail";
        color: string;
        link: string;
        trend?: number | null;
    }[] = [
        { label: "Total Raised", value: formatCurrency(totalRaised), icon: "wallet", color: "brand", link: "/admin/donations", trend: trendPct },
        { label: "Completed Donations", value: formatNumber(completedDonationsCount), icon: "hand-heart", color: "brand", link: "/admin/donations" },
        { label: "Donor Accounts", value: formatNumber(donorAccounts), icon: "shield-check", color: "brand", link: "/admin/donors" },
        { label: "Newsletter Subscribers", value: formatNumber(subscribersCount), icon: "mail", color: "brand", link: "/admin/subscribers" },
    ];
    const unreadCard = unreadMessages > 0 ? { label: "Unread Messages", value: String(unreadMessages), icon: "mail" as const, color: "danger", link: "/admin/messages" } : null;
    return (<div className="p-6 sm:p-8 space-y-8">
      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(c => (<Link key={c.label} href={c.link} className="bg-white rounded-xl2 border border-line p-5 flex items-start justify-between hover:border-brand hover:shadow-md transition group">
            <div>
              <div className="font-display text-2xl font-extrabold text-brand mb-1">{c.value}</div>
              <div className="text-xs text-muted">{c.label}</div>
              {c.trend != null && (<div className={`mt-1.5 text-[10px] font-bold flex items-center gap-0.5 ${c.trend >= 0 ? "text-success" : "text-danger"}`}>
                  {c.trend >= 0 ? "▲" : "▼"} {Math.abs(c.trend)}% vs last 30 days
                </div>)}
              {c.label === "Total Raised" && totalRaisedTruncated && (<div className="mt-1 text-[9px] text-warning">⚠ 50k+ donations — figure may be partial</div>)}
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand/8 text-brand flex items-center justify-center group-hover:bg-brand/15 transition">
              <Icon name={c.icon} size={18}/>
            </div>
          </Link>))}
        {unreadCard && (<Link href={unreadCard.link} className="bg-white rounded-xl2 border border-danger/30 p-5 flex items-start justify-between hover:border-danger hover:shadow-md transition group animate-pulse-slow">
            <div>
              <div className="font-display text-2xl font-extrabold text-danger mb-1">{unreadCard.value}</div>
              <div className="text-xs text-muted">{unreadCard.label}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center group-hover:bg-danger/20 transition">
              <Icon name={unreadCard.icon} size={18}/>
            </div>
          </Link>)}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart — last 7 days */}
        <div className="lg:col-span-2 bg-white rounded-xl2 border border-line p-6">
          <h2 className="font-display font-bold text-ink mb-5">Donations — Last 7 Days</h2>
          <div className="flex items-end gap-2 h-40">
            {last7.map(day => {
            const pct = Math.max(4, Math.round((byDay[day] / maxDay) * 100));
            const label = new Date(day).toLocaleDateString("en-GB", { weekday: "short" });
            return (<div key={day} className="flex-1 flex flex-col items-center gap-1.5" title={byDay[day] > 0 ? `$${byDay[day]}` : "No donations"}>
                  <span className="text-xs text-muted font-semibold">{byDay[day] > 0 ? `$${byDay[day].toFixed(2).replace(/\.00$/, "")}` : "—"}</span>
                  <div className="w-full rounded-t-lg bg-brand/10 relative overflow-hidden" style={{ height: "100px" }}>
                    <div className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all ${byDay[day] > 0 ? "bg-brand" : "bg-line"}`} style={{ height: `${pct}%` }}/>
                  </div>
                  <span className="text-xs text-muted">{label}</span>
                </div>);
        })}
          </div>
        </div>

        {/* Top campaigns */}
        <div className="bg-white rounded-xl2 border border-line p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-ink">Top Campaigns</h2>
            <Link href="/admin/campaigns" className="text-brand text-sm hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {campaigns.map((c: any) => {
            const pct = Math.min(100, Math.round((Number(c.raisedAmount) / (Number(c.goalAmount) || 1)) * 100));
            return (<Link key={c.id} href={`/admin/campaigns/${c.id}`} className="block group">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink font-medium truncate pr-2 group-hover:text-brand transition">{c.title}</span>
                    <span className="text-muted shrink-0">{pct}%</span>
                  </div>
                  <div className="w-full bg-line rounded-full h-1.5">
                    <div className="bg-brand h-1.5 rounded-full" style={{ width: `${pct}%` }}/>
                  </div>
                </Link>);
        })}
            {campaigns.length === 0 && <p className="text-muted text-sm">No campaigns yet.</p>}
          </div>
        </div>
      </div>

      {/* Recent donations */}
      <div className="bg-white rounded-xl2 border border-line overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="font-display font-bold text-ink">Recent Donations</h2>
          <Link href="/admin/donations" className="text-brand text-sm hover:underline">View all →</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-dashbg text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left py-3 px-4">Donor</th>
              <th className="text-left py-3 px-4">Amount</th>
              <th className="text-left py-3 px-4">Campaign</th>
              <th className="text-left py-3 px-4">Gateway</th>
              <th className="text-left py-3 px-4">Type</th>
              <th className="text-left py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {recentDonations.map((d: any) => (<tr key={d.id} className="hover:bg-dashbg/50">
                <td className="py-3 px-4">
                  {d.userId && !d.isAnonymous ? (<Link href={`/admin/donors/${d.userId}`} className="block hover:text-brand transition">
                      <div className="font-medium">{d.donorName}</div>
                      <div className="text-xs text-muted">{d.donorEmail}</div>
                    </Link>) : (<>
                      <div className="font-medium">{d.isAnonymous ? "Anonymous" : d.donorName}</div>
                      <div className="text-xs text-muted">{d.donorEmail}</div>
                    </>)}
                </td>
                <td className="py-3 px-4 font-bold text-brand">${Number(d.amount).toFixed(2)}</td>
                <td className="py-3 px-4 text-muted">{(d.campaign as any)?.title || "—"}</td>
                <td className="py-3 px-4 text-muted">{d.provider}</td>
                <td className="py-3 px-4 text-muted text-xs">{d.frequency === "MONTHLY" ? "🔄 Monthly" : "One-time"}</td>
                <td className="py-3 px-4 text-muted text-xs">{new Date(d.createdAt).toLocaleDateString("en-GB")}</td>
              </tr>))}
            {recentDonations.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted">No donations yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-4 gap-3">
        {[
            { href: "/admin/pages", label: "Edit Pages", icon: "layers" as const },
            { href: "/admin/campaigns/new", label: "New Campaign", icon: "target" as const },
            { href: "/admin/posts/new", label: "New Post", icon: "file-text" as const },
            { href: "/admin/settings", label: "Settings", icon: "settings" as const },
        ].map(l => (<Link key={l.href} href={l.href} className="bg-white rounded-xl border border-line p-4 flex items-center gap-3 hover:border-brand hover:text-brand transition text-sm font-semibold text-muted group">
            <Icon name={l.icon} size={18} className="group-hover:text-brand transition"/>
            {l.label}
          </Link>))}
      </div>
    </div>);
}
