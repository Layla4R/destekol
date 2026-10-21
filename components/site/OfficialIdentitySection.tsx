import Image from "next/image";
import { DESTEKOL_LEGAL_NAME, DESTEKOL_LOGO } from '@/lib/public-contact';

type IdentityProps = Record<string, unknown>;
function httpUrl(value: string) {
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
    } catch { return ""; }
}

export default function OfficialIdentitySection({ data, locale }: { data: IdentityProps; locale: string }) {
    const value = (key: string) => typeof data[key] === "string" ? (data[key] as string).trim() : "";
    const websiteUrl = httpUrl(value("websiteUrl"));
    const email = value("email");
    const verificationUrl = httpUrl(value("verificationUrl"));
    const logo = DESTEKOL_LOGO;
    const details = [
        [value("officialNameLabel"), DESTEKOL_LEGAL_NAME],
        [value("publicNameLabel"), value("publicName")],
        [value("registrationLabel"), value("registrationNumber")],
        [value("statusLabel"), value("status")],
    ].filter(([label, item]) => label && item);

    if (!value("heading") && !details.length && !logo) return null;

    return (
        <section className="destekol-identity-section" aria-labelledby={value("heading") ? "official-identity-heading" : undefined} dir={locale === "ar" ? "rtl" : "ltr"}>
            <div className={`destekol-identity-card${logo ? " has-logo" : ""}`}>
                <div className="destekol-identity-content">
                    <span className="destekol-identity-accent" aria-hidden="true" />
                    {value("heading") && <h2 id="official-identity-heading">{value("heading")}</h2>}
                    <dl className="destekol-identity-details">
                        {details.map(([label, item]) => <div key={label}><dt>{label}</dt><dd><bdi>{item}</bdi></dd></div>)}
                        {websiteUrl && <div><dt>{value("websiteLabel")}</dt><dd><a href={websiteUrl} dir="ltr">{websiteUrl}</a></dd></div>}
                        {email && <div><dt>{value("emailLabel")}</dt><dd><a href={`mailto:${email}`} dir="ltr">{email}</a></dd></div>}
                    </dl>
                    {value("description") && <p>{value("description")}</p>}
                    {verificationUrl && value("verificationLabel") && <a className="destekol-identity-verify" href={verificationUrl} target="_blank" rel="noopener noreferrer">{value("verificationLabel")}<span aria-hidden="true"> ↗</span></a>}
                </div>
                {logo && <figure className="destekol-identity-logo"><Image src={logo} alt={DESTEKOL_LEGAL_NAME} width={1600} height={800} priority sizes="(max-width: 767px) 100vw, 36vw" /></figure>}
            </div>
        </section>
    );
}
