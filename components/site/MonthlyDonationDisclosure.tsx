import { getMonthlyDonationCopy, monthlyAmountLabel } from '@/lib/monthly-donation-copy';
export default function MonthlyDonationDisclosure({ amount, currency, locale }: { amount: number; currency: string; locale: string }) {
    const copy = getMonthlyDonationCopy(locale);
    return <section aria-label={copy.title} className="rounded-2xl border border-line bg-[#f3fafb] p-4 sm:p-5 text-sm leading-7" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <h3 className="font-bold text-brand mb-3">{copy.title}</h3>
        <dl className="space-y-3 text-muted">
            <div><dt className="font-bold text-ink">{copy.amount}</dt><dd className="font-bold text-brand" data-monthly-amount>{monthlyAmountLabel(amount, currency, locale)}</dd></div>
            {[[copy.first, copy.firstPending], [copy.cycle, copy.cycleText], [copy.authorization, copy.authorizationText], [copy.cancellation, copy.cancellationText], [copy.refund, copy.refundText]].map(([label, text]) => <div key={label}><dt className="font-bold text-ink">{label}</dt><dd>{text}</dd></div>)}
        </dl>
        <a className="mt-3 block text-brand underline" href={`/${locale}/account/donations`}>{({ar:'حسابي ← تبرعاتي',tr:'Hesabım → Bağışlarım',en:'My Account → My Donations',fr:'Mon compte → Mes dons'} as Record<string,string>)[locale] || 'My Donations'}</a>
        <a className="mt-3 inline-block text-brand underline" href={`mailto:info@destekol.org?subject=${encodeURIComponent(copy.title)}`}>info@destekol.org</a>
        <p role="status" className="mt-3 border-t border-line pt-3 font-semibold text-ink">{copy.unavailable}</p>
    </section>;
}
