ALTER TABLE destekol."PayTROrder"
 ADD COLUMN "merchantId" text,
 ADD COLUMN "merchantKeyEncrypted" text,
 ADD COLUMN "merchantSaltEncrypted" text;
NOTIFY pgrst,'reload schema';
