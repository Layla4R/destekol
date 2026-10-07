import { requireRoutePermission, accessErrorResponse } from "@/lib/admin-access";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function DELETE(req: NextRequest, { params }: {
    params: {
        id: string;
        updateId: string;
    };
}) {
    try {
        await requireRoutePermission(req);
    }
    catch(error) { return accessErrorResponse(error); }
    const supabase = getSupabase();
    const { error } = await supabase.from("CampaignUpdate")
        .delete()
        .eq("id", params.updateId)
        .eq("campaignId", params.id);
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
