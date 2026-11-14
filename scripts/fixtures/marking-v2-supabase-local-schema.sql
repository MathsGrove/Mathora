-- Disposable local Supabase Auth/Storage fixture. Never apply to production.
-- Uses REAL local Supabase auth.users; deliberately does not replace auth.uid().
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE public.organisations(
 id uuid PRIMARY KEY,
 name text NOT NULL
);
CREATE TABLE public.memberships(
 org_id uuid NOT NULL REFERENCES public.organisations(id),
 user_id uuid NOT NULL REFERENCES auth.users(id),
 member_role text NOT NULL,
 PRIMARY KEY(org_id,user_id)
);
CREATE TABLE public.student_entitlements(
 student_id uuid NOT NULL REFERENCES auth.users(id),
 org_id uuid NOT NULL REFERENCES public.organisations(id),
 tier text NOT NULL CHECK(tier IN('weekly','daily','exam')),
 starts_at timestamptz NOT NULL,
 ends_at timestamptz
);
CREATE TABLE public.learner_view_invitations(
 id uuid PRIMARY KEY,
 org_id uuid NOT NULL REFERENCES public.organisations(id),
 student_email text NOT NULL,
 viewer_email text NOT NULL,
 view_role text NOT NULL CHECK(view_role IN('parent','tutor')),
 expires_at timestamptz,
 revoked_at timestamptz
);
CREATE TABLE public.learner_view_links(
 invitation_id uuid NOT NULL REFERENCES public.learner_view_invitations(id),
 org_id uuid NOT NULL REFERENCES public.organisations(id),
 student_id uuid NOT NULL REFERENCES auth.users(id),
 viewer_id uuid NOT NULL REFERENCES auth.users(id),
 view_role text NOT NULL CHECK(view_role IN('parent','tutor')),
 active boolean NOT NULL
);
-- Stand-in for the existing product's staff-authorization predicate.
-- Only a real same-org examiner or admin qualifies; no tutor/student shortcuts.
CREATE FUNCTION private.is_staff(p_org uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.memberships m
  WHERE m.org_id=p_org AND m.user_id=auth.uid()
   AND m.member_role IN('examiner','admin')
 );
$$;
REVOKE ALL ON FUNCTION private.is_staff(uuid) FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;
-- This helper is called only inside privileged RPCs, never exposed to clients.
