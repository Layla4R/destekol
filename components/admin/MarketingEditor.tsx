"use client";
import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import type { MarketingContent, MarketingProgram } from "@/lib/marketing-pages";

type Slug = "landing" | "programs";
const languageNames = { ar: "العربية", en: "English", fr: "Français", tr: "Türkçe" };
const fieldNames: Record<string, string> = {
  eyebrow: "Top line", heading: "Main heading", subheading: "Subheading", description: "Introduction",
  aboutEyebrow: "About label", aboutHeading: "About heading", aboutText: "About text",
  visionHeading: "Vision heading", visionText: "Vision text", programsHeading: "Programs heading",
  programsText: "Programs introduction", primaryLabel: "Learn about our programs button",
  allProgramsLabel: "Explore all programs button", contactLabel: "Contact button",
  brochureLabel: "Brochure button", ctaHeading: "Final call to action heading", ctaText: "Final call to action text",
  logoImage: "Logo image URL", heroImage: "Hero image URL", aboutImage: "About image URL",
  programImageOne: "Programs photo 1 URL", programImageTwo: "Programs photo 2 URL",
};
const landingFields = ["eyebrow","heading","description","primaryLabel","brochureLabel","aboutEyebrow","aboutHeading","aboutText","visionHeading","visionText","programsHeading","programsText","allProgramsLabel","ctaHeading","ctaText","contactLabel","logoImage","heroImage","aboutImage"] as const;
const programsFields = ["heading","description","brochureLabel","contactLabel","programImageOne","programImageTwo"] as const;
const iconOptions = ["food","home","heart","water","sprout","women","wheat","people","book","care","access","child","recycle","growth","shield"];

