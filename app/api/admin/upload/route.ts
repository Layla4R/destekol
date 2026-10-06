import { requireAdmin } from "@/lib/auth";
import { getRequestSite } from "@/lib/request-site";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file)
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    // Validate type - Images & Videos
    const allowed = [
        "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
        "video/mp4", "video/webm", "video/ogg", "video/quicktime"
    ];
    if (!allowed.includes(file.type)) {
        return NextResponse.json({ error: "Invalid file type. Allowed: JPG, PNG, WebP, GIF, SVG, MP4, WebM, MOV" }, { status: 400 });
    }
    // Max 70MB (to support larger video files)
    if (file.size > 70 * 1024 * 1024) {
        return NextResponse.json({ error: "File too large. Max 70MB" }, { status: 400 });
    }
    try {
        const supabase = getSupabase();
        const ext = file.name.split(".").pop() || "mp4";
        const fileName = `${getRequestSite().id}/uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const bytes = await file.arrayBuffer();
        const { data, error } = await supabase.storage
            .from("media")
            .upload(fileName, bytes, { contentType: file.type, upsert: false });
        if (error)
            throw new Error(error.message);
        const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);
        return NextResponse.json({ url: urlData.publicUrl, path: fileName });
    }
    catch (e: any) {
        if (process.env.NODE_ENV !== "production")
            console.error("[upload] Error:", e?.message || e);
        if (e.message?.includes("bucket") || e.message?.includes("not found")) {
            return NextResponse.json({ error: "Storage bucket 'media' not found in Supabase." }, { status: 500 });
        }
        return NextResponse.json({ error: e.message || "Upload failed" }, { status: 500 });
    }
}
