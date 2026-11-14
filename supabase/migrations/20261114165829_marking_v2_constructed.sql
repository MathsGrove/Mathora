-- MathsGrove constructed-response v2: additive, atomic, empty initial bank.

-- Requires a verified current-project recovery point and two independent

-- qualified examiners to sign each approved original before assignment.

-- Generated from six audited staging SQL sources; no production data seeded.

-- Versioned by the Supabase CLI migration new command.

BEGIN;

SET LOCAL lock_timeout = '5s';

SET LOCAL statement_timeout = '90s';

-- Abort if a previous manual trial has already created v2 tables;

-- never write over a partially installed or undocumented live schema.

DO $$ BEGIN

 IF to_regclass('private.mg2_rubrics') IS NOT NULL THEN

  RAISE EXCEPTION 'Existing v2 rubric table found; investigate schema state before applying';

 END IF;

 IF to_regclass('public.memberships') IS NULL OR

    to_regclass('public.student_entitlements') IS NULL OR

    to_regclass('public.learner_view_links') IS NULL THEN

  RAISE EXCEPTION 'Current organisation membership, entitlement or linked-viewer schema is missing';

 END IF;

END $$;

-- BEGIN SOURCE: docs/staging/marking-v2-disposable-postgres.sql
-- MATHSGROVE EXPERIMENTAL CONSTRUCTED-RESPONSE MARKING V2
-- STAGING-ONLY: not an automatic migration, not applied to connected production.
-- Requires existing auth.users, public.organisations, public.memberships,
-- public.student_entitlements, public.learner_view_links/invitations and private.is_staff.
-- Run only on an isolated disposable Supabase/PostgreSQL project with fictional identities.
-- All privileged functions have an empty search_path, explicit caller checks,
-- and EXECUTE is denied to PUBLIC/anon by default.


CREATE TABLE private.mg2_rubrics (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 org_id uuid NOT NULL REFERENCES public.organisations(id),
 question_key text NOT NULL,
 version_no integer NOT NULL DEFAULT 1 CHECK(version_no>0),
 qualification text NOT NULL CHECK(qualification IN('GCSE','IGCSE','AS_A_LEVEL','Further Mathematics','IB')),
 academic_level text NOT NULL,
 exam_board text NOT NULL,
 syllabus_year text NOT NULL,
 plan text NOT NULL CHECK(plan IN('weekly','daily','exam')),
 question_prompt text NOT NULL,
 worked_solution text NOT NULL,
 -- No defaults: each original must have an actual recorded syllabus objective,
 -- authored source declaration and paper-specific calculator rule.
 -- The independently signed hash binds all three.
 syllabus_objective text NOT NULL,
 source_declaration text NOT NULL,
 calculator_rule text NOT NULL
   CHECK(calculator_rule IN ('allowed','not_allowed','paper_specific')),
 max_marks smallint NOT NULL CHECK(max_marks BETWEEN 1 AND 30),
 criteria jsonb NOT NULL CHECK(jsonb_typeof(criteria)='array'),
 authored_by uuid NOT NULL REFERENCES auth.users(id),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN('draft','approved')),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(org_id,question_key,version_no),
 UNIQUE(id,org_id)
);
CREATE TABLE private.mg2_signoffs (
 rubric_id uuid NOT NULL,
 org_id uuid NOT NULL,
 reviewer_id uuid NOT NULL REFERENCES auth.users(id),
 fingerprint text NOT NULL CHECK(fingerprint ~ '^[a-f0-9]{64}$'),
 reviewer_note text NOT NULL CHECK(length(btrim(reviewer_note))>=25),
 maths_checked boolean NOT NULL CHECK(maths_checked),
 syllabus_checked boolean NOT NULL CHECK(syllabus_checked),
 mark_scheme_checked boolean NOT NULL CHECK(mark_scheme_checked),
 signed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(rubric_id,reviewer_id),
 FOREIGN KEY(rubric_id,org_id) REFERENCES private.mg2_rubrics(id,org_id)
);
CREATE TABLE private.mg2_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 rubric_id uuid NOT NULL,
 org_id uuid NOT NULL REFERENCES public.organisations(id),
 student_id uuid NOT NULL REFERENCES auth.users(id),
 status text NOT NULL DEFAULT 'submitted' CHECK(status IN('submitted','released')),
 submitted_at timestamptz NOT NULL DEFAULT now(),
 released_at timestamptz,
 score smallint CHECK(score IS NULL OR score >= 0),
 FOREIGN KEY(rubric_id,org_id) REFERENCES private.mg2_rubrics(id,org_id),
 UNIQUE(id,rubric_id,org_id)
);
CREATE TABLE private.mg2_awards (
 attempt_id uuid NOT NULL,
 rubric_id uuid NOT NULL,
 org_id uuid NOT NULL,
 criterion_id text NOT NULL,
 code text NOT NULL CHECK(code IN('M1','A1','B1','R1')),
 awarded boolean NOT NULL,
 examiner_note text NOT NULL DEFAULT '',
 method_implied boolean NOT NULL DEFAULT false,
 implied_reason text NOT NULL DEFAULT '',
 examiner_id uuid NOT NULL REFERENCES auth.users(id),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(attempt_id,criterion_id),
 FOREIGN KEY(attempt_id,rubric_id,org_id) REFERENCES private.mg2_attempts(id,rubric_id,org_id),
 CHECK(NOT awarded OR length(btrim(examiner_note))>=8),
 CHECK(NOT method_implied OR (awarded AND length(btrim(implied_reason))>=15))
);
CREATE TABLE private.mg2_releases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 attempt_id uuid NOT NULL,
 rubric_id uuid NOT NULL,
 org_id uuid NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK(revision>=1),
 released_by uuid NOT NULL REFERENCES auth.users(id),
 earned smallint NOT NULL CHECK(earned>=0),
 possible smallint NOT NULL CHECK(possible BETWEEN 1 AND 30),
 student_summary text NOT NULL,
 parent_summary text NOT NULL,
 tutor_plan text NOT NULL,
 student_criteria jsonb NOT NULL,
 tutor_criteria jsonb NOT NULL,
 released_at timestamptz NOT NULL DEFAULT now(),
 CHECK(earned<=possible),
 UNIQUE(attempt_id,revision),
 FOREIGN KEY(attempt_id,rubric_id,org_id) REFERENCES private.mg2_attempts(id,rubric_id,org_id)
);

ALTER TABLE private.mg2_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.mg2_signoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.mg2_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.mg2_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.mg2_releases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.mg2_rubrics,private.mg2_signoffs,
 private.mg2_attempts,private.mg2_awards,private.mg2_releases
 FROM PUBLIC,anon,authenticated;

CREATE INDEX mg2_rubrics_org_idx ON private.mg2_rubrics(org_id,status);
CREATE INDEX mg2_attempts_student_idx ON private.mg2_attempts(student_id,submitted_at DESC);
CREATE INDEX mg2_attempts_org_idx ON private.mg2_attempts(org_id,status);
CREATE INDEX mg2_releases_attempt_idx ON private.mg2_releases(attempt_id,released_at DESC);

-- Any approved rubric, completed signoff, or released snapshot is append-only.
CREATE FUNCTION private.mg2_no_immutable_edits()
 RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
 BEGIN
  IF TG_TABLE_NAME='mg2_rubrics' THEN
   IF TG_OP='DELETE' AND OLD.status='approved' THEN RAISE EXCEPTION 'Approved rubrics are immutable';END IF;
   IF TG_OP='UPDATE' AND OLD.status='approved' THEN RAISE EXCEPTION 'Approved rubrics are immutable';END IF;
   IF TG_OP='UPDATE' AND NEW.status='approved'
      AND (to_jsonb(NEW)-'status')<>(to_jsonb(OLD)-'status')
   THEN RAISE EXCEPTION 'Approval may only change rubric status';END IF;
  ELSE
   RAISE EXCEPTION 'Moderation and release records are immutable';
  END IF;
  RETURN COALESCE(NEW,OLD);
 END $$;
CREATE TRIGGER mg2_rubric_lock BEFORE UPDATE OR DELETE ON private.mg2_rubrics
 FOR EACH ROW EXECUTE FUNCTION private.mg2_no_immutable_edits();
CREATE TRIGGER mg2_signoff_lock BEFORE UPDATE OR DELETE ON private.mg2_signoffs
 FOR EACH ROW EXECUTE FUNCTION private.mg2_no_immutable_edits();
CREATE TRIGGER mg2_release_lock BEFORE UPDATE OR DELETE ON private.mg2_releases
 FOR EACH ROW EXECUTE FUNCTION private.mg2_no_immutable_edits();

