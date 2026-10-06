import Icon from "@/components/icons";
import { normalizeDestekolBrandCopy } from "@/lib/destekol-brand-copy";
import { normalizePublicContact,officialEmail } from "@/lib/public-contact";
import Image from "next/image";
import Link from "next/link";
interface ProjectArticleLayoutProps {
    hideHeader?: boolean;
    data: {
        title: string;
        excerpt: string;
        body: string;
        body2?: string;
        body3?: string; // تمت إضافة body3 هنا
        coverImage?: string | null;
        secondaryImage?: string | null;
        gallery: string[];
        videoUrl?: string | null;
        publishedAtISO: string;
        updatedAtISO: string;
        authorName: string;
        trustBadge: string;
    };
    context: {
        locale: string;
        dict: Record<string, string>;
        isAr: boolean;
        brandName: string;
        backLink: string;
        backText: string;
        categoryLabel: string;
        donateUrl?: string;
    };
}
function getYouTubeEmbedUrl(url?: string | null): string | null {
    if (!url)
        return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
}
export default function ProjectArticleLayout({ data, context, hideHeader = false }: ProjectArticleLayoutProps) {
    const isDestekol = true;
    data = normalizePublicContact(normalizeDestekolBrandCopy(data, context.locale), officialEmail(isDestekol));
    const { locale, dict, isAr, backLink, backText, categoryLabel, donateUrl } = context;
    const youtubeEmbed = getYouTubeEmbedUrl(data.videoUrl);
    const txtWrittenBy = locale === "en" ? "Supervised by:" : locale === "tr" ? "Sorumlu:" : locale === "fr" ? "Supervisé par:" : "إشراف وتوثيق:";
    const txtPublishedAt = locale === "en" ? "Published:" : locale === "tr" ? "Yayınlanma:" : locale === "fr" ? "Publié:" : "تاريخ التوثيق:";
    // تحسينات مظهر النصوص والعناوين H1, H2, H3
    const renderFormattedBody = (content: string) => {
        if (!content)
            return null;
        const hasHtml = /<[a-z][\s\S]*>/i.test(content);
        if (hasHtml) {
            return (<div className="prose prose-base sm:prose-lg max-w-none text-slate-700 leading-loose
                     prose-headings:font-extrabold prose-headings:text-slate-900
                     prose-h1:text-3xl sm:prose-h1:text-4xl prose-h1:text-brand prose-h1:mb-6 prose-h1:mt-8
                     prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:text-brand prose-h2:mt-10 prose-h2:mb-5 prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-3
                     prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:text-slate-800 prose-h3:mt-8 prose-h3:mb-4
                     prose-p:leading-relaxed prose-p:mb-5
                     prose-a:text-brand hover:prose-a:text-brand-dark prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                     prose-strong:text-slate-900 prose-strong:font-bold
                     prose-ul:list-disc prose-ul:ps-6 prose-li:mb-2 prose-li:marker:text-brand" dangerouslySetInnerHTML={{ __html: content }}/>);
        }
        return (<div className="space-y-5 text-slate-700 text-base sm:text-lg leading-loose font-medium">
        {content.split("\n").map((paragraph, idx) => paragraph.trim() ? <p key={idx}>{paragraph}</p> : null)}
      </div>);
    };
    return (<article className="mx-auto max-w-screen-xl px-4 sm:px-6 py-8 sm:py-12 bg-white min-h-screen">
      
      {/* 1. Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500">
        <Link href={`/${locale}/`} className="transition hover:text-brand">
          {dict["nav.home"] || (isAr ? "الرئيسية" : "Home")}
        </Link>
        <span>/</span>
        <Link href={backLink} className="transition hover:text-brand">
          {backText}
        </Link>
        <span>/</span>
        <span className="max-w-xs truncate text-slate-800 font-bold">{data.title}</span>
      </nav>

      {/* 2. Header */}
      {!hideHeader && <header className="max-w-4xl mb-8">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse shadow-[0_0_8px_rgba(var(--brand-rgb),0.6)]"/>
          <span>{categoryLabel}</span>
        </div>

        <h1 className="mb-6 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight sm:leading-tight">
          {data.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 text-sm shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 font-bold text-brand">
              <Icon name="shield-check" size={20}/>
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">
                {txtWrittenBy} <span className="text-brand">{data.authorName}</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{data.trustBadge}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs sm:text-sm font-semibold text-slate-600">
              {txtPublishedAt}{" "}
              <time dateTime={data.publishedAtISO} className="text-slate-900">
                {new Date(data.publishedAtISO).toLocaleDateString(locale)}
              </time>
            </span>
            {donateUrl && (<Link href={donateUrl} className="px-6 py-2.5 bg-brand hover:bg-brand/90 text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg">
                {dict["campaign.donate"] || (isAr ? "تبرع الآن للمشروع" : "Donate Now")}
              </Link>)}
          </div>
        </div>
      </header>}

      {/* 3. Cover Image */}
      {data.coverImage && (<div className="mb-10 w-full overflow-hidden rounded-3xl bg-slate-100 shadow-md border border-slate-200">
          <Image src={data.coverImage} alt={data.title} width={1200} height={800} sizes="(max-width: 768px) 100vw, 1200px" className="w-full h-auto object-cover" priority/>
        </div>)}

      {/* 4. Excerpt / Summary */}
      {data.excerpt && (<section className="mb-10 border-s-4 border-brand bg-brand/5 p-5 sm:p-6 rounded-e-2xl text-sm sm:text-base leading-relaxed text-slate-800">
          <strong className="block mb-2 text-sm uppercase tracking-wider text-brand font-bold flex items-center gap-2">
            <Icon name="check-circle" size={18}/>
            {isAr ? "ملخص المشروع الإغاثي" : "Project Summary"}
          </strong>
          <p className="font-medium text-slate-700 leading-loose">{data.excerpt}</p>
        </section>)}

      {/* 5. Main Content Grid */}
      <div className={`grid grid-cols-1 ${data.videoUrl ? "lg:grid-cols-12" : "max-w-4xl mx-auto"} gap-10 items-start`}>
        
        {/* Main Body Column */}
        <div className={`${data.videoUrl ? "lg:col-span-8" : "w-full"} space-y-8`}>
          
          {data.body && (<div className="w-full">
              {renderFormattedBody(data.body)}
            </div>)}

          {data.secondaryImage && (<figure className="my-8">
              <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden bg-slate-100 shadow-md border border-slate-200">
                <Image src={data.secondaryImage} alt={data.title} fill sizes="(max-width: 768px) 100vw, 70vw" className="object-cover"/>
              </div>
            </figure>)}

          {data.body2 && (<div className="w-full pt-4">
              {renderFormattedBody(data.body2)}
            </div>)}

          {/* إضافة حقل body 3 هنا */}
          {data.body3 && (<div className="w-full pt-4 border-t border-slate-100">
              {renderFormattedBody(data.body3)}
            </div>)}

          {/* Gallery */}
          {data.gallery && data.gallery.length > 0 && (<section className="pt-8 mt-8 border-t border-slate-200">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 mb-5 flex items-center gap-2">
                <Icon name="image" size={20} className="text-brand"/>
                {isAr ? "مشاهد وسائط من الميدان" : "Field Photo Gallery"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.gallery.map((imgUrl, idx) => (<div key={idx} className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm group">
                    <Image src={imgUrl} alt={`Gallery media ${idx + 1}`} fill sizes="(max-width: 640px) 100vw, 40vw" className="object-cover group-hover:scale-105 transition-transform duration-500"/>
                  </div>))}
              </div>
            </section>)}
        </div>

        {/* 6. Sticky Sidebar Video */}
        {data.videoUrl && (<aside className="lg:col-span-4 lg:sticky lg:top-28 space-y-5">
            <div className="bg-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-xl border border-slate-800">
              <div className="flex items-center gap-2 mb-3 px-1 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"/>
                {isAr ? "تغطية مرئية خاصة" : "Special Video Coverage"}
              </div>

              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-700 shadow-inner">
                {youtubeEmbed ? (<iframe src={youtubeEmbed} className="w-full h-full border-0" allowFullScreen title={data.title}/>) : (<video src={data.videoUrl} controls playsInline className="w-full h-full object-cover"/>)}
              </div>

              <p className="text-xs text-slate-400 mt-4 px-1 leading-relaxed font-medium">
                {(isAr ? "تقرير توثيقي مصور يستعرض استجابة فرق Destekol الميدانية للأزمة ومجريات العمل على الأرض." : "Documentary video highlighting Destekol's field response to the crisis.")}
              </p>
            </div>
          </aside>)}
      </div>

      {/* 7. Footer Strip */}
      <div className="mt-12 border-t border-slate-200 pt-8 pb-4">
        <Link href={backLink} className="inline-flex items-center gap-2 font-bold text-brand hover:text-brand-dark transition-colors text-sm sm:text-base">
          <Icon name="arrow-left" size={18} className={isAr ? "rotate-180" : ""}/>
          {backText}
        </Link>
      </div>
    </article>);
}
