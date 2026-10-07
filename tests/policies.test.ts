import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import original from '../data/policies/tr.json';
import { LEGAL_SLUGS, policies } from '../lib/current-policies';
import { getPolicyMetadata } from '../lib/policy-metadata';
import LegalPageContent from '../components/site/LegalPageContent';

// tsx's standalone transform supports the JSX emitted by this Next component.
(globalThis as typeof globalThis & { React: typeof React }).React = React;

test('all source sections, paragraphs and table cells remain available in every language', () => {
    assert.equal(Object.keys(original).length, 9);
    for (const locale of ['tr', 'ar', 'en', 'fr']) {
        assert.equal(LEGAL_SLUGS.length, 10);
        for (const [slug, source] of Object.entries(original)) {
            const translated = policies[locale][slug];
            const extra = ['refund-policy', 'terms'].includes(slug) ? 1 : 0;
            assert.equal(translated.length, source.length + extra, `${locale}/${slug}: sections`);
            for (const [index, section] of source.entries()) {
                assert.ok(translated[index].title.trim());
                assert.ok(translated[index].text.trim());
                const rows = section.text.split('\n');
                const translatedRows = translated[index].text.split('\n');
                assert.equal(translatedRows.length, rows.length, `${locale}/${slug}/${index}: paragraphs`);
                rows.forEach((row, rowIndex) => assert.equal(translatedRows[rowIndex].split('\t').length, row.split('\t').length, `${locale}/${slug}/${index}: table columns`));
                if (locale === 'tr') assert.deepEqual(translated[index], section);
            }
            assert.equal(getPolicyMetadata(slug, locale).title, translated[0].title);
        }
        assert.deepEqual(policies[locale]['how-we-use-donations'], policies[locale]['financial-transparency']);
    }
});

test('policy pages render every body paragraph and table cell with correct direction and links', () => {
    for (const locale of ['tr', 'ar', 'en', 'fr']) {
        for (const slug of LEGAL_SLUGS) {
            const html = renderToStaticMarkup(React.createElement(LegalPageContent, { locale, slug }));
            assert.ok(html.includes(`dir="${locale === 'ar' ? 'rtl' : 'ltr'}"`));
            assert.ok(/datetime="2026-10-07"/i.test(html));
            assert.ok(html.includes(`href="/${locale}/kvkk"`) || slug === 'kvkk');
            for (const section of policies[locale][slug].slice(1)) {
                for (const cell of section.text.split(/[\n\t]/).filter(Boolean)) {
                    const escaped = renderToStaticMarkup(React.createElement('span', null, cell)).replace(/^<span>|<\/span>$/g, '');
                    assert.ok(html.includes(escaped), `${locale}/${slug}: missing content ${cell.slice(0, 40)}`);
                }
            }
            assert.ok(!html.includes('24 September 2026'));
            assert.ok(!html.includes('within 24 hours'));
        }
    }
});
