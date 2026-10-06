-- OPTIONAL: only after the owner chooses an existing administrator for Destekol.
-- In the same SQL Editor session, explicitly set the approved email before running:
-- SET app.destekol_admin_email = 'approved-admin@example.org';
-- This copies ONE approved ADMIN login. It does not copy staff memberships or donor history.
BEGIN;
DO $provision$
DECLARE approved_email text := current_setting('app.destekol_admin_email', true);
BEGIN
  IF approved_email IS NULL OR trim(approved_email) = '' THEN
    RAISE EXCEPTION 'Choose and set app.destekol_admin_email explicitly first';
  END IF;
  IF EXISTS (SELECT 1 FROM destekol."User" WHERE role::text='ADMIN') THEN
    RAISE EXCEPTION 'Destekol already has an administrator; use its staff management';
  END IF;
  IF (SELECT count(*) FROM public."User" WHERE lower(email)=lower(approved_email)
      AND role::text='ADMIN' AND "passwordHash" IS NOT NULL) <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one existing ADMIN with a password';
  END IF;
  INSERT INTO destekol."User" (name,email,"passwordHash",role,"isStaff","emailVerified")
    SELECT name,email,"passwordHash",role,false,"emailVerified"
    FROM public."User" WHERE lower(email)=lower(approved_email) AND role::text='ADMIN';
END;
$provision$;
COMMIT;
