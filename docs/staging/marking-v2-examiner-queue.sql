-- MathsGrove v2 examiner productivity RPCs (STAGING ONLY).
-- Extends docs/staging/marking-v2-disposable-postgres.sql and
-- docs/staging/marking-v2-learner-workflow.sql.
-- No direct Data API table access; authenticated staff is rechecked on EACH read.
BEGIN;

CREATE INDEX mg2_examiner_submitted_queue_idx
 ON private.mg2_attempts (org_id,submitted_at,id)
 WHERE status='submitted';

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
COMMIT;
