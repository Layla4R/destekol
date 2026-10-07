CREATE OR REPLACE FUNCTION destekol.record_donation_refund(p_donation_id text,p_provider text,p_refund_id text,p_amount numeric,p_currency text,p_reason text,p_status text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog,destekol AS $$
DECLARE d destekol."Donation"%ROWTYPE; total numeric; delta numeric;
BEGIN
  SELECT * INTO d FROM destekol."Donation" WHERE id=p_donation_id FOR UPDATE;
  IF NOT FOUND OR d.provider::text <> p_provider OR lower(d.currency) <> lower(p_currency) OR p_amount <= 0 OR d.status::text NOT IN ('COMPLETED','REFUNDED') THEN
    RAISE EXCEPTION 'Invalid refund transaction';
  END IF;
  IF EXISTS (SELECT 1 FROM destekol."DonationRefund" WHERE provider=p_provider AND "providerRefundId"=p_refund_id AND "donationId"<>p_donation_id) THEN
    RAISE EXCEPTION 'Refund belongs to another transaction';
  END IF;
  IF EXISTS (SELECT 1 FROM destekol."DonationRefund" WHERE provider=p_provider AND "providerRefundId"=p_refund_id AND (amount<>p_amount OR currency<>lower(p_currency))) THEN
    RAISE EXCEPTION 'Refund amount or currency mismatch';
  END IF;
  INSERT INTO destekol."DonationRefund"("donationId",provider,"providerRefundId",amount,currency,reason,status)
  VALUES(p_donation_id,p_provider,p_refund_id,p_amount,lower(p_currency),p_reason,p_status)
  ON CONFLICT(provider,"providerRefundId") DO UPDATE SET status=CASE WHEN destekol."DonationRefund".status='SUCCEEDED' THEN 'SUCCEEDED' ELSE EXCLUDED.status END, reason=COALESCE(EXCLUDED.reason,destekol."DonationRefund".reason),"updatedAt"=now();
  SELECT COALESCE(sum(amount),0) INTO total FROM destekol."DonationRefund" WHERE "donationId"=p_donation_id AND status='SUCCEEDED';
  IF total > d.amount THEN RAISE EXCEPTION 'Refund total exceeds donation'; END IF;
  delta := total-d."refundedAmount";
  UPDATE destekol."Donation" SET "refundedAmount"=total,"refundStatus"=CASE WHEN total=0 THEN 'NONE' WHEN total<amount THEN 'PARTIAL' ELSE 'FULL' END,status=CASE WHEN total>=amount THEN 'REFUNDED'::public."DonationStatus" ELSE status END,"updatedAt"=now() WHERE id=p_donation_id;
  IF delta>0 AND d."campaignId" IS NOT NULL THEN
    UPDATE destekol."Campaign" SET "raisedAmount"=GREATEST(0,"raisedAmount"-delta) WHERE id=d."campaignId";
  END IF;
END $$;
REVOKE ALL ON FUNCTION destekol.record_donation_refund(text,text,text,numeric,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION destekol.record_donation_refund(text,text,text,numeric,text,text,text) TO service_role;
NOTIFY pgrst, 'reload schema';

