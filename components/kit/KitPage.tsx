"use client";

import Image from "next/image";
import { useEffect, useState, type MouseEvent } from "react";
import { ArrowUpRight, FileText, Folder, Handshake, Leaf, Link as LinkIcon, Mail, Play, type LucideIcon } from "lucide-react";
import { KIT_LOCALES, KIT_URL, LANGUAGE_COOKIE, getKitResourceUrl, kitResourceOpensNewTab, type KitLinkId, type KitLocale, type KitResource } from "@/lib/kit-config";
import { KIT_COPY } from "@/lib/kit-copy";
import { LOCALE_NAMES } from "@/lib/locales";
import styles from "./kit.module.css";
import { trackKitResourceClick, trackLanguageSelection } from "@/lib/analytics";

const RESOURCE_ICONS: Record<KitLinkId | "link", LucideIcon> = {
    website: LinkIcon, brochure: FileText, portfolio: Folder,
    sustainability: Leaf, video: Play, partnerships: Handshake, contact: Mail, link: LinkIcon,
};

export default function KitPage({ initialLocale, resources }: { initialLocale: KitLocale; resources: readonly KitResource[] }) {
    const [locale, setLocale] = useState(initialLocale);
    const copy = KIT_COPY[locale];
    const direction = locale === "ar" ? "rtl" : "ltr";

    useEffect(() => {
        document.documentElement.lang = locale;
        document.documentElement.dir = direction;
        document.title = copy.title;
    }, [locale, direction, copy.title]);

    function selectLanguage(nextLocale: KitLocale) {
        if (locale === nextLocale) return;
        trackLanguageSelection(locale, nextLocale, "kit");
        document.documentElement.lang = nextLocale;
        document.documentElement.dir = nextLocale === "ar" ? "rtl" : "ltr";
        document.title = KIT_COPY[nextLocale].title;
        setLocale(nextLocale);
        document.cookie = `${LANGUAGE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    }

    function clickResource(event: MouseEvent<HTMLAnchorElement>, resource: KitResource, href: string, newTab: boolean) {
        // Preserve native new-tab, modified and download clicks. Only ordinary same-tab
        // navigation waits briefly for GA, with a fallback if Google is blocked.
        if (newTab || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
            || event.defaultPrevented || event.currentTarget.hasAttribute("download")) {
            trackKitResourceClick(resource, href, locale);
            return;
        }
        let navigated = false;
        const navigate = () => {
            if (navigated) return;
            navigated = true;
            clearTimeout(fallback);
            window.location.assign(href);
        };
        const fallback = setTimeout(navigate, 850);
        if (trackKitResourceClick(resource, href, locale, navigate)) event.preventDefault();
        else clearTimeout(fallback);
    }

    return (
        <main className={styles.page} lang={locale} dir={direction}>
            <section className={styles.card} aria-label={copy.title}>
                <header>
                    <div className={styles.banner}>
                        <Image src="/kit/banner-center.webp?v=1" alt="" fill priority sizes="100vw" className={styles.bannerImage} />
                    </div>
                    <div className={styles.brand}>
                        <div className={styles.logoFrame}>
                            <Image src="/kit/destekol-logo.png" alt="Destekol" width={1774} height={887} priority sizes="(max-width: 380px) 85vw, 340px" className={styles.logo} />
                        </div>
                        <p className={styles.description}>{copy.organization}</p>
                        <h1 className={styles.pageTitle}>{copy.pageHeading}</h1>
                    </div>
                </header>

                <div className={styles.languages} role="group" aria-label={copy.languageLabel} dir="ltr">
                    {KIT_LOCALES.map(language => (
                        <button key={language} type="button" lang={language} dir={language === "ar" ? "rtl" : "ltr"}
                            aria-pressed={locale === language} onClick={() => selectLanguage(language)}>
                            {LOCALE_NAMES[language]}
                        </button>
                    ))}
                </div>
                <nav className={styles.resources} aria-label={copy.linksLabel}>
                    {resources.length === 0 ? <p className={styles.empty}>{copy.noLinks}</p> : <ul>
                        {resources.map(resource => {
                            const Icon = RESOURCE_ICONS[resource.icon || resource.id as KitLinkId] || LinkIcon;
                            const title = resource.titles?.[locale] || resource.titles?.en || copy.links[resource.id as KitLinkId];
                            const href = getKitResourceUrl(resource, locale);
                            const newTab = href ? kitResourceOpensNewTab(resource, href) : false;
                            const content = <>
                                <ArrowUpRight className={styles.arrow} size={17} aria-hidden="true" />
                                <span className={styles.resourceText}>
                                    <span className={styles.resourceTitle}>{title}</span>
                                    {!href && <span className={styles.comingSoon}>{copy.comingSoon}</span>}
                                </span>
                                <span className={`${styles.icon} ${styles[resource.tone]}`}><Icon size={20} strokeWidth={1.8} aria-hidden="true" /></span>
                            </>;
                            return <li key={resource.id} data-resource={resource.id}>
                                {href ? <a href={href} className={styles.resource} target={newTab ? "_blank" : undefined}
                                    rel={newTab ? "noopener noreferrer" : undefined}
                                    onClick={event => clickResource(event, resource, href, newTab)}
                                    onAuxClick={event => { if (event.button === 1) trackKitResourceClick(resource, href, locale); }}
                                    aria-label={`${title}${newTab ? ` — ${copy.newTab}` : ""}`}>
                                    {content}
                                </a> : <div className={styles.resource} role="link" aria-disabled="true"
                                    aria-label={`${title} — ${copy.comingSoon}`}>{content}</div>}
                            </li>;
                        })}
                    </ul>}
                </nav>
                <footer className={styles.footer}>
                    <a href={KIT_URL} dir="ltr"><LinkIcon size={15} aria-hidden="true" /><span>destekol.org/kit</span></a>
                    <span className={styles.footerNote}>{copy.footer}</span>
                </footer>
            </section>
        </main>
    );
}
