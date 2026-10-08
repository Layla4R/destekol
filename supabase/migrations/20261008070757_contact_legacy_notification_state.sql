ALTER TABLE destekol."ContactMessage" DROP CONSTRAINT "ContactMessage_notificationStatus_check";
ALTER TABLE destekol."ContactMessage" ADD CONSTRAINT "ContactMessage_notificationStatus_check" CHECK("notificationStatus" IN ('UNKNOWN','PENDING','SENDING','SENT','FAILED'));
UPDATE destekol."ContactMessage" SET "notificationStatus"='UNKNOWN' WHERE "trackingTokenHash" IS NULL AND "notificationStatus"='FAILED';
NOTIFY pgrst,'reload schema';
