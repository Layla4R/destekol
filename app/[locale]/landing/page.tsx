import { getMarketingPage, landingPublicSlug } from "@/lib/marketing-pages";
import MarketingLanding from "@/components/site/MarketingLanding";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const page = await getMarketingPage("landing", locale);
  const publicSlug = landingPublicSlug(page?.content || {});
  const otherLocale = locale === "ar" ? "en" : "ar";
  const otherPage = await getMarketingPage("landing", otherLocale);
  return { title: page?.title || "Destek Ol", description: page?.description,
    alternates: { canonical: `https://destekol.org/${locale}/${encodeURIComponent(publicSlug)}`, languages: {
      [locale]: `https://destekol.org/${locale}/${encodeURIComponent(publicSlug)}`,
      [otherLocale]: `https://destekol.org/${otherLocale}/${encodeURIComponent(landingPublicSlug(otherPage?.content || {}))}`,
    } } };
}
export default async function LandingPage({ params: { locale } }: { params: { locale: string } }) {
  if (!["ar", "en"].includes(locale)) notFound();
  const page = await getMarketingPage("landing", locale);
  if (!page) notFound();
  return <MarketingLanding locale={locale} content={page.content} />;
}
