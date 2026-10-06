import { policies } from './current-policies';
const titles: Record<string, string[]> = {
    "ar": [
        "سياسة الخصوصية وحماية البيانات",
        "شروط استخدام الموقع",
        "سياسة التبرعات والاسترداد",
        "سياسة ملفات الارتباط",
        "مكافحة غسل الأموال",
        "الشكاوى والتواصل الرسمي",
        "الشفافية المالية والتقارير",
        "كيفية استخدام التبرعات",
        "حقوق المحتوى والمعلومات الرسمية"
    ],
    "en": [
        "Privacy and data protection policy",
        "Website terms of use",
        "Donation and refund policy",
        "Cookie policy",
        "Anti-Money Laundering Policy",
        "Complaints and official contact",
        "Financial transparency and reports",
        "How donations are used",
        "Content rights and official information"
    ],
    "fr": [
        "Confidentialité et protection des données",
        "Conditions d’utilisation du site",
        "Politique de dons et de remboursement",
        "Politique de cookies",
        "Lutte contre le blanchiment",
        "Réclamations et contact officiel",
        "Transparence financière et rapports",
        "Utilisation des dons",
        "Droits des contenus et informations officielles"
    ],
    "tr": [
        "Gizlilik ve veri koruma politikası",
        "Site kullanım koşulları",
        "Bağış ve iade politikası",
        "Çerez politikası",
        "Kara Para Aklamayla Mücadele",
        "Şikâyetler ve resmî iletişim",
        "Mali şeffaflık ve raporlar",
        "Bağışların kullanımı",
        "İçerik hakları ve resmî bilgiler"
    ]
};
const slugs = ['privacy', 'terms', 'refund-policy', 'cookie-policy', 'aml-policy', 'complaints', 'financial-transparency', 'how-we-use-donations', 'license'];
export function getPolicyMetadata(slug: string, locale: string) {
    ;
    const language = titles[locale] ? locale : 'ar';
    const title = titles[language][slugs.indexOf(slug)] || slug;
    if (slug === 'aml-policy') {
        const descriptions: Record<string, string> = {
            ar: 'نطبق ضوابط للحد من غسل الأموال وتمويل الإرهاب والاحتيال.',
            en: 'Our safeguards help prevent money laundering, terrorist financing and fraud.',
            fr: 'Nos mesures préviennent le blanchiment d’argent, le financement du terrorisme et la fraude.',
            tr: 'Önlemlerimiz kara para aklama, terörün finansmanı ve dolandırıcılığı önlemeyi amaçlar.',
        };
        return { title, description: descriptions[language] };
    }
    const introduction = policies[language][slug]?.[0].text || '';
    return { title, description: title + ': ' + introduction.split(/[.!؟]/)[0] + '.' };
}
