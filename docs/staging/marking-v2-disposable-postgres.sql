-- MATHSGROVE EXPERIMENTAL CONSTRUCTED-RESPONSE MARKING V2
-- STAGING-ONLY: not an automatic migration, not applied to connected production.
-- Requires existing auth.users, public.organisations, public.memberships,
-- public.student_entitlements, public.learner_view_links/invitations and private.is_staff.
-- Run only on an isolated disposable Supabase/PostgreSQL project with fictional identities.
-- All privileged functions have an empty search_path, explicit caller checks,
-- and EXECUTE is denied to PUBLIC/anon by default.
BEGIN;

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

CREATE FUNCTION private.mg2_fingerprint(p_rubric private.mg2_rubrics)
 RETURNS text LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT encode(sha256(convert_to(
  concat_ws('|',p_rubric.org_id::text,p_rubric.question_key,p_rubric.version_no::text,
   p_rubric.qualification,p_rubric.academic_level,p_rubric.exam_board,p_rubric.syllabus_year,
   p_rubric.plan,p_rubric.question_prompt,p_rubric.worked_solution,
   p_rubric.max_marks::text,p_rubric.criteria::text),'UTF8')),'hex');
 $$;

CREATE FUNCTION private.mg2_validate_criteria(p_rubric private.mg2_rubrics)
 RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
 DECLARE i integer; c jsonb; prior text[]:=ARRAY[]::text[];
 dep text;code text;
 BEGIN
  IF jsonb_array_length(p_rubric.criteria)<>p_rubric.max_marks
     OR p_rubric.qualification='TMUA' OR length(btrim(p_rubric.worked_solution))<30
     OR length(btrim(p_rubric.question_prompt))<20
  THEN RAISE EXCEPTION 'Invalid original multi-mark rubric';END IF;
  FOR i IN 0..p_rubric.max_marks-1 LOOP
   c:=p_rubric.criteria->i;code:=c->>'code';
   IF jsonb_typeof(c)<>'object' OR (c->>'id') !~ '^[a-z][a-z0-9-]{1,70}$'
      OR c->>'id'=ANY(prior)
      OR length(coalesce(c->>'skill',''))<4
      OR length(coalesce(c->>'description',''))<10
      OR length(coalesce(c->>'missingFeedback',''))<15
      OR jsonb_typeof(c->'dependsOn')<>'array'
      OR code NOT IN('M1','A1','B1','R1')
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
CREATE FUNCTION public.mg2_signoff_rubric(p_rubric uuid,p_hash text,p_note text)
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
  IF p_hash IS DISTINCT FROM v_hash OR length(btrim(coalesce(p_note,'')))<25
  THEN RAISE EXCEPTION 'Exact rubric hash and substantive examiner note required';END IF;
  INSERT INTO private.mg2_signoffs(rubric_id,org_id,reviewer_id,fingerprint,reviewer_note)
  VALUES(r.id,r.org_id,v_uid,v_hash,p_note);
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
 v_uid uuid:=auth.uid();v_fp text;v_index integer;v_rule jsonb;v_award jsonb;
 v_id text;v_code text;v_points integer:=0;v_count integer;
 v_notes text;v_reason text;v_implied boolean;v_yes boolean;v_dep text;
 v_prev jsonb;v_student jsonb:='[]'::jsonb;v_tutor jsonb:='[]'::jsonb;
 BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign-in required';END IF;
  SELECT * INTO a FROM private.mg2_attempts WHERE id=p_attempt FOR UPDATE;
  IF a.id IS NULL OR a.status<>'submitted' OR NOT private.is_staff(a.org_id)
  THEN RAISE EXCEPTION 'Submitted attempt and authorised examiner required';END IF;
  SELECT * INTO r FROM private.mg2_rubrics WHERE id=a.rubric_id AND org_id=a.org_id;
  v_fp:=private.mg2_fingerprint(r);
  IF r.status<>'approved' OR
   (SELECT count(DISTINCT s.reviewer_id) FROM private.mg2_signoffs s
     WHERE s.rubric_id=r.id AND s.fingerprint=v_fp)<2
  THEN RAISE EXCEPTION 'Two valid examiner approvals required';END IF;
  IF jsonb_typeof(p_awards)<>'array' OR jsonb_array_length(p_awards)<>r.max_marks
  THEN RAISE EXCEPTION 'Exactly one marking decision per criterion required';END IF;
  PERFORM private.mg2_validate_criteria(r);
  FOR v_index IN 0..r.max_marks-1 LOOP
   v_rule:=r.criteria->v_index;v_id:=v_rule->>'id';v_code:=v_rule->>'code';
   SELECT count(*),max(value) INTO v_count,v_award
    FROM jsonb_array_elements(p_awards) value WHERE value->>'id'=v_id;
   IF v_count<>1 OR jsonb_typeof(v_award->'awarded')<>'boolean'
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
   IF v_yes THEN
    FOR v_dep IN SELECT jsonb_array_elements_text(v_rule->'dependsOn') LOOP
     SELECT value INTO v_prev FROM jsonb_array_elements(p_awards) value
      WHERE value->>'id'=v_dep;
     IF (v_prev->>'awarded')::boolean IS NOT TRUE THEN
      IF NOT (v_implied AND v_code='A1' AND
        EXISTS(SELECT 1 FROM jsonb_array_elements(r.criteria) cr
          WHERE cr->>'id'=v_dep AND cr->>'code'='M1'))
      THEN RAISE EXCEPTION 'Dependent criterion cannot be awarded without prior method';END IF;
     END IF;
    END LOOP;
   END IF;
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
   IF length(btrim(coalesce(p_student_summary,'')))<15 OR
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
CREATE FUNCTION public.mg2_family_report(p_attempt uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
 DECLARE v_uid uuid:=auth.uid();v_email text;v_role text;v jsonb;
 BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign-in required';END IF;
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
  WHERE a.id=p_attempt AND a.status='released' AND l.view_role IN('parent','tutor')
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

REVOKE ALL ON FUNCTION
 public.mg2_signoff_rubric(uuid,text,text),
 public.mg2_staff_mark(uuid,jsonb,boolean,text,text,text),
 public.mg2_student_report(uuid),
 public.mg2_family_report(uuid)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION
 public.mg2_signoff_rubric(uuid,text,text),
 public.mg2_staff_mark(uuid,jsonb,boolean,text,text,text),
 public.mg2_student_report(uuid),
 public.mg2_family_report(uuid)
 TO authenticated;

COMMIT;
