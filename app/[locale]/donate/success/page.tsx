import { getCurrentDonor } from '@/lib/donorAuth';
import { hasDonationReturnAccess } from '@/lib/donation-return-access';
import { getSupabaseOrNull } from '@/lib/supabase';
import Link from 'next/link';
import PaymentResultActions from './PaymentResultActions';

export const dynamic = 'force-dynamic';
const copy = {
    ar: { pending: 'الدفع قيد التحقق', pendingBody: 'لم نؤكد استلام دفعة بعد. إذا أكملت الدفع، حدّث الحالة بعد قليل. لا تكرر الدفع أثناء انتظار التأكيد.', success: 'تم تأكيد تبرعك', successBody: 'أكد مزوّد الدفع استلام المعاملة. تفاصيل تبرعك أدناه.', failed: 'لم يكتمل الدفع', failedBody: 'لم تُسجّل هذه المعاملة كدفعة مكتملة.', refunded: 'تم استرداد الدفعة', refundedBody: 'سُجّلت هذه المعاملة كدفعة مستردة.', amount: 'المبلغ', receipt: 'رقم الإيصال', campaign: 'الحملة', home: 'الرئيسية', account: 'حساب المتبرع' },
    en: { pending: 'Payment verification pending', pendingBody: 'We have not confirmed a payment yet. If you completed payment, check again shortly. Do not pay again while confirmation is pending.', success: 'Your donation is confirmed', successBody: 'The payment provider confirmed this transaction. Your donation details appear below.', failed: 'Payment was not completed', failedBody: 'This transaction has not been recorded as a completed payment.', refunded: 'Payment refunded', refundedBody: 'This transaction has been recorded as refunded.', amount: 'Amount', receipt: 'Receipt number', campaign: 'Campaign', home: 'Home', account: 'Donor account' },
    fr: { pending: 'Paiement en cours de vérification', pendingBody: 'Nous n’avons pas encore confirmé de paiement. Si vous avez payé, vérifiez à nouveau dans quelques instants. Ne payez pas une seconde fois pendant cette attente.', success: 'Votre don est confirmé', successBody: 'Le prestataire de paiement a confirmé cette opération. Les détails de votre don figurent ci-dessous.', failed: 'Le paiement n’a pas abouti', failedBody: 'Cette opération n’est pas enregistrée comme un paiement effectué.', refunded: 'Paiement remboursé', refundedBody: 'Cette opération est enregistrée comme remboursée.', amount: 'Montant', receipt: 'Numéro de reçu', campaign: 'Campagne', home: 'Accueil', account: 'Compte donateur' },
    tr: { pending: 'Ödeme doğrulanıyor', pendingBody: 'Henüz bir ödeme teyit edilmedi. Ödemeyi tamamladıysanız kısa bir süre sonra tekrar kontrol edin. Teyit beklerken yeniden ödeme yapmayın.', success: 'Bağışınız teyit edildi', successBody: 'Ödeme sağlayıcısı bu işlemi teyit etti. Bağış bilgileriniz aşağıdadır.', failed: 'Ödeme tamamlanmadı', failedBody: 'Bu işlem tamamlanmış bir ödeme olarak kaydedilmedi.', refunded: 'Ödeme iade edildi', refundedBody: 'Bu işlem iade edilmiş olarak kaydedildi.', amount: 'Tutar', receipt: 'Makbuz numarası', campaign: 'Kampanya', home: 'Ana sayfa', account: 'Bağışçı hesabı' },
};
export default async function DonateSuccessPage({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: { donation?: string } }) {
    const t = copy[locale as keyof typeof copy] || copy.tr;
    const id = searchParams.donation;
    let donation: any = null;
    if (id && /^[a-zA-Z0-9_-]{1,100}$/.test(id)) {
        const guestAccess = await hasDonationReturnAccess(id);
        const donor = guestAccess ? null : await getCurrentDonor();
        if (guestAccess || donor) {
            const db = getSupabaseOrNull();
            if (db) {
                let query = db.from('Donation').select('status, amount, currency, receiptNumber, campaignId, frequency, campaign:Campaign(title)').eq('id', id);
                if (!guestAccess) query = query.eq('donorEmail', donor!.email);
                const { data, error } = await query.maybeSingle();
                if (!error) donation = data;
            }
        }
    }
    const confirmed = donation?.status === 'COMPLETED';
    const failed = donation?.status === 'FAILED';
    const refunded = donation?.status === 'REFUNDED';
    const title = confirmed ? t.success : failed ? t.failed : refunded ? t.refunded : t.pending;
    const description = confirmed ? t.successBody : failed ? t.failedBody : refunded ? t.refundedBody : t.pendingBody;
    return <div className="min-h-[70vh] flex items-center justify-center bg-section-gradient px-6 py-16">
        <div className="bg-white rounded-2xl shadow-xl border border-line p-8 max-w-md text-center w-full">
            <h1 className="text-2xl font-bold mb-4">{title}</h1>
            <p className="text-muted leading-relaxed mb-6">{description}</p>
            {confirmed && <dl className="bg-brand/5 rounded-xl p-4 mb-6 space-y-3 text-start">
                <div><dt>{t.amount}</dt><dd className="font-bold">{new Intl.NumberFormat(locale, { style: 'currency', currency: donation.currency || 'USD' }).format(Number(donation.amount))}</dd></div>
                {donation.campaign?.title && <div><dt>{t.campaign}</dt><dd>{donation.campaign.title}</dd></div>}
                {donation.receiptNumber && <div><dt>{t.receipt}</dt><dd dir="ltr">{donation.receiptNumber}</dd></div>}
            </dl>}
            <PaymentResultActions locale={locale} pending={!confirmed && !failed && !refunded} confirmedItem={confirmed ? { campaignId: donation.campaignId, amount: Number(donation.amount), frequency: donation.frequency } : null}/>
            <div className="flex justify-center gap-5 mt-6"><Link href={`/${locale}`}>{t.home}</Link><Link href={`/${locale}/account`}>{t.account}</Link></div>
        </div>
    </div>;
}
