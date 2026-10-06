-- Applied to the connected project using Supabase's migration API.
alter table destekol."CampaignTranslation" add column if not exists "authorName" text, add column if not exists "authorRole" text;
notify pgrst, 'reload schema';
