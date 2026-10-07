"use client";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { useRouter } from "next/navigation";
import { useEffect,useRef,useState } from "react";
import ImageUpload from "./ImageUpload";
interface CampaignData {
    id?: string;
    title?: string;
    slug?: string;
    summary?: string;
    description?: string;
    coverImage?: string;
    goalAmount?: number;
    defaultAmount?: number | null;
    category?: string;
    country?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    isZakatable?: boolean;
    authorName?: string;
    authorRole?: string;
    publishedAt?: string;
}
const CATEGORIES = ["food", "medical", "shelter", "education", "water", "general"];
const COUNTRIES = [
    { value: "", label: "— Not specified —" },
    { value: "غزة", label: "Gaza / غزة 🇵🇸" },
    { value: "فلسطين", label: "Palestine 🇵🇸" },
    { value: "اليمن", label: "Yemen 🇾🇪" },
    { value: "سوريا", label: "Syria 🇸🇾" },
    { value: "السودان", label: "Sudan 🇸🇩" },
    { value: "لبنان", label: "Lebanon 🇱🇧" },
    { value: "العراق", label: "Iraq 🇮🇶" },
    { value: "ليبيا", label: "Libya 🇱🇾" },
    { value: "أفغانستان", label: "Afghanistan 🇦🇫" },
    { value: "الصومال", label: "Somalia 🇸🇴" },
    { value: "تركيا", label: "Turkey 🇹🇷" },
    { value: "المغرب", label: "Morocco 🇲🇦" },
];
export default function CampaignForm({ initial }: {
    initial?: CampaignData;
}) {
    const router = useRouter();
    const isEdit = !!initial?.id;
    const [form, setForm] = useState({
        title: initial?.title || "",
        slug: initial?.slug || "",
        summary: initial?.summary || "",
        description: initial?.description || "",
        coverImage: initial?.coverImage || "",
        goalAmount: initial?.goalAmount || 10000,
        defaultAmount: initial?.defaultAmount != null ? initial.defaultAmount : 25,
        category: initial?.category || "general",
        country: initial?.country || "",
        isActive: initial?.isActive ?? true,
        isFeatured: initial?.isFeatured ?? false,
        isZakatable: initial?.isZakatable ?? false,
        authorName: initial?.authorName || "فريق الرقابة الميدانية والشفافية — Destekol",
        authorRole: initial?.authorRole || "مشاريع إنسانية وإغاثية | تدقيق مالي وشفافية 100%",
        publishedAt: initial?.publishedAt ? new Date(initial.publishedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [isDirty, setIsDirty] = useState(false);
    const saveRef = useRef<() => void>();
    const upd = (k: string, v: any) => { setForm(f => ({ ...f, [k]: v })); setIsDirty(true); };
    useEffect(() => { saveRef.current = save; });
    useEffect(() => {
        function onBeforeUnload(e: BeforeUnloadEvent) { if (isDirty) {
            e.preventDefault();
            e.returnValue = "";
        } }
        function onKey(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                saveRef.current?.();
            }
        }
        window.addEventListener("beforeunload", onBeforeUnload);
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("beforeunload", onBeforeUnload);
            window.removeEventListener("keydown", onKey);
        };
    }, [isDirty]);
    async function save() {
        if (!form.title || !form.slug || !form.summary || !form.goalAmount) {
            setError("Title, slug, summary and goal amount are required.");
            return;
        }
        setSaving(true);
        setError("");
        const method = isEdit ? "PATCH" : "POST";
        const url = isEdit ? `/api/admin/campaigns/${initial!.id}` : "/api/admin/campaigns";
        const res = await adminFetch(url, { method, body: JSON.stringify(form) });
        const d = await res.json();
        if (!res.ok) {
            setError(d.error || "Error saving");
            setSaving(false);
            return;
        }
        setIsDirty(false);
        setSaving(false);
        router.push("/admin/campaigns");
        router.refresh();
    }
    const inp = "w-full border border-line rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white";
    const lbl = "block text-xs font-bold text-muted uppercase tracking-wider mb-2";
    return (<div className="w-full bg-white rounded-2xl border border-line p-6 sm:p-8 space-y-6 shadow-sm">
      {error && (<div className="flex items-center gap-2 bg-danger/10 border border-danger/20 text-danger rounded-xl p-4 text-sm">
          <Icon name="x" size={16}/> {error}
        </div>)}

      {/* Title + Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={lbl}>Campaign Title *</label>
          <input value={form.title} onChange={e => {
            upd("title", e.target.value);
            if (!isEdit) {
                const s = e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
                upd("slug", s || `campaign-${Date.now()}`);
            }
        }} placeholder="e.g. Emergency Food Aid" className={inp}/>
        </div>
        <div>
          <label className={lbl}>URL Slug *</label>
          <input value={form.slug} onChange={e => upd("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} className={inp}/>
          {isEdit && (<p className="text-xs text-amber-600 mt-1.5 font-medium">⚠ Changing the slug will break existing links and bookmarks.</p>)}
        </div>
      </div>

      {/* Summary */}
      <div>
        <label className={lbl}>Summary (one line) *</label>
        <input value={form.summary} onChange={e => upd("summary", e.target.value)} placeholder="Short description shown on campaign cards" className={inp}/>
      </div>

      {/* Description */}
      <div>
        <label className={lbl}>Full Description</label>
        <textarea value={form.description} onChange={e => upd("description", e.target.value)} rows={6} placeholder="Detailed campaign description..." className={`${inp} resize-y`}/>
      </div>

      {/* Category + Country + Goals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <label className={lbl}>Category</label>
          <select value={form.category} onChange={e => upd("category", e.target.value)} className={inp}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Country / Region</label>
          <select value={form.country} onChange={e => upd("country", e.target.value)} className={inp}>
            {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Fundraising Goal ($) *</label>
          <input type="number" min={1} value={form.goalAmount} onChange={e => upd("goalAmount", Number(e.target.value))} className={inp}/>
        </div>
        <div>
          <label className={lbl}>Default Amount ($)</label>
          <input type="number" min={0} value={form.defaultAmount} onChange={e => upd("defaultAmount", Number(e.target.value))} className={inp}/>
        </div>
      </div>

      {/* 🌟 E-E-A-T & AI Optimization Settings Section */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-line space-y-4">
        <div className="flex items-center gap-2 text-ink font-bold text-sm">
          <Icon name="shield-check" size={18} className="text-brand"/>
          <span>E-E-A-T & GEO Trust Signals (حقول الموثوقية للذكاء الاصطناعي)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className={lbl}>Author / Audit Team (اسم الكاتب/الفريق)</label>
            <input value={form.authorName} onChange={e => upd("authorName", e.target.value)} placeholder="e.g. فريق الرقابة الميدانية — Destekol" className={inp}/>
          </div>
          <div>
            <label className={lbl}>Trust Badge / Role (شارة الاعتماد والترخيص)</label>
            <input value={form.authorRole} onChange={e => upd("authorRole", e.target.value)} placeholder="e.g. مشاريع إنسانية وإغاثية" className={inp}/>
          </div>
          <div>
            <label className={lbl}>Publication Date (تاريخ النشر الصريح)</label>
            <input type="datetime-local" value={form.publishedAt} onChange={e => upd("publishedAt", e.target.value)} className={inp}/>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      <div>
        <label className={lbl}>Cover Image</label>
        <ImageUpload value={form.coverImage} onChange={v => upd("coverImage", v)}/>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-line">
        {[
            { key: "isActive", label: "Active", desc: "Visible to the public" },
            { key: "isFeatured", label: "Featured", desc: "Shown in carousel" },
            { key: "isZakatable", label: "Zakatable (يقبل الزكاة)", desc: "Shows Zakat badge on card" },
        ].map(item => (<label key={item.key} className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-line hover:border-brand/40 hover:bg-brand/5 transition">
            <div className="relative mt-0.5">
              <input type="checkbox" className="sr-only" checked={form[item.key as keyof typeof form] as boolean} onChange={e => upd(item.key, e.target.checked)}/>
              <div className={`w-10 h-6 rounded-full transition-colors ${form[item.key as keyof typeof form] ? "bg-brand" : "bg-slate-200"}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form[item.key as keyof typeof form] ? "left-5" : "left-1"}`}/>
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-ink">{item.label}</div>
              <div className="text-xs text-muted">{item.desc}</div>
            </div>
          </label>))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-line">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold rounded-xl px-8 py-3 text-sm transition shadow-sm">
          <Icon name={saving ? "minus" : "check"} size={16}/>
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Campaign"}
        </button>
        <button onClick={() => router.back()} className="px-6 py-3 border border-line text-muted hover:text-ink rounded-xl text-sm font-semibold transition">
          Cancel
        </button>
      </div>
    </div>);
}
