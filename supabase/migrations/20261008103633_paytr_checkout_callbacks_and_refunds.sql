CREATE TABLE destekol."PayTRSettings" (
 id text PRIMARY KEY DEFAULT 'default' CHECK(id='default'),
 mode text NOT NULL DEFAULT 'DISABLED' CHECK(mode IN ('DISABLED','TEST','LIVE')),
 "merchantId" text NOT NULL DEFAULT '', "merchantKeyEncrypted" text, "merchantSaltEncrypted" text,
 "cardEnabled" boolean NOT NULL DEFAULT false, "bankEnabled" boolean NOT NULL DEFAULT false,
 currencies text[] NOT NULL DEFAULT ARRAY['USD'], "updatedAt" timestamptz NOT NULL DEFAULT now()
);
INSERT INTO destekol."PayTRSettings"(id) VALUES('default');
ALTER TABLE destekol."Donation" ADD COLUMN "isTest" boolean NOT NULL DEFAULT false;
ALTER TABLE destekol."Campaign" ADD COLUMN currency text NOT NULL DEFAULT 'USD' CHECK(currency IN ('USD','TRY','EUR','GBP','RUB'));
CREATE TABLE destekol."PayTROrder" (
 "donationId" text PRIMARY KEY REFERENCES destekol."Donation"(id) ON DELETE CASCADE,
 oid text UNIQUE NOT NULL, "requestKey" text UNIQUE NOT NULL, "requestHash" text NOT NULL,
 method text NOT NULL CHECK(method IN ('CARD','BANK_TRANSFER')), "testMode" boolean NOT NULL,
 "tokenState" text NOT NULL DEFAULT 'REQUESTING' CHECK("tokenState" IN ('REQUESTING','READY','FAILED','UNKNOWN')),
 "iframeTokenEncrypted" text, "callbackStatus" text CHECK("callbackStatus" IN ('success','failed')),
 "createdAt" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE destekol."PayTRSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE destekol."PayTROrder" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON destekol."PayTRSettings",destekol."PayTROrder" FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON destekol."PayTRSettings",destekol."PayTROrder" TO service_role;

CREATE FUNCTION destekol.create_paytr_order(p_key text,p_hash text,p_oid text,p_name text,p_email text,p_currency text,p_items jsonb,p_method text,p_test boolean,p_message text,p_anonymous boolean)
RETURNS TABLE("donationId" text,oid text,"tokenState" text,"iframeTokenEncrypted" text,created boolean)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,destekol AS $$
DECLARE existing destekol."PayTROrder"%ROWTYPE; v_id text; item jsonb;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_key,0));
 SELECT * INTO existing FROM destekol."PayTROrder" WHERE "requestKey"=p_key;
 IF FOUND THEN
  IF existing."requestHash"<>p_hash THEN RAISE EXCEPTION 'Request mismatch'; END IF;
  RETURN QUERY SELECT existing."donationId",existing.oid,existing."tokenState",existing."iframeTokenEncrypted",false; RETURN;
 END IF;
 IF p_method NOT IN ('CARD','BANK_TRANSFER') OR (p_method='BANK_TRANSFER' AND p_currency<>'TRY') THEN RAISE EXCEPTION 'Unsupported method'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
  IF item->>'frequency'<>'ONE_TIME' THEN RAISE EXCEPTION 'Recurring service not enabled'; END IF;
  IF item->>'campaignId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM destekol."Campaign" c WHERE c.id=item->>'campaignId' AND c."isActive" AND c.currency=p_currency AND (c."endDate" IS NULL OR c."endDate">now())) THEN RAISE EXCEPTION 'Campaign currency or status mismatch'; END IF;
 END LOOP;
 v_id:=destekol.create_cart_donation(p_name,p_email,p_currency,p_oid,p_items);
 UPDATE destekol."Donation" SET "isTest"=p_test,message=p_message,"isAnonymous"=p_anonymous WHERE id=v_id;
 INSERT INTO destekol."PayTROrder"("donationId",oid,"requestKey","requestHash",method,"testMode") VALUES(v_id,p_oid,p_key,p_hash,p_method,p_test);
 RETURN QUERY SELECT v_id,p_oid,'REQUESTING'::text,NULL::text,true;
END $$;

