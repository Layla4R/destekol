import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Domain Ownership Declaration",
    description: "Official domain ownership declaration for destekol.org.",
};

export default function GoogleVerificationPage() {
    return <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <section lang="en" dir="ltr">
        <h1 className="text-2xl font-bold">Domain Ownership Declaration</h1>
        <p className="mt-6">This domain (<strong>destekol.org</strong>) is owned and operated as the official web domain for:</p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li><strong>Legal Name:</strong> DESTEK OL İNSANİ YARDIM VE KALKINDIRMA DERNEĞİ</li>
          <li><strong>Official Domain:</strong> destekol.org</li>
          <li><strong>Purpose:</strong> Official website for Google for Nonprofits and Google Workspace activation.</li>
        </ul>
      </section>
      <section lang="tr" dir="ltr" className="mt-12 border-t border-gray-200 pt-10">
        <h2 className="text-2xl font-bold">Alan Adı Sahipliği Beyanı</h2>
        <p className="mt-6">Bu alan adı (<strong>destekol.org</strong>), aşağıdaki derneğin resmî web alan adı olarak sahiplenilmekte ve işletilmektedir:</p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li><strong>Yasal Adı:</strong> DESTEK OL İNSANİ YARDIM VE KALKINDIRMA DERNEĞİ</li>
          <li><strong>Resmî Alan Adı:</strong> destekol.org</li>
          <li><strong>Amacı:</strong> Google for Nonprofits ve Google Workspace etkinleştirmesi için resmî web sitesi.</li>
        </ul>
      </section>
    </article>;
}
