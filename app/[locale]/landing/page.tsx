import { getMarketingPage } from "@/lib/marketing-pages";
import MarketingLanding from "@/components/site/MarketingLanding";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const page = await getMarketingPage("landing", locale);
  return { title: page?.title || "Destek Ol", description: page?.description,
    alternates: { canonical: `https://destekol.org/${locale}/landing`, languages: {
      ar: "https://destekol.org/ar/landing", en: "https://destekol.org/en/landing" } } };
}
export default async function LandingPage({ params: { locale } }: { params: { locale: string } }) {
  if (!["ar", "en"].includes(locale)) notFound();
  const page = await getMarketingPage("landing", locale);
  if (!page) notFound();
  return <MarketingLanding locale={locale} content={page.content} />;
}
