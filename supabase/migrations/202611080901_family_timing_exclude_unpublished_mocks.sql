-- Keep unmoderated monthly mock placeholders out of parental practice-consistency
-- totals. Only actively delivered Daily/Weekly/Exam Daily practice is counted.
-- Maintain the current verified-email / nominated-learner checks unchanged.
CREATE OR REPLACE FUNCTION public.get_my_learner_views()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_viewer uuid:=(select auth.uid());v_email text;v_out jsonb:='[]'::jsonb;
 v_row record;v_total integer;v_reviewed integer;v_submitted integer;v_last timestamptz;
 v_history jsonb;v_topics jsonb;v_feedback jsonb;
 v_timing jsonb;v_practice jsonb;
begin
 if v_viewer is null then raise exception 'Sign-in required';end if;
 select lower(email) into v_email from auth.users where id=v_viewer and email_confirmed_at is not null;
 if v_email is null then raise exception 'Verified email required';end if;
 for v_row in
 select l.student_id,l.org_id,l.view_role,p.display_name,
  sp.qualification,sp.exam_board,sp.tier as academic_level,e.tier as programme
 from public.learner_view_links l
 join public.learner_view_invitations i on i.id=l.invitation_id
 join public.student_entitlements e on e.student_id=l.student_id and e.org_id=l.org_id
 join public.memberships m on m.user_id=l.student_id and m.org_id=l.org_id and m.member_role='student'
 join auth.users su on su.id=l.student_id
 join public.profiles p on p.id=l.student_id
 left join public.student_preferences sp on sp.student_id=l.student_id
 where l.viewer_id=v_viewer and l.active and i.revoked_at is null
 and i.viewer_email=v_email and i.view_role=l.view_role and lower(su.email)=i.student_email
 and e.tier='exam' and e.starts_at<=now() and (e.ends_at is null or e.ends_at>now())
 loop
   select count(*),count(*) filter(where a.status='marked'),count(*) filter(where a.status='submitted'),
   max(a.submitted_at) into v_total,v_reviewed,v_submitted,v_last
   from public.attempts a where a.student_id=v_row.student_id and a.org_id=v_row.org_id;
   select coalesce(jsonb_agg(h.record order by h.date desc),'[]'::jsonb) into v_history from(
    select a.submitted_at as date,jsonb_build_object(
      'date',a.submitted_at,'qualification',a.qualification,'paper_mode',a.paper_mode,
      'topic',coalesce(a.focus_topic,''),'score',sum(r.marks_awarded),
      'maximum',sum(q.marks)
    ) as record
    from public.attempts a
    join public.reviews r on r.attempt_id=a.id
    join public.question_bank q on q.id=r.question_id
    where a.student_id=v_row.student_id and a.org_id=v_row.org_id and a.status='marked'
    group by a.id,a.submitted_at,a.qualification,a.paper_mode,a.focus_topic
    order by a.submitted_at desc limit 8
   )h;
   select coalesce(jsonb_agg(t.record order by t.topic),'[]'::jsonb) into v_topics from(
    select q.topic,
      jsonb_build_object('topic',q.topic,'earned',sum(r.marks_awarded),'available',sum(q.marks),'questions',count(*)) as record
    from public.reviews r join public.question_bank q on q.id=r.question_id
    join public.attempts a on a.id=r.attempt_id
    where a.student_id=v_row.student_id and a.org_id=v_row.org_id and a.status='marked'
    group by q.topic order by count(*) desc limit 10
   )t;
   v_feedback:='[]'::jsonb;
   if v_row.view_role='tutor' then
    select coalesce(jsonb_agg(t.record order by t.date desc),'[]'::jsonb) into v_feedback from(
      select a.submitted_at as date,jsonb_build_object('topic',q.topic,
       'feedback',left(r.feedback,1200),'marks',r.marks_awarded,'maximum',q.marks,
       'date',a.submitted_at) as record
      from public.reviews r join public.attempts a on a.id=r.attempt_id
      join public.question_bank q on q.id=r.question_id
      where a.student_id=v_row.student_id and a.org_id=v_row.org_id and a.status='marked'
      order by a.submitted_at desc limit 12
    )t;
   end if;
   -- Family engagement aggregates are limited to the linked learner, the linked
   -- organisation, and a rolling 28-day window of scheduled opening dates.
   -- These dates are NOT formal submission deadlines.
   select jsonb_build_object(
    'window_days',28,
    'scheduled_sessions',count(*),
    'submitted_sessions',count(*) filter(where t.submitted_at is not null),
    'unstarted_past_schedule',count(*) filter(where t.status='scheduled' and
      t.due_date < (now() at time zone 'UTC')::date),
    'submitted_after_day',count(*) filter(where t.submitted_at is not null and
      (t.submitted_at at time zone 'UTC')::date > t.due_date),
    'recorded_visible_minutes',round(coalesce(sum(t.visible_seconds),0)::numeric/60,1),
    'sessions_with_timing',count(*) filter(where t.visible_seconds > 0)
   ) into v_timing
   from (
    select t.due_date,t.status,t.submitted_at,
     coalesce((select sum(q.seconds_visible) from private.grove_question_time q
       where q.task_id=t.id),0) as visible_seconds
    from private.grove_tasks t
    where t.student_id=v_row.student_id and t.org_id=v_row.org_id
      and t.due_date between ((now() at time zone 'UTC')::date - 27)
                         and (now() at time zone 'UTC')::date
      and t.mode in ('daily','weekly','exam_daily')
   ) t;
   select coalesce(jsonb_agg(x.record order by x.due_date desc,x.submitted_at desc nulls last),'[]'::jsonb)
    into v_practice
   from (
    select t.due_date,t.submitted_at,jsonb_build_object(
     'scheduled_date',t.due_date,'submitted_at',t.submitted_at,
     'mode',t.mode,'status',t.status,'review_status',t.review_status,
     'days_after_scheduled',case when t.submitted_at is not null then
      greatest(0,(t.submitted_at at time zone 'UTC')::date-t.due_date) end,
     'visible_minutes',round(coalesce((select sum(q.seconds_visible)
        from private.grove_question_time q where q.task_id=t.id),0)::numeric/60,1)
    ) as record
    from private.grove_tasks t
    where t.student_id=v_row.student_id and t.org_id=v_row.org_id
      and t.due_date between ((now() at time zone 'UTC')::date - 27)
                         and (now() at time zone 'UTC')::date
      and t.mode in ('daily','weekly','exam_daily')
    order by t.due_date desc,t.submitted_at desc nulls last limit 12
   ) x;
   v_out:=v_out||jsonb_build_array(jsonb_build_object(
    'student_id',v_row.student_id,'student_name',v_row.display_name,'view_role',v_row.view_role,
    'qualification',v_row.qualification,'exam_board',v_row.exam_board,
    'academic_level',v_row.academic_level,'programme',v_row.programme,
    'papers_total',v_total,'papers_reviewed',v_reviewed,
    'papers_awaiting_review',v_submitted,'last_submission',v_last,
    'recent_results',v_history,'topics',v_topics,'teaching_feedback',v_feedback,
    'practice_timing',v_timing,'practice_activity',v_practice));
 end loop;
 return jsonb_build_object('ok',true,'learners',v_out);
end;$function$
;
