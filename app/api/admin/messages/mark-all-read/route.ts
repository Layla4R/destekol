import { getAdminSession,requireAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    // Accept both Authorization header (adminFetch) and session cookie (form submit)
    let authed = false;
    try {
        await requireAdmin(req);
        authed = true;
    }
    catch { }
    if (!authed) {
        const session = await getAdminSession();
        if (session?.role === "ADMIN")
            authed = true;
    }
    if (!authed)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = getSupabase();
    await supabase.from("ContactMessage").update({ isRead: true }).eq("isRead", false);
    // Return JSON for fetch calls, redirect for form submits
    const accept = req.headers.get("accept") || "";
    if (accept.includes("text/html")) {
        return NextResponse.redirect(new URL("/admin/messages", req.url));
    }
    return NextResponse.json({ ok: true });
}
