ALTER TABLE destekol."SiteSettings"
ADD COLUMN IF NOT EXISTS "socialPosition" text NOT NULL DEFAULT 'right'
CHECK ("socialPosition" IN ('left', 'right'));
