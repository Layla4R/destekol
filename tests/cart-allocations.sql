BEGIN;
DO $$
DECLARE c1 text; c2 text; d text; reference text:='TEST'||replace(gen_random_uuid()::text,'-',''); a numeric; b numeric;
BEGIN
 INSERT INTO destekol."Campaign"(slug,title,summary,description,"goalAmount") VALUES('test-'||gen_random_uuid(),'Allocation test','Test','Test',1000) RETURNING id INTO c1;
 INSERT INTO destekol."Campaign"(slug,title,summary,description,"goalAmount") VALUES('test-'||gen_random_uuid(),'Allocation test','Test','Test',1000) RETURNING id INTO c2;
 d:=destekol.create_cart_donation('Test','test@example.invalid','USD',reference,jsonb_build_array(jsonb_build_object('campaignId',c1,'amount',25,'frequency','ONE_TIME'),jsonb_build_object('campaignId',c2,'amount',25,'frequency','ONE_TIME')));
 IF (SELECT amount FROM destekol."Donation" WHERE id=d)<>50 OR (SELECT count(*) FROM destekol."DonationAllocation" WHERE "donationId"=d)<>2 THEN RAISE EXCEPTION 'Cart persistence failed'; END IF;
 BEGIN
  PERFORM destekol.confirm_donation_payment(d,'PAYTR',reference,49,'USD',NULL,reference);
  RAISE EXCEPTION 'Mismatch was accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='Mismatch was accepted' THEN RAISE; END IF; END;
 PERFORM destekol.confirm_donation_payment(d,'PAYTR',reference,50,'USD',NULL,reference);
 PERFORM destekol.confirm_donation_payment(d,'PAYTR',reference,50,'USD',NULL,reference);
 SELECT "raisedAmount" INTO a FROM destekol."Campaign" WHERE id=c1;
 SELECT "raisedAmount" INTO b FROM destekol."Campaign" WHERE id=c2;
 IF a<>25 OR b<>25 THEN RAISE EXCEPTION 'Campaign allocation or idempotency failed'; END IF;
 PERFORM destekol.record_donation_refund(d,'PAYTR',reference||'R',10,'USD','Test','SUCCEEDED');
 PERFORM destekol.record_donation_refund(d,'PAYTR',reference||'R',10,'USD','Test','SUCCEEDED');
 SELECT "raisedAmount" INTO a FROM destekol."Campaign" WHERE id=c1;
 SELECT "raisedAmount" INTO b FROM destekol."Campaign" WHERE id=c2;
 IF a<>20 OR b<>20 THEN RAISE EXCEPTION 'Refund allocation failed'; END IF;
 PERFORM destekol.record_donation_refund(d,'PAYTR',reference||'F',40,'USD','Test','SUCCEEDED');
 IF EXISTS(SELECT 1 FROM destekol."Campaign" WHERE id IN(c1,c2) AND "raisedAmount"<>0) THEN RAISE EXCEPTION 'Full refund allocation failed'; END IF;
END $$;
ROLLBACK;
