import { getRequestSite } from "@/lib/request-site";
import crypto from "crypto";
import { sendMail } from "./mailer";
import { PermissionId } from "./permissions";
import { getSupabase } from "./supabase";
const INVITE_EXPIRY_HOURS = 48;
export async function createAdminInvite(opts: {
    email: string;
    name: string;
    permissions: PermissionId[];
    role?: "EDITOR" | "VIEWER" | "FINANCE" | "COMPLAINTS";
    invitedBy: string;
}) {
    const supabase = getSupabase();
    // Check if already invited or staff
    const { data: existing } = await supabase
        .from("AdminInvite").select("id").eq("email", opts.email.toLowerCase()).maybeSingle();
    if (existing)
        throw new Error("ALREADY_INVITED");
    const { data: existingUser } = await supabase
        .from("User").select("id, isStaff, role").eq("email", opts.email.toLowerCase()).maybeSingle();
    if (existingUser?.isStaff || existingUser?.role === "ADMIN")
        throw new Error("ALREADY_STAFF");
    const token = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000);
    const { data: invite, error } = await supabase.from("AdminInvite").insert({
        email: opts.email.toLowerCase(),
        name: opts.name,
        token,
        permissions: opts.permissions,
        role: opts.role || "EDITOR",
        invitedBy: opts.invitedBy,
        expiresAt: expiresAt.toISOString(),
    }).select("*").single();
    if (error)
        throw new Error(error.message);
    // Get site settings for branding
    const { data: settings } = await supabase.from("SiteSettings")
        .select("siteName, smtpFrom").eq("id", "default").maybeSingle();
    const siteName = settings?.siteName || "Destekol Charitable Non-Profit Association";
    const siteUrl = getRequestSite().url;
    const acceptUrl = `${siteUrl}/admin/accept-invite?token=${token}`;
    // Send invite email
    await sendMail({
        to: opts.email,
        subject: `You've been invited to join the ${siteName} Admin Panel`,
        html: `<!DOCTYPE html>
<html dir="ltr" lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Admin Invitation — ${siteName}</title></head>
<body style="margin:0;padding:40px 0;background:#F4F7FD;font-family:Cairo,Tahoma,Arial,sans-serif;color:#1A1A2E;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #DDE4F0;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#003C87 0%,#0069D2 100%);padding:40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:900;letter-spacing:-0.5px;">${siteName}</h1>
      <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Admin Panel Invitation</p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <h2 style="color:#0069D2;margin:0 0 8px;font-size:20px;">You've been invited!</h2>
      <p style="color:#5C6880;margin:0 0 24px;font-size:15px;line-height:1.7;">
        Hi <strong style="color:#1A1A2E;">${opts.name}</strong>,<br/>
        <strong style="color:#1A1A2E;">${opts.invitedBy}</strong> has invited you to join the <strong style="color:#1A1A2E;">${siteName}</strong> admin panel as a staff member.
      </p>

      <!-- Permissions -->
      <div style="background:#F4F7FD;border-radius:12px;padding:20px;margin-bottom:28px;border:1px solid #DDE4F0;">
        <p style="margin:0 0 12px;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#5C6880;">Your Access Permissions</p>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${(opts.permissions || []).slice(0, 12).map(p => `
            <span style="display:inline-block;background:#0069D2;color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;">${p.replace(/\./g, " › ").toUpperCase()}</span>
          `).join("")}
          ${(opts.permissions || []).length > 12 ? `<span style="display:inline-block;background:#DDE4F0;color:#5C6880;font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;">+${(opts.permissions || []).length - 12} more</span>` : ""}
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${acceptUrl}" style="display:inline-block;background:linear-gradient(135deg,#F00F5A 0%,#FF4D88 100%);color:#fff;font-weight:700;font-size:16px;padding:16px 40px;border-radius:12px;text-decoration:none;letter-spacing:-0.3px;">
          Accept Invitation & Set Password
        </a>
      </div>

      <p style="color:#5C6880;font-size:13px;text-align:center;margin:0;">
        This invitation expires in <strong>${INVITE_EXPIRY_HOURS} hours</strong>.<br/>
        If you did not expect this invitation, you can safely ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#F4F7FD;padding:20px 40px;text-align:center;border-top:1px solid #DDE4F0;">
      <p style="color:#5C6880;font-size:12px;margin:0;">${siteName} · ${siteUrl}</p>

    </div>
  </div>
</body>
</html>`,
    });
    return invite;
}
export async function acceptAdminInvite(token: string, password: string) {
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(password, 12);
    const { data, error } = await getSupabase().rpc('accept_staff_invite', { p_token: token, p_password_hash: passwordHash });
    if (error || !data) throw new Error('INVALID_TOKEN');
    return data;
}
