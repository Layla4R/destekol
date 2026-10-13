import type { KitLinkId, KitLocale } from "@/lib/kit-config";

type KitCopy = {
    title: string;
    pageHeading: string;
    description: string;
    heroTitle: string;
    heroSubtitle: string;
    organization: string;
    tagline: string;
    languageLabel: string;
    linksLabel: string;
    comingSoon: string;
    newTab: string;
    footer: string;
    noLinks: string;
    links: Record<KitLinkId, string>;
};

export const KIT_COPY: Record<KitLocale, KitCopy> = {
    en: {
        title: "Marketing Kit for Visits | Destekol",
        pageHeading: "Marketing Kit for Visits",
        description: "Destekol’s official marketing, humanitarian project and partnership materials. One permanent link in English, Turkish and Arabic.",
        heroTitle: "Making a Lasting Impact",
        heroSubtitle: "Humanitarian Action\nfor a More Sustainable World",
        organization: "Non-Profit NGO | Humanitarian & Development",
        tagline: "Making a Lasting Impact",
        languageLabel: "Choose your language",
        linksLabel: "Marketing and partnership resources",
        comingSoon: "Coming soon",
        newTab: "opens in a new tab",
        footer: "One fixed link for all languages",
        noLinks: "Resources will be added here soon.",
        links: {
            visits: "Marketing Kit for Visits",
            brochure: "Organization Brochure",
            portfolio: "Programs & Projects Portfolio",
            sustainability: "Sustainability Report",
            video: "Promotional Video",
            partnerships: "Partnership Opportunities",
            contact: "Contact Us",
        },
    },
    tr: {
        title: "Kurumsal Ziyaretler İçin Tanıtım Kiti | Destekol",
        pageHeading: "Kurumsal Ziyaretler İçin Tanıtım Kiti",
        description: "Destekol’un resmî tanıtım, insani yardım projeleri ve iş birliği materyalleri. İngilizce, Türkçe ve Arapça için tek kalıcı bağlantı.",
        heroTitle: "Hayata Kalıcı Bir Etki",
        heroSubtitle: "Daha Sürdürülebilir Bir Dünya\nİçin İnsani Yardım",
        organization: "Kâr Amacı Gütmeyen STK | İnsani Yardım ve Kalkınma",
        tagline: "Hayata Kalıcı Bir Etki",
        languageLabel: "Dilinizi seçin",
        linksLabel: "Tanıtım ve iş birliği kaynakları",
        comingSoon: "Yakında",
        newTab: "yeni sekmede açılır",
        footer: "Tüm diller için tek kalıcı bağlantı",
        noLinks: "Kaynaklar yakında buraya eklenecek.",
        links: {
            visits: "Kurumsal Ziyaretler İçin Tanıtım Kiti",
            brochure: "Kurumsal Tanıtım Broşürü",
            portfolio: "Program ve Proje Portföyü",
            sustainability: "Sürdürülebilirlik Raporu",
            video: "Tanıtım Videosu",
            partnerships: "İş Birliği Fırsatları",
            contact: "Bize Ulaşın",
        },
    },
    ar: {
        title: "حقيبة التسويق للزيارات | Destekol",
        pageHeading: "حقيبة التسويق للزيارات",
        description: "المواد الرسمية للتعريف بدستك أول ومشاريعها الإنسانية وفرص الشراكة. رابط دائم واحد بالإنجليزية والتركية والعربية.",
        heroTitle: "أثرٌ للحياة",
        heroSubtitle: "عمل إنساني\nمن أجل عالم أكثر استدامة",
        organization: "منظمة غير ربحية | العمل الإنساني والتنمية",
        tagline: "أثرٌ للحياة",
        languageLabel: "اختر لغتك",
        linksLabel: "مواد التعريف والتسويق والشراكة",
        comingSoon: "قريبًا",
        newTab: "يفتح في علامة تبويب جديدة",
        footer: "رابط ثابت واحد لجميع اللغات",
        noLinks: "ستُضاف الروابط هنا قريبًا.",
        links: {
            visits: "حقيبة التسويق للزيارات",
            brochure: "الكتيّب التعريفي بالمنظمة",
            portfolio: "ملف البرامج والمشاريع",
            sustainability: "تقرير الاستدامة",
            video: "الفيديو التعريفي",
            partnerships: "فرص الشراكة",
            contact: "تواصل معنا",
        },
    },
};
