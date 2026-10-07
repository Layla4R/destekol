"use client";
import { interfaceCopy } from "@/lib/interface-copy";

import type { PublicSiteSettings } from "@/lib/public-site-settings";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect,useState } from "react";
import CartIcon from "./CartIcon";
import LanguageSwitcher from "./LanguageSwitcher";
interface NavItem {
    id?: string;
    slug: string;
    title: string;
}
export default function SiteHeader({ navItems, settings, locale, dict, transparent = false, isDestekol = false, }: {
    navItems: NavItem[];
    settings: PublicSiteSettings | null;
    locale: string;
    dict: Record<string, string>;
    transparent?: boolean;
    isDestekol?: boolean;
}) {
    const p = `/${locale}`;
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const isHomePage = pathname === "/" || pathname === `/${locale}` || pathname === `/${locale}/`;
    const canBeTransparent = transparent && isHomePage;
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    const isTransparent = canBeTransparent && !scrolled && !mobileOpen;
    const isHomeResting = isHomePage && !scrolled && !mobileOpen;
    const t = (key: string, ar: string, en: string, fr: string, tr: string) => dict[key] ||
        (locale === "ar" ? ar : locale === "fr" ? fr : locale === "tr" ? tr : en);
    const logoImage = settings?.logoImage || "";
    const logoText = settings?.logoText || settings?.siteName || "";
    const navLinkCls = `text-sm font-semibold transition-colors hover:opacity-80 ${isTransparent ? "text-white" : "text-ink/70 hover:text-brand"}`;
    return (<header className={`${isHomePage ? "site-home-header sticky shrink-0" : "fixed"} top-0 left-0 right-0 z-[100] transition-[background-color,box-shadow,border-color] duration-300 ${isHomeResting
            ? "bg-cream border-b border-transparent shadow-none"
            : isTransparent
                ? "bg-transparent border-b border-transparent shadow-none"
                : "bg-white border-b border-line shadow-md"}`}>
      {!isTransparent && (<div className={`h-1 ${isHomeResting ? "invisible" : ""}`} role="presentation" style={{
                background: `var(--destekol-accent-gradient, ${settings?.accentColor ? `linear-gradient(to right, ${settings.accentColor}, ${settings.accentColor}cc)` : "linear-gradient(135deg, #F00F5A, #FF4D88)"})`,
            }}/>)}

      <div className={`${isHomePage ? "home-header-container" : "max-w-screen-xl mx-auto px-4 sm:px-6"} h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-4`}>
        {/* Logo */}
        <Link href={`${p}/`} className="flex items-center gap-2 shrink-0" aria-label={`${logoText} Home`}>
          {logoImage ? <Image src={logoImage} alt={logoText} width={175} height={70} className="h-[2.5rem] md:h-[6.5rem] w-auto object-contain" priority/> : <span>{logoText}</span>}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7" aria-label={interfaceCopy(locale).mainNavigation}>
          <ul className="flex items-center gap-7">
            {(navItems.filter(item => ["home", "about", "about-us", "projects"].includes(item.slug))).map((item) => {
            const navKey = `nav.${item.slug}`;
            const translatedTitle = dict[navKey] ||
                (item.slug === "home"
                    ? t("nav.home", "الرئيسية", "Home", "Accueil", "Ana Sayfa")
                    : item.slug === "about" || item.slug === "about-us"
                        ? t("nav.about", "من نحن", "About Us", "À Propos", "Hakkımızda")
                        : item.slug === "our-work" || item.slug === "sectors"
                            ? t("nav.our_work", "مجالات عملنا", "Our Work", "Nos Domaines", "Faaliyetlerimiz")
                            : item.slug === "projects"
                                ? t("nav.projects", "المشاريع الإنسانية", "Projects", "Projets", "Projelerimiz")
                                : item.slug === "transparency" || item.slug === "financial-transparency"
                                    ? t("nav.transparency", "الشفافية", "Transparency", "Transparence", "Şeffaflık")
                                    : item.slug === "contact"
                                        ? t("nav.contact", "اتصل بنا", "Contact", "Contact", "İletişim")
                                        : item.title);
            return (<li key={item.slug}>
                  <Link href={item.slug === "home" ? `${p}/` : `${p}/${item.slug}`} className={navLinkCls}>
                    {translatedTitle}
                  </Link>
                </li>);
        })}
            <li><Link href={`${p}/campaigns`} className={navLinkCls}>{t("nav.campaigns", "الحملات", "Campaigns", "Campagnes", "Kampanyalar")}</Link></li>
            <li>
              <Link href={`${p}/news`} className={navLinkCls}>
                {t("nav.news", "الأخبار", "News", "Actualités", "Haberler")}
              </Link>
            </li>
            {<li><Link href={`${p}/contact`} className={navLinkCls}>{t("nav.contact", "اتصل بنا", "Contact", "Contact", "İletişim")}</Link></li>}
          </ul>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <LanguageSwitcher isDestekol={isDestekol} currentLocale={locale} transparent={isTransparent}/>
          <CartIcon prefix={p} transparent={isTransparent}/>

          <Link href={`${p}/account`} aria-label={interfaceCopy(locale).account} className={`flex items-center justify-center gap-1.5 border rounded-xl p-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold transition shrink-0 ${isTransparent
            ? "border-white/30 text-white hover:bg-white/15"
            : "border-line text-ink/70 hover:text-brand hover:border-brand"}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="8" r="4"/>
              <path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
            </svg>
            <span className="hidden lg:inline">
              {t("nav.account", "حسابي", "My Account", "Mon Compte", "Hesabım")}
            </span>
          </Link>

          <Link href={`${p}/donate`} className="font-bold rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm shadow-lg transition-all hover:-translate-y-0.5 hover:opacity-90 shrink-0 whitespace-nowrap" style={{
            background: `var(--destekol-accent-gradient, ${settings?.accentColor ? `linear-gradient(135deg, ${settings.accentColor}, ${settings.accentColor}cc)` : "linear-gradient(135deg,#F00F5A,#FF4D88)"})`,
            color: "white",
        }}>
            {t("nav.donate", "تبرع الآن", "Donate Now", "Faire un Don", "Bağış Yap")}
          </Link>

          <button type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-label={interfaceCopy(locale).toggleMenu} aria-expanded={mobileOpen} aria-controls="mobile-navigation" className={`md:hidden p-1.5 sm:p-2 rounded-xl transition ${isTransparent ? "text-white hover:bg-white/15" : "text-ink/70 hover:text-brand"}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? <path d="M18 6 6 18M6 6l12 12"/> : (<>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </>)}
            </svg>
          </button>
        </div>
      </div>
      {mobileOpen && <nav id="mobile-navigation" className="md:hidden border-t bg-white p-5 grid gap-4" aria-label={interfaceCopy(locale).mobileNavigation}>
        {navItems.filter(item => item.slug !== "campaigns").map(item => <Link onClick={() => setMobileOpen(false)} key={item.slug} href={item.slug === "home" ? p + "/" : p + "/" + item.slug}>{dict["nav." + item.slug] || item.title}</Link>)}
        <Link href={p + "/campaigns"} onClick={() => setMobileOpen(false)}>{t("nav.campaigns", "الحملات", "Campaigns", "Campagnes", "Kampanyalar")}</Link>
        <Link href={p + "/news"} onClick={() => setMobileOpen(false)}>{t("nav.news", "الأخبار", "News", "Actualités", "Haberler")}</Link>
        <Link href={p + "/account"}>{t("nav.account", "حسابي", "My Account", "Mon Compte", "Hesabım")}</Link>
      </nav>}
    </header>);
}
