import { requireSuperAdmin } from "@/lib/auth";
import { requirePermission, accessErrorResponse, auditAccess } from "@/lib/admin-access";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function DELETE(req: NextRequest, { params }: {
    params: {
        id: string;
    };
}) {
    let session;
    try {
        session = await requirePermission("staff.manage", req);
        await requireSuperAdmin(req);
    }
    catch (error) { return accessErrorResponse(error); }
    const supabase = getSupabase();
    const { error } = await supabase.from("AdminInvite").delete().eq("id", params.id);
    await auditAccess(session, "staff.invite.delete", error ? "FAILURE" : "SUCCESS", params.id);
    if (error) return NextResponse.json({ error: "Delete failed" }, { status: 503 });
    return NextResponse.json({ ok: true });
}
