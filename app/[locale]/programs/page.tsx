import { getMarketingPage } from "@/lib/marketing-pages";
import MarketingPrograms from "@/components/site/MarketingPrograms";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const page = await getMarketingPage("programs", locale);
  return { title: page?.title || "Programs", description: page?.description,
    alternates: { canonical: `https://destekol.org/${locale}/programs`, languages: Object.fromEntries(
      ["ar", "en", "fr", "tr"].map(code => [code, `https://destekol.org/${code}/programs`])) } };
}
export default async function ProgramsPage({ params: { locale } }: { params: { locale: string } }) {
  const page = await getMarketingPage("programs", locale);
  if (!page) notFound();
  return <MarketingPrograms locale={locale} content={page.content} />;
}
