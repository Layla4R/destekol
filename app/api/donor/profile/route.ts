import { getCurrentDonor } from "@/lib/donorAuth";
import { getSupabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { NextRequest,NextResponse } from "next/server";
export async function PATCH(req: NextRequest) {
    const donor = await getCurrentDonor();
    if (!donor)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { name, country, currentPassword, newPassword } = await req.json();
    const supabase = getSupabase();
    const updates: Record<string, any> = {};
    if (name?.trim())
        updates.name = name.trim();
    if (country !== undefined)
        updates.country = country || null;
    if (newPassword) {
        if (!currentPassword)
            return NextResponse.json({ error: "Current password required" }, { status: 400 });
        if (newPassword.length < 8)
            return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        const { data: user } = await supabase.from("User").select("passwordHash").eq("id", donor.id).maybeSingle();
        if (!user?.passwordHash)
            return NextResponse.json({ error: "Cannot change password" }, { status: 400 });
        const valid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid)
            return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        updates.passwordHash = await bcrypt.hash(newPassword, 12);
    }
    if (Object.keys(updates).length === 0)
        return NextResponse.json({ ok: true });
    const { error } = await supabase.from("User").update({ ...updates, updatedAt: new Date().toISOString() }).eq("id", donor.id);
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
