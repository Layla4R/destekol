"use client";
import { PageSection } from "@/lib/blocks";
export default function CanvasPreview({ section }: {
    section: PageSection;
}) {
    const p = section.props || {};
    switch (section.type) {
        case "kindness_box": return <div className="p-8 grid grid-cols-3 gap-4 items-center" style={{ background: "#edf8fb", color: "#063962" }}><img src={p.image} alt="" className="w-full"/><div><h2 className="font-bold text-2xl">{p.title}</h2><p className="text-sm">{p.subtitle}</p></div><div className="bg-white rounded-xl p-4">{(p.items || []).map((item: any, i: number) => <div key={i} className="text-xs py-2">{item.title} <span className="float-right">− 0 +</span></div>)}<div className="text-white p-2 rounded text-center text-xs" style={{ background: "#0a5171" }}>{p.cartButtonText}</div></div></div>;
        case "hero": {
            const slide = p.items?.[0] || p.slides?.[0] || p;
            const bgImage = slide.backgroundImage || slide.image || p.backgroundImage;
            const title = slide.headline || slide.title_ar || slide.title || p.title || "Hero Title";
            const subtitle = slide.subheading || slide.subtitle_ar || slide.subtitle || p.subtitle;
            const btnUrl = slide.buttonUrl || slide.buttonLink;
            const btnText = slide.buttonLabel || slide.buttonText || p.buttonText;
            return (<div className="relative overflow-hidden flex flex-col justify-center text-start" style={{ minHeight: 350, background: bgImage ? "none" : "#1a3a6b" }}>
          {bgImage && (<>
              <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover"/>

            </>)}
          <div className="relative z-10 px-12 py-16 text-white" style={{ maxWidth: 640 }}>
            <p className="text-white/80 text-xs font-semibold tracking-widest uppercase mb-3">Destekol Charitable Non-Profit Association</p>
            <h1 className="font-extrabold text-5xl leading-tight mb-4" style={{ fontFamily: "serif" }}>{title}</h1>
            <p className="text-white text-lg font-semibold leading-relaxed mb-8 drop-shadow-md">{subtitle}</p>
            {btnText && (<span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white" style={{ background: "linear-gradient(135deg,#F00F5A,#FF4D88)" }}>
                ♥ {btnText}
              </span>)}
          </div>
        </div>);
        }
        case "about_overview": return (<div className="bg-white px-10 py-10 text-center border-t border-slate-100">
        <h2 className="font-bold text-2xl text-slate-900 mb-2">
          {p.heading_ar || p.heading_en || "مؤسسة Destekol الإنسانية"}
        </h2>
        {(p.quote_ar || p.quote_en) && (<p className="text-xs text-slate-500 italic max-w-xl mx-auto mb-6">
            "{p.quote_ar || p.quote_en}"
          </p>)}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-start">
          {(p.cards || []).map((c: any, i: number) => (<div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="font-bold text-xs text-slate-900 mb-1">{c.title_ar || c.title_en}</div>
              <p className="text-[11px] text-slate-500 line-clamp-3">{c.desc_ar || c.desc_en}</p>
            </div>))}
        </div>
      </div>);
        case "our_work":
        case "sectors": return (<div className="bg-slate-50 px-10 py-10 border-t border-slate-100">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="inline-block text-xs font-semibold uppercase text-[#0069D2] tracking-widest bg-blue-50 px-3 py-1 rounded-full mb-2">
            {p.eyebrow || "مجالات عملنا"}
          </span>
          <h2 className="font-bold text-2xl text-slate-900 mb-2">
            {p.title || "من الاستجابة العاجلة إلى الحلول التنموية المستدامة"}
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {p.subtitle || "نستجيب اليوم للاحتياجات الطارئة للمتضررين من الأزمات والكوارث، ونؤسس معهم غداً لبيئة تمكينية."}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-start">
          {(p.items || []).map((item: any, i: number) => (<div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="font-bold text-sm text-slate-900 mb-1">{item.title}</div>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                {item.description || item.body}
              </p>
            </div>))}
        </div>
      </div>);
        case "projects": return (<div className="bg-white px-10 py-10 border-t border-slate-100">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="inline-block text-xs font-semibold uppercase text-[#0069D2] tracking-widest bg-blue-50 px-3 py-1 rounded-full mb-2">
            {p.eyebrow || "مشاريعنا الميدانية"}
          </span>
          <h2 className="font-bold text-2xl text-slate-900 mb-2">
            {p.title || "نُحوّل العطاء إلى أثرٍ تنموي ملموس"}
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {p.subtitle || "أعدّت محفظة مشاريعنا الاستراتيجية لتلبية الاحتياجات الأساسية وإعادة بناء المجتمعات."}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-start">
          {(p.items || []).map((item: any, i: number) => (<div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                {item.image ? (<img src={item.image} alt="" className="w-full h-32 object-cover"/>) : (<div className="w-full h-32 bg-slate-100 flex items-center justify-center text-xs text-slate-400">لا توجد صورة</div>)}
                <div className="p-4">
                  <div className="text-[10px] text-[#0069D2] font-bold mb-1">{item.category} • {item.location}</div>
                  <div className="font-bold text-sm text-slate-900 mb-1">{item.title}</div>
                  <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                </div>
              </div>
              <div className="p-4 pt-0">
                <span className="inline-block w-full text-center text-[11px] font-bold text-slate-700 bg-slate-100 py-2 rounded-xl border border-slate-200">
                  {item.buttonText || "استعرض المشروع"}
                </span>
              </div>
            </div>))}
        </div>
      </div>);
        case "destekol_achievements":
        case "stats": return (<div className="bg-white px-10 py-10">
        {p.title && <h2 className="font-bold text-xl text-center mb-6" style={{ color: "#111" }}>{p.title}</h2>}
        <div className="grid grid-cols-4 gap-4">
          {(p.items || []).map((item: any, i: number) => (<div key={i} className="text-center p-4 rounded-xl" style={{ background: "#F0F4FF", border: "1px solid #DDE3F5" }}>
              <div className="font-bold text-2xl" style={{ color: "#0069D2" }}>{item.value}</div>
              <div className="text-xs mt-1" style={{ color: "#6B7280" }}>{item.title}</div>
              <div className="text-[10px] mt-2 text-slate-500">{item.metricKind === 'TARGET' ? 'هدف مخطط' : item.metricKind === 'ACTUAL' ? 'نتيجة فعلية' : 'نوع المؤشر لم يُدخل بعد'} · {item.publicationApproved && item.sourceName && item.methodology && item.periodStart && item.periodEnd ? 'توثيق مُدخل — راجع اكتمال الحقول' : 'تفاصيل التوثيق غير مكتملة؛ الرقم يبقى ظاهرًا'}</div>
            </div>))}
        </div>
      </div>);
        case "text": return (<div className="bg-white px-10 py-10" style={{ textAlign: (p.align as any) || "right" }}>
        {p.image && <img src={p.image} alt="" className="w-full max-h-56 object-cover rounded-xl mb-5"/>}
        {p.title && <h2 className="font-bold text-2xl mb-4" style={{ color: "#111" }}>{p.title}</h2>}
        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#4B5563" }}>{p.body}</p>
      </div>);
        case "image_text": return (<div className="bg-white px-10 py-10">
        <div className={`flex items-center gap-8 ${p.imagePosition === "left" ? "flex-row" : "flex-row-reverse"}`}>
          {p.image ? (<img src={p.image} alt="" className="w-56 h-40 object-cover rounded-xl flex-shrink-0"/>) : (<div className="w-56 h-40 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: "#F3F4F6", border: "2px dashed #D1D5DB" }}>
              <span className="text-xs" style={{ color: "#9CA3AF" }}>No image</span>
            </div>)}
          <div className="flex-1">
            {p.title && <h2 className="font-bold text-xl mb-3" style={{ color: "#111" }}>{p.title}</h2>}
            <p className="text-sm leading-relaxed" style={{ color: "#4B5563" }}>{p.body}</p>
          </div>
        </div>
      </div>);
        case "donation_buttons": return (<div className="py-10 px-10 text-center" style={{ background: "#F8F9FF" }}>
        {p.title && <h2 className="font-bold text-2xl mb-2" style={{ color: "#111" }}>{p.title}</h2>}
        {p.subtitle && <p className="text-sm mb-5" style={{ color: "#6B7280" }}>{p.subtitle}</p>}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {(p.amounts || [5, 10, 25, 50, 100]).map((a: number, i: number) => (<span key={i} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: i === 3 ? "#0069D2" : "white", color: i === 3 ? "white" : "#111", border: "1px solid #E5E7EB" }}>${a}</span>))}
        </div>
        {p.allowMonthly && (<div className="flex justify-center gap-2 mb-4">
            <span className="px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: "#0069D2", color: "white" }}>One-time</span>
            <span className="px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: "#F3F4F6", color: "#6B7280" }}>Monthly</span>
          </div>)}
        <span className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-white" style={{ background: "linear-gradient(135deg,#F00F5A,#FF4D88)" }}>
          ♥ {p.title || "Donate Now"} — $25
        </span>
      </div>);
        case "campaigns_grid": return (<div className="px-10 py-10" style={{ background: "#F4F7FD" }}>
        {p.title && <h2 className="font-bold text-2xl mb-2" style={{ color: "#111" }}>{p.title}</h2>}
        {p.subtitle && <p className="text-sm mb-6" style={{ color: "#6B7280" }}>{p.subtitle}</p>}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (<div key={i} className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
              <div className="h-28" style={{ background: `linear-gradient(135deg, #e8f0fe ${i * 10}%, #d0e4ff)` }}/>
              <div className="p-3">
                <div className="h-3 rounded mb-2" style={{ background: "#F3F4F6", width: "75%" }}/>
                <div className="h-2 rounded mb-3" style={{ background: "#F9FAFB", width: "90%" }}/>
                <div className="h-1.5 rounded-full" style={{ background: "#E5E7EB" }}>
                  <div className="h-1.5 rounded-full" style={{ background: "#0069D2", width: `${30 + i * 15}%` }}/>
                </div>
              </div>
            </div>))}
        </div>
      </div>);
        case "faq": return (<div className="bg-white px-10 py-10">
        {p.title && <h2 className="font-bold text-2xl mb-6" style={{ color: "#111" }}>{p.title}</h2>}
        <div className="space-y-2">
          {(p.items || []).map((item: any, i: number) => (<div key={i} className="rounded-xl px-4 py-3.5 flex justify-between items-center" style={{ border: "1px solid #E5E7EB", background: i === 0 ? "#F5F3FF" : "white" }}>
              <span className="text-sm font-semibold" style={{ color: "#111" }}>{item.title}</span>
              <span className="font-light text-lg" style={{ color: "#9CA3AF" }}>+</span>
            </div>))}
        </div>
      </div>);
        case "chat_widget": return (<div className="p-5 bg-[#0F172A] text-white rounded-xl flex items-center justify-between border border-slate-700 my-2 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#6366F1] text-white flex items-center justify-center font-bold">
            🤖
          </div>
          <div>
            <div className="font-bold text-xs">
              {section.props?.title || "المساعد الذكي (AI Chatbot)"}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              عنصر عائم يظهر بأسفل الصفحة في الموقع الحي
            </div>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full">
          مفعّل
        </span>
      </div>);
        case "gallery": return (<div className="bg-white px-10 py-10">
        {p.title && <h2 className="font-bold text-xl mb-5" style={{ color: "#111" }}>{p.title}</h2>}
        <div className="grid grid-cols-3 gap-3">
          {(p.images || p.items || []).slice(0, 6).map((img: any, i: number) => {
                const url = typeof img === "string" ? img : img.url || img.src;
                return (<div key={i} className="h-28 rounded-xl overflow-hidden" style={{ background: "#F3F4F6" }}>
                {url && <img src={url} alt="" className="w-full h-full object-cover"/>}
              </div>);
            })}
          {(p.images || p.items || []).length === 0 && [1, 2, 3].map(i => (<div key={i} className="h-28 rounded-xl" style={{ background: "#F3F4F6" }}/>))}
        </div>
      </div>);
        case "stories": return (<div className="px-10 py-10" style={{ background: "#F9FAFB" }}>
        {p.title && <h2 className="font-bold text-xl mb-5" style={{ color: "#111" }}>{p.title}</h2>}
        <div className="grid grid-cols-2 gap-4">
          {(p.items || []).map((item: any, i: number) => (<div key={i} className="bg-white rounded-xl overflow-hidden text-start" style={{ border: "1px solid #E5E7EB" }}>
              {item.image && <img src={item.image} alt="" className="w-full h-28 object-cover"/>}
              <div className="p-3">
                <div className="font-bold text-sm mb-1" style={{ color: "#111" }}>{item.title}</div>
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#6B7280" }}>{item.body}</p>
              </div>
            </div>))}
        </div>
      </div>);
        case "cta": {
            const bg = p.style === "gold" ? "linear-gradient(135deg,#F59E0B,#D97706)"
                : p.style === "beige" ? "#FDF8F0"
                    : "linear-gradient(135deg,#003C87,#0069D2)";
            const textColor = p.style === "beige" ? "#111" : "white";
            return (<div className="px-10 py-12 text-center" style={{ background: bg }}>
          <h2 className="font-bold text-2xl mb-2" style={{ color: textColor }}>{p.title}</h2>
          <p className="text-sm mb-5 opacity-75" style={{ color: textColor }}>{p.subtitle}</p>
          {p.buttonText && (<span className="inline-block px-8 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: "linear-gradient(135deg,#F00F5A,#FF4D88)" }}>
              {p.buttonText}
            </span>)}
        </div>);
        }
        case "newsletter": return (<div className="px-10 py-12 text-center" style={{ background: "linear-gradient(135deg,#003C87,#0069D2)" }}>
        <h2 className="font-bold text-2xl text-white mb-2">{p.title || "Subscribe"}</h2>
        <p className="text-sm text-white/65 mb-6">{p.subtitle}</p>
        <div className="flex gap-2 max-w-sm mx-auto">
          <div className="flex-1 rounded-xl px-4 py-2.5 text-xs" style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.2)" }}>
            Email address…
          </div>
          <span className="px-5 py-2.5 rounded-xl font-bold text-xs text-white" style={{ background: "linear-gradient(135deg,#F00F5A,#FF4D88)" }}>Subscribe</span>
        </div>
      </div>);
        case "contact_form": return (<div className="bg-white px-10 py-10 text-start">
        {p.title && <h2 className="font-bold text-xl mb-2" style={{ color: "#111" }}>{p.title}</h2>}
        {p.subtitle && <p className="text-sm mb-5" style={{ color: "#6B7280" }}>{p.subtitle}</p>}
        <div className="space-y-3 max-w-md">
          {["Full Name", "Email Address", "Subject"].map(ph => (<div key={ph} className="h-10 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}/>))}
          <div className="h-24 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}/>
          <div className="h-10 w-28 rounded-xl" style={{ background: "#0069D2" }}/>
        </div>
      </div>);
        case "quick_donate": return <div className="p-6 flex flex-wrap gap-3 text-white" style={{ background: "#066090" }}><strong>التبرع السريع</strong>{(p.amounts || []).map((item: any, i: number) => <span key={i} className="rounded-lg bg-white/20 px-4 py-2">$ {item.value ?? item}</span>)}</div>;
        case "spacer": return (<div className="bg-white flex items-center justify-center relative" style={{ height: `${p.height || 48}px` }}>
        <div className="absolute inset-0 mx-8 border-t border-dashed" style={{ borderColor: "#E5E7EB", top: "50%" }}/>
        <span className="relative bg-white px-3 text-xs" style={{ color: "#9CA3AF" }}>{p.height || 48}px spacer</span>
      </div>);
        case "full_image": return (<div className="bg-white">
        {p.src ? (<img src={p.src} alt={p.alt || ""} className="w-full object-contain" style={{ maxHeight: `${p.maxHeight || 600}px` }}/>) : (<div className="w-full flex items-center justify-center" style={{ height: 200, background: "#F3F4F6", border: "2px dashed #D1D5DB" }}>
            <span className="text-xs" style={{ color: "#9CA3AF" }}>No image — click to upload</span>
          </div>)}
        {p.caption && <p className="text-center text-xs py-2" style={{ color: "#9CA3AF" }}>{p.caption}</p>}
      </div>);
        default: return (<div className="bg-white px-10 py-8 text-center text-sm" style={{ color: "#9CA3AF", border: "1px dashed #E5E7EB" }}>
        {section.type} block
      </div>);
    }
}
