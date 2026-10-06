import LocaleLayout from "./[locale]/layout";
import HomePage,{ generateMetadata as generateHomeMetadata } from "./[locale]/page";
async function getDomainLocale(): Promise<string> {
    return "tr";
}
export async function generateMetadata() {
    const locale = await getDomainLocale();
    return generateHomeMetadata({ params: { locale } });
}
export default async function RootPage() {
    const locale = await getDomainLocale();
    return (<LocaleLayout params={{ locale }}>
      <HomePage params={{ locale }}/>
    </LocaleLayout>);
}
