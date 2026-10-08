CREATE OR REPLACE FUNCTION destekol.consume_request_limit(p_bucket text,p_limit integer,p_window_seconds integer)
RETURNS TABLE(allowed boolean,retry_after integer) LANGUAGE plpgsql SECURITY INVOKER
SET search_path=pg_catalog,destekol AS $$
DECLARE v_now timestamptz := clock_timestamp(); row_data destekol.request_rate_limits%ROWTYPE;
BEGIN
 IF p_limit<1 OR p_window_seconds<1 OR length(p_bucket)>200 THEN RAISE EXCEPTION 'Invalid rate limit'; END IF;
 DELETE FROM destekol.request_rate_limits WHERE expires_at<v_now;
 INSERT INTO destekol.request_rate_limits AS existing(bucket,hits,expires_at)
 VALUES(p_bucket,1,v_now+make_interval(secs=>p_window_seconds))
 ON CONFLICT(bucket) DO UPDATE SET
 hits=CASE WHEN existing.expires_at<=v_now THEN 1 ELSE LEAST(existing.hits+1,p_limit+1) END,
 expires_at=CASE WHEN existing.expires_at<=v_now THEN v_now+make_interval(secs=>p_window_seconds) ELSE existing.expires_at END
 RETURNING * INTO row_data;
 RETURN QUERY SELECT row_data.hits<=p_limit,GREATEST(1,ceil(extract(epoch FROM row_data.expires_at-v_now))::integer);
END $$;
REVOKE ALL ON FUNCTION destekol.consume_request_limit(text,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION destekol.consume_request_limit(text,integer,integer) TO service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON destekol.request_rate_limits TO service_role;
NOTIFY pgrst,'reload schema';
