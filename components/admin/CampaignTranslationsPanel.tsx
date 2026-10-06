"use client";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { autoTranslateContent } from "@/lib/auto-translate";
import { useEffect,useState } from "react";
const LOCALES = [
    { code: "en", flag: "🇬🇧", name: "English" },
    { code: "fr", flag: "🇫🇷", name: "Français" },
    { code: "tr", flag: "🇹🇷", name: "Türkçe" },
];
interface Props {
    campaignId: string;
    baseTitle: string;
    baseSummary: string;
    baseDescription: string;
    baseAuthorName: string;
    baseAuthorRole: string;
}
export default function CampaignTranslationsPanel({ campaignId, baseTitle, baseSummary, baseDescription, baseAuthorName, baseAuthorRole }: Props) {
    const [activeLocale, setActiveLocale] = useState("en");
    const [form, setForm] = useState({ title: "", summary: "", description: "", authorName: "", authorRole: "" });
    const [loading, setLoading] = useState(false);
    const [loadingLocale, setLoadingLocale] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [status, setStatus] = useState<{
        ok: boolean;
        msg: string;
    } | null>(null);
    const [hasTranslation, setHasTranslation] = useState(false);
    async function loadTranslation(locale: string) {
        setLoadingLocale(true);
        try {
            const res = await adminFetch(`/api/admin/campaigns/translations?campaignId=${campaignId}&locale=${locale}`);
            const d = await res.json();
            if (d.translation) {
                setForm({ title: d.translation.title, summary: d.translation.summary, description: d.translation.description, authorName: d.translation.authorName || "", authorRole: d.translation.authorRole || "" });
                setHasTranslation(true);
            }
            else {
                // Pre-fill with base (Arabic) as starting point
                setForm({ title: baseTitle, summary: baseSummary, description: baseDescription, authorName: "", authorRole: "" });
                setHasTranslation(false);
            }
        }
        catch {
            setForm({ title: baseTitle, summary: baseSummary, description: baseDescription, authorName: "", authorRole: "" });
        }
        finally {
            setLoadingLocale(false);
            setIsDirty(false);
        }
    }
    useEffect(() => { loadTranslation(activeLocale); }, [activeLocale, campaignId]);
    // 🌟 دالة الترجمة التلقائية بضغطة زر عبر API الترجمة
    // 🌟 دالة الترجمة التلقائية المعدلة للحملات
    async function autoTranslate() {
        setTranslating(true);
        setStatus(null);
        try {
            const d = { sections: await autoTranslateContent([baseTitle, baseSummary, baseDescription], activeLocale) };
            if (d.sections && Array.isArray(d.sections)) {
                setForm(f => ({
                    ...f,
                    title: d.sections[0] || baseTitle,
                    summary: d.sections[1] || baseSummary,
                    description: d.sections[2] || baseDescription,
                }));
                setIsDirty(true);
                setStatus({ ok: true, msg: "✨ Translated automatically! Click 'Save Translation' to confirm." });
            }
            else {
                throw new Error("Failed to parse translated text");
            }
        }
        catch (err: any) {
            setStatus({ ok: false, msg: err.message || "Auto-translation failed." });
        }
        finally {
            setTranslating(false);
        }
    }
    async function save() {
        if (!form.title.trim())
            return;
        setLoading(true);
        setStatus(null);
        const res = await adminFetch("/api/admin/campaigns/translations", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ campaignId, locale: activeLocale, ...form }),
        });
        const d = await res.json();
        if (d.translation) {
            setStatus({ ok: true, msg: "Translation saved!" });
            setHasTranslation(true);
            setIsDirty(false);
        }
        else
            setStatus({ ok: false, msg: d.error || "Error" });
        setLoading(false);
    }
    async function deleteTranslation() {
        if (!confirm("Delete this translation?"))
            return;
        await adminFetch("/api/admin/campaigns/translations", {
            method: "DELETE", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ campaignId, locale: activeLocale }),
        });
        setForm({ title: baseTitle, summary: baseSummary, description: baseDescription, authorName: "", authorRole: "" });
        setHasTranslation(false);
        setStatus({ ok: true, msg: "Translation deleted. Falls back to Arabic." });
    }
    useEffect(() => {
        function onBeforeUnload(e: BeforeUnloadEvent) { if (isDirty) {
            e.preventDefault();
            e.returnValue = "";
        } }
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [isDirty]);
    const inp = "w-full rounded-xl border border-line bg-dashbg py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 bg-white";
    return (<div className="bg-white rounded-xl2 border border-line p-6">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
        <div>
          <h2 className="font-display font-bold text-ink flex items-center gap-2">
            <Icon name="globe" size={18} className="text-brand"/> Content Translations
          </h2>
          <p className="text-muted text-xs">Translate campaign content, reviewer team and role. Preserve real personal names; translate team names and organisation descriptions.</p>
        </div>

        {/* 🌟 زر الترجمة التلقائية */}
        <button type="button" onClick={autoTranslate} disabled={translating || loadingLocale || loading} className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition shadow-sm disabled:opacity-50">
          <Icon name="tablet" size={14}/>
          {translating ? "Translating..." : "✨ Auto Translate"}
        </button>
      </div>

      {/* Locale tabs */}
      <div className="flex gap-2 my-5">
        {LOCALES.map(l => (<button key={l.code} disabled={translating || loading} onClick={() => setActiveLocale(l.code)} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold border transition ${activeLocale === l.code ? "bg-brand text-white border-brand" : "border-line text-muted hover:border-brand hover:text-brand"}`}>
            <span>{l.flag}</span>{l.name}
          </button>))}
      </div>

      {loadingLocale && <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3"/>}
      
      {/* Status badge */}
      <div className={`inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-3 py-1 mb-4 ${hasTranslation ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
        <Icon name={hasTranslation ? "check" : "help-circle"} size={12}/>
        {hasTranslation ? "Translated" : "No translation — showing Arabic to visitors"}
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label htmlFor="campaign-reviewer" className="block text-xs text-muted font-semibold uppercase tracking-wider mb-1.5">Reviewer name / team</label>
          <input id="campaign-reviewer" value={form.authorName} placeholder={baseAuthorName} onChange={e => { setIsDirty(true); setForm(f => ({ ...f, authorName: e.target.value })); }} className={inp}/>
        </div>
        <div>
          <label htmlFor="campaign-reviewer-role" className="block text-xs text-muted font-semibold uppercase tracking-wider mb-1.5">Reviewer role / organisation description</label>
          <input id="campaign-reviewer-role" value={form.authorRole} placeholder={baseAuthorRole} onChange={e => { setIsDirty(true); setForm(f => ({ ...f, authorRole: e.target.value })); }} className={inp}/>
        </div>
        <div>
          <label className="block text-xs text-muted font-semibold uppercase tracking-wider mb-1.5">Title *</label>
          <input value={form.title} onChange={e => { setIsDirty(true); setForm(f => ({ ...f, title: e.target.value })); }} className={inp}/>
        </div>
        <div>
          <label className="block text-xs text-muted font-semibold uppercase tracking-wider mb-1.5">Short Summary</label>
          <textarea value={form.summary} onChange={e => { setIsDirty(true); setForm(f => ({ ...f, summary: e.target.value })); }} rows={2} className={`${inp} resize-none`}/>
        </div>
        <div>
          <label className="block text-xs text-muted font-semibold uppercase tracking-wider mb-1.5">Full Description</label>
          <textarea value={form.description} onChange={e => { setIsDirty(true); setForm(f => ({ ...f, description: e.target.value })); }} rows={5} className={`${inp} resize-y`}/>
        </div>
      </div>

      {status && (<div className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-sm font-semibold border ${status.ok ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"}`}>
          <Icon name={status.ok ? "check" : "x"} size={14}/>{status.msg}
        </div>)}

      <div className="flex gap-3 mt-4">
        <button onClick={save} disabled={loading || translating || loadingLocale || !form.title.trim()} className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl px-5 py-2.5 text-sm transition disabled:opacity-50">
          <Icon name="check" size={14}/>{loading ? "Saving..." : "Save Translation"}
        </button>
        {hasTranslation && (<button onClick={deleteTranslation} className="flex items-center gap-2 border border-danger/30 text-danger hover:bg-danger/5 font-semibold rounded-xl px-4 py-2.5 text-sm transition">
            <Icon name="trash" size={14}/> Delete
          </button>)}
      </div>
    </div>);
}
