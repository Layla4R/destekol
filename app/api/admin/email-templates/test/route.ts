import { requireAdmin } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";
import { getRequestSite } from "@/lib/request-site";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { email, subject, html } = await req.json();
    if (!email || !html)
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    // Replace demo variables with English values matching template content
    const siteUrl = getRequestSite().url;
    const demoVars: Record<string, string> = {
        donorName: "John Smith", amount: "$50", receiptNumber: "4R-TEST-0001",
        campaign: "Humanitarian Relief", date: new Date().toLocaleDateString("en-GB"),
        type: "One-time", donorEmail: email, provider: "Stripe",
        senderName: "Test Visitor", senderEmail: email, subject: "Test Inquiry",
        message: "This is a test message from the admin panel.", unsubscribeUrl: `${siteUrl}/unsubscribe`,
        verifyUrl: `${siteUrl}/verify-email?token=test-token-xxx`,
        resetUrl: `${siteUrl}/reset-password?token=test-token-xxx`,
        expiryHours: "24", campaignName: "Humanitarian Relief", email: email, siteUrl,
    };
    const rendered = html.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => demoVars[k] || `{{${k}}}`);
    try {
        const ok = await sendMail({ to: email, subject: `[TEST] ${subject}`, html: rendered });
        if (ok)
            return NextResponse.json({ ok: true });
        return NextResponse.json({ ok: false, error: "Email failed to send — SMTP may not be configured. Check Settings → Email (SMTP)." }, { status: 500 });
    }
    catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message || "Unknown SMTP error" }, { status: 500 });
    }
}
