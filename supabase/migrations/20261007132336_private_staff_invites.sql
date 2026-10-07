ALTER TABLE destekol."User" ADD COLUMN "invitedBy" text;
CREATE TABLE destekol."AdminInvite" (
 id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 email text NOT NULL UNIQUE,
 name text NOT NULL,
 token text NOT NULL UNIQUE,
 permissions text[] NOT NULL,
 "invitedBy" text NOT NULL,
 "expiresAt" timestamptz NOT NULL,
 "acceptedAt" timestamptz,
 "createdAt" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE destekol."AdminInvite" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON destekol."AdminInvite" FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON destekol."AdminInvite" TO service_role;
CREATE FUNCTION destekol.accept_staff_invite(p_token text,p_password_hash text) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,destekol AS $$
DECLARE invite destekol."AdminInvite"%ROWTYPE; staff_id text; actor_id text;
BEGIN
 SELECT * INTO invite FROM destekol."AdminInvite" WHERE token=p_token FOR UPDATE;
 IF NOT FOUND OR invite."acceptedAt" IS NOT NULL OR invite."expiresAt"<=now() THEN RAISE EXCEPTION 'Invalid or expired invitation'; END IF;
 IF EXISTS(SELECT 1 FROM destekol."User" WHERE lower(email)=invite.email AND role='ADMIN') THEN RAISE EXCEPTION 'Administrator cannot be replaced by invitation'; END IF;
 INSERT INTO destekol."User"(name,email,"passwordHash",role,"isStaff",permissions,"invitedBy","emailVerified")
 VALUES(invite.name,invite.email,p_password_hash,'EDITOR',true,invite.permissions,invite."invitedBy",true)
 ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name,"passwordHash"=EXCLUDED."passwordHash",role='EDITOR',"isStaff"=true,permissions=EXCLUDED.permissions,"invitedBy"=EXCLUDED."invitedBy","emailVerified"=true RETURNING id INTO staff_id;
 UPDATE destekol."AdminInvite" SET "acceptedAt"=now() WHERE id=invite.id;
 SELECT id INTO actor_id FROM destekol."User" WHERE email=invite."invitedBy";
 INSERT INTO destekol."AdminAuditLog"("actorId",action,outcome,"resourceId",site) VALUES(COALESCE(actor_id,staff_id),'staff.invite.accept','SUCCESS',staff_id,'destekol');
 RETURN jsonb_build_object('name',invite.name,'email',invite.email);
END $$;
REVOKE ALL ON FUNCTION destekol.accept_staff_invite(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION destekol.accept_staff_invite(text,text) TO service_role;
NOTIFY pgrst,'reload schema';
