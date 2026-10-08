import {hasDonationReturnAccess} from '@/lib/donation-return-access';
import { getCurrentDonor } from "@/lib/donorAuth";
import { generateDonationReceiptPDF } from "@/lib/pdfReceipt";
import { getRequestSite } from "@/lib/request-site";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function GET(req: NextRequest, { params }: {
    params: {
        id: string;
    };
}) {
    const guest = await hasDonationReturnAccess(params.id);
    const donor = guest ? null : await getCurrentDonor();
    if (!guest && !donor)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = getSupabase();
    let query=supabase.from("Donation").select("*, campaign:Campaign(title)").eq("id",params.id);
    if(!guest)query=query.eq("donorEmail",donor!.email);
    const {data:d}=await query.maybeSingle();
    if (!d)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!guest && d.donorEmail.toLowerCase() !== donor!.email.toLowerCase())
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (d.isTest || d.status !== "COMPLETED")
        return NextResponse.json({ error: "Receipt not available — donation is not completed" }, { status: 400 });
    const { data: settings } = await supabase.from("SiteSettings").select("siteName, contactEmail").eq("id", "default").maybeSingle();
    const pdf = await generateDonationReceiptPDF({
        donorName: d.donorName, donorEmail: d.donorEmail,
        amount: Number(d.amount), currency: d.currency || "usd",
        frequency: d.frequency, receiptNumber: d.receiptNumber || d.id.slice(0, 8).toUpperCase(),
        campaignTitle: (d.campaign as any)?.title, provider: d.provider,
        donationDate: new Date(d.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }),
        siteName: settings?.siteName, contactEmail: settings?.contactEmail,
        siteUrl: getRequestSite().url,
    });
    const pdfBuffer = pdf instanceof Uint8Array ? pdf.buffer : pdf;
    return new NextResponse(pdfBuffer as ArrayBuffer, {
        headers: {
            "Cache-Control": "no-store",
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="receipt-${d.receiptNumber || d.id.slice(0, 8)}.pdf"`,
        },
    });
}
