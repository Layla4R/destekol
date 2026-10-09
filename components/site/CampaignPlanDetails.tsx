import { readCampaignPlan, campaignPlanErrors, PLAN_FIELDS, budgetTotal, type PlanLocale } from '@/lib/campaign-plan';
import { getCampaignPlanCopy } from '@/lib/campaign-plan-copy';
import { formatCurrency } from '@/lib/format';
export default function CampaignPlanDetails({plan: input, locale, goal, currency, category}: {plan: unknown; locale:string; goal:number; currency:string; category:string}) {
  const plan=readCampaignPlan(input), copy=getCampaignPlanCopy(locale);
  const published=plan.approved && !!plan.approvedAt && !!plan.approvedBy && campaignPlanErrors(plan,goal,category).length===0;
  if (!published) return <section className="campaign-detail-section campaign-plan-pending"><h2>{copy.plan}</h2><p>{copy.pending}</p></section>;
  const language=(['ar','tr','en','fr'].includes(locale)?locale:'en') as PlanLocale, texts=plan.texts[language];
  const localDate=(date:string)=>new Intl.DateTimeFormat(locale,{timeZone:'UTC'}).format(new Date(date));
  return <section className="campaign-detail-section" data-campaign-plan-version={plan.version}>
    <h2>{copy.plan}</h2>
    <span className="campaign-phase">{copy.states[plan.state]}</span>
    <dl className="campaign-plan-facts">{[[copy.target,`${new Intl.NumberFormat(locale).format(plan.targetBeneficiaries!)} ${texts.beneficiaryUnit}`],[copy.start,localDate(plan.implementationStart)],[copy.end,localDate(plan.implementationEnd)],[copy.report,localDate(plan.reportDate)],[copy.version,plan.version],[copy.approved,localDate(plan.approvedAt)]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <div className="campaign-plan-narrative">{PLAN_FIELDS.filter(([key])=>key!=='beneficiaryUnit'&&texts[key]).map(([key])=><section key={key}><h3>{copy.fields[key]}</h3><p>{texts[key]}</p>{key==='needEvidence'&&plan.needSourceUrl&&<a href={plan.needSourceUrl} target="_blank" rel="noopener noreferrer">{copy.source} ↗</a>}</section>)}</div>
    <h3 className="campaign-budget-title">{copy.budget} · {currency}</h3>
    <div className="campaign-budget-scroll"><table><thead><tr>{[copy.item,copy.quantity,copy.unit,copy.total].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{plan.budget.map((row,i)=><tr key={i}><td>{row.labels[language]}</td><td>{new Intl.NumberFormat(locale).format(row.quantity)}</td><td>{formatCurrency(row.unitCost,currency,locale)}</td><td>{formatCurrency(Math.round(row.quantity*row.unitCost*100)/100,currency,locale)}</td></tr>)}</tbody><tfoot><tr><th colSpan={3}>{copy.total}</th><td>{formatCurrency(budgetTotal(plan),currency,locale)}</td></tr></tfoot></table></div>
  </section>;
}
