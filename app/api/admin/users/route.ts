import { requireAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
const LIMIT = 2000;
export async function GET(req: Request) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL((req as any).url || "http://localhost");
    const role = url.searchParams.get("role");
    const isStaff = url.searchParams.get("isStaff");
    const supabase = getSupabase();
    let query = supabase
        .from("User")
        .select("id, name, email, role, emailVerified, totalDonated, donationCount, createdAt, lastLoginAt, isStaff")
        .order("createdAt", { ascending: false })
        .limit(LIMIT);
    if (role)
        query = query.eq("role", role);
    if (isStaff === "true")
        query = query.eq("isStaff", true);
    const { data: users } = await query;
    const truncated = (users?.length || 0) >= LIMIT;
    return NextResponse.json({ users: users || [], truncated });
}
