const newsletterCopy = {
    ar: { title: "الخير يستمر معكم", subtitle: "اشتركوا لتصلكم آخر الأخبار والمشاريع والأنشطة.", buttonText: "اشترك الآن", placeholder: "بريدك الإلكتروني", successText: "شكراً لاشتراكك" },
    en: { title: "Kindness continues with you", subtitle: "Subscribe for the latest news, projects and activities.", buttonText: "Subscribe now", placeholder: "Your email address", successText: "Thank you for subscribing" },
    fr: { title: "La solidarité continue avec vous", subtitle: "Abonnez-vous pour recevoir nos actualités, projets et activités.", buttonText: "S’abonner", placeholder: "Votre adresse e-mail", successText: "Merci pour votre inscription" },
    tr: { title: "İyilik sizinle devam ediyor", subtitle: "Haberlerimiz, projelerimiz ve faaliyetlerimizden haberdar olmak için abone olun.", buttonText: "Abone ol", placeholder: "E-posta adresiniz", successText: "Abone olduğunuz için teşekkür ederiz" },
};
/** Keep editor overrides; fill missing or blank translated fields. */
export function resolveNewsletterCopy(locale: string, props: Record<string, any>) {
    const defaults = newsletterCopy[locale as keyof typeof newsletterCopy] || newsletterCopy.en;
    return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [
        key, typeof props[key] === "string" && props[key].trim() ? props[key] : fallback,
    ])) as typeof defaults;
}
