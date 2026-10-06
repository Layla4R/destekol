// app/[locale]/campaigns/page.tsx
import CampaignCard from "@/components/blocks/CampaignCard";
import DestekolPageIntro from "@/components/site/DestekolPageIntro";
import { normalizeDestekolBrandCopy } from "@/lib/destekol-brand-copy";
import { loadTranslations } from "@/lib/i18n";
import { getPageBySlug } from "@/lib/pageData";
import { getActiveCampaigns } from "@/lib/services/campaign.service";
import type { Metadata } from "next";
// 🌟 تحسين الأداء: تحديث الصفحة في الكاش كل 60 ثانية بدلاً من (0)
// هذا سيجعل الصفحة تفتح في أجزاء من الثانية للزوار ويخفف الضغط عن قاعدة البيانات
export const revalidate = 60;
export async function generateMetadata({ params: { locale } }: {
    params: {
        locale: string;
    };
}): Promise<Metadata> {
    const dict = await loadTranslations(locale);
    const isDestekol = true;
    const rawTitle = dict["campaigns.page_title"] || (locale === "ar" ? "الحملات النشطة" : locale === "fr" ? "Campagnes Actives" : locale === "tr" ? "Aktif Kampanyalar" : "Active Campaigns");
    const rawDescription = dict["campaigns.page_desc"] || (locale === "ar" ? "ادعم حملاتنا الإنسانية وساعد الأسر المحتاجة حول العالم" : "Support our humanitarian campaigns and help families in need around the world");
    const { title, description } = normalizeDestekolBrandCopy({ title: rawTitle, description: rawDescription }, locale);
    return { title, description, openGraph: { title, description } };
}
export default async function CampaignsPage({ params: { locale } }: {
    params: {
        locale: string;
    };
}) {
    // 🌟 جلب البيانات المتوازية (Parallel Data Fetching) بدون كود قواعد بيانات
    const [campaigns, dict, page] = await Promise.all([
        getActiveCampaigns(locale),
        loadTranslations(locale),
        getPageBySlug("campaigns", locale),
    ]);
    const isDestekol = true;
    const rawTitle = page?.title || dict["campaigns.title"] || "الحملات النشطة";
    const rawDescription = page?.description || dict["campaigns.subtitle"] || "ادعم حملاتنا الإنسانية واصنع الفرق";
    const { title, description, displayCampaigns } = normalizeDestekolBrandCopy({ title: rawTitle, description: rawDescription, displayCampaigns: campaigns }, locale);
    return (<div>
      {<DestekolPageIntro locale={locale} title={title} description={description}/>}

      {/* 🌟 Content */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        {displayCampaigns.length === 0 ? (<p className="text-center text-muted py-20">
            {dict["campaigns.no_campaigns"] || "لا توجد حملات نشطة حالياً."}
          </p>) : (<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {displayCampaigns.map((c: any) => (<CampaignCard key={c.id} {...c} locale={locale} dict={dict}/>))}
          </div>)}
      </div>
    </div>);
}
