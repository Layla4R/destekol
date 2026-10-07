import type { PolicySection } from './current-policies';

// Each numbered heading starts a section; tab-separated rows preserve source tables.
export function parsePolicyText(source: string): Record<string, PolicySection[]> {
    return Object.fromEntries(source.trim().split(/^=== /m).filter(Boolean).map(document => {
        const [slug, ...lines] = document.trim().split('\n');
        const sections: PolicySection[] = [];
        for (const line of lines) {
            if (line.startsWith('## ')) sections.push({ title: line.slice(3), text: '' });
            else if (sections.length) {
                const section = sections[sections.length - 1];
                section.text += (section.text ? '\n' : '') + line;
            }
        }
        return [slug, sections.map(section => ({ ...section, text: section.text.trim() }))];
    }));
}
