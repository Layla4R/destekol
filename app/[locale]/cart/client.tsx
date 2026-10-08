"use client";
import PrivacyNotice from '@/components/site/PrivacyNotice';
import PaymentCheckout from "@/components/site/PaymentCheckout";
import Icon from "@/components/icons";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
interface Item { slug: string; title: string; amount: number; frequency: string; kindnessBox?: boolean; campaignId?: string;currency?:string }
const copy = {
 ar: { title: 'سلة تبرعاتي', clear: 'إفراغ السلة', total: 'إجمالي التبرع', complete: 'إتمام التبرع', back: 'العودة إلى السلة', payment: 'إتمام التبرع', remove: 'حذف التبرع', increase: 'زيادة المبلغ', decrease: 'خفض المبلغ', amount: 'مبلغ التبرع', donor: 'بيانات المتبرع' },
 en: { title: 'My donation cart', clear: 'Clear cart', total: 'Total donation', complete: 'Complete donation', back: 'Back to cart', payment: 'Complete your donation', remove: 'Remove donation', increase: 'Increase amount', decrease: 'Decrease amount', amount: 'Donation amount', donor: 'Donor information' },
 fr: { title: 'Mon panier de dons', clear: 'Vider le panier', total: 'Total des dons', complete: 'Finaliser le don', back: 'Retour au panier', payment: 'Finalisez votre don', remove: 'Retirer le don', increase: 'Augmenter le montant', decrease: 'Réduire le montant', amount: 'Montant du don', donor: 'Informations du donateur' },
 tr: { title: 'Bağış Sepetim', clear: 'Sepeti Temizle', total: 'Toplam Bağış', complete: 'Bağışı Tamamla', back: 'Sepete Dön', payment: 'Bağışınızı Tamamlayın', remove: 'Bağışı kaldır', increase: 'Tutarı artır', decrease: 'Tutarı azalt', amount: 'Bağış tutarı', donor: 'Bağışçı Bilgileri' },
};
export default function CartClient({ locale, dict: D, images = {}, campaignMeta={} }: { locale: string; dict: Record<string,string>; images?: Record<string,string>;campaignMeta?:Record<string,{id:string;currency:string}> }) {
 const p = `/${locale}`;
 const t = copy[locale as keyof typeof copy] || copy.tr;
 const [cart, setCart] = useState<Item[]>([]);
 const [ready, setReady] = useState(false);
 const [step, setStep] = useState<'cart'|'payment'>('cart');
 const [locked,setLocked]=useState(false);
 const [name, setName] = useState('');
 const [email, setEmail] = useState('');
 const titleRef = useRef<HTMLHeadingElement>(null);
 const key = (item: Item) => item.slug + ':' + item.frequency.toLowerCase();
 useEffect(() => {
  try { const stored = JSON.parse(sessionStorage.getItem('destekol_cart') || '[]'); setCart(Array.isArray(stored) ? stored.filter(i => typeof i.slug === 'string' && typeof i.title === 'string' && typeof i.frequency === 'string' && Number.isFinite(i.amount) && i.amount >= 1) : []); } catch {}
  setReady(true);
 }, []);
 function save(items: Item[]) { setCart(items); sessionStorage.setItem('destekol_cart', JSON.stringify(items)); window.dispatchEvent(new Event('storage')); if (!items.length) setStep('cart'); }
 function changeAmount(id: string, amount: number) { if (Number.isFinite(amount) && amount >= 1) save(cart.map(item => key(item) === id ? { ...item, amount: Math.round(amount * 100) / 100 } : item)); }
 function navigate(next: 'cart'|'payment') { setStep(next); requestAnimationFrame(() => { titleRef.current?.focus(); titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); }
 const total = cart.reduce((sum, item) => sum + Math.round(item.amount * 100), 0) / 100;
 const itemCurrency=(item:Item)=>campaignMeta[item.slug]?.currency||item.currency||'USD';
 const currency=cart.length?itemCurrency(cart[0]):'USD';
 const mixedCurrency=cart.some(i=>itemCurrency(i)!==currency);
 const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
 const frequency = (item: Item) => item.frequency.toLowerCase() === 'monthly' ? D['donate.monthly'] : D['donate.one_time'];
 const field = 'w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10';
 return <main dir={locale === 'ar' ? 'rtl' : 'ltr'} className="bg-white px-4 py-10 sm:px-6 sm:py-14">
  <div className="mx-auto max-w-5xl">
   <div className="mb-7 flex items-center justify-between gap-4 border-b border-line pb-6">
    <h1 ref={titleRef} tabIndex={-1} className="flex scroll-mt-28 items-center gap-3 text-xl font-bold text-brand outline-none sm:text-2xl"><Icon name="shopping-bag" size={24}/>{step === 'cart' ? t.title : t.payment}</h1>
    {cart.length > 0 && <button type="button" disabled={locked} onClick={() => step === 'cart' ? save([]) : navigate('cart')} className="flex shrink-0 items-center gap-2 text-xs text-muted transition hover:text-brand sm:text-sm"><Icon name={step === 'cart' ? 'trash' : 'undo'} size={16}/>{step === 'cart' ? t.clear : t.back}</button>}
   </div>
   {!ready ? <div className="h-40 animate-pulse rounded-xl bg-brand/5" aria-busy="true"/> : !cart.length ? <div className="py-20 text-center"><Icon name="hand-heart" size={52} className="mx-auto mb-5 text-brand/30"/><p className="mb-7 text-muted">{D['cart.empty']}</p><Link href={`${p}/campaigns`} className="inline-flex rounded-xl bg-accent px-7 py-3 font-bold text-white">{D['cart.browse']}</Link></div> : step === 'cart' ? <>
    <ul>{cart.map(item => <li key={key(item)} className="grid grid-cols-[76px_minmax(0,1fr)_auto] items-center gap-4 border-b border-line py-6 sm:grid-cols-[112px_minmax(0,1fr)_180px_120px_32px] sm:gap-6">
     <div className="relative h-20 overflow-hidden rounded-xl bg-brand/5 sm:h-24">{images[item.slug] ? <Image src={images[item.slug]} alt="" fill sizes="112px" className="object-cover"/> : <div className="flex h-full items-center justify-center"><Icon name="hand-heart" size={32} className="text-brand/60"/></div>}</div>
     <div className="min-w-0"><p className="text-sm font-semibold leading-6 text-ink sm:text-base">{item.title}</p><p className="mt-1 text-xs text-muted sm:text-sm">{frequency(item)}</p></div>
     <button type="button" onClick={() => save(cart.filter(i => key(i) !== key(item)))} aria-label={`${t.remove}: ${item.title}`} className="p-2 text-muted hover:text-danger sm:order-last"><Icon name="trash" size={17}/></button>
     <div className="col-span-2 flex w-fit items-center rounded-lg border border-line sm:col-span-1"><button type="button" disabled={item.amount <= 1} onClick={() => changeAmount(key(item), Math.max(1, item.amount - 5))} aria-label={`${t.decrease}: ${item.title}`} className="p-3 text-brand disabled:opacity-30"><Icon name="minus" size={16}/></button><input type="number" min={1} step="0.01" value={item.amount} aria-label={`${t.amount}: ${item.title}`} onChange={e => changeAmount(key(item), Number(e.target.value))} className="w-16 bg-transparent text-center text-sm font-semibold text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"/><button type="button" onClick={() => changeAmount(key(item), item.amount + 5)} aria-label={`${t.increase}: ${item.title}`} className="p-3 text-brand"><Icon name="plus" size={16}/></button></div>
     <span className="text-end text-sm font-bold text-ink sm:text-base">{new Intl.NumberFormat(locale,{style:'currency',currency:itemCurrency(item)}).format(item.amount)}</span>
    </li>)}</ul>
    <div className="flex flex-col items-end gap-5 pt-8">{mixedCurrency&&<p className="text-sm text-muted">{({ar:"التبرعات بعملات مختلفة تحتاج عمليات دفع منفصلة.",en:"Donations in different currencies need separate payments.",fr:"Les dons dans des devises différentes nécessitent des paiements séparés.",tr:"Farklı para birimlerindeki bağışlar ayrı ödeme gerektirir."} as Record<string,string>)[locale]}</p>}<p className="flex flex-wrap items-center justify-end gap-3 text-base text-ink sm:text-lg"><span>{t.total}</span><strong className="text-xl text-brand">{mixedCurrency ? cart.map(i=>new Intl.NumberFormat(locale,{style:'currency',currency:itemCurrency(i)}).format(i.amount)).join(' + ') : money(total)}</strong></p><button type="button" disabled={mixedCurrency} onClick={() => navigate('payment')} className="inline-flex items-center gap-3 rounded-xl bg-accent px-8 py-3.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90">{t.complete}<Icon name={locale === 'ar' ? 'arrow-left' : 'arrow-right'} size={18}/></button></div>
   </> : <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
    <div className="space-y-7"><section><h2 className="mb-5 text-lg font-bold text-ink">{t.donor}</h2><div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="cart-donor-name" className="mb-2 block text-sm text-muted">{D['donate.name']}</label><input disabled={locked} id="cart-donor-name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} className={field}/></div><div><label htmlFor="cart-donor-email" className="mb-2 block text-sm text-muted">{D['donate.email']}</label><input disabled={locked} id="cart-donor-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className={field}/></div></div><PrivacyNotice locale={locale} purpose="donation"/></section><section className="border-t border-line pt-6"><PaymentCheckout onStarted={()=>setLocked(true)} locale={locale} name={name} email={email} currency={currency} items={cart.map(item=>({campaignId:campaignMeta[item.slug]?.id||item.campaignId||null,amount:item.amount,frequency:item.frequency.toUpperCase()}))}/></section></div>
    <aside className="rounded-2xl border border-line bg-brand/5 p-5"><ul className="space-y-4">{cart.map(item => <li key={key(item)} className="flex items-start justify-between gap-4 text-sm"><span className="leading-6 text-ink"><Link className="underline" href={p+"/campaigns/"+item.slug} target="_blank">{item.title}</Link><span className="block text-xs text-muted">{frequency(item)}</span></span><strong className="shrink-0 text-brand">{money(item.amount)}</strong></li>)}</ul><p className="mt-5 flex justify-between gap-3 border-t border-line pt-5 font-bold text-ink"><span>{t.total}</span><span className="text-brand">{money(total)}</span></p></aside>
   </div>}
  </div>
 </main>;
}
