import { generateReceiptNumber } from "@/lib/format";
import { getRequestSite } from "@/lib/request-site";
import { getStripeAsync } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { frequency, donorName, donorEmail, message, isAnonymous, campaignId, storyId } = body;
        const amount = Number(body.amount); // coerce string to number
        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid donation amount." }, { status: 400 });
        }
        if (!donorName || !donorEmail) {
            return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(donorEmail)) {
            return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
        }
        const siteUrl = getRequestSite().url;
        const isMonthly = frequency === "monthly" || frequency === "MONTHLY";
        const supabase = getSupabase();
        // Get settings first — check enableStripe before any Stripe API call
        const { data: siteSettings } = await supabase
            .from("SiteSettings")
            .select("defaultCurrency, enableStripe")
            .eq("id", "default")
            .maybeSingle();
        if (siteSettings?.enableStripe === false) {
            return NextResponse.json({ error: "Card payments are currently disabled." }, { status: 503 });
        }
        const currency = siteSettings?.defaultCurrency || "usd";
        // Init Stripe after confirming it's enabled
        let stripe;
        try {
            stripe = await getStripeAsync();
        }
        catch {
            return NextResponse.json({ error: "Stripe is not configured. Add your Stripe Secret Key in Admin → Settings → Stripe." }, { status: 500 });
        }
        // Create a pending donation record first
        const { data: donation, error } = await supabase
            .from("Donation")
            .insert({
            campaignId: campaignId || null,
            donorName,
            donorEmail,
            amount,
            currency,
            frequency: isMonthly ? "MONTHLY" : "ONE_TIME",
            status: "PENDING",
            provider: "STRIPE",
            message: message || null,
            isAnonymous: !!isAnonymous,
            receiptNumber: generateReceiptNumber(),
        })
            .select("*")
            .single();
        if (error || !donation) {
            if (process.env.NODE_ENV !== "production")
                console.error("Donation insert error:", error);
            return NextResponse.json({ error: "Failed to save donation record. Please try again." }, { status: 500 });
        }
        const session = await stripe.checkout.sessions.create({
            mode: isMonthly ? "subscription" : "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency,
                        product_data: { name: "Donation — Destekol Charitable Non-Profit Association" },
                        unit_amount: Math.round(amount * 100),
                        ...(isMonthly ? { recurring: { interval: "month" } } : {}),
                    },
                    quantity: 1,
                },
            ],
            customer_email: donorEmail,
            success_url: `${siteUrl}/donate/success?donation=${donation.id}`,
            cancel_url: `${siteUrl}/donate/cancel?donation=${donation.id}`,
            metadata: { donationId: donation.id, ...(typeof storyId === "string" && storyId ? { storyId: storyId.slice(0, 120) } : {}) },
            // For subscriptions: also set metadata on the subscription object
            // so customer.subscription.deleted webhook can find the donation
            ...(isMonthly ? {
                subscription_data: {
                    metadata: { donationId: donation.id },
                },
            } : {}),
        });
        await supabase.from("Donation").update({ providerRef: session.id }).eq("id", donation.id);
        // For one-time payments: webhook marks COMPLETED and sends receipt.
        // For monthly: webhook marks COMPLETED. Receipt sent by invoice.payment_succeeded.
        if (!session.url) {
            // Mark donation as failed so it doesn't stay PENDING forever
            await supabase.from("Donation").update({ status: "FAILED" }).eq("id", donation.id);
            return NextResponse.json({ error: "Stripe did not return a checkout URL. Please try again." }, { status: 500 });
        }
        return NextResponse.json({ url: session.url });
    }
    catch (err: any) {
        if (process.env.NODE_ENV !== "production")
            console.error("Stripe checkout error:", err);
        return NextResponse.json({ error: "Failed to create payment session. Please try again." }, { status: 500 });
    }
}
