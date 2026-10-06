import Icon from "@/components/icons";
import Link from "next/link";
export default function WhatsAppButton({ phone }: {
    phone?: string | null;
}) {
    if (!phone)
        return null;
    const digits = phone.replace(/[^\d]/g, "");
    if (!digits)
        return null;
    return (<Link href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" aria-label="تواصل معنا عبر واتساب" className="fixed bottom-5 left-5 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-brand text-white shadow-lg shadow-emerald2/30 hover:opacity-90 transition">
      <Icon name="message-square" size={26}/>
    </Link>);
}
