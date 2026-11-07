import Link from "next/link";
import { Fragment } from "react";
import Image from "next/image";
import { BROCHURE_URL, type MarketingContent } from "@/lib/marketing-pages";
import { MarketingIcon } from "./MarketingLanding";
import styles from "./marketing.module.css";

export default function MarketingPrograms({ locale, content }: { locale: string; content: MarketingContent }) {
  return <article className={styles.programsPage} dir={locale === "ar" ? "rtl" : "ltr"}>
    <div className={styles.programsInner}>
      <p className={styles.sectionEyebrow}>Destek Ol</p>
      <h1>{content.heading}</h1><div className={styles.goldRule} />
      <p className={styles.programsIntro}>{content.description}</p>
      <div className={styles.brochureList}>{(content.programs || []).map((program, index) => <Fragment key={program.id}><section className={styles.brochureRow}>
        <span className={styles.programNumber}>{new Intl.NumberFormat(locale === "ar" ? "ar" : locale).format(index + 1)}</span>
        <span className={styles.brochureIcon}><MarketingIcon name={program.icon} size={35} /></span>
        <div><h2>{program.title}</h2>{program.description && <p>{program.description}</p>}</div>
      </section>{(index === 7 || index === 14) && <Image
        src={index === 7 ? (content.programImageOne || "/marketing/program-photo-1.png") : (content.programImageTwo || "/marketing/program-photo-2.png")}
        width={1518} height={index === 7 ? 495 : 580}
        sizes="(max-width: 900px) 100vw, 790px"
        className={styles.brochurePhoto}
        alt={index === 7 ? "Women working in a sewing workshop" : "Community support consultation"}
      />}</Fragment>)}</div>
      <div className={styles.programsActions}>
        <a href={BROCHURE_URL} target="_blank" rel="noopener noreferrer" className={styles.goldButton}>{content.brochureLabel}</a>
        <Link href={`/${locale}/contact`} className={styles.outlineButton}>{content.contactLabel}</Link>
      </div>
    </div>
  </article>;
}
