"use client";
import Icon from "@/components/icons";
import Link from "next/link";
import { useEffect,useState } from "react";
interface Item {
    slug: string;
    title: string;
    amount: number;
    frequency: string;
    kindnessBox?: boolean;
    campaignId?: string; // UUID — required for FK
}
export default function CartClient({ locale, dict: D }: {
    locale: string;
    dict: Record<string, string>;
}) {
    const p = locale === "ar" ? "" : `/${locale}`;
    const [selectedCampaign, setSelectedCampaign] = useState("");
    const itemKey = (item: Item) => item.slug + ":" + item.frequency.toLowerCase();
    const [cart, setCart] = useState<Item[]>([]);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState<"stripe" | "paypal" | null>(null);
    const [error, setError] = useState("");
    const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
    const t = (key: string, ar: string, en: string, fr: string, tr: string) => D[key] || (locale === "ar" ? ar : locale === "fr" ? fr : locale === "tr" ? tr : en);
    useEffect(() => {
        try {
            setCart(JSON.parse(sessionStorage.getItem("destekol_cart") || "[]"));
        }
        catch { }
    }, []);
    function remove(slug: string) {
        const u = cart.filter(i => itemKey(i) !== slug);
        setCart(u);
        sessionStorage.setItem("destekol_cart", JSON.stringify(u));
        window.dispatchEvent(new Event("storage"));
    }
    function updateAmount(slug: string, amount: number) {
        if (amount < 1)
            return;
        const u = cart.map(i => itemKey(i) === slug ? { ...i, amount } : i);
        setCart(u);
        sessionStorage.setItem("destekol_cart", JSON.stringify(u));
    }
    const total = cart.reduce((s, i) => s + i.amount, 0);
    const separateCampaigns = cart.length > 1 && cart.some(item => item.kindnessBox);
    const checkoutAmount = separateCampaigns ? (cart.find(item => itemKey(item) === selectedCampaign)?.amount || 0) : total;
    async function checkout(provider: "stripe" | "paypal") {
        if (separateCampaigns && !cart.some(item => itemKey(item) === selectedCampaign)) {
            setError(t("cart.choose_campaign", "اختر الحملة التي تريد دفع تبرعها", "Choose a campaign to pay", "Choisissez une campagne", "Ödenecek kampanyayı seçin"));
            return;
        }
        if (!name.trim() || !email.trim()) {
            setError(t("cart.name_email_required", "الاسم والبريد مطلوبان", "Name and email required", "Nom et email requis", "Ad ve e-posta gerekli"));
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError(t("cart.invalid_email", "بريد إلكتروني غير صحيح", "Invalid email address", "Email invalide", "Geçersiz e-posta"));
            return;
        }
        setError("");
        setItemErrors({});
        setLoading(provider);
        // Per-item donations — each campaign gets its own donation record
        const endpoint = provider === "stripe" ? "/api/donations/checkout" : "/api/donations/paypal";
        if (cart.length === 1 || separateCampaigns) {
            // Single item — normal flow
            const item = separateCampaigns ? cart.find(item => itemKey(item) === selectedCampaign)! : cart[0];
            try {
                const res = await fetch(endpoint, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        amount: item.amount,
                        frequency: item.frequency?.toUpperCase() || "ONE_TIME",
                        donorName: name, donorEmail: email,
                        campaignId: item.campaignId || null,
                    }),
                });
                const d = await res.json();
                if (d.url) {
                    sessionStorage.setItem("destekol_cart", JSON.stringify(cart.filter(candidate => itemKey(candidate) !== itemKey(item))));
                    window.dispatchEvent(new Event("storage"));
                    window.location.href = d.url;
                }
                else {
                    setError(d.error || t("common.error", "حدث خطأ", "An error occurred", "Une erreur s'est produite", "Bir hata oluştu"));
                }
            }
            catch {
                setError(t("common.error", "حدث خطأ", "An error occurred", "Une erreur s'est produite", "Bir hata oluştu"));
            }
            finally {
                setLoading(null);
            }
            return;
        }
        // Multiple items — checkout with total, campaigns noted in description
        // We use total amount and note the campaigns — Stripe/PayPal don't support multi-item splits natively
        try {
            const res = await fetch(endpoint, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: total,
                    frequency: "ONE_TIME", // multi-item always one-time
                    donorName: name, donorEmail: email,
                    campaignId: cart[0]?.campaignId || null, // primary campaign
                    message: cart.map(i => `${i.title}: $${i.amount}`).join(" | "),
                }),
            });
            const d = await res.json();
            if (d.url) {
                sessionStorage.removeItem("destekol_cart");
                window.dispatchEvent(new Event("storage"));
                window.location.href = d.url;
            }
            else {
                setError(d.error || t("common.error", "حدث خطأ", "An error occurred", "Une erreur s'est produite", "Bir hata oluştu"));
            }
        }
        catch {
            setError(t("common.error", "حدث خطأ", "An error occurred", "Une erreur s'est produite", "Bir hata oluştu"));
        }
        finally {
            setLoading(null);
        }
    }
    const inp = "w-full rounded-xl border border-line bg-cream py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30";
    return (<div dir={locale === "ar" ? "rtl" : "ltr"} className="max-w-screen-xl mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-extrabold text-ink mb-8">
        {t("cart.title", "سلة التبرعات", "Donation Cart", "Panier de Dons", "Bağış Sepeti")}
      </h1>

      {cart.length === 0 ? (<div className="text-center py-20">
          <Icon name="layers" size={48} className="text-line mx-auto mb-4"/>
          <p className="text-muted mb-6">{t("cart.empty", "السلة فارغة", "Your cart is empty", "Votre panier est vide", "Sepetiniz boş")}</p>
          <Link href={`${p || ""}/campaigns`} className="bg-brand hover:bg-brand-dark text-white font-bold rounded-xl px-6 py-3 transition">
            {t("cart.browse", "تصفح الحملات", "Browse Campaigns", "Voir les Campagnes", "Kampanyalara Göz At")}
          </Link>
        </div>) : (<div className="space-y-4">
          {cart.map(item => (<div key={itemKey(item)} className="flex items-center justify-between bg-white rounded-xl border border-line p-4 gap-4">
              <div className="flex-1">
                <p className="font-bold text-ink text-sm">{item.title}</p>
                <p className="text-xs text-muted mt-0.5">
                  {item.frequency === "monthly" || item.frequency === "MONTHLY"
                    ? t("common.per_month", "شهري", "Monthly", "Mensuel", "Aylık")
                    : t("common.one_time", "مرة واحدة", "One-time", "Unique", "Tek Seferlik")}
                </p>
                {itemErrors[item.slug] && <p className="text-xs text-danger mt-1">{itemErrors[item.slug]}</p>}
              </div>
              {/* Editable amount */}
              <div className="flex items-center gap-1">
                <button onClick={() => updateAmount(itemKey(item), item.amount - 5)} className="w-7 h-7 rounded-lg border border-line text-muted hover:border-brand hover:text-brand flex items-center justify-center text-sm">−</button>
                <span className="font-bold text-brand min-w-[48px] text-center text-sm">${item.amount}</span>
                <button onClick={() => updateAmount(itemKey(item), item.amount + 5)} className="w-7 h-7 rounded-lg border border-line text-muted hover:border-brand hover:text-brand flex items-center justify-center text-sm">+</button>
              </div>
              <button onClick={() => remove(itemKey(item))} aria-label={(D["cart.remove_item"] || "Remove") + ": " + item.title} className="text-danger hover:text-danger/70"><Icon name="trash" size={16}/></button>
            </div>))}

          <div className="flex justify-between items-center bg-brand/5 border border-brand/20 rounded-xl p-4">
            <span className="font-bold text-ink">{t("cart.total", "الإجمالي", "Total", "Total", "Toplam")}</span>
            <span className="font-display text-2xl font-extrabold text-brand">${total}</span>
          </div>

          {separateCampaigns && <div className="border border-line rounded-xl p-4"><label htmlFor="campaign-to-pay" className="block font-bold mb-2">{t("cart.pay_separately", "ادفع لكل حملة على حدة لضمان تخصيص تبرعك لها", "Pay each campaign separately to allocate your donation correctly", "Payez chaque campagne séparément", "Bağışınızın doğru kampanyaya ulaşması için her kampanyayı ayrı ödeyin")}</label><select id="campaign-to-pay" value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)} className="w-full p-3 rounded border"><option value="">{t("cart.choose_campaign", "اختر حملة", "Choose a campaign", "Choisissez une campagne", "Kampanya seçin")}</option>{cart.map(item => <option key={itemKey(item)} value={itemKey(item)}>{item.title} — {item.amount}</option>)}</select></div>}
          <div className="bg-cream border border-line rounded-xl p-5 space-y-3 mt-6">
            <h2 className="font-display font-bold text-ink mb-2">
              {t("cart.donor_info", "بيانات المتبرع", "Donor Information", "Informations du Donateur", "Bağışçı Bilgileri")}
            </h2>
            <input type="text" placeholder={t("donate.name", "الاسم الكامل", "Full Name", "Nom Complet", "Ad Soyad")} value={name} onChange={e => setName(e.target.value)} className={inp}/>
            <input type="email" placeholder={t("donate.email", "البريد الإلكتروني", "Email Address", "Adresse Email", "E-posta")} value={email} onChange={e => setEmail(e.target.value)} className={inp}/>

            {error && <p className="text-sm text-danger flex items-center gap-2"><Icon name="x" size={13}/>{error}</p>}

            <button onClick={() => checkout("stripe")} disabled={!!loading || (separateCampaigns && !checkoutAmount)} className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold rounded-xl py-3.5 transition flex items-center justify-center gap-2">
              <Icon name="wallet" size={18}/>
              {loading === "stripe"
                ? t("cart.processing", "جاري المعالجة...", "Processing...", "Traitement...", "İşleniyor...")
                : `${t("cart.pay_card", "الدفع بالبطاقة", "Pay with Card", "Payer par Carte", "Kart ile Öde")} — $${checkoutAmount}`}
            </button>

            <button onClick={() => checkout("paypal")} disabled={!!loading || (separateCampaigns && !checkoutAmount)} className="w-full bg-[#FFC439] hover:bg-[#f0b429] disabled:opacity-60 text-[#003087] font-bold rounded-xl py-3.5 transition flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#003087"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/></svg>
              {loading === "paypal"
                ? t("cart.processing", "جاري المعالجة...", "Processing...", "Traitement...", "İşleniyor...")
                : `PayPal — $${checkoutAmount}`}
            </button>

            <p className="text-xs text-muted text-center">
              <Icon name="shield-check" size={12} className="inline ml-1"/>
              {t("cart.secure", "دفع آمن ومشفر", "Secure encrypted payment", "Paiement sécurisé et chiffré", "Güvenli şifreli ödeme")}
            </p>
          </div>
        </div>)}
    </div>);
}
