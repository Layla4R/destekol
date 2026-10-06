export async function generateDonationReceiptPDF(opts: {
    donorName: string;
    donorEmail: string;
    amount: number;
    currency: string;
    frequency: string;
    receiptNumber: string;
    campaignTitle?: string;
    provider: string;
    donationDate: string;
    siteName?: string;
    contactEmail?: string;
    siteUrl?: string;
}): Promise<Uint8Array> {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210;
    const siteName = opts.siteName || "Destekol Charitable Non-Profit Association";
    const contactEmail = opts.contactEmail || "info@destekol.org";
    const siteUrl = opts.siteUrl || "";
    const amount = `${(opts.currency || "USD").toUpperCase()} ${Number(opts.amount).toFixed(2)}`;
    const freq = opts.frequency === "MONTHLY" ? "Monthly Recurring" : "One-Time Donation";
    const receipt = opts.receiptNumber;
    // Header background
    doc.setFillColor(0, 60, 135);
    doc.rect(0, 0, W / 2, 52, "F");
    doc.setFillColor(0, 105, 210);
    doc.rect(W / 2, 0, W / 2, 52, "F");
    // Pink accent line
    doc.setFillColor(240, 15, 90);
    doc.rect(0, 0, W, 2.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17);
    doc.setFont("helvetica", "bold");
    doc.text(siteName, W / 2, 20, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("OFFICIAL DONATION RECEIPT", W / 2, 28, { align: "center" });
    // Badge
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(W / 2 - 33, 33, 66, 11, 2, 2, "F");
    doc.setTextColor(0, 105, 210);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`RECEIPT # ${receipt}`, W / 2, 40, { align: "center" });
    // Thank you box
    doc.setFillColor(244, 247, 253);
    doc.roundedRect(14, 60, W - 28, 22, 3, 3, "F");
    doc.setTextColor(0, 105, 210);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Thank You for Your Generosity!", W / 2, 68, { align: "center" });
    doc.setTextColor(92, 104, 128);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Your donation has been received and will make a real difference.", W / 2, 75, { align: "center" });
    // Table
    const rows = [
        ["Donor Name", opts.donorName],
        ["Email", opts.donorEmail],
        ["Amount", amount],
        ["Campaign", opts.campaignTitle || "General Donation"],
        ["Type", freq],
        ["Gateway", opts.provider],
        ["Date", opts.donationDate],
        ["Receipt #", receipt],
        ["Status", "COMPLETED ✓"],
    ];
    let y = 92;
    rows.forEach(([label, value], i) => {
        if (i % 2 === 0) {
            doc.setFillColor(248, 250, 255);
            doc.rect(14, y - 4, W - 28, 11, "F");
        }
        doc.setTextColor(92, 104, 128);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(label, 20, y + 2);
        if (label === "Amount")
            doc.setTextColor(0, 105, 210);
        else if (label === "Status")
            doc.setTextColor(34, 197, 94);
        else
            doc.setTextColor(26, 26, 46);
        doc.setFont("helvetica", "bold");
        doc.text(value, 105, y + 2);
        doc.setDrawColor(221, 228, 240);
        doc.setLineWidth(0.2);
        doc.line(14, y + 7, W - 14, y + 7);
        y += 11;
    });
    y += 6;
    doc.setDrawColor(221, 228, 240);
    doc.setLineWidth(0.4);
    doc.line(14, y, W - 14, y);
    y += 8;
    doc.setTextColor(92, 104, 128);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    const note = `This is an official receipt for your donation to ${siteName}. Please keep for your records.`;
    doc.text(doc.splitTextToSize(note, W - 40), W / 2, y, { align: "center" });
    // Footer
    doc.setFillColor(244, 247, 253);
    doc.rect(0, 272, W, 25, "F");
    doc.setDrawColor(221, 228, 240);
    doc.setLineWidth(0.3);
    doc.line(0, 272, W, 272);
    doc.setTextColor(92, 104, 128);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(siteName, W / 2, 279, { align: "center" });
    doc.text(`${contactEmail}  ·  ${siteUrl}`, W / 2, 285, { align: "center" });
    const arr = doc.output("arraybuffer");
    return new Uint8Array(arr);
}
