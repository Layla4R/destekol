"use client";
import { adminFetch } from "@/lib/admin-fetch";
import type { NewsCategory } from "@/lib/news-categories";
import { useState } from "react";
export default function NewsCategoriesManager({ categories, onSaved }: {
    categories: NewsCategory[];
    onSaved: () => void;
}) {
    const [editing, setEditing] = useState<NewsCategory | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    async function save(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const response = await adminFetch("/api/admin/news/categories", { method: "PATCH", body: JSON.stringify(editing) });
            const result = await response.json();
            if (!response.ok)
                throw new Error(result.error || "Could not save category");
            setEditing(null);
            onSaved();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Could not save category");
        }
        finally {
            setSaving(false);
        }
    }
    return <details className="bg-white border border-line rounded-xl p-4 mb-5">
    <summary className="cursor-pointer font-bold text-sm">News categories / تصنيفات الأخبار</summary>
    <p className="text-xs text-muted mt-3">أسماء التصنيفات في الموقع حسب اللغة. «الكل» يعرض جميع التصنيفات.</p>
    <div className="flex flex-wrap gap-2 mt-3">{categories.map(category => <button key={category.slug} type="button" disabled={saving} onClick={() => { setEditing({ ...category, labels: { ...category.labels } }); setError(""); }} className="px-3 py-2 border rounded-lg text-sm">{category.labels.ar} / {category.labels.en}</button>)}</div>
    {editing && <form onSubmit={save} className="mt-4 space-y-3">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{["ar", "en", "tr", "fr"].map(locale => <label key={locale} className="text-xs font-bold">{locale.toUpperCase()}
        <input required maxLength={80} dir={locale === "ar" ? "rtl" : "ltr"} value={editing.labels[locale] || ""} onChange={e => setEditing({ ...editing, labels: { ...editing.labels, [locale]: e.target.value } })} className="block w-full mt-1 border border-line rounded-lg p-2 text-sm font-normal"/>
      </label>)}</div>
      {error && <p role="alert" className="text-danger text-sm">{error}</p>}
      <button disabled={saving} className="bg-brand text-white px-4 py-2 rounded-lg text-sm">{saving ? "Saving…" : "Save category / حفظ التصنيف"}</button>
      <button type="button" disabled={saving} onClick={() => setEditing(null)} className="mx-3 text-sm">Cancel</button>
    </form>}
  </details>;
}
