"use client";
import {formatDonationTotals} from '@/lib/currency-totals';
import Icon from "@/components/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect,useState } from "react";
interface Donor {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    country?: string;
    totalDonated: number;
    donationTotals?:Record<string,number>;
    donationCount: number;
    createdAt: string;
}
export default function AccountClient({ locale, dict: D, }: {
    locale: string;
    dict: Record<string, string>;
}) {
    const router = useRouter();
    const p = locale === "ar" ? "" : `/${locale}`;
    const [donor, setDonor] = useState<Donor | null>(null);
    const [loading, setLoading] = useState(true);
    const dateLocale = locale === "ar"
        ? "ar-EG"
        : locale === "tr"
            ? "tr-TR"
            : locale === "fr"
                ? "fr-FR"
                : "en-GB";
    useEffect(() => {
        fetch("/api/donor/me")
            .then((r) => r.json())
            .then((d) => {
            if (!d.user) {
                router.push(`${p}/login`);
                return;
            }
            setDonor(d.user);
            setLoading(false);
        })
            .catch(() => {
            router.push(`${p}/login`);
        });
    }, [p, router]);
    async function logout() {
        await fetch("/api/donor/logout", { method: "POST" });
        router.push(`${p}/login`);
        router.refresh();
    }
    if (loading)
        return (<div className="min-h-[60vh] flex items-center justify-center text-muted font-medium">
        {D["common.loading"] || "جاري التحميل..."}
      </div>);
    if (!donor)
        return null;
    const memberSinceDate = donor.createdAt
        ? new Date(donor.createdAt).toLocaleDateString(dateLocale, {
            year: "numeric",
            month: "long",
        })
        : "-";
    return (<div className="max-w-screen-xl mx-auto px-6 py-16">
      {/* قسم الترحيب ومعلومات المستخدم */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-3xl font-extrabold text-ink">
              {D["account.welcome"] || "مرحباً"}، {donor.name}
            </h1>
            {donor.emailVerified && (<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                <Icon name="shield-check" size={14}/>
                {locale === "ar" ? "حساب موثق" : "Verified"}
              </span>)}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted mt-2 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Icon name="mail" size={15} className="text-brand shrink-0"/>
              {donor.email}
            </span>

            {donor.country && (<span className="flex items-center gap-1.5 border-s border-line ps-4">
                <Icon name="map-pin" size={15} className="text-brand shrink-0"/>
                {donor.country}
              </span>)}
          </div>
        </div>

        <button onClick={logout} className="flex items-center gap-2 text-sm text-muted hover:text-danger border border-line hover:border-danger rounded-xl px-4 py-2.5 transition font-semibold">
          <Icon name="log-out" size={16}/>
          {D["account.logout"] || "تسجيل الخروج"}
        </button>
      </div>

      {/* قسم الإحصائيات */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {[
            {
                label: D["account.total_donated"] || "إجمالي التبرعات",
                value: formatDonationTotals(donor.donationTotals,locale,Number(donor.totalDonated||0)),
                icon: "wallet" as const,
            },
            {
                label: D["account.donations_count"] || "عدد العمليات",
                value: String(donor.donationCount || 0),
                icon: "heart" as const,
            },
            {
                label: D["account.member_since"] || "عضو منذ",
                value: memberSinceDate,
                icon: "shield-check" as const,
            },
        ].map((s) => (<div key={s.label} className="bg-white rounded-xl2 border border-line p-5 flex items-start gap-4 hover:border-brand/30 transition shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
              <Icon name={s.icon} size={18}/>
            </div>
            <div>
              <div className="font-display font-extrabold text-xl text-brand">
                {s.value}
              </div>
              <div className="text-xs text-muted mt-0.5">{s.label}</div>
            </div>
          </div>))}
      </div>

      {/* تنبيه البريد الإلكتروني غير الموثق */}
      {!donor.emailVerified && (<div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Icon name="help-circle" size={18} className="text-warning shrink-0 mt-0.5"/>
          <p className="font-semibold text-warning text-sm">
            {D["account.verify_warning"] || "يرجى تأكيد بريدك الإلكتروني لتأمين حسابك بالكامل."}
          </p>
        </div>)}

      {/* بطاقات التنقل السريع */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link href={`${p}/account/donations`} className="bg-white rounded-xl2 border border-line p-6 hover:border-brand hover:shadow-lg transition group">
          <Icon name="heart" size={24} className="text-brand mb-3"/>
          <h3 className="font-display font-bold text-ink group-hover:text-brand transition">
            {D["account.my_donations"] || "سجل التبرعات"}
          </h3>
        </Link>
        <Link href={`${p}/campaigns`} className="bg-white rounded-xl2 border border-line p-6 hover:border-accent hover:shadow-lg transition group">
          <Icon name="target" size={24} className="text-accent mb-3"/>
          <h3 className="font-display font-bold text-ink group-hover:text-accent transition">
            {D["account.browse_campaigns"] || "تصفح الحملات"}
          </h3>
        </Link>
        <Link href={`${p}/account/settings`} className="bg-white rounded-xl2 border border-line p-6 hover:border-brand hover:shadow-lg transition group">
          <Icon name="settings" size={24} className="text-brand mb-3"/>
          <h3 className="font-display font-bold text-ink group-hover:text-brand transition">
            {D["account.settings"] || "إعدادات الحساب"}
          </h3>
        </Link>
      </div>
    </div>);
}
