export type FieldType = "campaign" | "text" | "textarea" | "image" | "color" | "number" | "select" | "boolean" | "list";
export interface FieldDef {
    key: string;
    label: string;
    type: FieldType;
    options?: {
        label: string;
        value: string;
    }[];
    itemFields?: FieldDef[];
    placeholder?: string;
    hint?: string;
}
export interface BlockDefinition {
    type: string;
    label: string;
    description: string;
    icon: import("@/components/icons").IconName;
    category: "layout" | "content" | "media" | "fundraising" | "social";
    defaultProps: Record<string, any>;
    fields: FieldDef[];
}
export interface PageSection {
    id: string;
    type: string;
    props: Record<string, any>;
}
export const BLOCK_DEFINITIONS: BlockDefinition[] = [
    {
        type: "kindness_box", label: "Destekol — صندوق الخير", description: "اختيار حملات حقيقية وإضافتها إلى السلة", icon: "heart", category: "fundraising",
        defaultProps: { title: "İyilik kutunuzu oluşturun.", subtitle: "Dilediğiniz alanlarda bağış yaparak kendi iyilik kutunuzu oluşturun.", buttonText: "Hemen Başla", buttonLink: "", cartButtonText: "Sepete Ekle", image: "", items: [] },
        fields: [{ key: "title", label: "العنوان", type: "text" }, { key: "subtitle", label: "الوصف", type: "textarea" }, { key: "image", label: "صورة صندوق الخير", type: "image" }, { key: "imageAlt", label: "وصف الصورة", type: "text" }, { key: "buttonText", label: "نص زر البدء", type: "text" }, { key: "buttonLink", label: "رابط زر البدء", type: "text", hint: "مثال: /campaigns أو رابط كامل" }, { key: "cartButtonText", label: "نص زر الإضافة للسلة", type: "text" }, { key: "items", label: "خيارات التبرع (حملة مختلفة لكل خيار)", type: "list", itemFields: [{ key: "title", label: "اسم الخيار", type: "text" }, { key: "campaignId", label: "الحملة المرتبطة", type: "campaign" }, { key: "unitAmount", label: "قيمة كل مساهمة بعملة الموقع", type: "number" }, { key: "icon", label: "الأيقونة", type: "select", options: [{ label: "الغذاء", value: "food" }, { label: "التعليم", value: "education" }, { label: "الماء", value: "water" }, { label: "الصحة", value: "medical" }] }] }]
    },
    {
        type: "destekol_achievements", label: "Destekol — إنجازاتنا", description: "أرقام الإنجازات مع الأيقونات والتمويج", icon: "bar-chart", category: "content",
        defaultProps: { title: "", items: [] },
        fields: [{ key: "title", label: "اسم القسم", type: "text" }, { key: "items", label: "الإنجازات", type: "list", itemFields: [{ key: "title", label: "العنوان", type: "text" }, { key: "value", label: "الرقم (مثال 20+)", type: "text" }, { key: "icon", label: "الأيقونة", type: "select", options: [{ label: "الدول", value: "globe" }, { label: "المستفيدون", value: "users" }, { label: "التطوع", value: "heart" }, { label: "المشاريع", value: "projects" }] }, { key: "image", label: "صورة أيقونة اختيارية", type: "image" }] }]
    },
    {
        type: "quick_donate", label: "Destekol — التبرع السريع", description: "التبرع لمرة واحدة أو شهرياً", icon: "heart", category: "fundraising",
        defaultProps: { amounts: [] },
        fields: [{ key: "defaultAmount", label: "المبلغ المحدد مبدئيًا", type: "number" }, { key: "amounts", label: "المبالغ المقترحة بالدولار", type: "list", itemFields: [{ key: "value", label: "المبلغ", type: "number" }] }]
    },
    {
        type: "hero",
        label: "Hero Slider",
        description: "Full-width image slider with text and CTA buttons",
        icon: "home",
        category: "layout",
        defaultProps: {
            overlayOpacity: "0.45",
            slides: [
                {
                    title: "معاً نصنع الأمل",
                    subtitle: "منصة تبرعات شفافة وآمنة لدعم الأسر المحتاجة حول العالم.",
                    backgroundImage: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1600&auto=format&fit=crop",
                    buttonText: "تبرع الآن",
                    buttonLink: "/donate"
                },
                {
                    title: "يدٌ تمتد لكل محتاج",
                    subtitle: "تبرعك يصل مباشرة للمستحقين دون وسيط بشفافية كاملة.",
                    backgroundImage: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1920&q=80",
                    buttonText: "تصفح الحملات",
                    buttonLink: "/campaigns"
                },
                {
                    title: "كل درهم يغير حياة",
                    subtitle: "من الغذاء والمأوى إلى التعليم والرعاية الصحية — معك نصنع الفرق.",
                    backgroundImage: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1920&q=80",
                    buttonText: "تبرع الآن",
                    buttonLink: "/donate"
                }
            ]
        },
        fields: [
            { key: "eyebrow", label: "النص أعلى العنوان", type: "text" },
            { key: "badgeText", label: "عبارة شارة السلايدر", type: "text" },
            {
                key: "slides",
                label: "Slider Images",
                type: "list",
                itemFields: [
                    { key: "title", label: "Headline", type: "text", placeholder: "Main hero title" },
                    { key: "subtitle", label: "Subheading", type: "textarea", placeholder: "Supporting description text" },
                    { key: "buttonText", label: "Button Label", type: "text" },
                    { key: "buttonLink", label: "Campaign Donation URL", type: "text", hint: "Enter the donation link for this slide’s campaign. The donation button stays visible but is disabled until a link is entered." },
                    { key: "backgroundImage", label: "Background Image", type: "image", hint: "Use high-res image (1920×1080 recommended)" }
                ]
            }
        ],
    },
    {
        type: "about_overview",
        label: "About Overview",
        description: "Foundation cards (Establishment, Vision, Mission, Leadership)",
        icon: "globe",
        category: "content",
        defaultProps: {
            heading_ar: "مؤسسة Destekol الإنسانية",
            heading_en: "Destekol Charitable Non-Profit Association",
            quote_ar: "سيكون هدفنا ورسالتنا السعي جاهدين لجعل هذا العمل الإنساني قائماً على البُعد الإنساني المحض",
            quote_en: "Our goal and mission is to strive towards making this relief work purely driven by human dignity",
            cards: [
                {
                    title_ar: "التأسيس",
                    title_en: "Establishment",
                    desc_ar: "تأسست المؤسسة لتكون جسراً إنسانياً موثوقاً يوصل المساعدات الإغاثية والمالية لمستحقيها ببالغ الشفافية والسرعة.",
                    desc_en: "Founded to serve as a trusted bridge delivering relief and financial aid with maximum transparency.",
                    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=600",
                    icon: "globe"
                },
                {
                    title_ar: "رؤيتنا",
                    title_en: "Our Vision",
                    desc_ar: "أن نكون المنصة الإنسانية الأكثر أثرًا وشفافية في تقديم الإغاثة والتمكين المستدام للمجتمعات المتضررة حول العالم.",
                    desc_en: "To be the most impactful and transparent humanitarian platform providing sustainable empowerment worldwide.",
                    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=600",
                    icon: "check"
                },
                {
                    title_ar: "رسالتنا",
                    title_en: "Our Mission",
                    desc_ar: "التنظيم والتمكين والإشراف المباشر على الحملات الإغاثية من خلال عمل مؤسسي متميز يتوافق مع أعلى المعايير الدولية.",
                    desc_en: "Directing, organizing, and supervising relief campaigns through excellent institutional work.",
                    image: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?q=80&w=600",
                    icon: "mail"
                },
                {
                    title_ar: "إدارة المؤسسة",
                    title_en: "Leadership",
                    desc_ar: "فريق عمل متخصص ونخبة من الاستشاريين والمشرفين الميدانيين لضمان وصول كل دولار لتغطية الاحتياجات الفعلية.",
                    desc_en: "A dedicated team of experts and field supervisors ensuring every donation covers actual needs directly.",
                    image: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=600",
                    icon: "settings"
                }
            ]
        },
        fields: [
            { key: "heading_ar", label: "Main Heading (Arabic)", type: "text" },
            { key: "heading_en", label: "Main Heading (English)", type: "text" },
            { key: "heading_fr", label: "Main Heading (French)", type: "text" },
            { key: "heading_tr", label: "Main Heading (Turkish)", type: "text" },
            { key: "quote_ar", label: "Quote Message (Arabic)", type: "textarea" },
            { key: "quote_en", label: "Quote Message (English)", type: "textarea" },
            { key: "quote_fr", label: "Quote Message (French)", type: "textarea" },
            { key: "quote_tr", label: "Quote Message (Turkish)", type: "textarea" },
            {
                key: "cards",
                label: "Cards List",
                type: "list",
                itemFields: [
                    { key: "title_ar", label: "Card Title (Arabic)", type: "text" },
                    { key: "title_en", label: "Card Title (English)", type: "text" },
            { key: "title_fr", label: "Card Title (French)", type: "text" },
            { key: "title_tr", label: "Card Title (Turkish)", type: "text" },
                    { key: "desc_ar", label: "Description (Arabic)", type: "textarea" },
                    { key: "desc_en", label: "Description (English)", type: "textarea" },
            { key: "desc_fr", label: "Description (French)", type: "textarea" },
            { key: "desc_tr", label: "Description (Turkish)", type: "textarea" },
                    { key: "image", label: "Card Photo", type: "image" }
                ]
            }
        ]
    },
    {
        type: "our_work",
        label: "مجالات عملنا (Sectors)",
        description: "تغطية كافة قطاعات العمل الإنساني والتنمية المستدامة",
        icon: "layers",
        category: "content",
        defaultProps: {
            eyebrow: "مجالات عملنا",
            title: "من الاستجابة العاجلة إلى الحلول التنموية المستدامة",
            subtitle: "نستجيب اليوم للاحتياجات الطارئة للمتضررين من الأزمات والكوارث، ونؤسس معهم غداً لبيئة تمكينية تساعدهم على استعادة كرامتهم وإعادة بناء مستقبلهم.",
            items: [
                {
                    title: "الغذاء العاجل والاحتياجات الأساسية",
                    description: "تقديم السلال الغذائية والوجبات الساخنة للأسر الأكثر هشاشة في بؤر النزوح والفقر.",
                    icon: "utensils"
                },
                {
                    title: "المأوى ودعم الحياة العاجل",
                    description: "توفير الخيام العازلة، تجهيزات التدفئة، والمستلزمات المعيشية الطارئة للعائلات المتضررة.",
                    icon: "home"
                },
                {
                    title: "الصحة والمساعدة الطبية",
                    description: "إمداد النقاط الطبية بالأدوية والمستلزمات، ودعم رعاية المرضى والجرحى في المناطق الحرجة.",
                    icon: "heart-pulse"
                },
                {
                    title: "المياه النظيفة والنظافة الصحية (WASH)",
                    description: "نقل مياه الشرب المعقمة عبر الصهاريج، وإنشاء وحدات التنقية والإصحاح البيئي.",
                    icon: "droplet"
                },
                {
                    title: "الأمن الغذائي والزراعة المستدامة",
                    description: "دعم المشاريع الزراعية المصغرة والمطابخ المجتمعية لتوفير مصادر غذاء دائم.",
                    icon: "sprout"
                },
                {
                    title: "سبل العيش والتمكين الاقتصادي",
                    description: "تمويل المشاريع الصغيرة وتدريب الأفراد على مهن إنتاجية تحقق لهم الاستقلال المالي.",
                    icon: "briefcase"
                },
                {
                    title: "تمكين المرأة",
                    description: "إطلاق برامج تدريبية وإنتاجية تعزز دور المرأة القيادي والاقتصادي داخل معيل الأسرة.",
                    icon: "user-check"
                },
                {
                    title: "حماية الطفل",
                    description: "توفير بيئات آمنة للأطفال في مناطق النزوح وحمايتهم من الاستغلال والإهمال.",
                    icon: "shield"
                },
                {
                    title: "الدعم النفسي والاجتماعي",
                    description: "تقديم جلسات الدعم النفسي وتجاوز الصدمات للأطفال والنساء المتأثرين بالحروب.",
                    icon: "smile"
                },
                {
                    title: "برنامج دعم التعليم",
                    description: "توزيع الحقائب المدرسية وتأمين مساحات تعليمية بديلة للأطفال الانقطاع عن الدراسة.",
                    icon: "book-open"
                },
                {
                    title: "الطاقة المتجددة",
                    description: "تزويد المرافق الإغاثية ومحطات المياه بأنظمة الطاقة الشمسية لضمان استمرارية الخدمات.",
                    icon: "sun"
                },
                {
                    title: "الشراكات المحلية وبناء القدرات",
                    description: "التنسيق المباشر مع المنظمات الميدانية لتطوير آليات الاستجابة وتأهيل الكوادر.",
                    icon: "users"
                }
            ]
        },
        fields: [
            { key: "eyebrow", label: "Eyebrow Text / Tag", type: "text" },
            { key: "title", label: "Section Title", type: "text" },
            { key: "subtitle", label: "Section Subtitle", type: "textarea" },
            {
                key: "items",
                label: "Sectors List",
                type: "list",
                itemFields: [
                    { key: "title", label: "Sector Title", type: "text" },
                    { key: "description", label: "Sector Description", type: "textarea" },
                    { key: "icon", label: "Icon Name", type: "text" }
                ]
            }
        ]
    },
    {
        type: "projects",
        label: "مشاريعنا الميدانية (Projects)",
        description: "عرض كروت المشاريع التنفيذية مع الصور والتفاصيل والحالة",
        icon: "layers",
        category: "fundraising",
        defaultProps: {
            eyebrow: "مشاريعنا الميدانية",
            title: "نُحوّل العطاء إلى أثرٍ تنموي ملموس",
            subtitle: "أعدّت محفظة مشاريعنا الاستراتيجية لتلبية الاحتياجات الأساسية وإعادة بناء المجتمعات المتأثرة بالأزمات بكرامة وشفافية.",
            pageSize: 8,
            items: [
                {
                    title: "مشروع صهاريج مياه الشرب المعقمة",
                    category: "الإصحاح المائي (WASH)",
                    icon: "droplet",
                    location: "المناطق الحرجة والبؤر الأشد احتياجاً",
                    status: "قيد التنفيذ المستمر",
                    image: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=800&q=80",
                    description: "نقل وتوزيع آلاف اللترات من مياه الشرب المعقمة يومياً على الأسر النازحة للوقاية من تلوث المياه والأمراض.",
                    buttonText: "استعرض تفاصيل المشروع",
                    buttonLink: "/campaigns"
                },
                {
                    title: "المخبز الآلي المجتمعي للوجبات اليومية",
                    category: "الأمن الغذائي",
                    icon: "utensils",
                    location: "المناطق الحرجة والبؤر الأشد احتياجاً",
                    status: "استجابة عاجلة",
                    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80",
                    description: "تشغيل مخبز مجتمعي لإنتاج وتوزيع ربطات الخبز الطازج مجاناً للأسر التي تعاني من المجاعة والجوع الحاد.",
                    buttonText: "استعرض تفاصيل المشروع",
                    buttonLink: "/campaigns"
                },
                {
                    title: "النقاط الطبية والمستشفيات الميدانية",
                    category: "الرعاية الصحية",
                    icon: "heart-pulse",
                    location: "المناطق الحرجة والبؤر الأشد احتياجاً",
                    status: "دعم مباشر",
                    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
                    description: "تزويد المراكز الصحية والأطباء بالمستلزمات والأدوية الطبية العاجلة لإسعاف الجرحى وتأمين الرعاية.",
                    buttonText: "استعرض تفاصيل المشروع",
                    buttonLink: "/campaigns"
                }
            ]
        },
        fields: [
            { key: "eyebrow", label: "Eyebrow Text / Tag", type: "text" },
            { key: "title", label: "Section Title", type: "text" },
            { key: "subtitle", label: "Section Subtitle", type: "textarea" },
            { key: "pageSize", label: "Projects per Page", type: "number" },
            {
                key: "items",
                label: "Projects List",
                type: "list",
                itemFields: [
                    { key: "title", label: "Project Title", type: "text" },
                    { key: "category", label: "Category", type: "text" },
                    { key: "icon", label: "Category Icon", type: "select", options: [
                            { label: "Food", value: "utensils" },
                            { label: "Water", value: "droplet" },
                            { label: "Health", value: "heart-pulse" },
                            { label: "Education", value: "book-open" },
                            { label: "Shelter", value: "home" },
                            { label: "Community", value: "hand-heart" },
                        ] },
                    { key: "location", label: "Location", type: "text" },
                    { key: "status", label: "Status Badge", type: "text" },
                    { key: "image", label: "Project Image", type: "image" },
                    { key: "description", label: "Description", type: "textarea" },
                    { key: "buttonText", label: "Button Label", type: "text" },
                    { key: "buttonLink", label: "Button Link", type: "text" }
                ]
            }
        ]
    },
    {
        type: "stats",
        label: "Statistics",
        description: "Display key numbers and impact metrics",
        icon: "bar-chart",
        category: "content",
        defaultProps: {
            title: "Our Impact So Far",
            items: [
                { title: "Total Raised", value: "$482,300" },
                { title: "Donors", value: "12,540" },
                { title: "Active Campaigns", value: "8" },
                { title: "Families Supported", value: "3,210" },
            ],
        },
        fields: [
            { key: "title", label: "Section Title", type: "text" },
            {
                key: "items", label: "Statistics", type: "list",
                itemFields: [
                    { key: "title", label: "Label", type: "text" },
                    { key: "value", label: "Value", type: "text" },
                ],
            },
        ],
    },
    {
        type: "text",
        label: "Text Block",
        description: "Rich text paragraph with optional title",
        icon: "file-text",
        category: "content",
        defaultProps: {
            title: "About Us",
            body: "We are an independent donation platform dedicated to supporting affected families in crisis zones through secure and transparent donation channels.",
            align: "right",
        },
        fields: [
            { key: "title", label: "Title", type: "text" },
            { key: "body", label: "Body Text", type: "textarea" },
            { key: "image", label: "Optional Image", type: "image" },
            { key: "imagePosition", label: "Image Position", type: "select", options: [{ label: "Left", value: "left" }, { label: "Right", value: "right" }] },
            {
                key: "align", label: "Text Alignment", type: "select",
                options: [
                    { label: "Right (RTL)", value: "right" },
                    { label: "Left (LTR)", value: "left" },
                    { label: "Center", value: "center" },
                ],
            },
        ],
    },
    {
        type: "image_text",
        label: "Image + Text",
        description: "Side-by-side image and text layout",
        icon: "image",
        category: "layout",
        defaultProps: {
            title: "How Your Donation Is Used",
            body: "Donations go directly to food baskets, clean water, essential medicines, and tents for displaced families — in coordination with humanitarian organizations on the ground.",
            image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1200&auto=format&fit=crop",
            imagePosition: "left",
        },
        fields: [
            { key: "title", label: "Title", type: "text" },
            { key: "body", label: "Body Text", type: "textarea" },
            { key: "image", label: "Image", type: "image" },
            {
                key: "imagePosition", label: "Image Position", type: "select",
                options: [
                    { label: "Left", value: "left" },
                    { label: "Right", value: "right" },
                ],
            },
        ],
    },
    {
        type: "donation_buttons",
        label: "Quick Donate Widget",
        description: "Preset amount buttons with custom donation option",
        icon: "heart",
        category: "fundraising",
        defaultProps: {
            title: "Donate Now",
            subtitle: "Choose an amount or enter a custom one",
            amounts: [],
            defaultAmount: 0,
            campaignId: "",
            allowMonthly: true,
        },
        fields: [
            { key: "title", label: "Title", type: "text" },
            { key: "subtitle", label: "Subtitle", type: "text" },
            { key: "allowMonthly", label: "Allow Monthly Recurring", type: "boolean" },
            { key: "defaultAmount", label: "Default Donation Amount", type: "number" },
            { key: "amounts", label: "Suggested Donation Amounts", type: "list", itemFields: [{ key: "value", label: "Amount", type: "number" }] },
            { key: "trustItems", label: "Information Labels", type: "list", itemFields: [{ key: "icon", label: "Icon", type: "text" }, { key: "title", label: "Label", type: "text" }] },
        ],
    },
    {
        type: "campaigns_grid",
        label: "Campaigns Grid",
        description: "Display active campaigns in a responsive grid",
        icon: "layout-grid",
        category: "fundraising",
        defaultProps: {
            title: "Active Campaigns",
            subtitle: "Choose a campaign and make a difference",
            limit: 6,
            onlyFeatured: false,
        },
        fields: [
            { key: "eyebrow", label: "Section Label", type: "text" },
            { key: "title", label: "Title", type: "text" },
            { key: "subtitle", label: "Subtitle", type: "text" },
            { key: "limit", label: "Max Campaigns to Show", type: "number" },
            { key: "onlyFeatured", label: "Featured Campaigns Only", type: "boolean" },
        ],
    },
    {
        type: "gallery",
        label: "Photo & Video Gallery",
        description: "Display a collection of photos and videos",
        icon: "image",
        category: "media",
        defaultProps: {
            title: "معرض الصور والفيديوهات",
            items: [
                { url: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=800", type: "image" },
                { url: "https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?q=80&w=800", type: "image" },
                { url: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=800", type: "image" },
            ],
        },
        fields: [
            { key: "title", label: "Section Title", type: "text" },
            {
                key: "items",
                label: "Media Items (Photos & Videos)",
                type: "list",
                itemFields: [
                    { key: "url", label: "Upload Image/Video or Paste Link", type: "image" },
                    { key: "caption", label: "Caption / Description (Optional)", type: "text" }
                ],
            },
        ],
    },
    {
        type: "stories",
        label: "Success Stories",
        description: "Testimonials and impact stories from beneficiaries",
        icon: "message-square",
        category: "social",
        defaultProps: {
            title: "A story from the field",
            subtitle: "Real stories. Real change.",
            items: [
                {
                    title: "The Abu Yousef Family",
                    body: "Thanks to your donations, the Abu Yousef family received a food basket and clean water supply for over two weeks.",
                    image: "https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?q=80&w=600",
                    videoUrl: "",
                    buttonText: "Support this story",
                    buttonLink: "/donate?story=abu-yousef-family",
                },
                {
                    title: "Mobile Medical Clinic",
                    body: "A mobile clinic was equipped with essential medical supplies to serve more than 500 families monthly.",
                    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=600",
                    videoUrl: "",
                    buttonText: "Support this story",
                    buttonLink: "/donate?story=mobile-medical-clinic",
                },
            ],
        },
        fields: [
            { key: "title", label: "Section Title", type: "text" },
            { key: "subtitle", label: "Section Eyebrow / الوصف القصير", type: "text" },
            { key: "storyEyebrow", label: "Story Kicker / العبارة فوق نص القصة", type: "text" },
            { key: "readButtonText", label: "Read Story Button Label / نص زر قراءة القصة", type: "text" },
            {
                key: "items", label: "Stories", type: "list",
                itemFields: [
                    { key: "title", label: "Name / Title", type: "text" },
                    { key: "body", label: "Story Text", type: "textarea" },
                    { key: "image", label: "Cover Photo", type: "image" },
                    { key: "videoUrl", label: "Upload Video / Video URL", type: "image", hint: "Upload an MP4 video or paste URL" },
                    { key: "storyUrl", label: "Story Details URL / رابط قراءة القصة", type: "text", hint: "Optional link to the full story. The donation button has its own URL below." },
                    { key: "eyebrow", label: "Story Kicker / عبارة القصة", type: "text" },
                    { key: "readButtonText", label: "Read Story Button Label / نص زر قراءة القصة", type: "text" },
                    { key: "campaignId", label: "Related Donation Campaign / الحملة المرتبطة بالتبرع", type: "campaign", hint: "Selecting a campaign makes this story’s donation button open a campaign-linked donation form." },
                    { key: "buttonText", label: "Donation Button Label / نص زر التبرع", type: "text" },
                    { key: "buttonLink", label: "Story Donation URL / رابط التبرع الخاص بالقصة", type: "text", hint: "Each story has its own donation URL. Set a campaign page or donation page path; a unique donation URL is generated automatically if left empty." },
                ],
            },
        ],
    },
    {
        type: "faq",
        label: "FAQ",
        description: "Frequently asked questions with accordion answers",
        icon: "help-circle",
        category: "content",
        defaultProps: {
            title: "Frequently Asked Questions",
            items: [
                { title: "Are my donations secure?", body: "Yes, we use world-class payment gateways including Stripe and PayPal to fully secure your financial information." },
                { title: "Will I get a donation receipt?", body: "Yes, an electronic receipt is automatically sent to your email immediately after your donation is completed." },
                { title: "How are donations used?", body: "Visit our Financial Transparency page for a detailed breakdown of how donations are distributed across projects." },
            ],
        },
        fields: [
            { key: "title", label: "Section Title", type: "text" },
            {
                key: "items", label: "Questions", type: "list",
                itemFields: [
                    { key: "title", label: "Question", type: "text" },
                    { key: "body", label: "Answer", type: "textarea" },
                ],
            },
        ],
    },
    {
        type: "cta",
        label: "Call to Action",
        description: "High-impact banner with a single CTA button",
        icon: "megaphone",
        category: "layout",
        defaultProps: {
            title: "Every Minute of Delay Costs a Life",
            subtitle: "Contribute now and be part of the solution",
            buttonText: "Donate Now",
            buttonLink: "/donate",
            image: "",
            imageAlt: "",
            style: "brand",
        },
        fields: [
            { key: "title", label: "Headline", type: "text" },
            { key: "subtitle", label: "Subheading", type: "text" },
            { key: "buttonText", label: "Button Label", type: "text" },
            { key: "buttonLink", label: "Button URL", type: "text" },
            { key: "image", label: "Optional Illustration", type: "image" },
            { key: "imageAlt", label: "Illustration Description", type: "text" },
            {
                key: "style", label: "Background Style", type: "select",
                options: [
                    { label: "Brand Blue", value: "brand" },
                    { label: "Gold / Premium", value: "gold" },
                    { label: "Beige / Soft", value: "beige" },
                ],
            },
        ],
    },
    {
        type: "contact_form",
        label: "Contact Form",
        description: "Embedded contact form with email delivery",
        icon: "mail",
        category: "social",
        defaultProps: {
            title: "Contact Us",
            subtitle: "We welcome your questions and inquiries",
            email: "info@destekol.org",
        },
        fields: [
            { key: "title", label: "Title", type: "text" },
            { key: "subtitle", label: "Subtitle", type: "text" },
            { key: "email", label: "Recipient Email", type: "text" },
            { key: "address", label: "عنوان الجمعية (يظهر أيضًا في الفوتر)", type: "textarea" },
            { key: "registrationNumber", label: "رقم التسجيل (يظهر أيضًا في الفوتر)", type: "text" },
            { key: "verificationUrl", label: "رابط التحقق من التسجيل", type: "text" },
            { key: "locality", label: "المدينة", type: "text" },
            { key: "country", label: "الدولة", type: "text" },
            { key: "notice", label: "تنويه صفحة التواصل", type: "textarea" },
            { key: "contactSummary", label: "وصف بطاقات التواصل", type: "textarea" },
            { key: "image", label: "Destekol — صورة بجانب نموذج التواصل", type: "image" },
            { key: "imageAlt", label: "وصف الصورة", type: "text" },
            { key: "contactHeading", label: "Destekol — عنوان بطاقات التواصل (اختياري)", type: "text" },
        ],
    },
    {
        type: "newsletter",
        label: "Newsletter Signup",
        description: "Email subscription form with custom messaging",
        icon: "mail",
        category: "social",
        defaultProps: {
            title: "Kindness continues with you",
            subtitle: "Get the latest news about our projects and activities in your inbox.",
            buttonText: "Subscribe",
            placeholder: "Your email address",
            successText: "Subscribed",
        },
        fields: [
            { key: "title", label: "Title", type: "text" },
            { key: "subtitle", label: "Subtitle", type: "text" },
            { key: "buttonText", label: "Subscribe Button Label", type: "text" },
            { key: "placeholder", label: "Email Placeholder", type: "text" },
            { key: "successText", label: "Success Message", type: "text" },
        ],
    },
    {
        type: "full_image",
        label: "Full Width Image",
        description: "Display an image at full page width",
        icon: "image",
        category: "media",
        defaultProps: {
            src: "",
            alt: "",
            caption: "",
            maxHeight: "600",
        },
        fields: [
            { key: "src", label: "Image", type: "image" },
            { key: "alt", label: "Alt Text", type: "text" },
            { key: "caption", label: "Caption (optional)", type: "text" },
            { key: "maxHeight", label: "Max Height (px)", type: "number" },
        ],
    },
    {
        type: "spacer",
        label: "Spacer / Divider",
        description: "Add vertical spacing between sections",
        icon: "minus",
        category: "layout",
        defaultProps: { height: "48" },
        fields: [{ key: "height", label: "Height (px)", type: "number" }],
    },
    {
        type: "chat_widget",
        label: "المساعد الذكي (AI Chatbot)",
        description: "نافذة محادثة عائمة تجيب على استفسارات المتبرعين ذكائياً",
        icon: "message-square",
        category: "social",
        defaultProps: {
            title: "المساعد الذكي — Destekol",
        },
        fields: [
            { key: "title", label: "عنوان النافذة", type: "text" },
        ],
    },
];
export const BLOCK_CATEGORIES = [
    { id: "all", label: "All Blocks" },
    { id: "layout", label: "Layout" },
    { id: "content", label: "Content" },
    { id: "fundraising", label: "Fundraising" },
    { id: "media", label: "Media" },
    { id: "social", label: "Social" },
];
export function getBlockDefinition(type: string) {
    return BLOCK_DEFINITIONS.find((b) => b.type === type);
}
export function createSection(type: string): PageSection {
    const def = getBlockDefinition(type);
    return {
        id: crypto.randomUUID(),
        type,
        props: def ? structuredClone(def.defaultProps) : {},
    };
}
