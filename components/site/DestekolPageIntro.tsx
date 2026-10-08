import DestekolAchievements from "@/components/site/DestekolAchievements";
import { normalizeDestekolBrandText } from "@/lib/destekol-brand-copy";
import { getPageBySlug } from "@/lib/pageData";
import Image from "next/image";
import Link from "next/link";
interface Props {
    locale: string;
    title: string;
    description?: string | null;
    donateLabel?: string;
}
export default async function DestekolPageIntro({ locale, title, description, donateLabel }: Props) {
    const homePage = await getPageBySlug("home", locale);
    const sections = Array.isArray(homePage?.sections) ? homePage.sections : [];
    const heroProps = sections.find((section: any) => section.type === "hero")?.props || {};
    const slides = Array.isArray(heroProps.slides) ? heroProps.slides : [];
    const image = slides
        .map((slide: any) => slide.backgroundImage || slide.image)
        .find((src: unknown) => typeof src === "string" && src.trim());
    const achievementProps = sections.find((section: any) => section.type === "destekol_achievements")?.props;
    const ctaLabel = donateLabel || ({ ar: "تبرع الآن", en: "Donate Now", fr: "Faire un don", tr: "Bağış Yap" }[locale] || "Donate Now");
    const displayTitle = normalizeDestekolBrandText(title, locale);
    const displayDescription = description ? normalizeDestekolBrandText(description, locale) : description;
    return (<>
      <section className="destekol-inner-page-banner" dir="ltr" aria-labelledby="destekol-page-title">
        {image && <Image src={image} alt="" fill priority sizes="100vw" className="destekol-inner-page-banner-image"/>}
        <div className="destekol-inner-page-banner-overlay" aria-hidden="true"/>
        <div className="destekol-inner-page-banner-copy" dir={locale === "ar" ? "rtl" : "ltr"}>
          <h1 id="destekol-page-title">{displayTitle}</h1>
          {displayDescription && <p>{displayDescription}</p>}
          <Link href={`/${locale}/donate`} className="destekol-inner-page-banner-cta">{ctaLabel}<span aria-hidden="true">→</span></Link>
        </div>
        <svg className="destekol-inner-page-banner-wave" viewBox="0 0 1440 110" preserveAspectRatio="none" aria-hidden="true">
          <path fill="#80d0d3" opacity=".72" d="M0 35C160 94 290 5 480 36s296 70 470 16 330-14 490 12v46H0Z"/>
          <path fill="#d8f1f2" d="M0 76C190 18 300 107 493 65s277 25 451 5 320-67 496-24v64H0Z"/>
          <path fill="white" d="M0 89C176 38 326 95 490 79s302-27 466 3 321-41 484-18v46H0Z"/>
        </svg>
      </section>
      {achievementProps && <DestekolAchievements data={achievementProps} locale={locale}/>}
    </>);
}
