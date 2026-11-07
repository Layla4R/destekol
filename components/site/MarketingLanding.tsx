import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, BookOpen, Droplet, HeartPulse, ShieldCheck, Soup, Sprout, UsersRound, Accessibility, Recycle, HandHeart, House, Wheat, TrendingUp, Baby, HeartHandshake } from "lucide-react";
import type { MarketingContent } from "@/lib/marketing-pages";
import { BROCHURE_URL } from "@/lib/marketing-pages";
import styles from "./marketing.module.css";

const icons = { heart: HeartPulse, water: Droplet, food: Soup, sprout: Sprout, book: BookOpen,
  women: UsersRound, shield: ShieldCheck, people: UsersRound, access: Accessibility,
  recycle: Recycle, hand: HandHeart, home: House, wheat: Wheat, growth: TrendingUp,
  child: Baby, care: HeartHandshake };
export function MarketingIcon({ name, size = 40 }: { name: string; size?: number }) {
  const Icon = icons[name as keyof typeof icons] || HandHeart;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}

export default function MarketingLanding({ locale, content }: { locale: string; content: MarketingContent }) {
  const rtl = locale === "ar";
  const programsHref = `/${locale}/programs`;
  const Arrow = rtl ? ArrowLeft : ArrowRight;
  const values = content.values || [];
  const programs = (content.programs || []).slice(0, 6);
  return <article className={styles.landing} dir={rtl ? "rtl" : "ltr"}>
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <Image src={content.logoImage || "https://frfppicofkkeczdbndbi.supabase.co/storage/v1/object/public/media/destekol/uploads/1793703132925-rfgzex6uwj.png"} width={390} height={190} alt="Destek Ol" className={styles.logo} priority />
        <p className={styles.eyebrow}>{content.eyebrow}</p>
        <h1>{content.heading}</h1>
        <div className={styles.goldRule} />
        <p className={styles.heroDescription}>{content.description}</p>
        <div className={styles.heroActions}>
          <Link className={styles.goldButton} href={programsHref}>{content.primaryLabel}</Link>
          <a className={styles.outlineButton} href={BROCHURE_URL} target="_blank" rel="noopener noreferrer">{content.brochureLabel}</a>
        </div>
      </div>
      <div className={styles.heroMedia} style={{ backgroundImage: `url('${content.heroImage || "/marketing/landing-reference.png"}')` }} role="img" aria-label={rtl ? "فريق Destek Ol في موقع العمل الإنساني" : "Destek Ol humanitarian team in the field"} />
    </section>

    <section className={styles.values} aria-label={rtl ? "قيمنا" : "Our values"}>
      {values.map(value => <div className={styles.value} key={value.id}>
        <span className={styles.valueIcon}><MarketingIcon name={value.icon} size={45} /></span>
        <div><h2>{value.title}</h2><p>{value.description}</p></div>
      </div>)}
    </section>

    <section className={styles.about}>
      <div className={styles.aboutCopy}>
        <p className={styles.sectionEyebrow}>{content.aboutEyebrow}</p>
        <h2>{content.aboutHeading}</h2>
        <p>{content.aboutText}</p>
        <div className={styles.vision}><h3>{content.visionHeading}</h3><p>{content.visionText}</p></div>
      </div>
      <div className={styles.aboutMedia} style={{ backgroundImage: `url('${content.aboutImage || "/marketing/landing-reference.png"}')` }} role="img" aria-label={rtl ? "معدات وأعمال الجمعية" : "Association projects and equipment"} />
    </section>

    <section className={styles.programPreview}>
      <h2>{content.programsHeading}</h2><div className={styles.goldRule} />
      <p>{content.programsText}</p>
      <div className={styles.programGrid}>{programs.map(program => <Link href={programsHref} className={styles.programCard} key={program.id}>
        <span className={styles.programIcon}><MarketingIcon name={program.icon} /></span>
        <strong>{program.title}</strong>
      </Link>)}</div>
      <Link href={programsHref} className={styles.allPrograms}><Arrow size={25} aria-hidden="true" />{content.allProgramsLabel}</Link>
    </section>

    <section className={styles.cta}>
      <h2>{content.ctaHeading}</h2><p>{content.ctaText}</p>
      <div><a className={styles.goldButton} href={BROCHURE_URL} target="_blank" rel="noopener noreferrer">{content.brochureLabel}</a>
        <Link className={styles.outlineLight} href={`/${locale}/contact`}>{content.contactLabel}</Link></div>
    </section>
  </article>;
}
