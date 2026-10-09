import CampaignForm from "@/components/admin/CampaignForm";
import CampaignTranslationsPanel from "@/components/admin/CampaignTranslationsPanel";
import CampaignUpdatesPanel from "@/components/admin/CampaignUpdatesPanel";
import Icon from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound,redirect } from "next/navigation";
export const revalidate = 0;
export default async function EditCampaignPage({ params }: {
    params: {
        id: string;
    };
}) {
    try {
        await requireAdmin();
    }
    catch {
        redirect("/admin/login");
    }
    const supabase = getSupabase();
    const [{ data: campaign }, { data: updates }, { data: topDonations }] = await Promise.all([
        supabase.from("Campaign").select("*").eq("id", params.id).maybeSingle(),
        supabase.from("CampaignUpdate").select("*").eq("campaignId", params.id).order("createdAt", { ascending: false }),
        supabase.from("Donation").select("id, donorName, donorEmail, amount, currency, isAnonymous, createdAt, status")
            .eq("campaignId", params.id).eq("status", "COMPLETED")
            .order("amount", { ascending: false }).limit(10),
    ]);
    if (!campaign)
        notFound();
    return (<div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-5 rounded-2xl border border-line shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin/campaigns" className="p-2 rounded-xl bg-dashbg hover:bg-line transition text-muted hover:text-ink">
            <Icon name="arrow-left" size={18}/>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink">Edit Campaign</h1>
            <p className="text-xs text-muted">Manage campaign settings, EEAT trust signals, translations, and updates</p>
          </div>
        </div>
        <a href={`${process.env.NEXT_PUBLIC_SITE_URL || ""}/campaigns/${campaign.slug}`} target="_blank" className="flex items-center gap-2 text-xs font-bold border border-line text-muted rounded-xl px-4 py-2.5 hover:border-brand hover:text-brand transition bg-white">
          <Icon name="globe" size={14}/> View Live
        </a>
      </div>

      {/* Main Campaign Edit Form */}
      <CampaignForm initial={{
            id: campaign.id, title: campaign.title, slug: campaign.slug,
            summary: campaign.summary, description: campaign.description,
            coverImage: campaign.coverImage, goalAmount: campaign.goalAmount,
            defaultAmount: campaign.defaultAmount, category: campaign.category,
            country: campaign.country, isActive: campaign.isActive,
            isFeatured: campaign.isFeatured, isZakatable: campaign.isZakatable,
            authorName: campaign.authorName, authorRole: campaign.authorRole,
            publishedAt: campaign.publishedAt,
            projectPlan: campaign.projectPlan, currency: campaign.currency,
        }}/>

      {/* Content Translations */}
      <CampaignTranslationsPanel campaignId={campaign.id} baseTitle={campaign.title} baseSummary={campaign.summary} baseDescription={campaign.description} baseAuthorName={campaign.authorName || ""} baseAuthorRole={campaign.authorRole || ""}/>

      {/* Campaign Updates */}
      <CampaignUpdatesPanel campaignId={params.id} updates={updates || []} donorCount={campaign.donorCount || 0}/>

      {/* Top Donors Table */}
      {topDonations && topDonations.length > 0 && (<div className="bg-white rounded-2xl border border-line overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-line">
            <h2 className="font-display font-bold text-ink">Top Donors</h2>
            <Link href={`/admin/donations?campaign=${campaign.id}`} className="text-brand text-xs font-bold hover:underline">View all →</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-dashbg text-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left py-3 px-4">Donor</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {topDonations.map((d: any) => (<tr key={d.id} className="hover:bg-dashbg/50 transition">
                  <td className="py-3 px-4">
                    <div className="font-medium">{d.isAnonymous ? "Anonymous" : d.donorName}</div>
                    {!d.isAnonymous && <div className="text-xs text-muted">{d.donorEmail}</div>}
                  </td>
                  <td className="py-3 px-4 font-bold text-brand">{formatCurrency(Number(d.amount), (d.currency || "usd").toUpperCase())}</td>
                  <td className="py-3 px-4 text-muted text-xs">{new Date(d.createdAt).toLocaleDateString("en-GB")}</td>
                </tr>))}
            </tbody>
          </table>
        </div>)}
    </div>);
}
