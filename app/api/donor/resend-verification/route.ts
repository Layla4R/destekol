import { sendEmailVerification } from "@/lib/mailer";
import { getRequestSite } from "@/lib/request-site";
import { getSupabase } from "@/lib/supabase";
import crypto from "crypto";
import { NextRequest,NextResponse } from "next/server";
const resendAttempts = new Map<string, {
    count: number;
    resetAt: number;
}>();
function checkResendLimit(ip: string): boolean {
    const now = Date.now();
    const entry = resendAttempts.get(ip);
    if (!entry || now > entry.resetAt) {
        resendAttempts.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
        return true;
    }
    if (entry.count >= 3)
        return false;
    entry.count++;
    return true;
}
export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkResendLimit(ip))
        return NextResponse.json({ ok: true }); // Silently rate-limit
    const { email } = await req.json();
    if (!email)
        return NextResponse.json({ ok: true }); // Silent
    const supabase = getSupabase();
    const { data: user } = await supabase.from("User")
        .select("id, name, emailVerified")
        .eq("email", email.toLowerCase())
        .eq("role", "DONOR")
        .maybeSingle();
    if (!user || user.emailVerified)
        return NextResponse.json({ ok: true });
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("User").update({ verifyToken: token, verifyExpiry: expiry }).eq("id", user.id);
    const siteUrl = getRequestSite().url;
    const verifyUrl = `${siteUrl}/verify-email?token=${token}`;
    await sendEmailVerification({ to: email, donorName: user.name || email, verifyUrl });
    return NextResponse.json({ ok: true });
}
