import { loadTranslations } from "@/lib/i18n";
import SettingsClient from "./client";
export default async function SettingsPage({ params: { locale } }: {
    params: {
        locale: string;
    };
}) {
    const dict = await loadTranslations(locale);
    return <SettingsClient locale={locale} dict={dict}/>;
}
