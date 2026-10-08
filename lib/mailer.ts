import { getRequestSite,siteEnv } from "./request-site";
/**
 * MAILBUX / Gmail SMTP Mailer
 * Uses settings stored in SiteSettings (smtpHost, smtpPort, smtpUser, smtpPassword, ...)
 * Falls back to env vars SMTP_HOST / SMTP_USER / SMTP_PASS for local dev.
 */
import nodemailer from "nodemailer";
import { getSupabaseOrNull } from "./supabase";
export interface MailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    timeoutMs?: number;
}
export interface SmtpConfig {
    host: string;
    port: number;
    secure: boolean; // true = SSL (465) | false = STARTTLS (587)
    user: string;
    password: string;
    from: string; // e.g. "info@destekol.org"
    fromName: string; // e.g. "Destekol Charitable Non-Profit Association"
}
/** Load SMTP config from SiteSettings DB row, fall back to env vars. */
async function loadSmtpConfig(): Promise<SmtpConfig | null> {
    const supabase = getSupabaseOrNull();
    let row: any = null;
    if (supabase) {
        const { data } = await supabase
            .from("SiteSettings")
            .select("smtpHost, smtpPort, smtpUser, smtpPassword, smtpFrom, smtpFromName, smtpSecure, contactEmail")
            .eq("id", "default")
            .maybeSingle();
        row = data;
    }
    // قراءة البيانات بالترتيب: DB ← .env.local ← القيمة الافتراضية
    const host = row?.smtpHost || siteEnv("SMTP_HOST") || "smtp.gmail.com";
    const port = Number(row?.smtpPort || siteEnv("SMTP_PORT") || 465);
    const user = (row?.smtpUser && row.smtpUser.trim() !== "") ? row.smtpUser : (siteEnv("SMTP_USER") || "");
    const password = (row?.smtpPassword && row.smtpPassword.trim() !== "")
        ? row.smtpPassword
        : (siteEnv("SMTP_PASS") || siteEnv("SMTP_PASSWORD") || "");
    const from = row?.smtpFrom || siteEnv("SMTP_FROM") || row?.contactEmail || user;
    const fromName = row?.smtpFromName || siteEnv("SMTP_FROM_NAME") || "Destekol Charitable Non-Profit Association";
    const secure = port === 465 ? true : (row?.smtpSecure ?? (siteEnv("SMTP_SECURE") === "true"));
    if (!user || !password) {
        console.warn("[mailer] ⚠️ لم يتم العثور على SMTP_USER أو SMTP_PASS بملف .env.local أو قاعدة البيانات.");
        return null;
    }
    return { host, port, secure, user, password, from, fromName };
}
/**
 * Send an email via the configured SMTP server.
 */
export async function sendMail(opts: MailOptions): Promise<boolean> {
    try {
        const cfg = await loadSmtpConfig();
        if (!cfg) {
            console.warn("[mailer] ❌ توقف الإرسال: إعدادات SMTP غير مكتملة.");
            return false;
        }
        const transporter = buildTransporter(cfg, opts.timeoutMs);
        const fromField = `"${cfg.fromName}" <${cfg.from}>`;
        const info = await transporter.sendMail({
            from: fromField,
            to: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
            replyTo: opts.replyTo || cfg.from,
            subject: opts.subject,
            html: opts.html,
            text: opts.text || opts.html.replace(/<[^>]*>/g, ""),
        });
        const sent = info.accepted?.length > 0 && !info.rejected?.length;
        if (sent) console.info('[mailer] SMTP accepted the message.');
        else console.warn('[mailer] SMTP did not accept all recipients.');
        return sent;
    }
    catch (err) {
        console.error("[mailer] SMTP delivery failed.");
        return false;
    }
}
/** Load email template and apply vars (exported for donorAuth) */
export async function loadDonorEmailTemplate(id: string, vars: Record<string, string>): Promise<{
    subject: string;
    html: string;
} | null> {
    const tpl = await loadEmailTemplate(id);
    if (!tpl)
        return null;
    return { subject: applyVars(tpl.subject, vars), html: applyVars(tpl.html, vars) };
}
/** Load email template from DB if available */
async function loadEmailTemplate(id: string): Promise<{
    subject: string;
    html: string;
} | null> {
    const supabase = getSupabaseOrNull();
    if (!supabase)
        return null;
    const { data } = await supabase.from("EmailTemplate").select("subject, html").eq("id", id).maybeSingle();
    return data || null;
}
/** Replace template variables */
function applyVars(html: string, vars: Record<string, string>): string {
    return html.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}
