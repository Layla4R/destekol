import { loadTranslations } from "@/lib/i18n";
import ForgotClient from "./client";
export default async function ForgotPage({ params: { locale } }: {
    params: {
        locale: string;
    };
}) {
    const dict = await loadTranslations(locale);
    return <ForgotClient locale={locale} dict={dict}/>;
}
