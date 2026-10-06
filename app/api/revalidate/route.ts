import { getAdminSession,requireAdmin } from "@/lib/auth";
import { revalidatePath,revalidateTag } from "next/cache";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    // Accept both token and cookie auth (called from adminFetch and plain fetch)
    let authed = false;
    try {
        await requireAdmin(req);
        authed = true;
    }
    catch { }
    if (!authed) {
        const s = await getAdminSession();
        if (s && ["ADMIN", "EDITOR", "VIEWER"].includes(s.role))
            authed = true;
    }
    if (!authed)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        revalidatePath("/", "layout"); // Revalidate all public pages
        try {
            revalidateTag("site-settings");
        }
        catch { } // In case tags are used
        return NextResponse.json({ ok: true, revalidated: true });
    }
    catch {
        return NextResponse.json({ ok: false });
    }
}
