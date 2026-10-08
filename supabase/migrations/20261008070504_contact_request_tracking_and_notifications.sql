ALTER TABLE destekol."ContactMessage"
 ADD COLUMN reference text NOT NULL DEFAULT ('DO-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))),
 ADD COLUMN "trackingTokenHash" text,
 ADD COLUMN status text NOT NULL DEFAULT 'RECEIVED' CHECK(status IN ('RECEIVED','IN_PROGRESS','ANSWERED','CLOSED')),
 ADD COLUMN "statusUpdatedAt" timestamptz NOT NULL DEFAULT now(),
 ADD COLUMN "notificationStatus" text NOT NULL DEFAULT 'PENDING' CHECK("notificationStatus" IN ('PENDING','SENDING','SENT','FAILED')),
 ADD COLUMN "notificationAttempts" integer NOT NULL DEFAULT 0,
 ADD COLUMN "notificationAttemptedAt" timestamptz,
 ADD COLUMN "notificationSentAt" timestamptz,
 ADD COLUMN "notificationNextAttemptAt" timestamptz NOT NULL DEFAULT now(),
 ADD COLUMN "notificationLeaseUntil" timestamptz;
CREATE UNIQUE INDEX contact_message_reference_unique ON destekol."ContactMessage"(reference);
-- Older rows cannot be tracked publicly and do not need a new email automatically.
UPDATE destekol."ContactMessage" SET "notificationStatus"='FAILED';
CREATE FUNCTION destekol.claim_contact_notification(p_id text,p_force boolean DEFAULT false)
RETURNS TABLE(id text,reference text) LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog,destekol AS $$
 UPDATE destekol."ContactMessage" SET "notificationStatus"='SENDING',
 "notificationAttempts"="notificationAttempts"+1,"notificationAttemptedAt"=now(),
 "notificationLeaseUntil"=now()+interval '2 minutes'
 WHERE "ContactMessage".id=p_id
 AND ("notificationStatus" IN ('PENDING','FAILED') OR ("notificationStatus"='SENDING' AND "notificationLeaseUntil"<now()))
 AND (p_force OR ("notificationNextAttemptAt"<=now() AND "notificationAttempts"<5))
 RETURNING "ContactMessage".id,"ContactMessage".reference;
$$;
REVOKE ALL ON FUNCTION destekol.claim_contact_notification(text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION destekol.claim_contact_notification(text,boolean) TO service_role;
NOTIFY pgrst,'reload schema';
