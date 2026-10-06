import bcrypt from "bcryptjs";
import crypto from "crypto";
import { SignJWT,jwtVerify } from "jose";
import { cookies } from "next/headers";
import { loadDonorEmailTemplate,sendEmailVerification,sendMail } from "./mailer";
import { getRequestSite } from "./request-site";
import { getSessionSecret } from "./session-secret";
import { getSupabase } from "./supabase";
import { isSiteSession } from "./tenant";
const SESSION_COOKIE = "destekol_donor_session";
const SALT_ROUNDS = 12;
function generateToken() {
    return crypto.randomBytes(48).toString("hex");
}
// ── Register ──────────────────────────────────────────────────
export async function registerDonor(opts: {
    name: string;
    email: string;
    password: string;
    country?: string;
}) {
    console.log("👉 [Register] بدء إنشاء حساب جديد لـ:", opts.email);
    const supabase = getSupabase();
    const { data: existing } = await supabase
        .from("User")
        .select("id")
        .eq("email", opts.email.toLowerCase())
        .maybeSingle();
    if (existing)
        throw new Error("EMAIL_EXISTS");
    const passwordHash = await bcrypt.hash(opts.password, SALT_ROUNDS);
    const verifyToken = crypto.randomUUID();
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: user, error } = await supabase
        .from("User")
        .insert({
        name: opts.name.trim(),
        email: opts.email.toLowerCase(),
        passwordHash,
        role: "DONOR",
        country: opts.country || null,
        emailVerified: false,
        verifyToken,
        verifyExpiry,
    })
        .select("id, name, email")
        .single();
    if (error) {
        console.error("❌ خطأ Supabase:", error.message);
        throw new Error(error.message);
    }
    console.log("👉 [Register] تم الحفظ بـ Supabase. جاري تجهيز رابط التفعيل...");
    const siteUrl = getRequestSite().url;
    const verifyUrl = `${siteUrl}/verify-email?token=${verifyToken}`;
    // 🌟 إرسال بريد التفعيل وانتظار النتيجة
    const sent = await sendEmailVerification({
        to: user.email,
        donorName: user.name,
        verifyUrl,
    });
    console.log("👉 [Register] نتيجة إرسال الإيميل:", sent ? "نجح ✅" : "فشل ❌");
    return { id: user.id, name: user.name, email: user.email };
}
//  Verify Email Token ──────────────────────────────────────────
export async function verifyEmail(token: string) {
    console.log("👉 [VerifyEmail] جاري التفعيل بالرمز:", token);
    const supabase = getSupabase();
    const { data: user, error } = await supabase
        .from("User")
        .select("id, verifyExpiry, emailVerified")
        .eq("verifyToken", token)
        .maybeSingle();
    if (error) {
        console.error("❌ [VerifyEmail] خطأ استعلام Supabase:", error.message);
        throw new Error("INVALID_TOKEN");
    }
    if (!user) {
        console.warn("⚠️ [VerifyEmail] التوكن غير موجود (غالباً تم التفعيل مسبقاً وتصفير التوكن).");
        throw new Error("INVALID_TOKEN");
    }
    if (user.emailVerified) {
        console.log("ℹ️ [VerifyEmail] الحساب مفعل مسبقاً.");
        return true;
    }
    if (user.verifyExpiry && new Date(user.verifyExpiry) < new Date()) {
        throw new Error("TOKEN_EXPIRED");
    }
    const { error: updateError } = await supabase
        .from("User")
        .update({
        emailVerified: true,
        verifyToken: null,
        verifyExpiry: null,
    })
        .eq("id", user.id);
    if (updateError) {
        console.error("❌ [VerifyEmail] فشل التحديث:", updateError.message);
        throw new Error(updateError.message);
    }
    console.log("🎉 [VerifyEmail] تم تفعيل الحساب بنجاح!");
    return true;
}
// ── Login ─────────────────────────────────────────────────────
export async function loginDonor(email: string, password: string) {
    getSessionSecret();
    const supabase = getSupabase();
    const { data: user, error } = await supabase
        .from("User")
        .select("id, name, email, passwordHash, role, emailVerified")
        .eq("email", email.toLowerCase())
        .maybeSingle();
    if (error)
        throw new Error(error.message);
    if (!user || !user.passwordHash)
        throw new Error("INVALID_CREDENTIALS");
    if (["ADMIN", "EDITOR", "VIEWER"].includes(user.role))
        throw new Error("USE_ADMIN_LOGIN");
    if (!user.emailVerified) {
        throw new Error("EMAIL_NOT_VERIFIED");
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
        throw new Error("INVALID_CREDENTIALS");
    const token = await new SignJWT({ userId: user.id, role: user.role, site: getRequestSite().id })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30d")
        .sign(getSessionSecret());
    return { user: { id: user.id, name: user.name, email: user.email }, token };
}
// ── Get Current Donor ─────────────────────────────────────────
export async function getCurrentDonor() {
    try {
        const token = cookies().get(SESSION_COOKIE)?.value;
        if (!token)
            return null;
        const { payload } = await jwtVerify(token, getSessionSecret(), { algorithms: ["HS256"] });
        if (!payload.userId || !isSiteSession(payload, getRequestSite().id))
            return null;
        const supabase = getSupabase();
        const { data: user } = await supabase
            .from("User")
            .select("id, name, email, emailVerified, country, totalDonated, donationCount, createdAt")
            .eq("id", payload.userId as string)
            .maybeSingle();
        return user || null;
    }
    catch {
        return null;
    }
}
// ── Logout ────────────────────────────────────────────────────
export async function logoutDonor() {
    cookies().delete(SESSION_COOKIE);
}
// ── Password Reset ────────────────────────────────────────────
export async function requestPasswordReset(email: string) {
    const supabase = getSupabase();
    const { data: user, error: userError } = await supabase
        .from("User")
        .select("id, name")
        .eq("email", email.toLowerCase())
        .maybeSingle();
    if (userError || !user)
        return; // Silent for security
    const token = generateToken();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await supabase.from("User").update({
        resetToken: token,
        resetExpiry: expiry.toISOString(),
    }).eq("id", user.id);
    const siteUrl = getRequestSite().url;
    const resetUrl = `${siteUrl}/reset-password?token=${token}`;
    const resetVars = { donorName: user.name || email, email, resetUrl, expiryHours: "1", siteUrl };
    const resetTpl = await loadDonorEmailTemplate("password_reset", resetVars);
    if (resetTpl) {
        await sendMail({ to: email, subject: resetTpl.subject, html: resetTpl.html }).catch(() => { });
        return;
    }
    await sendMail({
        to: email,
        subject: "إعادة تعيين كلمة المرور — Destekol",
        html: `<div dir="rtl" style="font-family:Cairo,Tahoma,sans-serif;padding:32px;background:#F8FAFF;">
      <h2 style="color:#0069D2;">إعادة تعيين كلمة المرور</h2>
      <p>مرحباً ${user.name}! اضغط الرابط أدناه لإعادة تعيين كلمة مرورك:</p>
      <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#003C87,#0069D2);color:#fff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;margin:16px 0;">إعادة تعيين كلمة المرور</a>
      <p style="color:#999;font-size:12px;">الرابط صالح لمدة ساعة واحدة فقط.</p>
    </div>`,
    }).catch(() => { });
}
export async function resetPassword(token: string, newPassword: string) {
    const supabase = getSupabase();
    const { data: user } = await supabase
        .from("User")
        .select("id, resetExpiry")
        .eq("resetToken", token)
        .maybeSingle();
    if (!user)
        throw new Error("INVALID_TOKEN");
    if (user.resetExpiry && new Date(user.resetExpiry) < new Date())
        throw new Error("TOKEN_EXPIRED");
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await supabase.from("User").update({
        passwordHash,
        resetToken: null,
        resetExpiry: null,
    }).eq("id", user.id);
}
