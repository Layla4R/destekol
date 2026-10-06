import { requireAdmin } from "@/lib/auth";
import { generateDonationReceiptPDF } from "@/lib/pdfReceipt";
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
    const format = new URL(req.url).searchParams.get("format") || "pdf";
    const supabase = getSupabase();
    const { data: d } = await supabase.from("Donation").select("*, campaign:Campaign(title)").eq("id", params.id).maybeSingle();
    if (!d)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { data: settings } = await supabase.from("SiteSettings").select("siteName, contactEmail").eq("id", "default").maybeSingle();
    const siteName = settings?.siteName || "Destekol Charitable Non-Profit Association";
    const contactEmail = settings?.contactEmail || "info@destekol.org";
    const siteUrl = getRequestSite().url;
    const receipt = d.receiptNumber || d.id.slice(0, 8).toUpperCase();
    const date = new Date(d.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
    const amount = `${(d.currency || "USD").toUpperCase()} ${Number(d.amount).toFixed(2)}`;
    const freq = d.frequency === "MONTHLY" ? "Monthly Recurring" : "One-Time";
    const campaign = (d.campaign as any)?.title || "General Donation";
    if (format === "html") {
        const html = `<!DOCTYPE html><html dir="ltr" lang="en"><head><meta charset="UTF-8"/>
<title>Receipt ${receipt}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Cairo',Tahoma,Arial,sans-serif;background:#F4F7FD;padding:40px}
.card{max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #DDE4F0;box-shadow:0 4px 24px rgba(0,0,0,.08)}
.hdr{background:linear-gradient(135deg,#003C87,#0069D2);padding:36px 48px;text-align:center;position:relative}
.hdr::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#F00F5A,#FF4D88)}
.hdr h1{color:#fff;font-size:22px;font-weight:900;margin-bottom:4px}.hdr p{color:rgba(255,255,255,.65);font-size:11px;text-transform:uppercase;letter-spacing:2.5px}
.badge{display:inline-block;background:rgba(255,255,255,.15);color:#fff;border-radius:8px;padding:6px 18px;font-size:12px;font-weight:700;letter-spacing:1.5px;margin-top:16px}
.body{padding:40px 48px}.thank{background:linear-gradient(135deg,#F4F7FD,#EEF3FB);border-radius:12px;padding:24px;text-align:center;margin-bottom:32px}
.thank h2{color:#0069D2;font-size:20px;font-weight:900;margin-bottom:4px}.thank p{color:#5C6880;font-size:14px}
table{width:100%;border-collapse:collapse}tr{border-bottom:1px solid #EEF3FB}tr:last-child{border:none}
td{padding:14px 0;font-size:14px}td:first-child{color:#5C6880;width:45%}td:last-child{font-weight:700}
.amt{color:#0069D2;font-size:22px;font-weight:900}.ok{display:inline-block;background:#22C55E;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px}
.ftr{background:#F4F7FD;padding:24px 48px;text-align:center;border-top:1px solid #DDE4F0}.ftr p{color:#5C6880;font-size:12px;margin-bottom:4px}.ftr a{color:#0069D2;text-decoration:none}
.actions{text-align:center;margin:24px auto;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:8px;font-family:inherit;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;cursor:pointer;border:none;text-decoration:none}
.btn-print{background:linear-gradient(135deg,#003C87,#0069D2);color:#fff}.btn-pdf{background:linear-gradient(135deg,#F00F5A,#FF4D88);color:#fff}
@media print{body{background:#fff;padding:0}.card{border:none;border-radius:0;box-shadow:none}.no-print{display:none!important}}</style></head>
<body><div class="card"><div class="hdr"><h1>${siteName}</h1><p>Official Donation Receipt</p><div class="badge">RECEIPT # ${receipt}</div></div>
<div class="body"><div class="thank"><h2>Thank You! 🌟</h2><p>Your donation will make a real difference.</p></div>
<table>
<tr><td>Donor</td><td>${d.isAnonymous ? "Anonymous" : d.donorName}</td></tr>
<tr><td>Email</td><td>${d.donorEmail}</td></tr>
<tr><td>Amount</td><td><span class="amt">${amount}</span></td></tr>
<tr><td>Campaign</td><td>${campaign}</td></tr>
<tr><td>Type</td><td>${freq}</td></tr>
<tr><td>Gateway</td><td>${d.provider}</td></tr>
<tr><td>Date</td><td>${date}</td></tr>
<tr><td>Receipt #</td><td>${receipt}</td></tr>
<tr><td>Status</td><td><span class="ok">✓ COMPLETED</span></td></tr>
</table></div>
<div class="ftr"><p>${siteName}</p><p><a href="mailto:${contactEmail}">${contactEmail}</a> · <a href="${siteUrl}">${siteUrl}</a></p></div></div>
<div class="actions no-print">
  <button class="btn btn-print" onclick="window.print()">🖨️ Print / Save PDF</button>
  <a class="btn btn-pdf" href="/api/admin/invoices/${d.id}">⬇️ Download PDF</a>
</div></body></html>`;
        return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    // Real PDF
    const pdf = await generateDonationReceiptPDF({
        donorName: d.isAnonymous ? "Anonymous Donor" : d.donorName,
        donorEmail: d.donorEmail, amount: Number(d.amount), currency: d.currency || "usd",
        frequency: d.frequency, receiptNumber: receipt,
        campaignTitle: campaign, provider: d.provider, donationDate: date,
        siteName, contactEmail, siteUrl,
    });
    const pdfBuffer = pdf instanceof Uint8Array ? pdf.buffer : pdf;
    return new NextResponse(pdfBuffer as ArrayBuffer, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="receipt-${receipt}.pdf"`,
        },
    });
}
