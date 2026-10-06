/**
 * Atomic campaign stats update using PostgreSQL arithmetic
 * Avoids race conditions from read-modify-write pattern
 */
import { getSupabase } from "./supabase";
export async function incrementCampaignStats(campaignId: string, amount: number, incrementDonorCount = false): Promise<void> {
    const supabase = getSupabase();
    try {
        // Use raw SQL via rpc for atomic increment — avoids race conditions
        const { error } = await supabase.rpc("increment_campaign_stats", {
            p_campaign_id: campaignId,
            p_amount: amount,
            p_increment_donor: incrementDonorCount,
        });
        if (error)
            throw error;
    }
    catch {
        // Fallback: read-modify-write (best effort if RPC not available)
        const { data: campaign } = await supabase
            .from("Campaign")
            .select("raisedAmount, donorCount")
            .eq("id", campaignId)
            .maybeSingle();
        if (campaign) {
            await supabase.from("Campaign").update({
                raisedAmount: Number(campaign.raisedAmount || 0) + Number(amount),
                ...(incrementDonorCount ? { donorCount: (campaign.donorCount || 0) + 1 } : {}),
            }).eq("id", campaignId);
        }
    }
}
