-- Staging-only MathsGrove V2 operational authoring, inventory & student list.
-- Does not change existing live mark records; requires prior draft stack.
BEGIN;

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

COMMIT;
