import { DESTEKOL_EMAIL } from "@/lib/public-contact";
const copy = {
    ar: {
        heading: "أسئلة عن Destekol",
        intro: "يعرض موقع Destekol حملات المساعدة والأخبار ومعلومات التواصل. اقرأ تفاصيل كل حملة وتواصل مع الفريق للتحقق من المعلومات قبل اتخاذ قرار التبرع.",
        questions: ["أين أجد حملات Destekol؟", "كيف أتحقق من تفاصيل حملة؟", "كيف أتواصل مع Destekol؟"],
        answers: ["تجد الحملات المنشورة في صفحة الحملات. افتح الحملة المعنية للاطلاع على وصفها والتحديثات المتاحة.", "راجع صفحة الحملة والأخبار المرتبطة بها. إذا لم تجد مصدر معلومة أو تقريراً، أرسل رابط الصفحة وسؤالك إلى الفريق.", `للاستفسارات وتصحيح المعلومات المنشورة، أرسل رابط الصفحة وتفاصيل طلبك إلى ${DESTEKOL_EMAIL}.`],
        links: ["الحملات", "الأخبار", "التواصل"],
    },
    en: {
        heading: "Questions about Destekol",
        intro: "Destekol’s website presents aid campaigns, news and contact information. Read each campaign’s details and contact the team to verify information before deciding to donate.",
        questions: ["Where can I find Destekol campaigns?", "How can I verify campaign details?", "How can I contact Destekol?"],
        answers: ["Published campaigns are listed on the campaigns page. Open an individual campaign to read its description and available updates.", "Review the campaign page and related news. If you cannot find a source or report, send the page link and your question to the team.", `For enquiries or corrections to published information, email the page link and your request to ${DESTEKOL_EMAIL}.`],
        links: ["Campaigns", "News", "Contact"],
    },
    fr: {
        heading: "Questions sur Destekol",
        intro: "Le site Destekol présente des campagnes d’aide, des actualités et les coordonnées de contact. Consultez les détails de chaque campagne et contactez l’équipe pour vérifier les informations avant de décider de faire un don.",
        questions: ["Où trouver les campagnes Destekol ?", "Comment vérifier les détails d’une campagne ?", "Comment contacter Destekol ?"],
        answers: ["Les campagnes publiées figurent sur la page des campagnes. Ouvrez une campagne pour lire sa description et les mises à jour disponibles.", "Consultez la page de la campagne et les actualités associées. Si une source ou un rapport manque, envoyez le lien de la page et votre question à l’équipe.", `Pour une question ou une correction, envoyez le lien de la page et votre demande à ${DESTEKOL_EMAIL}.`],
        links: ["Campagnes", "Actualités", "Contact"],
    },
    tr: {
        heading: "Destekol hakkında sorular",
        intro: "Destekol’un web sitesi yardım kampanyalarını, haberleri ve iletişim bilgilerini sunar. Bağış kararı vermeden önce kampanya ayrıntılarını okuyun ve bilgileri doğrulamak için ekiple iletişime geçin.",
        questions: ["Destekol kampanyalarını nerede bulabilirim?", "Kampanya bilgilerini nasıl doğrulayabilirim?", "Destekol ile nasıl iletişim kurabilirim?"],
        answers: ["Yayımlanan kampanyalar kampanyalar sayfasında yer alır. Açıklamayı ve mevcut güncellemeleri okumak için ilgili kampanyayı açın.", "Kampanya sayfasını ve ilgili haberleri inceleyin. Bir kaynak veya rapor bulamazsanız sayfa bağlantısını ve sorunuzu ekibe gönderin.", `Sorularınız veya yayımlanan bilgilerde düzeltme talepleriniz için sayfa bağlantısını ve talebinizi ${DESTEKOL_EMAIL} adresine gönderin.`],
        links: ["Kampanyalar", "Haberler", "İletişim"],
    },
};
export function getDestekolAnswers(locale: string) {
    return copy[locale as keyof typeof copy] || copy.tr;
}
