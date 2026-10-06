import { loadTranslations } from "@/lib/i18n";
import DonateClient from "./client";
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
    return (<>
    {false}
    <DonateClient locale={locale} dict={donationDict} initialAmount={searchParams?.amount ? Number(searchParams.amount) : undefined} initialFreq={(searchParams?.freq as "ONE_TIME" | "MONTHLY") || "ONE_TIME"} campaignId={searchParams?.campaign} storyId={searchParams?.story}/>
    </>);
}
