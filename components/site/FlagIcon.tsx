// Real SVG flags served from /public/flags/
interface Props {
    locale: string;
    size?: number;
}
const FLAG_MAP: Record<string, string> = {
    ar: "/flags/sa.svg",
    en: "/flags/gb.svg",
    fr: "/flags/fr.svg",
    tr: "/flags/tr.svg",
};
export default function FlagIcon({ locale, size = 20 }: Props) {
    const src = FLAG_MAP[locale];
    if (!src)
        return <span style={{ fontSize: size }}>🌐</span>;
    return (<img src={src} alt={locale} width={Math.round(size * 1.5)} height={size} style={{
            display: "inline-block",
            width: Math.round(size * 1.5),
            height: size,
            borderRadius: 3,
            border: "1px solid rgba(0,0,0,0.12)",
            objectFit: "cover",
            flexShrink: 0,
            verticalAlign: "middle",
        }}/>);
}
