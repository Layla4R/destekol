import CampaignCard from '@/components/blocks/CampaignCard';
import CampaignPlanDetails from '@/components/site/CampaignPlanDetails';
import Icon from '@/components/icons';
import { categoryMeta } from '@/lib/categories';
import { normalizeDestekolBrandCopy } from '@/lib/destekol-brand-copy';
import { getCampaignPlanCopy } from '@/lib/campaign-plan-copy';
import { readCampaignPlan, campaignPlanErrors } from '@/lib/campaign-plan';
import { loadTranslations, LOCALES } from '@/lib/i18n';
import { getRequestSite } from '@/lib/request-site';
import { getCampaignDetails } from '@/lib/services/campaign.service';
import { DESTEKOL_LEGAL_NAME } from '@/lib/public-contact';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
export const revalidate = 300;
const cleanText=(value: unknown) => typeof value==='string'?value.replace(/<[^>]*>/g,' ').trim():'';
type Params={slug:string;locale:string};
export async function generateMetadata({params}:{params:Params}):Promise<Metadata> {
  const raw=await getCampaignDetails(params.slug,params.locale);
  if(!raw)return {};
  const campaign=normalizeDestekolBrandCopy(raw,params.locale),siteUrl=getRequestSite().url;
  const title=campaign.displayTitle||campaign.title,description=cleanText(campaign.displaySummary||campaign.summary),url=`${siteUrl}/${params.locale}/campaigns/${campaign.slug}`;
  const image=campaign.coverImage||`${siteUrl}/brand/destekol-logo.png`;
  return {title,description,alternates:{canonical:url,languages:Object.fromEntries(LOCALES.map(locale=>[locale,`${siteUrl}/${locale}/campaigns/${campaign.slug}`]))},openGraph:{type:'article',url,siteName:'Destekol',title,description,images:[{url:image,alt:title}]},twitter:{card:'summary_large_image',title,description,images:[image]}};
}
export default async function CampaignDetailPage({params}:{params:Params}) {
  const {slug,locale}=params;
  const [raw,dict]=await Promise.all([getCampaignDetails(slug,locale),loadTranslations(locale)]);
  if(!raw)notFound();
  const campaign=normalizeDestekolBrandCopy(raw,locale),copy=getCampaignPlanCopy(locale),cat=categoryMeta(campaign.category,locale);
  const title=campaign.displayTitle||campaign.title,summary=cleanText(campaign.displaySummary||campaign.summary);
  // Full descriptions must not be replaced by the short card appeal.
  const description=cleanText(campaign.displayDescription||campaign.description)||summary;
  const goal=Number(campaign.goalAmount)||0,raised=Number(campaign.raisedAmount)||0,currency=campaign.currency||'USD';
  const plan=readCampaignPlan(campaign.projectPlan);
  const published=plan.approved&&!!plan.approvedAt&&!!plan.approvedBy&&campaignPlanErrors(plan,goal,campaign.category).length===0;
  let country=campaign.country||'';
  if(country==='غزة'||country.toLowerCase()==='gaza')country=({ar:'غزة',tr:'Gazze',en:'Gaza',fr:'Gaza'} as Record<string,string>)[locale]||'Gaza';
  const url=`${getRequestSite().url}/${locale}/campaigns/${campaign.slug}`;
  const schema={'@context':'https://schema.org','@type':'Article',headline:title,description:summary,image:campaign.coverImage?[campaign.coverImage]:undefined,datePublished:campaign.publishedAt||campaign.createdAt,dateModified:campaign.updatedAt,mainEntityOfPage:url,inLanguage:locale,publisher:{'@type':'NGO',name:DESTEKOL_LEGAL_NAME,url:getRequestSite().url}};
  return <div className="campaign-detail-page" dir={locale==='ar'?'rtl':'ltr'}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/>
    <div className="campaign-detail-container">
      <nav className="campaign-detail-breadcrumb" aria-label="Breadcrumb"><Link href={`/${locale}`}>{dict['nav.home']||({ar:'الرئيسية',tr:'Ana Sayfa',en:'Home',fr:'Accueil'} as Record<string,string>)[locale]}</Link><span>/</span><Link href={`/${locale}/campaigns`}>{dict['nav.campaigns']||({ar:'الحملات',tr:'Kampanyalar',en:'Campaigns',fr:'Campagnes'} as Record<string,string>)[locale]}</Link><span>/</span><span>{title}</span></nav>
      <div className="campaign-detail-layout">
        <header className="campaign-detail-hero">
          {campaign.coverImage&&<div className="campaign-detail-cover"><Image src={campaign.coverImage} alt={title} fill priority sizes="(max-width: 1023px) 100vw, 900px" className="object-cover"/></div>}
          <div className="campaign-detail-tags"><span><Icon name={cat.icon} size={15}/>{cat.label}</span>{country&&<span><Icon name="map-pin" size={15}/>{country}</span>}</div>
          <h1>{title}</h1>
          <p>{summary}</p>
        </header>
        <aside className="campaign-detail-donation" aria-label={copy.widget}>
          <div id="donate" className="campaign-detail-widget">
            <h2>{copy.widget}</h2>
            <CampaignCard variant="destekol" currency={currency} id={campaign.id} slug={campaign.slug} title={title} summary={summary} coverImage={null} goalAmount={goal} raisedAmount={raised} donorCount={campaign.donorCount||0} category={campaign.category} country={campaign.country} locale={locale} dict={dict} amounts={[10,25,50,100,250]} defaultAmount={Number(campaign.defaultAmount)>0?Number(campaign.defaultAmount):25}/>
            <div className="campaign-detail-funding-state"><span>{copy.states[published?plan.state:'UNSPECIFIED']}</span>{raised===0&&<p>{copy.zero}</p>}</div>
          </div>
        </aside>
        <div className="campaign-detail-content">
          <section className="campaign-detail-section"><h2>{copy.about}</h2><p>{description}</p></section>
          <CampaignPlanDetails plan={campaign.projectPlan} locale={locale} goal={goal} currency={currency} category={campaign.category}/>
          {campaign.updates?.length>0&&<section className="campaign-detail-section"><h2>{copy.updates}</h2><div className="campaign-detail-updates">{campaign.updates.map((update:any)=><article key={update.id}><time dateTime={update.createdAt}>{new Date(update.createdAt).toLocaleDateString(locale,{timeZone:'UTC'})}</time><h3>{update.title}</h3><p>{update.body}</p></article>)}</div></section>}
        </div>
      </div>
    </div>
  </div>;
}
