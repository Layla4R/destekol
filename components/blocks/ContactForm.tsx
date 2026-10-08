"use client";
import Icon from "@/components/icons";
import { useState } from "react";
export default function ContactForm({ email, locale = "ar", dict = {} }: {
    email?: string;
    locale?: string;
    dict?: Record<string, string>;
}) {
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [receipt,setReceipt]=useState<{reference:string;trackingUrl:string}|null>(null);
    const [copied,setCopied]=useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const t = (ar: string, en: string, fr: string, tr: string) => locale === "fr" ? fr : locale === "tr" ? tr : locale === "en" ? en : ar;
    function upd(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }
    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setStatus("sending");
        setError("");
        try {
            const res = await fetch("/api/contact", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, locale }),
            });
            const d = await res.json();
            if (!res.ok || !d.ok || !d.reference || !d.trackingUrl) {
                setError(d.error || t("حدث خطأ", "Error", "Erreur", "Hata"));
                setStatus("error");
                return;
            }
            setReceipt({reference:d.reference,trackingUrl:d.trackingUrl});
            setStatus("sent");
        }
        catch {
            setError(t("خطأ في الاتصال، حاول مجدداً", "Connection error, please try again", "Erreur de connexion", "Bağlantı hatası"));
            setStatus("error");
        }
    }
    const inp = "w-full rounded-xl border border-line bg-white py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition";
    if (status === "sent") {
        return (<div className="max-w-lg mx-auto text-center bg-white border border-line rounded-2xl shadow-xl p-10">
        <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-5">
          <Icon name="check" size={32}/>
        </div>
        <h3 className="font-display text-xl font-bold text-ink mb-2">
          {t("تم استلام رسالتك!", "Message received!", "Votre message a été reçu !", "Mesajınız alındı!")}
        </h3>
        <p className="text-muted">
          {t("سنرد عليكم في أقرب وقت ممكن.", "We'll get back to you as soon as possible.", "Nous vous répondrons dans les plus brefs délais.", "En kısa sürede size geri döneceğiz.")}
        </p>
        {receipt&&<div className="mt-5 space-y-3">
          <p className="text-sm text-muted">{t("رقم الطلب", "Request reference", "Référence de la demande", "Talep referans numarası")}</p>
          <p dir="ltr" className="font-bold text-brand">{receipt.reference}</p>
          <button type="button" className="block mx-auto font-bold text-brand underline" onClick={()=>window.location.assign(receipt.trackingUrl)}>{t("متابعة الطلب", "Track your request", "Suivre votre demande", "Talebinizi takip edin")}</button>
          <button type="button" className="text-sm text-brand underline" onClick={async()=>{try{await navigator.clipboard.writeText(new URL(receipt.trackingUrl,window.location.origin).href);setCopied(true);}catch{setCopied(false);}}}>{copied?t("تم النسخ", "Copied", "Copié", "Kopyalandı"):t("نسخ رابط المتابعة", "Copy tracking link", "Copier le lien de suivi", "Takip bağlantısını kopyala")}</button>
          <p className="text-xs text-muted">{t("احتفظ برابط المتابعة الخاص ولا تشاركه مع الآخرين.", "Keep your private tracking link and do not share it with others.", "Conservez votre lien privé et ne le partagez pas.", "Özel takip bağlantınızı saklayın ve başkalarıyla paylaşmayın.")}</p>
        </div>}
        <button onClick={() => { setReceipt(null);setCopied(false);setStatus("idle"); setForm({ name: "", email: "", subject: "", message: "" }); }} className="mt-6 text-sm text-brand hover:underline">
          {t("إرسال رسالة أخرى", "Send another message", "Envoyer un autre message", "Başka bir mesaj gönder")}
        </button>
      </div>);
    }
    return (<form onSubmit={submit} className="max-w-lg mx-auto space-y-4 bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-line">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-ink mb-1.5">
            {t("الاسم الكامل", "Full Name", "Nom Complet", "Ad Soyad")} *
          </label>
          <input required value={form.name} onChange={e => upd("name", e.target.value)} placeholder={t("الاسم الكامل", "Your name", "Votre nom", "Adınız")} className={inp}/>
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink mb-1.5">
            {t("البريد الإلكتروني", "Email", "Email", "E-posta")} *
          </label>
          <input required type="email" value={form.email} onChange={e => upd("email", e.target.value)} placeholder={t("example@email.com", "example@email.com", "exemple@email.com", "ornek@email.com")} className={inp}/>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink mb-1.5">
          {t("الموضوع", "Subject", "Sujet", "Konu")}
        </label>
        <input value={form.subject} onChange={e => upd("subject", e.target.value)} placeholder={t("موضوع رسالتك", "Message subject", "Sujet du message", "Mesajınızın konusu")} className={inp}/>
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink mb-1.5">
          {t("الرسالة", "Message", "Message", "Mesaj")} *
        </label>
        <textarea required rows={5} value={form.message} onChange={e => upd("message", e.target.value)} placeholder={t("اكتب رسالتك هنا...", "Write your message here...", "Écrivez votre message ici...", "Mesajınızı buraya yazın...")} className={`${inp} resize-none`}/>
      </div>

      {(status === "error" && error) && (<div className="flex items-center gap-2 bg-danger/8 border border-danger/20 rounded-xl p-3 text-danger text-sm">
          <Icon name="x" size={14}/> {error}
        </div>)}

      <button type="submit" disabled={status === "sending"} className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold rounded-xl py-3.5 transition flex items-center justify-center gap-2">
        <Icon name="send" size={18}/>
        {status === "sending"
            ? t("جارِ الإرسال...", "Sending...", "Envoi en cours...", "Gönderiliyor...")
            : t("إرسال الرسالة", "Send Message", "Envoyer le Message", "Mesaj Gönder")}
      </button>

      <a href={`/${locale}/contact/track`} className="block text-center text-sm text-brand underline">{t("متابعة طلب سابق", "Track an existing request", "Suivre une demande existante", "Mevcut talebi takip edin")}</a>
      <p className="text-center text-xs text-muted flex items-center justify-center gap-1">
        <Icon name="shield-check" size={12}/>
        {t("رسالتك محمية ومشفرة", "Your message is secure and encrypted", "Votre message est sécurisé", "Mesajınız güvenli ve şifreli")}
      </p>
    </form>);
}
