import { sendContactNotification } from "@/lib/mailer";
import { officialEmail } from "@/lib/public-contact";
import { getSupabaseOrNull } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
// Simple in-memory rate limiter: 5 requests per IP per 10 minutes
const contactRateLimit = new Map<string, {
    count: number;
    resetAt: number;
}>();
function checkContactLimit(ip: string): boolean {
    const now = Date.now();
    const entry = contactRateLimit.get(ip);
    if (!entry || now > entry.resetAt) {
        contactRateLimit.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
        return true;
    }
    if (entry.count >= 5)
        return false;
    entry.count++;
    return true;
}
export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkContactLimit(ip)) {
        return NextResponse.json({ error: "Too many requests. Please wait before sending another message." }, { status: 429 });
    }
    try {
        const body = await req.json();
        const { name, email, subject, message } = body || {};
        if (!name?.trim() || !email?.trim() || !message?.trim()) {
            return NextResponse.json({ error: "Name, email and message are required." }, { status: 400 });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
        }
        // Fix 92: character limit on message
        if (message.trim().length > 5000) {
            return NextResponse.json({ error: "Message is too long (max 5000 characters)." }, { status: 400 });
        }
        const supabase = getSupabaseOrNull();
        if (supabase) {
            await supabase.from("ContactMessage").insert({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                subject: subject?.trim() || null,
                message: message.trim(),
            });
        }
        try {
            await sendContactNotification({
                adminEmail: officialEmail(true),
                senderName: name,
                senderEmail: email,
                subject: subject?.trim() || "(no subject)",
                message: message.trim(),
            });
        }
        catch { }
        return NextResponse.json({ ok: true });
    }
    catch {
        return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
    }
}
