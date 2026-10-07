import { createAdminInvite } from "@/lib/adminInvite";
import { requireSuperAdmin } from "@/lib/auth";
import { requirePermission, accessErrorResponse, auditAccess } from "@/lib/admin-access";
import { ALL_PERMISSIONS, PermissionId } from "@/lib/permissions";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function GET(req: Request) {
    try {
        await requirePermission("staff.manage", req);
        await requireSuperAdmin(req);
    }
    catch (error) { return accessErrorResponse(error); }
    const supabase = getSupabase();
    const now = new Date().toISOString();
    const { data: allInvites } = await supabase
        .from("AdminInvite")
        .select("id,email,name,role,permissions,invitedBy,expiresAt,acceptedAt,createdAt")
        .order("createdAt", { ascending: false })
        .limit(200);
    // Filter in JS: show accepted invites OR invites that haven't expired yet
    const filtered = (allInvites || []).filter((inv: any) => inv.acceptedAt != null || (inv.expiresAt && inv.expiresAt > now));
    return NextResponse.json({ invites: filtered });
}
export async function POST(req: NextRequest) {
    let session: any;
    try {
        session = await requirePermission("staff.manage", req);
        await requireSuperAdmin(req);
    }
    catch (error) { return accessErrorResponse(error); }
    const body = await req.json();
    const { email, name, permissions, role = "EDITOR" } = body;
    if (!["EDITOR","VIEWER","FINANCE","COMPLAINTS"].includes(role)) return NextResponse.json({error:"Invalid role"},{status:400});
    if (!email || !name)
        return NextResponse.json({ error: "Email and name are required" }, { status: 400 });
    if (!Array.isArray(permissions) || !permissions.length || permissions.some((p: unknown) => typeof p !== "string" || !ALL_PERMISSIONS.some(x => x.id === p)))
        return NextResponse.json({ error: "At least one permission is required" }, { status: 400 });
    try {
        const invite = await createAdminInvite({
            email, name, role,
            permissions: permissions as PermissionId[],
            invitedBy: session?.email || "Admin",
        });
        await auditAccess(session, "staff.invite.create", "SUCCESS", invite.id);
        return NextResponse.json({ invite });
    }
    catch (e: any) {
        const msgs: Record<string, string> = {
            ALREADY_INVITED: "This email already has a pending invitation",
            ALREADY_STAFF: "This person is already a staff member",
        };
        return NextResponse.json({ error: msgs[e.message] || e.message }, { status: 400 });
    }
}
