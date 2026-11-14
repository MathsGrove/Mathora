-- MathsGrove v2 constructed-response LEARNER WORKFLOW — DISPOSABLE STAGING ONLY.
-- This extends marking-v2-disposable-postgres.sql on a fictitious test project.
-- It is NOT a production migration. No Storage policies or uploads here.
-- Existing Grove Weekly/Daily/Exam 0/1 marking remains entirely unchanged.
BEGIN;

-- Existing pilot seeded attempts as submitted. New attempts begin as assigned.
ALTER TABLE private.mg2_attempts DROP CONSTRAINT mg2_attempts_status_check;
ALTER TABLE private.mg2_attempts ADD CONSTRAINT mg2_attempts_status_check
 CHECK (status IN ('assigned','submitted','released'));
ALTER TABLE private.mg2_attempts ALTER COLUMN status SET DEFAULT 'assigned';
ALTER TABLE private.mg2_attempts ALTER COLUMN submitted_at DROP DEFAULT;
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
COMMIT;
