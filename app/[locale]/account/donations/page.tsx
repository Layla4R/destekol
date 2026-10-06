import { loadTranslations } from "@/lib/i18n";
import DonationsClient from "./client";
export default async function DonationsPage({ params: { locale } }: {
    params: {
        locale: string;
    };
}) {
    const dict = await loadTranslations(locale);
    return <DonationsClient locale={locale} dict={dict}/>;
}
