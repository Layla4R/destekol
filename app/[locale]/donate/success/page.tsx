import Icon from "@/components/icons";
import { loadTranslations } from "@/lib/i18n";
import { getSupabaseOrNull } from "@/lib/supabase";
import Link from "next/link";
export default async function DonateSuccessPage({ params: { locale }, searchParams, }: {
    params: {
        locale: string;
    };
    searchParams: {
        donation?: string;
    };
}) {
    const dict = await loadTranslations(locale);
    const p = locale === "ar" ? "" : `/${locale}`;
    const donationId = searchParams?.donation;
    // Load donation details if ID provided
    let donation: any = null;
    if (donationId) {
        const supabase = getSupabaseOrNull();
        if (supabase) {
            const { data } = await supabase
                .from("Donation")
                .select("donorName, amount, currency, receiptNumber, frequency, campaign:Campaign(title)")
                .eq("id", donationId)
                .maybeSingle();
            donation = data;
        }
    }
    const t = (key: string, fallback: string) => dict[key] || fallback;
    return (<div className="min-h-[70vh] flex items-center justify-center bg-section-gradient px-6 py-16">
      <div className="bg-white rounded-2xl shadow-2xl border border-line p-10 max-w-md text-center w-full">
        <div className="w-20 h-20 rounded-full bg-brand-gradient text-white flex items-center justify-center mx-auto mb-7 shadow-lg shadow-brand/20">
          <Icon name="heart" size={36}/>
        </div>
        <h1 className="font-display text-3xl font-extrabold text-ink mb-3">
          {t("donate.success_title", "شكراً لك!")}
        </h1>
        <p className="text-muted mb-6 leading-relaxed">
          {t("donate.success_body", "تم استلام تبرعك. ستصلك رسالة تأكيد على بريدك الإلكتروني.")}
        </p>

        {donation && (<div className="bg-brand/5 border border-brand/20 rounded-xl p-4 mb-6 text-left rtl:text-right space-y-2 text-sm">
            {donation.donorName && (<div className="flex justify-between">
                <span className="text-muted">{t("donate.name", "الاسم")}</span>
                <span className="font-semibold text-ink">{donation.donorName}</span>
              </div>)}
            <div className="flex justify-between">
              <span className="text-muted">{t("donate.amount", "المبلغ")}</span>
              <span className="font-bold text-brand">${Number(donation.amount).toFixed(2)}</span>
            </div>
            {(donation.campaign as any)?.title && (<div className="flex justify-between">
                <span className="text-muted">{t("nav.campaigns", "الحملة")}</span>
                <span className="font-semibold text-ink text-xs">{(donation.campaign as any).title}</span>
              </div>)}
            {donation.receiptNumber && (<div className="flex justify-between">
                <span className="text-muted">Receipt #</span>
                <span className="font-mono text-xs text-ink">{donation.receiptNumber}</span>
              </div>)}
            <div className="flex justify-between">
              <span className="text-muted">{t("donate.frequency", "النوع")}</span>
              <span className="text-ink">{donation.frequency === "MONTHLY" ? t("donate.monthly", "شهري") : t("donate.one_time", "مرة واحدة")}</span>
            </div>
          </div>)}

        <div className="space-y-3">
          <Link href={`${p}/`} className="block w-full bg-brand-gradient hover:opacity-90 text-white font-bold rounded-xl px-8 py-3.5 transition">
            {t("donate.success_home", "العودة للرئيسية")}
          </Link>
          <Link href={`${p}/campaigns`} className="block w-full border border-brand text-brand font-bold rounded-xl px-8 py-3.5 transition hover:bg-brand hover:text-white">
            {t("donate.success_more", "تصفح المزيد من الحملات")}
          </Link>
        </div>
      </div>
    </div>);
}
