import { siteEnv } from "@/lib/request-site";
import checkoutNodeJsSdk from "@paypal/checkout-server-sdk";
import { getSupabaseOrNull } from "./supabase";
export const paypal = checkoutNodeJsSdk;
interface PayPalConfig {
    clientId: string;
    clientSecret: string;
    mode: string;
}
async function resolvePayPalConfig(): Promise<PayPalConfig> {
    const supabase = getSupabaseOrNull();
    if (supabase) {
        const { data } = await supabase
            .from("SiteSettings")
            .select("paypalClientId, paypalClientSecret, paypalMode, enablePaypal")
            .eq("id", "default")
            .maybeSingle();
        if (data?.paypalClientId && data?.paypalClientSecret && data.enablePaypal) {
            return { clientId: data.paypalClientId, clientSecret: data.paypalClientSecret, mode: data.paypalMode || "sandbox" };
        }
    }
    const clientId = siteEnv("PAYPAL_CLIENT_ID");
    const clientSecret = siteEnv("PAYPAL_CLIENT_SECRET");
    const mode = siteEnv("PAYPAL_MODE") || "sandbox";
    if (!clientId || !clientSecret)
        throw new Error("PayPal credentials not configured. Add them in Admin → Settings → PayPal.");
    return { clientId, clientSecret, mode };
}
export async function getPaypalClientAsync() {
    const config = await resolvePayPalConfig();
    const env = config.mode === "live"
        ? new checkoutNodeJsSdk.core.LiveEnvironment(config.clientId, config.clientSecret)
        : new checkoutNodeJsSdk.core.SandboxEnvironment(config.clientId, config.clientSecret);
    return new checkoutNodeJsSdk.core.PayPalHttpClient(env);
}
/**
 * Get an OAuth2 access token for direct PayPal REST API calls.
 * Used for Subscriptions/Billing API which is NOT in checkout-server-sdk.
 */
export async function getPaypalAccessToken(): Promise<{
    token: string;
    baseUrl: string;
}> {
    const config = await resolvePayPalConfig();
    const baseUrl = config.mode === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";
    const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
    const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`PayPal auth failed: ${err}`);
    }
    const data = await res.json();
    return { token: data.access_token, baseUrl };
}
