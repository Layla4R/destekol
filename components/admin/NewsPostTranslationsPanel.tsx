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
    postId: string;
    baseTitle: string;
    baseExcerpt: string;
    baseBody: string;
    baseBody2?: string;
    baseVideoUrl?: string;
}
export default function NewsPostTranslationsPanel({ postId, baseTitle, baseExcerpt, baseBody, baseBody2 = "", baseVideoUrl = "" }: Props) {
    const [activeLocale, setActiveLocale] = useState("en");
    const [form, setForm] = useState({ title: "", excerpt: "", body: "", body2: "", videoUrl: "" });
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
            const res = await adminFetch(`/api/admin/news/translations?postId=${postId}&locale=${locale}`);
            const d = await res.json();
            if (d.translation) {
                setForm({
                    title: d.translation.title || "",
                    excerpt: d.translation.excerpt || "",
                    body: d.translation.body || "",
                    body2: d.translation.body2 || "",
                    videoUrl: d.translation.videoUrl || "",
                });
                setHasTranslation(true);
            }
            else {
                setForm({ title: baseTitle, excerpt: baseExcerpt, body: baseBody, body2: baseBody2, videoUrl: baseVideoUrl });
                setHasTranslation(false);
            }
        }
        catch {
            setForm({ title: baseTitle, excerpt: baseExcerpt, body: baseBody, body2: baseBody2, videoUrl: baseVideoUrl });
        }
        finally {
            setLoadingLocale(false);
            setIsDirty(false);
        }
    }
    useEffect(() => { loadTranslation(activeLocale); }, [activeLocale, postId]);
    async function autoTranslate() {
        setTranslating(true);
        setStatus(null);
        try {
            const d = { sections: await autoTranslateContent([baseTitle, baseExcerpt, baseBody, baseBody2], activeLocale) };
            if (d.sections && Array.isArray(d.sections)) {
                setForm(f => ({
                    ...f,
                    title: d.sections[0] || baseTitle,
                    excerpt: d.sections[1] || baseExcerpt,
                    body: d.sections[2] || baseBody,
                    body2: d.sections[3] || baseBody2,
                }));
                setIsDirty(true);
                setStatus({ ok: true, msg: "✨ Translated automatically! Click 'Save Translation' to confirm." });
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
        const res = await adminFetch("/api/admin/news/translations", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId, locale: activeLocale, ...form }),
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
    const inp = "w-full rounded-xl border border-line bg-white py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30";
    return (<div className="bg-white rounded-2xl border border-line p-6 sm:p-8 w-full shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
        <div>
          <h2 className="font-display font-bold text-ink flex items-center gap-2">
            <Icon name="globe" size={18} className="text-brand"/> Content Translations
          </h2>
          <p className="text-muted text-xs">Translate article text blocks for each language.</p>
        </div>

        <button type="button" onClick={autoTranslate} disabled={translating || loadingLocale || loading} className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition shadow-sm disabled:opacity-50">
          <Icon name="tablet" size={14}/>
          {translating ? "Translating..." : "✨ Auto Translate"}
        </button>
      </div>

      <div className="flex gap-2 my-5">
        {LOCALES.map(l => (<button key={l.code} disabled={translating || loading} onClick={() => setActiveLocale(l.code)} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold border transition ${activeLocale === l.code ? "bg-brand text-white border-brand" : "border-line text-muted hover:border-brand hover:text-brand"}`}>
            <span>{l.flag}</span>{l.name}
          </button>))}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-muted font-bold uppercase tracking-wider mb-1.5">Title *</label>
          <input value={form.title} onChange={e => { setIsDirty(true); setForm(f => ({ ...f, title: e.target.value })); }} className={inp}/>
        </div>
        <div>
          <label className="block text-xs text-muted font-bold uppercase tracking-wider mb-1.5">Excerpt</label>
          <textarea value={form.excerpt} onChange={e => { setIsDirty(true); setForm(f => ({ ...f, excerpt: e.target.value })); }} rows={2} className={`${inp} resize-none`}/>
        </div>
        <div>
          <label className="block text-xs text-muted font-bold uppercase tracking-wider mb-1.5">Body Paragraph 1</label>
          <textarea value={form.body} onChange={e => { setIsDirty(true); setForm(f => ({ ...f, body: e.target.value })); }} rows={6} className={`${inp} resize-y font-mono text-xs`}/>
        </div>
        <div>
          <label className="block text-xs text-muted font-bold uppercase tracking-wider mb-1.5">Body Paragraph 2</label>
          <textarea value={form.body2} onChange={e => { setIsDirty(true); setForm(f => ({ ...f, body2: e.target.value })); }} rows={5} className={`${inp} resize-y font-mono text-xs`}/>
        </div>
        <div>
          <label className="block text-xs text-muted font-bold uppercase tracking-wider mb-1.5">Sidebar Video URL (If localized)</label>
          <input value={form.videoUrl} onChange={e => { setIsDirty(true); setForm(f => ({ ...f, videoUrl: e.target.value })); }} className={inp}/>
        </div>
      </div>

      {status && (<div className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-sm font-semibold border ${status.ok ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"}`}>
          <Icon name={status.ok ? "check" : "x"} size={14}/>{status.msg}
        </div>)}

      <div className="flex gap-3 mt-5">
        <button onClick={save} disabled={loading || translating || loadingLocale || !form.title.trim()} className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl px-6 py-2.5 text-sm transition disabled:opacity-50 shadow-sm">
          <Icon name="check" size={14}/>{loading ? "Saving..." : "Save Translation"}
        </button>
      </div>
    </div>);
}
