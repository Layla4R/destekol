import { getCurrentDonor } from "@/lib/donorAuth";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
export async function GET() {
    const donor = await getCurrentDonor();
    if (!donor)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = getSupabase();
    const { data: donations } = await supabase
        .from("Donation")
        .select("*, campaign:Campaign(title, slug)")
        .eq("donorEmail", donor.email)
        .order("createdAt", { ascending: false });
    return NextResponse.json({ donations: donations || [] });
}
