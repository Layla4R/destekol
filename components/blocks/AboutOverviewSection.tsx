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
        const heading = data?.[`heading_${locale}`] || data?.heading || "";
        const quote = data?.[`quote_${locale}`] || data?.quote || "";
        const cards = Array.isArray(data?.cards)
            ? data.cards.map((card: any) => ({
                title: card[`title_${locale}`] || card.title || "",
                description: card[`desc_${locale}`] || card.description || "",
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
