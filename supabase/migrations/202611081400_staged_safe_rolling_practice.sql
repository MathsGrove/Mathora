-- Rolling MathsGrove practice: future-only, idempotent, teacher-controlled activation.
-- IMPORTANT: this migration does NOT schedule a cron job or change any student task.
-- The content-aware writer defaults to DRY RUN. Enable only after isolated
-- authenticated learner tests confirm per-route question supply and permissions.

create or replace function private.grove_expected_practice_slots(
  p_from date,p_through date,p_enrolled date,p_programme text
)
returns table(due_date date,mode text,question_count smallint)
language sql immutable set search_path to ''
as $function$
  select day::date,
         case when p_programme='exam' then 'exam_daily' else 'daily' end::text,
         case when p_programme='exam' then 6 else 4 end::smallint
  from pg_catalog.generate_series(p_from::timestamp,p_through::timestamp,interval '1 day') as day
  where p_programme in ('daily','exam') and day::date>=p_enrolled

  union all

  select day::date,'weekly'::text,8::smallint
  from pg_catalog.generate_series(p_from::timestamp,p_through::timestamp,interval '1 day') as day
  where day::date>=p_enrolled and
    ((p_programme='weekly' and mod(day::date-p_enrolled,7)=0) or
     (p_programme in ('daily','exam') and mod(day::date-p_enrolled,7)=6))
$function$;

revoke all on function private.grove_expected_practice_slots(date,date,date,text)
 from public,anon,authenticated;

