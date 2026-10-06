import { getDestekolAnswers } from "@/lib/destekol-answers";
import Link from "next/link";
export default function DestekolAnswers({ locale }: {
    locale: string;
}) {
    const copy = getDestekolAnswers(locale);
    const url = `https://destekol.org/${locale}`;
    const schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": `${url}#destekol-answers`,
        inLanguage: locale,
        isPartOf: { "@id": `${url}/#webpage` },
        mainEntity: copy.questions.map((question, index) => ({
            "@type": "Question", name: question,
            url: `${url}#destekol-answer-${index}`,
            acceptedAnswer: { "@type": "Answer", text: copy.answers[index] },
        })),
    };
    return <section id="destekol-answers" className="border-y border-slate-100 bg-slate-50 py-12">
    <div className="mx-auto max-w-screen-xl px-6">
      <h2 className="text-2xl font-bold text-slate-900">{copy.heading}</h2>
      <p className="mt-4 max-w-3xl leading-loose text-slate-700">{copy.intro}</p>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {copy.questions.map((question, index) => <section key={question} id={`destekol-answer-${index}`} className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-bold text-slate-900">{question}</h3>
          <p className="mt-3 leading-loose text-slate-700">{copy.answers[index]}</p>
          <Link className="mt-4 inline-block text-blue-700 underline" href={`/${locale}/${["campaigns", "news", "contact"][index]}`}>{copy.links[index]}</Link>
        </section>)}
      </div>
    </div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}/>
  </section>;
}
