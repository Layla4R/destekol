CREATE OR REPLACE FUNCTION destekol.claim_contact_notification(p_id text,p_force boolean DEFAULT false)
RETURNS TABLE(id text,reference text) LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog,destekol AS $$
 UPDATE destekol."ContactMessage" SET "notificationStatus"='SENDING',
 "notificationAttempts"="notificationAttempts"+1,"notificationAttemptedAt"=now(),
 "notificationLeaseUntil"=now()+interval '2 minutes'
 WHERE "ContactMessage".id=p_id
 AND ("notificationStatus" IN ('PENDING','FAILED') OR (p_force AND "notificationStatus"='UNKNOWN') OR ("notificationStatus"='SENDING' AND "notificationLeaseUntil"<now()))
 AND (p_force OR ("notificationNextAttemptAt"<=now() AND "notificationAttempts"<5))
 RETURNING "ContactMessage".id,"ContactMessage".reference;
$$;
NOTIFY pgrst,'reload schema';
