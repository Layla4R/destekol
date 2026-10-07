ALTER TABLE destekol."Donation" ADD COLUMN IF NOT EXISTS "paymentReference" text;
CREATE OR REPLACE FUNCTION destekol.confirm_donation_payment(p_donation_id text,p_provider text,p_reference text,p_amount numeric,p_currency text,p_subscription_ref text DEFAULT NULL,p_payment_ref text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,destekol AS $$
DECLARE d destekol."Donation"%ROWTYPE;
BEGIN
 SELECT * INTO d FROM destekol."Donation" WHERE id=p_donation_id FOR UPDATE;
 IF NOT FOUND OR d.provider::text<>p_provider OR d.amount<>p_amount OR lower(d.currency)<>lower(p_currency) THEN RAISE EXCEPTION 'Payment mismatch'; END IF;
 IF d.status::text IN ('COMPLETED','REFUNDED') THEN RETURN false; END IF;
 IF d."providerRef" IS DISTINCT FROM p_reference THEN RAISE EXCEPTION 'Payment reference mismatch'; END IF;
 UPDATE destekol."Donation" SET status='COMPLETED',"paidAt"=now(),"providerRef"=COALESCE(p_subscription_ref,"providerRef"),"paymentReference"=p_payment_ref,"subscriptionStatus"=CASE WHEN p_subscription_ref IS NOT NULL THEN 'ACTIVE' ELSE "subscriptionStatus" END,"updatedAt"=now() WHERE id=d.id;
 IF d."campaignId" IS NOT NULL THEN UPDATE destekol."Campaign" SET "raisedAmount"="raisedAmount"+d.amount,"donorCount"="donorCount"+1 WHERE id=d."campaignId"; END IF;
 UPDATE destekol."User" SET "totalDonated"=COALESCE("totalDonated",0)+d.amount,"donationCount"=COALESCE("donationCount",0)+1 WHERE lower(email)=lower(d."donorEmail");
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION destekol.confirm_donation_payment(text,text,text,numeric,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION destekol.confirm_donation_payment(text,text,text,numeric,text,text,text) TO service_role;
NOTIFY pgrst,'reload schema';
