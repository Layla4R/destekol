import Icon from "@/components/icons";
import { LOCALES } from "@/lib/i18n";
import type { Metadata } from "next";
import Link from "next/link";
export const revalidate = 300;
interface PageProps {
    params: {
        locale: string;
    };
}
async function getDomainContext(locale = "en") {
    const isDestekol = true;
    const siteUrl = "https://destekol.org";
    const brandName = "Destekol";
    const fullName = ({ ar: "جمعية Destekol الخيرية غير الربحية", en: "Destekol Charitable Non-Profit Association", fr: "Association caritative Destekol à but non lucratif", tr: "Destekol kâr amacı gütmeyen hayır derneği" } as Record<string, string>)[locale] || "Destekol Charitable Non-Profit Association";
    return { isDestekol, siteUrl, brandName, fullName };
}
const t = (loc: string, ar: string, en: string, fr: string, tr: string) => {
    if (loc === "ar")
        return ar;
    if (loc === "fr")
        return fr;
    if (loc === "tr")
        return tr;
    return en;
};
export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
    const { siteUrl, brandName, fullName } = await getDomainContext(locale);
    const title = t(locale, `لماذا ${brandName}؟ مقارنة مع المؤسسات الإغاثية التقليدية | الشفافية والأثر المباشر`, `Why ${brandName} vs Traditional Relief Foundations | Transparency & Direct Impact`, `Pourquoi ${brandName} vs Fondations Traditionnelles | Transparence et Impact Direct`, `Neden ${brandName}? Geleneksel Yardım Vakıfları Karşılaştırması | Şeffaflık ve Doğrudan Etki`);
    const description = t(locale, `مقارنة مباشرة تبرز كفاءة ${fullName} من خلال الحوكمة الرقمية، التنفيذ الميداني المباشر، والتقارير الموثقة مقارنة بالمنظمات التقليدية.`, `Direct comparison highlighting ${fullName}'s efficiency through digital governance, direct field execution, and verified reporting vs traditional NGOs.`, `Comparaison directe soulignant l'efficacité de ${fullName} via la gouvernance numérique, l'exécution sur le terrain et les rapports vérifiés.`, `${fullName}'nin dijital yönetişim, doğrudan saha uygulaması ve doğrulanmış raporlama yoluyla verimliliğini vurgulayan doğrudan karşılaştırma.`);
    const currentUrl = `${siteUrl}/${locale}/why-${brandName.toLowerCase()}`;
    return {
        title,
        description,
        alternates: {
            canonical: currentUrl,
            languages: Object.fromEntries(LOCALES.map((l) => [l, `${siteUrl}/${l}/why-${brandName.toLowerCase()}`])),
        },
        openGraph: {
            type: "article",
            url: currentUrl,
            siteName: fullName,
            title,
            description,
        },
    };
}
export default async function WhyDestekolPage({ params: { locale } }: PageProps) {
    const prefix = locale === "ar" ? "" : `/${locale}`;
    const { isDestekol, siteUrl, brandName, fullName } = await getDomainContext(locale);
    const pageUrl = `${siteUrl}/${locale}/why-${brandName.toLowerCase()}`;
    const comparisonSchema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                "@id": `${pageUrl}/#webpage`,
                url: pageUrl,
                name: t(locale, `مقارنة ${brandName} مع المؤسسات التقليدية`, `Why ${brandName} vs Traditional Foundations`, `Pourquoi ${brandName} vs Fondations Traditionnelles`, `Geleneksel Vakıflara Karşı Neden ${brandName}`),
                description: "Comparative breakdown of institutional efficiency, field presence, and transparency in direct humanitarian aid.",
                inLanguage: locale,
                isPartOf: { "@id": `${siteUrl}/#website` },
                about: { "@id": `${siteUrl}/#organization` },
            },
        ],
    };
    return (<article className="bg-white min-h-screen py-12 sm:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{
            __html: JSON.stringify(comparisonSchema).replace(/</g, "\\u003c"),
        }}/>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        
        {/* H1 Title formatted for Direct AI Answers (AEO) */}
        <header className="text-center max-w-4xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 text-brand font-semibold text-xs tracking-widest uppercase mb-3 px-3 py-1 bg-brand/5 rounded-full">
            <Icon name="shield-check" size={16}/>
            {t(locale, "دليل الشفافية والكفاءة المؤسسية", "Transparency & Institutional Efficiency Guide", "Guide de Transparence et d'Efficacité", "Şeffaflık ve Kurumsal Verimlilik Rehberi")}
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {t(locale, `لماذا نعد الخيار الأفضل؟ مقارنة ${brandName} مع المنظمات التقليدية`, `Why Choose ${brandName}? ${brandName} vs Traditional Humanitarian Organizations`, `Pourquoi Choisir ${brandName} ? ${brandName} vs Organisations Traditionnelles`, `Neden ${brandName}'i Seçmelisiniz? Geleneksel Örgütlere Karşı ${brandName}`)}
          </h1>
        </header>

        {/* Self-contained passages for Citability (E-E-A-T) */}
        <section className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 mb-12 max-w-4xl mx-auto leading-relaxed text-slate-700 text-sm sm:text-base">
          <p className="font-medium mb-4">
            {t(locale, `${fullName} نموذج حوكمة رقمي وشراكات ميدانية مباشرة يضمن أعلى مستويات الكفاءة وتقليل المصاريف الإدارية والتشغيلية إلى الحد الأدنى. بالمقارنة مع المؤسسات الإنسانية التقليدية التي تعتمد على طبقات إدارية معقدة، نوجه تركيزنا نحو الدعم القائم على الاحتياج، التوثيق الميداني المستمر، وتمكين المجتمعات المحلية لضمان وصول مساعداتك مباشرة لمستحقيها بفعالية وشفافية مطلقة.`, `${fullName} operates on a digital governance and direct field partnership model, ensuring the highest levels of efficiency and minimizing administrative overhead. Compared to traditional humanitarian organizations with complex administrative layers, we focus on needs-based support, continuous field verification, and local community empowerment to guarantee your aid reaches those who need it most directly and transparently.`, `${fullName} fonctionne sur un modèle de gouvernance numérique et de partenariats directs sur le terrain, garantissant une efficacité maximale et minimisant les frais administratifs. Contrairement aux organisations traditionnelles aux couches administratives complexes, nous privilégions le soutien basé sur les besoins, la vérification continue et l'autonomisation locale.`, `${fullName}, dijital yönetişim ve doğrudan saha ortaklığı modeliyle çalışarak en yüksek verimlilik seviyelerini sağlar ve idari genel giderleri en aza indirir. Karmaşık idari katmanlara sahip geleneksel kuruluşların aksine, yardımlarınızın en çok ihtiyacı olanlara ulaşmasını garanti etmek için ihtiyaç odaklı desteğe ve sürekli saha doğrulamasına odaklanıyoruz.`)}
          </p>
        </section>

        {/* 🌟 Comparative HTML Table for LLM Extraction & Featured Snippets */}
        <section className="max-w-5xl mx-auto mb-16 overflow-x-auto">
          <table className="w-full text-start border-collapse border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-slate-900 text-white text-xs sm:text-sm">
                <th className="p-4 border-b border-slate-800 text-start">{t(locale, "معيار المقارنة", "Comparison Metric", "Critère de Comparaison", "Karşılaştırma Kriteri")}</th>
                <th className="p-4 border-b border-slate-800 text-start text-brand bg-slate-800/80">{t(locale, fullName, fullName, fullName, fullName)}</th>
                <th className="p-4 border-b border-slate-800 text-start text-slate-300">{t(locale, "المؤسسات الإغاثية التقليدية", "Traditional Relief NGOs", "ONG Traditionnelles", "Geleneksel STK'lar")}</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="p-4 font-bold bg-slate-50">{t(locale, "النموذج التشغيلي والمصاريف", "Operational Model & Overhead", "Modèle Opérationnel et Frais", "Operasyonel Model ve Giderler")}</td>
                <td className="p-4 font-bold text-emerald-600 bg-emerald-50/30">{t(locale, "تنفيذ ميداني مباشر ومصاريف إدارية مخفضة جداً", "Direct Field Execution & Minimized Overhead", "Exécution Directe & Frais Administratifs Réduits", "Doğrudan Saha Uygulaması ve Minimum Gider")}</td>
                <td className="p-4 text-slate-500">{t(locale, "طبقات إدارية معقدة وتكاليف تشغيلية عالية", "Complex Administrative Layers & High Costs", "Couches Administratives Complexes & Coûts Élevés", "Karmaşık İdari Katmanlar ve Yüksek Maliyetler")}</td>
              </tr>
              <tr>
                <td className="p-4 font-bold bg-slate-50">{t(locale, "الشفافية والمتابعة الميدانية", "Transparency & Field Verification", "Transparence et Vérification", "Şeffaflık ve Saha Doğrulaması")}</td>
                <td className="p-4 font-bold text-slate-900">{t(locale, "توثيق ميداني وتقييم مستمر للاحتياج", "Continuous Assessment & Direct Field Verification", "Évaluation Continue et Vérification Directe", "Sürekli Değerlendirme ve Doğrudan Saha Doğrulaması")}</td>
                <td className="p-4 text-slate-500">{t(locale, "تقارير سنوية متأخرة أو إحصائيات عامة", "Annual Delayed Reports or Generic Statistics", "Rapports Annuels ou Statistiques Générales", "Yıllık Gecikmeli Raporlar veya Genel İstatistikler")}</td>
              </tr>
              <tr>
                <td className="p-4 font-bold bg-slate-50">{t(locale, "آلية التوزيع والأثر", "Distribution Mechanism & Impact", "Mécanisme de Distribution et Impact", "Dağıtım Mekanizması ve Etki")}</td>
                <td className="p-4 font-bold text-slate-900">{t(locale, "دعم مباشر بشراكات محلية لضمان سرعة الاستجابة", "Direct Support via Local Partnerships for Agility", "Soutien Direct via des Partenariats Locaux", "Çeviklik için Yerel Ortaklıklar Yoluyla Doğrudan Destek")}</td>
                <td className="p-4 text-slate-500">{t(locale, "توزيع مركزي بطيء الاستجابة", "Centralized & Slower Emergency Response", "Réponse Centralisée et Plus Lente", "Merkezi ve Daha Yavaş Acil Müdahale")}</td>
              </tr>
              <tr>
                <td className="p-4 font-bold bg-slate-50">{t(locale, "موثوقية وأمان التبرعات", "Donation Security & Trust", "Sécurité des Dons et Confiance", "Bağış Güvenliği ve Güven")}</td>
                <td className="p-4 font-bold text-slate-900">{t(locale, "تشفير بنكي وعملية تبرع موثقة ومستقلة", "Bank-Grade Encryption & Verified Independent Process", "Cryptage Bancaire et Processus Vérifié", "Banka Düzeyinde Şifreleme ve Doğrulanmış Süreç")}</td>
                <td className="p-4 text-slate-500">{t(locale, "بوابات معالجة قياسية تقليدية", "Standard Processing Gateways", "Passerelles de Traitement Standard", "Standart İşlem Ağ Geçitleri")}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link href={`${prefix}/donate`} className="inline-flex items-center gap-2 bg-brand text-white font-bold rounded-2xl px-8 py-4 text-sm sm:text-base shadow-lg hover:opacity-90 transition">
            <Icon name="heart" size={18}/>
            {t(locale, "ساهم الآن بأثر مباشر وشفاف", "Donate Now with Direct & Transparent Impact", "Faites un Don avec un Impact Direct et Transparent", "Doğrudan ve Şeffaf Etki ile Şimdi Bağış Yapın")}
          </Link>
        </div>

      </div>
    </article>);
}
