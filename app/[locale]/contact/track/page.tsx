import ContactTracking from '@/components/site/ContactTracking';
export const metadata = { robots: { index:false, follow:false }, referrer:'no-referrer' as const };
export default function TrackContactPage({params:{locale}}:{params:{locale:string}}){
 return <ContactTracking locale={locale}/>;
}
