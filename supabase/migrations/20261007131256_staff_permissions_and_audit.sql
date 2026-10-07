-- Independent role type: do not alter the shared application's public enum.
CREATE TYPE destekol."UserRole" AS ENUM ('ADMIN','EDITOR','DONOR','VIEWER');
ALTER TABLE destekol."User" ALTER COLUMN role DROP DEFAULT;
ALTER TABLE destekol."User" ALTER COLUMN role TYPE destekol."UserRole" USING role::text::destekol."UserRole";
ALTER TABLE destekol."User" ALTER COLUMN role SET DEFAULT 'DONOR'::destekol."UserRole";
ALTER TABLE destekol."User" ADD COLUMN permissions text[] NOT NULL DEFAULT '{}';
UPDATE destekol."User" SET permissions=ARRAY['pages.view','pages.edit','campaigns.view','campaigns.edit','posts.view','posts.edit'] WHERE role='EDITOR';
UPDATE destekol."User" SET permissions=ARRAY['pages.view','campaigns.view','posts.view'] WHERE role='VIEWER';
ALTER TABLE destekol."ContactMessage" ADD COLUMN "isSensitive" boolean NOT NULL DEFAULT true;
CREATE TABLE destekol."AdminAuditLog" (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 "actorId" text NOT NULL,
 action text NOT NULL,
 outcome text NOT NULL CHECK(outcome IN ('ALLOW','DENY','SUCCESS','FAILURE')),
 "resourceId" text,
 site text NOT NULL,
 "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON destekol."AdminAuditLog"("createdAt" DESC);
ALTER TABLE destekol."AdminAuditLog" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON destekol."AdminAuditLog" FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT ON destekol."AdminAuditLog" TO service_role;
GRANT USAGE,SELECT ON SEQUENCE destekol."AdminAuditLog_id_seq" TO service_role;
NOTIFY pgrst,'reload schema';