create or replace function private.grove_renew_practice_safely(
 p_apply boolean default false,
 p_today date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
 v_member record;
 v_route jsonb;
 v_first date;
 v_last date;
 v_expected integer;
 v_missing integer;
 v_primary_need integer;
 v_weekly_need integer;
 v_total_need integer;
 v_primary_available integer;
 v_weekly_available integer;
 v_total_available integer;
 v_conflicting integer;
 v_written integer;
 v_examined integer:=0;
 v_inserted integer:=0;
 v_content_blocked integer:=0;
 v_route_blocked integer:=0;
 v_conflict_blocked integer:=0;
 v_ready integer:=0;
 v_sample jsonb:='[]'::jsonb;
 v_primary_scope text;
begin
 -- No date spoofing on a real write; preview can be used for historical tests.
 if p_apply and p_today<>current_date then
  raise exception 'Practice renewal writes can only use the current UTC database date';
 end if;
 -- pg_cron invokes this as postgres. Do not grant EXECUTE to browser roles.
 -- A transaction-scoped lock prevents two concurrent renewal workers.
 if not pg_catalog.pg_try_advisory_xact_lock(72108,20261108) then
  return jsonb_build_object('ok',false,'reason','Renewal already running','applied',false);
 end if;

 for v_member in
  select e.student_id,e.org_id,e.tier,e.starts_at,e.ends_at,
         sp.qualification,sp.tier as academic_level,sp.exam_board
  from public.student_entitlements e
  join public.memberships m on m.org_id=e.org_id and
     m.user_id=e.student_id and m.member_role='student'
  join public.student_preferences sp on sp.student_id=e.student_id
  where e.starts_at::date<=p_today+27
    and (e.ends_at is null or e.ends_at::date>=p_today)
    and e.starts_at<=pg_catalog.now()
    and (e.ends_at is null or e.ends_at>pg_catalog.now())
  order by e.student_id
 loop
  v_examined:=v_examined+1;
  v_route:=private.baseline_route(v_member.student_id);
  if not coalesce((v_route->>'ready')::boolean,false) or
    (v_route->>'org_id')::uuid is distinct from v_member.org_id or
    v_route->>'programme' is distinct from v_member.tier then
   v_route_blocked:=v_route_blocked+1;
   continue;
  end if;
  v_first:=pg_catalog.greatest(p_today,v_member.starts_at::date);
  v_last:=pg_catalog.least(p_today+27,
          coalesce(v_member.ends_at::date,p_today+27));
  if v_last<v_first then continue;end if;
  -- An admin route change can leave a formerly scheduled task of the same
  -- (student,date,mode). Refuse to silently mask the conflict.
  select count(*) into v_conflicting
  from private.grove_tasks t
  where t.student_id=v_member.student_id and t.org_id=v_member.org_id
    and t.due_date between v_first and v_last and t.status='scheduled'
    and (t.qualification<>v_route->>'qualification'
      or t.academic_level<>v_route->>'level'
      or t.programme<>v_member.tier);
  if v_conflicting>0 then
   v_conflict_blocked:=v_conflict_blocked+1;continue;
  end if;
  -- Calculate the question supply needed for every unstarted expected slot,
  -- not just the number of tasks missing in the timetable.
  select count(*) filter(where t.id is null),
    coalesce(sum(s.question_count) filter(
      where s.mode='weekly' and (t.id is null or t.status='scheduled')),0),
    coalesce(sum(s.question_count) filter(
      where s.mode<>'weekly' and (t.id is null or t.status='scheduled')),0)
  into v_missing,v_weekly_need,v_primary_need
  from private.grove_expected_practice_slots(v_first,v_last,
     v_member.starts_at::date,v_member.tier) s
  left join private.grove_tasks t on t.student_id=v_member.student_id
    and t.due_date=s.due_date and t.mode=s.mode;
  if v_missing=0 then v_ready:=v_ready+1;continue;end if;
  v_total_need:=v_weekly_need+v_primary_need;
  v_primary_scope:=case when v_member.tier='exam' then 'exam' else 'daily' end;

  -- Eligible counts mirror grove_task_start: only active, approved,
  -- baseline-excluded, board-compatible, previously unseen question stems.
  -- reviewed_at is an additional conservative editorial trace requirement.
  select
   count(distinct pg_catalog.lower(pg_catalog.regexp_replace(b.prompt,'[[:space:]]+','','g')))
     filter(where b.programme_scope in ('all',v_primary_scope)),
   count(distinct pg_catalog.lower(pg_catalog.regexp_replace(b.prompt,'[[:space:]]+','','g')))
     filter(where b.programme_scope in ('all','weekly')),
   count(distinct pg_catalog.lower(pg_catalog.regexp_replace(b.prompt,'[[:space:]]+','','g')))
  into v_primary_available,v_weekly_available,v_total_available
  from private.grove_practice_bank b
  where b.active and b.review_state='approved'
    and b.reviewed_at is not null
    and b.qualification=v_route->>'qualification'
    and b.academic_level=v_route->>'level'
    and b.programme_scope in ('all','weekly',v_primary_scope)
    and private.grove_board_compatible(b.exam_board,v_member.exam_board)
    and not exists (
      select 1 from private.baseline_bank base
      where base.qualification=b.qualification and
        base.academic_level=b.academic_level and
        pg_catalog.lower(pg_catalog.regexp_replace(base.prompt,'[[:space:]]+','','g'))=
        pg_catalog.lower(pg_catalog.regexp_replace(b.prompt,'[[:space:]]+','','g')))
    and not exists (
      select 1 from private.grove_task_items i
      join private.grove_tasks past on past.id=i.task_id
      where past.student_id=v_member.student_id
        and (i.bank_id=b.id or
          pg_catalog.lower(pg_catalog.regexp_replace(i.prompt,'[[:space:]]+','','g'))=
          pg_catalog.lower(pg_catalog.regexp_replace(b.prompt,'[[:space:]]+','','g'))));
  if v_weekly_available<v_weekly_need or
     (v_member.tier<>'weekly' and v_primary_available<v_primary_need) or
     v_total_available<v_total_need then
   v_content_blocked:=v_content_blocked+1;
   continue;
  end if;

  if p_apply then
   -- Only missing future rows are inserted; NEVER update, delete or reset
   -- historical, active, completed, expired, marked or annotated work.
   insert into private.grove_tasks(
     student_id,org_id,qualification,academic_level,programme,
     mode,due_date,question_count)
   select v_member.student_id,v_member.org_id,
     v_route->>'qualification',v_route->>'level',v_member.tier,
     s.mode,s.due_date,s.question_count
   from private.grove_expected_practice_slots(v_first,v_last,
     v_member.starts_at::date,v_member.tier) s
   on conflict(student_id,due_date,mode) do nothing;
   get diagnostics v_written=row_count;
   v_inserted:=v_inserted+v_written;
  else
   v_inserted:=v_inserted+v_missing;
  end if;
  v_ready:=v_ready+1;
 end loop;

 return jsonb_build_object(
  'ok',true,'applied',p_apply,'students_examined',v_examined,
  'students_ready',v_ready,'proposed_or_inserted',v_inserted,
  'blocked_content',v_content_blocked,
  'blocked_route',v_route_blocked,
  'blocked_conflicting_schedule',v_conflict_blocked,
  'window_days',28,'mocks_scheduled',0);
end;
$function$;

revoke all on function private.grove_renew_practice_safely(boolean,date)
 from public,anon,authenticated;
-- Deliberately no cron.schedule() here: isolated student/account acceptance
-- and explicit operational rollout are prerequisites to enabling production writes.
