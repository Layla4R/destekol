export const PLAN_LOCALES = ['ar', 'tr', 'en', 'fr'] as const;
export const PLAN_STATES = ['UNSPECIFIED', 'PRELAUNCH', 'FUNDRAISING', 'IMPLEMENTATION', 'COMPLETED', 'PAUSED'] as const;
export const PLAN_FIELDS = [
  ['overview', 'Project overview / نظرة عامة'],
  ['needEvidence', 'Evidence of need / دليل الاحتياج'],
  ['location', 'Safe location and scope / الموقع ونطاق العمل الآمن'],
  ['beneficiaryUnit', 'Beneficiary unit (children, families…) / وحدة المستفيدين'],
  ['selectionCriteria', 'Selection criteria / معايير الاختيار'],
  ['activities', 'Activities / الأنشطة'],
  ['outputs', 'Measurable outputs / المخرجات القابلة للقياس'],
  ['costAssumptions', 'Cost assumptions / افتراضات التكلفة'],
  ['implementer', 'Implementing organisation / الجهة المنفذة'],
  ['partner', 'Delivery partner (or explain direct delivery) / الشريك أو التنفيذ المباشر'],
  ['monitoring', 'Monitoring and reporting / المتابعة والتقرير'],
  ['shortfall', 'Shortfall arrangements / التعامل مع العجز'],
  ['surplus', 'Surplus arrangements / التعامل مع الفائض'],
  ['delay', 'Delay arrangements / التعامل مع التأخير'],
  ['fundraisingNote', 'Fundraising status explanation / شرح حالة الجمع'],
  ['healthReview', 'Health/nutrition review and safe delivery / مراجعة صحية أو تغذوية'],
] as const;
export type PlanTextKey = typeof PLAN_FIELDS[number][0];
export type PlanLocale = typeof PLAN_LOCALES[number];
export type PlanText = Record<PlanTextKey, string>;
export interface CampaignPlan {
  version: string;
  state: typeof PLAN_STATES[number];
  targetBeneficiaries: number | null;
  implementationStart: string;
  implementationEnd: string;
  reportDate: string;
  needSourceUrl: string;
  internalReference: string;
  approved: boolean;
  approvedAt: string;
  approvedBy: string;
  budget: { labels: Record<PlanLocale, string>; quantity: number; unitCost: number }[];
  texts: Record<PlanLocale, PlanText>;
}
export function emptyCampaignPlan(): CampaignPlan {
  return { version: '', state: 'UNSPECIFIED', targetBeneficiaries: null, implementationStart: '', implementationEnd: '', reportDate: '', needSourceUrl: '', internalReference: '', approved: false, approvedAt: '', approvedBy: '', budget: [], texts: Object.fromEntries(PLAN_LOCALES.map(l => [l, Object.fromEntries(PLAN_FIELDS.map(([key]) => [key, '']))])) as CampaignPlan['texts'] };
}
const text = (v: unknown, max = 6000) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const date = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v ? v : '';
export function readCampaignPlan(input: unknown): CampaignPlan {
  const p = input && typeof input === 'object' ? input as any : {};
  const result = emptyCampaignPlan();
  result.version = text(p.version, 100);
  result.state = PLAN_STATES.includes(p.state) ? p.state : 'UNSPECIFIED';
  result.targetBeneficiaries = Number.isInteger(p.targetBeneficiaries) && p.targetBeneficiaries > 0 ? p.targetBeneficiaries : null;
  for (const key of ['implementationStart', 'implementationEnd', 'reportDate'] as const) result[key] = date(p[key]);
  result.needSourceUrl = /^https:\/\//i.test(text(p.needSourceUrl, 2000)) ? text(p.needSourceUrl, 2000) : '';
  result.internalReference = text(p.internalReference, 300);
  result.approved = p.approved === true;
  result.approvedAt = typeof p.approvedAt === 'string' && !Number.isNaN(Date.parse(p.approvedAt)) ? text(p.approvedAt, 50) : '';
  result.approvedBy = text(p.approvedBy, 200);
  result.budget = Array.isArray(p.budget) ? p.budget.slice(0, 50).map((row: any) => ({labels: Object.fromEntries(PLAN_LOCALES.map(l => [l, text(row?.labels?.[l], 300)])) as Record<PlanLocale, string>, quantity: Number(row?.quantity), unitCost: Number(row?.unitCost)})) : [];
  for (const l of PLAN_LOCALES) for (const [key] of PLAN_FIELDS) result.texts[l][key] = text(p.texts?.[l]?.[key]);
  return result;
}
export const budgetTotal = (plan: CampaignPlan) => plan.budget.reduce((sum, row) => sum + Math.round(row.quantity * row.unitCost * 100), 0) / 100;
export function campaignPlanErrors(plan: CampaignPlan, goal: number, category: string): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(goal) || goal <= 0) errors.push('The fundraising goal must be positive.');
  if (!plan.version || !plan.internalReference) errors.push('Add the plan version and internal approved project reference.');
  if (plan.state === 'UNSPECIFIED') errors.push('Select the actual campaign phase.');
  if (!plan.targetBeneficiaries) errors.push('Enter the target beneficiary count.');
  if (!plan.implementationStart || !plan.implementationEnd || !plan.reportDate || plan.implementationEnd < plan.implementationStart || plan.reportDate < plan.implementationEnd) errors.push('Provide ordered implementation and report dates.');
  if (!plan.budget.length || plan.budget.some(r => !Number.isFinite(r.quantity) || r.quantity <= 0 || !Number.isFinite(r.unitCost) || r.unitCost < 0 || Math.abs(r.unitCost * 100 - Math.round(r.unitCost * 100)) > 0.00001)) errors.push('Enter valid budget quantities and unit costs (maximum two decimal places).');
  if (Math.round(budgetTotal(plan) * 100) !== Math.round(goal * 100)) errors.push('The itemised budget must match the fundraising goal in the campaign currency.');
  for (const l of PLAN_LOCALES) {
    const missing = PLAN_FIELDS.filter(([key]) => (key !== 'healthReview' || category === 'medical') && !plan.texts[l][key]).map(([,label]) => label);
    if (missing.length) errors.push(`${l}: complete ${missing.join(', ')}.`);
    if (plan.budget.some(row => !row.labels[l])) errors.push(`${l}: translate every budget item.`);
  }
  return errors;
}
// Approval belongs to the complete saved version. An ordinary edit always withdraws it.
export function prepareCampaignPlan(input: unknown, goal: number, category: string, approver: string): CampaignPlan {
  const plan = readCampaignPlan(input);
  if (plan.approved) {
    const errors = campaignPlanErrors(plan, goal, category);
    if (errors.length) throw new Error(errors.join('\n'));
    plan.approvedAt = new Date().toISOString();
    plan.approvedBy = approver;
  } else { plan.approvedAt = ''; plan.approvedBy = ''; }
  return plan;
}