/** Build a nodemailer transporter from config. */
function buildTransporter(cfg: SmtpConfig, timeoutMs?: number) {
    return nodemailer.createTransport({
        ...(timeoutMs ? { connectionTimeout: timeoutMs, greetingTimeout: timeoutMs, socketTimeout: timeoutMs } : {}),
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure, // false = STARTTLS (port 587), true = SSL (port 465)
        auth: { user: cfg.user, pass: cfg.password },
        tls: {
            rejectUnauthorized: true, // Enforce certificate validation
        },
    });
}
/** Send email verification (standalone, for resend flow) */
export async function sendEmailVerification(opts: {
    to: string;
    donorName: string;
    verifyUrl: string;
}): Promise<boolean> {
    const siteUrl = getRequestSite().url;
    const uniqueTag = `<!-- unique_time:${Date.now()} -->`; // 🌟 بصمة زمنية تمنع دمج Gmail للرسائل وإخفاء الزر
    const vars = { donorName: opts.donorName, verifyUrl: opts.verifyUrl, siteUrl };
    const tpl = await loadEmailTemplate("email_verification");
    if (tpl) {
        return sendMail({
            to: opts.to,
            subject: applyVars(tpl.subject, vars),
            html: applyVars(tpl.html, vars) + uniqueTag,
        });
    }
    return sendMail({
        to: opts.to,
        subject: "Verify Your Email — Destekol",
        html: `<div style="font-family:Cairo,Arial,sans-serif;padding:32px;background:#F8FAFF;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#003C87,#0069D2);padding:28px;border-radius:12px;text-align:center;margin-bottom:24px;">
        <h1 style="color:#ffffff;margin:0;font-size:20px;">Destekol</h1>
      </div>
      <h2 style="color:#0069D2;margin-bottom:16px;">Verify Your Email Address</h2>
      <p style="color:#5C6880;line-height:1.6;margin-bottom:24px;">
        Hello <strong>${opts.donorName}</strong>,<br/>
        Click below to verify your email address. This link expires in 24 hours.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${opts.verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#F00F5A,#FF4D88);color:#ffffff !important;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:16px;">Verify Email Address</a>
      </div>
      <p style="color:#aaa;font-size:12px;text-align:center;margin-top:24px;">If you didn't request this, ignore this email.</p>
    </div>${uniqueTag}`,
    });
}
/** Test SMTP connection (used by the admin settings panel). */
export async function testSmtpConnection(cfg: SmtpConfig): Promise<{
    ok: boolean;
    error?: string;
}> {
    try {
        const transporter = buildTransporter(cfg);
        await transporter.verify();
        return { ok: true };
    }
    catch (err: any) {
        return { ok: false, error: err?.message || String(err) };
    }
}
// ─── Pre-built email templates ──────────────────────────────────────
const baseStyle = `
  font-family: 'Cairo', Tahoma, Arial, sans-serif;
  direction: rtl;
  background: #F8FAFF;
  padding: 40px 0;
`;
const cardStyle = `
  max-width: 600px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #DDE4F0;
`;
const headerStyle = `
  background: linear-gradient(135deg, #003C87 0%, #0069D2 100%);
  padding: 32px 40px;
  text-align: center;
`;
const bodyStyle = `
  padding: 32px 40px;
  color: #1A1A2E;
`;
const footerStyle = `
  background: #F4F7FD;
  padding: 20px 40px;
  text-align: center;
  color: #5C6880;
  font-size: 12px;
  border-top: 1px solid #DDE4F0;
`;
const btnStyle = `
  display: inline-block;
  background: linear-gradient(135deg, #F00F5A 0%, #FF4D88 100%);
  color: #ffffff;
  font-weight: 700;
  padding: 14px 32px;
  border-radius: 12px;
  text-decoration: none;
  font-size: 16px;
  margin: 8px 0;
`;
function emailWrapper(content: string, siteUrl = getRequestSite().url, dir: "ltr" | "rtl" = "rtl", lang = "ar") {
    return `
<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Destekol</title>
</head>
<body style="${baseStyle}">
  <div style="${cardStyle}">
    <div style="${headerStyle}">
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:900;">
        Destekol Charitable Non-Profit Association
      </h1>
    </div>
    <div style="${bodyStyle}">
      ${content}
    </div>
    <div style="${footerStyle}">
      <p>© ${new Date().getFullYear()} Destekol Charitable Non-Profit Association. جميع الحقوق محفوظة.</p>
      <p>
        <a href="${siteUrl}/privacy" style="color:#0069D2;text-decoration:none;">سياسة الخصوصية</a>
        &nbsp;·&nbsp;
        <a href="${siteUrl}/contact" style="color:#0069D2;text-decoration:none;">تواصل معنا</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
/** Send donation receipt — uses DB template if available, falls back to built-in HTML */
export async function sendDonationReceipt(opts: {
    to: string;
    donorName: string;
    amount: number;
    currency: string;
    frequency: string;
    receiptNumber: string;
    campaignTitle?: string;
    donationDate?: string;
}): Promise<boolean> {
    const siteUrl = getRequestSite().url;
    const date = opts.donationDate || new Date().toLocaleDateString("en-GB");
    const isMonthly = opts.frequency === "MONTHLY";
    const currencyDisplay = (opts.currency || "usd").toUpperCase();
    const amountStr = `$${Number(opts.amount).toFixed(2)} ${currencyDisplay}`;
    const typeLabel = isMonthly ? "Monthly" : "One-time";
    const { data: brandSettings } = await (getSupabaseOrNull()?.from("SiteSettings")
        .select("primaryColor, accentColor, siteName")
        .eq("id", "default")
        .maybeSingle() ?? Promise.resolve({ data: null }));
    const primaryColor = (brandSettings as any)?.primaryColor || "#0069D2";
    const accentColor = (brandSettings as any)?.accentColor || "#F00F5A";
    const vars = {
        donorName: opts.donorName,
        amount: amountStr,
        receiptNumber: opts.receiptNumber,
        campaign: opts.campaignTitle || "General Fund",
        date,
        type: typeLabel,
        siteUrl,
    };
    const tpl = await loadEmailTemplate("donation_receipt");
    if (tpl) {
        return sendMail({
            to: opts.to,
            subject: applyVars(tpl.subject, vars) || `Donation Receipt — ${amountStr} | ${opts.receiptNumber}`,
            html: applyVars(tpl.html, vars),
        });
    }
    const html = emailWrapper(`
    <h2 style="color:${primaryColor};margin-top:0;">Thank you for your donation! 💙</h2>
    <p style="font-size:16px;line-height:1.8;color:#5C6880;">
      Dear <strong style="color:#1A1A2E;">${opts.donorName}</strong>,<br/>
      Your donation has been received successfully. May God bless your generosity.
    </p>
    <div style="background:#F4F7FD;border-radius:12px;padding:24px;margin:24px 0;border:1px solid #DDE4F0;">
      <h3 style="color:#003C87;margin-top:0;font-size:13px;text-transform:uppercase;letter-spacing:2px;">Donation Details</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#5C6880;font-size:14px;">Receipt #</td><td style="padding:8px 0;font-weight:700;font-family:monospace;">${opts.receiptNumber}</td></tr>
        <tr style="border-top:1px solid #DDE4F0;"><td style="padding:8px 0;color:#5C6880;font-size:14px;">Amount</td><td style="padding:8px 0;font-weight:700;font-size:20px;color:#0069D2;">${amountStr}</td></tr>
        <tr style="border-top:1px solid #DDE4F0;"><td style="padding:8px 0;color:#5C6880;font-size:14px;">Type</td><td style="padding:8px 0;font-weight:700;">${typeLabel}</td></tr>
        ${opts.campaignTitle ? `<tr style="border-top:1px solid #DDE4F0;"><td style="padding:8px 0;color:#5C6880;font-size:14px;">Campaign</td><td style="padding:8px 0;">${opts.campaignTitle}</td></tr>` : ""}
        <tr style="border-top:1px solid #DDE4F0;"><td style="padding:8px 0;color:#5C6880;font-size:14px;">Date</td><td style="padding:8px 0;">${date}</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin:32px 0;">
      <a href="${siteUrl}/campaigns" style="display:inline-block;background:${accentColor};color:#fff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:16px;">View Campaigns</a>
    </div>
  `, siteUrl, "ltr", "en");
    return sendMail({
        to: opts.to,
        subject: `Donation Receipt — ${amountStr} | ${opts.receiptNumber}`,
        html,
    });
}
/** New donation notification to admin */
export async function sendAdminDonationNotification(opts: {
    adminEmail: string;
    donorName: string;
    donorEmail: string;
    amount: number;
    currency: string;
    frequency: string;
    provider: string;
    campaignTitle?: string;
    receiptNumber: string;
}): Promise<boolean> {
    const siteUrl = getRequestSite().url;
    const amountStr = `$${Number(opts.amount).toFixed(2)}`;
    const vars = {
        donorName: opts.donorName,
        donorEmail: opts.donorEmail,
        amount: amountStr,
        provider: opts.provider,
        campaign: opts.campaignTitle || "General Fund",
        receiptNumber: opts.receiptNumber,
        siteUrl,
    };
    const tpl = await loadEmailTemplate("admin_donation");
    if (tpl) {
        return sendMail({
            to: opts.adminEmail,
            subject: applyVars(tpl.subject, vars) || `New Donation ${amountStr} — ${opts.donorName}`,
            html: applyVars(tpl.html, vars),
        });
    }
    const freqLabel = opts.frequency === "MONTHLY" ? "Monthly" : "One-time";
    const html = emailWrapper(`
    <h2 style="color:#0069D2;margin-top:0;">💰 New Donation Received!</h2>
    <div style="background:#F4F7FD;border-radius:12px;padding:24px;border:1px solid #DDE4F0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#5C6880;">Donor</td><td style="padding:8px 0;font-weight:700;">${opts.donorName}</td></tr>
        <tr style="border-top:1px solid #DDE4F0;"><td style="padding:8px 0;color:#5C6880;">Email</td><td style="padding:8px 0;">${opts.donorEmail}</td></tr>
        <tr style="border-top:1px solid #DDE4F0;"><td style="padding:8px 0;color:#5C6880;">Amount</td><td style="padding:8px 0;font-weight:700;font-size:20px;color:#0069D2;">${amountStr}</td></tr>
        <tr style="border-top:1px solid #DDE4F0;"><td style="padding:8px 0;color:#5C6880;">Type</td><td style="padding:8px 0;">${freqLabel} — ${opts.provider}</td></tr>
        ${opts.campaignTitle ? `<tr style="border-top:1px solid #DDE4F0;"><td style="padding:8px 0;color:#5C6880;">Campaign</td><td style="padding:8px 0;">${opts.campaignTitle}</td></tr>` : ""}
        <tr style="border-top:1px solid #DDE4F0;"><td style="padding:8px 0;color:#5C6880;">Receipt</td><td style="padding:8px 0;font-family:monospace;">${opts.receiptNumber}</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${siteUrl}/admin/donations" style="${btnStyle}">View Donations</a>
    </div>
  `, siteUrl, "ltr", "en");
    return sendMail({
        to: opts.adminEmail,
        subject: `New Donation ${amountStr} — ${opts.donorName}`,
        html,
    });
}
/** Contact form notification to admin */
export async function sendContactNotification(opts: {
    adminEmail: string;
    senderName: string;
    senderEmail: string;
    message: string;
    subject?: string;
}): Promise<boolean> {
    const siteUrl = getRequestSite().url;
    const vars = { senderName: opts.senderName, senderEmail: opts.senderEmail, message: opts.message, subject: opts.subject || "", siteUrl };
    const tpl = await loadEmailTemplate("contact_notification");
    if (tpl)
        return sendMail({ to: opts.adminEmail, subject: applyVars(tpl.subject, vars), html: applyVars(tpl.html, vars), replyTo: opts.senderEmail, timeoutMs: 8000 });
    const html = emailWrapper(`
    <h2 style="color:#0069D2;margin-top:0;">📩 رسالة جديدة</h2>
    <div style="background:#F4F7FD;border-radius:12px;padding:24px;border:1px solid #DDE4F0;margin-bottom:20px;">
      <p><strong>الاسم:</strong> ${opts.senderName}</p>
      <p><strong>البريد:</strong> <a href="mailto:${opts.senderEmail}" style="color:#0069D2;">${opts.senderEmail}</a></p>
    </div>
    <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #DDE4F0;border-right:4px solid #0069D2;">
      <p style="color:#1A1A2E;line-height:1.8;white-space:pre-wrap;">${opts.message}</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="mailto:${opts.senderEmail}" style="${btnStyle}">رد على الرسالة</a>
    </div>
  `, siteUrl);
    return sendMail({
        to: opts.adminEmail,
        subject: `رسالة جديدة من ${opts.senderName}`,
        html,
        replyTo: opts.senderEmail,
        timeoutMs: 8000,
    });
}
/** Newsletter email always includes a signed cancellation link. */
export async function sendNewsletterWelcome(to:string,unsubscribeUrl:string,locale='tr'):Promise<boolean>{
 const siteUrl=getRequestSite().url;
 const t=(ar:string,en:string,fr:string,tr:string)=>locale==='ar'?ar:locale==='en'?en:locale==='fr'?fr:tr;
 const label=t('إلغاء الاشتراك','Unsubscribe','Se désabonner','Aboneliği iptal et');
 const footer='<p style="font-size:12px;text-align:center"><a href="'+unsubscribeUrl+'">'+label+'</a></p>';
 const vars={email:to,unsubscribeUrl,siteUrl};const tpl=await loadEmailTemplate('newsletter_welcome');
 if(tpl)return sendMail({to,subject:applyVars(tpl.subject,vars),html:applyVars(tpl.html,vars)+footer,timeoutMs:8000});
 const subject=t('مرحبًا بك في نشرة Destekol','Welcome to the Destekol newsletter','Bienvenue à la newsletter Destekol','Destekol bültenine hoş geldiniz');
 const text=t('شكرًا لاشتراكك. ستصلك أخبار الجمعية وتحديثات حملاتها. يمكنك إلغاء الاشتراك في أي وقت.','Thank you for subscribing. You will receive our news and campaign updates. You can unsubscribe at any time.','Merci pour votre inscription. Vous recevrez nos actualités et les nouvelles de nos campagnes. Vous pouvez vous désabonner à tout moment.','Abone olduğunuz için teşekkür ederiz. Dernek haberlerini ve kampanya duyurularını alacaksınız. İstediğiniz zaman aboneliğinizi iptal edebilirsiniz.');
 return sendMail({to,subject,html:emailWrapper('<h2>'+subject+'</h2><p>'+text+'</p>'+footer,siteUrl),timeoutMs:8000});
}
