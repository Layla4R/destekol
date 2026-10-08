BEGIN;
DO $$ DECLARE r record; n integer; BEGIN
 IF has_function_privilege('anon','destekol.subscribe_newsletter(text,text,text,text,text)','execute') OR has_function_privilege('authenticated','destekol.unsubscribe_newsletter(text,text)','execute') THEN RAISE EXCEPTION 'Public function permission'; END IF;
 SELECT * INTO r FROM destekol.subscribe_newsletter('newsletter-fixture-'||gen_random_uuid()::text||'@destekol.test','en','test-v1','Fixture consent','test');
 IF r.id IS NULL THEN RAISE EXCEPTION 'Missing subscriber'; END IF;
 IF NOT destekol.unsubscribe_newsletter(r.id,r."unsubscribeKey") OR NOT destekol.unsubscribe_newsletter(r.id,r."unsubscribeKey") THEN RAISE EXCEPTION 'Cancellation failed'; END IF;
 IF destekol.unsubscribe_newsletter(r.id,'wrong-key') THEN RAISE EXCEPTION 'Wrong key accepted'; END IF;
 SELECT count(*) INTO n FROM destekol."SubscriberConsentEvent" WHERE "subscriberId"=r.id;
 IF n<>2 THEN RAISE EXCEPTION 'Wrong event count %',n; END IF;
 IF EXISTS(SELECT 1 FROM destekol."Subscriber" WHERE id=r.id AND active) THEN RAISE EXCEPTION 'Still active'; END IF;
END $$;
ROLLBACK;