-- Canonical typed JSONB is unambiguous when question text includes separators,
-- quotes, null-like words or newlines. Never use concat_ws('|', text columns)
-- for an immutable rubric fingerprint: distinct field boundaries can collide.
-- Deliberately exclude mutable status; include identity, author and all marked content.
CREATE FUNCTION private.mg2_fingerprint(p_rubric private.mg2_rubrics)
 RETURNS text LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT encode(sha256(convert_to(
   jsonb_build_object(
     'id',p_rubric.id,'org_id',p_rubric.org_id,
     'question_key',p_rubric.question_key,'version_no',p_rubric.version_no,
     'qualification',p_rubric.qualification,'academic_level',p_rubric.academic_level,
     'exam_board',p_rubric.exam_board,'syllabus_year',p_rubric.syllabus_year,
     'plan',p_rubric.plan,'question_prompt',p_rubric.question_prompt,
     'worked_solution',p_rubric.worked_solution,
     'syllabus_objective',p_rubric.syllabus_objective,
     'source_declaration',p_rubric.source_declaration,
     'calculator_rule',p_rubric.calculator_rule,
     'max_marks',p_rubric.max_marks,
     'criteria',p_rubric.criteria,'authored_by',p_rubric.authored_by
   )::text,'UTF8')),'hex');
 $$;

CREATE FUNCTION private.mg2_validate_criteria(p_rubric private.mg2_rubrics)
 RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
 DECLARE i integer; c jsonb; prior text[]:=ARRAY[]::text[];
 dep text;code text;
 BEGIN
  IF jsonb_array_length(p_rubric.criteria)<>p_rubric.max_marks
     OR p_rubric.qualification='TMUA' OR length(btrim(p_rubric.worked_solution))<30
     OR length(btrim(p_rubric.question_prompt))<20
     OR length(btrim(p_rubric.syllabus_objective))<15
     OR length(btrim(p_rubric.source_declaration))<50
     OR p_rubric.calculator_rule NOT IN('allowed','not_allowed','paper_specific')
  THEN RAISE EXCEPTION 'Invalid original multi-mark rubric';END IF;
  FOR i IN 0..p_rubric.max_marks-1 LOOP
   c:=p_rubric.criteria->i;code:=c->>'code';
   IF jsonb_typeof(c)<>'object' OR (c->>'id') !~ '^[a-z][a-z0-9-]{1,70}$'
      OR c->>'id'=ANY(prior)
      OR length(coalesce(c->>'skill',''))<4
      OR length(coalesce(c->>'description',''))<10
      OR length(coalesce(c->>'missingFeedback',''))<15
      OR jsonb_typeof(c->'dependsOn') IS DISTINCT FROM 'array'
      OR code IS NULL OR code NOT IN('M1','A1','B1','R1')
   THEN RAISE EXCEPTION 'Invalid criterion metadata at position %',i+1;END IF;
   IF (p_rubric.qualification='IB' AND code='B1')
     OR (p_rubric.qualification<>'IB' AND code='R1')
   THEN RAISE EXCEPTION 'Mark notation mismatches qualification';END IF;
   IF code='A1' AND NOT EXISTS(
      SELECT 1 FROM jsonb_array_elements_text(c->'dependsOn') d
      WHERE d=ANY(prior) AND EXISTS(
       SELECT 1 FROM jsonb_array_elements(p_rubric.criteria) prev
       WHERE prev->>'id'=d AND prev->>'code'='M1'))
   THEN RAISE EXCEPTION 'Accuracy criterion must depend on an earlier method mark';END IF;
   FOR dep IN SELECT jsonb_array_elements_text(c->'dependsOn') LOOP
    IF NOT(dep=ANY(prior)) THEN RAISE EXCEPTION 'Unknown or forward criterion dependency';END IF;
   END LOOP;
   IF coalesce((c->>'allowImpliedMethod')::boolean,false) AND code<>'A1'
   THEN RAISE EXCEPTION 'Implied-method exception only applies to accuracy credit';END IF;
   prior:=array_append(prior,c->>'id');
  END LOOP;
 END $$;

-- Only active organisation examiners/admins can sign off, never the author.
-- Identity comes from auth.uid(), not client-supplied reviewer IDs.
CREATE FUNCTION public.mg2_signoff_rubric(p_rubric uuid,p_hash text,p_note text,
 p_maths_checked boolean,p_syllabus_checked boolean,p_mark_scheme_checked boolean)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
 DECLARE r private.mg2_rubrics%ROWTYPE; v_uid uuid:=auth.uid();v_hash text;v_count integer;
 BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign-in required';END IF;
  SELECT * INTO r FROM private.mg2_rubrics WHERE id=p_rubric FOR UPDATE;
  IF r.id IS NULL OR r.status<>'draft' OR r.authored_by=v_uid OR
    NOT EXISTS(SELECT 1 FROM public.memberships m WHERE m.org_id=r.org_id
      AND m.user_id=v_uid AND m.member_role IN('examiner','admin'))
  THEN RAISE EXCEPTION 'Independent examiner permission required';END IF;
  PERFORM private.mg2_validate_criteria(r);
  v_hash:=private.mg2_fingerprint(r);
  IF p_maths_checked IS DISTINCT FROM true OR p_syllabus_checked IS DISTINCT FROM true
   OR p_mark_scheme_checked IS DISTINCT FROM true
  THEN RAISE EXCEPTION 'Explicit mathematics, syllabus and mark-scheme checks required';END IF;
  IF p_hash IS DISTINCT FROM v_hash OR length(btrim(coalesce(p_note,'')))<25
  THEN RAISE EXCEPTION 'Exact rubric hash and substantive examiner note required';END IF;
  INSERT INTO private.mg2_signoffs(rubric_id,org_id,reviewer_id,fingerprint,reviewer_note,
    maths_checked,syllabus_checked,mark_scheme_checked)
  VALUES(r.id,r.org_id,v_uid,v_hash,p_note,true,true,true);
  SELECT count(*) INTO v_count FROM private.mg2_signoffs WHERE rubric_id=r.id AND fingerprint=v_hash;
  IF v_count>=2 THEN UPDATE private.mg2_rubrics SET status='approved' WHERE id=r.id;END IF;
  RETURN jsonb_build_object('approved',v_count>=2,'independent_reviewers',v_count);
 END $$;

