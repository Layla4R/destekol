import { policies } from "@/lib/current-policies";
import { getPolicyMetadata } from "@/lib/policy-metadata";
import { launchCopy,normalizePublicContact,officialEmail } from "@/lib/public-contact";
import Link from "next/link";
export default function LegalPageContent({ slug, locale }: {
    slug: string;
    locale: string;
}) {
    const isRestored = false;
    const email = officialEmail(!isRestored);
    const copy = normalizePublicContact(launchCopy[locale] || launchCopy.ar, email);
    const sections = normalizePublicContact((policies[locale] || policies.ar)[slug], email);
    if (!sections)
        return null;
    const heading = { ar: "قناة التواصل الرسمية", en: "Official contact", fr: "Contact officiel", tr: "Resmî iletişim" }[locale] || "قناة التواصل الرسمية";
    const updated = { ar: "آخر تحديث: 24 سبتمبر 2026", en: "Updated: 24 September 2026", fr: "Mise à jour : 24 septembre 2026", tr: "Güncelleme: 24 Eylül 2026" }[locale] || "24 September 2026";
    return <div className="bg-slate-50/50 py-12 border-t border-slate-100" dir={isRestored && locale !== 'en' || locale === "ar" ? "rtl" : "ltr"}>
    <div className="max-w-screen-xl mx-auto px-6">
      {!isRestored && <><p className="mb-4 text-sm text-slate-500">{updated}</p>
      <p className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-slate-800">{copy.status}</p></>}
      <nav aria-label={heading} className="mb-8 flex flex-wrap gap-3">{sections.map((section, index) => <a key={section.title} href={`#policy-section-${index}`} className="text-brand underline underline-offset-4">{section.title}</a>)}</nav>
      {sections.map((section, index) => <section id={`policy-section-${index}`} key={section.title} className="mb-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-4">{section.title}</h2>
        {section.text.startsWith("• ") ? <ul className="list-disc ps-6 space-y-3 text-slate-600 leading-loose">{section.text.split("\n").map(item => <li key={item}>{item.replace(/^• /, "")}</li>)}</ul> : <p className="whitespace-pre-wrap text-slate-600 leading-loose">{section.text}</p>}
      </section>)}
      <nav className="mt-8 flex flex-wrap gap-4" aria-label={heading}>
        {Object.keys(policies[locale] || policies.ar).filter(key => key !== slug).map(key => <Link key={key} href={`/${locale}/${key}`} className="text-brand underline underline-offset-4">{getPolicyMetadata(key, locale).title}</Link>)}
      </nav>
      {!isRestored && <section className="mt-8 rounded-3xl bg-slate-900 p-8 text-center">
        <h2 className="text-xl font-bold mb-4" style={{ color: "white" }}>{heading}</h2>
        <p className="mb-3 leading-loose" style={{ color: "#e2e8f0" }}>{copy.contact}</p>
        <p className="mb-6 text-sm" style={{ color: "#cbd5e1" }}>{copy.response}</p>
        <a href={`mailto:${email}?subject=${encodeURIComponent(sections[0].title)}`} className="inline-block rounded-xl bg-brand px-6 py-3 font-bold" style={{ color: "white" }} dir="ltr">{email}</a>
      </section>}
    </div>
  </div>;
}
