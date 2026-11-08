-- Extend the existing staff-guarded schedule payload with real submission timestamps.
-- The scheduled date opens a practice task; it is NOT a separately configured deadline.
-- Existing authentication, staff checks and record scopes remain unchanged.
CREATE OR REPLACE FUNCTION public.grove_admin_schedule(p_org uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE result jsonb;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT private.is_staff(p_org) THEN RAISE EXCEPTION 'Staff permissions required';END IF;
 SELECT coalesce(jsonb_agg(rec ORDER BY due_date DESC),'[]'::jsonb) INTO result FROM (
 SELECT t.due_date, jsonb_build_object('task_id',t.id,'student_id',t.student_id,
 'student_name',coalesce(p.display_name,'Student'),'qualification',t.qualification,'level',t.academic_level,
 'programme',t.programme,'mode',t.mode,'due_date',t.due_date,
 'started_at',t.started_at,'submitted_at',t.submitted_at,'ends_at',t.ends_at,'status',t.status,
 'review_status',t.review_status,'score',CASE WHEN t.review_status='released' THEN t.score ELSE NULL END,
 'question_count',t.question_count,'teacher_feedback',CASE WHEN t.review_status='released' THEN
  (SELECT f.feedback FROM private.grove_task_feedback f WHERE f.task_id=t.id) END,
 'minutes_visible',(SELECT coalesce(round(sum(coalesce(q.seconds_visible,0))/60.0,1),0) FROM private.grove_question_time q WHERE q.task_id=t.id),
 'question_insights',CASE WHEN t.status IN('completed','expired') THEN
  (SELECT coalesce(jsonb_agg(jsonb_build_object('position',i.position,'topic',i.topic,'skill',i.skill,
    'mark',m.mark,'seconds_visible',coalesce(q.seconds_visible,0),
    'evidence_count',(SELECT count(*) FROM private.grove_work_evidence e WHERE e.task_id=t.id AND e.position=i.position))
    ORDER BY i.position),'[]'::jsonb)
   FROM private.grove_task_items i
   LEFT JOIN private.grove_practice_marks m ON m.task_id=i.task_id AND m.position=i.position
   LEFT JOIN private.grove_question_time q ON q.task_id=i.task_id AND q.position=i.position
   WHERE i.task_id=t.id) ELSE '[]'::jsonb END
 ) rec
 FROM private.grove_tasks t JOIN public.profiles p ON p.id=t.student_id
 WHERE t.org_id=p_org AND ((t.status IN ('completed','expired') AND t.review_status<>'released') OR t.due_date>=current_date-180)
 ORDER BY CASE WHEN t.status IN ('completed','expired') AND t.review_status<>'released' THEN 0 ELSE 1 END,t.due_date DESC LIMIT 600
 ) a;
 RETURN jsonb_build_object('ok',true,'assignments',result);
END;$function$
;
