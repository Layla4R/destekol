import { requirePermission, accessErrorResponse } from "@/lib/admin-access";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function GET(req: NextRequest) {
    try {
        await requirePermission('reports.view',req);
    }
    catch (error) { return accessErrorResponse(error); }
    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "30"; // days
    const days = Math.max(1,Math.min(365,parseInt(period)||30));
    const currency=(url.searchParams.get('currency')||'USD').toUpperCase();
    if(!['USD','TRY','EUR','GBP','RUB'].includes(currency))return NextResponse.json({error:'Invalid currency'},{status:400});
    const supabase = getSupabase();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const prevSince = new Date(Date.now() - 2 * days * 24 * 60 * 60 * 1000).toISOString();
    const [current, previous, byGateway, topCampaigns, byDay] = await Promise.all([
        // Current period
        supabase.from("Donation").select("refundedAmount, amount, frequency, currency").eq("status", "COMPLETED").eq("currency",currency.toLowerCase()).eq("isTest",false).gte("createdAt", since).limit(50000),
        // Previous period (for comparison)
        supabase.from("Donation").select("amount, refundedAmount").eq("status", "COMPLETED").eq("currency",currency.toLowerCase()).eq("isTest",false).gte("createdAt", prevSince).lt("createdAt", since).limit(50000),
        // By gateway
        supabase.from("Donation").select("provider, amount, refundedAmount").eq("status", "COMPLETED").eq("currency",currency.toLowerCase()).eq("isTest",false).gte("createdAt", since).limit(50000),
        // Top campaigns
        supabase.from("Donation").select("campaignId, refundedAmount, amount, allocations:DonationAllocation(campaignId,amount,refundedAmount,campaign:Campaign(title,slug)), campaign:Campaign(title, slug)").eq("status", "COMPLETED").eq("currency",currency.toLowerCase()).eq("isTest",false).gte("createdAt", since).limit(50000),
        // All donations in period for daily chart
        supabase.from("Donation").select("refundedAmount, amount, createdAt").eq("status", "COMPLETED").eq("currency",currency.toLowerCase()).eq("isTest",false).gte("createdAt", since).order("createdAt").limit(50000),
    ]);
    if([current,previous,byGateway,topCampaigns,byDay].some(r=>r.error))return NextResponse.json({error:'Report unavailable'},{status:503});
    const currentDonations = current.data || [];
    const previousDonations = previous.data || [];
    const totalRaised = currentDonations.reduce((s: number, d: any) => s + Math.max(0, Number(d.amount) - Number(d.refundedAmount || 0)), 0);
    const totalPrev = previousDonations.reduce((s: number, d: any) => s + Math.max(0, Number(d.amount) - Number(d.refundedAmount || 0)), 0);
    const donationCount = currentDonations.length;
    const monthlyCount = currentDonations.filter((d: any) => d.frequency === "MONTHLY").length;
    // By gateway
    const gatewayMap: Record<string, number> = {};
    for (const d of byGateway.data || []) {
        const gw = d.provider || "Manual/Other";
        gatewayMap[gw] = (gatewayMap[gw] || 0) + Math.max(0, Number(d.amount) - Number(d.refundedAmount || 0));
    }
    // Top campaigns
    const campaignMap: Record<string, {
        id: string;
        title: string;
        slug: string;
        amount: number;
        count: number;
    }> = {};
    for (const d of topCampaigns.data || []) {
        const seen=new Set<string>();
        for(const allocation of (d.allocations?.length?d.allocations:[d])){
            const c:any=Array.isArray(allocation.campaign)?allocation.campaign[0]:allocation.campaign;if(!allocation.campaignId||!c)continue;
            if(!campaignMap[allocation.campaignId])campaignMap[allocation.campaignId]={id:allocation.campaignId,title:c.title,slug:c.slug,amount:0,count:0};
            campaignMap[allocation.campaignId].amount+=Math.max(0,Number(allocation.amount)-Number(allocation.refundedAmount||0));
            if(!seen.has(allocation.campaignId)){campaignMap[allocation.campaignId].count++;seen.add(allocation.campaignId);}
        }
    }
    const topC = Object.values(campaignMap).sort((a, b) => b.amount - a.amount).slice(0, 5);
    // Daily chart — last N days
    const dailyMap: Record<string, number> = {};
    const allDays = Array.from({ length: days }, (_, i) => {
        const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
        return d.toISOString().slice(0, 10);
    });
    for (const day of allDays)
        dailyMap[day] = 0;
    for (const d of byDay.data || []) {
        const day = (d.createdAt as string).slice(0, 10);
        if (dailyMap[day] !== undefined)
            dailyMap[day] += Math.max(0, Number(d.amount) - Number(d.refundedAmount || 0));
    }
    const chart = allDays.map(day => ({ day, amount: Math.round(dailyMap[day] * 100) / 100 }));
    return NextResponse.json({
        period: days, currency,
        totalRaised: Math.round(totalRaised * 100) / 100,
        totalPrev: Math.round(totalPrev * 100) / 100,
        changePercent: totalPrev > 0 ? Math.round(((totalRaised - totalPrev) / totalPrev) * 100) : null,
        donationCount, monthlyCount,
        byGateway: gatewayMap,
        topCampaigns: topC,
        chart,
    },{headers:{'Cache-Control':'no-store'}});
}
