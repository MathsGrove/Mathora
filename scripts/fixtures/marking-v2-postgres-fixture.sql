-- Disposable PostgreSQL CI fixture only; every identity and organisation is fictional.
-- The public/private/auth relations below are minimal stand-ins for connected MathsGrove.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA auth;
CREATE SCHEMA private;
CREATE TABLE auth.users(id uuid PRIMARY KEY,email text UNIQUE,email_confirmed_at timestamptz);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;
CREATE TABLE public.organisations(id uuid PRIMARY KEY,name text);
CREATE TABLE public.memberships(org_id uuid,user_id uuid,member_role text);
CREATE TABLE public.student_entitlements(student_id uuid,org_id uuid,tier text,starts_at timestamptz,ends_at timestamptz);
CREATE TABLE public.learner_view_invitations(id uuid PRIMARY KEY,org_id uuid,student_email text,viewer_email text,view_role text,expires_at timestamptz,revoked_at timestamptz);
CREATE TABLE public.learner_view_links(invitation_id uuid,org_id uuid,student_id uuid,viewer_id uuid,view_role text,active boolean);
CREATE FUNCTION private.is_staff(p_org uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.memberships m
   WHERE m.org_id=p_org AND m.user_id=auth.uid()
     AND m.member_role IN('partner','examiner','admin'));
$$;
GRANT USAGE ON SCHEMA public,auth,private TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid(),private.is_staff(uuid) TO authenticated;
-- Fictional organisation and Auth fixtures.
INSERT INTO public.organisations VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Fictional Grove A'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fictional Grove B');
INSERT INTO auth.users(id,email,email_confirmed_at) VALUES
('11111111-1111-4111-8111-111111111111','reviewer1@example.invalid',now()),
('22222222-2222-4222-8222-222222222222','reviewer2@example.invalid',now()),
('33333333-3333-4333-8333-333333333333','author@example.invalid',now()),
('44444444-4444-4444-8444-444444444444','student-a@example.invalid',now()),
('55555555-5555-4555-8555-555555555555','student-b@example.invalid',now()),
('66666666-6666-4666-8666-666666666666','parent@example.invalid',now()),
('77777777-7777-4777-8777-777777777777','tutor@example.invalid',now()),
('88888888-8888-4888-8888-888888888888','outsider@example.invalid',now()),
('99999999-9999-4999-8999-999999999999','other-org-examiner@example.invalid',now());
INSERT INTO public.memberships(org_id,user_id,member_role) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','examiner'),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222','examiner'),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','33333333-3333-4333-8333-333333333333','admin'),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444','student'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','55555555-5555-4555-8555-555555555555','student'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','99999999-9999-4999-8999-999999999999','examiner');
INSERT INTO public.student_entitlements VALUES
('44444444-4444-4444-8444-444444444444','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','exam',now()-interval '1 day',now()+interval '20 days');
INSERT INTO public.learner_view_invitations VALUES
('11110000-0000-4000-8000-000000000000','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','student-a@example.invalid','parent@example.invalid','parent',now()+interval '10 days',null),
('22220000-0000-4000-8000-000000000000','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','student-a@example.invalid','tutor@example.invalid','tutor',now()+interval '10 days',null);
INSERT INTO public.learner_view_links VALUES
('11110000-0000-4000-8000-000000000000','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444','66666666-6666-4666-8666-666666666666','parent',true),
('22220000-0000-4000-8000-000000000000','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444','77777777-7777-4777-8777-777777777777','tutor',true);