-- Server recomputes every awarded point from the reviewed rubric. No caller total.
-- One full awards array per save, so no omitted/unknown question credit is possible.
CREATE FUNCTION public.mg2_staff_mark(p_attempt uuid,p_awards jsonb,p_release boolean,
 p_student_summary text DEFAULT '',p_parent_summary text DEFAULT '',p_tutor_plan text DEFAULT '')
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
 DECLARE a private.mg2_attempts%ROWTYPE;r private.mg2_rubrics%ROWTYPE;
 v_uid uuid:=auth.uid();v_fp text;v_index integer;v_rule jsonb;v_award jsonb;v_matches jsonb;
 v_id text;v_code text;v_points integer:=0;v_count integer;
 v_notes text;v_reason text;v_implied boolean;v_yes boolean;v_dep text;
 v_prev jsonb;v_student jsonb:='[]'::jsonb;v_tutor jsonb:='[]'::jsonb;v_unearned boolean;
 BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign-in required';END IF;
  IF p_release IS NULL THEN RAISE EXCEPTION 'Explicit release decision required';END IF;
  SELECT * INTO a FROM private.mg2_attempts WHERE id=p_attempt FOR UPDATE;
  IF a.id IS NULL OR a.status<>'submitted' OR NOT private.is_staff(a.org_id)
  THEN RAISE EXCEPTION 'Submitted attempt and authorised examiner required';END IF;
  SELECT * INTO r FROM private.mg2_rubrics WHERE id=a.rubric_id AND org_id=a.org_id;
  v_fp:=private.mg2_fingerprint(r);
  IF r.status<>'approved' OR
   (SELECT count(DISTINCT s.reviewer_id) FROM private.mg2_signoffs s
     WHERE s.rubric_id=r.id AND s.fingerprint=v_fp)<2
  THEN RAISE EXCEPTION 'Two valid examiner approvals required';END IF;
  IF jsonb_typeof(p_awards) IS DISTINCT FROM 'array' OR jsonb_array_length(p_awards)<>r.max_marks
  THEN RAISE EXCEPTION 'Exactly one marking decision per criterion required';END IF;
  PERFORM private.mg2_validate_criteria(r);
  FOR v_index IN 0..r.max_marks-1 LOOP
   v_rule:=r.criteria->v_index;v_id:=v_rule->>'id';v_code:=v_rule->>'code';
   SELECT count(*),jsonb_agg(value) INTO v_count,v_matches
    FROM jsonb_array_elements(p_awards) value WHERE value->>'id'=v_id;
   v_award:=v_matches->0;
   IF v_count<>1 OR jsonb_typeof(v_award->'awarded') IS DISTINCT FROM 'boolean'
     OR (v_award ? 'methodImplied' AND jsonb_typeof(v_award->'methodImplied') IS DISTINCT FROM 'boolean')
   THEN RAISE EXCEPTION 'Unknown, duplicate or missing examiner mark';END IF;
   v_yes:=(v_award->>'awarded')::boolean;
   v_notes:=btrim(coalesce(v_award->>'note',''));
   v_implied:=coalesce((v_award->>'methodImplied')::boolean,false);
   v_reason:=btrim(coalesce(v_award->>'impliedReason',''));
   IF (v_yes AND length(v_notes)<8) OR length(v_notes)>1000
   THEN RAISE EXCEPTION 'Examiner evidence notes are required for credit';END IF;
   IF v_implied AND (NOT v_yes OR v_code<>'A1'
      OR coalesce((v_rule->>'allowImpliedMethod')::boolean,false)=false
      OR length(v_reason)<15)
   THEN RAISE EXCEPTION 'Invalid implied-method exception';END IF;
   v_unearned:=false;
   IF v_yes THEN
    FOR v_dep IN SELECT jsonb_array_elements_text(v_rule->'dependsOn') LOOP
     SELECT value INTO v_prev FROM jsonb_array_elements(p_awards) value
      WHERE value->>'id'=v_dep;
     IF (v_prev->>'awarded')::boolean IS NOT TRUE THEN
      v_unearned:=true;
      IF NOT (v_implied AND v_code='A1' AND
        EXISTS(SELECT 1 FROM jsonb_array_elements(r.criteria) cr
          WHERE cr->>'id'=v_dep AND cr->>'code'='M1'))
      THEN RAISE EXCEPTION 'Dependent criterion cannot be awarded without prior method';END IF;
     END IF;
    END LOOP;
   END IF;
   IF v_implied AND NOT v_unearned THEN RAISE EXCEPTION 'Implied-method exception not needed when dependency is earned';END IF;
   v_points:=v_points+CASE WHEN v_yes THEN 1 ELSE 0 END;
   INSERT INTO private.mg2_awards(attempt_id,rubric_id,org_id,criterion_id,code,
    awarded,examiner_note,method_implied,implied_reason,examiner_id)
   VALUES(a.id,r.id,a.org_id,v_id,v_code,v_yes,v_notes,v_implied,v_reason,v_uid)
   ON CONFLICT(attempt_id,criterion_id) DO UPDATE
    SET awarded=EXCLUDED.awarded,examiner_note=EXCLUDED.examiner_note,
     method_implied=EXCLUDED.method_implied,implied_reason=EXCLUDED.implied_reason,
     examiner_id=EXCLUDED.examiner_id,updated_at=now();
   v_student:=v_student||jsonb_build_array(jsonb_build_object(
    'criterion',v_id,'code',v_code,'skill',v_rule->>'skill','awarded',v_yes,
    'nextPractice',CASE WHEN v_yes THEN 'Credit awarded in reviewed working.'
      ELSE v_rule->>'missingFeedback' END));
   v_tutor:=v_tutor||jsonb_build_array(jsonb_build_object(
    'criterion',v_id,'code',v_code,'skill',v_rule->>'skill','awarded',v_yes,
    'examinerEvidence',v_notes,'nextPractice',v_rule->>'missingFeedback'));
  END LOOP;
  -- Reject extra unknown awards not matched by the one-to-one array.
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_awards) x
    WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(r.criteria) c
      WHERE c->>'id'=x->>'id'))
  THEN RAISE EXCEPTION 'Unknown criterion identifier';END IF;
  IF p_release THEN
   IF p_release IS DISTINCT FROM true OR
     length(coalesce(p_student_summary,''))>3000 OR
     length(coalesce(p_parent_summary,''))>3000 OR
     length(coalesce(p_tutor_plan,''))>3000 OR
     length(btrim(coalesce(p_student_summary,'')))<15 OR
     length(btrim(coalesce(p_parent_summary,'')))<15 OR
     length(btrim(coalesce(p_tutor_plan,'')))<15
   THEN RAISE EXCEPTION 'Human-reviewed student, family and teaching summaries required';END IF;
   UPDATE private.mg2_attempts SET status='released',score=v_points,released_at=now()
     WHERE id=a.id;
   INSERT INTO private.mg2_releases(attempt_id,rubric_id,org_id,released_by,
    earned,possible,student_summary,parent_summary,tutor_plan,
    student_criteria,tutor_criteria)
   VALUES(a.id,r.id,a.org_id,v_uid,v_points,r.max_marks,
     p_student_summary,p_parent_summary,p_tutor_plan,v_student,v_tutor);
  END IF;
  RETURN jsonb_build_object('ok',true,'released',p_release,
    'earned',v_points,'possible',r.max_marks);
 END $$;

