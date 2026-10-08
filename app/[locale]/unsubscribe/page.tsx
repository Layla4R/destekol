import NewsletterUnsubscribe from '@/components/site/NewsletterUnsubscribe';
export const metadata={robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default function Page({params:{locale}}:{params:{locale:string}}){return <NewsletterUnsubscribe locale={locale}/>;}