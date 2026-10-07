import { policies, POLICY_UPDATED_AT } from "@/lib/current-policies";
import { getPolicyMetadata } from "@/lib/policy-metadata";
import Link from "next/link";

const labels: Record<string, { updated: string; contents: string; related: string; contact: string }> = {
    ar: { updated: 'آخر تحديث', contents: 'محتويات السياسة', related: 'السياسات ذات الصلة', contact: 'التواصل الرسمي' },
    en: { updated: 'Last updated', contents: 'Policy contents', related: 'Related policies', contact: 'Official contact' },
    fr: { updated: 'Dernière mise à jour', contents: 'Sommaire de la politique', related: 'Politiques connexes', contact: 'Contact officiel' },
    tr: { updated: 'Son güncelleme', contents: 'Politika içeriği', related: 'İlgili politikalar', contact: 'Resmî iletişim' },
};

export default function LegalPageContent({ slug, locale }: { slug: string; locale: string }) {
    const language = policies[locale] ? locale : 'ar';
    const sections = policies[language][slug];
    if (!sections) return null;
    const copy = labels[language];
    const date = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${POLICY_UPDATED_AT}T00:00:00Z`));
    // The document title and subtitle are displayed by the page introduction.
    const body = sections.slice(1);
    return <div className="bg-slate-50/50 py-12 border-t border-slate-100" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-screen-xl mx-auto px-6">
            <p className="mb-6 text-sm text-slate-500">{copy.updated}: <time dateTime={POLICY_UPDATED_AT}>{date}</time></p>
            <nav aria-label={copy.contents} className="mb-8 flex flex-wrap gap-3">
                {body.map((section, index) => <a key={section.title} href={`#policy-section-${index}`} className="text-brand underline underline-offset-4">{section.title}</a>)}
            </nav>
            {body.map((section, index) => <section id={`policy-section-${index}`} key={section.title} className="mb-6 scroll-mt-24 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4">{section.title}</h2>
                {section.text.includes('\t') ? <div className="overflow-x-auto">
                    <table className="w-full min-w-[32rem] border-collapse text-start text-slate-600 leading-relaxed">
                        <thead><tr>{section.text.split('\n')[0].split('\t').map(cell => <th key={cell} scope="col" className="border border-slate-200 bg-slate-50 p-3 text-start font-bold">{cell}</th>)}</tr></thead>
                        <tbody>{section.text.split('\n').slice(1).map((row, rowIndex) => <tr key={rowIndex}>{row.split('\t').map((cell, cellIndex) => <td key={cellIndex} className="border border-slate-200 p-3 align-top">{cell}</td>)}</tr>)}</tbody>
                    </table>
                </div> : <div className="space-y-3 text-slate-600 leading-loose">{section.text.split('\n').filter(Boolean).map((paragraph, paragraphIndex) => <p key={paragraphIndex} className="whitespace-pre-wrap break-words">{paragraph}</p>)}</div>}
            </section>)}
            <nav className="mt-8 flex flex-wrap gap-4" aria-label={copy.related}>
                {Object.keys(policies[language]).filter(key => key !== slug && key !== 'how-we-use-donations').map(key => <Link key={key} href={`/${language}/${key}`} className="text-brand underline underline-offset-4">{getPolicyMetadata(key, language).title}</Link>)}
            </nav>
            <section className="mt-8 rounded-3xl bg-slate-900 p-8 text-center">
                <h2 className="text-xl font-bold mb-4 text-white">{copy.contact}</h2>
                <a href={`mailto:info@destekol.org?subject=${encodeURIComponent(sections[0].title)}`} className="inline-block rounded-xl bg-brand px-6 py-3 font-bold text-white" dir="ltr">info@destekol.org</a>
            </section>
        </div>
    </div>;
}
