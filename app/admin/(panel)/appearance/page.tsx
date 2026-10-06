"use client";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { useCallback,useEffect,useRef,useState } from "react";
// ── Image upload helper ───────────────────────────────────────
function UploadButton({ onUploaded, label = "Upload" }: {
    onUploaded: (url: string) => void;
    label?: string;
}) {
    const [uploading, setUploading] = useState(false);
    const [err, setErr] = useState("");
    const ref = useRef<HTMLInputElement>(null);
    async function handle(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setUploading(true);
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
            setErr("Network error during upload");
        }
        finally {
            setUploading(false);
            if (ref.current)
                ref.current.value = "";
        }
    }
    return (<>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handle}/>
      <button type="button" onClick={() => ref.current?.click()} disabled={uploading} className="flex items-center gap-1.5 text-[10px] border border-line text-muted rounded-lg px-2.5 py-1.5 hover:border-brand hover:text-brand transition disabled:opacity-50 mt-1">
        <Icon name="image" size={11}/>
        {uploading ? "Uploading…" : label}
      </button>
      {err && <p className="text-[10px] text-danger mt-1">{err}</p>}
    </>);
}
interface NavPage {
    id: string;
    slug: string;
    title: string;
    showInMenu: boolean;
    order: number;
}
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
    footerTagline: string;
    footerDescription: string;
    copyrightText: string;
    primaryColor: string;
    accentColor: string;
}
const DEFAULTS: Settings = {
    siteName: "Destekol Charitable Non-Profit Association", logoText: "Destekol",
    logoImage: "", heroImage: "",
    contactEmail: "", contactPhone: "", whatsappNumber: "",
    facebookUrl: "", twitterUrl: "", instagramUrl: "",
    youtubeUrl: "", linkedinUrl: "", tiktokUrl: "",
    footerTagline: "", footerDescription: "", copyrightText: "",
    primaryColor: "#0069D2", accentColor: "#F00F5A",
};
type ActiveSection = "logo" | "hero" | "nav" | "donate-btn" | "brand-colors" | "footer-brand" | "footer-links" | "footer-contact" | "footer-social" | "footer-copyright" | null;
type ViewMode = "header" | "footer";
type DeviceMode = "desktop" | "mobile";
// ── Inline editable text ────────────────────────────────────
function Editable({ value, onChange, className = "", tag = "span", placeholder = "Click to edit…", multiline = false }: {
    value: string;
    onChange: (v: string) => void;
    className?: string;
    tag?: "span" | "p" | "div" | "h2" | "h3";
    placeholder?: string;
    multiline?: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const ref = useRef<HTMLElement>(null);
    // Sync DOM when value changes externally (e.g. Discard)
    useEffect(() => {
        if (ref.current && !editing) {
            if (ref.current.innerText !== value) {
                ref.current.innerText = value;
            }
        }
    }, [value, editing]);
    function start(e: React.MouseEvent) {
        e.stopPropagation();
        setEditing(true);
        setTimeout(() => {
            if (!ref.current)
                return;
            ref.current.focus();
            const range = document.createRange();
            range.selectNodeContents(ref.current);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
        }, 10);
    }
    function done() {
        setEditing(false);
        if (ref.current)
            onChange(ref.current.innerText.trim());
    }
    const Tag = tag as any;
    // Use CSS data-placeholder so placeholder never pollutes innerText
    return (<Tag ref={ref} contentEditable={editing} suppressContentEditableWarning data-placeholder={placeholder} onClick={!editing ? start : (e: any) => e.stopPropagation()} onBlur={done} onKeyDown={(e: any) => {
            if (!multiline && e.key === "Enter") {
                e.preventDefault();
                done();
            }
            if (e.key === "Escape") {
                if (ref.current)
                    ref.current.innerText = value;
                setEditing(false);
            }
        }} title={!editing ? "Click to edit" : ""} className={`${className} ${!editing
            ? "cursor-text hover:outline hover:outline-2 hover:outline-brand/50 hover:outline-offset-1 rounded transition-all"
            : "outline outline-2 outline-brand outline-offset-1 rounded"} editable-field${!value?.trim() && !editing ? " empty-field" : ""}`}>
      {value}
    </Tag>);
}
// ── Clickable section with label badge ─────────────────────
function Section({ id, active, onActivate, children, label, className = "", primaryColor }: {
    id: ActiveSection;
    active: ActiveSection;
    onActivate: (id: ActiveSection) => void;
    children: React.ReactNode;
    label: string;
    className?: string;
    primaryColor?: string;
}) {
    const isActive = active === id;
    const color = primaryColor || "#0069D2";
    return (<div onClick={e => { e.stopPropagation(); onActivate(id); }} style={isActive ? { outline: `2px solid ${color}`, outlineOffset: "2px", borderRadius: "0.75rem" } : undefined} className={`relative group transition-all cursor-pointer ${className} ${!isActive ? "hover:rounded-xl" : ""}`}>
      {children}
      <div style={{ background: isActive ? color : `${color}b3` }} className={`absolute -top-5 left-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-t select-none pointer-events-none transition-opacity text-white ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
        {label}
      </div>
    </div>);
}
// ── Side panel ─────────────────────────────────────────────
function SectionPanel({ active, settings, upd, navPages, navLoading, toggleNav, reorderNav, onClose, setActive, setView }: {
    active: ActiveSection;
    settings: Settings;
    upd: (k: keyof Settings, v: string) => void;
    navPages: NavPage[];
    navLoading: Set<string>;
    toggleNav: (id: string, cur: boolean) => void;
    reorderNav: (id: string, dir: "up" | "down") => void;
    onClose: () => void;
    setActive: (s: ActiveSection) => void;
    setView: (v: ViewMode) => void;
}) {
    if (!active)
        return null;
    const inp = "w-full rounded-lg border border-line bg-white py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-ink";
    const lbl = "block text-[10px] text-muted font-bold uppercase tracking-wider mb-1";
    const TITLES: Record<NonNullable<ActiveSection>, string> = {
        "logo": "Logo", "hero": "Hero Image", "nav": "Navigation",
        "donate-btn": "Donate Button",
        "footer-brand": "Footer — Brand", "footer-links": "Footer — Links",
        "footer-contact": "Footer — Contact", "footer-social": "Footer — Social",
        "footer-copyright": "Footer — Copyright",
        "brand-colors": "Brand Colors",
    };
    return (<div className="w-72 shrink-0 bg-white border-l border-line flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-dashbg sticky top-0">
        <span className="text-xs font-bold text-ink uppercase tracking-wider">{TITLES[active]}</span>
        <button onClick={onClose} className="text-muted hover:text-ink transition p-1 rounded-lg hover:bg-line">
          <Icon name="x" size={14}/>
        </button>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto flex-1">

        {/* LOGO */}
        {active === "logo" && <>
          <div><label className={lbl}>Logo Image URL</label>
            <input value={settings.logoImage} onChange={e => upd("logoImage", e.target.value)} className={inp} placeholder="https://... or /brand/logo.png"/>
            <div className="flex gap-2 flex-wrap mt-1">
              <UploadButton onUploaded={v => upd("logoImage", v)} label="Upload Logo"/>
              {settings.logoImage && <button onClick={() => upd("logoImage", "")} className="text-[10px] text-danger hover:underline mt-1">✕ Remove</button>}
            </div>
            {settings.logoImage && <img src={settings.logoImage} className="mt-2 h-10 w-full object-contain bg-dashbg rounded border border-line p-1"/>}
          </div>
          <div><label className={lbl}>Logo Text (shown if no image)</label>
            <input value={settings.logoText} onChange={e => upd("logoText", e.target.value)} className={inp} placeholder="Destekol"/></div>
          <div><label className={lbl}>Site Name</label>
            <input value={settings.siteName} onChange={e => upd("siteName", e.target.value)} className={inp}/></div>
        </>}

        {/* HERO */}
        {active === "hero" && <>
          <div><label className={lbl}>Hero Background Image URL</label>
            <input value={settings.heroImage} onChange={e => upd("heroImage", e.target.value)} className={inp} placeholder="https://..."/>
            <div className="flex gap-2 flex-wrap mt-1">
              <UploadButton onUploaded={v => upd("heroImage", v)} label="Upload Hero Image"/>
              {settings.heroImage && <button onClick={() => upd("heroImage", "")} className="text-[10px] text-danger hover:underline mt-1">✕ Remove (use gradient)</button>}
            </div>
            {settings.heroImage && <img src={settings.heroImage} className="mt-2 h-20 w-full object-cover rounded-lg border border-line"/>}
          </div>
          <p className="text-[10px] text-muted">Leave empty to use the default gradient background on the homepage.</p>
        </>}

        {/* NAV */}
        {active === "nav" && <>
          <div className="flex items-center gap-1.5 bg-success/10 border border-success/20 rounded-xl px-3 py-2 text-[10px] text-success font-semibold">
            <Icon name="check" size={11}/> Changes save automatically — no need to click Save
          </div>
          <div className="space-y-1.5">
            {navPages.map((page, idx) => {
                const busy = navLoading.has(page.id);
                return (<div key={page.id} className={`flex items-center gap-2 p-2.5 rounded-xl border transition ${page.showInMenu ? "border-brand/25 bg-brand/5" : "border-line bg-dashbg/50 opacity-70"}`}>
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => reorderNav(page.id, "up")} disabled={idx === 0 || busy} className="text-muted hover:text-brand disabled:opacity-20 transition">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m18 15-6-6-6 6"/></svg>
                    </button>
                    <button onClick={() => reorderNav(page.id, "down")} disabled={idx === navPages.length - 1 || busy} className="text-muted hover:text-brand disabled:opacity-20 transition">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                  </div>
                  <button onClick={() => !busy && toggleNav(page.id, page.showInMenu)} className={`relative inline-flex h-4 w-7 rounded-full transition-colors shrink-0 ${page.showInMenu ? "bg-brand" : "bg-line"} ${busy ? "opacity-50" : ""}`}>
                    <span className={`inline-block h-3 w-3 rounded-full bg-white shadow m-0.5 transition-transform ${page.showInMenu ? "translate-x-3" : "translate-x-0"}`}/>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-ink truncate">{page.title}</div>
                    <div className="text-[9px] text-muted font-mono">/{page.slug}</div>
                  </div>
                  {busy && <div className="w-3 h-3 border border-brand border-t-transparent rounded-full animate-spin shrink-0"/>}
                </div>);
            })}
          </div>
          <a href="/admin/pages" className="block text-center text-xs text-brand hover:underline py-1 font-semibold">+ Create new page →</a>
        </>}

        {/* DONATE BUTTON */}
        {active === "donate-btn" && <>
          <p className="text-xs text-muted leading-relaxed">The donate button text is managed in Translations (nav.donate key).</p>
          <a href="/admin/translations" className="flex items-center justify-center gap-2 bg-brand text-white rounded-xl py-2.5 text-xs font-bold hover:bg-brand-dark transition">
            <Icon name="send" size={13}/> Go to Translations →
          </a>
        </>}

        {/* FOOTER BRAND */}
        {active === "footer-brand" && <>
          <div><label className={lbl}>Tagline (bold short line)</label>
            <input value={settings.footerTagline} onChange={e => upd("footerTagline", e.target.value)} className={inp} placeholder="منصة تبرعات إنسانية..."/></div>
          <div><label className={lbl}>Description</label>
            <textarea value={settings.footerDescription} onChange={e => upd("footerDescription", e.target.value)} rows={3} className={`${inp} resize-none`} placeholder="About your organization..."/></div>
          <div><label className={lbl}>Logo Image (same as header)</label>
            <input value={settings.logoImage} onChange={e => upd("logoImage", e.target.value)} className={inp} placeholder="https://..."/></div>
        </>}

        {/* FOOTER LINKS */}
        {active === "footer-links" && <>
          <p className="text-[10px] text-muted leading-relaxed">Footer quick links mirror the navigation menu. Manage them in the Navigation section.</p>
          <button onClick={() => { setView("header"); setActive("nav"); }} className="flex items-center justify-center gap-2 bg-dashbg border border-line text-ink rounded-xl py-2 text-xs font-semibold hover:border-brand hover:text-brand transition w-full">
            ← Switch to Navigation
          </button>
        </>}

        {/* FOOTER CONTACT */}
        {active === "footer-contact" && <>
          <div><label className={lbl}>Email</label>
            <input type="email" value={settings.contactEmail} onChange={e => upd("contactEmail", e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Phone</label>
            <input value={settings.contactPhone} onChange={e => upd("contactPhone", e.target.value)} className={inp}/></div>
          <div><label className={lbl}>WhatsApp (international)</label>
            <input value={settings.whatsappNumber} onChange={e => upd("whatsappNumber", e.target.value)} className={inp} placeholder="201234567890"/></div>
        </>}

        {/* FOOTER SOCIAL */}
        {active === "footer-social" && <>
          {[
                { k: "facebookUrl", label: "Facebook" },
                { k: "twitterUrl", label: "Twitter / X" },
                { k: "instagramUrl", label: "Instagram" },
                { k: "youtubeUrl", label: "YouTube" },
                { k: "linkedinUrl", label: "LinkedIn" },
                { k: "tiktokUrl", label: "TikTok" },
            ].map(({ k, label }) => (<div key={k}><label className={lbl}>{label}</label>
              <input value={(settings as any)[k] || ""} onChange={e => upd(k as keyof Settings, e.target.value)} className={inp} placeholder="https://..."/></div>))}
        </>}

        {/* BRAND COLORS */}
        {active === "brand-colors" && settings && <>
          <p className="text-[10px] text-muted mb-3 leading-relaxed">These colors apply across the entire site — navbar, buttons, and donation highlights.</p>
          <div className="space-y-4">
            <div>
              <label className={lbl}>Primary Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={settings.primaryColor || "#0069D2"} onChange={e => upd("primaryColor", e.target.value)} className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer shrink-0"/>
                <input value={settings.primaryColor || "#0069D2"} onChange={e => upd("primaryColor", e.target.value)} className={inp} placeholder="#0069D2"/>
              </div>
              <p className="text-[9px] text-muted mt-1">Navbar, header gradient, buttons, links</p>
            </div>
            <div>
              <label className={lbl}>Accent / Donate Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={settings.accentColor || "#F00F5A"} onChange={e => upd("accentColor", e.target.value)} className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer shrink-0"/>
                <input value={settings.accentColor || "#F00F5A"} onChange={e => upd("accentColor", e.target.value)} className={inp} placeholder="#F00F5A"/>
              </div>
              <p className="text-[9px] text-muted mt-1">Donate buttons, highlights, campaign badges</p>
            </div>
            <div className="mt-3 p-3 bg-dashbg rounded-xl border border-line">
              <p className="text-[9px] text-muted mb-2 font-bold">PREVIEW</p>
              <div className="flex gap-2">
                <button style={{ background: settings.primaryColor || "#0069D2" }} className="text-white text-[10px] font-bold rounded-lg px-3 py-1.5">Primary</button>
                <button style={{ background: settings.accentColor || "#F00F5A" }} className="text-white text-[10px] font-bold rounded-lg px-3 py-1.5">Donate Now</button>
              </div>
            </div>
          </div>
        </>}

        {/* FOOTER COPYRIGHT */}
        {active === "footer-copyright" && <>
          <div><label className={lbl}>Copyright Line</label>
            <input value={settings.copyrightText} onChange={e => upd("copyrightText", e.target.value)} className={inp} placeholder={`© ${new Date().getFullYear()} Destekol — All rights reserved`}/>
            <p className="text-[10px] text-muted mt-1">Leave empty to auto-generate from Site Name.</p>
          </div>
          {settings.copyrightText && (<button onClick={() => upd("copyrightText", "")} className="text-[10px] text-danger hover:underline">✕ Clear (use auto-generated)</button>)}
        </>}

      </div>
    </div>);
}
// ── Main ───────────────────────────────────────────────────
export default function AppearancePage() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [savedSettings, setSavedSettings] = useState<Settings | null>(null);
    const [navPages, setNavPages] = useState<NavPage[]>([]);
    const [navLoading, setNavLoading] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState("");
    const [saveError, setSaveError] = useState("");
    const [activeSection, setActiveSection] = useState<ActiveSection>(null);
    const [view, setView] = useState<ViewMode>("header");
    const [device, setDevice] = useState<DeviceMode>("desktop");
    const [loadError, setLoadError] = useState("");
    const [saveToast, setSaveToast] = useState(false);
    const settingsRef = useRef<Settings | null>(null);
    useEffect(() => {
        Promise.all([
            adminFetch("/api/admin/settings").then(r => r.json()),
            adminFetch("/api/admin/pages").then(r => r.json()),
        ]).then(([s, p]) => {
            const raw = s.settings || {};
            const clean: any = {};
            Object.keys(DEFAULTS).forEach(k => {
                const v = raw[k];
                if (v === null || v === undefined || v === "null" || v === "undefined") {
                    clean[k] = (DEFAULTS as any)[k];
                }
                else {
                    clean[k] = String(v);
                }
            });
            setSettings(clean);
            setSavedSettings(clean);
            settingsRef.current = clean;
            setNavPages((p.pages || []).sort((a: NavPage, b: NavPage) => a.order - b.order));
            setLoading(false);
        }).catch(() => { setLoadError("Failed to load appearance settings. Please refresh."); setLoading(false); });
    }, []);
    const upd = useCallback((key: keyof Settings, val: string) => {
        setSettings(prev => {
            const next = prev ? { ...prev, [key]: val } : prev;
            settingsRef.current = next;
            return next;
        });
        setIsDirty(true);
    }, []);
    const save = useCallback(async () => {
        const currentSettings = settingsRef.current || settings;
        if (!currentSettings)
            return;
        // Only send appearance-related fields — never send secrets or payment config
        const APPEARANCE_KEYS: (keyof Settings)[] = [
            "siteName", "logoText", "logoImage", "heroImage",
            "contactEmail", "contactPhone", "whatsappNumber",
            "facebookUrl", "twitterUrl", "instagramUrl", "youtubeUrl", "linkedinUrl", "tiktokUrl",
            "footerTagline", "footerDescription", "copyrightText",
            "primaryColor", "accentColor",
        ];
        const payload: any = {};
        for (const k of APPEARANCE_KEYS)
            payload[k] = currentSettings[k];
        setSaving(true);
        setSaveError("");
        try {
            const res = await adminFetch("/api/admin/settings", { method: "PATCH", body: JSON.stringify(payload) });
            const resData = await res.json().catch(() => ({}));
            if (!res.ok) {
                setSaveError(resData.error || resData.details || `Failed (${res.status})`);
            }
            else {
                setSavedSettings(currentSettings);
                settingsRef.current = currentSettings;
                setIsDirty(false);
                setSavedAt(new Date().toLocaleTimeString());
                setSaveToast(true);
                setTimeout(() => setSaveToast(false), 2500);
                // Trigger Next.js cache revalidation for public pages
                try {
                    await adminFetch("/api/revalidate", { method: "POST" });
                }
                catch { }
            }
        }
        catch {
            setSaveError("Network error");
        }
        finally {
            setSaving(false);
        }
    }, []); // settingsRef eliminates stale closure issue
    // Warn on unsaved changes + Ctrl+S + Escape — placed after save declaration
    useEffect(() => {
        function onBeforeUnload(e: BeforeUnloadEvent) { if (isDirty) {
            e.preventDefault();
            e.returnValue = "";
        } }
        function onKey(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                if (isDirty)
                    save();
            }
            if (e.key === "Escape")
                setActiveSection(null);
        }
        window.addEventListener("beforeunload", onBeforeUnload);
        window.addEventListener("keydown", onKey);
        return () => { window.removeEventListener("beforeunload", onBeforeUnload); window.removeEventListener("keydown", onKey); };
    }, [isDirty, save]);
    async function toggleNav(id: string, current: boolean) {
        setNavLoading(l => new Set(l).add(id));
        setNavPages(p => p.map(x => x.id === id ? { ...x, showInMenu: !current } : x));
        await adminFetch(`/api/admin/pages/${id}`, { method: "PATCH", body: JSON.stringify({ showInMenu: !current }) });
        setNavLoading(l => { const n = new Set(l); n.delete(id); return n; });
    }
    async function reorderNav(id: string, dir: "up" | "down") {
        const snapshot = [...navPages]; // for rollback
        const arr = [...navPages];
        const idx = arr.findIndex(p => p.id === id);
        const swap = dir === "up" ? idx - 1 : idx + 1;
        if (swap < 0 || swap >= arr.length)
            return;
        [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
        const reordered = arr.map((p, i) => ({ ...p, order: i }));
        setNavPages(reordered); // optimistic
        try {
            const res = await adminFetch("/api/admin/pages", { method: "PATCH", body: JSON.stringify({ orders: reordered.map(p => ({ id: p.id, order: p.order })) }) });
            if (!res.ok) {
                setNavPages(snapshot);
            } // rollback on error
        }
        catch {
            setNavPages(snapshot);
        } // rollback on network error
    }
    if (loading)
        return (<div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        {loadError ? (<>
            <div className="text-danger mb-3 font-semibold">{loadError}</div>
            <button onClick={() => window.location.reload()} className="bg-brand text-white font-bold rounded-xl px-6 py-2.5 text-sm">Retry</button>
          </>) : (<>
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
            <p className="text-muted text-sm">Loading editor…</p>
          </>)}
      </div>
    </div>);
    if (!settings)
        return null;
    const menuPages = navPages.filter(p => p.showInMenu);
    const logoImage = settings.logoImage || "/brand/logo-horizontal-transparent.png";
    const socials = [
        { url: settings.facebookUrl, icon: "facebook", label: "Facebook" },
        { url: settings.twitterUrl, icon: "twitter", label: "Twitter" },
        { url: settings.instagramUrl, icon: "instagram", label: "Instagram" },
        { url: settings.youtubeUrl, icon: "youtube", label: "YouTube" },
        { url: settings.linkedinUrl, icon: "linkedin", label: "LinkedIn" },
        { url: settings.tiktokUrl, icon: "tiktok", label: "TikTok" },
    ].filter(s => s.url);
    const autoYear = new Date().getFullYear();
    return (<div className="flex flex-col h-[calc(100vh-56px)]">

      {/* ── Toolbar ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-line shrink-0 flex-wrap">
        <h1 className="font-display font-extrabold text-ink text-base mr-1">Appearance</h1>

        {/* View toggle */}
        <div className="flex gap-0.5 bg-dashbg rounded-xl p-1">
          {(["header", "footer"] as ViewMode[]).map(v => (<button key={v} onClick={() => { setView(v); setActiveSection(null); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition capitalize ${view === v ? "bg-white shadow text-brand" : "text-muted hover:text-ink"}`}>
              {v === "header" ? "Header" : "Footer"}
            </button>))}
        </div>

        {/* Device toggle */}
        <div className="flex gap-0.5 bg-dashbg rounded-xl p-1">
          <button onClick={() => setDevice("desktop")} title="Desktop" className={`p-1.5 rounded-lg transition ${device === "desktop" ? "bg-white shadow text-brand" : "text-muted hover:text-ink"}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          </button>
          <button onClick={() => setDevice("mobile")} title="Mobile" className={`p-1.5 rounded-lg transition ${device === "mobile" ? "bg-white shadow text-brand" : "text-muted hover:text-ink"}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg>
          </button>
        </div>

        <span className="text-xs text-muted hidden sm:block">Click any section to edit · <kbd className="bg-dashbg border border-line rounded px-1.5 py-0.5 text-[10px] font-mono">⌘S</kbd> to save · <kbd className="bg-dashbg border border-line rounded px-1.5 py-0.5 text-[10px] font-mono">Esc</kbd> to deselect</span>
        <a href={typeof window !== "undefined" ? window.location.origin : "/"} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-xs text-muted hover:text-brand border border-line hover:border-brand rounded-xl px-3 py-1.5 transition hidden sm:flex">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Preview
        </a>

        {/* Status + save */}
        <div className="ms-auto flex items-center gap-3">
          {isDirty && <span className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block"/>Unsaved</span>}
          {savedAt && !isDirty && <span className="text-xs text-muted">Saved {savedAt}</span>}
          {saveError && <span className="text-xs text-danger font-semibold">{saveError}</span>}
          {isDirty && <button onClick={() => { if (confirm("Discard all unsaved changes?") && savedSettings) {
        setSettings(savedSettings);
        settingsRef.current = savedSettings;
        setIsDirty(false);
        setSaveError("");
    } }} className="text-muted text-xs hover:text-ink transition">Discard</button>}
          <button onClick={save} disabled={saving || !isDirty} style={{ background: settings?.primaryColor || "#0069D2" }} className="flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl px-5 py-2 text-xs transition">
            <Icon name="check" size={13}/> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* ── Brand Colors quick access (visible always) ── */}
      <div className="absolute top-14 right-4 z-20">
        <button onClick={() => { setView("header"); setActiveSection("brand-colors"); }} style={activeSection === "brand-colors" ? { background: settings?.primaryColor || "#0069D2", borderColor: settings?.primaryColor || "#0069D2", color: "white" } : {}} className={`flex items-center gap-1.5 text-[10px] font-bold rounded-lg px-2.5 py-1.5 border transition ${activeSection === "brand-colors" ? "" : "bg-white border-line text-muted hover:border-brand hover:text-brand"}`}>
          <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: `linear-gradient(135deg,${settings?.primaryColor || "#0069D2"},${settings?.accentColor || "#F00F5A"})` }}/>
          Colors
        </button>
      </div>

      {/* ── Save toast ──────────────────────────────────── */}
      {saveToast && (<div className="fixed top-20 left-1/2 -translate-x-1/2 z-[999] bg-success text-white text-xs font-bold rounded-xl px-5 py-2.5 shadow-lg flex items-center gap-2 animate-fade-in">
          <Icon name="check" size={14}/> Changes saved successfully
        </div>)}

      {/* ── Editor body ──────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 relative">

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-[#EBEDF0] p-8" onClick={() => setActiveSection(null)}>
          <div className={`mx-auto transition-all duration-300 ${device === "mobile" ? "max-w-sm" : "max-w-5xl"}`}>

            {/* ── HEADER ─────────────────────────────────── */}
            {view === "header" && (<div className="bg-white rounded-2xl shadow-md overflow-visible border border-line">
                <Section id="brand-colors" active={activeSection} onActivate={setActiveSection} primaryColor={settings?.primaryColor} label="Brand Colors">
                  <div className="h-2 rounded-t-2xl cursor-pointer" style={{ background: `linear-gradient(to right, ${settings?.primaryColor || "#0069D2"}, ${settings?.accentColor || "#F00F5A"})` }} title="Click to edit brand colors"/>
                </Section>
                <div className={`${device === "mobile" ? "px-4 h-16" : "px-8 h-20"} flex items-center justify-between gap-4`}>

                  {/* Logo */}
                  <Section id="logo" active={activeSection} onActivate={setActiveSection} primaryColor={settings?.primaryColor} label="Logo">
                    <div className="flex items-center gap-2 py-2">
                      {settings.logoImage ? (<img src={settings.logoImage} alt={settings.logoText} className={`${device === "mobile" ? "h-8" : "h-11"} w-auto object-contain`} onError={e => { (e.target as any).style.display = "none"; }}/>) : (<Editable value={settings.logoText} onChange={v => upd("logoText", v)} className={`font-display font-extrabold text-brand ${device === "mobile" ? "text-base" : "text-xl"}`} placeholder="Destekol"/>)}
                    </div>
                  </Section>

                  {/* Desktop nav */}
                  {device === "desktop" && (<Section id="nav" active={activeSection} onActivate={setActiveSection} primaryColor={settings?.primaryColor} label="Navigation" className="flex-1 flex justify-center py-2">
                      <nav className="flex items-center gap-6">
                        {menuPages.length > 0 ? menuPages.map(p => (<span key={p.id} className="text-sm text-ink/70 font-semibold select-none">{p.title}</span>)) : (<span className={`text-xs italic select-none ${activeSection === "nav" ? "text-brand/60" : "text-muted/40"}`}>
                            {activeSection === "nav" ? "← Use the panel to add nav items" : "Click to configure nav items"}
                          </span>)}
                      </nav>
                    </Section>)}

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 py-2">
                    {device === "desktop" && <span className="text-xs bg-dashbg border border-line rounded-lg px-2.5 py-1.5 text-muted select-none">🇸🇦 AR</span>}
                    {device === "mobile" && (<Section id="nav" active={activeSection} onActivate={setActiveSection} primaryColor={settings?.primaryColor} label="Nav">
                        <div className="flex flex-col gap-1 p-1">
                          <span className="block w-5 h-0.5 bg-ink/50 rounded"/>
                          <span className="block w-5 h-0.5 bg-ink/50 rounded"/>
                          <span className="block w-5 h-0.5 bg-ink/50 rounded"/>
                        </div>
                      </Section>)}
                    <Section id="donate-btn" active={activeSection} onActivate={setActiveSection} primaryColor={settings?.primaryColor} label="Donate">
                      <span className={`font-bold rounded-xl text-white select-none ${device === "mobile" ? "px-3 py-2 text-xs" : "px-5 py-2.5 text-sm"}`} style={{ background: `linear-gradient(135deg,${settings.accentColor || "#F00F5A"},${settings.accentColor || "#F00F5A"}cc)` }}>
                        {device === "mobile" ? "تبرع" : "تبرع الآن"}
                      </span>
                    </Section>
                  </div>
                </div>

                {/* Hero section */}
                <Section id="hero" active={activeSection} onActivate={setActiveSection} primaryColor={settings?.primaryColor} label="Hero Image" className="mx-4 mb-4">
                  <div className={`rounded-xl overflow-hidden relative ${device === "mobile" ? "h-28" : "h-40"} flex items-center justify-center`} style={settings.heroImage ? { backgroundImage: `url(${settings.heroImage})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: "linear-gradient(135deg, #003C87 0%, #0069D2 50%, #F00F5A 100%)" }}>
                    <div className="absolute inset-0 bg-black/30"/>
                    <div className="relative text-white text-center px-4">
                      <div className={`font-extrabold ${device === "mobile" ? "text-lg" : "text-2xl"}`}>{settings.siteName || "Destekol"}</div>
                      <div className={`opacity-80 mt-1 ${device === "mobile" ? "text-xs" : "text-sm"}`}>Humanitarian Foundation</div>
                    </div>
                    {!settings.heroImage && (<div className="absolute bottom-2 right-2 text-[10px] text-white/80 bg-black/30 rounded px-2 py-0.5">Default gradient</div>)}
                  </div>
                </Section>
              </div>)}

            {/* ── FOOTER ─────────────────────────────────── */}
            {view === "footer" && (<div className="rounded-2xl overflow-hidden shadow-md border border-white/20">
                <div className="h-1" style={{ background: `linear-gradient(to right, ${settings.primaryColor || "#0069D2"}, ${settings.accentColor || "#F00F5A"})` }}/>
                <div className="bg-[#001633] text-white px-8 py-10">
                  <div className={`grid gap-8 mb-8 ${device === "mobile" ? "grid-cols-1" : "grid-cols-4"}`}>

                    {/* Brand */}
                    <Section id="footer-brand" active={activeSection} onActivate={setActiveSection} primaryColor={settings?.primaryColor} label="Brand">
                      <div>
                        <img src={logoImage} alt="" className="h-10 w-auto object-contain mb-3 opacity-90" onError={e => { (e.target as any).src = "/brand/logo-horizontal-transparent.png"; }}/>
                        {settings.footerTagline ? (<Editable value={settings.footerTagline} onChange={v => upd("footerTagline", v)} className="block text-white/80 text-sm font-bold mb-2" tag="p" placeholder="Tagline…"/>) : (<span onClick={e => { e.stopPropagation(); setActiveSection("footer-brand"); }} className="block text-white/25 text-xs italic mb-2 cursor-pointer hover:text-white/80 transition">+ Add tagline</span>)}
                        <Editable value={settings.footerDescription} onChange={v => upd("footerDescription", v)} className="block text-white/80 text-xs leading-relaxed mb-1" tag="p" placeholder="Click to add organization description…" multiline/>
                        {!settings.footerDescription && activeSection !== "footer-brand" && (<p className="text-[9px] text-white/20 italic mb-3">↑ Click text to edit inline</p>)}
                        {socials.length > 0 && (<div className="flex gap-1.5 flex-wrap mb-3">
                            {socials.map(s => (<span key={s.label} title={s.label} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center select-none">
                                <Icon name={s.icon as any} size={11} className="text-white/70"/>
                              </span>))}
                          </div>)}
                        <span className="inline-flex items-center gap-2 text-white font-bold rounded-xl px-4 py-2 text-xs select-none" style={{ background: `linear-gradient(135deg,${settings.accentColor || "#F00F5A"},${settings.accentColor || "#F00F5A"}cc)` }}>❤ تبرع الآن</span>
                      </div>
                    </Section>

                    {/* Quick links */}
                    {device === "desktop" && (<Section id="footer-links" active={activeSection} onActivate={setActiveSection} primaryColor={settings?.primaryColor} label="Quick Links">
                        <div>
                          <div className="font-bold text-[#5B9BD5] mb-4 text-[10px] tracking-[0.2em] uppercase">Quick Links</div>
                          <ul className="space-y-2 text-xs text-white/55">
                            {menuPages.length > 0 ? menuPages.slice(0, 5).map(p => (<li key={p.id} className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-white/30 shrink-0"/>{p.title}
                              </li>)) : <li className="text-white/25 italic text-[10px]">Add pages in Navigation</li>}
                          </ul>
                        </div>
                      </Section>)}

                    {/* Legal (static, no editing) */}
                    {device === "desktop" && (<div className="opacity-50 pointer-events-none select-none relative">
                        <div className="font-bold text-[#5B9BD5] mb-4 text-[10px] tracking-[0.2em] uppercase">Legal</div>
                        <ul className="space-y-2 text-xs text-white/55">
                          {["Privacy Policy", "Terms", "Refund Policy", "Cookie Policy", "AML Policy"].map(l => (<li key={l} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-white/30 shrink-0"/>{l}</li>))}
                        </ul>
                        <div className="mt-3 text-[9px] text-white/30 italic">Auto-generated from pages</div>
                      </div>)}

                    {/* Contact + Social */}
                    <div className="space-y-4">
                      <Section id="footer-contact" active={activeSection} onActivate={setActiveSection} primaryColor={settings?.primaryColor} label="Contact">
                        <div>
                          <div className="font-bold text-[#5B9BD5] mb-3 text-[10px] tracking-[0.2em] uppercase">Contact Us</div>
                          <div className="space-y-1.5 text-xs text-white/80">
                            {settings.contactEmail ? (<Editable value={settings.contactEmail} onChange={v => upd("contactEmail", v)} className="flex items-center gap-1.5" placeholder="email@domain.com"/>) : (<span onClick={e => { e.stopPropagation(); setActiveSection("footer-contact"); }} className="flex items-center gap-1.5 text-white/25 italic cursor-pointer hover:text-white/45 transition">
                                <Icon name="mail" size={11} className="shrink-0"/> + Add email
                              </span>)}
                            {settings.contactPhone ? (<Editable value={settings.contactPhone} onChange={v => upd("contactPhone", v)} className="flex items-center gap-1.5" placeholder="+1 234 567 890"/>) : (<span onClick={e => { e.stopPropagation(); setActiveSection("footer-contact"); }} className="flex items-center gap-1.5 text-white/25 italic cursor-pointer hover:text-white/45 transition">
                                <Icon name="phone" size={11} className="shrink-0"/> + Add phone
                              </span>)}
                            {settings.whatsappNumber ? (<div className="flex items-center gap-1.5 text-white/80 text-xs">
                                <Icon name="message-circle" size={11} className="shrink-0"/>
                                <Editable value={settings.whatsappNumber} onChange={v => upd("whatsappNumber", v)} placeholder="201234567890"/>
                              </div>) : (<span onClick={e => { e.stopPropagation(); setActiveSection("footer-contact"); }} className="flex items-center gap-1.5 text-white/25 italic cursor-pointer hover:text-white/45 transition">
                                <Icon name="message-circle" size={11} className="shrink-0"/> + Add WhatsApp
                              </span>)}
                          </div>
                        </div>
                      </Section>
                      <Section id="footer-social" active={activeSection} onActivate={setActiveSection} primaryColor={settings?.primaryColor} label="Social">
                        <div>
                          <div className="font-bold text-[#5B9BD5] mb-2 text-[10px] tracking-[0.2em] uppercase">Follow Us</div>
                          <div className="flex gap-2 flex-wrap">
                            {socials.length > 0 ? socials.map(s => (<span key={s.label} title={s.label} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition select-none cursor-default">
                                <Icon name={s.icon as any} size={13} className="text-white/80"/>
                              </span>)) : (<span className="text-[10px] text-white/25 italic">+ Add social links</span>)}
                          </div>
                        </div>
                      </Section>
                    </div>
                  </div>

                  {/* Copyright */}
                  <Section id="footer-copyright" active={activeSection} onActivate={setActiveSection} primaryColor={settings?.primaryColor} label="Copyright" className="border-t border-white/10 pt-5">
                    <div className="flex items-center justify-center gap-2">
                      <Editable value={settings.copyrightText} onChange={v => upd("copyrightText", v)} className="text-white/30 text-[11px] text-center" placeholder={`© ${autoYear} ${settings.siteName} — All Rights Reserved`}/>
                      {!settings.copyrightText && (<span className="text-[9px] text-white/20 italic shrink-0">(auto)</span>)}
                    </div>
                  </Section>
                </div>
              </div>)}

          </div>
        </div>

        {/* Side panel */}
        <SectionPanel active={activeSection} settings={settings} upd={upd} navPages={navPages} navLoading={navLoading} toggleNav={toggleNav} reorderNav={reorderNav} onClose={() => setActiveSection(null)} setActive={setActiveSection} setView={setView}/>
      </div>
    </div>);
}
