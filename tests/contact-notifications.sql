BEGIN;
DO $$
DECLARE v_id text; v_count integer; v_allow boolean; v_bucket text := 'contact-test-'||gen_random_uuid()::text;
BEGIN
 IF has_function_privilege('anon','destekol.claim_contact_notification(text,boolean)','EXECUTE') THEN RAISE EXCEPTION 'Public queue RPC'; END IF;
 INSERT INTO destekol."ContactMessage"(name,email,message) VALUES('Disposable SQL fixture','fixture@destekol.test','Fixture') RETURNING id INTO v_id;
 SELECT count(*) INTO v_count FROM destekol.claim_contact_notification(v_id,false);
 IF v_count<>1 THEN RAISE EXCEPTION 'Initial claim failed'; END IF;
 SELECT count(*) INTO v_count FROM destekol.claim_contact_notification(v_id,true);
 IF v_count<>0 THEN RAISE EXCEPTION 'Duplicate claim'; END IF;
 UPDATE destekol."ContactMessage" SET "notificationStatus"='SENT' WHERE id=v_id;
 SELECT count(*) INTO v_count FROM destekol.claim_contact_notification(v_id,true);
 IF v_count<>0 THEN RAISE EXCEPTION 'Duplicate sent notice'; END IF;
 UPDATE destekol."ContactMessage" SET "notificationStatus"='FAILED',"notificationAttempts"=5 WHERE id=v_id;
 SELECT count(*) INTO v_count FROM destekol.claim_contact_notification(v_id,false);
 IF v_count<>0 THEN RAISE EXCEPTION 'Automatic retry cap ignored'; END IF;
 SELECT count(*) INTO v_count FROM destekol.claim_contact_notification(v_id,true);
 IF v_count<>1 THEN RAISE EXCEPTION 'Manual retry unavailable'; END IF;
 SELECT allowed INTO v_allow FROM destekol.consume_request_limit(v_bucket,2,600);
 IF NOT v_allow THEN RAISE EXCEPTION 'Initial rate limit check failed'; END IF;
 SELECT allowed INTO v_allow FROM destekol.consume_request_limit(v_bucket,2,600);
 IF NOT v_allow THEN RAISE EXCEPTION 'Second rate limit check failed'; END IF;
 SELECT allowed INTO v_allow FROM destekol.consume_request_limit(v_bucket,2,600);
 IF v_allow THEN RAISE EXCEPTION 'Rate limit not enforced'; END IF;
END $$;
ROLLBACK;
