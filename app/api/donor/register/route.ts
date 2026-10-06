import { registerDonor } from "@/lib/donorAuth";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    try {
        const { name, email, password, country } = await req.json();
        if (!name || !email || !password)
            return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
        if (password.length < 8)
            return NextResponse.json({ error: "كلمة المرور 8 أحرف على الأقل" }, { status: 400 });
        const user = await registerDonor({ name, email, password, country });
        return NextResponse.json({ ok: true, user });
    }
    catch (e: any) {
        if (e.message === "EMAIL_EXISTS")
            return NextResponse.json({ error: "هذا البريد الإلكتروني مسجل مسبقاً" }, { status: 400 });
        return NextResponse.json({ error: e.message || "حدث خطأ في التسجيل" }, { status: 500 });
    }
}
