export const OFFICIAL_EMAIL = "info@destekol.org";
export const OFFICIAL_PHONE = "";
export const OFFICIAL_WHATSAPP_URL = "";
// Public editorial content only. Never use this on account/customer records.
export const DESTEKOL_EMAIL = "info@destekol.org";
export const DESTEKOL_ADDRESS = "TAŞDELEN MAH. BUKET SOKAK DIŞKAPI NO: 1-3, İÇKAPI NO: 38, ÇEKMEKÖY / İSTANBUL, TÜRKİYE";
export const DESTEKOL_LEGAL_NAME = 'DESTEK OL İNSANİ YARDIM VE KALKINDIRMA DERNEĞİ';
// Previously published association registration number (also recorded in public/llms.txt).
export const DESTEKOL_REGISTRATION_NUMBER = '34-283-182';
export const DESTEKOL_VERIFICATION_URL = 'https://derbis.dernekler.gov.tr/default/anonymous/faaliyet-belgesi-dogrulama-anonim';
export const officialEmail = (isDestekol: boolean) => DESTEKOL_EMAIL;
export function normalizePublicContact<T>(value: T, email = OFFICIAL_EMAIL): T {
    if (typeof value === "string") {
        let text = value.replace(/[a-z0-9._%+-]+@(?:destekol)\.org/gi, email);
                return text as T;
    }
    if (Array.isArray(value))
        return value.map(item => normalizePublicContact(item, email)) as T;
    if (value && typeof value === "object")
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizePublicContact(item, email)])) as T;
    return value;
}
export const launchCopy: Record<string, {
    status: string;
    contact: string;
    response: string;
}> = {
    ar: { status: "قنوات التبرع لم تُفتح بعد. سنعلن بدء استقبال التبرعات عند جاهزيتها.", contact: "البريد الرسمي الوحيد لجميع الاستفسارات هو info@destekol.org. يرجى توضيح موضوع الرسالة، مثل شكوى أو خصوصية أو شراكة.", response: "نرد على الرسائل الواردة إلى info@destekol.org خلال 24 ساعة. قد تتطلب معالجة الطلب أو حله وقتاً إضافياً بحسب طبيعته." },
    en: { status: "Donation channels are not open yet. We will announce when donations can be accepted.", contact: "Our only official email for all enquiries is info@destekol.org. Please state the topic in the subject, such as a complaint, privacy or a partnership.", response: "We reply to messages sent to info@destekol.org within 24 hours. Reviewing or resolving a request may take longer depending on its nature." },
    fr: { status: "Les canaux de dons ne sont pas encore ouverts. Leur ouverture sera annoncée lorsqu’ils seront prêts.", contact: "Notre seule adresse officielle pour toutes les demandes est info@destekol.org. Précisez le sujet : réclamation, confidentialité ou partenariat, par exemple.", response: "Nous répondons aux messages envoyés à info@destekol.org sous 24 heures. Le traitement ou la résolution peut demander davantage de temps selon la demande." },
    tr: { status: "Bağış kanalları henüz açılmadı. Bağış kabulüne hazır olduğumuzda duyuru yapacağız.", contact: "Tüm sorular için tek resmî e-posta adresimiz info@destekol.org. Konu satırında şikâyet, gizlilik veya ortaklık gibi talebinizi belirtin.", response: "info@destekol.org adresine gelen mesajlara 24 saat içinde yanıt veriyoruz. Talebin incelenmesi veya çözülmesi, niteliğine göre daha uzun sürebilir." },
};
