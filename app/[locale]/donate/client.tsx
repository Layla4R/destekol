"use client";
import { getMonthlyDonationCopy } from '@/lib/monthly-donation-copy';
import PrivacyNotice from '@/components/site/PrivacyNotice';
import DonationPageHeader from "@/components/site/DonationPageHeader";
import PaymentCheckout from "@/components/site/PaymentCheckout";
import Icon from "@/components/icons";
import { useEffect,useState } from "react";

const copy = {
 ar: { campaign: 'اختر وجهة تبرعك', general: 'تبرع عام', amount: 'مبلغ التبرع', donor: 'بيانات المتبرع', payment: 'طريقة التبرع', summary: 'ملخص التبرع', total: 'الإجمالي', other: 'أو أدخل مبلغًا آخر', note: 'ملاحظة إضافية', optional: 'اختياري', privacy: 'تُعالج بياناتك وفق سياسة الخصوصية وحماية البيانات.', badge: 'معًا نصنع أثرًا', intro: 'اختر وجهة تبرعك والمبلغ الذي يناسبك، وساهم في دعم مشاريعنا الإنسانية.', pending: 'التبرع الإلكتروني غير متاح حاليًا.', action: 'متابعة التبرع', allocation: 'تخصيص تبرعك للمشروع المختار', protection: 'حماية بيانات المتبرع', transparent: 'وضوح المبلغ ودورية التبرع' },
 en: { campaign: 'Choose a campaign', general: 'General donation', amount: 'Donation amount', donor: 'Donor information', payment: 'Donation method', summary: 'Donation summary', total: 'Total', other: 'Or enter another amount', note: 'Additional note', optional: 'Optional', privacy: 'Your data is processed in accordance with our privacy and data protection policy.', badge: 'Together, we make a difference', intro: 'Choose a cause and an amount that suits you to support our humanitarian projects.', pending: 'Online donations are currently unavailable.', action: 'Continue donation', allocation: 'Allocation to your chosen project', protection: 'Protection of donor information', transparent: 'Clear donation amount and frequency' },
 fr: { campaign: 'Choisissez une campagne', general: 'Don général', amount: 'Montant du don', donor: 'Informations du donateur', payment: 'Mode de don', summary: 'Récapitulatif du don', total: 'Total', other: 'Ou saisissez un autre montant', note: 'Message complémentaire', optional: 'Facultatif', privacy: 'Vos données sont traitées conformément à notre politique de confidentialité et de protection des données.', badge: 'Ensemble, faisons la différence', intro: 'Choisissez une cause et le montant qui vous convient pour soutenir nos projets humanitaires.', pending: 'Les dons en ligne sont actuellement indisponibles.', action: 'Poursuivre le don', allocation: 'Affectation au projet choisi', protection: 'Protection des données du donateur', transparent: 'Montant et fréquence du don clairement indiqués' },
 tr: { campaign: 'Kampanya Seçin', general: 'Genel Bağış', amount: 'Bağış Tutarı', donor: 'Bağışçı Bilgileri', payment: 'Bağış Yöntemi', summary: 'Bağış Özeti', total: 'Toplam', other: 'Veya farklı bir tutar girin', note: 'Ek Not', optional: 'İsteğe bağlı', privacy: 'Verileriniz gizlilik ve veri koruma politikamız doğrultusunda işlenir.', badge: 'Birlikte iyiliğe destek olalım', intro: 'Desteklemek istediğiniz alanı ve size uygun tutarı seçerek insani yardım projelerimize katkıda bulunun.', pending: 'Online bağış şu anda kullanıma açık değildir.', action: 'Bağışa Devam Et', allocation: 'Seçtiğiniz projeye bağış tahsisi', protection: 'Bağışçı bilgilerinin korunması', transparent: 'Açık bağış tutarı ve sıklığı' },
};
export default function DonateClient({ locale, dict: D, initialAmount, initialFreq, campaignId, campaigns = [], amounts = [], defaultAmount = 0 }: {
 locale: string; dict: Record<string, string>; initialAmount?: number; initialFreq?: 'ONE_TIME' | 'MONTHLY'; campaignId?: string; storyId?: string; campaigns?: { id: string; title: string; defaultAmount?: number; slug?:string; currency?:string }[]; amounts?: number[]; defaultAmount?: number;
}) {
 const t = copy[locale as keyof typeof copy] || copy.tr;
 const [selectedCampaign, setSelectedCampaign] = useState(campaigns.some(c => c.id === campaignId) ? campaignId || '' : '');
 const [amount, setAmount] = useState(Number.isFinite(initialAmount) && Number(initialAmount) >= 1 ? Number(initialAmount) : defaultAmount);
 const [custom, setCustom] = useState(initialAmount && initialAmount >= 1 && !amounts.includes(initialAmount) ? String(initialAmount) : '');
 const [freq, setFreq] = useState<'ONE_TIME' | 'MONTHLY'>(initialFreq || 'ONE_TIME');
 const [locked,setLocked]=useState(false);
 const [name, setName] = useState('');
 const [email, setEmail] = useState('');
 const [msg, setMsg] = useState('');
 const [anon, setAnon] = useState(false);
 const final = custom ? Number(custom) : amount;
 const campaignTitle = campaigns.find(c => c.id === selectedCampaign)?.title || t.general;
 const [generalCurrency,setGeneralCurrency]=useState('USD'),[currencies,setCurrencies]=useState<string[]>(['USD']);
 useEffect(()=>{fetch('/api/payments/config').then(r=>r.json()).then(c=>{if(c.enabled&&Array.isArray(c.currencies)&&c.currencies.length){setCurrencies(c.currencies);if(!c.currencies.includes('USD'))setGeneralCurrency(c.currencies[0]);}}).catch(()=>{});},[]);
 const currency=campaigns.find(c=>c.id===selectedCampaign)?.currency || generalCurrency;
 const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number.isFinite(value) && value > 0 ? value : 0);
 const panel = 'rounded-3xl border border-line bg-white p-5 sm:p-8 shadow-[0_8px_35px_rgba(7,74,109,0.06)]';
 const input = 'w-full rounded-xl border border-line bg-[#f7fbfc] px-4 py-3.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10';
 const heading = (icon: string, text: string) => <h2 className="mb-6 flex items-center gap-3 border-b border-line pb-4 text-lg font-bold text-ink"><Icon name={icon} size={23} className="shrink-0 text-brand"/>{text}</h2>;
 return <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="bg-[#f1f8fa]">
  <DonationPageHeader locale={locale} title={D['donate.title'] || t.general} description={t.intro}/>
  <div className="mx-auto grid max-w-6xl items-start gap-7 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_340px]">
   <div className="min-w-0 space-y-6">
    <section className={panel}>{heading('hand-heart', t.campaign)}<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[{ id: '', title: t.general }, ...campaigns].map(c => <button disabled={locked} key={c.id} type="button" aria-pressed={selectedCampaign === c.id} onClick={() => setSelectedCampaign(c.id)} className={`flex min-h-[112px] flex-col items-center justify-center gap-3 rounded-2xl border px-3 py-4 text-center text-sm font-bold leading-6 transition ${selectedCampaign === c.id ? 'border-brand bg-brand text-white shadow-lg shadow-brand/15' : 'border-line border-t-accent bg-[#f7fbfc] text-ink hover:border-brand hover:bg-brand/5'}`}><Icon name={c.id ? 'heart' : 'hand-heart'} size={26} className={selectedCampaign === c.id ? 'text-white' : 'text-brand'}/>{c.title}</button>)}</div></section>
    <section className={panel}>{heading('wallet', t.amount)}
     {!selectedCampaign&&currencies.length>1&&<label className="mb-5 block text-sm text-muted">{({ar:'عملة التبرع',en:'Donation currency',fr:'Devise du don',tr:'Bağış para birimi'} as Record<string,string>)[locale]}<select disabled={locked} className={input} value={generalCurrency} onChange={e=>setGeneralCurrency(e.target.value)}>{currencies.map(c=><option key={c} value={c}>{c}</option>)}</select></label>}
     <div className="mb-5 inline-flex max-w-full rounded-xl border border-line bg-[#f7fbfc] p-1">{(['ONE_TIME', 'MONTHLY'] as const).map(value => <button disabled={locked} key={value} type="button" aria-pressed={freq === value} onClick={() => setFreq(value)} className={`rounded-lg px-6 py-2.5 text-sm font-bold transition ${freq === value ? 'bg-brand text-white shadow-sm' : 'text-muted'}`}>{D[value === 'MONTHLY' ? 'donate.monthly' : 'donate.one_time'] || value}</button>)}</div>
     <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{amounts.map(a => <button disabled={locked} key={a} type="button" aria-pressed={final === a && !custom} onClick={() => { setAmount(a); setCustom(''); }} className={`rounded-xl border py-3.5 text-base font-bold transition ${final === a && !custom ? 'border-brand bg-brand text-white shadow-md shadow-brand/15' : 'border-line bg-[#f7fbfc] text-ink hover:border-brand'}`}>{money(a)}</button>)}</div>
     <label htmlFor="donation-amount" className="mb-2 block text-sm font-semibold text-muted">{t.other}</label><div className="relative"><input disabled={locked} id="donation-amount" type="number" min={1} step="0.01" value={custom} onChange={e => setCustom(e.target.value)} placeholder={String(amount)} className={`${input} pe-12`}/><span className="absolute end-4 top-1/2 -translate-y-1/2 font-bold text-brand">{currency}</span></div>
    </section>
    <section className={panel}>{heading('user', t.donor)}<div className="grid gap-5 sm:grid-cols-2">
     <div><label htmlFor="donor-name" className="mb-2 block text-sm font-semibold text-muted">{D['donate.name']} <span className="text-accent">*</span></label><input disabled={locked} id="donor-name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} className={input}/></div>
     <div><label htmlFor="donor-email" className="mb-2 block text-sm font-semibold text-muted">{D['donate.email']} <span className="text-accent">*</span></label><input disabled={locked} id="donor-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className={input}/></div>
     <div className="sm:col-span-2"><label htmlFor="donor-note" className="mb-2 block text-sm font-semibold text-muted">{t.note} <span className="text-xs font-normal">({t.optional})</span></label><textarea disabled={locked} id="donor-note" value={msg} onChange={e => setMsg(e.target.value)} rows={2} className={`${input} resize-y`}/></div>
    </div><label className="mt-4 flex items-center gap-2 text-sm text-muted"><input disabled={locked} type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} className="h-4 w-4 accent-brand"/>{D['donate.anonymous']}</label><p className="mt-5 flex items-start gap-2 text-xs leading-6 text-muted"><Icon name="shield-check" size={17} className="mt-1 shrink-0 text-brand"/>{t.privacy}</p><PrivacyNotice locale={locale} purpose="donation"/></section>
    <section className={panel}>{heading('credit-card', t.payment)}<PaymentCheckout onStarted={()=>setLocked(true)} locale={locale} name={name} email={email} currency={currency} message={msg} anonymous={anon} items={[{campaignId:selectedCampaign||null,amount:final,frequency:freq}]}/></section>
   </div>
   <aside className={`${panel} lg:sticky lg:top-28`} aria-label={t.summary}>{heading('receipt-text', t.summary)}
    <dl className="space-y-4 text-sm"><div className="flex items-start justify-between gap-4"><dt className="shrink-0 text-muted">{t.campaign}</dt><dd className="text-end font-bold text-ink">{selectedCampaign?<a className="underline" href={"/"+locale+"/campaigns/"+campaigns.find(c=>c.id===selectedCampaign)?.slug} target="_blank" rel="noreferrer">{campaignTitle}</a>:campaignTitle}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted">{D['donate.frequency']}</dt><dd className="font-semibold text-ink">{D[freq === 'MONTHLY' ? 'donate.monthly' : 'donate.one_time']}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted">{t.amount}</dt><dd className="font-bold text-brand">{money(final)}{freq === 'MONTHLY' ? ' ' + getMonthlyDonationCopy(locale).perMonth : ''}</dd></div><div className="flex justify-between border-t border-line pt-5 text-xl font-extrabold text-ink"><dt>{t.total}</dt><dd>{money(final)}{freq === 'MONTHLY' ? ' ' + getMonthlyDonationCopy(locale).perMonth : ''}</dd></div></dl>
    <button type="button" hidden disabled className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"><Icon name="lock-keyhole" size={19}/>{t.action}</button>
    <ul className="mt-6 space-y-3 border-t border-line pt-5">{[t.allocation, t.protection, t.transparent].map(text => <li key={text} className="flex items-start gap-2 text-xs leading-6 text-muted"><Icon name="check-circle" size={16} className="mt-1 shrink-0 text-brand"/>{text}</li>)}</ul>
   </aside>
  </div>
 </div>;
}