CREATE FUNCTION public.mg2_student_report(p_attempt uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
 DECLARE v jsonb;
 BEGIN
  SELECT jsonb_build_object('released',true,'earned',s.earned,'possible',s.possible,
    'summary',s.student_summary,'criteria',s.student_criteria,'released_at',s.released_at)
  INTO v
  FROM private.mg2_attempts a JOIN private.mg2_releases s ON s.attempt_id=a.id
  WHERE a.id=p_attempt AND a.student_id=auth.uid() AND a.status='released'
  ORDER BY s.revision DESC LIMIT 1;
  IF v IS NULL THEN RAISE EXCEPTION 'Released report not found';END IF;
  RETURN v;
 END $$;

-- Roles are rechecked on *every read*, including verified viewer email,
-- invitation revocation, student membership and active Grove Exam entitlement.
CREATE FUNCTION public.mg2_family_report(p_attempt uuid,p_role text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
 DECLARE v_uid uuid:=auth.uid();v_email text;v_role text;v jsonb;
 BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign-in required';END IF;
  IF p_role NOT IN('parent','tutor') OR p_role IS NULL THEN RAISE EXCEPTION 'Explicit parent or tutor audience required';END IF;
  SELECT lower(email) INTO v_email FROM auth.users
   WHERE id=v_uid AND email_confirmed_at IS NOT NULL;
  IF v_email IS NULL THEN RAISE EXCEPTION 'Verified email required';END IF;
  SELECT l.view_role INTO v_role FROM private.mg2_attempts a
   JOIN public.learner_view_links l ON l.student_id=a.student_id
     AND l.org_id=a.org_id AND l.viewer_id=v_uid AND l.active
   JOIN public.learner_view_invitations i ON i.id=l.invitation_id
     AND i.org_id=l.org_id AND i.revoked_at IS NULL
     AND i.view_role=l.view_role AND lower(i.viewer_email)=v_email
     AND (i.expires_at IS NULL OR i.expires_at>now())
   JOIN public.student_entitlements e ON e.student_id=a.student_id AND
     e.org_id=a.org_id AND e.tier='exam' AND e.starts_at<=now() AND
      (e.ends_at IS NULL OR e.ends_at>now())
   JOIN public.memberships m ON m.user_id=a.student_id AND m.org_id=a.org_id
     AND m.member_role='student'
   JOIN auth.users su ON su.id=a.student_id AND lower(su.email)=lower(i.student_email)
  WHERE a.id=p_attempt AND a.status='released' AND l.view_role=p_role
  LIMIT 1;
  IF v_role IS NULL THEN RAISE EXCEPTION 'Released linked-learner report not found';END IF;
  IF v_role='parent' THEN
   SELECT jsonb_build_object('released',true,'view_role','parent',
      'earned',s.earned,'possible',s.possible,'summary',s.parent_summary,
      'released_at',s.released_at)
   INTO v FROM private.mg2_releases s WHERE s.attempt_id=p_attempt
   ORDER BY s.revision DESC LIMIT 1;
  ELSE
   SELECT jsonb_build_object('released',true,'view_role','tutor',
      'earned',s.earned,'possible',s.possible,'teaching_plan',s.tutor_plan,
      'criteria',s.tutor_criteria,'released_at',s.released_at)
   INTO v FROM private.mg2_releases s WHERE s.attempt_id=p_attempt
   ORDER BY s.revision DESC LIMIT 1;
  END IF;
  IF v IS NULL THEN RAISE EXCEPTION 'Released linked-learner report not found';END IF;
  RETURN v;
 END $$;

REVOKE ALL ON FUNCTION private.mg2_fingerprint(private.mg2_rubrics),
 private.mg2_validate_criteria(private.mg2_rubrics),private.mg2_no_immutable_edits()
 FROM PUBLIC,anon,authenticated;

REVOKE ALL ON FUNCTION
 public.mg2_signoff_rubric(uuid,text,text,boolean,boolean,boolean),
 public.mg2_staff_mark(uuid,jsonb,boolean,text,text,text),
 public.mg2_student_report(uuid),
 public.mg2_family_report(uuid,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION
 public.mg2_signoff_rubric(uuid,text,text,boolean,boolean,boolean),
 public.mg2_staff_mark(uuid,jsonb,boolean,text,text,text),
 public.mg2_student_report(uuid),
 public.mg2_family_report(uuid,text)
 TO authenticated;
-- END SOURCE: docs/staging/marking-v2-disposable-postgres.sql

-- BEGIN SOURCE: docs/staging/marking-v2-learner-workflow.sql
-- MathsGrove v2 constructed-response LEARNER WORKFLOW — DISPOSABLE STAGING ONLY.
-- This extends marking-v2-disposable-postgres.sql on a fictitious test project.
-- It is NOT a production migration. No Storage policies or uploads here.
-- Existing Grove Weekly/Daily/Exam 0/1 marking remains entirely unchanged.


-- Existing pilot seeded attempts as submitted. New attempts begin as assigned.
ALTER TABLE private.mg2_attempts DROP CONSTRAINT mg2_attempts_status_check;
ALTER TABLE private.mg2_attempts ADD CONSTRAINT mg2_attempts_status_check
 CHECK (status IN ('assigned','submitted','released'));
ALTER TABLE private.mg2_attempts ALTER COLUMN status SET DEFAULT 'assigned';
ALTER TABLE private.mg2_attempts ALTER COLUMN submitted_at DROP DEFAULT;
ALTER TABLE private.mg2_attempts ADD COLUMN assigned_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE private.mg2_attempts ALTER COLUMN submitted_at DROP NOT NULL;
ALTER TABLE private.mg2_attempts ADD CONSTRAINT mg2_attempts_submission_consistency
 CHECK (
   (status='assigned' AND submitted_at IS NULL AND released_at IS NULL AND score IS NULL)
   OR
   (status='submitted' AND submitted_at IS NOT NULL AND released_at IS NULL)
   OR
   (status='released' AND submitted_at IS NOT NULL AND released_at IS NOT NULL AND score IS NOT NULL)
 );
-- Do not repeat the exact versioned paper with the same student.
CREATE UNIQUE INDEX mg2_one_attempt_per_rubric_student
 ON private.mg2_attempts(rubric_id,student_id);

CREATE TABLE private.mg2_student_work (
 attempt_id uuid NOT NULL,
 rubric_id uuid NOT NULL,
 org_id uuid NOT NULL,
 written_work text NOT NULL DEFAULT '',
 revision integer NOT NULL DEFAULT 1 CHECK (revision >= 1),
 saved_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(attempt_id),
 FOREIGN KEY(attempt_id,rubric_id,org_id)
  REFERENCES private.mg2_attempts(id,rubric_id,org_id),
 CHECK (char_length(written_work) <= 12000)
);
ALTER TABLE private.mg2_student_work ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.mg2_student_work FROM PUBLIC,anon,authenticated;

-- The only accepted student answer in this pilot is *typed mathematical working*.
-- Locked final submissions may never be altered (even by a privileged manual UPDATE).
CREATE FUNCTION private.mg2_lock_submitted_work()
 RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF TG_OP='DELETE' OR EXISTS (
  SELECT 1 FROM private.mg2_attempts a
  WHERE a.id=OLD.attempt_id AND a.status<>'assigned'
 ) THEN
  RAISE EXCEPTION 'Submitted mathematical work is immutable';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER mg2_work_lock BEFORE UPDATE OR DELETE
 ON private.mg2_student_work FOR EACH ROW
 EXECUTE FUNCTION private.mg2_lock_submitted_work();

-- Commercial plans are distinct from academic qualifications:
-- Weekly = weekly; Daily = weekly+daily; Exam = weekly+daily+exam.
CREATE FUNCTION private.mg2_has_active_student_plan(
 p_student uuid,p_org uuid,p_plan text
) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS (
  SELECT 1 FROM public.memberships m
  JOIN public.student_entitlements e
   ON e.student_id=m.user_id AND e.org_id=m.org_id
  WHERE m.user_id=p_student AND m.org_id=p_org AND m.member_role='student'
   AND e.starts_at <= now() AND (e.ends_at IS NULL OR e.ends_at > now())
   AND (
    (p_plan='weekly' AND e.tier IN ('weekly','daily','exam'))
    OR (p_plan='daily' AND e.tier IN ('daily','exam'))
    OR (p_plan='exam' AND e.tier='exam')
   )
 );
$$;

-- Assign an independently signed-off version to an enrolled student.
-- The caller cannot supply org, examiner, marks, or a question key.
-- The rubric and signoff tables are always private.
CREATE FUNCTION public.mg2_assign_constructed(p_rubric uuid,p_student uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r private.mg2_rubrics%ROWTYPE;v_hash text;v_id uuid;v_user uuid:=auth.uid();
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Authenticated staff required';END IF;
 SELECT * INTO r FROM private.mg2_rubrics WHERE id=p_rubric FOR SHARE;
 IF r.id IS NULL OR r.status<>'approved' OR
    NOT private.is_staff(r.org_id)
 THEN RAISE EXCEPTION 'Approved rubric and authorised staff required';END IF;
 IF NOT private.mg2_has_active_student_plan(p_student,r.org_id,r.plan)
 THEN RAISE EXCEPTION 'Enrolled learner and qualifying active programme required';END IF;
 v_hash:=private.mg2_fingerprint(r);
 IF (SELECT count(DISTINCT s.reviewer_id) FROM private.mg2_signoffs s
     WHERE s.rubric_id=r.id AND s.fingerprint=v_hash
       AND s.maths_checked AND s.syllabus_checked AND s.mark_scheme_checked)<2
 THEN RAISE EXCEPTION 'Independent approved examiners required';END IF;
 INSERT INTO private.mg2_attempts(rubric_id,org_id,student_id,status,submitted_at)
 VALUES(r.id,r.org_id,p_student,'assigned',NULL)
 RETURNING id INTO v_id;
 RETURN jsonb_build_object('attempt_id',v_id,'status','assigned',
  'plan',r.plan,'qualification',r.qualification);
END $$;

-- Student sees prompt and own draft only; never worked solution or award criteria.
-- Require live role + entitlement on every student read.
CREATE FUNCTION public.mg2_my_constructed(p_attempt uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign-in required';END IF;
 SELECT jsonb_build_object(
   'attempt_id',a.id,'status',a.status,'question',r.question_prompt,
   'qualification',r.qualification,'academic_level',r.academic_level,
   'exam_board',r.exam_board,'plan',r.plan,'max_marks',r.max_marks,
   'written_work',coalesce(w.written_work,''),'revision',w.revision,
   'submitted_at',a.submitted_at
 ) INTO v
 FROM private.mg2_attempts a JOIN private.mg2_rubrics r
  ON r.id=a.rubric_id AND r.org_id=a.org_id
 LEFT JOIN private.mg2_student_work w ON w.attempt_id=a.id
 WHERE a.id=p_attempt AND a.student_id=auth.uid()
   AND private.mg2_has_active_student_plan(a.student_id,a.org_id,r.plan);
 IF v IS NULL THEN RAISE EXCEPTION 'Assigned work not available to this learner';END IF;
 RETURN v;
END $$;

-- One atomic save/submit with optimistic revision enforcement. No mark computed.
-- NULL expected_revision is only allowed for the initial save.
-- Once submitted, a concurrent tab cannot overwrite or re-submit old working.
CREATE FUNCTION public.mg2_save_constructed(
 p_attempt uuid,p_work text,p_expected_revision integer,p_submit boolean
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a private.mg2_attempts%ROWTYPE;r private.mg2_rubrics%ROWTYPE;
 v_revision integer;v_new_revision integer;v_text text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign-in required';END IF;
 IF p_submit IS NULL OR p_work IS NULL OR char_length(p_work)>12000
 THEN RAISE EXCEPTION 'Explicit submit decision and working text required';END IF;
 IF p_expected_revision IS NOT NULL AND p_expected_revision<1
 THEN RAISE EXCEPTION 'Invalid saved-work revision';END IF;
 SELECT * INTO a FROM private.mg2_attempts WHERE id=p_attempt FOR UPDATE;
 IF a.id IS NULL OR a.student_id IS DISTINCT FROM auth.uid()
    OR a.status<>'assigned'
 THEN RAISE EXCEPTION 'Only the assigned learner can edit an unsubmitted response';END IF;
 SELECT * INTO r FROM private.mg2_rubrics WHERE id=a.rubric_id AND org_id=a.org_id;
 IF r.status<>'approved' OR
    NOT private.mg2_has_active_student_plan(a.student_id,a.org_id,r.plan)
 THEN RAISE EXCEPTION 'Active approved learner assignment required';END IF;
 v_text:=p_work;
 IF p_submit AND char_length(btrim(v_text))<30
 THEN RAISE EXCEPTION 'Show at least 30 characters of mathematical working';END IF;
 SELECT revision INTO v_revision FROM private.mg2_student_work
  WHERE attempt_id=a.id FOR UPDATE;
 IF v_revision IS DISTINCT FROM p_expected_revision
 THEN RAISE EXCEPTION 'Stale answer revision; reload saved working before retrying';END IF;
 IF v_revision IS NULL THEN
  INSERT INTO private.mg2_student_work(attempt_id,rubric_id,org_id,written_work)
   VALUES(a.id,r.id,a.org_id,v_text)
  RETURNING revision INTO v_new_revision;
 ELSE
  UPDATE private.mg2_student_work
   SET written_work=v_text,revision=v_revision+1,saved_at=now()
   WHERE attempt_id=a.id RETURNING revision INTO v_new_revision;
 END IF;
 IF p_submit THEN
  UPDATE private.mg2_attempts SET status='submitted',submitted_at=now()
   WHERE id=a.id;
 END IF;
 RETURN jsonb_build_object('ok',true,
   'status',CASE WHEN p_submit THEN 'submitted' ELSE 'assigned' END,
   'revision',v_new_revision,'submitted',p_submit);
END $$;

-- Private examiner-only read AFTER real student submission.
-- Full rubric + solution may only be returned to active staff in the same org.
CREATE FUNCTION public.mg2_examiner_constructed(p_attempt uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign-in required';END IF;
 SELECT jsonb_build_object(
   'attempt_id',a.id,'student_id',a.student_id,
   'status',a.status,'question',r.question_prompt,
   'worked_solution',r.worked_solution,'criteria',r.criteria,
   'max_marks',r.max_marks,'qualification',r.qualification,
   'academic_level',r.academic_level,'board',r.exam_board,
   'written_work',w.written_work,'submitted_at',a.submitted_at
 ) INTO v
 FROM private.mg2_attempts a
 JOIN private.mg2_rubrics r ON r.id=a.rubric_id AND r.org_id=a.org_id
 JOIN private.mg2_student_work w ON w.attempt_id=a.id
 WHERE a.id=p_attempt AND a.status IN ('submitted','released')
   AND private.is_staff(a.org_id);
 IF v IS NULL THEN RAISE EXCEPTION 'Submitted examiner record unavailable';END IF;
 RETURN v;
END $$;

-- Functions may be public-schema API endpoints, but no anonymous caller may invoke.
REVOKE ALL ON FUNCTION
 public.mg2_assign_constructed(uuid,uuid),
 public.mg2_my_constructed(uuid),
 public.mg2_save_constructed(uuid,text,integer,boolean),
 public.mg2_examiner_constructed(uuid)
 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION
 private.mg2_lock_submitted_work(),
 private.mg2_has_active_student_plan(uuid,uuid,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION
 public.mg2_assign_constructed(uuid,uuid),
 public.mg2_my_constructed(uuid),
 public.mg2_save_constructed(uuid,text,integer,boolean),
 public.mg2_examiner_constructed(uuid)
 TO authenticated;
-- END SOURCE: docs/staging/marking-v2-learner-workflow.sql

-- BEGIN SOURCE: docs/staging/marking-v2-examiner-queue.sql
-- MathsGrove v2 examiner productivity RPCs (STAGING ONLY).
-- Extends docs/staging/marking-v2-disposable-postgres.sql and
-- docs/staging/marking-v2-learner-workflow.sql.
-- No direct Data API table access; authenticated staff is rechecked on EACH read.


CREATE INDEX mg2_examiner_submitted_queue_idx
 ON private.mg2_attempts (org_id,submitted_at,id)
 WHERE status='submitted';

-- The first examiner owns the private draft. Other authorised staff can
-- inspect it but may not silently replace another examiner's awards.
-- Explicit audited reassignment must be a separate later admin workflow.
CREATE FUNCTION private.mg2_no_cross_examiner_overwrite()
 RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF OLD.examiner_id IS DISTINCT FROM auth.uid() THEN
  RAISE EXCEPTION 'Another examiner owns these saved mark decisions; request supervised reassignment';
 END IF;
 IF NEW.examiner_id IS DISTINCT FROM OLD.examiner_id OR
    NEW.attempt_id IS DISTINCT FROM OLD.attempt_id OR
    NEW.rubric_id IS DISTINCT FROM OLD.rubric_id OR
    NEW.org_id IS DISTINCT FROM OLD.org_id OR
    NEW.criterion_id IS DISTINCT FROM OLD.criterion_id OR
    NEW.code IS DISTINCT FROM OLD.code
 THEN RAISE EXCEPTION 'Award identity fields cannot change';END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER mg2_award_examiner_lock BEFORE UPDATE
 ON private.mg2_awards FOR EACH ROW
 EXECUTE FUNCTION private.mg2_no_cross_examiner_overwrite();
REVOKE ALL ON FUNCTION private.mg2_no_cross_examiner_overwrite()
 FROM PUBLIC,anon,authenticated;

-- Triage only. Do not return the student's text, account email, private
-- marking criteria, or the worked solution in queue summaries.
CREATE FUNCTION public.mg2_examiner_queue(
 p_limit integer DEFAULT 20,p_offset integer DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();v_total integer;v_rows jsonb;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign-in required';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.memberships m WHERE m.user_id=v_uid
   AND m.member_role IN('examiner','admin') AND private.is_staff(m.org_id))
 THEN RAISE EXCEPTION 'Examiner permission required';END IF;
 IF p_limit IS NULL OR p_limit<1 OR p_limit>50
    OR p_offset IS NULL OR p_offset<0 OR p_offset>10000
 THEN RAISE EXCEPTION 'Queue limit or offset outside allowed range';END IF;

 SELECT count(*) INTO v_total
 FROM private.mg2_attempts a
 JOIN public.memberships m ON m.org_id=a.org_id AND m.user_id=v_uid
   AND m.member_role IN('examiner','admin')
 WHERE a.status='submitted' AND private.is_staff(a.org_id);

 SELECT coalesce(jsonb_agg(jsonb_build_object(
    'attempt_id',q.attempt_id,
    'qualification',q.qualification,
    'academic_level',q.academic_level,
    'topic',q.question_key,
    'submitted_at',q.submitted_at,
    'possible',q.max_marks,
    'decisions_recorded',q.decisions_recorded,
    'marks_awarded',q.marks_awarded
  ) ORDER BY q.submitted_at,q.attempt_id),'[]'::jsonb)
 INTO v_rows
 FROM (
  SELECT a.id AS attempt_id,r.qualification,r.academic_level,
   r.question_key,a.submitted_at,r.max_marks,
   (SELECT count(*) FROM private.mg2_awards aw
     WHERE aw.attempt_id=a.id)::integer AS decisions_recorded,
   (SELECT count(*) FROM private.mg2_awards aw
     WHERE aw.attempt_id=a.id AND aw.awarded)::integer AS marks_awarded
  FROM private.mg2_attempts a
  JOIN public.memberships m ON m.org_id=a.org_id AND m.user_id=v_uid
    AND m.member_role IN('examiner','admin')
  JOIN private.mg2_rubrics r ON r.id=a.rubric_id AND r.org_id=a.org_id
  WHERE a.status='submitted' AND private.is_staff(a.org_id)
  ORDER BY a.submitted_at,a.id LIMIT p_limit OFFSET p_offset
 ) q;
 RETURN jsonb_build_object('items',v_rows,'total',v_total,
  'limit',p_limit,'offset',p_offset);
END $$;

-- Recover a saved, unsubmitted staff marking draft after refresh.
-- Includes the staff-only notes; it must never be called from a student,
-- guardian, general learner report, or an unauthorised org.
CREATE FUNCTION public.mg2_examiner_saved_marks(p_attempt uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();v_result jsonb;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign-in required';END IF;
 SELECT jsonb_build_object(
   'attempt_id',a.id,
   'possible',r.max_marks,
   'recorded',count(aw.criterion_id),
   'complete',count(aw.criterion_id)=r.max_marks,
   'awards',coalesce(jsonb_agg(jsonb_build_object(
     'id',aw.criterion_id,
     'code',aw.code,
     'awarded',aw.awarded,
     'note',aw.examiner_note,
     'methodImplied',aw.method_implied,
     'impliedReason',aw.implied_reason,
     'examinerId',aw.examiner_id,
     'updatedAt',aw.updated_at
   ) ORDER BY aw.criterion_id)
    FILTER (WHERE aw.criterion_id IS NOT NULL),'[]'::jsonb)
 ) INTO v_result
 FROM private.mg2_attempts a
 JOIN private.mg2_rubrics r ON r.id=a.rubric_id AND r.org_id=a.org_id
 JOIN public.memberships m ON m.org_id=a.org_id AND m.user_id=v_uid
   AND m.member_role IN('examiner','admin')
 LEFT JOIN private.mg2_awards aw ON aw.attempt_id=a.id
 WHERE a.id=p_attempt AND a.status='submitted'
   AND private.is_staff(a.org_id)
 GROUP BY a.id,r.max_marks;
 IF v_result IS NULL THEN RAISE EXCEPTION 'Submitted examiner draft unavailable';END IF;
 RETURN v_result;
END $$;

-- Default to zero API access for privileged endpoints; regrant only to a
-- signed-in role. Function bodies perform actual organisation authorisation.
REVOKE ALL ON FUNCTION
 public.mg2_examiner_queue(integer,integer),
 public.mg2_examiner_saved_marks(uuid)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION
 public.mg2_examiner_queue(integer,integer),
 public.mg2_examiner_saved_marks(uuid)
 TO authenticated;
-- END SOURCE: docs/staging/marking-v2-examiner-queue.sql

-- BEGIN SOURCE: docs/staging/marking-v2-moderation-queue.sql
-- MathsGrove independent question-review inbox, disposable Supabase staging ONLY.
-- The author cannot self-review, and each examiner can sign a rubric only once.
-- Returning a fingerprint does not itself approve or publish the question.

CREATE INDEX mg2_unmoderated_rubric_queue_idx
 ON private.mg2_rubrics (org_id,created_at,id) WHERE status='draft';

CREATE FUNCTION public.mg2_examiner_moderation_queue(
 p_limit integer DEFAULT 20,p_offset integer DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();v_total integer;v_items jsonb;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign-in required';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.memberships m
   WHERE m.user_id=v_uid AND m.member_role IN('examiner','admin')
      AND private.is_staff(m.org_id))
 THEN RAISE EXCEPTION 'Independent maths-review permission required';END IF;
 IF p_limit IS NULL OR p_limit<1 OR p_limit>50 OR
    p_offset IS NULL OR p_offset<0 OR p_offset>10000
 THEN RAISE EXCEPTION 'Invalid moderation inbox pagination';END IF;
 SELECT count(*) INTO v_total
 FROM private.mg2_rubrics r
 JOIN public.memberships m ON m.org_id=r.org_id AND m.user_id=v_uid
   AND m.member_role IN('examiner','admin')
 WHERE r.status='draft' AND r.authored_by<>v_uid
   AND private.is_staff(r.org_id)
   AND NOT EXISTS(SELECT 1 FROM private.mg2_signoffs s
     WHERE s.rubric_id=r.id AND s.reviewer_id=v_uid);
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'rubric_id',q.id,
  'qualification',q.qualification,
  'academic_level',q.academic_level,
  'board',q.exam_board,'syllabus_year',q.syllabus_year,
  'question_key',q.question_key,
  'question',q.question_prompt,
  'worked_solution',q.worked_solution,
  'criteria',q.criteria,
  'max_marks',q.max_marks,
  'plan',q.plan,
  'calculator_rule',q.calculator_rule,
  'syllabus_objective',q.syllabus_objective,
  'source_declaration',q.source_declaration,
  'fingerprint',q.fingerprint,
  'independent_reviews',q.review_count
  ) ORDER BY q.created_at,q.id),'[]'::jsonb) INTO v_items
 FROM(
  SELECT r.id,r.question_key,r.qualification,r.academic_level,
    r.exam_board,r.syllabus_year,r.question_prompt,r.worked_solution,
    r.criteria,r.max_marks,r.plan,r.created_at,
    r.calculator_rule,r.syllabus_objective,r.source_declaration,
    private.mg2_fingerprint(r) AS fingerprint,
    (SELECT count(*) FROM private.mg2_signoffs s
     WHERE s.rubric_id=r.id
      AND s.fingerprint=private.mg2_fingerprint(r))::integer AS review_count
  FROM private.mg2_rubrics r
  JOIN public.memberships m ON m.org_id=r.org_id AND m.user_id=v_uid
   AND m.member_role IN('examiner','admin')
  WHERE r.status='draft' AND r.authored_by<>v_uid
   AND private.is_staff(r.org_id)
   AND NOT EXISTS(SELECT 1 FROM private.mg2_signoffs s
     WHERE s.rubric_id=r.id AND s.reviewer_id=v_uid)
  ORDER BY r.created_at,r.id
  LIMIT p_limit OFFSET p_offset
 ) q;
 RETURN jsonb_build_object('items',v_items,'total',v_total,
  'limit',p_limit,'offset',p_offset);
END $$;
REVOKE ALL ON FUNCTION public.mg2_examiner_moderation_queue(integer,integer)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mg2_examiner_moderation_queue(integer,integer)
 TO authenticated;
-- END SOURCE: docs/staging/marking-v2-moderation-queue.sql

-- BEGIN SOURCE: docs/staging/marking-v2-operational-interfaces.sql
-- Staging-only MathsGrove V2 operational authoring, inventory & student list.
-- Does not change existing live mark records; requires prior draft stack.


-- Reviewable ORIGINAL questions are created by authenticated staff, with
-- actual author recorded from auth.uid(), never from a browser field.
CREATE FUNCTION public.mg2_author_original_draft(
 p_org uuid,p_question_key text,p_qualification text,p_academic_level text,
 p_exam_board text,p_syllabus_year text,p_plan text,p_calculator_rule text,
 p_syllabus_objective text,p_source_declaration text,
 p_question_prompt text,p_worked_solution text,p_criteria jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid;v_row private.mg2_rubrics%ROWTYPE;
 v_version integer;v_uid uuid:=auth.uid();
BEGIN
 IF v_uid IS NULL OR NOT private.is_staff(p_org) OR
   NOT EXISTS(SELECT 1 FROM public.memberships m
    WHERE m.user_id=v_uid AND m.org_id=p_org
      AND m.member_role IN ('admin','examiner','partner'))
 THEN RAISE EXCEPTION 'Authorised organisation examiner/administrator required';END IF;
 IF p_question_key IS NULL OR p_question_key !~ '^[a-z][a-z0-9-]{5,80}$'
  OR p_qualification IS NULL OR p_qualification NOT IN
   ('GCSE','IGCSE','AS_A_LEVEL','Further Mathematics','IB')
  OR p_plan IS NULL OR p_plan NOT IN ('weekly','daily','exam')
  OR p_calculator_rule IS NULL OR
      p_calculator_rule NOT IN('allowed','not_allowed','paper_specific')
  OR p_exam_board IS NULL OR length(btrim(p_exam_board)) NOT BETWEEN 3 AND 120
  OR p_syllabus_year IS NULL OR p_syllabus_year !~ '^20[0-9]{2}$'
  OR p_syllabus_objective IS NULL OR length(btrim(p_syllabus_objective)) NOT BETWEEN 15 AND 1000
  OR p_source_declaration IS NULL OR length(btrim(p_source_declaration)) NOT BETWEEN 50 AND 2000
  OR p_question_prompt IS NULL OR length(btrim(p_question_prompt)) NOT BETWEEN 40 AND 5000
  OR p_worked_solution IS NULL OR length(btrim(p_worked_solution)) NOT BETWEEN 50 AND 10000
  OR p_criteria IS NULL OR pg_catalog.jsonb_typeof(p_criteria)<>'array'
  OR pg_catalog.jsonb_array_length(p_criteria) NOT BETWEEN 1 AND 30
 THEN RAISE EXCEPTION 'Original question provenance, board/year, marking criteria and complete solution required';END IF;
 IF NOT(
  (p_qualification='GCSE' AND p_academic_level IN('Foundation','Higher'))
  OR (p_qualification='IGCSE' AND p_academic_level IN('Core','Extended'))
  OR (p_qualification IN('AS_A_LEVEL','Further Mathematics') AND p_academic_level IN('AS','A Level'))
  OR (p_qualification='IB' AND p_academic_level IN('AA SL','AA HL','AI SL','AI HL'))
 ) THEN RAISE EXCEPTION 'Qualification and academic level mismatch';END IF;
 -- Prevent simultaneous authors creating the same numbered version.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_org::text||':'||p_question_key,27));
 SELECT coalesce(max(version_no),0)+1 INTO v_version
  FROM private.mg2_rubrics WHERE org_id=p_org AND question_key=p_question_key;
 INSERT INTO private.mg2_rubrics(
  org_id,question_key,version_no,qualification,academic_level,exam_board,
  syllabus_year,plan,question_prompt,worked_solution,max_marks,criteria,
  authored_by,status,syllabus_objective,source_declaration,calculator_rule
 ) VALUES (
  p_org,p_question_key,v_version,p_qualification,p_academic_level,
  btrim(p_exam_board),p_syllabus_year,p_plan,btrim(p_question_prompt),
  btrim(p_worked_solution),pg_catalog.jsonb_array_length(p_criteria),
  p_criteria,v_uid,'draft',btrim(p_syllabus_objective),
  btrim(p_source_declaration),p_calculator_rule
 ) RETURNING * INTO v_row;
 PERFORM private.mg2_validate_criteria(v_row);
 RETURN jsonb_build_object('rubric_id',v_row.id,'version_no',v_row.version_no,
  'status','draft','fingerprint',private.mg2_fingerprint(v_row),
  'needs_independent_examiners',2);
END $$;

-- Approved inventory is examiner-readable metadata, not worked solutions.
-- This can be used in the existing private Studio assignment form.
CREATE FUNCTION public.mg2_assignable_originals(p_limit integer DEFAULT 30,p_offset integer DEFAULT 0)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();v_rows jsonb;v_total integer;
BEGIN
 IF v_uid IS NULL OR NOT EXISTS(
  SELECT 1 FROM public.memberships m
  WHERE m.user_id=v_uid AND m.member_role IN('admin','examiner','partner')
    AND private.is_staff(m.org_id))
 THEN RAISE EXCEPTION 'Examiner inventory access required';END IF;
 IF p_limit IS NULL OR p_limit<1 OR p_limit>50 OR
    p_offset IS NULL OR p_offset<0 OR p_offset>10000
 THEN RAISE EXCEPTION 'Invalid inventory pagination';END IF;
 SELECT count(*) INTO v_total FROM private.mg2_rubrics r
  JOIN public.memberships m ON m.org_id=r.org_id AND m.user_id=v_uid
    AND m.member_role IN('admin','examiner','partner')
  WHERE r.status='approved' AND private.is_staff(r.org_id)
    AND (SELECT count(DISTINCT s.reviewer_id)
         FROM private.mg2_signoffs s
         WHERE s.rubric_id=r.id AND s.fingerprint=private.mg2_fingerprint(r)
          AND s.maths_checked AND s.syllabus_checked AND s.mark_scheme_checked)>=2;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'rubric_id',t.id,'question_key',t.question_key,'version_no',t.version_no,
  'qualification',t.qualification,'academic_level',t.academic_level,
  'exam_board',t.exam_board,'syllabus_year',t.syllabus_year,
  'plan',t.plan,'calculator_rule',t.calculator_rule,
  'max_marks',t.max_marks,'syllabus_objective',t.syllabus_objective
 ) ORDER BY t.question_key,t.version_no),'[]'::jsonb) INTO v_rows
 FROM (
  SELECT r.* FROM private.mg2_rubrics r
  JOIN public.memberships m ON m.org_id=r.org_id AND m.user_id=v_uid
    AND m.member_role IN('admin','examiner','partner')
  WHERE r.status='approved' AND private.is_staff(r.org_id)
    AND (SELECT count(DISTINCT s.reviewer_id)
         FROM private.mg2_signoffs s
         WHERE s.rubric_id=r.id AND s.fingerprint=private.mg2_fingerprint(r)
          AND s.maths_checked AND s.syllabus_checked AND s.mark_scheme_checked)>=2
  ORDER BY r.question_key,r.version_no LIMIT p_limit OFFSET p_offset
 ) t;
 RETURN jsonb_build_object('items',v_rows,'total',v_total,
  'limit',p_limit,'offset',p_offset);
END $$;

-- Learners can discover their own assignments without knowing opaque UUIDs.
-- No answers, criterion keys, or other learners' records are returned.
CREATE FUNCTION public.mg2_my_original_assignments(p_limit integer DEFAULT 30,p_offset integer DEFAULT 0)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();v_rows jsonb;v_total integer;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign-in required';END IF;
 IF p_limit IS NULL OR p_limit<1 OR p_limit>50 OR
    p_offset IS NULL OR p_offset<0 OR p_offset>10000
 THEN RAISE EXCEPTION 'Invalid assignment pagination';END IF;
 SELECT count(*) INTO v_total
  FROM private.mg2_attempts a JOIN private.mg2_rubrics r
    ON r.id=a.rubric_id AND r.org_id=a.org_id
  JOIN public.memberships m ON m.org_id=a.org_id
   AND m.user_id=v_uid AND m.member_role='student'
  WHERE a.student_id=v_uid AND
    (a.status='released' OR private.mg2_has_active_student_plan(v_uid,a.org_id,r.plan));
 SELECT coalesce(jsonb_agg(jsonb_build_object(
   'attempt_id',q.id,'status',q.status,'question_key',q.question_key,
   'qualification',q.qualification,'academic_level',q.academic_level,
   'plan',q.plan,'max_marks',q.max_marks,
   'assigned_at',q.assigned_at,'submitted_at',q.submitted_at,'released_at',q.released_at,
   'earned',CASE WHEN q.status='released' THEN q.score ELSE NULL END
  ) ORDER BY q.created_time DESC,q.id),'[]'::jsonb) INTO v_rows
 FROM (
  SELECT a.id,a.status,a.assigned_at,a.submitted_at,a.released_at,a.score,
   r.question_key,r.qualification,r.academic_level,r.plan,r.max_marks,
   coalesce(a.submitted_at,a.assigned_at) AS created_time
  FROM private.mg2_attempts a JOIN private.mg2_rubrics r
    ON r.id=a.rubric_id AND r.org_id=a.org_id
  JOIN public.memberships m ON m.org_id=a.org_id
   AND m.user_id=v_uid AND m.member_role='student'
  WHERE a.student_id=v_uid AND
    (a.status='released' OR private.mg2_has_active_student_plan(v_uid,a.org_id,r.plan))
  ORDER BY coalesce(a.submitted_at,a.assigned_at) DESC,a.id
  LIMIT p_limit OFFSET p_offset
 ) q;
 RETURN jsonb_build_object('items',v_rows,'total',v_total,
  'limit',p_limit,'offset',p_offset);
END $$;

REVOKE ALL ON FUNCTION
 public.mg2_author_original_draft(uuid,text,text,text,text,text,text,text,text,text,text,text,jsonb),
 public.mg2_assignable_originals(integer,integer),
 public.mg2_my_original_assignments(integer,integer)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION
 public.mg2_author_original_draft(uuid,text,text,text,text,text,text,text,text,text,text,text,jsonb),
 public.mg2_assignable_originals(integer,integer),
 public.mg2_my_original_assignments(integer,integer)
 TO authenticated;

-- Correct route-scope regression: parent/tutor report eligibility must be
-- based on the actual assigned question plan, not hard-coded Grove Exam.
CREATE OR REPLACE FUNCTION public.mg2_family_report(p_attempt uuid,p_role text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
 DECLARE v_uid uuid:=auth.uid();v_email text;v_role text;v jsonb;
 BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign-in required';END IF;
  IF p_role NOT IN('parent','tutor') OR p_role IS NULL THEN RAISE EXCEPTION 'Explicit parent or tutor audience required';END IF;
  SELECT lower(email) INTO v_email FROM auth.users
   WHERE id=v_uid AND email_confirmed_at IS NOT NULL;
  IF v_email IS NULL THEN RAISE EXCEPTION 'Verified email required';END IF;
  SELECT l.view_role INTO v_role FROM private.mg2_attempts a
   JOIN public.learner_view_links l ON l.student_id=a.student_id
     AND l.org_id=a.org_id AND l.viewer_id=v_uid AND l.active
   JOIN public.learner_view_invitations i ON i.id=l.invitation_id
     AND i.org_id=l.org_id AND i.revoked_at IS NULL
     AND i.view_role=l.view_role AND lower(i.viewer_email)=v_email
     AND (i.expires_at IS NULL OR i.expires_at>now())
   JOIN private.mg2_rubrics r ON r.id=a.rubric_id AND r.org_id=a.org_id
   JOIN public.memberships m ON m.user_id=a.student_id AND m.org_id=a.org_id
     AND m.member_role='student'
   JOIN auth.users su ON su.id=a.student_id AND lower(su.email)=lower(i.student_email)
  WHERE a.id=p_attempt AND a.status='released' AND l.view_role=p_role
    AND private.mg2_has_active_student_plan(a.student_id,a.org_id,r.plan)
  LIMIT 1;
  IF v_role IS NULL THEN RAISE EXCEPTION 'Released linked-learner report not found';END IF;
  IF v_role='parent' THEN
   SELECT jsonb_build_object('released',true,'view_role','parent',
      'earned',s.earned,'possible',s.possible,'summary',s.parent_summary,
      'released_at',s.released_at)
   INTO v FROM private.mg2_releases s WHERE s.attempt_id=p_attempt
   ORDER BY s.revision DESC LIMIT 1;
  ELSE
   SELECT jsonb_build_object('released',true,'view_role','tutor',
      'earned',s.earned,'possible',s.possible,'teaching_plan',s.tutor_plan,
      'criteria',s.tutor_criteria,'released_at',s.released_at)
   INTO v FROM private.mg2_releases s WHERE s.attempt_id=p_attempt
   ORDER BY s.revision DESC LIMIT 1;
  END IF;
  IF v IS NULL THEN RAISE EXCEPTION 'Released linked-learner report not found';END IF;
  RETURN v;
 END $$;

-- Read-only guardian/tutor discovery of RELEASED original assessments for
-- one specifically linked learner. Never return examiner notes or images.
CREATE FUNCTION public.mg2_linked_original_reports(
 p_student uuid,p_role text,p_limit integer DEFAULT 20
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();v_email text;v_records jsonb;v_total integer;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign-in required';END IF;
 IF p_role IS NULL OR p_role NOT IN('parent','tutor')
  OR p_limit IS NULL OR p_limit<1 OR p_limit>50
 THEN RAISE EXCEPTION 'Invalid linked viewer role or report page size';END IF;
 SELECT lower(email) INTO v_email FROM auth.users
  WHERE id=v_uid AND email_confirmed_at IS NOT NULL;
 IF v_email IS NULL THEN RAISE EXCEPTION 'Verified linked email required';END IF;
 IF NOT EXISTS(
   SELECT 1 FROM public.learner_view_links l
   JOIN public.learner_view_invitations i ON i.id=l.invitation_id
    AND i.org_id=l.org_id AND i.revoked_at IS NULL
    AND lower(i.viewer_email)=v_email
    AND (i.expires_at IS NULL OR i.expires_at>now())
   JOIN auth.users s ON s.id=l.student_id
    AND lower(s.email)=lower(i.student_email)
   JOIN public.memberships m ON m.user_id=l.student_id AND m.org_id=l.org_id
    AND m.member_role='student'
   WHERE l.student_id=p_student AND l.viewer_id=v_uid AND l.active
    AND l.view_role=p_role AND i.view_role=p_role
 ) THEN RAISE EXCEPTION 'This learner is not linked for the requested audience';END IF;
 SELECT count(DISTINCT a.id) INTO v_total FROM private.mg2_attempts a
  JOIN private.mg2_rubrics r ON r.id=a.rubric_id AND r.org_id=a.org_id
  JOIN public.learner_view_links l ON l.student_id=a.student_id
   AND l.org_id=a.org_id AND l.viewer_id=v_uid AND l.active AND l.view_role=p_role
  JOIN public.learner_view_invitations i ON i.id=l.invitation_id
   AND i.org_id=l.org_id AND i.view_role=l.view_role AND i.revoked_at IS NULL
   AND lower(i.viewer_email)=v_email
   AND (i.expires_at IS NULL OR i.expires_at>now())
  JOIN auth.users su ON su.id=a.student_id
   AND lower(i.student_email)=lower(su.email)
  WHERE a.student_id=p_student AND a.status='released'
   AND private.mg2_has_active_student_plan(a.student_id,a.org_id,r.plan);
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'attempt_id',q.id,'qualification',q.qualification,
  'academic_level',q.academic_level,'plan',q.plan,
  'question_key',q.question_key,'earned',q.earned,'possible',q.possible,
  'released_at',q.released_at
 ) ORDER BY q.released_at DESC,q.id),'[]'::jsonb) INTO v_records
 FROM (
  SELECT DISTINCT a.id,r.qualification,r.academic_level,r.plan,
   r.question_key,s.earned,s.possible,s.released_at
  FROM private.mg2_attempts a
  JOIN private.mg2_rubrics r ON r.id=a.rubric_id AND r.org_id=a.org_id
  JOIN private.mg2_releases s ON s.attempt_id=a.id
  JOIN public.learner_view_links l ON l.student_id=a.student_id
   AND l.org_id=a.org_id AND l.viewer_id=v_uid AND l.active AND l.view_role=p_role
  JOIN public.learner_view_invitations i ON i.id=l.invitation_id
   AND i.org_id=l.org_id AND i.view_role=l.view_role AND i.revoked_at IS NULL
   AND lower(i.viewer_email)=v_email
   AND (i.expires_at IS NULL OR i.expires_at>now())
  JOIN auth.users su ON su.id=a.student_id
   AND lower(i.student_email)=lower(su.email)
  WHERE a.student_id=p_student AND a.status='released'
   AND private.mg2_has_active_student_plan(a.student_id,a.org_id,r.plan)
  ORDER BY s.released_at DESC,a.id
  LIMIT p_limit
 ) q;
 RETURN jsonb_build_object('view_role',p_role,'student_id',p_student,
  'total',v_total,'items',v_records);
END $$;
REVOKE ALL ON FUNCTION public.mg2_linked_original_reports(uuid,text,integer)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mg2_linked_original_reports(uuid,text,integer)
 TO authenticated;
-- END SOURCE: docs/staging/marking-v2-operational-interfaces.sql

-- BEGIN SOURCE: docs/staging/marking-v2-private-evidence-policy.sql
-- NEW V2 PRIVATE EVIDENCE POLICY — apply only after safe release review and new private Storage bucket creation.
-- Requires a private Storage API bucket named mg2-original-evidence, file size <=1MiB and allowed MIME image/png, image/jpeg, application/pdf.
-- Does not modify the existing student-work bucket or its policies. No direct storage.objects writes.


CREATE FUNCTION private.mg2_evidence_path_ok(p_name text)
 RETURNS boolean LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE v_parts text[];
BEGIN
 v_parts:=pg_catalog.string_to_array(p_name,'/');
 IF pg_catalog.cardinality(v_parts)<>3 THEN RETURN false;END IF;
 IF v_parts[1] !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  OR v_parts[2] !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  OR v_parts[3] !~ '^work[.](png|jpg|jpeg|pdf)$'
 THEN RETURN false;END IF;
 RETURN true;
END $$;

CREATE FUNCTION private.mg2_can_upload_evidence(p_name text)
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();v_parts text[];v_attempt uuid;
BEGIN
 IF v_uid IS NULL OR NOT private.mg2_evidence_path_ok(p_name)
 THEN RETURN false;END IF;
 v_parts:=pg_catalog.string_to_array(p_name,'/');
 IF v_parts[1]<>v_uid::text THEN RETURN false;END IF;
 v_attempt:=v_parts[2]::uuid;
 RETURN EXISTS(
  SELECT 1
  FROM private.mg2_attempts a
  JOIN private.mg2_rubrics r ON r.id=a.rubric_id AND r.org_id=a.org_id
  WHERE a.id=v_attempt AND a.student_id=v_uid AND a.status='assigned'
    AND r.status='approved'
    AND private.mg2_has_active_student_plan(v_uid,a.org_id,r.plan)
 );
END $$;

CREATE FUNCTION private.mg2_can_read_evidence(p_name text)
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();v_parts text[];v_attempt uuid;
BEGIN
 IF v_uid IS NULL OR NOT private.mg2_evidence_path_ok(p_name)
 THEN RETURN false;END IF;
 v_parts:=pg_catalog.string_to_array(p_name,'/');
 v_attempt:=v_parts[2]::uuid;
 RETURN EXISTS(
  SELECT 1
  FROM private.mg2_attempts a
  JOIN private.mg2_rubrics r ON r.id=a.rubric_id AND r.org_id=a.org_id
  WHERE a.id=v_attempt AND a.student_id=v_parts[1]::uuid
   AND (
     (a.student_id=v_uid AND
       private.mg2_has_active_student_plan(v_uid,a.org_id,r.plan))
     OR (a.status IN('submitted','released') AND private.is_staff(a.org_id))
   )
 );
END $$;

REVOKE ALL ON FUNCTION
 private.mg2_evidence_path_ok(text),
 private.mg2_can_upload_evidence(text),
 private.mg2_can_read_evidence(text)
 FROM PUBLIC,anon,authenticated;
-- The helpers run from Storage RLS policies; no direct table access is granted.
GRANT EXECUTE ON FUNCTION
 private.mg2_can_upload_evidence(text),
 private.mg2_can_read_evidence(text)
 TO authenticated;
GRANT EXECUTE ON FUNCTION private.mg2_evidence_path_ok(text)
 TO authenticated;

CREATE POLICY mg2_evidence_student_upload ON storage.objects
 FOR INSERT TO authenticated
 WITH CHECK (
  bucket_id='mg2-original-evidence'
  AND private.mg2_can_upload_evidence(name)
 );

CREATE POLICY mg2_evidence_authorised_read ON storage.objects
 FOR SELECT TO authenticated
 USING (
  bucket_id='mg2-original-evidence'
  AND private.mg2_can_read_evidence(name)
 );

-- No UPDATE or DELETE policy: replacements and deletions must not be available
-- through a student-facing client. Exact MIME and maximum file bytes are
-- enforced by the test bucket's allowed_mime_types and file_size_limit.
-- END SOURCE: docs/staging/marking-v2-private-evidence-policy.sql

COMMIT;

