import { loadTranslations } from "@/lib/i18n";
import ResetClient from "./client";
export default async function ResetPage({ params: { locale } }: {
    params: {
        locale: string;
    };
}) {
    const dict = await loadTranslations(locale);
    return <ResetClient locale={locale} dict={dict}/>;
}
