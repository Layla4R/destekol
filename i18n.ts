// Re-export from lib/i18n for backward compat
export { LOCALES, DEFAULT_LOCALE, LOCALE_NAMES, LOCALE_DIR } from "./lib/locales";
export type { Locale } from "./lib/locales";

// Flags
export const LOCALE_FLAGS: Record<string, string> = {
  ar: "ar", en: "en", fr: "fr", tr: "tr",
};