CREATE FUNCTION destekol.process_paytr_callback(p_oid text,p_status text,p_amount numeric,p_currency text,p_test boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,destekol AS $$
DECLARE o destekol."PayTROrder"%ROWTYPE; d destekol."Donation"%ROWTYPE;
BEGIN
 SELECT * INTO o FROM destekol."PayTROrder" WHERE oid=p_oid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown order'; END IF;
 SELECT * INTO d FROM destekol."Donation" WHERE id=o."donationId" FOR UPDATE;
 IF o."testMode"<>p_test OR upper(d.currency)<>p_currency OR p_status NOT IN ('success','failed') OR (p_status='success' AND d.amount<>p_amount) THEN RAISE EXCEPTION 'Payment mismatch'; END IF;
 IF o."callbackStatus" IS NOT NULL THEN
  IF o."callbackStatus"<>p_status THEN RAISE EXCEPTION 'Conflicting callback'; END IF;
  RETURN false;
 END IF;
 IF p_status='success' AND NOT p_test THEN
  PERFORM destekol.confirm_donation_payment(d.id,'PAYTR',p_oid,p_amount,lower(p_currency),NULL,p_oid);
  UPDATE destekol."Donation" SET "receiptNumber"=COALESCE("receiptNumber",'DO-'||p_oid) WHERE id=d.id;
 ELSIF p_status='failed' THEN
  UPDATE destekol."Donation" SET status='FAILED',"updatedAt"=now() WHERE id=d.id AND status::text='PENDING';
 END IF;
 UPDATE destekol."PayTROrder" SET "callbackStatus"=p_status WHERE "donationId"=d.id;
 RETURN true;
END $$;

CREATE FUNCTION destekol.reserve_paytr_refund(p_id text,p_ref text,p_amount numeric,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,destekol AS $$
DECLARE d destekol."Donation"%ROWTYPE; o destekol."PayTROrder"%ROWTYPE; total numeric;
BEGIN
 SELECT * INTO d FROM destekol."Donation" WHERE id=p_id FOR UPDATE;
 SELECT * INTO o FROM destekol."PayTROrder" WHERE "donationId"=p_id;
 IF NOT FOUND OR o."callbackStatus" IS DISTINCT FROM 'success' OR p_amount<=0 OR p_amount<>round(p_amount,2) OR length(p_reason) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Invalid refund'; END IF;
 IF EXISTS(SELECT 1 FROM destekol."DonationRefund" WHERE "donationId"=p_id AND status='PENDING') THEN RAISE EXCEPTION 'Refund awaiting reconciliation'; END IF;
 SELECT COALESCE(sum(amount),0) INTO total FROM destekol."DonationRefund" WHERE "donationId"=p_id AND status='SUCCEEDED';
 IF total+p_amount>d.amount THEN RAISE EXCEPTION 'Refund exceeds remaining amount'; END IF;
 INSERT INTO destekol."DonationRefund"("donationId",provider,"providerRefundId",amount,currency,reason,status) VALUES(p_id,'PAYTR',p_ref,p_amount,d.currency,p_reason,'PENDING');
END $$;

CREATE FUNCTION destekol.finish_paytr_refund(p_id text,p_ref text,p_status text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,destekol AS $$
DECLARE d destekol."Donation"%ROWTYPE; r destekol."DonationRefund"%ROWTYPE;
BEGIN
 SELECT * INTO d FROM destekol."Donation" WHERE id=p_id FOR UPDATE;
 SELECT * INTO r FROM destekol."DonationRefund" WHERE "donationId"=p_id AND provider='PAYTR' AND "providerRefundId"=p_ref FOR UPDATE;
 IF NOT FOUND OR p_status NOT IN ('SUCCEEDED','FAILED') THEN RAISE EXCEPTION 'Unknown refund'; END IF;
 IF d."isTest" THEN
  UPDATE destekol."DonationRefund" SET status=CASE WHEN status='SUCCEEDED' THEN status ELSE p_status END,"updatedAt"=now() WHERE id=r.id;
 ELSE
  PERFORM destekol.record_donation_refund(p_id,'PAYTR',p_ref,r.amount,r.currency,r.reason,p_status);
 END IF;
END $$;
REVOKE ALL ON FUNCTION destekol.create_paytr_order(text,text,text,text,text,text,jsonb,text,boolean,text,boolean),destekol.process_paytr_callback(text,text,numeric,text,boolean),destekol.reserve_paytr_refund(text,text,numeric,text),destekol.finish_paytr_refund(text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION destekol.create_paytr_order(text,text,text,text,text,text,jsonb,text,boolean,text,boolean),destekol.process_paytr_callback(text,text,numeric,text,boolean),destekol.reserve_paytr_refund(text,text,numeric,text),destekol.finish_paytr_refund(text,text,text) TO service_role;
