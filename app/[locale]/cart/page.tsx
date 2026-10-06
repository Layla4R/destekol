import { loadTranslations } from "@/lib/i18n";
import CartClient from "./client";
export default async function CartPage({ params: { locale } }: {
    params: {
        locale: string;
    };
}) {
    const dict = await loadTranslations(locale);
    return <CartClient locale={locale} dict={dict}/>;
}
