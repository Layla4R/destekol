"use client";
import Icon from "@/components/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect,useState } from "react";
interface Donation {
    id: string;
    amount: number;
    currency: string;
    frequency: string;
    status: string;
    provider: string;
    receiptNumber?: string;
    createdAt: string;
    campaign?: {
        title: string;
        slug: string;
    };
}
export default function DonationsClient({ locale, dict: D }: {
    locale: string;
    dict: Record<string, string>;
}) {
    const router = useRouter();
    const p = locale === "ar" ? "" : `/${locale}`;
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState<string | null>(null);
    const dateLocale = locale === "ar" ? "ar-EG" : locale === "tr" ? "tr-TR" : locale === "fr" ? "fr-FR" : "en-GB";
    const STATUS: Record<string, string> = {
        COMPLETED: D["account.status_completed"] || (locale === "ar" ? "مكتمل" : "Completed"),
        PENDING: D["account.status_pending"] || (locale === "ar" ? "معلق" : "Pending"),
        FAILED: D["account.status_failed"] || (locale === "ar" ? "فاشل" : "Failed"),
        REFUNDED: D["account.status_refunded"] || (locale === "ar" ? "ملغي" : "Cancelled"), // REFUNDED = subscription cancelled
    };
    const STATUS_CLS: Record<string, string> = { COMPLETED: "bg-success/10 text-success", PENDING: "bg-warning/10 text-warning", FAILED: "bg-danger/10 text-danger", REFUNDED: "bg-muted/10 text-muted" };
    useEffect(() => {
        fetch("/api/donor/donations").then(r => { if (r.status === 401) {
            router.push(`${p}/login`);
            return null;
        } return r.json(); })
            .then(d => { if (d) {
            setDonations(d.donations || []);
            setLoading(false);
        } });
    }, []);
    async function cancelSub(id: string) {
        if (!confirm(D["account.cancel_confirm"]))
            return;
        setCancelling(id);
        const res = await fetch("/api/donor/cancel-subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ donationId: id }) });
        if (res.ok)
            setDonations(prev => prev.map(x => x.id === id ? { ...x, status: "REFUNDED" } : x));
        setCancelling(null);
    }
    if (loading)
        return <div className="min-h-[50vh] flex items-center justify-center text-muted">{D["common.loading"]}</div>;
    return (<div className="max-w-screen-xl mx-auto px-6 py-16">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`${p}/account`} aria-label={D["account.back_to_account"]} className="text-muted hover:text-ink"><Icon name="arrow-left" size={20}/></Link>
        <h1 className="font-display text-2xl font-extrabold text-ink">{D["account.my_donations"]}</h1>
      </div>
      {donations.length === 0 ? (<div className="text-center py-20 bg-white rounded-xl2 border border-line">
          <Icon name="heart" size={48} className="text-line mx-auto mb-4"/>
          <p className="text-muted mb-6">{D["account.no_donations"]}</p>
          <Link href={`${p}/campaigns`} className="bg-accent-gradient text-white font-bold rounded-xl px-6 py-3 inline-flex items-center gap-2 hover:opacity-90 transition"><Icon name="heart" size={16}/>{D["common.donate_now"]}</Link>
        </div>) : (<div className="space-y-3">
          {donations.map(d => (<div key={d.id} className="bg-white rounded-xl2 border border-line p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-ink text-lg">${Number(d.amount).toFixed(2)} <span className="text-muted font-normal text-sm">{d.currency?.toUpperCase()}</span></div>
                  <div className="text-sm text-muted mt-0.5">
                    {d.campaign ? <Link href={`${p}/campaigns/${d.campaign.slug}`} className="text-brand hover:underline">{d.campaign.title}</Link> : D["common.general_donation"]}
                    {" · "}{d.frequency === "MONTHLY" ? D["common.per_month"] : D["common.one_time"]}{" · "}{d.provider}
                  </div>
                  {d.receiptNumber && <div className="text-xs text-muted/60 font-mono mt-0.5">{d.receiptNumber}</div>}
                  <div className="flex flex-wrap gap-3 mt-2">
                    {d.status === "COMPLETED" && <a href={`/api/donor/receipt/${d.id}`} className="text-xs text-brand hover:underline flex items-center gap-1 font-semibold"><Icon name="file-text" size={12}/>{D["account.receipt"]}</a>}
                    {d.status === "COMPLETED" && d.frequency === "MONTHLY" && <button onClick={() => cancelSub(d.id)} disabled={cancelling === d.id} className="text-xs text-danger hover:underline flex items-center gap-1 font-semibold disabled:opacity-50"><Icon name="x" size={12}/>{cancelling === d.id ? "..." : D["account.cancel_sub"]}</button>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-bold rounded-full px-3 py-1.5 ${STATUS_CLS[d.status] || ""}`}>{STATUS[d.status] || d.status}</span>
                  <div className="text-xs text-muted mt-2">{new Date(d.createdAt).toLocaleDateString(dateLocale)}</div>
                </div>
              </div>
            </div>))}
        </div>)}
    </div>);
}
