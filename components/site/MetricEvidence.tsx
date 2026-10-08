import { metricCopy, publicMetricSourceUrl, isPublishableMetric } from '@/lib/public-metrics';
export default function MetricEvidence({ item, locale = 'ar' }: { item: any; locale?: string }) {
    if (!isPublishableMetric(item)) return null;
    const copy = metricCopy[locale] || metricCopy.en;
    const url = publicMetricSourceUrl(item.sourceUrl);
    return <div className="mt-2 text-xs leading-relaxed font-normal">
        <div className="inline-block rounded-full border border-current/20 px-2 py-0.5">{item.metricKind === 'TARGET' ? copy.target : copy.actual}</div>
        <details className="mt-1">
            <summary className="cursor-pointer underline underline-offset-2">{copy.source} · {copy.period}</summary>
            <p>{copy.period}: <time dateTime={item.periodStart}>{item.periodStart}</time> — <time dateTime={item.periodEnd}>{item.periodEnd}</time></p>
            <p>{copy.source}: {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="underline">{item.sourceName}</a> : item.sourceName}</p>
            <p className="whitespace-pre-line">{copy.method}: {item.methodology}</p>
        </details>
    </div>;
}
