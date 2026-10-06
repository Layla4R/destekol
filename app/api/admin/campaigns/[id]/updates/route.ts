import { requireAdmin } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";
import { getRequestSite } from "@/lib/request-site";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function GET(req: NextRequest, { params }: {
    params: {
        id: string;
    };
}) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabase = getSupabase();
    const { data: updates } = await supabase
        .from("CampaignUpdate")
        .select("*")
        .eq("campaignId", params.id)
        .order("createdAt", { ascending: false })
        .limit(50);
    return NextResponse.json({ updates: updates || [] });
}
export async function POST(req: NextRequest, { params }: {
    params: {
        id: string;
    };
}) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { title, body, notifyDonors } = await req.json();
    if (!title || !body)
        return NextResponse.json({ error: "Title and body required" }, { status: 400 });
    const supabase = getSupabase();
    // Save the update
    const { data: update, error } = await supabase
        .from("CampaignUpdate")
        .insert({ campaignId: params.id, title, body })
        .select("*")
        .single();
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    // Load campaign + settings in parallel
    const [{ data: campaign }, { data: settings }] = await Promise.all([
        supabase.from("Campaign").select("title, slug").eq("id", params.id).maybeSingle(),
        supabase.from("SiteSettings").select("siteName, contactEmail, primaryColor, accentColor").eq("id", "default").maybeSingle(),
    ]);
    const siteName = settings?.siteName || "Destekol Charitable Non-Profit Association";
    const primaryColor = (settings as any)?.primaryColor || "#0069D2";
    const accentColor = (settings as any)?.accentColor || "#F00F5A";
    const siteUrl = getRequestSite().url;
    let emailsSent = 0;
    let failedEmails = 0;
    let donationsData: any[] | null = null;
    if (notifyDonors && campaign) {
        const { data: donations } = await supabase
            .from("Donation")
            .select("donorName, donorEmail")
            .eq("campaignId", params.id)
            .eq("status", "COMPLETED")
            .eq("isAnonymous", false)
            .limit(1000); // Note: if campaign has >1000 donors, not all will be notified
        donationsData = donations;
        // Deduplicate by email
        const seen = new Set<string>();
        const donors = (donations || []).filter((d: any) => {
            if (seen.has(d.donorEmail))
                return false;
            seen.add(d.donorEmail);
            return true;
        });
        // Escape HTML to prevent XSS in email body
        const escapeHtml = (s: string) => s
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
        await Promise.allSettled(donors.map(async (donor: any) => {
            try {
                // Use AR locale URL as default (most donors are Arabic speakers)
                const campaignUrl = `${siteUrl}/ar/campaigns/${campaign.slug}`;
                const sent = await sendMail({
                    to: donor.donorEmail,
                    subject: `Update: ${campaign.title} — ${title}`,
                    html: `<!DOCTYPE html>
<html dir="ltr" lang="en">
<body style="margin:0;padding:40px 0;background:#F4F7FD;font-family:Cairo,Tahoma,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #DDE4F0;">
    <div style="background:linear-gradient(135deg,${primaryColor},${primaryColor}cc);padding:32px 40px;text-align:center;position:relative;">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${accentColor},${accentColor}cc)"></div>
      <h1 style="color:#fff;margin:0;font-size:20px;font-weight:900;">${escapeHtml(siteName)}</h1>
      <p style="color:rgba(255,255,255,.65);margin:6px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Campaign Update</p>
    </div>
    <div style="padding:36px 40px;">
      <div style="background:#F4F7FD;border-radius:10px;padding:16px 20px;margin-bottom:24px;border-right:4px solid ${primaryColor};">
        <p style="margin:0;font-size:12px;color:#5C6880;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Campaign</p>
        <p style="margin:4px 0 0;font-size:16px;font-weight:900;color:${primaryColor};">${escapeHtml(campaign.title)}</p>
      </div>
      <h2 style="color:#1A1A2E;font-size:18px;font-weight:900;margin:0 0 16px;">${escapeHtml(title)}</h2>
      <div style="color:#5C6880;font-size:15px;line-height:1.8;white-space:pre-wrap;">${escapeHtml(body)}</div>
      <div style="text-align:center;margin:32px 0;">
        <a href="${campaignUrl}" style="display:inline-block;background:${accentColor};color:#fff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px;">View Campaign</a>
      </div>
      <p style="text-align:center;font-size:12px;color:#aaa;">You received this because you donated to this campaign.<br/><a href="${siteUrl}/account" style="color:${primaryColor};text-decoration:none;">Manage preferences</a></p>
    </div>
    <div style="background:#F4F7FD;padding:20px 40px;text-align:center;border-top:1px solid #DDE4F0;">
      <p style="color:#5C6880;font-size:12px;margin:0;">${escapeHtml(siteName)} · ${settings?.contactEmail || ""}</p>
    </div>
  </div>
</body>
</html>`,
                });
                if (sent)
                    emailsSent++;
                else
                    failedEmails++;
            }
            catch {
                failedEmails++;
            }
        }));
    }
    const donorLimitReached = (donationsData?.length || 0) >= 1000;
    return NextResponse.json({ ok: true, update, emailsSent, failedEmails, donorLimitReached });
}
// DELETE is handled by /[updateId]/route.ts
