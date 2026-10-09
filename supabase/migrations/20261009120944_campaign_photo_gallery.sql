ALTER TABLE destekol."Campaign" ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE destekol."Campaign" ADD CONSTRAINT campaign_gallery_array CHECK (jsonb_typeof(gallery) = 'array');
