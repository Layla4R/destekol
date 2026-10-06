import type { SupabaseClient } from '@supabase/supabase-js';
import { policies } from './current-policies';
import { normalizePublicContact } from './public-contact';
type Row = Record<string, any>;
type Document = {
    title: string;
    url: string;
    text: string;
    locale: string;
};
const sources = [
    { table: 'Page', flag: 'isPublished', fields: 'id,slug,title,description,body,body2,body3,sections', translations: 'PageTranslation', translated: 'locale,title,description,body,body2,body3,sections', prefix: '' },
    { table: 'Campaign', flag: 'isActive', fields: 'id,slug,title,summary,description', translations: 'CampaignTranslation', translated: 'locale,title,summary,description', prefix: '/campaigns' },
    { table: 'NewsPost', flag: 'isPublished', fields: 'id,slug,title,excerpt,body,body2', translations: 'NewsPostTranslation', translated: 'locale,title,excerpt,body,body2', prefix: '/news' },
];
const textKeys = /^(title|headline|subheading|subtitle|description|summary|excerpt|body[0-9]*|text|content|answer|question|q|a|label|caption|alt|buttonText)$/i;
export function extractText(value: unknown, key = 'text'): string {
    if (typeof value === 'string') {
        if (!textKeys.test(key))
            return '';
        return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
    }
    if (Array.isArray(value))
        return value.map(item => extractText(item, key)).filter(Boolean).join('\n');
    if (value && typeof value === 'object')
        return Object.entries(value).map(([k, v]) => extractText(v, k)).filter(Boolean).join('\n');
    return '';
}
const normalize = (text: string) => text.toLowerCase().normalize('NFKD').replace(/[\u064b-\u065f\u0670\u0300-\u036fـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
const stop = new Set('ما ماذا هل كيف كم من في على عن الى هو هي ان الذي التي اريد the a an is are what how of to in and le la les de des du et un une bir ve bu'.split(' '));
const tokens = (text: string) => (normalize(text).match(/[\p{L}\p{N}]+/gu) || []).map(w => w.startsWith('ال') && w.length > 4 ? w.slice(2) : w).filter(w => w.length > 1 && !stop.has(w));
export function rankSiteContext(documents: Document[], question: string, locale: string, budget = 12000): string {
    const query = [...new Set(tokens(question))];
    if (!query.length)
        return '';
    const candidates = documents.flatMap(document => {
        // Overlap keeps answers crossing a chunk boundary searchable; nothing is cut before ranking.
        const chunks: string[] = [];
        for (let offset = 0; offset < document.text.length; offset += 1000)
            chunks.push(document.text.slice(offset, offset + 1400));
        return chunks.map(text => {
            const body = new Set(tokens(text));
            const title = new Set(tokens(document.title));
            const hits = query.filter(word => body.has(word) || title.has(word)).length;
            return { ...document, text, score: hits ? hits / query.length * 10 + query.filter(word => title.has(word)).length * 2 + (document.locale === locale ? 0.5 : 0) : 0 };
        });
    }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
    const chosen: string[] = [];
    const seen = new Set<string>();
    let used = 2;
    for (const item of candidates) {
        if (seen.has(item.text))
            continue;
        const entry = JSON.stringify({ title: item.title, url: item.url, locale: item.locale, text: item.text });
        if (used + entry.length + 1 > budget)
            continue;
        chosen.push(entry);
        seen.add(item.text);
        used += entry.length + 1;
    }
    return '[' + chosen.join(',') + ']';
}
export async function siteContext(db: SupabaseClient, question: string, locale: string, signal: AbortSignal, email?: string): Promise<string> {
    const results = await Promise.all(sources.map(async (source) => {
        const documents: Document[] = [];
        for (let offset = 0;;) {
            const { data, error } = await db.from(source.table)
                .select(source.fields + ',' + source.translations + '(' + source.translated + ')')
                .eq(source.flag, true).order('id', { ascending: true }).range(offset, offset + 199).abortSignal(signal);
            if (error) {
                console.warn('Chat published content query failed:', source.table);
                return [];
            }
            const batch = (data || []) as unknown as Row[];
            if (!batch.length)
                break;
            for (const row of batch) {
                const variants = [{ ...row, locale: 'ar' }, ...(Array.isArray(row[source.translations]) ? row[source.translations] : [])];
                for (const variant of variants) {
                    const lang = variant.locale || 'ar';
                    const policy = source.table === 'Page' ? policies[lang]?.[row.slug] : undefined;
                    // Policy pages render maintained copy rather than legacy database sections.
                    const content = policy ? policy.map(s => s.title + '\n' + s.text).join('\n') : extractText(Object.fromEntries(Object.entries(variant).filter(([key]) => key !== source.translations)));
                    documents.push({ title: variant.title || row.title, url: '/' + lang + source.prefix + '/' + row.slug, locale: lang, text: normalizePublicContact(content, email) });
                }
            }
            offset += batch.length;
        }
        return documents;
    }));
    return rankSiteContext(results.flat(), question, locale);
}
