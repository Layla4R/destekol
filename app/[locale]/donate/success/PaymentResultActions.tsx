'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentResultActions({ locale, pending, confirmedItem, allocations, donationId }: { donationId?:string; allocations?: {campaignId:string|null;amount:number;frequency:string}[]|null; locale: string; pending: boolean; confirmedItem: { campaignId: string | null; amount: number; frequency: string } | null }) {
    const router = useRouter();
    useEffect(()=>{if(!pending&&donationId){try{const cache=JSON.parse(sessionStorage.getItem('destekol_payment_request')||'null');if(cache?.donationId===donationId)sessionStorage.removeItem('destekol_payment_request');}catch{}}},[pending,donationId]);
    useEffect(() => {
        if (!confirmedItem) return;
        try {
            const cart = JSON.parse(sessionStorage.getItem('destekol_cart') || '[]');
            if (!Array.isArray(cart)) return;
            const paid=allocations?.length?allocations:[confirmedItem];
            const remaining = cart.filter(item => !paid.some(p=>(item.campaignId||null)===p.campaignId && Number(item.amount)===Number(p.amount) && String(item.frequency).toUpperCase()===p.frequency));
            sessionStorage.setItem('destekol_cart', JSON.stringify(remaining));
            window.dispatchEvent(new Event('storage'));
        } catch { /* Browser storage may be unavailable. */ }
    }, [confirmedItem,allocations]);
    useEffect(() => {
        if (!pending) return;
        let count = 0;
        const timer = setInterval(() => { if (++count > 6) clearInterval(timer); else router.refresh(); }, 10000);
        return () => clearInterval(timer);
    }, [pending, router]);
    if (!pending) return null;
    return <button className="rounded-xl bg-brand text-white px-5 py-3" onClick={() => router.refresh()}>{({ ar: 'تحديث حالة الدفع', en: 'Check payment status', fr: 'Vérifier le paiement', tr: 'Ödeme durumunu kontrol et' } as Record<string, string>)[locale] || 'Check payment status'}</button>;
}
