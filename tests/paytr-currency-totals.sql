BEGIN;
DO $$ DECLARE v_email text:='paytr-currency-fixture-'||gen_random_uuid()::text||'@destekol.test'; usd_order record; try_order record; totals jsonb; usd numeric;
BEGIN
 INSERT INTO destekol."User"(name,email) VALUES('Fixture',v_email);
 SELECT * INTO usd_order FROM destekol.create_paytr_order(gen_random_uuid()::text,'usd-fixture','DO'||replace(gen_random_uuid()::text,'-',''),'Fixture',v_email,'USD','[{"campaignId":null,"amount":10,"frequency":"ONE_TIME"}]'::jsonb,'CARD',false,null,false);
 SELECT * INTO try_order FROM destekol.create_paytr_order(gen_random_uuid()::text,'try-fixture','DO'||replace(gen_random_uuid()::text,'-',''),'Fixture',v_email,'TRY','[{"campaignId":null,"amount":200,"frequency":"ONE_TIME"}]'::jsonb,'BANK_TRANSFER',false,null,false);
 PERFORM destekol.process_paytr_callback(usd_order.oid,'success',10,'USD',false);
 PERFORM destekol.process_paytr_callback(try_order.oid,'success',200,'TRY',false);
 SELECT "donationTotals","totalDonated" INTO totals,usd FROM destekol."User" WHERE email=v_email;
 IF (totals->>'USD')::numeric<>10 OR (totals->>'TRY')::numeric<>200 OR usd<>10 THEN RAISE EXCEPTION 'Mixed currency total'; END IF;
 PERFORM destekol.reserve_paytr_refund(try_order."donationId",'TRYPARTIAL',50,'Fixture partial TRY');
 PERFORM destekol.finish_paytr_refund(try_order."donationId",'TRYPARTIAL','SUCCEEDED');
 SELECT "donationTotals","totalDonated" INTO totals,usd FROM destekol."User" WHERE email=v_email;
 IF (totals->>'USD')::numeric<>10 OR (totals->>'TRY')::numeric<>150 OR usd<>10 THEN RAISE EXCEPTION 'Refund crossed currencies'; END IF;
END $$;
ROLLBACK;
