'use client';
import { useState } from 'react';
import { PLAN_FIELDS, PLAN_LOCALES, PLAN_STATES, budgetTotal, campaignPlanErrors, type CampaignPlan, type PlanLocale } from '@/lib/campaign-plan';

export default function CampaignPlanEditor({value, onChange, goal, currency, category}: {value: CampaignPlan; onChange: (p: CampaignPlan) => void; goal: number; currency: string; category: string}) {
  const [locale, setLocale] = useState<PlanLocale>('ar');
  const update = (patch: Partial<CampaignPlan>) => onChange({...value, ...patch, approved: false, approvedAt: '', approvedBy: ''});
  const inp = 'w-full rounded-xl border border-line bg-white p-3 text-sm';
  const errors = campaignPlanErrors(value, goal, category);
  return <section className="space-y-5 rounded-2xl border border-line bg-slate-50 p-5">
    <header><h2 className="font-bold text-lg">Campaign delivery plan / خطة الحملة</h2><p className="mt-2 text-sm text-muted">Enter verified project facts. Drafts are kept in admin; only a complete approved plan is published. Any change requires approval again. Do not enter personal beneficiary data or confidential locations.</p></header>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <label>Actual phase / المرحلة<select className={inp} value={value.state} onChange={e=>update({state:e.target.value as CampaignPlan['state']})}>{PLAN_STATES.map(s=><option key={s}>{s}</option>)}</select></label>
      <label>Version / النسخة<input className={inp} value={value.version} onChange={e=>update({version:e.target.value})}/></label>
      <label>Internal project reference / مرجع الملف الداخلي<input className={inp} value={value.internalReference} onChange={e=>update({internalReference:e.target.value})}/></label>
      <label>Target beneficiaries / عدد المستفيدين المستهدف<input className={inp} type="number" min="1" step="1" value={value.targetBeneficiaries??''} onChange={e=>update({targetBeneficiaries:e.target.value?Number(e.target.value):null})}/></label>
      {(['implementationStart','implementationEnd','reportDate'] as const).map((key,i)=><label key={key}>{['Implementation starts / بدء التنفيذ','Implementation ends / نهاية التنفيذ','Report due / موعد التقرير'][i]}<input className={inp} type="date" value={value[key]} onChange={e=>update({[key]:e.target.value})}/></label>)}
      <label>Public evidence link (HTTPS, optional)<input className={inp} type="url" value={value.needSourceUrl} onChange={e=>update({needSourceUrl:e.target.value})}/></label>
    </div>
    <div className="flex flex-wrap gap-2">{PLAN_LOCALES.map(l=><button type="button" key={l} aria-pressed={locale===l} onClick={()=>setLocale(l)} className={`rounded-lg border px-4 py-2 ${locale===l?'bg-brand text-white':'bg-white'}`}>{({ar:'العربية',tr:'Türkçe',en:'English',fr:'Français'})[l]}</button>)}</div>
    <div className="grid gap-4 sm:grid-cols-2" dir={locale==='ar'?'rtl':'ltr'}>{PLAN_FIELDS.map(([key,label])=><label key={key} className="text-sm">{label}{key==='healthReview'&&category!=='medical'?' (optional)':''}<textarea rows={key==='overview'?4:3} className={`${inp} mt-1`} value={value.texts[locale][key]} onChange={e=>update({texts:{...value.texts,[locale]:{...value.texts[locale],[key]:e.target.value}}})}/></label>)}</div>
    <div className="space-y-3"><h3 className="font-bold">Itemised budget / الميزانية المفصلة ({currency})</h3><p className="text-xs text-muted">Quantities and costs are shared across all languages; translate the item names in each tab. Include delivery, monitoring and overheads in the approved goal.</p>
      {value.budget.map((row,index)=><div key={index} className="grid gap-2 sm:grid-cols-[1fr_100px_120px_40px]">
        <input aria-label={`Budget item ${index+1} ${locale}`} placeholder="Item / البند" className={inp} value={row.labels[locale]} onChange={e=>update({budget:value.budget.map((r,i)=>i===index?{...r,labels:{...r.labels,[locale]:e.target.value}}:r)})}/>
        <input aria-label={`Quantity ${index+1}`} placeholder="Quantity" type="number" min="0.01" step="any" className={inp} value={row.quantity} onChange={e=>update({budget:value.budget.map((r,i)=>i===index?{...r,quantity:Number(e.target.value)}:r)})}/>
        <input aria-label={`Unit cost ${index+1}`} placeholder="Unit cost" type="number" min="0" step="0.01" className={inp} value={row.unitCost} onChange={e=>update({budget:value.budget.map((r,i)=>i===index?{...r,unitCost:Number(e.target.value)}:r)})}/>
        <button type="button" aria-label={`Remove item ${index+1}`} onClick={()=>update({budget:value.budget.filter((_,i)=>i!==index)})}>×</button>
      </div>)}
      <button type="button" className="rounded-lg border bg-white px-4 py-2" onClick={()=>update({budget:[...value.budget,{labels:{ar:'',tr:'',en:'',fr:''},quantity:1,unitCost:0}]})}>+ Add budget item / إضافة بند</button>
      <p className="font-bold">{budgetTotal(value).toLocaleString()} {currency} / Goal: {goal.toLocaleString()} {currency}</p>
    </div>
    <details className="text-sm"><summary>{errors.length?`${errors.length} checks remain before publication / متطلبات الاعتماد`:'Plan ready for approval / جاهزة للاعتماد'}</summary><ul className="mt-3 space-y-2">{errors.map((e,i)=><li key={i}>{e}</li>)}</ul></details>
    <label className="flex items-start gap-3 rounded-xl border bg-white p-4"><input type="checkbox" checked={value.approved} disabled={errors.length>0} onChange={e=>onChange({...value,approved:e.target.checked})}/><span className="text-sm">Approve and publish this complete version. I confirm it matches the internal costed project file and, for medical campaigns, has specialist approval. / اعتماد ونشر النسخة المطابقة لملف المشروع ومراجعة المختص. Click Save Changes to apply.</span></label>
    {value.approvedAt&&<p className="text-xs text-muted">Last saved approval: {value.approvedAt}</p>}
  </section>;
}
