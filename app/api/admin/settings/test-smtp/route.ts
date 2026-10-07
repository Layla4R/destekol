const testAttempts = new Map<string, number>();
import { requireRoutePermission, accessErrorResponse } from "@/lib/admin-access";
import { sendMail,testSmtpConnection } from "@/lib/mailer";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    try {
        await requireRoutePermission(req);
    }
    catch(error) { return accessErrorResponse(error); }
    // Rate limit: max 5 test emails per minute
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const now = Date.now();
    const count = testAttempts.get(ip) || 0;
    if (count >= 5)
        return NextResponse.json({ ok: false, error: "Too many test attempts. Please wait a minute." }, { status: 429 });
    testAttempts.set(ip, count + 1);
    setTimeout(() => testAttempts.set(ip, Math.max(0, (testAttempts.get(ip) || 1) - 1)), 60000);
    const body = await req.json();
    const { host, port, user, password, from, fromName, secure, testTo } = body;
    if (!host || !user || !password) {
        return NextResponse.json({ error: "SMTP host, username and password are required." }, { status: 400 });
    }
    const { ok, error } = await testSmtpConnection({
        host, port: Number(port) || 587, user, password,
        from: from || user, fromName: fromName || "Destekol", secure: !!secure,
    });
    if (!ok)
        return NextResponse.json({ ok: false, error: `Connection failed: ${error}` });
    if (testTo) {
        await sendMail({
            to: testTo,
            subject: "SMTP Test — Destekol",
            html: `<div style="font-family:Arial,sans-serif;padding:24px;background:#F8FAFF;">
        <h2 style="color:#0069D2;">SMTP Connection Successful ✅</h2>
        <p>If you received this email, your SMTP settings are working correctly.</p>
        <p style="color:#999;font-size:12px;">Server: ${host}:${port}</p>
      </div>`,
        });
    }
    return NextResponse.json({ ok: true, message: "Connection successful" + (testTo ? " — test email sent" : "") });
}
