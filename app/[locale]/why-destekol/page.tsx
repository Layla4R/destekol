import BlockRenderer from "@/components/blocks/BlockRenderer";
import { getPageBySlug } from "@/lib/pageData";
import { loadTranslations } from "@/lib/i18n";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 0;
type Props = { params: { locale: string } };
export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
    const page = await getPageBySlug("why-destekol", locale);
    return { title: page?.title || "", description: page?.description || "" };
}
export default async function WhyDestekolPage({ params: { locale } }: Props) {
    const [page, dict] = await Promise.all([getPageBySlug("why-destekol", locale), loadTranslations(locale)]);
    if (!page) notFound();
    return <main>{page.sections.map(section => <BlockRenderer key={section.id} section={section} context={{ locale, dict, isDestekol: true }}/>)}</main>;
}
