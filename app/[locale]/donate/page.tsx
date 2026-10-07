import { loadTranslations } from "@/lib/i18n";
import DonateClient from "./client";
import { getDonationOptions } from "@/lib/services/donation-options.service";
import { getSupabaseOrNull } from "@/lib/supabase";
export default async function DonatePage({ params: { locale }, searchParams, }: {
    params: {
        locale: string;
    };
    searchParams: {
        amount?: string;
        freq?: string;
        campaign?: string;
        story?: string;
    };
}) {
    const dict = await loadTranslations(locale);
    const donationDict = dict;
    const options = await getDonationOptions(locale);
    const db = getSupabaseOrNull();
    const campaigns = db ? (await db.from("Campaign").select("id,title,defaultAmount").eq("isActive", true).order("title")).data || [] : [];
    if (db && locale !== 'ar' && campaigns.length) {
        const { data: translations } = await db.from("CampaignTranslation").select("campaignId,title").eq("locale", locale).in("campaignId", campaigns.map(c => c.id));
        for (const campaign of campaigns) campaign.title = translations?.find(t => t.campaignId === campaign.id)?.title || campaign.title;
    }
    const campaign = searchParams?.campaign && db ? (await db.from("Campaign").select("defaultAmount")
        .eq("id", searchParams.campaign).eq("isActive", true).maybeSingle()).data : null;
    return (<>
    {false}
    <DonateClient locale={locale} dict={donationDict} campaigns={campaigns} amounts={options.amounts} defaultAmount={campaign?.defaultAmount || options.defaultAmount} initialAmount={searchParams?.amount ? Number(searchParams.amount) : undefined} initialFreq={searchParams?.freq === "MONTHLY" ? "MONTHLY" : "ONE_TIME"} campaignId={searchParams?.campaign} storyId={searchParams?.story}/>
    </>);
}
