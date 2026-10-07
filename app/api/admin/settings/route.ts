const SETTINGS_FIELDS = ["siteName","logoText","logoImage","primaryColor","accentColor","contactEmail","contactPhone","whatsappNumber","facebookUrl","twitterUrl","instagramUrl","youtubeUrl","linkedinUrl","tiktokUrl","footerTagline","footerDescription","copyrightText","defaultCurrency","smtpHost","smtpPort","smtpUser","smtpPassword","smtpFrom","smtpFromName","smtpSecure","socialPosition","id","updatedAt"];
import { requireAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function GET(req: Request) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabase = getSupabase();
    let { data: settings } = await supabase.from("SiteSettings").select("*").eq("id", "default").maybeSingle();
    if (!settings) {
        const { data: created } = await supabase
            .from("SiteSettings")
            .insert({ id: "default" })
            .select("*")
            .single();
        settings = created;
    }
    // Mask sensitive keys in response — client should never see raw secrets
    const masked: Record<string, any> = Object.fromEntries(Object.entries(settings || {}).filter(([key]) => SETTINGS_FIELDS.includes(key)));
    const sensitiveKeys = [   "smtpPassword"];
    for (const k of sensitiveKeys) {
        if (masked[k])
            masked[k] = masked[k].slice(0, 4) + "*".repeat(Math.max(0, masked[k].length - 4));
    }
    return NextResponse.json({ settings: masked });
}
export async function PATCH(req: NextRequest) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const data: any = {};
    // Skip masked values — if a secret field contains "***" it was masked in GET response
    // and should not overwrite the real value in DB
    const SENSITIVE = new Set([   "smtpPassword"]);
    for (const key of [
        "siteName",
        "logoText",
        "logoImage",
        "primaryColor",
        "accentColor",
        "contactEmail",
        "contactPhone",
        "whatsappNumber",
        "facebookUrl",
        "twitterUrl",
        "instagramUrl",
        "youtubeUrl",
        "linkedinUrl",
        "tiktokUrl",
        "footerTagline",
        "footerDescription",
        "copyrightText",








        "defaultCurrency",
        // SMTP / MAILBUX
        "smtpHost",
        "smtpPort",
        "smtpUser",
        "smtpPassword",
        "smtpFrom",
        "smtpFromName",
        "smtpSecure",
        "socialPosition",
    ]) {
        if (body[key] === undefined)
            continue;
        // Skip if it's a masked secret value (contains "***")
        if (SENSITIVE.has(key) && typeof body[key] === "string" && body[key].includes("***"))
            continue;
        // Skip empty strings for sensitive fields
        if (SENSITIVE.has(key) && body[key] === "")
            continue;
        data[key] = body[key];
    }
    data.updatedAt = new Date().toISOString();
    const supabase = getSupabase();
    // Ensure the row exists first (id = 'default')
    const { error: upsertError } = await supabase.from("SiteSettings").upsert({ id: "default", ...data }, { onConflict: "id" });
    if (upsertError) {
        console.error("[settings PATCH] upsert error:", upsertError);
        return NextResponse.json({ error: upsertError.message, details: upsertError.details }, { status: 500 });
    }
    const { data: rawSettings } = await supabase.from("SiteSettings").select("*").eq("id", "default").maybeSingle();
    // Mask sensitive keys in PATCH response too
    const masked: Record<string, any> = Object.fromEntries(Object.entries(rawSettings || {}).filter(([key]) => SETTINGS_FIELDS.includes(key)));
    const sensitiveKeys = [   "smtpPassword"];
    for (const k of sensitiveKeys) {
        if ((masked as any)[k])
            (masked as any)[k] = (masked as any)[k].slice(0, 4) + "*".repeat(Math.max(0, (masked as any)[k].length - 4));
    }
    return NextResponse.json({ settings: masked });
}
