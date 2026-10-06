export const LOCALES = ["ar", "en", "fr", "tr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_NAMES: Record<Locale, string> = {
    ar: "العربية", en: "English", fr: "Français", tr: "Türkçe",
};
export const LOCALE_DIR: Record<Locale, "rtl" | "ltr"> = {
    ar: "rtl", en: "ltr", fr: "ltr", tr: "ltr",
};
