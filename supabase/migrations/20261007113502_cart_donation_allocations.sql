CREATE TYPE destekol."PaymentProvider" AS ENUM ('STRIPE','PAYPAL','PAYTR');
ALTER TABLE destekol."Donation" ALTER COLUMN provider TYPE destekol."PaymentProvider" USING provider::text::destekol."PaymentProvider";
CREATE TABLE destekol."DonationAllocation" (
 id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "donationId" text NOT NULL REFERENCES destekol."Donation"(id) ON DELETE CASCADE,
 "campaignId" text REFERENCES destekol."Campaign"(id),
 amount numeric(18,2) NOT NULL CHECK(amount>0),
 frequency text NOT NULL CHECK(frequency IN ('ONE_TIME','MONTHLY')),
 "refundedAmount" numeric(18,2) NOT NULL DEFAULT 0 CHECK("refundedAmount">=0 AND "refundedAmount"<=amount)
);
CREATE INDEX ON destekol."DonationAllocation"("donationId");
CREATE INDEX ON destekol."DonationAllocation"("campaignId");
ALTER TABLE destekol."DonationAllocation" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON destekol."DonationAllocation" FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON destekol."DonationAllocation" TO service_role;

CREATE FUNCTION destekol.create_cart_donation(p_name text,p_email text,p_currency text,p_reference text,p_items jsonb) RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,destekol AS $$
DECLARE donation_id text; item jsonb; total numeric; monthly boolean;
BEGIN
 IF jsonb_typeof(p_items)<>'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 50 OR length(trim(p_name)) NOT BETWEEN 1 AND 60 OR p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR p_reference !~ '^[a-zA-Z0-9]{1,64}$' OR lower(p_currency) NOT IN ('usd','try','eur','gbp','rub') THEN RAISE EXCEPTION 'Invalid cart'; END IF;
 total:=0; monthly:=false;
 FOR item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
  IF (item->>'amount') IS NULL OR (item->>'amount')::numeric<=0 OR (item->>'amount')::numeric<>round((item->>'amount')::numeric,2) OR (item->>'amount')::numeric>1000000 OR COALESCE(item->>'frequency','') NOT IN ('ONE_TIME','MONTHLY') THEN RAISE EXCEPTION 'Invalid allocation'; END IF;
  IF item->>'campaignId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM destekol."Campaign" WHERE id=item->>'campaignId' AND "isActive"=true) THEN RAISE EXCEPTION 'Inactive campaign'; END IF;
  total:=total+(item->>'amount')::numeric;
  monthly:=monthly OR item->>'frequency'='MONTHLY';
 END LOOP;
 -- A mixed schedule requires a separate subscription schedule; never charge it as a single monthly subscription.
 IF monthly AND EXISTS(SELECT 1 FROM jsonb_array_elements(p_items) x WHERE x->>'frequency'='ONE_TIME') THEN RAISE EXCEPTION 'Mixed donation frequencies are not enabled'; END IF;
 INSERT INTO destekol."Donation"("donorName","donorEmail",amount,currency,frequency,provider,"providerRef") VALUES(trim(p_name),lower(trim(p_email)),total,lower(p_currency),CASE WHEN monthly THEN 'MONTHLY'::public."DonationFrequency" ELSE 'ONE_TIME'::public."DonationFrequency" END,'PAYTR',p_reference) RETURNING id INTO donation_id;
 INSERT INTO destekol."DonationAllocation"("donationId","campaignId",amount,frequency) SELECT donation_id,value->>'campaignId',(value->>'amount')::numeric,value->>'frequency' FROM jsonb_array_elements(p_items);
 RETURN donation_id;
END $$;
REVOKE ALL ON FUNCTION destekol.create_cart_donation(text,text,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION destekol.create_cart_donation(text,text,text,text,jsonb) TO service_role;

CREATE FUNCTION destekol.apply_donation_allocations() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,destekol AS $$
DECLARE allocation record; running numeric:=0; target numeric; refund_total numeric; allocation_total numeric; previous_target numeric:=0;
BEGIN
 SELECT sum(amount) INTO allocation_total FROM destekol."DonationAllocation" WHERE "donationId"=NEW.id;
 IF allocation_total IS NULL THEN RETURN NEW; END IF;
 IF NEW."campaignId" IS NOT NULL OR allocation_total<>NEW.amount THEN RAISE EXCEPTION 'Allocation total mismatch'; END IF;
 IF NEW.status::text='COMPLETED' AND OLD.status::text NOT IN ('COMPLETED','REFUNDED') THEN
  FOR allocation IN SELECT "campaignId",sum(amount) amount FROM destekol."DonationAllocation" WHERE "donationId"=NEW.id GROUP BY "campaignId" ORDER BY "campaignId" LOOP
   UPDATE destekol."Campaign" SET "raisedAmount"="raisedAmount"+allocation.amount,"donorCount"="donorCount"+1 WHERE id=allocation."campaignId";
  END LOOP;
 END IF;
 IF NEW."refundedAmount">OLD."refundedAmount" THEN
  FOR allocation IN SELECT * FROM destekol."DonationAllocation" WHERE "donationId"=NEW.id ORDER BY "campaignId",id LOOP
   running:=running+allocation.amount;
   refund_total:=round(NEW."refundedAmount"*running/NEW.amount,2);
   target:=refund_total-previous_target; previous_target:=refund_total;
   -- Cumulative rounding preserves the exact total down to the final cent.
   UPDATE destekol."Campaign" SET "raisedAmount"=GREATEST(0,"raisedAmount"-(target-allocation."refundedAmount")) WHERE id=allocation."campaignId";
   UPDATE destekol."DonationAllocation" SET "refundedAmount"=target WHERE id=allocation.id;
  END LOOP;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER donation_allocations AFTER UPDATE OF status,"refundedAmount" ON destekol."Donation" FOR EACH ROW EXECUTE FUNCTION destekol.apply_donation_allocations();
NOTIFY pgrst,'reload schema';
ALTER TABLE destekol."DonationRefund" DROP CONSTRAINT "DonationRefund_provider_check"; ALTER TABLE destekol."DonationRefund" ADD CONSTRAINT "DonationRefund_provider_check" CHECK(provider IN ('STRIPE','PAYPAL','PAYTR'));
