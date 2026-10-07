import { getCmsBranding } from "@/lib/cms-branding";
import { headers } from "next/headers";
// HTML and settings depend on the request domain.
export const dynamic = "force-dynamic";
import { getSupabaseOrNull } from "@/lib/supabase";
import type { Metadata,Viewport } from "next";
import { Alexandria,Cairo,Tajawal } from "next/font/google";

import "./globals.css";
const alexandria = Alexandria({
    subsets: ["arabic", "latin"],
    display: "swap",
    variable: "--font-display",
});
const tajawal = Tajawal({
    weight: ["400", "500", "700", "800"],
    subsets: ["arabic", "latin"],
    display: "swap",
    variable: "--font-sans",
});
const cairo = Cairo({
    subsets: ["arabic", "latin"],
    display: "swap",
    variable: "--font-cairo",
});
const SITE_URL = "https://destekol.org";
export const viewport: Viewport = {
    themeColor: "#0069D2",
};
export async function generateMetadata(): Promise<Metadata> {
    const branding = await getCmsBranding();
    const isDestekol = true;
    const siteUrl = "https://destekol.org";
    const name = branding.logoText || branding.siteName || "";
    const fullName = branding.siteName || name;
    const description = branding.footerDescription || "";
    return {
        metadataBase: new URL(siteUrl),
        applicationName: name,
        other: { google: "notranslate" },
        manifest: "/site.webmanifest",
        icons: {
            icon: { url: "/brand/destekol-mark-v4.png", type: "image/png", sizes: "256x256" },
            shortcut: "/brand/destekol-mark-v4.png",
            apple: "/brand/destekol-mark-v4.png",
        },
        title: { default: fullName, template: `%s | ${name}` },
        description,
        keywords: [name, "humanitarian aid", "humanitarian foundation", "donations", "charity", "relief campaigns", "emergency aid", "humanitarian donations", "humanitarian crowdfunding"],
        authors: [{ name: fullName, url: siteUrl }],
        creator: fullName,
        publisher: fullName,
        alternates: {
            canonical: siteUrl,
            languages: { ar: `${siteUrl}/ar`, en: `${siteUrl}/en`, tr: `${siteUrl}/tr` },
        },
        openGraph: {
            type: "website",
            url: siteUrl,
            siteName: name,
            title: fullName,
            description,
            locale: "ar",
            alternateLocale: ["en", "tr"],
        },
        twitter: {
            card: "summary_large_image",
            title: fullName,
            description,
        },
        robots: {
            index: true,
            follow: true,
            googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
        },
        category: "Humanitarian Organization",
    };
}
export default async function RootLayout({ children, }: {
    children: React.ReactNode;
}) {


    const supabase = getSupabaseOrNull();
    const settings = supabase
        ? (await supabase
            .from("SiteSettings")
            .select(`
            siteName, logoText, logoImage, footerDescription, contactEmail,
            primaryColor,
            accentColor,
            facebookUrl,
            twitterUrl,
            instagramUrl,
            youtubeUrl,
            linkedinUrl
          `)
            .eq("id", "default")
            .maybeSingle()).data
        : null;
    const isDestekol = true;
    const siteUrl = "https://destekol.org";
    const primaryColor = settings?.primaryColor || ("#066090");
    const accentColor = settings?.accentColor || ("#D9A750");
    const sameAsLinks = [
        settings?.facebookUrl,
        settings?.twitterUrl,
        settings?.instagramUrl,
        settings?.youtubeUrl,
        settings?.linkedinUrl,
    ].filter((url): url is string => Boolean(url));
    /*
     * Main Entity IDs
     */
    const organizationId = `${siteUrl}/#organization`;
    const websiteId = `${siteUrl}/#website`;
    /*
     * Complete semantic graph
     */
    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [{ "@type": "Organization", "@id": organizationId, url: siteUrl,
            name: settings?.siteName || settings?.logoText || "", description: settings?.footerDescription || "",
            ...(settings?.logoImage ? { logo: new URL(settings.logoImage, siteUrl).toString() } : {}),
            ...(settings?.contactEmail ? { email: settings.contactEmail } : {}), sameAs: sameAsLinks,
        }, { "@type": "WebSite", "@id": websiteId, url: siteUrl,
            name: settings?.siteName || settings?.logoText || "", publisher: { "@id": organizationId },
        }],
    };
    const requestedLocale = headers().get("x-app-locale");
    const locale = requestedLocale && ["ar", "en", "fr", "tr"].includes(requestedLocale) ? requestedLocale : "tr";
    return (<html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} translate="no" suppressHydrationWarning className={`
        ${alexandria.variable}
        ${tajawal.variable}
        ${cairo.variable}
      `}>
      <head>
        <Script id="organization-schema" type="application/ld+json" strategy="beforeInteractive" dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}/>

        <style dangerouslySetInnerHTML={{
            __html: `
              :root {
                --brand: ${primaryColor};
                --accent: ${accentColor};
                ${`
                --destekol-brand: var(--brand);
                --destekol-accent: var(--accent);
                --color-brand: var(--brand);
                --color-accent: var(--accent);
                --brand-dark: color-mix(in srgb, var(--brand) 75%, #063962);
                --brand-light: color-mix(in srgb, var(--brand) 75%, white);
                --accent-dark: color-mix(in srgb, var(--accent) 75%, #C79239);
                --accent-light: color-mix(in srgb, var(--accent) 85%, white);
                --destekol-brand-dark: var(--brand-dark);
                --destekol-accent-light: var(--accent-light);
                --destekol-accent-gradient: linear-gradient(135deg, var(--accent), var(--accent-light));
                `}
              }
            `,
        }}/>
      </head>

      <body data-site={"destekol"} className="font-sans min-h-screen antialiased bg-cream text-ink">
        {children}

      </body>
    </html>);
}
import Script from 'next/script';