export default function MarketingEditor() {
  const [slug, setSlug] = useState<Slug>("landing");
  const [locale, setLocale] = useState<keyof typeof languageNames>("ar");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState<MarketingContent>({});
  const [published, setPublished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setBusy(true); setMessage("");
    try {
      const response = await adminFetch(`/api/admin/pages/marketing?slug=${slug}&locale=${locale}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load page");
      setTitle(data.title || ""); setDescription(data.description || "");
      setContent(data.content || {}); setPublished(Boolean(data.isPublished));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load page"); }
    finally { setBusy(false); }
  }, [slug, locale]);
  useEffect(() => { void load(); }, [load]);
  function updateField(key: string, value: string) { setContent(current => ({ ...current, [key]: value })); }
  function updateItem(collection: "programs" | "values", index: number, key: string, value: string) {
    setContent(current => {
      const rows = [...(current[collection] || [])] as MarketingProgram[];
      rows[index] = { ...rows[index], [key]: value };
      return { ...current, [collection]: rows };
    });
  }
  async function save() {
    setBusy(true); setMessage("");
    try {
      const response = await adminFetch("/api/admin/pages/marketing", { method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, locale, title, description, content, isPublished: published }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save page");
      setMessage("Saved successfully.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save page"); }
    finally { setBusy(false); }
  }
  const fields = slug === "landing" ? landingFields : programsFields;
  return <div className="p-6 sm:p-8 max-w-5xl w-full mx-auto text-slate-900">
    <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
      <div><h1 className="text-2xl font-bold">Landing page & Programs</h1><p className="text-sm text-slate-500">Edit the two campaign pages and their translations.</p></div>
      <a className="text-sm underline text-teal-700" href={`/${locale}/${slug}`} target="_blank" rel="noopener noreferrer">Preview page ↗</a>
    </div>
    <div className="flex flex-wrap gap-2 mb-4">{(["landing","programs"] as Slug[]).map(item => <button key={item} type="button" onClick={() => { setSlug(item); if (item === "landing" && !["ar","en"].includes(locale)) setLocale("ar"); }} className={`px-4 py-2 rounded-lg font-semibold ${slug === item ? "bg-teal-700 text-white" : "bg-white border"}`}>{item === "landing" ? "Google Ads landing" : "Our Programs"}</button>)}</div>
    <div className="flex flex-wrap gap-2 mb-6">{Object.entries(languageNames).filter(([code]) => slug === "programs" || ["ar","en"].includes(code)).map(([code,name]) => <button key={code} type="button" onClick={() => setLocale(code as keyof typeof languageNames)} className={`px-3 py-1.5 rounded-lg text-sm ${locale === code ? "bg-sky-100 border border-sky-500 font-bold" : "bg-white border"}`}>{name}</button>)}</div>
    {message && <p role="status" className="bg-sky-50 border border-sky-200 p-3 rounded-lg mb-4">{message}</p>}
    <div className="bg-white rounded-xl border p-5 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block text-sm font-semibold">Browser title<input value={title} onChange={event => setTitle(event.target.value)} className="mt-1 w-full rounded-lg border p-2.5" /></label>
        <label className="block text-sm font-semibold">Search description<input value={description} onChange={event => setDescription(event.target.value)} className="mt-1 w-full rounded-lg border p-2.5" /></label>
      </div>
      {locale === "ar" && <label className="flex gap-2 items-center text-sm font-semibold"><input type="checkbox" checked={published} onChange={event => setPublished(event.target.checked)} /> Published</label>}
      <div className="grid sm:grid-cols-2 gap-4">{fields.map(key => <label className="block text-sm font-semibold" key={key}>{fieldNames[key]}
        {(["description","aboutText","visionText","programsText","ctaText"].includes(key))
          ? <textarea rows={3} value={String(content[key] || "")} onChange={event => updateField(key,event.target.value)} className="mt-1 w-full rounded-lg border p-2.5" />
          : <input value={String(content[key] || "")} onChange={event => updateField(key,event.target.value)} className="mt-1 w-full rounded-lg border p-2.5" />}</label>)}</div>
      {slug === "landing" && <div><h2 className="text-lg font-bold mb-2">Values</h2><div className="space-y-3">{(content.values || []).map((value,index) => <div key={value.id} className="grid sm:grid-cols-3 gap-2 p-3 border rounded-lg">
        <input aria-label={`Value ${index + 1} title`} value={value.title} onChange={event => updateItem("values",index,"title",event.target.value)} className="border rounded-lg p-2" />
        <input aria-label={`Value ${index + 1} description`} value={value.description} onChange={event => updateItem("values",index,"description",event.target.value)} className="border rounded-lg p-2" />
        <select aria-label={`Value ${index + 1} icon`} value={value.icon} onChange={event => updateItem("values",index,"icon",event.target.value)} className="border rounded-lg p-2">{iconOptions.map(icon => <option key={icon}>{icon}</option>)}</select>
      </div>)}</div></div>}
      <div><div className="flex items-center justify-between mb-2"><h2 className="text-lg font-bold">{slug === "landing" ? "Program preview cards" : "Brochure programs"}</h2><button type="button" onClick={() => setContent(current => ({ ...current, programs: [...(current.programs || []), { id: `program-${Date.now()}`, title: "", description: "", icon: "heart" }] }))} className="text-sm text-teal-700 font-semibold">+ Add program</button></div>
        <div className="space-y-3">{(content.programs || []).map((program,index) => <div key={program.id} className="grid sm:grid-cols-[2fr_3fr_1fr_auto] gap-2 p-3 border rounded-lg items-start">
          <input aria-label={`Program ${index + 1} title`} placeholder="Title" value={program.title} onChange={event => updateItem("programs",index,"title",event.target.value)} className="border rounded-lg p-2 w-full" />
          <input aria-label={`Program ${index + 1} description`} placeholder="Description" value={program.description} onChange={event => updateItem("programs",index,"description",event.target.value)} className="border rounded-lg p-2 w-full" />
          <select aria-label={`Program ${index + 1} icon`} value={program.icon} onChange={event => updateItem("programs",index,"icon",event.target.value)} className="border rounded-lg p-2">{iconOptions.map(icon => <option key={icon}>{icon}</option>)}</select>
          <button type="button" aria-label={`Remove program ${index + 1}`} onClick={() => setContent(current => ({ ...current, programs: (current.programs || []).filter((_,i) => i !== index) }))} className="text-red-700 p-2">×</button>
        </div>)}</div></div>
      <p className="text-sm text-slate-500">The brochure button opens the association’s supplied Google Drive link. Contact buttons use the current language’s contact page.</p>
      <button type="button" onClick={save} disabled={busy} className="bg-teal-700 text-white font-bold px-6 py-2.5 rounded-lg disabled:opacity-50">{busy ? "Working…" : "Save page"}</button>
    </div>
  </div>;
}
