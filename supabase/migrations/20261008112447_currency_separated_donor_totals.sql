ALTER TABLE destekol."User" ADD COLUMN "donationTotals" jsonb NOT NULL DEFAULT '{}'::jsonb;
UPDATE destekol."User" SET "donationTotals"=jsonb_build_object('USD',COALESCE("totalDonated",0));
DO $migration$
DECLARE definition text; expected text;
BEGIN
 definition:=pg_get_functiondef('destekol.confirm_donation_payment(text,text,text,numeric,text,text,text)'::regprocedure);
 expected:='"totalDonated"=COALESCE("totalDonated",0)+d.amount';
 IF position(expected IN definition)=0 THEN RAISE EXCEPTION 'Unexpected confirmation function';END IF;
 definition:=replace(definition,expected,'"totalDonated"=CASE WHEN lower(d.currency)=''usd'' THEN COALESCE("totalDonated",0)+d.amount ELSE COALESCE("totalDonated",0) END, "donationTotals"=jsonb_set(COALESCE("donationTotals",''{}''::jsonb),ARRAY[upper(d.currency)],to_jsonb(COALESCE(("donationTotals"->>upper(d.currency))::numeric,0)+d.amount),true)');
 EXECUTE definition;
 definition:=pg_get_functiondef('destekol.record_donation_refund(text,text,text,numeric,text,text,text)'::regprocedure);
 expected:='"totalDonated"=GREATEST(0,COALESCE("totalDonated",0)-delta)';
 IF position(expected IN definition)=0 THEN RAISE EXCEPTION 'Unexpected refund function';END IF;
 definition:=replace(definition,expected,'"totalDonated"=CASE WHEN lower(d.currency)=''usd'' THEN GREATEST(0,COALESCE("totalDonated",0)-delta) ELSE COALESCE("totalDonated",0) END, "donationTotals"=jsonb_set(COALESCE("donationTotals",''{}''::jsonb),ARRAY[upper(d.currency)],to_jsonb(GREATEST(0,COALESCE(("donationTotals"->>upper(d.currency))::numeric,0)-delta)),true)');
 EXECUTE definition;
END $migration$;
NOTIFY pgrst,'reload schema';
