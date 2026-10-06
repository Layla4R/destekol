import { IconName } from "@/components/icons";
export interface CategoryMeta {
    label: string;
    icon: IconName;
}
export const CAMPAIGN_CATEGORIES: Record<string, {
    labels: Record<string, string>;
    icon: IconName;
}> = {
    food: {
        labels: { ar: "غذاء", en: "Food", tr: "Gıda", fr: "Nourriture" },
        icon: "utensils",
    },
    medical: {
        labels: { ar: "طبي", en: "Medical", tr: "Tıbbi", fr: "Médical" },
        icon: "cross",
    },
    shelter: {
        labels: { ar: "مأوى", en: "Shelter", tr: "Barınak", fr: "Abri" },
        icon: "home",
    },
    education: {
        labels: { ar: "تعليم", en: "Education", tr: "Eğitim", fr: "Éducation" },
        icon: "book-open",
    },
    water: {
        labels: { ar: "مياه", en: "Water", tr: "Su", fr: "Eau" },
        icon: "droplet",
    },
    general: {
        labels: { ar: "عام", en: "General", tr: "Genel", fr: "Général" },
        icon: "hand-heart",
    },
};
export function categoryMeta(category?: string | null, locale: string = "ar"): CategoryMeta {
    const cleanKey = (category || "general").toLowerCase().trim();
    const cat = CAMPAIGN_CATEGORIES[cleanKey] || CAMPAIGN_CATEGORIES.general;
    const label = cat.labels[locale] || cat.labels["en"] || cat.labels.ar;
    return {
        label,
        icon: cat.icon,
    };
}
