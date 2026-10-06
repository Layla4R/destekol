import { loadTranslations } from "@/lib/i18n";
import AccountClient from "./client";
export default async function AccountPage({ params: { locale } }: {
    params: {
        locale: string;
    };
}) {
    const dict = await loadTranslations(locale);
    return <AccountClient locale={locale} dict={dict}/>;
}
