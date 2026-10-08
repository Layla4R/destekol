import { requirePermission, accessErrorResponse } from "@/lib/admin-access";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
// Page through all matching rows: a large limit alone is still capped by PostgREST.
async function readReportRows(query: () => any) {
    const data: any[] = [];
    for (let offset = 0; offset < 200000; offset += 500) {
        const result = await query().order('id', { ascending: true }).range(offset, offset + 499);
        if (result.error) return { data: [], error: result.error };
        data.push(...(result.data || []));
        if ((result.data || []).length < 500) return { data, error: null };
    }
    return { data: [], error: new Error('Report too large; shorten the period') };
}
const cents = (value: unknown) => Math.round(Number(value || 0) * 100);
const netCents = (row: any) => Math.max(0, cents(row.amount) - cents(row.refundedAmount));
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
    const generatedAt = new Date().toISOString();
    const since = new Date(Date.parse(generatedAt) - days * 24 * 60 * 60 * 1000).toISOString();
    const prevSince = new Date(Date.parse(generatedAt) - 2 * days * 24 * 60 * 60 * 1000).toISOString();
    const [current, previous, byGateway, topCampaigns, byDay] = await Promise.all([
        // Current period
        readReportRows(() => supabase.from("Donation").select("id, refundedAmount, amount, frequency, currency").in("status", ["COMPLETED", "REFUNDED"]).eq("currency",currency.toLowerCase()).eq("isTest",false).gte("createdAt", since).lte('createdAt', generatedAt)),
        // Previous period (for comparison)
        readReportRows(() => supabase.from("Donation").select("id, amount, refundedAmount").in("status", ["COMPLETED", "REFUNDED"]).eq("currency",currency.toLowerCase()).eq("isTest",false).gte("createdAt", prevSince).lt("createdAt", since)),
        // By gateway
        readReportRows(() => supabase.from("Donation").select("id, provider, amount, refundedAmount").in("status", ["COMPLETED", "REFUNDED"]).eq("currency",currency.toLowerCase()).eq("isTest",false).gte("createdAt", since).lte('createdAt', generatedAt)),
        // Top campaigns
        readReportRows(() => supabase.from("Donation").select("id, campaignId, refundedAmount, amount, allocations:DonationAllocation(campaignId,amount,refundedAmount,campaign:Campaign(title,slug)), campaign:Campaign(title, slug)").in("status", ["COMPLETED", "REFUNDED"]).eq("currency",currency.toLowerCase()).eq("isTest",false).gte("createdAt", since).lte('createdAt', generatedAt)),
        // All donations in period for daily chart
        readReportRows(() => supabase.from("Donation").select("id, refundedAmount, amount, createdAt").in("status", ["COMPLETED", "REFUNDED"]).eq("currency",currency.toLowerCase()).eq("isTest",false).gte("createdAt", since).lte('createdAt', generatedAt)),
    ]);
    if([current,previous,byGateway,topCampaigns,byDay].some(r=>r.error))return NextResponse.json({error:'Report unavailable'},{status:503});
    const currentDonations = current.data || [];
    const previousDonations = previous.data || [];
    const grossDonations = currentDonations.reduce((s: number, d: any) => s + cents(d.amount), 0) / 100;
    const totalRefunds = currentDonations.reduce((s: number, d: any) => s + cents(d.refundedAmount), 0) / 100;
    const totalRaised = currentDonations.reduce((s: number, d: any) => s + netCents(d), 0) / 100;
    const totalPrev = previousDonations.reduce((s: number, d: any) => s + netCents(d), 0) / 100;
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
    const allDays = Array.from({ length: days + 1 }, (_, i) => {
        const d = new Date(Date.parse(since) + i * 24 * 60 * 60 * 1000);
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
        period: days, currency, periodStart: since, periodEnd: generatedAt, generatedAt,
        source: 'Confirmed non-test Donation records and DonationAllocation records',
        methodology: 'Donation creation-date cohort. Gross includes completed and fully refunded payments; refunds are their cumulative confirmed refunds at report generation, regardless of refund date. Net = gross minus refunds. No currency conversion. This is not a cash-flow or bank-settlement report.',
        grossDonations, totalRefunds, netDonations: totalRaised,
        totalRaised: Math.round(totalRaised * 100) / 100,
        totalPrev: Math.round(totalPrev * 100) / 100,
        changePercent: totalPrev > 0 ? Math.round(((totalRaised - totalPrev) / totalPrev) * 100) : null,
        donationCount, monthlyCount,
        byGateway: gatewayMap,
        topCampaigns: topC,
        chart,
    },{headers:{'Cache-Control':'no-store'}});
}
