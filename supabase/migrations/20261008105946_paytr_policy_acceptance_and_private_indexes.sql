ALTER TABLE destekol."PayTROrder"
 ADD COLUMN "policyVersion" text NOT NULL DEFAULT '2026-10-08-v1',
 ADD COLUMN "policyAcceptedAt" timestamptz NOT NULL DEFAULT now();
CREATE INDEX ON destekol."PayTROrder"("createdAt");
CREATE INDEX ON destekol."SubscriberConsentEvent"("subscriberId");
NOTIFY pgrst,'reload schema';
