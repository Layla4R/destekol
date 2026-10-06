import DestekolNewsPage from "@/components/site/DestekolNewsPage";
export const revalidate = 0;
export default async function NewsPage({ params: { locale }, searchParams = {} }: {
    params: {
        locale: string;
    };
    searchParams?: {
        category?: string | string[];
        page?: string | string[];
    };
}) {
    return <DestekolNewsPage locale={locale} searchParams={searchParams}/>;
}
