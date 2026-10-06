import { sendNewsletterWelcome } from "@/lib/mailer";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
// Rate limit: 3 subscriptions per IP per hour
const newsletterRateLimit = new Map<string, {
    count: number;
    resetAt: number;
}>();
function checkNewsletterLimit(ip: string): boolean {
    const now = Date.now();
    const entry = newsletterRateLimit.get(ip);
    if (!entry || now > entry.resetAt) {
        newsletterRateLimit.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
        return true;
    }
    if (entry.count >= 3)
        return false;
    entry.count++;
    return true;
}
export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkNewsletterLimit(ip)) {
        return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
    try {
        const { email } = await req.json();
        if (!email)
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
        }
        const supabase = getSupabase();
        const { data: existing } = await supabase.from("Subscriber").select("email").eq("email", email).maybeSingle();
        if (existing) {
            // Already subscribed — return ok silently (don't reveal if subscribed)
            return NextResponse.json({ ok: true });
        }
        await supabase.from("Subscriber").upsert({ email }, { onConflict: "email" });
        sendNewsletterWelcome(email).catch(() => { });
        return NextResponse.json({ ok: true });
    }
    catch {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
