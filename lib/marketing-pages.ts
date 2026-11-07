import { getSupabaseOrNull } from "@/lib/supabase";
import { cache } from "react";

export const BROCHURE_URL = "https://drive.google.com/file/d/1RuGI5Xv0cBTckfHmc-0t96GZH4eV4Tr7/view";
export const MARKETING_SLUGS = ["landing", "programs"] as const;
export type MarketingSlug = (typeof MARKETING_SLUGS)[number];
export type MarketingProgram = { id: string; title: string; description: string; icon: string };
export type MarketingContent = {
  eyebrow?: string; heading?: string; subheading?: string; description?: string;
  aboutEyebrow?: string; aboutHeading?: string; aboutText?: string;
  visionHeading?: string; visionText?: string; programsHeading?: string; programsText?: string;
  primaryLabel?: string; secondaryLabel?: string; allProgramsLabel?: string;
  contactLabel?: string; brochureLabel?: string; ctaHeading?: string; ctaText?: string;
  heroImage?: string; aboutImage?: string; logoImage?: string;
  programImageOne?: string; programImageTwo?: string;
  publicSlug?: string;
  values?: { id: string; title: string; description: string; icon: string }[];
  programs?: MarketingProgram[];
};

export async function getMarketingPage(slug: MarketingSlug, locale: string) {
  const db = getSupabaseOrNull();
  if (!db) return null;
  const { data: page, error } = await db.from("Page")
    .select("id,slug,title,description,sections,isPublished")
    .eq("slug", slug).eq("isPublished", true).maybeSingle();
  if (error || !page) return null;
  let title = page.title as string;
  let description = (page.description || "") as string;
  let content = (page.sections?.[0]?.props || {}) as MarketingContent;
  if (locale !== "ar") {
    const { data: translated } = await db.from("PageTranslation")
      .select("title,description,sections").eq("pageId", page.id).eq("locale", locale).maybeSingle();
    if (translated) {
      title = translated.title || title;
      description = translated.description || description;
      content = { ...content, ...(translated.sections?.[0]?.props || {}) };
      if (slug === "landing" && !translated.sections?.[0]?.props?.publicSlug) content.publicSlug = "landing";
    }
    if (!translated && slug === "landing") content.publicSlug = "landing";
  }
  return { title, description, content };
}

export function landingPublicSlug(content: MarketingContent): string {
  return content.publicSlug?.trim().replace(/\s+/g, " ").normalize("NFC") || "landing";
}

export const getLandingAlias = cache(async (slug: string, locale: string) => {
  if (!["ar", "en"].includes(locale) || slug === "landing") return null;
  const page = await getMarketingPage("landing", locale);
  if (!page) return null;
  let requested = slug;
  try { requested = decodeURIComponent(slug); } catch { return null; }
  return requested.normalize("NFC") === landingPublicSlug(page.content) ? page : null;
});
