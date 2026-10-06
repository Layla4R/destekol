-- Destekol only. Existing article content and translations are preserved.
CREATE TABLE destekol."NewsCategory" (
  slug text PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND slug <> 'all'),
  labels jsonb NOT NULL CHECK (jsonb_typeof(labels) = 'object'),
  "sortOrder" integer NOT NULL DEFAULT 0
);
ALTER TABLE destekol."NewsCategory" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON destekol."NewsCategory" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON destekol."NewsCategory" TO service_role;
INSERT INTO destekol."NewsCategory" (slug,labels,"sortOrder") VALUES
 ('human-stories','{"ar":"قصص إنسانية","en":"Human stories","tr":"İnsan hikâyeleri","fr":"Histoires humaines"}',10),
 ('project-news','{"ar":"أخبار المشاريع","en":"Project news","tr":"Proje haberleri","fr":"Actualités des projets"}',20),
 ('beneficiaries','{"ar":"مستفيدون","en":"Beneficiaries","tr":"Faydalanıcılar","fr":"Bénéficiaires"}',30),
 ('events','{"ar":"فعاليات","en":"Events","tr":"Etkinlikler","fr":"Événements"}',40),
 ('reports','{"ar":"تقارير","en":"Reports","tr":"Raporlar","fr":"Rapports"}',50);
ALTER TABLE destekol."NewsPost" ADD COLUMN "categorySlug" text REFERENCES destekol."NewsCategory"(slug);
CREATE INDEX "NewsPost_categorySlug_idx" ON destekol."NewsPost" ("categorySlug");
CREATE INDEX "NewsPost_published_feed_idx" ON destekol."NewsPost" ("publishedAt" DESC NULLS LAST, id DESC) WHERE "isPublished" = true;
CREATE INDEX "NewsPost_category_feed_idx" ON destekol."NewsPost" ("categorySlug", "publishedAt" DESC NULLS LAST, id DESC) WHERE "isPublished" = true;
UPDATE destekol."NewsPost" SET "categorySlug" = 'human-stories' WHERE slug = 'story-1' AND "categorySlug" IS NULL;
UPDATE destekol."NewsPost" SET "categorySlug" = 'project-news' WHERE slug = 'water-campaign-launch' AND "categorySlug" IS NULL;
NOTIFY pgrst, 'reload schema';
