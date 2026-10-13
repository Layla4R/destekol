"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Plus, Save, Trash2, Link as LinkIcon } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { useToast } from "@/components/admin/Toast";
import { KIT_LOCALES, KIT_MAX_RESOURCES, getKitResourceUrl, parseKitResources, type KitLinkId, type KitLocale, type KitResource } from "@/lib/kit-config";
import { KIT_COPY } from "@/lib/kit-copy";
import { LOCALE_NAMES } from "@/lib/locales";

const fieldClass = "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:bg-dashbg disabled:text-muted";
const iconLabels: Record<KitLinkId | "link", string> = {
    website: "الموقع الرسمي", brochure: "مستند", portfolio: "مجلد", sustainability: "ورقة نبات",
    video: "فيديو", partnerships: "شراكة", contact: "بريد", link: "رابط",
};

export default function KitLinksEditor({ canEdit }: { canEdit: boolean }) {
    const [resources, setResources] = useState<KitResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [dirty, setDirty] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [previewLocale, setPreviewLocale] = useState<KitLocale>("ar");
    const { toast } = useToast();
    const errorRef = useRef<HTMLDivElement>(null);
    useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

    async function load() {
        setLoading(true);
        setError("");
        try {
            const response = await adminFetch("/api/admin/kit");
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "تعذر تحميل الروابط.");
            setResources(parseKitResources(data.resources));
            setLoaded(true);
            setDirty(false);
        } catch (failure) {
            setError(failure instanceof Error ? failure.message : "تعذر الاتصال. أعد المحاولة.");
        } finally { setLoading(false); }
    }
    useEffect(() => { void load(); }, []);
    useEffect(() => {
        if (!dirty) return;
        const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
        window.addEventListener("beforeunload", beforeUnload);
        return () => window.removeEventListener("beforeunload", beforeUnload);
    }, [dirty]);

    function update(id: KitResource["id"], values: Partial<KitResource>) {
        setResources(previous => previous.map(resource => resource.id === id ? { ...resource, ...values } : resource));
        setDirty(true);
        setError("");
    }
    async function save() {
        setError("");
        let validated;
        try { validated = parseKitResources(resources); }
        catch (failure) { setError(failure instanceof Error ? failure.message : "تحقق من الروابط."); return; }
        setSaving(true);
        try {
            const response = await adminFetch("/api/admin/kit", { method: "PATCH", body: JSON.stringify({ resources: validated }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "تعذر حفظ الروابط.");
            setResources(parseKitResources(data.resources));
            setDirty(false);
            toast("تم حفظ الروابط. التعديلات متاحة الآن على صفحة /kit.");
        } catch (failure) {
            setError(failure instanceof Error ? failure.message : "تعذر الاتصال. لم يتم تأكيد الحفظ.");
        } finally { setSaving(false); }
    }
    function addLink() {
        setError("");
        setResources(previous => [...previous, {
            id: `custom-${crypto.randomUUID()}`, tone: "blue", icon: "link", url: null,
            enabled: true, titles: { en: "New link", tr: "Yeni bağlantı", ar: "رابط جديد" },
        }]);
        setDirty(true);
    }

    return <div className="p-4 md:p-8" dir="rtl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-ink">إدارة روابط صفحة Kit</h1>
                <p className="mt-2 text-sm text-muted">عدّل الروابط وأضف مواد جديدة بدون تعديل الكود. تبقى اللغات الثلاث على رابط واحد.</p>
            </div>
            <a href="/kit" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-brand">
                فتح الصفحة <ArrowUpRight size={17} />
            </a>
        </div>
        {!canEdit && <p className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">صلاحيتك تسمح بالعرض فقط. تعديل الروابط يحتاج إلى صلاحية تعديل الصفحات.</p>}
        {error && <div ref={errorRef} tabIndex={-1} className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
            {error} {!loaded && <button type="button" onClick={() => void load()} className="mx-2 underline">إعادة المحاولة</button>}
        </div>}
        {loading ? <p role="status" className="py-12 text-center text-muted">جارٍ تحميل الروابط…</p> : loaded && <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4">
                <p className="text-sm text-muted">الرابط الفارغ أو المعطّل يظهر «قريبًا». الرابط الخاص باللغة له الأولوية على الرابط العام.</p>
                <span className={`text-xs font-semibold ${dirty ? "text-amber-700" : "text-green-700"}`} role="status">{dirty ? "تعديلات غير محفوظة" : "لا توجد تعديلات غير محفوظة"}</span>
            </div>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <form onSubmit={event => { event.preventDefault(); void save(); }} className="min-w-0 space-y-4">
                    <fieldset disabled={!canEdit || saving} className="min-w-0 space-y-4">
                        {resources.map((resource, index) => {
                            const fixed = !resource.id.startsWith("custom-");
                            const heading = resource.titles?.ar || KIT_COPY.ar.links[resource.id as KitLinkId] || resource.titles?.en;
                            return <article key={resource.id} className="rounded-2xl border border-line bg-white p-4 md:p-5" data-kit-editor={resource.id}>
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                    <h2 className="flex items-center gap-3 text-base font-bold text-ink"><span className="grid h-8 w-8 place-items-center rounded-full bg-brand/10 text-sm text-brand">{index + 1}</span>{heading}</h2>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 text-xs font-medium text-muted"><input type="checkbox" checked={resource.enabled !== false} onChange={event => update(resource.id, { enabled: event.target.checked })} className="h-4 w-4 accent-teal-700" />تفعيل الرابط</label>
                                        <button type="button" aria-label={`حذف ${heading}`} title="حذف الرابط" onClick={() => { setResources(previous => previous.filter(item => item.id !== resource.id)); setDirty(true); setError(""); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-red-600 hover:bg-red-50"><Trash2 size={16} />حذف</button>
                                    </div>
                                </div>
                                <label className="mb-1.5 block text-xs font-semibold text-muted" htmlFor={`${resource.id}-url`}>الرابط العام لجميع اللغات</label>
                                <input id={`${resource.id}-url`} value={resource.url || ""} onChange={event => update(resource.id, { url: event.target.value || null })} placeholder="https://… أو /kit/documents/file.pdf" dir="ltr" autoComplete="off" inputMode="url" maxLength={2048} className={fieldClass} />
                                <details className="mt-4" open={!fixed || undefined}>
                                    <summary className="cursor-pointer text-sm font-semibold text-brand">عناوين وروابط اللغات</summary>
                                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                                        {KIT_LOCALES.map(language => <div key={language} className="min-w-0 space-y-2 rounded-xl bg-dashbg p-3">
                                            <p className="text-xs font-bold text-ink">{LOCALE_NAMES[language]}</p>
                                            <label className="block text-xs text-muted" htmlFor={`${resource.id}-${language}-title`}>عنوان الزر</label>
                                            <input id={`${resource.id}-${language}-title`} lang={language} dir={language === "ar" ? "rtl" : "ltr"} maxLength={160}
                                                value={resource.titles?.[language] || ""} placeholder={fixed ? KIT_COPY[language].links[resource.id as KitLinkId] : "عنوان الرابط"}
                                                onChange={event => update(resource.id, { titles: { ...resource.titles, [language]: event.target.value } })} className={fieldClass} />
                                            <label className="block text-xs text-muted" htmlFor={`${resource.id}-${language}-url`}>رابط خاص بهذه اللغة</label>
                                            <input id={`${resource.id}-${language}-url`} dir="ltr" inputMode="url" autoComplete="off" maxLength={2048}
                                                value={resource.localizedUrls?.[language] || ""} placeholder="اتركه فارغًا لاستخدام الرابط العام"
                                                onChange={event => {
                                                    const localizedUrls = { ...resource.localizedUrls };
                                                    if (event.target.value.trim()) localizedUrls[language] = event.target.value;
                                                    else delete localizedUrls[language];
                                                    update(resource.id, { localizedUrls });
                                                }} className={fieldClass} />
                                        </div>)}
                                    </div>
                                </details>
                                {!fixed && <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <label className="text-xs text-muted">الأيقونة<select value={resource.icon || "link"} onChange={event => update(resource.id, { icon: event.target.value as KitResource["icon"] })} className={`${fieldClass} mt-2`}>{Object.entries(iconLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                                    <label className="text-xs text-muted">اللون<select value={resource.tone} onChange={event => update(resource.id, { tone: event.target.value as KitResource["tone"] })} className={`${fieldClass} mt-2`}><option value="blue">أزرق</option><option value="green">أخضر</option><option value="gold">ذهبي</option></select></label>
                                </div>}
                            </article>;
                        })}
                        {resources.length === 0 && <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">لا توجد روابط. أضف رابطًا جديدًا، أو احفظ لإزالة جميع الروابط من الصفحة.</p>}
                        <button type="button" onClick={addLink} disabled={resources.length >= KIT_MAX_RESOURCES} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand/30 bg-brand/5 p-4 text-sm font-bold text-brand disabled:opacity-50"><Plus size={18} />إضافة رابط جديد</button>
                    </fieldset>
                    <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-lg">
                        <p className="text-xs text-muted">احفظ التعديلات لتظهر على الصفحة العامة.</p>
                        <button type="submit" disabled={!canEdit || saving || !dirty} className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white disabled:opacity-50"><Save size={17} />{saving ? "جارٍ الحفظ…" : "حفظ الروابط"}</button>
                    </div>
                </form>
                <aside className="self-start rounded-2xl border border-line bg-white p-4 xl:sticky xl:top-4">
                    <h2 className="mb-3 text-sm font-bold text-ink">معاينة الروابط قبل الحفظ</h2>
                    <div className="mb-4 flex rounded-xl bg-dashbg p-1" dir="ltr">{KIT_LOCALES.map(language => <button key={language} type="button" onClick={() => setPreviewLocale(language)} aria-pressed={previewLocale === language} className={`min-h-9 flex-1 rounded-lg px-1 text-xs font-semibold ${previewLocale === language ? "bg-brand text-white" : "text-muted"}`}>{LOCALE_NAMES[language]}</button>)}</div>
                    <div className="space-y-2" dir={previewLocale === "ar" ? "rtl" : "ltr"}>{resources.map(resource => {
                        const title = resource.titles?.[previewLocale] || resource.titles?.en || KIT_COPY[previewLocale].links[resource.id as KitLinkId];
                        const url = getKitResourceUrl(resource, previewLocale);
                        return <div key={resource.id} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm text-ink"><LinkIcon size={15} className="shrink-0 text-brand" /><span className="min-w-0 flex-1 break-words">{title}</span><span className={`text-[10px] ${url ? "text-green-700" : "text-muted"}`}>{url ? "مفعّل" : KIT_COPY[previewLocale].comingSoon}</span></div>;
                    })}</div>
                    <p className="mt-4 text-xs leading-relaxed text-muted">المعاينة تشمل التعديلات غير المحفوظة. الرابط العام: <span dir="ltr" className="inline-block">destekol.org/kit</span></p>
                </aside>
            </div>
        </>}
    </div>;
}
