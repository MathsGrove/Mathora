-- A single transaction for the existing student programme and target grade RPCs.
-- If the grade is invalid, the prior setup statements are rolled back automatically.
-- Existing staff/organisation checks inside both underlying functions remain in force.
create or replace function public.update_student_setup_atomic(
 p_student uuid,
 p_qualification text,
 p_board text,
 p_level text,
 p_programme text,
 p_ends_at timestamptz,
 p_focus text,
 p_notes text,
 p_addons jsonb,
 p_grade text
)
returns jsonb
language plpgsql
security invoker
set search_path to ''
as $function$
declare
 v_setup jsonb;
 v_target jsonb;
begin
 if (select auth.uid()) is null then
  raise exception 'Authenticated staff access required';
 end if;
 -- Both calls execute in this one PostgreSQL transaction. Any exception
 -- from the grade validation (or either setup check) rolls back ALL writes.
 v_setup := public.update_student_setup(
  p_student,p_qualification,p_board,p_level,p_programme,
  p_ends_at,p_focus,p_notes,p_addons
 );
 if not coalesce((v_setup->>'ok')::boolean,false) then
  raise exception 'Student programme configuration was not accepted';
 end if;
 v_target := public.grove_admin_set_target(p_student,trim(coalesce(p_grade,'')));
 if not coalesce((v_target->>'ok')::boolean,false) then
  raise exception 'Student target grade was not accepted; no changes were saved';
 end if;
 return jsonb_build_object('ok',true,'target_grade',v_target->'target_grade');
end;
$function$;

revoke all on function public.update_student_setup_atomic(
 uuid,text,text,text,text,timestamptz,text,text,jsonb,text
) from public,anon;
grant execute on function public.update_student_setup_atomic(
 uuid,text,text,text,text,timestamptz,text,text,jsonb,text
) to authenticated;
