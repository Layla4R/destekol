import tr from '../data/policies/tr.json';
import ar from '../data/policies/ar';
import en from '../data/policies/en';
import fr from '../data/policies/fr';
import { beneficiaryMediaPolicies, beneficiaryMediaPrivacyReferences } from '../data/policies/beneficiary-media';

export type PolicySection = { title: string; text: string };
export const POLICY_UPDATED_AT = '2026-10-08';

const paymentClarifications: Record<string, { refund: PolicySection; terms: PolicySection }> = {
    tr: {
        refund: { title: '9. PayTR üzerinden yapılan işlemler', text: 'PayTR etkinleştirildiğinde, onaylanan iptal veya iadeler ilgili işlem üzerinden PayTR aracılığıyla yürütülür. İadenin karta yansıma süresi bankaya ve kart türüne bağlıdır; talebin alınması veya onaylanması, tutarın karta yansıdığı anlamına gelmez.' },
        terms: { title: '9. PayTR ödeme teyidi', text: 'PayTR etkinleştirildiğinde ödeme sonucu, PayTR tarafından siteye iletilen ve doğrulanan işlem bildirimiyle teyit edilir. Yalnızca dönüş veya başarı sayfasının açılması, ödemenin kesinleştiğini göstermez. İşlem referansınızı saklayın.' },
    },
    ar: {
        refund: { title: '9. المعاملات عبر PayTR', text: 'عند تفعيل PayTR، تُنفذ عمليات الإلغاء أو الاسترداد المعتمدة عبر PayTR بالارتباط بالمعاملة المعنية. تعتمد مدة ظهور المبلغ في البطاقة على البنك ونوع البطاقة؛ واستلام الطلب أو الموافقة عليه لا يعني أن المبلغ ظهر في البطاقة.' },
        terms: { title: '9. تأكيد الدفع عبر PayTR', text: 'عند تفعيل PayTR، تُؤكد نتيجة الدفع بواسطة إشعار المعاملة الذي يرسله PayTR إلى الموقع ويُتحقق منه. فتح صفحة العودة أو النجاح وحده لا يدل على اكتمال الدفع نهائيًا. احتفظ بمرجع المعاملة.' },
    },
    en: {
        refund: { title: '9. Transactions through PayTR', text: 'When PayTR is enabled, approved cancellations or refunds are processed through PayTR against the relevant transaction. Card crediting times depend on the bank and card type; receiving or approving a request does not mean the card has been credited.' },
        terms: { title: '9. PayTR payment confirmation', text: 'When PayTR is enabled, payment results are confirmed through the transaction notification sent by PayTR to the site and verified. Opening a return or success page alone does not establish final payment completion. Keep your transaction reference.' },
    },
    fr: {
        refund: { title: '9. Opérations via PayTR', text: 'Lorsque PayTR est activé, les annulations ou remboursements approuvés sont effectués via PayTR pour l’opération concernée. Le délai de crédit de la carte dépend de la banque et du type de carte ; recevoir ou approuver une demande ne signifie pas que la carte a été créditée.' },
        terms: { title: '9. Confirmation du paiement PayTR', text: 'Lorsque PayTR est activé, le résultat du paiement est confirmé par la notification de l’opération envoyée au site par PayTR et vérifiée. L’ouverture d’une page de retour ou de réussite ne suffit pas à établir la finalisation du paiement. Conservez votre référence d’opération.' },
    },
};

export const policies: Record<string, Record<string, PolicySection[]>> = Object.fromEntries(
    Object.entries({ tr, ar, en, fr }).map(([locale, documents]) => [locale, {
        ...documents,
        kvkk: [...documents.kvkk, beneficiaryMediaPolicies[locale as keyof typeof beneficiaryMediaPolicies]],
        privacy: [...documents.privacy, beneficiaryMediaPrivacyReferences[locale as keyof typeof beneficiaryMediaPrivacyReferences]],
        'refund-policy': [...documents['refund-policy'], paymentClarifications[locale].refund],
        terms: [...documents.terms, paymentClarifications[locale].terms],
        // Preserve both existing URLs for the complete combined policy.
        'how-we-use-donations': documents['financial-transparency'],
    }]),
);
export const LEGAL_SLUGS = Object.keys(policies.tr);
