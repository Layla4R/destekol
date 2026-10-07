import { policies } from './current-policies';

export function getPolicyMetadata(slug: string, locale: string) {
    const sections = (policies[locale] || policies.ar)[slug];
    return { title: sections?.[0].title || slug, description: sections?.[0].text || '' };
}
