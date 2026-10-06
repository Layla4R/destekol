import Icon from "@/components/icons";
import Link from "next/link";
export default function WhatsAppButton({ phone, locale = "ar" }: {
    phone?: string | null;
    locale?: string;
}) {
    if (!phone)
        return null;
    const digits = phone.replace(/[^\d]/g, "");
    if (!digits)
        return null;
    const label = ({ar:"تواصل معنا عبر واتساب",en:"Contact us on WhatsApp",fr:"Contactez-nous sur WhatsApp",tr:"WhatsApp üzerinden iletişime geçin"} as Record<string,string>)[locale] || "WhatsApp";
    return (<Link href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" aria-label={label} className="fixed bottom-5 left-5 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-brand text-white shadow-lg shadow-emerald2/30 hover:opacity-90 transition">
      <Icon name="message-square" size={26}/>
    </Link>);
}
