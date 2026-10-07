BEGIN;
DO $$
DECLARE suffix text:=replace(gen_random_uuid()::text,'-',''); staff_id text; owner_email text; token_value text; result jsonb;
BEGIN
 IF has_table_privilege('anon','destekol."AdminAuditLog"','SELECT') OR has_table_privilege('authenticated','destekol."AdminAuditLog"','INSERT') OR has_table_privilege('service_role','destekol."AdminAuditLog"','UPDATE') OR has_table_privilege('service_role','destekol."AdminAuditLog"','DELETE') THEN RAISE EXCEPTION 'Audit permissions are unsafe'; END IF;
 IF has_function_privilege('anon','destekol.accept_staff_invite(text,text)','EXECUTE') THEN RAISE EXCEPTION 'Public invitation acceptance RPC'; END IF;
 INSERT INTO destekol."AdminInvite"(email,name,token,permissions,"invitedBy","expiresAt") VALUES('staff-'||suffix||'@example.invalid','Test Staff',suffix,ARRAY['messages.view','messages.sensitive.view'],'test-owner@example.invalid',now()+interval '1 hour');
 result:=destekol.accept_staff_invite(suffix,'test-fixture-hash');
 SELECT id INTO staff_id FROM destekol."User" WHERE email='staff-'||suffix||'@example.invalid' AND role='EDITOR' AND "isStaff"=true AND permissions=ARRAY['messages.view','messages.sensitive.view'];
 IF staff_id IS NULL OR result->>'name'<>'Test Staff' THEN RAISE EXCEPTION 'Invitation did not preserve explicit permissions'; END IF;
 IF NOT EXISTS(SELECT 1 FROM destekol."AdminAuditLog" WHERE "resourceId"=staff_id AND action='staff.invite.accept' AND outcome='SUCCESS') THEN RAISE EXCEPTION 'Acceptance not audited'; END IF;
 BEGIN
  PERFORM destekol.accept_staff_invite(suffix,'test-fixture-hash');
  RAISE EXCEPTION 'Replay was accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='Replay was accepted' THEN RAISE; END IF; END;
 owner_email:='owner-'||suffix||'@example.invalid';token_value:=suffix||'owner';
 INSERT INTO destekol."User"(name,email,"passwordHash",role,"isStaff") VALUES('Test Owner',owner_email,'unchanged-test-hash','ADMIN',false);
 INSERT INTO destekol."AdminInvite"(email,name,token,permissions,"invitedBy","expiresAt") VALUES(owner_email,'Invalid Owner Invite',token_value,ARRAY['messages.view'],'test@example.invalid',now()+interval '1 hour');
 BEGIN
  PERFORM destekol.accept_staff_invite(token_value,'replacement-test-hash');
  RAISE EXCEPTION 'Owner was overwritten';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='Owner was overwritten' THEN RAISE; END IF; END;
 IF EXISTS(SELECT 1 FROM destekol."User" WHERE email=owner_email AND "passwordHash"<>'unchanged-test-hash') THEN RAISE EXCEPTION 'Owner password changed'; END IF;
END $$;
ROLLBACK;
