import Icon from "@/components/icons";
import Image from "next/image";
interface Props {
    data?: any;
    locale?: string;
    isDestekol?: boolean;
}
export default function AboutOverviewSection({ data, locale = "ar", isDestekol = false }: Props) {
    const isAr = locale === "ar";
{
        const heading = isAr ? data?.heading_ar : data?.heading_en || data?.heading_ar;
        const quote = isAr ? data?.quote_ar : data?.quote_en || data?.quote_ar;
        const cards = Array.isArray(data?.cards)
            ? data.cards.map((card: any) => ({
                title: (isAr ? card.title_ar : card.title_en) || card.title || "",
                description: (isAr ? card.desc_ar : card.desc_en) || card.description || "",
                image: card.image || "",
            })).filter((card: any) => card.title || card.description || card.image)
            : [];
        if (!heading && !quote && cards.length === 0)
            return null;
        return (<section className="destekol-about-overview" dir={isAr ? "rtl" : "ltr"}>
        {(heading || quote) && (<header className="destekol-about-overview-intro">
            {heading && <h2>{heading}</h2>}
            {quote && <p>{quote}</p>}
          </header>)}
        <div className="destekol-about-overview-list">
          {cards.map((card: any, index: number) => (<article className={`destekol-about-overview-card${index % 2 ? " is-reversed" : ""}`} key={`${card.title}-${index}`}>
              {card.image && <figure><Image src={card.image} alt={card.title} fill sizes="(max-width: 768px) 100vw, 42vw" className="object-cover"/></figure>}
              <div className="destekol-about-overview-copy" dir={isAr ? "rtl" : "ltr"}>
                {card.title && <h3>{card.title}</h3>}
                <span aria-hidden="true"/>
                {card.description && <p>{card.description}</p>}
              </div>
            </article>))}
        </div>
      </section>);
    }
}
