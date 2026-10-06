import { generateReceiptNumber } from "@/lib/format";
import { getPaypalAccessToken,getPaypalClientAsync,paypal } from "@/lib/paypal";
import { getRequestSite } from "@/lib/request-site";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { frequency, donorName, donorEmail, message, isAnonymous, campaignId } = body;
        const amount = Number(body.amount); // coerce string to number
        if (!amount || amount <= 0)
            return NextResponse.json({ error: "Invalid donation amount." }, { status: 400 });
        if (!donorName || !donorEmail)
            return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(donorEmail))
            return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
        const isMonthly = frequency === "MONTHLY" || frequency === "monthly";
        const siteUrl = getRequestSite().url;
        // Get settings (single DB call)
        const supabase = getSupabase();
        const { data: siteSettings } = await supabase
            .from("SiteSettings")
            .select("defaultCurrency, paypalClientId, paypalClientSecret, paypalMode, enablePaypal")
            .eq("id", "default")
            .maybeSingle();
        // Check if PayPal is enabled
        if (siteSettings?.enablePaypal === false) {
            return NextResponse.json({ error: "PayPal payments are currently disabled." }, { status: 503 });
        }
        // currency: DB stores lowercase (e.g. "usd"), PayPal API requires uppercase ("USD")
        const currencyLower = siteSettings?.defaultCurrency || "usd";
        const currency = currencyLower.toUpperCase();
        // Save pending donation
        const { data: donation, error: donErr } = await supabase.from("Donation").insert({
            campaignId: campaignId || null,
            donorName, donorEmail, amount,
            currency: currencyLower, // store lowercase in DB
            frequency: isMonthly ? "MONTHLY" : "ONE_TIME",
            status: "PENDING", provider: "PAYPAL",
            message: message || null,
            isAnonymous: !!isAnonymous,
            receiptNumber: generateReceiptNumber(),
        }).select("*").single();
        if (donErr || !donation) {
            if (process.env.NODE_ENV !== "production")
                console.error("Donation insert error:", donErr);
            return NextResponse.json({ error: "Failed to save donation record." }, { status: 500 });
        }
        // ── Monthly Subscription via direct REST API ───────────────
        if (isMonthly) {
            let accessToken: string;
            let baseUrl: string;
            try {
                const auth = await getPaypalAccessToken();
                accessToken = auth.token;
                baseUrl = auth.baseUrl;
            }
            catch (e: any) {
                return NextResponse.json({ error: "PayPal not configured: " + e.message }, { status: 500 });
            }
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
                "Prefer": "return=representation",
            };
            // Step 1: Create Product
            const productRes = await fetch(`${baseUrl}/v1/catalogs/products`, {
                method: "POST", headers,
                body: JSON.stringify({
                    name: `Destekol Monthly Donation`,
                    description: `Monthly recurring donation to Destekol Charitable Non-Profit Association`,
                    type: "SERVICE",
                    category: "NONPROFIT",
                }),
            });
            if (!productRes.ok) {
                const err = await productRes.json();
                return NextResponse.json({ error: "PayPal product error: " + (err.message || productRes.status) }, { status: 500 });
            }
            const product = await productRes.json();
            // Step 2: Create Plan
            const planRes = await fetch(`${baseUrl}/v1/billing/plans`, {
                method: "POST", headers,
                body: JSON.stringify({
                    product_id: product.id,
                    name: `Monthly Donation $${Number(amount).toFixed(2)}`,
                    status: "ACTIVE",
                    billing_cycles: [{
                            frequency: { interval_unit: "MONTH", interval_count: 1 },
                            tenure_type: "REGULAR",
                            sequence: 1,
                            total_cycles: 0, // infinite
                            pricing_scheme: {
                                fixed_price: { value: Number(amount).toFixed(2), currency_code: currency },
                            },
                        }],
                    payment_preferences: {
                        auto_bill_outstanding: true,
                        payment_failure_threshold: 3,
                    },
                }),
            });
            if (!planRes.ok) {
                const err = await planRes.json();
                return NextResponse.json({ error: "PayPal plan error: " + (err.message || planRes.status) }, { status: 500 });
            }
            const plan = await planRes.json();
            // Step 3: Create Subscription
            const subRes = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
                method: "POST", headers,
                body: JSON.stringify({
                    plan_id: plan.id,
                    custom_id: donation.id,
                    subscriber: {
                        name: {
                            given_name: donorName.split(" ")[0],
                            surname: donorName.split(" ").slice(1).join(" ") || donorName,
                        },
                        email_address: donorEmail,
                    },
                    application_context: {
                        brand_name: "Destekol Charitable Non-Profit Association",
                        locale: "en-US",
                        user_action: "SUBSCRIBE_NOW",
                        return_url: `${siteUrl}/api/donations/paypal/capture?donationId=${donation.id}&type=subscription`,
                        cancel_url: `${siteUrl}/donate/cancel`,
                    },
                }),
            });
            if (!subRes.ok) {
                const err = await subRes.json();
                return NextResponse.json({ error: "PayPal subscription error: " + (err.message || subRes.status) }, { status: 500 });
            }
            const sub = await subRes.json();
            const approveLink = sub.links?.find((l: any) => l.rel === "approve")?.href;
            if (!approveLink) {
                if (process.env.NODE_ENV !== "production")
                    console.error("PayPal subscription missing approve link:", JSON.stringify(sub.links));
                return NextResponse.json({ error: "PayPal did not return an approval URL." }, { status: 500 });
            }
            await supabase.from("Donation").update({ providerRef: sub.id }).eq("id", donation.id);
            return NextResponse.json({ url: approveLink, subscriptionId: sub.id });
        }
        // ── One-time Order via SDK ─────────────────────────────────
        let client: any;
        try {
            client = await getPaypalClientAsync();
        }
        catch (e: any) {
            return NextResponse.json({ error: "PayPal not configured: " + e.message }, { status: 500 });
        }
        const orderReq = new paypal.orders.OrdersCreateRequest();
        orderReq.prefer("return=representation");
        orderReq.requestBody({
            intent: "CAPTURE",
            purchase_units: [{
                    amount: { currency_code: currency, value: Number(amount).toFixed(2) },
                    description: "Donation — Destekol Charitable Non-Profit Association",
                    custom_id: donation.id,
                }],
            application_context: {
                brand_name: "Destekol Charitable Non-Profit Association",
                locale: "en-US",
                return_url: `${siteUrl}/api/donations/paypal/capture?donationId=${donation.id}`,
                cancel_url: `${siteUrl}/donate/cancel`,
                user_action: "PAY_NOW",
            },
        });
        const order = await client.execute(orderReq);
        const approveLink = order.result.links.find((l: any) => l.rel === "approve")?.href;
        if (!approveLink) {
            if (process.env.NODE_ENV !== "production")
                console.error("PayPal order missing approve link:", JSON.stringify(order.result.links));
            return NextResponse.json({ error: "PayPal did not return an approval URL." }, { status: 500 });
        }
        await supabase.from("Donation").update({ providerRef: order.result.id }).eq("id", donation.id);
        return NextResponse.json({ url: approveLink });
    }
    catch (err: any) {
        if (process.env.NODE_ENV !== "production")
            console.error("PayPal error:", err);
        return NextResponse.json({ error: "Payment processing error. Please try again." }, { status: 500 });
    }
}
