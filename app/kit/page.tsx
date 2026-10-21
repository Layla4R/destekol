import type { Metadata } from "next";
import { cookies } from "next/headers";
import KitPage from "@/components/kit/KitPage";
import { getKitLocale, KIT_URL, LANGUAGE_COOKIE } from "@/lib/kit-config";
import { KIT_COPY } from "@/lib/kit-copy";
import { readPublicKitResources } from "@/lib/kit-settings";

function preferredLocale() {
    return getKitLocale(cookies().get(LANGUAGE_COOKIE)?.value);
}

export function generateMetadata(): Metadata {
    const locale = preferredLocale();
    const copy = KIT_COPY[locale];
    return {
        title: { absolute: copy.title },
        description: copy.description,
        alternates: {
            canonical: KIT_URL,
            languages: { en: KIT_URL, tr: KIT_URL, ar: KIT_URL, "x-default": KIT_URL },
        },
        openGraph: {
            title: copy.title,
            description: copy.description,
            url: KIT_URL,
            type: "website",
            siteName: "Destekol",
            locale: { en: "en_US", tr: "tr_TR", ar: "ar_AR" }[locale],
            alternateLocale: ["en_US", "tr_TR", "ar_AR"].filter(value => value !== { en: "en_US", tr: "tr_TR", ar: "ar_AR" }[locale]),
            images: [{ url: "/brand/destekol-legal-logo-v5.png", width: 1774, height: 887, alt: "Destekol" }],
        },
        twitter: {
            card: "summary_large_image",
            title: copy.title,
            description: copy.description,
            images: ["/brand/destekol-legal-logo-v5.png"],
        },
    };
}

export default async function DigitalMarketingKitPage() {
    return <KitPage initialLocale={preferredLocale()} resources={await readPublicKitResources()} />;
}
