-- Add only examiner-released feedback and updated timestamps to the enrolled student's
-- own secure insights payload. No draft feedback or cross-student results are exposed.
CREATE OR REPLACE FUNCTION public.grove_student_insights()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_uid uuid:=(SELECT auth.uid());v_grade text;v_baseline jsonb;v_count integer;v_reviewed integer;v_minutes numeric;v_percent numeric;v_history jsonb;v_topics jsonb;
BEGIN
 IF v_uid IS NULL OR NOT EXISTS(SELECT 1 FROM public.memberships WHERE user_id=v_uid AND member_role='student')
 THEN RAISE EXCEPTION 'An enrolled student account is required';END IF;
 SELECT target_grade INTO v_grade FROM public.student_academic_settings WHERE student_id=v_uid;
 SELECT jsonb_build_object('status',s.status,'score',s.score,'total',20,
  'completed_at',s.closed_at,'qualification',s.qualification,'level',s.academic_level,
  'minutes',s.minutes,'tab_hidden',(SELECT count(*) FROM private.baseline_events e WHERE e.session_id=s.id AND e.kind='tab_hidden'),
  'evidence_count',(SELECT count(*) FROM private.grove_work_evidence e WHERE e.baseline_session_id=s.id))
 INTO v_baseline FROM private.baseline_sessions s WHERE s.student_id=v_uid ORDER BY s.started_at DESC LIMIT 1;
 SELECT count(*),count(*) FILTER(WHERE review_status='released') INTO v_count,v_reviewed
 FROM private.grove_tasks WHERE student_id=v_uid AND status IN('completed','expired') AND mode<>'mock_pending';
 SELECT coalesce(sum(q.seconds_visible)/60.0,0) INTO v_minutes FROM private.grove_question_time q
 JOIN private.grove_tasks t ON t.id=q.task_id WHERE t.student_id=v_uid;
 SELECT round(100.0*sum(score)/nullif(sum(question_count),0),1) INTO v_percent
 FROM private.grove_tasks WHERE student_id=v_uid AND review_status='released';
 SELECT coalesce(jsonb_agg(jsonb_build_object(
 'task_id',t.id,'date',t.due_date,'score',t.score,'total',t.question_count,'mode',t.mode,
 'submitted_at',t.submitted_at,'feedback',f.feedback,'feedback_updated_at',f.updated_at)
 ORDER BY coalesce(f.updated_at,t.submitted_at,t.created_at)),'[]'::jsonb)
 INTO v_history FROM private.grove_tasks t
 LEFT JOIN private.grove_task_feedback f ON f.task_id=t.id
 WHERE t.student_id=v_uid AND t.review_status='released';
 SELECT coalesce(jsonb_agg(jsonb_build_object('topic',topic,'correct',correct,'total',total)),'[]'::jsonb) INTO v_topics
 FROM (SELECT i.topic,count(*) total,count(*) FILTER(WHERE m.mark=1) correct
   FROM private.grove_practice_marks m JOIN private.grove_task_items i ON i.task_id=m.task_id AND i.position=m.position
   JOIN private.grove_tasks t ON t.id=m.task_id WHERE t.student_id=v_uid AND t.review_status='released'
   GROUP BY i.topic ORDER BY count(*) FILTER(WHERE m.mark=1)::numeric/nullif(count(*),0),i.topic LIMIT 8) agg;
 RETURN jsonb_build_object('target_grade',v_grade,'baseline',v_baseline,'submitted',v_count,
 'reviewed',v_reviewed,'visible_minutes',round(v_minutes,1),'reviewed_accuracy',v_percent,
 'history',v_history,'topics',v_topics,
 'baseline_topics', (SELECT coalesce(jsonb_agg(jsonb_build_object('topic',topic,'correct',correct,'total',total)
 ORDER BY topic),'[]'::jsonb) FROM (
 SELECT i.topic,count(*) FILTER(WHERE a.choice=i.correct_option) correct,count(*) total
 FROM private.baseline_items i
 LEFT JOIN private.baseline_answers a ON a.session_id=i.session_id AND a.position=i.position
 WHERE i.session_id=(SELECT id FROM private.baseline_sessions WHERE student_id=v_uid AND status IN('submitted','expired') ORDER BY started_at DESC LIMIT 1)
 GROUP BY i.topic) b),
 'disclaimer','Target grades are set by staff. The baseline and examiner-marked practices are evidence, not an official predicted grade.');
END;$function$
;
