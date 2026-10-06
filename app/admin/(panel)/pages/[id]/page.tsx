import { mergeCmsTranslation } from "@/lib/cms-localization";
import PageEditor from "@/components/editor/PageEditor";
import { requireAdmin } from "@/lib/auth";
import { PageSection } from "@/lib/blocks";
import { prepareDestekolHomeSections } from "@/lib/destekol-homepage";
import { getSupabase } from "@/lib/supabase";
import { notFound,redirect } from "next/navigation";
export const revalidate = 0;
export default async function EditPagePage({ params, searchParams, }: {
    params: {
        id: string;
    };
    searchParams: {
        locale?: string;
    };
}) {
    try {
        await requireAdmin();
    }
    catch {
        redirect("/admin/login");
    }
    const supabase = getSupabase();
    const VALID_LOCALES = ["ar", "en", "fr", "tr"];
    const rawLocale = searchParams.locale;
    const locale = rawLocale && VALID_LOCALES.includes(rawLocale) ? rawLocale : "ar";
    const { data: page } = await supabase
        .from("Page").select("*").eq("id", params.id).maybeSingle();
    if (!page)
        notFound();
    const isDestekol = true;
    let editPage = { ...page };
    let editTitle = page.title;
    let editSections = (page.sections as unknown as PageSection[]) || [];
    let editBody = page.body || "";
    let editBody2 = page.body2 || "";
    let editVideoUrl = page.videoUrl || "";
    let hasTranslation = false;
    if (locale !== "ar") {
        const { data: trans } = await supabase
            .from("PageTranslation")
            .select("*")
            .eq("pageId", page.id)
            .eq("locale", locale)
            .maybeSingle();
        if (trans) {
            for (const key of ["description", "body", "body2", "body3", "coverImage", "secondaryImage", "gallery", "videoUrl"]) {
                if (trans[key] !== null && trans[key] !== undefined)
                    editPage[key] = trans[key];
            }
            editTitle = trans.title || editTitle;
            editSections = mergeCmsTranslation(editSections, trans.sections);
            editBody = trans.body || editBody;
            editBody2 = trans.body2 || editBody2;
            editVideoUrl = trans.videoUrl || editVideoUrl;
            hasTranslation = true;
        }
    }
    const originalSections = editSections;
    const initialChangesPending = page.slug === "home"
        && JSON.stringify(originalSections) !== JSON.stringify(editSections)
        && (locale === "ar" || hasTranslation);
    return (<PageEditor isDestekol={isDestekol} page={{
            id: page.id,
            title: editTitle,
            slug: page.slug,
            description: editPage.description || "",
            body: editPage.body || "",
            body2: editPage.body2 || "",
            body3: editPage.body3 || "",
            coverImage: editPage.coverImage || null,
            secondaryImage: editPage.secondaryImage || null,
            gallery: Array.isArray(editPage.gallery) ? editPage.gallery : [],
            videoUrl: editPage.videoUrl || "",
            isPublished: page.isPublished,
            showInMenu: page.showInMenu,
            isSystem: page.isSystem,
            sections: editSections,
        }} locale={locale} isTranslation={locale !== "ar"} hasExistingTranslation={hasTranslation} initialChangesPending={initialChangesPending}/>);
}
