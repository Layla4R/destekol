"use client";
import Icon from "@/components/icons";
import { ExternalLink } from 'lucide-react';
import { normalizeDestekolBrandText } from "@/lib/destekol-brand-copy";
import type { PublicSiteSettings } from "@/lib/public-site-settings";
import Image from "next/image";
import Link from "next/link";
import { getPolicyMetadata } from "@/lib/policy-metadata";
interface NavItem {
    slug: string;
    title: string;
}
const LEGAL_SLUGS: Array<{
    slug: string;
    key: string;
    fallbacks: Record<string, string>;
}> = [
    {
        slug: "privacy",
        key: "legal.privacy",
        fallbacks: {
            ar: "سياسة الخصوصية",
            en: "Privacy Policy",
            fr: "Politique de Confidentialité",
            tr: "Gizlilik Politikası",
        },
    },
    {
        slug: "terms",
        key: "legal.terms",
        fallbacks: {
            ar: "الشروط والأحكام",
            en: "Terms & Conditions",
            fr: "Conditions d'Utilisation",
            tr: "Kullanım Koşulları",
        },
    },
    {
        slug: "refund-policy",
        key: "legal.refund_policy",
        fallbacks: {
            ar: "سياسة الاسترداد",
            en: "Refund Policy",
            fr: "Politique de Remboursement",
            tr: "İade Politikası",
        },
    },
    {
        slug: "cookie-policy",
        key: "legal.cookie_policy",
        fallbacks: {
            ar: "سياسة ملفات تعريف الارتباط",
            en: "Cookie Policy",
            fr: "Politique des Cookies",
            tr: "Çerez Politikası",
        },
    },
    {
        slug: "aml-policy",
        key: "legal.aml_policy",
        fallbacks: {
            ar: "مكافحة غسيل الأموال",
            en: "AML Policy",
            fr: "Politique Anti-Blanchiment",
            tr: "Kara Para Aklamayla Mücadele",
        },
    },
    {
        slug: "complaints",
        key: "legal.complaints",
        fallbacks: {
            ar: "سياسة الشكاوى",
            en: "Complaints Policy",
            fr: "Politique de Réclamations",
            tr: "Şikayet Politikası",
        },
    },
    {
        slug: "financial-transparency",
        key: "legal.financial_transparency",
        fallbacks: {
            ar: "الشفافية المالية",
            en: "Financial Transparency",
            fr: "Transparence Financière",
            tr: "Mali Şeffaflık",
        },
    },
    {
        slug: "how-we-use-donations",
        key: "legal.how_we_use_donations",
        fallbacks: {
            ar: "كيف نستخدم التبرعات",
            en: "How We Use Donations",
            fr: "Comment Nous Utilisons les Dons",
            tr: "Bağışları Nasıl Kullanıyoruz",
        },
    },
];
const SOCIAL_ICONS: Record<string, {
    icon: string;
    label: string;
}> = {
    facebookUrl: {
        icon: "facebook",
        label: "Facebook",
    },
    twitterUrl: {
        icon: "twitter",
        label: "Twitter",
    },
    instagramUrl: {
        icon: "instagram",
        label: "Instagram",
    },
    youtubeUrl: {
        icon: "youtube",
        label: "YouTube",
    },
    linkedinUrl: {
        icon: "linkedin",
        label: "LinkedIn",
    },
    tiktokUrl: {
        icon: "tiktok",
        label: "TikTok",
    },
};
const FOOTER_SOCIAL_LINKS = [
    { label: "Facebook", path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z", url: "https://www.facebook.com/profile.php?id=61595406984608", color: "#1877F2" },
    { label: "X", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.848L1.258 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z", url: "https://x.com/destekolorg", color: "#111111" },
    { label: "YouTube", path: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z", url: "https://www.youtube.com/@DESTEKOL_%C4%B0NSAN%C4%B0_YARDIM", color: "#FF0033" },
];
/* =========================================================
   DESTEKOL OFFICIAL INFORMATION
========================================================= */
/* ========================================================= */
export default function SiteFooter({ isDestekol = false, navItems = [], settings = {}, locale = "ar", dict = {}, }: {
    isDestekol?: boolean;
    navItems?: NavItem[];
    settings?: PublicSiteSettings | null;
    locale?: string;
    dict?: Record<string, string>;
}) {
    const p = `/${locale}`;
    const loc: "ar" | "en" | "fr" | "tr" = [
        "ar",
        "en",
        "fr",
        "tr",
    ].includes(locale)
        ? (locale as "ar" | "en" | "fr" | "tr")
        : "ar";
    const d = (key: string, fallbacks: Record<string, string> = {}) => {
        const value = (dict && dict[key]) ||
            fallbacks[loc] ||
            fallbacks["en"] ||
            "";
        return normalizeDestekolBrandText(value, loc);
    };
    /* =========================================================
       Social Links
    ========================================================= */
    const socialLinks = Object.entries(SOCIAL_ICONS)
        .filter(([key]) => !["facebookUrl", "twitterUrl", "youtubeUrl"].includes(key) && settings?.[key as keyof PublicSiteSettings])
        .map(([key, meta]) => ({
        url: settings?.[key as keyof PublicSiteSettings] as string,
        ...meta,
    }));
    /* =========================================================
       Brand Information Depending On Domain
    ========================================================= */
    const logoSrc = settings?.logoImage || "";
    const logoText = settings?.logoText || settings?.siteName || "";
    const siteName = settings?.siteName || "";
    /*
     * IMPORTANT:
     * Destekol always uses its own official email.
     * Destekol continues using OFFICIAL_EMAIL.
     */
    const contactEmail = settings?.contactEmail || "";
    const contactPhone = settings?.contactPhone;
    const whatsappUrl = (settings?.whatsappNumber ? `https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}` : "");
    const safeNavItems = Array.isArray(navItems)
        ? navItems
        : [];
    const legalItems = [
        ...LEGAL_SLUGS.filter(item => item.slug !== 'how-we-use-donations'),
        { slug: 'license', key: 'legal.license', fallbacks: {} },
        { slug: 'kvkk', key: 'legal.kvkk', fallbacks: {} },
    ];
    return (<footer className={`relative bg-sidebar-gradient text-white mt-auto overflow-hidden destekol-footer${loc === 'ar' ? ' destekol-footer--ar' : ''}`} role="contentinfo">
      {/* =====================================================
              Accent line
          ===================================================== */}

      <div className="h-1" style={{
            background: `var(--destekol-accent-gradient, ${settings?.accentColor ? `linear-gradient(to right, ${settings.accentColor}, ${settings.accentColor}cc)` : "linear-gradient(135deg, #F00F5A, #FF4D88)"})`,
        }}/>

      {/* =====================================================
              Footer Main Content
          ===================================================== */}

      <div className="destekol-footer-main relative max-w-screen-xl mx-auto px-4 sm:px-6 py-10 sm:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
        {/* ===================================================
            Brand Column
        =================================================== */}

        <div className="lg:col-span-1 destekol-footer-brand">
          <Link href={`${p}/`} aria-label={`${logoText} Home`}>
            {logoSrc ? <Image src={logoSrc} alt={logoText} width={175} height={70} className="h-11 w-auto object-contain mb-4"/> : <span>{logoText}</span>}
          </Link>

          {/* Tagline */}
          {false}

          {/* =================================================
          Organization Description
      ================================================= */}

          <p className="text-white/80 text-sm leading-relaxed mb-6">
            {settings?.footerDescription || ""}
          </p>
          {isDestekol && settings?.siteName && <p className="mb-5 text-sm leading-relaxed" lang={loc}>
            {({
              tr: "destekol.org web sitesi, ",
              en: "destekol.org is the official website of ",
              ar: "موقع destekol.org هو الموقع الإلكتروني الرسمي لـ",
              fr: "destekol.org est le site officiel de l’association ",
            }[loc])}
            <strong dir="ltr">{settings.siteName}</strong>
            {loc === "tr" ? "'nin resmi İnternet sitesidir." : "."}
          </p>}

          {/* =================================================
          Social Media
      ================================================= */}

          {socialLinks.length > 0 && (<nav aria-label="Social media channels" className="flex gap-2 flex-wrap mb-6">
              {socialLinks.map((s) => (<a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit our ${s.label} page`} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition">
                  <Icon name={s.icon as any} size={15} className="text-white/80"/>
                </a>))}
            </nav>)}

          {/* =================================================
          Donate Button
      ================================================= */}

          <Link href={`${p}/donate`} className="inline-flex items-center gap-2 hover:opacity-90 text-white font-bold rounded-xl px-5 py-2.5 text-sm transition shadow-md" style={{
            background: "linear-gradient(135deg, #D9A750, #C79239)",
        }}>
            <Icon name="heart" size={16}/>

            {d("nav.donate", {
            ar: "تبرع الآن",
            en: "Donate Now",
            fr: "Faire un Don",
            tr: "Bağış Yap",
        })}
          </Link>
          <nav aria-label="Facebook, X and YouTube" className="destekol-footer-featured-social" dir="ltr">
            {FOOTER_SOCIAL_LINKS.map((social) => <a key={social.label} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.label} title={social.label} style={{ backgroundColor: social.color }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={social.path}/></svg>
            </a>)}
          </nav>
        </div>

        {/* ===================================================
            Quick Links Column
        =================================================== */}

        <nav aria-label="Quick links">
          <h2 className="font-bold text-white/80 mb-5 text-sm tracking-[0.2em] uppercase">
            {d("footer.quick_links", {
            ar: "روابط سريعة",
            en: "Quick Links",
            fr: "Liens Rapides",
            tr: "Hızlı Bağlantılar",
        })}
          </h2>

          <ul className="space-y-2.5 text-sm text-white/80">
            {/* Destekol-specific quick links */}
            {false}

            {/* Institutional partnerships */}
            {false}

            {/* Dynamic navigation */}
            {safeNavItems.map((item) => {
            const navKey = `nav.${item.slug}`;
            const translatedTitle = (dict && dict[navKey]) ||
                (item.slug === "home"
                    ? d("nav.home", {
                        ar: "الرئيسية",
                        en: "Home",
                        fr: "Accueil",
                        tr: "Ana Sayfa",
                    })
                    : item.slug === "about" ||
                        item.slug === "about-us"
                        ? d("nav.about", {
                            ar: "من نحن",
                            en: "About Us",
                            fr: "À Propos",
                            tr: "Hakkımızda",
                        })
                        : item.slug === "our-work" ||
                            item.slug === "sectors"
                            ? d("nav.our_work", {
                                ar: "مجالات عملنا",
                                en: "Our Work",
                                fr: "Nos Domaines",
                                tr: "Faaliyetlerimiz",
                            })
                            : item.slug === "projects"
                                ? d("nav.projects", {
                                    ar: "المشاريع الإنسانية",
                                    en: "Projects",
                                    fr: "Projets",
                                    tr: "Projelerimiz",
                                })
                                : item.slug ===
                                    "transparency" ||
                                    item.slug ===
                                        "financial-transparency"
                                    ? d("nav.transparency", {
                                        ar: "الشفافية",
                                        en: "Transparency",
                                        fr: "Transparence",
                                        tr: "Şeffaflık",
                                    })
                                    : item.slug === "contact"
                                        ? d("nav.contact", {
                                            ar: "اتصل بنا",
                                            en: "Contact Us",
                                            fr: "Contact",
                                            tr: "İletişim",
                                        })
                                        : item.title);
            /*
             * Contact is added manually below
             * to prevent duplication.
             */
            if (item.slug === "contact") {
                return null;
            }
            return (<li key={item.slug}>
                  <Link href={item.slug === "home"
                    ? `${p}/`
                    : `${p}/${item.slug}`} className="flex items-center gap-2 hover:text-white transition group">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/60 group-hover:bg-white transition" aria-hidden="true"/>

                    {translatedTitle}
                  </Link>
                </li>);
        })}

            {/* Campaigns */}
            <li>
              <Link href={`${p}/campaigns`} className="flex items-center gap-2 hover:text-white transition group">
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 group-hover:bg-white transition" aria-hidden="true"/>

                {d("nav.campaigns", {
            ar: "الحملات الإغاثية",
            en: "Campaigns",
            fr: "Campagnes",
            tr: "Kampanyalar",
        })}
              </Link>
            </li>

            {/* News */}
            <li>
              <Link href={`${p}/news`} className="flex items-center gap-2 hover:text-white transition group">
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 group-hover:bg-white transition" aria-hidden="true"/>

                {d("nav.news", {
            ar: "الأخبار والميدان",
            en: "News",
            fr: "Actualités",
            tr: "Haberler",
        })}
              </Link>
            </li>

            {/* Contact */}
            <li>
              <Link href={`${p}/contact`} className="flex items-center gap-2 hover:text-white transition group">
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 group-hover:bg-white transition" aria-hidden="true"/>

                {d("nav.contact", {
            ar: "اتصل بنا",
            en: "Contact Us",
            fr: "Contactez-nous",
            tr: "Bize Ulaşın",
        })}
              </Link>
            </li>
          </ul>
        </nav>

        {/* ===================================================
            Legal Policies Column
        =================================================== */}

        <nav aria-label="Legal & Transparency policies">
          <h2 className="font-bold text-white/80 mb-5 text-sm tracking-[0.2em] uppercase">
            {d("footer.legal", {
            ar: "السياسات والشفافية",
            en: "Legal Policies",
            fr: "Politiques Légales",
            tr: "Yasal Politikalar",
        })}
          </h2>

          <ul className="space-y-2.5 text-sm text-white/80">
            {legalItems.map((item) => (<li key={item.slug}>
                <Link href={`${p}/${item.slug}`} className="flex items-center gap-2 hover:text-white transition group">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 group-hover:bg-white transition" aria-hidden="true"/>

                  {getPolicyMetadata(item.slug, locale).title}
                </Link>
              </li>))}
          </ul>
        </nav>

        {/* ===================================================
            Contact Column
        =================================================== */}

        <div className="destekol-footer-contact" style={{ textAlign: loc === 'ar' ? 'right' : 'left' }}>
          <h2 className="font-bold text-white/80 mb-5 text-sm tracking-[0.2em] uppercase">
            {d("footer.contact_us", {
            ar: "معلومات التواصل",
            en: "Contact Info",
            fr: "Coordonnées",
            tr: "İletişim Bilgileri",
        })}
          </h2>

          <address className="not-italic">
            <ul className="space-y-3 text-sm text-white/80">
              {/* Email */}
              <li>
                <a href={`mailto:${contactEmail}`} aria-label={`Send email to ${contactEmail}`} className="block hover:text-white transition">
                  <bdi dir="ltr">{contactEmail}</bdi>
                </a>
              </li>

              {settings?.contactAddress && <li className="leading-relaxed break-words"><bdi dir="ltr">{settings.contactAddress}</bdi></li>}

              {/* Phone */}
              {contactPhone && (<li>
                  <a href={`tel:${contactPhone}`} aria-label={`Call ${contactPhone}`} className="block hover:text-white transition">
                    <bdi dir="ltr">{contactPhone}</bdi>
                  </a>
                </li>)}

              {/* WhatsApp */}
              {whatsappUrl && (<li>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Contact us on WhatsApp" className="block hover:text-white transition">
                    <bdi dir="ltr">WhatsApp</bdi>
                  </a>
                </li>)}
            </ul>
          </address>
        </div>
      </div>

      {/* =====================================================
              OFFICIAL REGISTRATION / VERIFICATION BAR
          ===================================================== */}

      {(settings?.registrationNumber || settings?.footerTagline || settings?.copyrightText) && <div className="destekol-footer-bottom border-t border-white/10 py-5 px-6 flex flex-wrap items-center justify-between gap-6 text-sm text-white/70">
        {settings?.footerTagline && <span>{settings.footerTagline}</span>}
        {settings?.registrationNumber && (settings.verificationUrl
          ? <a href={settings.verificationUrl} target="_blank" rel="noopener noreferrer" className="destekol-footer-verification underline underline-offset-4"><ExternalLink size={20} aria-hidden="true"/><span>{({ ar: 'تحقّق من تسجيل الجمعية رسميًا عبر DERBİS', en: 'Verify official association registration — DERBİS', fr: 'Vérifier l’enregistrement officiel — DERBİS', tr: 'Resmî dernek kaydını DERBİS üzerinden doğrulayın' }[loc])}: <bdi dir="ltr">{settings.registrationNumber}</bdi></span></a>
          : <span>{({ ar: 'رقم التسجيل', en: 'Registration number', fr: 'Numéro d’enregistrement', tr: 'Kayıt numarası' }[loc])}: <bdi>{settings.registrationNumber}</bdi></span>)}
        {settings?.copyrightText && <span>{settings.copyrightText}</span>}
      </div>}
    </footer>);
}
