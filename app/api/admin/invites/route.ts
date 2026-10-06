import { createAdminInvite } from "@/lib/adminInvite";
import { requireAdmin } from "@/lib/auth";
import { PermissionId } from "@/lib/permissions";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function GET(req: Request) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabase = getSupabase();
    const now = new Date().toISOString();
    const { data: allInvites } = await supabase
        .from("AdminInvite")
        .select("*")
        .order("createdAt", { ascending: false })
        .limit(200);
    // Filter in JS: show accepted invites OR invites that haven't expired yet
    const filtered = (allInvites || []).filter((inv: any) => inv.acceptedAt != null || (inv.expiresAt && inv.expiresAt > now));
    return NextResponse.json({ invites: filtered });
}
export async function POST(req: NextRequest) {
    let session: any;
    try {
        session = await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { email, name, permissions } = body;
    if (!email || !name)
        return NextResponse.json({ error: "Email and name are required" }, { status: 400 });
    if (!permissions?.length)
        return NextResponse.json({ error: "At least one permission is required" }, { status: 400 });
    try {
        const invite = await createAdminInvite({
            email, name,
            permissions: permissions as PermissionId[],
            invitedBy: session?.email || "Admin",
        });
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
