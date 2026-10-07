import { requireRoutePermission, accessErrorResponse } from "@/lib/admin-access";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function GET(req: NextRequest) {
    try {
        await requireRoutePermission(req);
    }
    catch(error) { return accessErrorResponse(error); }
    const url = new URL(req.url);
    const postId = url.searchParams.get("postId");
    const locale = url.searchParams.get("locale");
    if (!postId || !locale)
        return NextResponse.json({ error: "Missing params" }, { status: 400 });
    const supabase = getSupabase();
    const { data } = await supabase.from("NewsPostTranslation").select("*").eq("postId", postId).eq("locale", locale).maybeSingle();
    return NextResponse.json({ translation: data || null });
}
export async function POST(req: NextRequest) {
    try {
        await requireRoutePermission(req);
    }
    catch(error) { return accessErrorResponse(error); }
    const { postId, locale, title, excerpt, body, body2, videoUrl } = await req.json();
    if (!postId || !locale || !title)
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const supabase = getSupabase();
    const { data, error } = await supabase.from("NewsPostTranslation").upsert({
        postId,
        locale,
        title,
        excerpt: excerpt || "",
        body: body || "",
        body2: body2 || "",
        videoUrl: videoUrl || "",
        updatedAt: new Date().toISOString()
    }, { onConflict: "postId,locale" }).select("*").single();
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ translation: data });
}
export async function DELETE(req: NextRequest) {
    try {
        await requireRoutePermission(req);
    }
    catch(error) { return accessErrorResponse(error); }
    const { postId, locale } = await req.json();
    const supabase = getSupabase();
    await supabase.from("NewsPostTranslation").delete().eq("postId", postId).eq("locale", locale);
    return NextResponse.json({ ok: true });
}
