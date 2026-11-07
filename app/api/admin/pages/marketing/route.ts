import { requireRoutePermission, accessErrorResponse } from "@/lib/admin-access";
import { getSupabase } from "@/lib/supabase";
import { MARKETING_SLUGS } from "@/lib/marketing-pages";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

const locales = ["ar", "en", "fr", "tr"];
function valid(slug: unknown, locale: unknown) {
  return MARKETING_SLUGS.includes(slug as any) && locales.includes(String(locale)) && (slug !== "landing" || ["ar", "en"].includes(String(locale)));
}
export async function GET(req: NextRequest) {
  try { await requireRoutePermission(req); } catch (error) { return accessErrorResponse(error); }
  const slug = req.nextUrl.searchParams.get("slug");
  const locale = req.nextUrl.searchParams.get("locale");
  if (!valid(slug, locale)) return NextResponse.json({ error: "Invalid page or language" }, { status: 400 });
  const db = getSupabase();
  const { data: page, error } = await db.from("Page").select("id,title,description,sections,isPublished")
    .eq("slug", slug).maybeSingle();
  if (error || !page) return NextResponse.json({ error: "Page not found" }, { status: 404 });
  const { data: translation } = locale === "ar" ? { data: null } : await db.from("PageTranslation")
    .select("title,description,sections").eq("pageId", page.id).eq("locale", locale).maybeSingle();
  const row = translation || page;
  return NextResponse.json({ title: row.title, description: row.description || "", content: row.sections?.[0]?.props || {}, isPublished: page.isPublished });
}
export async function PUT(req: NextRequest) {
  try { await requireRoutePermission(req); } catch (error) { return accessErrorResponse(error); }
  const { slug, locale, title, description, content, isPublished } = await req.json();
  if (!valid(slug, locale) || typeof title !== "string" || !title.trim() || typeof description !== "string" ||
    !content || typeof content !== "object" || Array.isArray(content) || JSON.stringify(content).length > 50000) {
    return NextResponse.json({ error: "Invalid page data" }, { status: 400 });
  }
  const db = getSupabase();
  const { data: page, error: readError } = await db.from("Page").select("id").eq("slug", slug).maybeSingle();
  if (readError || !page) return NextResponse.json({ error: "Page not found" }, { status: 404 });
  const sections = [{ id: `${slug}-content`, type: "marketing", props: content }];
  const update = locale === "ar"
    ? db.from("Page").update({ title: title.trim(), description, sections, isPublished: Boolean(isPublished), updatedAt: new Date().toISOString() }).eq("id", page.id)
    : db.from("PageTranslation").upsert({ pageId: page.id, locale, title: title.trim(), description, sections, updatedAt: new Date().toISOString() }, { onConflict: "pageId,locale" });
  const { error } = await update;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath(`/${locale}/${slug}`);
  return NextResponse.json({ ok: true });
}
