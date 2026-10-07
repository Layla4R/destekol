// Generates a single SQL file with INSERT statements for:
// - SiteSettings (default row)
// - Campaigns (5 demo campaigns)
// - Pages (home, about, transparency, contact, privacy)
// - NewsPost (2 posts)
// - User (one ADMIN account, password from ADMIN_EMAIL / ADMIN_PASSWORD env vars)
//
// Usage:
//   ADMIN_EMAIL=admin@destekol.org ADMIN_PASSWORD=yourpassword npx tsx scripts/export-seed-sql.ts > supabase/seed.sql
import bcrypt from "bcryptjs";
import { createSection,PageSection } from "../lib/blocks";
function section(type: string, overrides: Record<string, any> = {}): PageSection {
    const s = createSection(type);
    s.props = { ...s.props, ...overrides };
    return s;
}
// ---- SQL helpers ----
function sqlString(value: string | null | undefined): string {
    if (value === null || value === undefined)
        return "NULL";
    return `'${value.replace(/'/g, "''")}'`;
}
function sqlBool(value: boolean): string {
    return value ? "true" : "false";
}
function sqlJson(value: any): string {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
}
function sqlNumber(value: number | string): string {
    return String(value);
}
async function main() {
    const lines: string[] = [];
    lines.push("-- ============================================================");
    lines.push("-- Destekol Charitable Non-Profit Association — Seed Data");
    lines.push("-- Run this AFTER supabase/schema.sql in Supabase SQL Editor.");
    lines.push("-- ============================================================");
    lines.push("");
    // --------------------------------------------------------
    // Site settings
    // --------------------------------------------------------
    lines.push("-- Site settings");
    lines.push(`INSERT INTO "SiteSettings" ("id", "siteName", "logoText", "logoImage", "primaryColor", "accentColor", "contactEmail", "updatedAt")
VALUES ('default', ${sqlString("Destekol Charitable Non-Profit Association")}, ${sqlString("Destekol")}, ${sqlString("/brand/logo-horizontal-transparent.png")}, ${sqlString("#0069D2")}, ${sqlString("#F00F5A")}, ${sqlString("info@destekol.org")}, now())
ON CONFLICT ("id") DO NOTHING;`);
    lines.push("");
    // --------------------------------------------------------
    // Campaigns
    // --------------------------------------------------------
    const campaignsData = [
        {
            slug: "emergency-food-aid",
            title: "سلال غذائية طارئة للعائلات المحتاجة",
            summary: "توفير سلال غذائية أساسية تكفي أسرة لمدة أسبوعين.",
            description: "تهدف هذه الحملة إلى توفير سلال غذائية طارئة تحتوي على الأرز، الدقيق، الزيت، والمعلبات للعائلات الأكثر احتياجاً. كل سلة تكفي أسرة من 5 أفراد لمدة أسبوعين كاملين، ويتم توزيعها بالتعاون مع شركاء محليين موثوقين لضمان وصولها لمن يحتاجها فعلاً.",
            category: "food",
            coverImage: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1200&auto=format&fit=crop",
            goalAmount: 50000,
            raisedAmount: 32450,
            donorCount: 842,
            isFeatured: true,
        },
        {
            slug: "medical-supplies",
            title: "إمدادات طبية للمستشفيات الميدانية",
            summary: "تجهيز العيادات الميدانية بالأدوية والمعدات الأساسية.",
            description: "نظراً للنقص الحاد في المستلزمات الطبية، تهدف هذه الحملة لتوفير الأدوية الأساسية، أدوات التعقيم، والمعدات الطبية الأولية للعيادات الميدانية والمستشفيات المتضررة. تساهم تبرعاتكم في إنقاذ حياة المرضى والجرحى يومياً.",
            category: "medical",
            coverImage: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1200&auto=format&fit=crop",
            goalAmount: 75000,
            raisedAmount: 41200,
            donorCount: 1103,
            isFeatured: true,
        },
        {
            slug: "winter-shelter",
            title: "خيام ومستلزمات شتوية للنازحين",
            summary: "توفير خيام معزولة وأغطية شتوية للعائلات النازحة.",
            description: "مع اقتراب فصل الشتاء، آلاف العائلات النازحة بحاجة عاجلة لخيام معزولة، أغطية، وبطانيات صوفية. تساهم هذه الحملة في توفير الحماية من البرد القارس لأكثر من 1,000 عائلة في مختلف مناطق القطاع.",
            category: "shelter",
            coverImage: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200&auto=format&fit=crop",
            goalAmount: 60000,
            raisedAmount: 18900,
            donorCount: 511,
            isFeatured: true,
        },
        {
            slug: "clean-water-access",
            title: "مياه شرب نقية ومحطات تحلية",
            summary: "دعم محطات تحلية المياه لتوفير مياه شرب آمنة.",
            description: "تساهم هذه الحملة في تشغيل وصيانة محطات تحلية المياه، وتوزيع مياه الشرب النقية على العائلات في المناطق التي تفتقر إلى مصادر مياه آمنة، للحد من انتشار الأمراض المرتبطة بالمياه الملوثة.",
            category: "water",
            coverImage: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=1200&auto=format&fit=crop",
            goalAmount: 40000,
            raisedAmount: 9800,
            donorCount: 276,
            isFeatured: false,
        },
        {
            slug: "education-support",
            title: "دعم تعليم الأطفال النازحين",
            summary: "توفير مستلزمات تعليمية وفصول مؤقتة للأطفال.",
            description: "حرماً من التعليم بسبب النزوح، يحتاج آلاف الأطفال إلى بيئة تعليمية آمنة. تساهم هذه الحملة في توفير الكتب، القرطاسية، وإنشاء فصول دراسية مؤقتة لمساعدة الأطفال على مواصلة تعليمهم.",
            category: "education",
            coverImage: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=1200&auto=format&fit=crop",
            goalAmount: 35000,
            raisedAmount: 6200,
            donorCount: 189,
            isFeatured: false,
        },
    ];
    lines.push("-- Campaigns");
    for (const c of campaignsData) {
        lines.push(`INSERT INTO "Campaign" ("slug", "title", "summary", "description", "category", "coverImage", "goalAmount", "raisedAmount", "donorCount", "isActive", "isFeatured", "updatedAt")
VALUES (${sqlString(c.slug)}, ${sqlString(c.title)}, ${sqlString(c.summary)}, ${sqlString(c.description)}, ${sqlString(c.category)}, ${sqlString(c.coverImage)}, ${sqlNumber(c.goalAmount)}, ${sqlNumber(c.raisedAmount)}, ${c.donorCount}, true, ${sqlBool(c.isFeatured)}, now())
ON CONFLICT ("slug") DO NOTHING;`);
    }
    lines.push("");
    // --------------------------------------------------------
    // Pages
    // --------------------------------------------------------
    const homeSections: PageSection[] = [
        section("hero", {
            title: "معاً نصنع الأمل للإنسانية",
            subtitle: "منصة تبرعات شفافة وآمنة لدعم العائلات المحتاجة حول العالم بالغذاء، الدواء، والمأوى. كل تبرع — كبيراً أو صغيراً — يصل مباشرة لمن يحتاجه.",
            buttonText: "تبرع الآن",
            buttonLink: "/donate",
            backgroundImage: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1600&auto=format&fit=crop",
            overlayOpacity: "0.5",
        }),
        section("stats", {
            title: "أثرنا حتى الآن",
            items: [
                { title: "إجمالي التبرعات", value: "$482,300" },
                { title: "عدد المتبرعين", value: "12,540" },
                { title: "الحملات النشطة", value: "5" },
                { title: "أسر تم دعمها", value: "3,210" },
            ],
        }),
        section("campaigns_grid", {
            title: "الحملات النشطة",
            subtitle: "اختر حملة وساهم في صنع فرق حقيقي اليوم",
            limit: 6,
            onlyFeatured: false,
        }),
        section("image_text", {
            title: "كيف يُستخدم تبرعك؟",
            body: "نعمل مع شركاء محليين موثوقين على الأرض لضمان وصول كل دولار تتبرع به إلى من يحتاجه فعلاً. يتم توجيه التبرعات مباشرة لتوفير سلال غذائية، مياه شرب نقية، أدوية أساسية، وخيام للعائلات النازحة — مع تقارير شفافية دورية حول كيفية إنفاق الأموال.",
            image: "https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?q=80&w=1200&auto=format&fit=crop",
            imagePosition: "left",
        }),
        section("stories", {
            title: "قصص الأثر الإنساني",
            items: [
                {
                    title: "عائلة أبو يوسف",
                    body: "بفضل تبرعاتكم، تمكنت عائلة أبو يوسف من الحصول على سلة غذائية ومياه نقية لأكثر من أسبوعين متتاليين.",
                    image: "https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?q=80&w=600&auto=format&fit=crop",
                },
                {
                    title: "عيادة طبية متنقلة",
                    body: "تم تجهيز عيادة متنقلة بمعدات طبية أساسية لخدمة أكثر من 500 عائلة شهرياً في مناطق النزوح.",
                    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=600&auto=format&fit=crop",
                },
            ],
        }),
        section("donation_buttons", {
            title: "تبرع الآن",
            subtitle: "اختر المبلغ الذي يناسبك، أو أدخل مبلغاً مخصصاً",
            amounts: [1, 5, 10, 25, 50, 100],
            allowMonthly: true,
        }),
        section("faq", {
            title: "الأسئلة الشائعة",
            items: [
                { title: "هل تبرعاتي آمنة؟", body: "التبرع الإلكتروني غير متاح حاليًا. سنعلن قناة الدفع الرسمية عند جاهزيتها." },
                { title: "هل أحصل على إيصال بالتبرع؟", body: "نعم، يتم إرسال إيصال إلكتروني تلقائياً إلى بريدك الإلكتروني بعد إتمام التبرع مباشرة." },
                { title: "كيف تُستخدم التبرعات؟", body: "يمكنك مراجعة صفحة الشفافية المالية لمعرفة تفاصيل توزيع التبرعات على المشاريع المختلفة." },
            ],
        }),
        section("newsletter", {
            title: "اشترك في نشرتنا البريدية",
            subtitle: "كن أول من يعلم بآخر التحديثات والحملات الجديدة",
        }),
    ];
    const aboutSections: PageSection[] = [
        section("text", {
            title: "من نحن",
            body: "Destekol Charitable Non-Profit Association هي منصة تبرعات مستقلة تأسست بهدف توفير قناة آمنة وشفافة لدعم العائلات المحتاجة حول العالم. نعمل مع شبكة من الشركاء المحليين الموثوقين لضمان وصول المساعدات إلى من يحتاجها بأسرع وقت وبأقل التكاليف الإدارية.\n\nرؤيتنا هي بناء جسر من التضامن الإنساني يربط المتبرعين حول العالم بالأسر المحتاجة، من خلال تقارير شفافية دورية ومتابعة دقيقة لكل مشروع.",
            align: "right",
        }),
        section("stats", {
            title: "بالأرقام",
            items: [
                { title: "سنوات الخبرة", value: "+3" },
                { title: "شركاء محليون", value: "12" },
                { title: "دول المتبرعين", value: "28" },
                { title: "نسبة الإدارة", value: "أقل من 5%" },
            ],
        }),
        section("cta", {
            title: "كن جزءاً من القصة",
            subtitle: "تبرعك اليوم يصنع فرقاً حقيقياً في حياة عائلة كاملة",
            buttonText: "تبرع الآن",
            buttonLink: "/donate",
            style: "brand",
        }),
    ];
    const transparencySections: PageSection[] = [
        section("text", {
            title: "الشفافية المالية",
            body: "نلتزم بأعلى معايير الشفافية في إدارة التبرعات. يتم نشر تقرير دوري يوضح إجمالي التبرعات الواردة، وتوزيعها على المشاريع المختلفة، بالإضافة إلى النسب الإدارية والتشغيلية.\n\nأقل من 5% من التبرعات تُستخدم للتكاليف التشغيلية، أما النسبة المتبقية فتُوجه مباشرة للمشاريع الإنسانية على الأرض.",
            align: "right",
        }),
        section("stats", {
            title: "توزيع التبرعات",
            items: [
                { title: "غذاء وإغاثة", value: "45%" },
                { title: "رعاية طبية", value: "30%" },
                { title: "مأوى وشتاء", value: "15%" },
                { title: "تكاليف تشغيلية", value: "5%" },
            ],
        }),
    ];
    const contactSections: PageSection[] = [
        section("contact_form", {
            title: "تواصل معنا",
            subtitle: "نرحب بأسئلتكم واستفساراتكم وملاحظاتكم",
            email: "info@destekol.org",
        }),
    ];
    const privacySections: PageSection[] = [
        section("text", {
            title: "سياسة الخصوصية",
            body: "نحرص على حماية بياناتك الشخصية. لا تتم مشاركة معلومات المتبرعين مع أي طرف ثالث لأغراض تسويقية. عند فتح قنوات التبرع، تُستخدم بيانات المعاملة الضرورية لمعالجة الدفع عبر القناة الرسمية المعلنة.\n\nيمكنك طلب حذف بياناتك في أي وقت عبر التواصل معنا.",
            align: "right",
        }),
    ];
    const pages = [
        {
            slug: "home",
            title: "الرئيسية",
            description: "منصة تبرعات إنسانية شفافة — تبرع الآن وكن جزءاً من الأثر",
            sections: homeSections,
            isPublished: true,
            isSystem: true,
            showInMenu: true,
            order: 0,
        },
        {
            slug: "about",
            title: "من نحن",
            description: "تعرف على منصة Destekol Charitable Non-Profit Association ورؤيتنا الإنسانية",
            sections: aboutSections,
            isPublished: true,
            isSystem: false,
            showInMenu: true,
            order: 1,
        },
        {
            slug: "transparency",
            title: "الشفافية",
            description: "تقارير الشفافية المالية لمنصة Destekol Charitable Non-Profit Association",
            sections: transparencySections,
            isPublished: true,
            isSystem: false,
            showInMenu: true,
            order: 2,
        },
        {
            slug: "contact",
            title: "اتصل بنا",
            description: "تواصل مع فريق Destekol Charitable Non-Profit Association",
            sections: contactSections,
            isPublished: true,
            isSystem: false,
            showInMenu: true,
            order: 3,
        },
        {
            slug: "privacy",
            title: "سياسة الخصوصية",
            description: "سياسة الخصوصية لمنصة Destekol Charitable Non-Profit Association",
            sections: privacySections,
            isPublished: true,
            isSystem: false,
            showInMenu: false,
            order: 4,
        },
    ];
    lines.push("-- Pages");
    for (const p of pages) {
        lines.push(`INSERT INTO "Page" ("slug", "title", "description", "sections", "isPublished", "isSystem", "showInMenu", "order", "updatedAt")
VALUES (${sqlString(p.slug)}, ${sqlString(p.title)}, ${sqlString(p.description)}, ${sqlJson(p.sections)}, ${sqlBool(p.isPublished)}, ${sqlBool(p.isSystem)}, ${sqlBool(p.showInMenu)}, ${p.order}, now())
ON CONFLICT ("slug") DO NOTHING;`);
    }
    lines.push("");
    // --------------------------------------------------------
    // News posts
    // --------------------------------------------------------
    const newsData = [
        {
            slug: "winter-campaign-launch",
            title: "إطلاق حملة الشتاء الطارئة",
            excerpt: "بدأنا حملة جديدة لتوفير الخيام والأغطية الشتوية للعائلات النازحة.",
            body: "مع اقتراب فصل الشتاء، أطلقنا حملة طارئة لتوفير الخيام المعزولة والأغطية الصوفية لأكثر من 1,000 عائلة نازحة. نشكر كل من ساهم حتى الآن، ونحتاج لمزيد من الدعم للوصول إلى هدفنا.",
            coverImage: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200&auto=format&fit=crop",
        },
        {
            slug: "medical-aid-update",
            title: "تحديث: توزيع الإمدادات الطبية",
            excerpt: "تم توزيع أكثر من 5 طن من المستلزمات الطبية على 8 عيادات ميدانية.",
            body: "بفضل تبرعاتكم، تمكنا من توزيع أكثر من 5 طن من الأدوية والمستلزمات الطبية على 8 عيادات ميدانية في مختلف مناطق القطاع، مما ساهم في خدمة آلاف المرضى والجرحى.",
            coverImage: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1200&auto=format&fit=crop",
        },
    ];
    lines.push("-- News posts");
    for (const n of newsData) {
        lines.push(`INSERT INTO "NewsPost" ("slug", "title", "excerpt", "body", "coverImage")
VALUES (${sqlString(n.slug)}, ${sqlString(n.title)}, ${sqlString(n.excerpt)}, ${sqlString(n.body)}, ${sqlString(n.coverImage)})
ON CONFLICT ("slug") DO NOTHING;`);
    }
    lines.push("");
    // --------------------------------------------------------
    // Admin user
    // --------------------------------------------------------
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || "Admin";
    if (adminEmail && adminPassword) {
        const hash = await bcrypt.hash(adminPassword, 10);
        lines.push("-- Admin user (generated from ADMIN_EMAIL / ADMIN_PASSWORD)");
        lines.push(`INSERT INTO "User" ("name", "email", "passwordHash", "role", "updatedAt")
VALUES (${sqlString(adminName)}, ${sqlString(adminEmail)}, ${sqlString(hash)}, 'ADMIN', now())
ON CONFLICT ("email") DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", "role" = 'ADMIN';`);
        lines.push("");
    }
    else {
        lines.push("-- ⚠️  ADMIN_EMAIL / ADMIN_PASSWORD not set when generating this file.");
        lines.push("-- Run again with: ADMIN_EMAIL=admin@destekol.org ADMIN_PASSWORD=yourpassword npx tsx scripts/export-seed-sql.ts > supabase/seed.sql");
        lines.push("");
    }
    process.stdout.write(lines.join("\n") + "\n");
}
main();
/*
-- Run this in Supabase SQL Editor to fix race conditions (Bug #77, #78):
CREATE OR REPLACE FUNCTION increment_campaign_stats(
  p_campaign_id UUID,
  p_amount NUMERIC,
  p_increment_donor BOOLEAN DEFAULT FALSE
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "Campaign"
  SET
    "raisedAmount" = "raisedAmount" + p_amount,
    "donorCount" = CASE WHEN p_increment_donor THEN "donorCount" + 1 ELSE "donorCount" END
  WHERE id = p_campaign_id;
END;
$$;
*/
