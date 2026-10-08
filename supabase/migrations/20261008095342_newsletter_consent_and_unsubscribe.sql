ALTER TABLE destekol."Subscriber"
 ADD COLUMN "active" boolean NOT NULL DEFAULT false,
 ADD COLUMN "consentAt" timestamptz,
 ADD COLUMN "consentVersion" text,
 ADD COLUMN "consentText" text,
 ADD COLUMN "consentLocale" text,
 ADD COLUMN "consentSource" text,
 ADD COLUMN "unsubscribedAt" timestamptz,
 ADD COLUMN "unsubscribeKey" text NOT NULL DEFAULT gen_random_uuid()::text;
CREATE TABLE destekol."SubscriberConsentEvent" (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "subscriberId" text NOT NULL REFERENCES destekol."Subscriber"(id) ON DELETE CASCADE,
 action text NOT NULL CHECK(action IN ('SUBSCRIBE','UNSUBSCRIBE')),
 "createdAt" timestamptz NOT NULL DEFAULT now(),
 locale text, version text, "consentText" text, source text
);
ALTER TABLE destekol."SubscriberConsentEvent" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON destekol."SubscriberConsentEvent" FROM anon, authenticated;
GRANT SELECT,INSERT,DELETE ON destekol."SubscriberConsentEvent" TO service_role;
CREATE FUNCTION destekol.subscribe_newsletter(p_email text,p_locale text,p_version text,p_text text,p_source text)
RETURNS TABLE(id text, "unsubscribeKey" text) LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,destekol AS $$
DECLARE v_row destekol."Subscriber"%ROWTYPE;
BEGIN
 INSERT INTO destekol."Subscriber"(email,"active","consentAt","consentVersion","consentText","consentLocale","consentSource")
 VALUES(p_email,true,now(),p_version,p_text,p_locale,p_source)
 ON CONFLICT(email) DO UPDATE SET "active"=true,"consentAt"=now(),"consentVersion"=p_version,"consentText"=p_text,"consentLocale"=p_locale,"consentSource"=p_source,"unsubscribedAt"=null
 RETURNING * INTO v_row;
 INSERT INTO destekol."SubscriberConsentEvent"("subscriberId",action,locale,version,"consentText",source)
 VALUES(v_row.id,'SUBSCRIBE',p_locale,p_version,p_text,p_source);
 RETURN QUERY SELECT v_row.id,v_row."unsubscribeKey";
END $$;
CREATE FUNCTION destekol.unsubscribe_newsletter(p_id text,p_key text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,destekol AS $$
DECLARE v_id text;
BEGIN
 PERFORM 1 FROM destekol."Subscriber" WHERE id=p_id AND "unsubscribeKey"=p_key FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 UPDATE destekol."Subscriber" SET active=false,"unsubscribedAt"=now() WHERE id=p_id AND "active" RETURNING id INTO v_id;
 IF v_id IS NOT NULL THEN INSERT INTO destekol."SubscriberConsentEvent"("subscriberId",action,source) VALUES(v_id,'UNSUBSCRIBE','email-link'); END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION destekol.subscribe_newsletter(text,text,text,text,text),destekol.unsubscribe_newsletter(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION destekol.subscribe_newsletter(text,text,text,text,text),destekol.unsubscribe_newsletter(text,text) TO service_role;
