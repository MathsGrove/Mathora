-- MathsGrove independent question-review inbox, disposable Supabase staging ONLY.
-- The author cannot self-review, and each examiner can sign a rubric only once.
-- Returning a fingerprint does not itself approve or publish the question.
BEGIN;
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
COMMIT;
