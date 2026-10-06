"use client";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { useCallback,useEffect,useRef,useState } from "react";
// ── Templates ─────────────────────────────────────────────────
const TEMPLATES = [
    { id: "donation_receipt", group: "Donations", label: "Donation Receipt", desc: "Sent to donor after successful donation", vars: ["donorName", "amount", "receiptNumber", "campaign", "date", "type", "siteUrl"] },
    { id: "admin_donation", group: "Donations", label: "New Donation (Admin)", desc: "Sent to admin when a new donation arrives", vars: ["donorName", "donorEmail", "amount", "provider", "campaign", "receiptNumber", "siteUrl"] },
    { id: "newsletter_welcome", group: "Newsletter", label: "Newsletter Welcome", desc: "Sent when someone subscribes to the newsletter", vars: ["email", "unsubscribeUrl", "siteUrl"] },
    { id: "contact_notification", group: "Contact", label: "Contact Form Notification", desc: "Sent to admin when a contact form message arrives", vars: ["senderName", "senderEmail", "message", "subject", "siteUrl"] },
    { id: "donor_register", group: "Auth", label: "Account Created", desc: "Sent to donor after creating an account", vars: ["donorName", "email", "verifyUrl", "siteUrl"] },
    { id: "email_verification", group: "Auth", label: "Email Verification", desc: "Sent to verify email address", vars: ["donorName", "verifyUrl", "siteUrl"] },
    { id: "password_reset", group: "Auth", label: "Password Reset", desc: "Sent when donor requests a password reset", vars: ["donorName", "resetUrl", "expiryHours", "siteUrl"] },
    { id: "subscription_cancelled", group: "Donations", label: "Subscription Cancelled", desc: "Sent to donor when monthly subscription is cancelled", vars: ["donorName", "amount", "campaignName", "siteUrl"] },
];
// ── Block types ───────────────────────────────────────────────
type BType = "logo" | "header" | "text" | "button" | "divider" | "table" | "image" | "footer" | "spacer" | "columns";
interface Block {
    id: string;
    type: BType;
    props: Record<string, string>;
}
const BLOCK_META: {
    type: BType;
    label: string;
    icon: string;
    group: string;
}[] = [
    { type: "logo", label: "Logo", icon: "layers", group: "Structure" },
    { type: "header", label: "Heading", icon: "file-text", group: "Structure" },
    { type: "text", label: "Text", icon: "file-text", group: "Content" },
    { type: "button", label: "Button", icon: "send", group: "Content" },
    { type: "image", label: "Image", icon: "image", group: "Content" },
    { type: "columns", label: "2 Columns", icon: "layout-grid", group: "Layout" },
    { type: "divider", label: "Divider", icon: "minus", group: "Layout" },
    { type: "spacer", label: "Spacer", icon: "minus", group: "Layout" },
    { type: "table", label: "Data Table", icon: "bar-chart", group: "Content" },
    { type: "footer", label: "Footer", icon: "help-circle", group: "Structure" },
];
const DEFAULTS: Record<BType, Record<string, string>> = {
    logo: { logoUrl: "", logoText: "Destekol Charitable Non-Profit Association", logoWidth: "180", align: "center", bgColor: "#003C87", padding: "28" },
    header: { text: "Your heading here", fontSize: "22", color: "#1A1A2E", align: "center", bgColor: "#ffffff", padding: "16" },
    text: { content: "Write your message here...", fontSize: "15", color: "#5C6880", align: "left", bgColor: "#ffffff", padding: "16", lineHeight: "1.8" },
    button: { label: "Click Here", url: "#", bgColor: "#F00F5A", textColor: "#ffffff", borderRadius: "10", fontSize: "15", align: "center", padding: "16" },
    image: { url: "", alt: "", width: "100%", align: "center", borderRadius: "0", padding: "8" },
    columns: { leftContent: "Left column text", rightContent: "Right column text", bgColor: "#ffffff", padding: "16", color: "#5C6880", fontSize: "14" },
    divider: { color: "#DDE4F0", thickness: "1", margin: "16" },
    spacer: { height: "24" },
    table: { title: "Details", bgColor: "#F4F7FD", titleColor: "#003C87", rows: '[["Field","Value"],["Receipt","{{receiptNumber}}"],["Amount","{{amount}}"],["Date","{{date}}"]]' },
    footer: { text: "© 2026 Destekol Charitable Non-Profit Association. All rights reserved.", color: "#5C6880", bgColor: "#F4F7FD", fontSize: "12", align: "center", padding: "20", links: "Privacy Policy|/privacy,Contact Us|/contact" },
};
// ── Global email settings ─────────────────────────────────────
interface EmailSettings {
    primaryColor: string;
    accentColor: string;
    bgColor: string;
    cardBg: string;
    fontFamily: string;
    logoUrl: string;
    logoText: string;
    footerText: string;
    footerLinks: string;
    siteUrl: string;
}
const DEFAULT_SETTINGS: EmailSettings = {
    primaryColor: "#003C87", accentColor: "#F00F5A", bgColor: "#F8FAFF", cardBg: "#ffffff",
    fontFamily: "Cairo, Tahoma, Arial, sans-serif",
    logoUrl: "", logoText: "Destekol Charitable Non-Profit Association",
    footerText: "© 2026 Destekol Charitable Non-Profit Association. All rights reserved.",
    footerLinks: "Privacy Policy|/privacy,Contact Us|/contact",
    siteUrl: "https://destekol.org",
};
// ── uid ───────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }
// ── Block → HTML ──────────────────────────────────────────────
function blockToHtml(b: Block, gs: EmailSettings): string {
    const p = b.props;
    const pad = (v: string | number, def = "16") => `padding:${v || def}px 32px;`;
    switch (b.type) {
        case "logo": {
            const bg = p.bgColor || gs.primaryColor;
            // Inherit from global settings if block has no logo set
            const effectiveLogoUrl = p.logoUrl || gs.logoUrl;
            const effectiveLogoText = p.logoText || gs.logoText;
            const inner = effectiveLogoUrl
                ? `<img src="${effectiveLogoUrl}" alt="${effectiveLogoText}" width="${p.logoWidth || 180}" style="max-width:${p.logoWidth || 180}px;height:auto;display:inline-block;" />`
                : `<span style="color:#ffffff;font-size:20px;font-weight:900;letter-spacing:-0.5px;">${effectiveLogoText}</span>`;
            return `<div style="background:${bg};${pad(p.padding)}text-align:${p.align || "center"};">${inner}</div>`;
        }
        case "header": {
            return `<div style="background:${p.bgColor || "#ffffff"};${pad(p.padding)}text-align:${p.align || "center"};"><div style="margin:0;font-size:${p.fontSize || 22}px;font-weight:800;color:${p.color || "#1A1A2E"};line-height:1.2;">${p.text || ""}</div></div>`;
        }
        case "text": {
            return `<div style="background:${p.bgColor || "#ffffff"};${pad(p.padding)}"><p style="margin:0;font-size:${p.fontSize || 15}px;color:${p.color || "#5C6880"};line-height:${p.lineHeight || 1.8};text-align:${p.align || "left"};white-space:pre-wrap;">${(p.content || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p></div>`;
        }
        case "button": {
            const bg = p.bgColor || gs.accentColor;
            const tc = p.textColor || "#ffffff";
            const lbl = p.label || "Click Here";
            const url = p.url || "#";
            const fs = p.fontSize || 15;
            return `<div style="background:${p.bgColor2 || "#ffffff"};${pad(p.padding)}text-align:${p.align || "center"};"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:46px;v-text-anchor:middle;width:200px;" arcsize="22%" stroke="f" fillcolor="${bg}"><w:anchorlock/><center style="color:${tc};font-family:Cairo,Arial,sans-serif;font-size:${fs}px;font-weight:bold;">${lbl}</center></v:roundrect><![endif]--><!--[if !mso]><!--><a href="${url}" style="display:inline-block;background:${bg};color:${tc};font-weight:700;padding:13px 30px;border-radius:${p.borderRadius || 10}px;text-decoration:none;font-size:${fs}px;mso-hide:all;">${lbl}</a><!--<![endif]--></div>`;
        }
        case "image": {
            if (!p.url)
                return `<div style="background:#F4F7FD;${pad(p.padding)}text-align:center;"><span style="color:#aaa;font-size:12px;">Image placeholder — enter URL in properties</span></div>`;
            return `<div style="${pad(p.padding)}text-align:${p.align || "center"};"><img src="${p.url}" alt="${p.alt || ""}" style="width:${p.width || "100%"};max-width:100%;border-radius:${p.borderRadius || 0}px;display:inline-block;" /></div>`;
        }
        case "columns": {
            const bg = p.bgColor || "#ffffff";
            return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};"><tr><td style="width:50%;padding:${p.padding || 16}px 16px ${p.padding || 16}px 32px;vertical-align:top;font-size:${p.fontSize || 14}px;color:${p.color || "#5C6880"};line-height:1.6;">${p.leftContent || ""}</td><td style="width:50%;padding:${p.padding || 16}px 32px ${p.padding || 16}px 16px;vertical-align:top;font-size:${p.fontSize || 14}px;color:${p.color || "#5C6880"};line-height:1.6;">${p.rightContent || ""}</td></tr></table>`;
        }
        case "divider": {
            return `<div style="padding:${p.margin || 16}px 32px;"><hr style="border:none;border-top:${p.thickness || 1}px solid ${p.color || "#DDE4F0"};margin:0;" /></div>`;
        }
        case "spacer": {
            return `<div style="height:${p.height || 24}px;font-size:1px;line-height:1px;">&nbsp;</div>`;
        }
        case "table": {
            let rows: string[][] = [];
            try {
                rows = JSON.parse(p.rows || "[]");
            }
            catch { }
            const rowsHtml = rows.map((r, i) => {
                const style = i === 0
                    ? `style="font-weight:700;color:${p.titleColor || "#003C87"};font-size:12px;text-transform:uppercase;letter-spacing:1.5px;"`
                    : `style="border-top:1px solid #DDE4F0;"`;
                return `<tr ${style}><td style="padding:8px 0;color:#5C6880;font-size:13px;">${r[0] || ""}</td><td style="padding:8px 0;font-weight:600;color:#1A1A2E;font-size:13px;">${r[1] || ""}</td></tr>`;
            }).join("");
            return `<div style="padding:8px 32px;"><div style="background:${p.bgColor || "#F4F7FD"};border-radius:10px;padding:20px 24px;border:1px solid #DDE4F0;"><p style="font-weight:700;color:${p.titleColor || "#003C87"};font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">${p.title || "Details"}</p><table style="width:100%;border-collapse:collapse;">${rowsHtml}</table></div></div>`;
        }
        case "footer": {
            // Use block's own links if set, otherwise fall back to global settings footerLinks
            const effectiveLinks = p.links || gs.footerLinks || "";
            const links = effectiveLinks.split(",").filter(Boolean).map(l => {
                const [label, url] = l.split("|");
                return `<a href="${gs.siteUrl}${url || ""}" style="color:${gs.primaryColor};text-decoration:none;font-size:11px;">${label || ""}</a>`;
            }).join(" &nbsp;·&nbsp; ");
            // Use block's own text if set, otherwise fall back to global settings footerText
            const effectiveText = p.text || gs.footerText || "";
            return `<div style="background:${p.bgColor || "#F4F7FD"};padding:${p.padding || 20}px 32px;text-align:${p.align || "center"};border-top:1px solid #DDE4F0;"><p style="margin:0 0 6px;color:${p.color || "#5C6880"};font-size:${p.fontSize || 12}px;">${effectiveText}</p>${links ? `<p style="margin:4px 0 0;">${links}</p>` : ""}</div>`;
        }
        default: return "";
    }
}
function blocksToHtml(blocks: Block[], subject: string, gs: EmailSettings): string {
    const body = blocks.map(b => blockToHtml(b, gs)).join("\n");
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${subject}</title></head>
<body style="margin:0;padding:40px 0;background:${gs.bgColor};font-family:${gs.fontFamily};">
<div style="max-width:600px;margin:0 auto;background:${gs.cardBg};border-radius:16px;overflow:hidden;border:1px solid #DDE4F0;">
${body}
</div>
</body></html>`;
}
// ── Default blocks per template ───────────────────────────────
function getDefaultBlocks(id: string): Block[] {
    const logo: Block = { id: uid(), type: "logo", props: { ...DEFAULTS.logo } };
    const footer: Block = { id: uid(), type: "footer", props: { ...DEFAULTS.footer } };
    const maps: Record<string, Block[]> = {
        donation_receipt: [
            logo,
            { id: uid(), type: "header", props: { ...DEFAULTS.header, text: "Thank you for your donation! 💙" } },
            { id: uid(), type: "text", props: { ...DEFAULTS.text, content: "Dear {{donorName}},\n\nYour donation has been received successfully. May God bless your generosity and support for those in need." } },
            { id: uid(), type: "table", props: { ...DEFAULTS.table, title: "Donation Details", rows: JSON.stringify([["Field", "Value"], ["Receipt No.", "{{receiptNumber}}"], ["Amount", "{{amount}}"], ["Type", "{{type}}"], ["Campaign", "{{campaign}}"], ["Date", "{{date}}"]]) } },
            { id: uid(), type: "text", props: { ...DEFAULTS.text, content: "Your donation goes directly to those in need. You will receive periodic updates on the impact of your donation.", fontSize: "14" } },
            { id: uid(), type: "button", props: { ...DEFAULTS.button, label: "Browse Campaigns", url: "{{siteUrl}}/campaigns" } },
            footer,
        ],
        admin_donation: [
            logo,
            { id: uid(), type: "header", props: { ...DEFAULTS.header, text: "💰 New Donation Received!" } },
            { id: uid(), type: "table", props: { ...DEFAULTS.table, title: "Donation Details", rows: JSON.stringify([["Field", "Value"], ["Donor", "{{donorName}}"], ["Email", "{{donorEmail}}"], ["Amount", "{{amount}}"], ["Gateway", "{{provider}}"], ["Campaign", "{{campaign}}"], ["Receipt", "{{receiptNumber}}"]]) } },
            { id: uid(), type: "button", props: { ...DEFAULTS.button, label: "View Donations", url: "{{siteUrl}}/admin/donations" } },
            footer,
        ],
        newsletter_welcome: [
            logo,
            { id: uid(), type: "header", props: { ...DEFAULTS.header, text: "Welcome to Destekol Newsletter! 💌" } },
            { id: uid(), type: "text", props: { ...DEFAULTS.text, content: "Thank you for subscribing to our newsletter.\n\nYou'll receive the latest news about our humanitarian campaigns and field impact reports directly in your inbox.", align: "center" } },
            { id: uid(), type: "button", props: { ...DEFAULTS.button, label: "Explore Current Campaigns", url: "{{siteUrl}}/campaigns" } },
            { id: uid(), type: "divider", props: { ...DEFAULTS.divider } },
            { id: uid(), type: "text", props: { ...DEFAULTS.text, content: "To unsubscribe at any time, click here: {{unsubscribeUrl}}", fontSize: "12", color: "#aaa", align: "center" } },
            footer,
        ],
        contact_notification: [
            logo,
            { id: uid(), type: "header", props: { ...DEFAULTS.header, text: "📩 New Contact Message" } },
            { id: uid(), type: "table", props: { ...DEFAULTS.table, title: "Sender Details", rows: JSON.stringify([["Field", "Value"], ["Name", "{{senderName}}"], ["Email", "{{senderEmail}}"], ["Subject", "{{subject}}"]]) } },
            { id: uid(), type: "text", props: { ...DEFAULTS.text, content: "{{message}}", bgColor: "#F4F7FD" } },
            { id: uid(), type: "button", props: { ...DEFAULTS.button, label: "Reply to Message", url: "mailto:{{senderEmail}}" } },
            footer,
        ],
        donor_register: [
            logo,
            { id: uid(), type: "header", props: { ...DEFAULTS.header, text: "Welcome to Destekol! 🎉" } },
            { id: uid(), type: "text", props: { ...DEFAULTS.text, content: "Hello {{donorName}},\n\nYour account has been created successfully. Please verify your email address to activate your account and start making a difference." } },
            { id: uid(), type: "button", props: { ...DEFAULTS.button, label: "Verify Email Address", url: "{{verifyUrl}}" } },
            { id: uid(), type: "text", props: { ...DEFAULTS.text, content: "If you did not create this account, you can safely ignore this email.", fontSize: "13", color: "#aaa", align: "center" } },
            footer,
        ],
        email_verification: [
            logo,
            { id: uid(), type: "header", props: { ...DEFAULTS.header, text: "Verify Your Email Address ✉️" } },
            { id: uid(), type: "text", props: { ...DEFAULTS.text, content: "Hello {{donorName}},\n\nClick the button below to verify your email address. This link will expire in 24 hours." } },
            { id: uid(), type: "button", props: { ...DEFAULTS.button, label: "Verify Email Address", url: "{{verifyUrl}}" } },
            { id: uid(), type: "text", props: { ...DEFAULTS.text, content: "If you did not create an account on Destekol, please ignore this email.", fontSize: "13", color: "#aaa", align: "center" } },
            footer,
        ],
        password_reset: [
            logo,
            { id: uid(), type: "header", props: { ...DEFAULTS.header, text: "Reset Your Password 🔒" } },
            { id: uid(), type: "text", props: { ...DEFAULTS.text, content: "Hello {{donorName}},\n\nWe received a request to reset your password. Click the button below to set a new password. This link expires in {{expiryHours}} hours." } },
            { id: uid(), type: "button", props: { ...DEFAULTS.button, label: "Reset Password", url: "{{resetUrl}}" } },
            { id: uid(), type: "text", props: { ...DEFAULTS.text, content: "If you did not request a password reset, you can safely ignore this email. Your account is secure.", fontSize: "13", color: "#aaa", align: "center" } },
            footer,
        ],
        subscription_cancelled: [
            logo,
            { id: uid(), type: "header", props: { ...DEFAULTS.header, text: "Subscription Cancelled" } },
            { id: uid(), type: "text", props: { ...DEFAULTS.text, content: "Hello {{donorName}},\n\nYour monthly donation of {{amount}} to \"{{campaignName}}\" has been cancelled as requested.\n\nThank you for your past support. You can always start a new donation whenever you're ready." } },
            { id: uid(), type: "button", props: { ...DEFAULTS.button, label: "Donate Again", url: "{{siteUrl}}/campaigns" } },
            footer,
        ],
    };
    return maps[id] || [logo, { id: uid(), type: "text", props: { ...DEFAULTS.text } }, footer];
}
// ── Upload Button ─────────────────────────────────────────────
function UploadBtn({ onUploaded }: {
    onUploaded: (url: string) => void;
}) {
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const ref = useRef<HTMLInputElement>(null);
    async function handle(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setBusy(true);
        setErr("");
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await adminFetch("/api/admin/upload", { method: "POST", body: fd });
            const d = await res.json();
            if (d.url)
                onUploaded(d.url);
            else
                setErr(d.error || "Upload failed — check Supabase Storage 'media' bucket");
        }
        catch {
            setErr("Error");
        }
        finally {
            setBusy(false);
            if (ref.current)
                ref.current.value = "";
        }
    }
    return (<div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handle}/>
      <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="flex items-center gap-1.5 text-[10px] border border-gray-200 text-gray-500 rounded-lg px-2.5 py-1.5 hover:border-blue-400 hover:text-blue-500 transition disabled:opacity-50 w-full justify-center mt-1">
        <Icon name="image" size={11}/>
        {busy ? "Uploading…" : "Upload Image"}
      </button>
      {err && <p className="text-[9px] text-red-400 mt-1">{err}</p>}
    </div>);
}
// ── Preview block ─────────────────────────────────────────────
function BlockCanvas({ block, selected, onClick, gs, demoVars }: {
    block: Block;
    selected: boolean;
    onClick: () => void;
    gs: EmailSettings;
    demoVars: Record<string, string>;
}) {
    function applyVars(s: string) { return s.replace(/\{\{(\w+)\}\}/g, (_, k) => demoVars[k] || `{{${k}}}`); }
    const html = blockToHtml({ ...block, props: Object.fromEntries(Object.entries(block.props).map(([k, v]) => [k, applyVars(v)])) }, gs);
    return (<div onClick={e => { e.stopPropagation(); onClick(); }} className={`relative group cursor-pointer transition-all ${selected ? "outline outline-2 outline-blue-500 outline-offset-1" : "hover:outline hover:outline-1 hover:outline-blue-300 hover:outline-offset-1"}`}>
      {selected && (<div className="absolute -top-5 left-0 bg-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-t z-10 uppercase tracking-wider">
          {block.type}
        </div>)}
      <div dangerouslySetInnerHTML={{ __html: html }}/>
    </div>);
}
// ── Props panel ───────────────────────────────────────────────
function PropField({ label, value, onChange, type = "text" }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: "text" | "color" | "textarea" | "number" | "url";
}) {
    const base = "w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 px-2.5 text-[11px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono";
    return (<div className="mb-2.5">
      <label className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</label>
      {type === "textarea" ? (<textarea value={value} onChange={e => onChange(e.target.value)} rows={4} className={`${base} resize-y`}/>) : type === "color" ? (<div className="flex gap-2 items-center">
          <input type="color" value={value || "#000000"} onChange={e => onChange(e.target.value)} className="w-7 h-7 rounded border border-gray-200 cursor-pointer shrink-0"/>
          <input type="text" value={value} onChange={e => onChange(e.target.value)} className={base}/>
        </div>) : (<input type={type} value={value} onChange={e => onChange(e.target.value)} className={base}/>)}
    </div>);
}
function BlockProps({ block, onChange }: {
    block: Block;
    onChange: (p: Record<string, string>) => void;
}) {
    const p = block.props;
    const upd = (k: string, v: string) => onChange({ ...p, [k]: v });
    return (<div className="p-3 overflow-y-auto flex-1 text-left">
      {block.type === "logo" && <><PropField label="Logo Image URL" value={p.logoUrl || ""} onChange={v => upd("logoUrl", v)}/><UploadBtn onUploaded={v => upd("logoUrl", v)}/><PropField label="Logo Text (if no image)" value={p.logoText || ""} onChange={v => upd("logoText", v)}/><PropField label="Logo Width (px)" value={p.logoWidth || ""} onChange={v => upd("logoWidth", v)} type="number"/><PropField label="Background Color" value={p.bgColor || ""} onChange={v => upd("bgColor", v)} type="color"/><PropField label="Alignment" value={p.align || "center"} onChange={v => upd("align", v)}/><PropField label="Padding (px)" value={p.padding || ""} onChange={v => upd("padding", v)} type="number"/></>}
      {block.type === "header" && <><PropField label="Heading Text" value={p.text || ""} onChange={v => upd("text", v)} type="textarea"/><PropField label="Font Size (px)" value={p.fontSize || ""} onChange={v => upd("fontSize", v)} type="number"/><PropField label="Text Color" value={p.color || ""} onChange={v => upd("color", v)} type="color"/><PropField label="Background Color" value={p.bgColor || ""} onChange={v => upd("bgColor", v)} type="color"/><PropField label="Alignment" value={p.align || "center"} onChange={v => upd("align", v)}/><PropField label="Padding (px)" value={p.padding || ""} onChange={v => upd("padding", v)} type="number"/></>}
      {block.type === "text" && <><PropField label="Content" value={p.content || ""} onChange={v => upd("content", v)} type="textarea"/><PropField label="Font Size (px)" value={p.fontSize || ""} onChange={v => upd("fontSize", v)} type="number"/><PropField label="Text Color" value={p.color || ""} onChange={v => upd("color", v)} type="color"/><PropField label="Background Color" value={p.bgColor || ""} onChange={v => upd("bgColor", v)} type="color"/><PropField label="Alignment (left/center/right)" value={p.align || "left"} onChange={v => upd("align", v)}/><PropField label="Line Height" value={p.lineHeight || "1.8"} onChange={v => upd("lineHeight", v)}/><PropField label="Padding (px)" value={p.padding || ""} onChange={v => upd("padding", v)} type="number"/></>}
      {block.type === "button" && <><PropField label="Button Label" value={p.label || ""} onChange={v => upd("label", v)}/><PropField label="URL / Link" value={p.url || ""} onChange={v => upd("url", v)}/><PropField label="Button Color" value={p.bgColor || ""} onChange={v => upd("bgColor", v)} type="color"/><PropField label="Text Color" value={p.textColor || ""} onChange={v => upd("textColor", v)} type="color"/><PropField label="Container BG Color" value={p.bgColor2 || ""} onChange={v => upd("bgColor2", v)} type="color"/><PropField label="Border Radius (px)" value={p.borderRadius || ""} onChange={v => upd("borderRadius", v)} type="number"/><PropField label="Font Size (px)" value={p.fontSize || ""} onChange={v => upd("fontSize", v)} type="number"/><PropField label="Alignment" value={p.align || "center"} onChange={v => upd("align", v)}/><PropField label="Padding (px)" value={p.padding || ""} onChange={v => upd("padding", v)} type="number"/></>}
      {block.type === "image" && <><PropField label="Image URL" value={p.url || ""} onChange={v => upd("url", v)}/><UploadBtn onUploaded={v => upd("url", v)}/><PropField label="Alt Text" value={p.alt || ""} onChange={v => upd("alt", v)}/><PropField label="Width (e.g. 100%)" value={p.width || ""} onChange={v => upd("width", v)}/><PropField label="Border Radius (px)" value={p.borderRadius || ""} onChange={v => upd("borderRadius", v)} type="number"/><PropField label="Alignment" value={p.align || "center"} onChange={v => upd("align", v)}/><PropField label="Padding (px)" value={p.padding || ""} onChange={v => upd("padding", v)} type="number"/></>}
      {block.type === "columns" && <><PropField label="Left Column Content" value={p.leftContent || ""} onChange={v => upd("leftContent", v)} type="textarea"/><PropField label="Right Column Content" value={p.rightContent || ""} onChange={v => upd("rightContent", v)} type="textarea"/><PropField label="Background Color" value={p.bgColor || ""} onChange={v => upd("bgColor", v)} type="color"/><PropField label="Text Color" value={p.color || ""} onChange={v => upd("color", v)} type="color"/><PropField label="Font Size (px)" value={p.fontSize || ""} onChange={v => upd("fontSize", v)} type="number"/><PropField label="Padding (px)" value={p.padding || ""} onChange={v => upd("padding", v)} type="number"/></>}
      {block.type === "divider" && <><PropField label="Color" value={p.color || ""} onChange={v => upd("color", v)} type="color"/><PropField label="Thickness (px)" value={p.thickness || ""} onChange={v => upd("thickness", v)} type="number"/><PropField label="Margin (px)" value={p.margin || ""} onChange={v => upd("margin", v)} type="number"/></>}
      {block.type === "spacer" && <><PropField label="Height (px)" value={p.height || ""} onChange={v => upd("height", v)} type="number"/></>}
      {block.type === "table" && (() => {
            let rows: string[][] = [];
            try {
                rows = JSON.parse(p.rows || "[]");
            }
            catch { }
            function setRows(r: string[][]) { upd("rows", JSON.stringify(r)); }
            return (<>
            <PropField label="Section Title" value={p.title || ""} onChange={v => upd("title", v)}/>
            <PropField label="Background Color" value={p.bgColor || ""} onChange={v => upd("bgColor", v)} type="color"/>
            <PropField label="Title Color" value={p.titleColor || ""} onChange={v => upd("titleColor", v)} type="color"/>
            <div className="mb-2">
              <label className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Table Rows</label>
              <div className="space-y-1.5">
                {rows.map((row, i) => (<div key={i} className="flex gap-1 items-center">
                    <input value={row[0] || ""} onChange={e => { const r = [...rows]; r[i] = [e.target.value, r[i][1] || ""]; setRows(r); }} placeholder="Label" className="flex-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"/>
                    <input value={row[1] || ""} onChange={e => { const r = [...rows]; r[i] = [r[i][0] || "", e.target.value]; setRows(r); }} placeholder="Value / {{var}}" className="flex-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"/>
                    <button onClick={() => setRows(rows.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-[10px] px-1">✕</button>
                  </div>))}
              </div>
              <button onClick={() => setRows([...rows, ["", ""]])} className="mt-2 text-[10px] text-blue-500 hover:text-blue-700 font-semibold w-full text-center border border-dashed border-blue-200 rounded py-1 hover:bg-blue-50 transition">
                + Add Row
              </button>
            </div>
          </>);
        })()}
      {block.type === "footer" && <><PropField label="Footer Text" value={p.text || ""} onChange={v => upd("text", v)} type="textarea"/><PropField label="Links (Label|/url, comma-separated)" value={p.links || ""} onChange={v => upd("links", v)}/><PropField label="Text Color" value={p.color || ""} onChange={v => upd("color", v)} type="color"/><PropField label="Background Color" value={p.bgColor || ""} onChange={v => upd("bgColor", v)} type="color"/><PropField label="Font Size (px)" value={p.fontSize || ""} onChange={v => upd("fontSize", v)} type="number"/><PropField label="Alignment" value={p.align || "center"} onChange={v => upd("align", v)}/><PropField label="Padding (px)" value={p.padding || ""} onChange={v => upd("padding", v)} type="number"/></>}
    </div>);
}
// ── Global settings panel ─────────────────────────────────────
function GlobalSettings({ gs, onChange }: {
    gs: EmailSettings;
    onChange: (g: EmailSettings) => void;
}) {
    const upd = (k: keyof EmailSettings, v: string) => onChange({ ...gs, [k]: v });
    return (<div className="p-3 overflow-y-auto flex-1 text-left">
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">Brand Colors</p>
      <PropField label="Primary Color" value={gs.primaryColor} onChange={v => upd("primaryColor", v)} type="color"/>
      <PropField label="Accent Color (buttons)" value={gs.accentColor} onChange={v => upd("accentColor", v)} type="color"/>
      <PropField label="Email Background" value={gs.bgColor} onChange={v => upd("bgColor", v)} type="color"/>
      <PropField label="Card Background" value={gs.cardBg} onChange={v => upd("cardBg", v)} type="color"/>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3 mt-4">Logo</p>
      <PropField label="Logo Image URL" value={gs.logoUrl} onChange={v => upd("logoUrl", v)}/>
      <UploadBtn onUploaded={v => upd("logoUrl", v)}/>
      <PropField label="Logo Text (if no image)" value={gs.logoText} onChange={v => upd("logoText", v)}/>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3 mt-4">Site</p>
      <PropField label="Site URL" value={gs.siteUrl} onChange={v => upd("siteUrl", v)}/>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3 mt-4">Footer</p>
      <PropField label="Footer Text (copyright line)" value={gs.footerText} onChange={v => upd("footerText", v)} type="textarea"/>
      <PropField label="Footer Links (Label|/url, comma-separated)" value={gs.footerLinks} onChange={v => upd("footerLinks", v)}/>
      <PropField label="Font Family" value={gs.fontFamily} onChange={v => upd("fontFamily", v)}/>
    </div>);
}
// ── Main ──────────────────────────────────────────────────────
export default function EmailEditorPage() {
    const [activeId, setActiveId] = useState(TEMPLATES[0].id);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [subject, setSubject] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [mode, setMode] = useState<"design" | "preview" | "html">("design");
    const [htmlCode, setHtmlCode] = useState("");
    const [gs, setGs] = useState<EmailSettings>(DEFAULT_SETTINGS);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState("");
    const [isDirty, setIsDirty] = useState(false);
    const [testEmail, setTestEmail] = useState("");
    const [sending, setSending] = useState(false);
    const [testError, setTestError] = useState("");
    const [saveError, setSaveError] = useState("");
    const [rightPanel, setRightPanel] = useState<"props" | "vars">("props");
    const [gsOpen, setGsOpen] = useState(false);
    const [savedTemplates, setSavedTemplates] = useState<Set<string>>(new Set());
    const [loadingTemplate, setLoadingTemplate] = useState(false);
    const [applyingAll, setApplyingAll] = useState(false);
    const tpl = TEMPLATES.find(t => t.id === activeId)!;
    const demoVars: Record<string, string> = {
        donorName: "John Smith", amount: "$50", receiptNumber: "4R-20260712-A1B2",
        campaign: "Humanitarian Relief", date: "12/07/2026", type: "One-time",
        donorEmail: "john@example.com", provider: "Stripe",
        senderName: "Jane Doe", senderEmail: "jane@example.com",
        message: "I'd like to ask about the campaign...", subject: "Inquiry",
        email: "user@example.com", unsubscribeUrl: "#",
        verifyUrl: "https://destekol.org/verify-email?token=xxx",
        resetUrl: "https://destekol.org/reset-password?token=xxx",
        expiryHours: "24", campaignName: "Humanitarian Relief", siteUrl: "https://destekol.org",
    };
    useEffect(() => {
        setLoadingTemplate(true);
        adminFetch(`/api/admin/email-templates?id=${activeId}`)
            .then(r => r.json())
            .then(d => {
            if (d.template) {
                setSavedTemplates(p => new Set([...p, activeId]));
                setSubject(d.template.subject || "");
                const savedBlocks = d.template.blocks ? JSON.parse(d.template.blocks) : null;
                if (savedBlocks?.length) {
                    setBlocks(savedBlocks);
                }
                else {
                    setBlocks(getDefaultBlocks(activeId));
                }
                if (d.template.gs) {
                    try {
                        setGs({ ...DEFAULT_SETTINGS, ...JSON.parse(d.template.gs) });
                    }
                    catch { }
                }
            }
            else {
                setBlocks(getDefaultBlocks(activeId));
                const tplInfo = TEMPLATES.find(t => t.id === activeId);
                setSubject(tplInfo?.label || activeId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
            }
            setSelectedId(null);
            setIsDirty(false);
            setLoadingTemplate(false);
        })
            .catch(() => { setBlocks(getDefaultBlocks(activeId)); setLoadingTemplate(false); });
    }, [activeId]);
    useEffect(() => {
        setHtmlCode(blocksToHtml(blocks, subject, gs));
    }, [blocks, subject, gs]);
    const selectedBlock = blocks.find(b => b.id === selectedId) || null;
    function addBlock(type: BType) {
        const nb: Block = { id: uid(), type, props: { ...DEFAULTS[type] } };
        const idx = blocks.findIndex(b => b.id === selectedId);
        const nb2 = [...blocks];
        nb2.splice(idx === -1 ? blocks.length : idx + 1, 0, nb);
        setBlocks(nb2);
        setSelectedId(nb.id);
        setIsDirty(true);
    }
    function delBlock(id: string) { setBlocks(b => b.filter(x => x.id !== id)); setSelectedId(null); setIsDirty(true); }
    function moveBlock(id: string, dir: "up" | "down") {
        const arr = [...blocks];
        const i = arr.findIndex(b => b.id === id);
        const j = dir === "up" ? i - 1 : i + 1;
        if (j < 0 || j >= arr.length)
            return;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        setBlocks(arr);
        setIsDirty(true);
    }
    function updBlock(id: string, props: Record<string, string>) {
        setBlocks(b => b.map(x => x.id === id ? { ...x, props } : x));
        setIsDirty(true);
    }
    const save = useCallback(async () => {
        setSaving(true);
        setSaveError("");
        try {
            const res = await adminFetch("/api/admin/email-templates", {
                method: "POST",
                body: JSON.stringify({ id: activeId, subject, html: htmlCode, blocks, gs: JSON.stringify(gs) }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                setSaveError(d.error || "Save failed");
            }
            else {
                setSavedAt(new Date().toLocaleTimeString());
                setSaveError("");
                setIsDirty(false);
                setSavedTemplates(p => new Set([...p, activeId]));
            }
        }
        catch {
            setSaveError("Network error — check connection");
        }
        setSaving(false);
    }, [activeId, subject, htmlCode, blocks, gs]);
    // beforeunload warning for unsaved changes
    useEffect(() => {
        function onBeforeUnload(e: BeforeUnloadEvent) {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        }
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [isDirty]);
    // Ctrl+S / Cmd+S to save
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                if (isDirty)
                    save();
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isDirty, save]);
    async function sendTest() {
        if (!testEmail)
            return;
        setSending(true);
        setTestError("");
        try {
            const res = await adminFetch("/api/admin/email-templates/test", {
                method: "POST",
                body: JSON.stringify({ id: activeId, email: testEmail, html: htmlCode, subject }),
            });
            const d = await res.json();
            if (d.ok) {
                setSavedAt("Test sent to " + testEmail + "!");
            }
            else {
                setTestError(d.error || "Failed to send — check SMTP settings");
            }
        }
        catch {
            setTestError("Network error");
        }
        setSending(false);
    }
    const groups = [...new Set(TEMPLATES.map(t => t.group))];
    const blockGroups = [...new Set(BLOCK_META.map(b => b.group))];
    return (<div className="flex flex-col" style={{ height: "calc(100vh - 56px)" }}>

      {/* Top toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-200 shrink-0 flex-wrap">
        <h1 className="font-bold text-gray-800 text-sm mr-1">Email Templates</h1>

        {/* Template selector grouped */}
        <select value={activeId} onChange={e => {
            if (isDirty && !confirm("You have unsaved changes. Switch template anyway?"))
                return;
            setActiveId(e.target.value);
            setIsDirty(false);
        }} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400">
          {groups.map(g => (<optgroup key={g} label={g}>
              {TEMPLATES.filter(t => t.group === g).map(t => (<option key={t.id} value={t.id}>{savedTemplates.has(t.id) ? "✓ " : ""}{t.label}</option>))}
            </optgroup>))}
        </select>

        {/* Mode */}
        <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
          {(["design", "preview", "html"] as const).map(m => (<button key={m} onClick={() => {
                if (mode === "html" && m === "design" && isDirty) {
                    if (!confirm("Switching to Design mode will regenerate HTML from blocks. Any manual HTML changes will be lost. Continue?"))
                        return;
                    // Re-sync blocks HTML
                    setHtmlCode(blocksToHtml(blocks, subject, gs));
                }
                setMode(m);
            }} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition capitalize ${mode === m ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
              {m}
            </button>))}
        </div>

        {/* Global settings */}
        <button onClick={() => setGsOpen(v => !v)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition ${gsOpen ? "border-blue-400 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
          <Icon name="settings" size={12}/> Email Settings
        </button>

        <div className="ms-auto flex items-center gap-2">
          {isDirty && <span className="flex items-center gap-1 text-xs text-amber-500 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block"/>Unsaved</span>}
          {savedAt && <span className="text-xs text-green-600 font-semibold">✓ Saved {savedAt}</span>}
          {saveError && <span className="text-xs text-red-500 font-semibold">{saveError}</span>}
          {isDirty && <button onClick={() => { const tInfo = TEMPLATES.find(t => t.id === activeId); setBlocks(getDefaultBlocks(activeId)); setSubject(tInfo?.label || ""); setGs(DEFAULT_SETTINGS); setIsDirty(false); }} className="text-xs text-gray-400 hover:text-gray-600 transition">Reset</button>}
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 bg-blue-600 text-white font-semibold rounded-lg px-4 py-1.5 text-xs hover:bg-blue-700 disabled:opacity-50 transition">
            <Icon name="check" size={12}/> {saving ? "Saving…" : "Save Template"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">

        {/* LEFT — blocks + global settings */}
        {(mode === "design" || gsOpen) && (<div className="w-44 shrink-0 bg-white border-r border-gray-200 flex flex-col">
            {gsOpen ? (<>
                <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Settings</span>
                  <button onClick={() => setGsOpen(false)} aria-label="Close Settings" className="text-gray-400 hover:text-gray-600 p-0.5"><Icon name="x" size={12}/></button>
                </div>
                <GlobalSettings gs={gs} onChange={g => { setGs(g); setIsDirty(true); }}/>
                <div className="px-3 pb-3 border-t border-gray-100 pt-3">
                  <button onClick={async () => {
                    if (!confirm("Apply these color and logo settings to ALL 8 templates? Existing block content will be preserved."))
                        return;
                    setApplyingAll(true);
                    let errors = 0;
                    for (const tplItem of TEMPLATES) {
                        try {
                            // Fetch existing blocks from DB ONCE to preserve content
                            let tplBlocks: Block[] | null = tplItem.id === activeId ? blocks : null;
                            let tplSubject = tplItem.id === activeId ? subject : tplItem.label;
                            if (tplItem.id !== activeId) {
                                const r = await adminFetch(`/api/admin/email-templates?id=${tplItem.id}`);
                                const d = await r.json();
                                if (d.template?.blocks) {
                                    try {
                                        tplBlocks = JSON.parse(d.template.blocks);
                                    }
                                    catch { }
                                }
                                if (d.template?.subject)
                                    tplSubject = d.template.subject;
                            }
                            if (!tplBlocks?.length)
                                tplBlocks = getDefaultBlocks(tplItem.id);
                            const tplHtml = blocksToHtml(tplBlocks, tplSubject, gs);
                            const res = await adminFetch("/api/admin/email-templates", { method: "POST", body: JSON.stringify({ id: tplItem.id, subject: tplSubject, html: tplHtml, blocks: tplBlocks, gs: JSON.stringify(gs) }) });
                            if (!res.ok)
                                errors++;
                        }
                        catch {
                            errors++;
                        }
                    }
                    setApplyingAll(false);
                    if (errors > 0)
                        setSaveError(`Applied with ${errors} error(s)`);
                    else {
                        setSavedAt("Settings applied to all 8 templates!");
                        setSavedTemplates(new Set(TEMPLATES.map(t => t.id)));
                    }
                }} disabled={applyingAll} className="w-full text-[10px] bg-blue-50 text-blue-600 border border-blue-200 rounded-lg py-1.5 hover:bg-blue-100 transition font-semibold disabled:opacity-50">
                    {applyingAll ? "Applying to all templates…" : "Apply settings to all templates"}
                  </button>
                </div>
              </>) : mode === "design" && (<>
                <div className="px-3 py-2.5 border-b border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Add Block</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-3">
                  {blockGroups.map(g => (<div key={g}>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider px-1 mb-1">{g}</p>
                      <div className="space-y-1">
                        {BLOCK_META.filter(b => b.group === g).map(bt => (<button key={bt.type} onClick={() => addBlock(bt.type)} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200 transition text-left">
                            <Icon name={bt.icon as any} size={12} className="shrink-0"/>
                            {bt.label}
                          </button>))}
                      </div>
                    </div>))}
                </div>
              </>)}
          </div>)}

        {/* CANVAS */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6" onClick={() => setSelectedId(null)}>
          {/* Subject */}
          {mode !== "html" && (<div className="max-w-[620px] mx-auto mb-3">
              <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2">
                <span className="text-[10px] text-gray-400 font-semibold shrink-0">Subject:</span>
                <input value={subject} onChange={e => { setSubject(e.target.value); setIsDirty(true); }} className="flex-1 text-xs text-gray-700 focus:outline-none" placeholder="Email subject line..."/>
              </div>
            </div>)}

          {/* Template info */}
          {mode !== "html" && (<div className="max-w-[620px] mx-auto mb-3 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">{tpl.desc}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-blue-500 font-semibold">{blocks.length} blocks</span>
                <button onClick={() => {
                // Use the same demoVars from component state for consistency
                const rendered = htmlCode.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => demoVars[k] || `{{${k}}}`);
                const w = window.open("", "_blank");
                if (w) {
                    w.document.write(rendered);
                    w.document.close();
                }
            }} className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Open preview
                </button>
              </div>
            </div>)}

          {mode === "design" && (<div className="max-w-[620px] mx-auto bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 relative">
              {loadingTemplate && (<div className="absolute inset-0 bg-white/80 flex items-center justify-center z-30 rounded-xl">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
                </div>)}
              {blocks.length === 0 ? (<div className="p-16 text-center text-gray-400 text-sm">
                  <Icon name="mail" size={32} className="mx-auto mb-3 opacity-20"/>
                  Add blocks from the left panel
                </div>) : blocks.map((block, idx) => (<div key={block.id} className="relative group">
                  <BlockCanvas block={block} selected={selectedId === block.id} onClick={() => setSelectedId(block.id)} gs={gs} demoVars={demoVars}/>
                  {selectedId === block.id && (<div className="absolute top-1 right-1 flex gap-0.5 z-20">
                      <button onClick={e => { e.stopPropagation(); moveBlock(block.id, "up"); }} disabled={idx === 0} className="w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center text-gray-400 hover:text-blue-500 disabled:opacity-20 transition text-[10px]">↑</button>
                      <button onClick={e => { e.stopPropagation(); moveBlock(block.id, "down"); }} disabled={idx === blocks.length - 1} className="w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center text-gray-400 hover:text-blue-500 disabled:opacity-20 transition text-[10px]">↓</button>
                      <button title="Duplicate" onClick={e => { e.stopPropagation(); const nb = { ...block, id: uid(), props: { ...block.props } }; const arr = [...blocks]; arr.splice(idx + 1, 0, nb); setBlocks(arr); setSelectedId(nb.id); setIsDirty(true); }} className="w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center text-gray-400 hover:text-green-500 transition text-[10px]">⧉</button>
                      <button onClick={e => { e.stopPropagation(); delBlock(block.id); }} aria-label="اسم الزر" className="w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition"><Icon name="x" size={9}/></button>
                    </div>)}
                </div>))}
            </div>)}

          {mode === "preview" && (<div className="max-w-[620px] mx-auto rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <iframe srcDoc={htmlCode.replace(/\{\{(\w+)\}\}/g, (_, k) => demoVars[k] || `{{${k}}}`)} className="w-full border-0" style={{ minHeight: 600 }} title="Email preview"/>
            </div>)}

          {mode === "html" && (<div className="max-w-[900px] mx-auto">
              <textarea value={htmlCode} onChange={e => { setHtmlCode(e.target.value); setIsDirty(true); }} className="w-full font-mono text-[11px] rounded-xl border border-gray-200 bg-white p-4 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-y" style={{ minHeight: 600 }}/>
            </div>)}

          {/* Test send */}
          <div className="max-w-[620px] mx-auto mt-4">
            <div className="bg-white rounded-xl border border-gray-200 p-3 flex gap-2 items-center">
              <Icon name="send" size={13} className="text-gray-400 shrink-0"/>
              <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="Send test email to..." className="flex-1 text-xs text-gray-600 focus:outline-none"/>
              <button onClick={sendTest} disabled={sending || !testEmail} className="flex items-center gap-1 bg-blue-600 text-white font-semibold rounded-lg px-3 py-1.5 text-xs hover:bg-blue-700 disabled:opacity-50 transition shrink-0">
                {sending ? "Sending…" : "Send Test"}
              </button>
            </div>
            {testError && <p className="text-[10px] text-red-500 mt-2 font-semibold">{testError}</p>}
          </div>
        </div>

        {/* RIGHT — props + variables */}
        {mode === "design" && (<div className="w-56 shrink-0 bg-white border-l border-gray-200 flex flex-col">
            {/* Tab */}
            <div className="flex border-b border-gray-100">
              {(["props", "vars"] as const).map(t => (<button key={t} onClick={() => setRightPanel(t)} className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition ${rightPanel === t ? "text-blue-600 border-b-2 border-blue-500" : "text-gray-400 hover:text-gray-600"}`}>
                  {t === "props" ? "Properties" : "Variables"}
                </button>))}
            </div>

            {rightPanel === "props" ? (selectedBlock ? (<>
                  <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-500 uppercase">{selectedBlock.type}</span>
                    <button onClick={() => setSelectedId(null)} aria-label="اسم الزر" className="text-gray-400 hover:text-gray-600 p-0.5"><Icon name="x" size={11}/></button>
                  </div>
                  <BlockProps block={selectedBlock} onChange={p => updBlock(selectedBlock.id, p)}/>
                </>) : (<div className="p-6 text-center text-gray-400 text-xs flex-1 flex items-center justify-center">
                  <div>
                    <Icon name="layers" size={24} className="mx-auto mb-2 opacity-30"/>
                    Click a block to edit its properties
                  </div>
                </div>)) : (<div className="p-3 overflow-y-auto flex-1">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-2">Available Variables</p>
                <p className="text-[9px] text-gray-400 mb-3">Click to copy · Use in any text block</p>
                <div className="space-y-1.5">
                  {tpl.vars.map(v => (<button key={v} onClick={() => navigator.clipboard?.writeText(`{{${v}}}`)} title={`Preview: ${demoVars[v] || v}`} className="w-full text-left px-2 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-mono hover:bg-blue-100 transition flex items-center justify-between group">
                      <span>{`{{${v}}}`}</span>
                      <span className="text-[9px] text-gray-400 group-hover:text-blue-400 truncate ml-1 max-w-[70px]">{demoVars[v] || ""}</span>
                    </button>))}
                </div>
              </div>)}
          </div>)}
      </div>
    </div>);
}
