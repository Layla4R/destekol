CREATE OR REPLACE FUNCTION destekol.record_recurring_payment(p_subscription_ref text,p_provider text,p_payment_ref text,p_amount numeric,p_currency text,p_receipt text)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,destekol AS $$
DECLARE d destekol."Donation"%ROWTYPE; new_id text;
BEGIN
 SELECT * INTO d FROM destekol."Donation" WHERE "providerRef"=p_subscription_ref AND provider::text=p_provider AND frequency::text='MONTHLY' FOR UPDATE;
 IF NOT FOUND OR p_amount<=0 OR lower(d.currency)<>lower(p_currency) THEN RAISE EXCEPTION 'Invalid recurring payment'; END IF;
 IF EXISTS(SELECT 1 FROM destekol."Donation" WHERE provider::text=p_provider AND ("providerRef"=p_payment_ref OR "paymentReference"=p_payment_ref)) THEN RETURN NULL; END IF;
 INSERT INTO destekol."Donation"("campaignId","userId","donorName","donorEmail",amount,currency,frequency,status,provider,"providerRef","isAnonymous","receiptNumber","paidAt")
 VALUES(d."campaignId",d."userId",d."donorName",d."donorEmail",p_amount,lower(p_currency),'MONTHLY','COMPLETED',d.provider,p_payment_ref,d."isAnonymous",p_receipt,now()) RETURNING id INTO new_id;
 IF d."campaignId" IS NOT NULL THEN UPDATE destekol."Campaign" SET "raisedAmount"="raisedAmount"+p_amount WHERE id=d."campaignId"; END IF;
 UPDATE destekol."User" SET "totalDonated"=COALESCE("totalDonated",0)+p_amount,"donationCount"=COALESCE("donationCount",0)+1 WHERE lower(email)=lower(d."donorEmail");
 RETURN new_id;
END $$;
REVOKE ALL ON FUNCTION destekol.record_recurring_payment(text,text,text,numeric,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION destekol.record_recurring_payment(text,text,text,numeric,text,text) TO service_role;
NOTIFY pgrst,'reload schema';

