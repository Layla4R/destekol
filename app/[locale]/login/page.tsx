import { loadTranslations } from "@/lib/i18n";
import LoginClient from "./client";
export default async function LoginPage({ params: { locale } }: {
    params: {
        locale: string;
    };
}) {
    const dict = await loadTranslations(locale);
    return <LoginClient locale={locale} dict={dict}/>;
}
