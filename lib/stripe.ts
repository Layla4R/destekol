import { siteEnv } from "@/lib/request-site";
import Stripe from "stripe";
import { getSupabaseOrNull } from "./supabase";
let stripeInstance: Stripe | null = null;
let cachedKey: string | null = null;
/** Resolve Stripe secret key: DB → env var */
async function resolveStripeKey(): Promise<string> {
    // Try DB first (admin-configurable)
    const supabase = getSupabaseOrNull();
    if (supabase) {
        const { data } = await supabase
            .from("SiteSettings")
            .select("stripeSecretKey, enableStripe")
            .eq("id", "default")
            .maybeSingle();
        if (data?.stripeSecretKey && data.enableStripe)
            return data.stripeSecretKey;
    }
    // Fall back to env var
    const envKey = siteEnv("STRIPE_SECRET_KEY");
    if (envKey)
        return envKey;
    throw new Error("Stripe secret key not configured. Add it in Admin → Settings → Stripe.");
}
export async function getStripeAsync(): Promise<Stripe> {
    const key = await resolveStripeKey();
    // Always create fresh instance if key changed (admin may update settings)
    if (!stripeInstance || cachedKey !== key) {
        stripeInstance = new Stripe(key, { apiVersion: "2024-06-20" });
        cachedKey = key;
    }
    return stripeInstance;
}
