-- Private project only. Existing campaigns remain unapproved until the real project file is entered.
ALTER TABLE destekol."Campaign"
  ADD COLUMN IF NOT EXISTS "projectPlan" jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE destekol."Campaign"
  ADD CONSTRAINT campaign_project_plan_object CHECK (jsonb_typeof("projectPlan") = 'object');
COMMENT ON COLUMN destekol."Campaign"."projectPlan" IS 'Costed delivery plan, four-language public narrative and private approval reference. Public pages expose only validated approved fields.';
