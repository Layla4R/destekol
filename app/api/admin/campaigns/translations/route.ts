import { requireRoutePermission, accessErrorResponse } from "@/lib/admin-access";
import { getSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { NextRequest,NextResponse } from "next/server";
export async function GET(req: NextRequest) {
    try {
        await requireRoutePermission(req);
    }
    catch(error) { return accessErrorResponse(error); }
    const url = new URL(req.url);
    const campaignId = url.searchParams.get("campaignId");
    const locale = url.searchParams.get("locale");
    if (!campaignId || !locale)
        return NextResponse.json({ error: "Missing params" }, { status: 400 });
    const supabase = getSupabase();
    const { data } = await supabase.from("CampaignTranslation").select("*").eq("campaignId", campaignId).eq("locale", locale).maybeSingle();
    return NextResponse.json({ translation: data || null });
}
export async function POST(req: NextRequest) {
    try {
        await requireRoutePermission(req);
    }
    catch(error) { return accessErrorResponse(error); }
    const { campaignId, locale, title, summary, description, authorName, authorRole } = await req.json();
    if (!campaignId || !locale || !title)
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const supabase = getSupabase();
    const { data, error } = await supabase.from("CampaignTranslation").upsert({ campaignId, locale, title, summary: summary || "", description: description || "",
        ...(authorName !== undefined ? { authorName } : {}),
        ...(authorRole !== undefined ? { authorRole } : {}),
        updatedAt: new Date().toISOString() }, { onConflict: "campaignId,locale" }).select("*").single();
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath("/[locale]/campaigns/[slug]", "page");
    return NextResponse.json({ translation: data });
}
export async function DELETE(req: NextRequest) {
    try {
        await requireRoutePermission(req);
    }
    catch(error) { return accessErrorResponse(error); }
    const { campaignId, locale } = await req.json();
    const supabase = getSupabase();
    await supabase.from("CampaignTranslation").delete().eq("campaignId", campaignId).eq("locale", locale);
    return NextResponse.json({ ok: true });
}
