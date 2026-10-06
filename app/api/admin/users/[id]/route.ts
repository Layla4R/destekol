import { requireAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function PATCH(req: NextRequest, { params }: {
    params: {
        id: string;
    };
}) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { role, permissions, isStaff } = body;
    // Prevent promoting directly to ADMIN via this endpoint
    // Only super-admins should promote to ADMIN (done via DB or separate endpoint)
    if (role === "ADMIN") {
        const session = await import("@/lib/auth").then(m => m.requireSuperAdmin(req)).catch(() => null);
        if (!session)
            return NextResponse.json({ error: "Only super-admins can grant ADMIN role" }, { status: 403 });
    }
    if (role && !["DONOR", "EDITOR", "ADMIN", "VIEWER"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const data: any = {};
    if (role !== undefined)
        data.role = role;
    if (permissions !== undefined)
        data.permissions = permissions;
    if (isStaff !== undefined)
        data.isStaff = isStaff;
    if (!Object.keys(data).length) {
        return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }
    const supabase = getSupabase();
    const { error } = await supabase.from("User").update(data).eq("id", params.id);
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
export async function DELETE(req: NextRequest, { params }: {
    params: {
        id: string;
    };
}) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabase = getSupabase();
    // Don't allow deleting ADMIN users
    const { data: user } = await supabase.from("User").select("role").eq("id", params.id).maybeSingle();
    if (!user)
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.role === "ADMIN")
        return NextResponse.json({ error: "Cannot delete admin users" }, { status: 403 });
    // Clean up donor sessions before deleting user
    await supabase.from("DonorSession").delete().eq("userId", params.id);
    const { error } = await supabase.from("User").delete().eq("id", params.id);
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
