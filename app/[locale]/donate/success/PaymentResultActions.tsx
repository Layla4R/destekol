'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentResultActions({ locale, pending, confirmedItem }: { locale: string; pending: boolean; confirmedItem: { campaignId: string | null; amount: number; frequency: string } | null }) {
    const router = useRouter();
    useEffect(() => {
        if (!confirmedItem) return;
        try {
            const cart = JSON.parse(sessionStorage.getItem('destekol_cart') || '[]');
            if (!Array.isArray(cart)) return;
            const remaining = cart.filter(item => !(item.campaignId === confirmedItem.campaignId && Number(item.amount) === confirmedItem.amount && String(item.frequency).toUpperCase() === confirmedItem.frequency));
            sessionStorage.setItem('destekol_cart', JSON.stringify(remaining));
            window.dispatchEvent(new Event('storage'));
        } catch { /* Browser storage may be unavailable. */ }
    }, [confirmedItem]);
    useEffect(() => {
        if (!pending) return;
        let count = 0;
        const timer = setInterval(() => { if (++count > 6) clearInterval(timer); else router.refresh(); }, 10000);
        return () => clearInterval(timer);
    }, [pending, router]);
    if (!pending) return null;
    return <button className="rounded-xl bg-brand text-white px-5 py-3" onClick={() => router.refresh()}>{({ ar: 'تحديث حالة الدفع', en: 'Check payment status', fr: 'Vérifier le paiement', tr: 'Ödeme durumunu kontrol et' } as Record<string, string>)[locale] || 'Check payment status'}</button>;
}
