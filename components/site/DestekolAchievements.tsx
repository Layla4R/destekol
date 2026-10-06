import { ClipboardCheck,Globe2,HandHeart,UsersRound } from "lucide-react";
const icons = { globe: Globe2, users: UsersRound, heart: HandHeart, projects: ClipboardCheck };
export default function DestekolAchievements({ data }: {
    data: any;
}) {
    return <section className="destekol-achievements" aria-label={data.title || "Achievements"}>
    <svg className="destekol-waves" viewBox="0 0 1440 110" preserveAspectRatio="none" aria-hidden="true">
      <path fill="#098494" opacity=".65" d="M0 20C170 100 320 0 490 30S760 100 940 35s300-5 500 10V110H0Z"/>
      <path fill="#9bdadc" opacity=".75" d="M0 80C160 0 320 110 500 55s240 20 440 10 290-70 500-20V110H0Z"/>
      <path fill="white" d="M0 100C140 25 280 95 420 78s220-25 370 5 260-42 400-20 180 12 250 40V110H0Z"/>
    </svg>
    <div className="destekol-impact-grid">
      {(data.items || []).map((item: any, index: number) => {
            const Glyph = icons[item.icon as keyof typeof icons] || Object.values(icons)[index % 4];
            return <div className="destekol-impact" key={index}>
          <span className="destekol-impact-icon">{item.image ? <img src={item.image} alt=""/> : <Glyph strokeWidth={1.8}/>}</span>
          <div><strong dir="ltr">{item.value}</strong><span>{item.title}</span></div>
        </div>;
        })}
    </div>
  </section>;
}
