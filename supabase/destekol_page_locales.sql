-- Update the Destekol page titles and descriptions for EN / FR / TR.
-- Run after the page content and translations have been seeded.
-- This intentionally leaves all admin-managed section content untouched.

UPDATE destekol."PageTranslation" AS translation
SET
  "title" = localized.title,
  "description" = localized.description,
  "updatedAt" = now()
FROM destekol."Page" AS page
JOIN (VALUES
  ('about', 'en', 'About Us', 'Learn about Destekol, a registered charitable non-profit association, and our humanitarian vision.'),
  ('about', 'fr', 'À propos de nous', 'Découvrez Destekol, une association caritative à but non lucratif, et notre vision humanitaire.'),
  ('about', 'tr', 'Hakkımızda', 'Kâr amacı gütmeyen bir hayır derneği olan Destekol''u ve insani vizyonumuzu keşfedin.'),
  ('contact', 'en', 'Contact Us', 'Get in touch with Destekol, a registered charitable non-profit association.'),
  ('contact', 'fr', 'Contactez-nous', 'Contactez Destekol, une association caritative à but non lucratif.'),
  ('contact', 'tr', 'İletişim', 'Kâr amacı gütmeyen bir hayır derneği olan Destekol ile iletişime geçin.'),
  ('projects', 'en', 'Humanitarian Projects', 'Explore Destekol’s humanitarian and development projects in the field: emergency response, water and sanitation, food security, and health care, documented through impact and transparency reports.'),
  ('projects', 'fr', 'Projets humanitaires', 'Découvrez les projets humanitaires et de développement de Destekol sur le terrain : intervention d’urgence, eau et assainissement, sécurité alimentaire et soins de santé, avec des rapports d’impact et de transparence.'),
  ('projects', 'tr', 'İnsani yardım projeleri', 'Destekol’un sahadaki insani yardım ve kalkınma projelerini keşfedin: acil müdahale, su ve sanitasyon, gıda güvenliği ve etki ile şeffaflık raporlarıyla belgelenen sağlık hizmetleri.')
) AS localized(slug, locale, title, description)
  ON page.slug = localized.slug
WHERE translation."pageId" = page.id
  AND translation.locale = localized.locale;

-- Correct a typo in the French project-card copy without replacing the
-- remaining CMS-managed project data.
UPDATE destekol."PageTranslation" AS translation
SET
  sections = jsonb_set(
    translation.sections,
    '{0,props,items,0,description}',
    to_jsonb(replace(
      translation.sections #>> '{0,props,items,0,description}',
      'meuneuses à farine',
      'moulins à farine'
    )),
    false
  ),
  "updatedAt" = now()
FROM destekol."Page" AS page
WHERE page.slug = 'projects'
  AND translation."pageId" = page.id
  AND translation.locale = 'fr'
  AND translation.sections #>> '{0,props,items,0,description}' LIKE '%meuneuses à farine%';
