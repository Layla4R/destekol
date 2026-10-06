import { requireAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
export async function GET(req: Request) {
    try {
        const session = await requireAdmin(req);
        const supabase = getSupabase();
        const { data: user } = await supabase
            .from("User")
            .select("name, role, isStaff, permissions")
            .eq("email", session.email)
            .maybeSingle();
        // Refresh session if within 24h of expiry
        const res = NextResponse.json({
            admin: {
                name: user?.name || session.email.split("@")[0],
                email: session.email,
                role: user?.role || session.role,
                isStaff: user?.isStaff || false,
                permissions: user?.permissions || [],
            }
        });
        return res;
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
