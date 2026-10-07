import Icon from "@/components/icons";
import { loadTranslations } from "@/lib/i18n";

import Link from "next/link";
export default async function DonateCancelPage({ params: { locale }, searchParams, }: {
    params: {
        locale: string;
    };
    searchParams: {
        donation?: string;
    };
}) {
    const dict = await loadTranslations(locale);
    const p = `/${locale}`;
    // Return pages never mutate a financial transaction; provider notifications determine its status.
    const t = (key: string, fallback: string) => dict[key] || fallback;
    return (<div className="min-h-[70vh] flex items-center justify-center bg-section-gradient px-6 py-16">
      <div className="bg-white rounded-2xl shadow-xl border border-line p-10 max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-line flex items-center justify-center mx-auto mb-5">
          <Icon name="x" size={28} className="text-muted"/>
        </div>
        <h1 className="font-display text-2xl font-extrabold text-ink mb-3">
          {t("donate.cancel_title", "تم إلغاء التبرع")}
        </h1>
        <p className="text-muted mb-6">
          {t("donate.cancel_body", "تم إلغاء عملية الدفع. يمكنك المحاولة مجدداً في أي وقت.")}
        </p>
        <div className="space-y-3">
          <Link href={`${p}/donate`} className="block w-full bg-brand text-white font-bold rounded-xl px-6 py-3 hover:bg-brand-dark transition">
            {t("donate.cancel_retry", "حاول مجدداً")}
          </Link>
          <Link href={`${p}/campaigns`} className="block w-full border border-line text-muted font-bold rounded-xl px-6 py-3 hover:border-brand hover:text-brand transition">
            {t("nav.campaigns", "تصفح الحملات")}
          </Link>
        </div>
      </div>
    </div>);
}
