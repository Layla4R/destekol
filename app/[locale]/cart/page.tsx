import { loadTranslations } from "@/lib/i18n";
import CartClient from "./client";
import { getSupabaseOrNull } from '@/lib/supabase';
export default async function CartPage({ params: { locale } }: {
    params: {
        locale: string;
    };
}) {
    const dict = await loadTranslations(locale);
    const db = getSupabaseOrNull();
    const { data: campaigns } = db ? await db.from('Campaign').select('id,slug,coverImage,currency').eq('isActive', true) : { data: [] };
    const images = Object.fromEntries((campaigns || []).map(c => [c.slug, c.coverImage || '']));
    return <CartClient locale={locale} dict={dict} images={images} campaignMeta={Object.fromEntries((campaigns||[]).map(c=>[c.slug,{id:c.id,currency:c.currency||"USD"}]))}/>;
}
