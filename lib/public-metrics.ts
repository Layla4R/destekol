export function isPublishableMetric(item: any): boolean {
    const validDate = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value).toISOString().slice(0, 10) === value;
    try {
        return item?.publicationApproved === true && ['ACTUAL', 'TARGET'].includes(item.metricKind)
            && ['value', 'title', 'sourceName', 'methodology', 'approvedBy'].every(key => typeof item[key] === 'string' && item[key].trim().length > 0)
            && validDate(item.periodStart) && validDate(item.periodEnd) && item.periodStart <= item.periodEnd
            && validDate(item.approvedOn) && item.approvedOn <= new Date().toISOString().slice(0, 10)
            && (item.metricKind !== 'ACTUAL' || item.periodEnd <= item.approvedOn);
    } catch { return false; }
}
export function publicMetricSourceUrl(value: unknown): string | undefined {
    try { const url = new URL(String(value)); return url.protocol === 'https:' ? url.href : undefined; } catch { return undefined; }
}
export const metricCopy: Record<string, { actual: string; target: string; source: string; period: string; method: string }> = {
    ar: { actual: 'نتيجة فعلية', target: 'هدف مخطط', source: 'المصدر', period: 'الفترة', method: 'طريقة الحساب' },
    tr: { actual: 'Gerçekleşen sonuç', target: 'Planlanan hedef', source: 'Kaynak', period: 'Dönem', method: 'Hesaplama yöntemi' },
    en: { actual: 'Actual result', target: 'Planned target', source: 'Source', period: 'Period', method: 'Calculation method' },
    fr: { actual: 'Résultat réel', target: 'Objectif prévu', source: 'Source', period: 'Période', method: 'Méthode de calcul' },
};
