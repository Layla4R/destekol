"use client";
import { useState } from 'react';

const copy: Record<string, { title: string; card: string; bank: string; monthly: string; pending: string }> = {
    ar: { title: 'طريقة التبرع', card: 'التبرع بالبطاقة البنكية', bank: 'التبرع بالتحويل البنكي', monthly: 'التبرع الشهري', pending: 'التبرع الإلكتروني غير متاح حاليًا.' },
    en: { title: 'Donation method', card: 'Donate by credit or debit card', bank: 'Donate by bank transfer', monthly: 'Monthly donation', pending: 'Online donations are currently unavailable.' },
    fr: { title: 'Mode de don', card: 'Don par carte bancaire', bank: 'Don par virement bancaire', monthly: 'Don mensuel', pending: 'Les dons en ligne sont actuellement indisponibles.' },
    tr: { title: 'Bağış Yöntemi', card: 'Banka / Kredi Kartı ile Bağış', bank: 'Banka Havalesi ile Bağış', monthly: 'Aylık Bağış', pending: 'Online bağış şu anda kullanıma açık değildir.' },
};

export default function PayTRMethods({ locale = 'tr', monthly = false, onCollapse }: { locale?: string; monthly?: boolean; onCollapse?: () => void }) {
    const [open, setOpen] = useState(true);
    const t = copy[locale] || copy.tr;
    const collapse = ({ ar: 'طيّ وسائل التبرع', en: 'Hide donation methods', fr: 'Masquer les modes de don', tr: 'Bağış yöntemlerini gizle' } as Record<string, string>)[locale] || 'Bağış yöntemlerini gizle';
    const expand = ({ ar: 'عرض وسائل التبرع', en: 'Show donation methods', fr: 'Afficher les modes de don', tr: 'Bağış yöntemlerini göster' } as Record<string, string>)[locale] || 'Bağış yöntemlerini göster';
    if (!open) return <button type="button" aria-expanded={false} onClick={() => setOpen(true)} className="w-full rounded-xl border border-line p-3 text-sm font-bold text-brand">{expand} <span aria-hidden="true">⌄</span></button>;
    return <section aria-label={t.title} className="space-y-3">
        <div className="flex items-center justify-between gap-2"><p className="text-sm font-bold text-brand">{t.title}</p><button type="button" aria-expanded={true} onClick={() => onCollapse ? onCollapse() : setOpen(false)} className="rounded-lg border border-line px-2 py-1 text-xs text-brand hover:bg-brand/5">{collapse} <span aria-hidden="true">⌃</span></button></div>
        <div className="grid gap-2">
            {!monthly && <>
                <button type="button" disabled className="w-full rounded-xl border border-line bg-slate-50 px-4 py-3 text-sm text-slate-600 disabled:cursor-not-allowed">💳 {t.card}<span dir="ltr" className="mt-1 block text-xs">Visa / Mastercard / TROY</span></button>
                <button type="button" disabled className="w-full rounded-xl border border-line bg-slate-50 px-4 py-3 text-sm text-slate-600 disabled:cursor-not-allowed">🏦 {t.bank}<span dir="ltr" className="mt-1 block text-xs">Havale / EFT / FAST</span></button>
            </>}
            <button type="button" disabled className="w-full rounded-xl border border-line bg-slate-50 px-4 py-3 text-sm text-slate-600 disabled:cursor-not-allowed">🔄 {t.monthly}</button>
        </div>
        <p role="status" className="text-center text-xs leading-relaxed text-muted">{t.pending}</p>
    </section>;
}
