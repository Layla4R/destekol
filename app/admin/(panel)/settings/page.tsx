"use client";
import UploadButton from "@/components/admin/UploadButton";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { useCallback,useEffect,useRef,useState } from "react";
interface Settings {
    siteName: string;
    logoText: string;
    logoImage: string;
    heroImage: string;
    contactEmail: string;
    contactPhone: string;
    whatsappNumber: string;
    facebookUrl: string;
    twitterUrl: string;
    instagramUrl: string;
    youtubeUrl: string;
    linkedinUrl: string;
    tiktokUrl: string;
    facebookPixelId: string;
    gaMeasurementId: string; // 🌟 إضافة حقل تتبع غوغل
    primaryColor: string;
    accentColor: string;
    heroSlides: string;
    socialPosition: string;
    enableStripe: boolean;
    enablePaypal: boolean;
    stripeSecretKey: string;
    stripePublishableKey: string;
    stripeWebhookSecret: string;
    paypalClientId: string;
    paypalClientSecret: string;
    paypalMode: string;
    defaultCurrency: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    smtpFrom: string;
    smtpFromName: string;
    smtpSecure: boolean;
}
const DEFAULTS: Settings = {
    siteName: "Destekol Charitable Non-Profit Association", logoText: "Destekol",
    logoImage: "", heroImage: "",
    contactEmail: "", contactPhone: "",
    whatsappNumber: "", facebookUrl: "", twitterUrl: "",
    instagramUrl: "", youtubeUrl: "", linkedinUrl: "", tiktokUrl: "",
    facebookPixelId: "",
    gaMeasurementId: "", // 🌟 القيمة الافتراضية لحقل غوغل
    primaryColor: "#0069D2", accentColor: "#F00F5A",
    heroSlides: "", socialPosition: "right",
    enableStripe: true, enablePaypal: true,
    stripeSecretKey: "", stripePublishableKey: "", stripeWebhookSecret: "",
    paypalClientId: "", paypalClientSecret: "", paypalMode: "sandbox", defaultCurrency: "usd",
    smtpHost: "my.mailbux.com", smtpPort: 587, smtpUser: "", smtpPassword: "",
    smtpFrom: "", smtpFromName: "Destekol Charitable Non-Profit Association", smtpSecure: false,
};
// Sanitize DB values — null → ""
function sanitize(raw: any): Settings {
    const s: any = { ...DEFAULTS };
    for (const k of Object.keys(DEFAULTS) as (keyof Settings)[]) {
        const v = raw?.[k];
        if (v === null || v === undefined) {
            s[k] = DEFAULTS[k];
        }
        else if (typeof DEFAULTS[k] === "boolean")
            s[k] = Boolean(v);
        else if (typeof DEFAULTS[k] === "number")
            s[k] = Number(v);
        else
            s[k] = String(v); // Empty string "" is kept as-is (intentional empty value)
    }
    return s;
}
const SMTP_PROVIDERS = [
    { label: "Gmail", host: "smtp.gmail.com", port: 587, secure: false },
    { label: "MAILBUX", host: "my.mailbux.com", port: 587, secure: false },
    { label: "Outlook", host: "smtp-mail.outlook.com", port: 587, secure: false },
    { label: "Yahoo", host: "smtp.mail.yahoo.com", port: 587, secure: false },
    { label: "Custom", host: "__custom__", port: 587, secure: false },
];
const KNOWN_HOSTS = SMTP_PROVIDERS.map(p => p.host).filter(h => h !== "__custom__");
// ── SecretInput — outside component to prevent focus loss ────
function SecretInput({ label, value, onChange, placeholder, hint }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    hint?: React.ReactNode;
}) {
    const [show, setShow] = useState(false);
    const ref = useRef<HTMLInputElement>(null);
    const inp = "w-full rounded-xl border border-line bg-dashbg py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 text-ink font-mono";
    return (<div>
      <label className="block text-xs text-muted font-semibold uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <input ref={ref} type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inp}/>
        <button type="button" tabIndex={-1} onClick={() => { setShow(v => !v); setTimeout(() => ref.current?.focus(), 0); }} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs font-bold select-none">
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {hint && <div className="mt-1">{hint}</div>}
    </div>);
}
function Toggle({ checked, onChange }: {
    checked: boolean;
    onChange: () => void;
}) {
    return (<button type="button" onClick={onChange} className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${checked ? "bg-brand" : "bg-line"}`}>
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform m-0.5 ${checked ? "translate-x-5" : "translate-x-0"}`}/>
    </button>);
}
function SectionHead({ icon, children }: {
    icon: Parameters<typeof Icon>[0]["name"];
    children: React.ReactNode;
}) {
    return (<h2 className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider text-muted border-b border-line pb-3 mb-0">
      <Icon name={icon} size={14}/> {children}
    </h2>);
}
export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const savedSettings = useRef<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [isDirty, setIsDirty] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [saveError, setSaveError] = useState("");
    const [smtpStatus, setSmtpStatus] = useState<{
        ok: boolean;
        msg: string;
    } | null>(null);
    const [smtpTesting, setSmtpTesting] = useState(false);
    const [testEmail, setTestEmail] = useState("");
    const [resetConfirm, setResetConfirm] = useState(false);
    const [savedAt, setSavedAt] = useState<string>("");
    useEffect(() => {
        adminFetch("/api/admin/settings")
            .then(r => r.json())
            .then(d => { const clean = sanitize(d.settings); setSettings(clean); savedSettings.current = clean; setLoading(false); })
            .catch(() => { setLoadError("Failed to load settings."); setLoading(false); });
    }, []);
    // Unsaved changes — warn on leave + Ctrl+S to save
    useEffect(() => {
        function onBeforeUnload(e: BeforeUnloadEvent) {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        }
        function onKeyDown(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                if (isDirty)
                    document.getElementById("settings-submit")?.click();
            }
        }
        window.addEventListener("beforeunload", onBeforeUnload);
        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("beforeunload", onBeforeUnload);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [isDirty]);
    const upd = useCallback((key: keyof Settings, value: any) => {
        setSettings(s => s ? { ...s, [key]: value } : s);
        setIsDirty(true);
    }, []);
    async function save(e: React.FormEvent) {
        e.preventDefault();
        if (!settings)
            return;
        setSaveStatus("saving");
        setSaveError("");
        try {
            // Guard smtpPort against NaN before saving
            const payload = { ...settings, smtpPort: isNaN(Number(settings.smtpPort)) ? 587 : Number(settings.smtpPort) };
            const res = await adminFetch("/api/admin/settings", {
                method: "PATCH", body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                setSaveError(d.error || "Failed to save settings.");
                setSaveStatus("error");
            }
            else {
                setSaveStatus("saved");
                setIsDirty(false);
                savedSettings.current = settings;
                setSavedAt(new Date().toLocaleTimeString());
                setTimeout(() => setSaveStatus("idle"), 2500);
                // Revalidate public pages to pick up new settings
                try {
                    await adminFetch("/api/revalidate", { method: "POST" });
                }
                catch { }
            }
        }
        catch {
            setSaveError("Network error — could not save.");
            setSaveStatus("error");
        }
    }
    async function testSmtp() {
        if (!settings)
            return;
        setSmtpTesting(true);
        setSmtpStatus(null);
        try {
            const res = await adminFetch("/api/admin/settings/test-smtp", {
                method: "POST",
                body: JSON.stringify({
                    host: settings.smtpHost, port: settings.smtpPort,
                    user: settings.smtpUser, password: settings.smtpPassword,
                    from: settings.smtpFrom || settings.smtpUser,
                    fromName: settings.smtpFromName, secure: settings.smtpSecure,
                    testTo: testEmail || undefined,
                }),
            });
            const d = await res.json();
            setSmtpStatus({ ok: d.ok, msg: d.message || d.error || "" });
        }
        catch {
            setSmtpStatus({ ok: false, msg: "Connection error — check credentials" });
        }
        finally {
            setSmtpTesting(false);
        }
    }
    const inp = "w-full rounded-xl border border-line bg-dashbg py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 text-ink";
    const lbl = "block text-xs text-muted font-semibold uppercase tracking-wider mb-1.5";
    // Stripe key type detection
    const stripeMode = settings?.stripeSecretKey?.startsWith("sk_live_") ? "live"
        : settings?.stripeSecretKey?.startsWith("sk_test_") ? "test"
            : null;
    // Active SMTP provider
    const activeSmtpHost = KNOWN_HOSTS.includes(settings?.smtpHost || "") ? settings?.smtpHost : "__custom__";
    if (loading)
        return (<div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-muted text-sm">Loading settings…</p>
      </div>
    </div>);
    if (loadError)
        return (<div className="p-8 text-center">
      <p className="text-danger mb-4">{loadError}</p>
      <button onClick={() => window.location.reload()} className="bg-brand text-white font-bold rounded-xl px-6 py-2.5 text-sm">Retry</button>
    </div>);
    if (!settings)
        return null;
    return (<div className="p-6 sm:p-8 max-w-5xl mx-auto w-full pb-24">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl font-extrabold text-ink">Settings</h1>
        {isDirty && (<span className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block"/>
            Unsaved changes
          </span>)}
      </div>
      <p className="text-muted text-sm mb-8">Site info, social links, payment gateways, and email server</p>

      <form onSubmit={save} className="space-y-6">

        {/* ── Site Info ── */}
        <section className="bg-white rounded-2xl border border-line p-6 space-y-4">
          <SectionHead icon="settings">Site Information</SectionHead>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className={lbl}>Site Name</label>
              <input value={settings.siteName} onChange={e => upd("siteName", e.target.value)} className={inp}/></div>
            <div><label className={lbl}>Logo Text (fallback)</label>
              <input value={settings.logoText} onChange={e => upd("logoText", e.target.value)} className={inp}/></div>
          </div>
          <div><label className={lbl}>Logo Image URL</label>
            <input value={settings.logoImage} onChange={e => upd("logoImage", e.target.value)} className={inp} placeholder="https://..."/>
            <UploadButton onUploaded={url => upd("logoImage", url)} className="mt-1"/>
            {settings.logoImage && <img src={settings.logoImage} alt="Logo" className="mt-2 h-12 object-contain"/>}
          </div>
          <div><label className={lbl}>Hero Background Image URL</label>
            <input value={settings.heroImage} onChange={e => upd("heroImage", e.target.value)} className={inp} placeholder="https://..."/>
            <UploadButton onUploaded={url => upd("heroImage", url)} className="mt-1"/>
            {settings.heroImage && <img src={settings.heroImage} alt="Hero" className="mt-2 rounded-xl h-24 w-full object-cover border border-line"/>}
          </div>
          <div>
            <label className={lbl}>Hero Slider — Slides (JSON)</label>
            <p className="text-xs text-muted mb-1.5">Each slide: {"{"}"image":"URL","title_ar":"...","title_en":"...","subtitle_ar":"...","subtitle_en":"..."{"}"}</p>
            <textarea value={settings.heroSlides} onChange={e => upd("heroSlides", e.target.value)} rows={4} className={inp + " resize-y font-mono text-xs"} placeholder='[{"image":"https://...","title_ar":"...","title_en":"...","subtitle_ar":"...","subtitle_en":"..."}]'/>
            <p className="text-xs text-muted mt-1">Leave empty to use the 3 default slides. Add up to 5 slides.</p>
          </div>
          <div>
            <label className={lbl}>Social Sidebar Position</label>
            <select value={settings.socialPosition} onChange={e => upd("socialPosition", e.target.value)} className={inp}>
              <option value="right">Right (Default)</option>
              <option value="left">Left</option>
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className={lbl}>Primary Color</label>
              <div className="flex gap-2 items-center"><input type="color" value={settings.primaryColor} onChange={e => upd("primaryColor", e.target.value)} className="w-8 h-8 rounded border border-line cursor-pointer shrink-0"/>
              <input value={settings.primaryColor} onChange={e => upd("primaryColor", e.target.value)} className={inp} placeholder="#0069D2"/></div></div>
            <div><label className={lbl}>Accent / Donate Color</label>
              <div className="flex gap-2 items-center"><input type="color" value={settings.accentColor} onChange={e => upd("accentColor", e.target.value)} className="w-8 h-8 rounded border border-line cursor-pointer shrink-0"/>
              <input value={settings.accentColor} onChange={e => upd("accentColor", e.target.value)} className={inp} placeholder="#F00F5A"/></div></div>
          </div>
        </section>

        {/* ── Contact & Social ── */}
        <section className="bg-white rounded-2xl border border-line p-6 space-y-4">
          <SectionHead icon="mail">Contact & Social</SectionHead>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className={lbl}>Contact Email</label>
              <input type="email" value={settings.contactEmail} onChange={e => upd("contactEmail", e.target.value)} className={inp}/></div>
            <div><label className={lbl}>Phone</label>
              <input value={settings.contactPhone} onChange={e => upd("contactPhone", e.target.value)} className={inp}/></div>
          </div>
          <div><label className={lbl}>WhatsApp (international, e.g. 201234567890)</label>
            <input value={settings.whatsappNumber} onChange={e => upd("whatsappNumber", e.target.value)} className={inp} placeholder="201234567890"/></div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
            { k: "facebookUrl", label: "Facebook", ph: "https://facebook.com/..." },
            { k: "twitterUrl", label: "Twitter / X", ph: "https://x.com/..." },
            { k: "instagramUrl", label: "Instagram", ph: "https://instagram.com/..." },
            { k: "youtubeUrl", label: "YouTube", ph: "https://youtube.com/@..." },
            { k: "linkedinUrl", label: "LinkedIn", ph: "https://linkedin.com/company/..." },
            { k: "tiktokUrl", label: "TikTok", ph: "https://tiktok.com/@..." },
        ].map(({ k, label, ph }) => (<div key={k}><label className={lbl}>{label}</label>
                <input value={(settings as any)[k]} onChange={e => upd(k as keyof Settings, e.target.value)} className={inp} placeholder={ph}/></div>))}
          </div>
        </section>

        {/* ── Analytics & Tracking ── */}
        <section className="bg-white rounded-2xl border border-line p-6 space-y-4">
          <SectionHead icon="globe">Analytics & Tracking</SectionHead>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Meta (Facebook) Pixel ID</label>
              <input value={settings.facebookPixelId || ""} onChange={e => upd("facebookPixelId", e.target.value)} className={inp + " font-mono"} placeholder="123456789012345"/>
              <p className="text-[11px] text-muted mt-1">
                Enter Meta Pixel ID for Facebook & Instagram ad tracking.
              </p>
            </div>
            <div>
              <label className={lbl}>Google Analytics 4 ID</label>
              <input value={settings.gaMeasurementId || ""} onChange={e => upd("gaMeasurementId", e.target.value)} className={inp + " font-mono"} placeholder="G-XXXXXXXXXX"/>
              <p className="text-[11px] text-muted mt-1">
                Enter GA4 Measurement ID (e.g. G-ABC123XYZ) for Google tracking.
              </p>
            </div>
          </div>
        </section>

        {/* ── Stripe ── */}
        <section className="bg-white rounded-2xl border border-line p-6 space-y-4">
          <div className="flex items-center justify-between">
            <SectionHead icon="wallet">Stripe</SectionHead>
            <div className="flex items-center gap-2 -mt-3">
              <span className="text-xs text-muted font-semibold">Enable</span>
              <Toggle checked={settings.enableStripe} onChange={() => upd("enableStripe", !settings.enableStripe)}/>
            </div>
          </div>

          {stripeMode === "live" && (<div className="bg-danger/8 border border-danger/25 rounded-xl p-3 text-xs text-danger font-semibold">
              🔴 Live mode — real card charges will be processed.
            </div>)}
          {stripeMode === "test" && (<div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-semibold">
              🧪 Test mode — no real charges. Use test cards only.
            </div>)}
          {settings.enableStripe && !settings.stripeSecretKey && (<div className="bg-danger/8 border border-danger/20 rounded-xl p-3 text-xs text-danger font-semibold">
              ⚠ Stripe is enabled but Secret Key is empty — card payments will fail.
            </div>)}
          {settings.enableStripe && settings.stripeSecretKey && !settings.stripePublishableKey && (<div className="bg-danger/8 border border-danger/20 rounded-xl p-3 text-xs text-danger font-semibold">
              ⚠ Publishable Key is empty — the checkout page will fail to load.
            </div>)}
          {!settings.enableStripe && (<div className="bg-warning/8 border border-warning/20 rounded-xl p-3 text-xs text-warning font-semibold">
              ⚠ Stripe is disabled — card payments will not work.
            </div>)}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
            Keys from <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener" className="underline font-semibold">dashboard.stripe.com/apikeys</a> ·
            Webhook from <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener" className="underline font-semibold">dashboard.stripe.com/webhooks</a>
            <br />Endpoint URL: <code className="bg-blue-100 px-1 rounded">/api/webhooks/stripe</code>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <SecretInput label="Secret Key (sk_...)" value={settings.stripeSecretKey} onChange={v => upd("stripeSecretKey", v)} placeholder="sk_live_..."/>
            <div><label className={lbl}>Publishable Key (pk_...)</label>
              <input value={settings.stripePublishableKey} onChange={e => upd("stripePublishableKey", e.target.value)} className={inp} placeholder="pk_live_..."/></div>
          </div>
          <SecretInput label="Webhook Secret (whsec_...)" value={settings.stripeWebhookSecret} onChange={v => upd("stripeWebhookSecret", v)} placeholder="whsec_..."/>
        </section>

        {/* ── PayPal ── */}
        <section className="bg-white rounded-2xl border border-line p-6 space-y-4">
          <div className="flex items-center justify-between">
            <SectionHead icon="wallet">PayPal</SectionHead>
            <div className="flex items-center gap-2 -mt-3">
              <span className="text-xs text-muted font-semibold">Enable</span>
              <Toggle checked={settings.enablePaypal} onChange={() => upd("enablePaypal", !settings.enablePaypal)}/>
            </div>
          </div>

          {!settings.enablePaypal && (<div className="bg-warning/8 border border-warning/20 rounded-xl p-3 text-xs text-warning font-semibold">
              ⚠ PayPal is disabled — PayPal payments will not work.
            </div>)}
          {settings.enablePaypal && !settings.paypalClientId && (<div className="bg-danger/8 border border-danger/20 rounded-xl p-3 text-xs text-danger font-semibold">
              ⚠ PayPal is enabled but Client ID is empty — PayPal payments will fail.
            </div>)}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
            Credentials from <a href="https://developer.paypal.com/dashboard/applications" target="_blank" rel="noopener" className="underline font-semibold">developer.paypal.com/dashboard</a>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className={lbl}>Client ID</label>
              <input value={settings.paypalClientId} onChange={e => upd("paypalClientId", e.target.value)} className={inp} placeholder="AaBbCc..."/></div>
            <SecretInput label="Client Secret" value={settings.paypalClientSecret} onChange={v => upd("paypalClientSecret", v)} placeholder="••••••••"/>
          </div>
          <div>
            <label className={lbl}>Mode</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="paypalMode" value="sandbox" checked={settings.paypalMode === "sandbox"} onChange={() => upd("paypalMode", "sandbox")} className="accent-brand"/>
                <span className="text-sm font-semibold text-muted">Sandbox (testing)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="paypalMode" value="live" checked={settings.paypalMode === "live"} onChange={() => upd("paypalMode", "live")} className="accent-brand"/>
                <span className="text-sm font-bold text-danger">Live (production) ⚠</span>
              </label>
            </div>
            {settings.paypalMode === "live" && (<div className="mt-2 bg-danger/8 border border-danger/20 rounded-xl p-3 text-xs text-danger font-semibold">
                🔴 Live mode — real money transactions will be processed.
              </div>)}
          </div>
          <div>
            <label className={lbl}>Default Currency</label>
            <select value={settings.defaultCurrency} onChange={e => upd("defaultCurrency", e.target.value)} className={inp}>
              <option value="usd">USD — US Dollar</option>
              <option value="eur">EUR — Euro</option>
              <option value="gbp">GBP — British Pound</option>
              <option value="aed">AED — UAE Dirham</option>
              <option value="sar">SAR — Saudi Riyal</option>
              <option value="kwd">KWD — Kuwaiti Dinar</option>
              <option value="qar">QAR — Qatari Riyal</option>
              <option value="egp">EGP — Egyptian Pound</option>
              <option value="try">TRY — Turkish Lira</option>
              <option value="cad">CAD — Canadian Dollar</option>
              <option value="aud">AUD — Australian Dollar</option>
            </select>
            <p className="text-xs text-muted mt-1">Used for all new donations. Existing donations keep their original currency.</p>
          </div>
        </section>

        {/* ── Email Server ── */}
        <section className="bg-white rounded-2xl border border-line p-6 space-y-4">
          <SectionHead icon="send">Email Server (SMTP)</SectionHead>

          {/* Provider presets */}
          <div>
            <p className={lbl}>Quick Setup</p>
            <div className="flex flex-wrap gap-2">
              {SMTP_PROVIDERS.map(p => (<button key={p.label} type="button" onClick={() => {
                if (p.host !== "__custom__") {
                    upd("smtpHost", p.host);
                    upd("smtpPort", p.port);
                    upd("smtpSecure", p.secure);
                }
            }} className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${activeSmtpHost === p.host ? "bg-brand text-white border-brand" : "border-line text-muted hover:border-brand hover:text-brand bg-white"}`}>
                  {p.label}
                </button>))}
            </div>
          </div>

          {/* Gmail instructions */}
          {settings.smtpHost === "smtp.gmail.com" && (<div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-2">
              <p className="font-bold text-sm">📌 Gmail Setup</p>
              <ol className="list-decimal list-inside space-y-1.5 text-amber-700">
                <li>Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noopener" className="underline font-semibold">myaccount.google.com/security</a></li>
                <li>Enable <strong>2-Step Verification</strong></li>
                <li>Search <strong>App Passwords</strong> → create one for "Mail"</li>
                <li>Username = your Gmail · Password = 16-char App Password (no spaces)</li>
                <li>From Email must match your Gmail address</li>
              </ol>
            </div>)}

          {settings.smtpHost === "my.mailbux.com" && (<div className="bg-brand/5 border border-brand/20 rounded-xl p-3 text-xs text-brand">
              <strong>MAILBUX:</strong> Port 587 (STARTTLS) or 465 (SSL) · Username = full email address
            </div>)}

          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className={lbl}>SMTP Host</label>
              <input value={settings.smtpHost} onChange={e => upd("smtpHost", e.target.value)} className={inp} placeholder="smtp.example.com"/></div>
            <div><label className={lbl}>Port</label>
              <select value={settings.smtpPort} onChange={e => { const p = Number(e.target.value); upd("smtpPort", p); upd("smtpSecure", p === 465); }} className={inp}>
                <option value={587}>587 — STARTTLS (recommended)</option>
                <option value={465}>465 — SSL/TLS</option>
                <option value={25}>25 — Plain (not recommended)</option>
              </select>
            </div>
          </div>
          {/* SSL override */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={settings.smtpSecure} onChange={e => upd("smtpSecure", e.target.checked)} className="w-4 h-4 accent-brand rounded"/>
            <span className="text-sm text-muted">Force SSL/TLS (smtpSecure)</span>
            <span className="text-xs text-muted/60">— auto-set by port, override manually if needed</span>
          </label>

          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className={lbl}>Username (full email)</label>
              <input type="email" value={settings.smtpUser} onChange={e => upd("smtpUser", e.target.value)} className={inp} placeholder="noreply@yourdomain.com"/></div>
            <SecretInput label="Password / App Password" value={settings.smtpPassword} onChange={v => upd("smtpPassword", v)} placeholder="••••••••"/>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>From Email</label>
              <input type="email" value={settings.smtpFrom} onChange={e => upd("smtpFrom", e.target.value)} className={inp} placeholder={settings.smtpUser || "noreply@yourdomain.com"}/>
              {!settings.smtpFrom && settings.smtpUser && (<p className="text-xs text-muted mt-1">Leaving empty will use <strong>{settings.smtpUser}</strong> as sender</p>)}
              {settings.smtpHost === "smtp.gmail.com" && settings.smtpFrom && settings.smtpUser && settings.smtpFrom !== settings.smtpUser && (<p className="text-xs text-warning mt-1 font-semibold">⚠ For Gmail, From Email must match your Gmail address</p>)}
            </div>
            <div><label className={lbl}>From Name</label>
              <input value={settings.smtpFromName} onChange={e => upd("smtpFromName", e.target.value)} className={inp}/></div>
          </div>

          {/* Test */}
          <div className="border-t border-line pt-4 space-y-3">
            <p className={lbl}>Test Connection</p>
            <div className="flex gap-2 flex-wrap">
              <input type="email" placeholder="Send test email to (optional)" value={testEmail} onChange={e => setTestEmail(e.target.value)} className={`${inp} flex-1 min-w-0`}/>
              <button type="button" onClick={testSmtp} disabled={smtpTesting || !settings.smtpUser || !settings.smtpPassword || !settings.smtpHost} className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl px-5 py-2.5 text-sm transition disabled:opacity-50 shrink-0">
                <Icon name="send" size={14}/>
                {smtpTesting ? "Testing…" : "Test Connection"}
              </button>
            </div>
            {smtpStatus && (<div className={`flex items-center gap-2 rounded-xl p-3 text-sm font-semibold border ${smtpStatus.ok ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"}`}>
                <Icon name={smtpStatus.ok ? "check" : "x"} size={16}/> {smtpStatus.msg}
              </div>)}
          </div>
        </section>

        {/* ── Danger Zone ── */}
        <section className="bg-white rounded-2xl border border-danger/30 p-6 space-y-3">
          <h2 className="font-bold text-danger flex items-center gap-2 text-xs uppercase tracking-wider">
            <Icon name="x" size={14}/> Danger Zone
          </h2>
          <p className="text-sm text-muted">Reset all settings to defaults. This cannot be undone.</p>
          {!resetConfirm ? (<button type="button" onClick={() => setResetConfirm(true)} className="border border-danger text-danger font-bold rounded-xl px-5 py-2.5 text-sm hover:bg-danger hover:text-white transition">
              Reset to Defaults
            </button>) : (<div className="flex items-center gap-3 p-3 bg-danger/5 border border-danger/20 rounded-xl flex-wrap">
              <p className="text-sm text-danger font-semibold flex-1">Are you sure? All settings will be lost.</p>
              <button type="button" onClick={async () => {
                const RESET = { ...DEFAULTS }; // Uses DEFAULTS — change DEFAULTS to update reset values
                const res = await adminFetch("/api/admin/settings", { method: "PATCH", body: JSON.stringify(RESET) });
                if (res.ok) {
                    setSettings(RESET);
                    setIsDirty(false);
                    savedSettings.current = RESET;
                }
                setResetConfirm(false);
            }} className="bg-danger text-white font-bold rounded-xl px-4 py-2 text-xs">Yes, Reset</button>
              <button type="button" onClick={() => setResetConfirm(false)} className="border border-line text-muted font-bold rounded-xl px-4 py-2 text-xs hover:text-ink">Cancel</button>
            </div>)}
        </section>

        {/* ── Sticky Save Bar ── */}
        <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-line px-8 py-4 flex items-center gap-4 transition-all ${isDirty || saveStatus !== "idle" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"}`}>
          {saveError && (<span className="text-danger text-sm font-semibold flex items-center gap-1.5">
              <Icon name="x" size={14}/> {saveError}
            </span>)}
          {isDirty && !saveError && (<span className="text-amber-600 text-xs font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block"/>
              Unsaved changes · <kbd className="text-xs bg-amber-100 px-1.5 py-0.5 rounded font-mono">⌘S</kbd>
            </span>)}
          {!isDirty && savedAt && !saveError && (<span className="text-muted text-xs">Last saved at {savedAt}</span>)}
          <div className="ms-auto flex items-center gap-3">
            {isDirty && (<button type="button" onClick={() => { if (savedSettings.current) {
            setSettings(savedSettings.current);
            setIsDirty(false);
            setSaveError("");
        } }} className="text-muted text-sm hover:text-ink transition">Discard</button>)}
            <button type="submit" id="settings-submit" disabled={saveStatus === "saving"} className="flex items-center gap-2 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold rounded-xl px-7 py-2.5 transition">
              <Icon name={saveStatus === "saved" ? "check" : "settings"} size={15}/>
              {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved!" : saveStatus === "error" ? "Retry" : "Save Settings"}
            </button>
          </div>
        </div>

      </form>
    </div>);
}
