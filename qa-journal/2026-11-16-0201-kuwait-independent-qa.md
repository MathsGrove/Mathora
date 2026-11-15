# MathsGrove independent QA — 2026-11-16 02:01 Asia/Kuwait

Source: LIVE Supabase project `nwakgkxytovprrrwyahs`; GitHub `MathsGrove/Mathora` (repository currently accessible under this owner). Previous QA journal commit: `bdf3601e01adaceda4fe45512166434a4e6396de`.

## Confirmed checks
- Private practice bank: 1,942 active approved; 240 active pilot; 54 inactive draft; total 2,236.
- No newly created Signature editorial item since previous audit: 45 total; latest `85a5ac0c-8476-40be-b56c-175e0327f75b` created 2026-11-15 20:00:12 UTC. Zero human moderation timestamps.
- 516 duplicate normalized-stem groups in approved active practice, 1,143 additional identical-stem copies. This is bank duplication, not established student exposure.
- All 240 active pilots missing exam board or syllabus objective; 12 pilot explanations shorter than 20 characters.
- 52 assigned question items; 4 reference missing/inactive/nonapproved bank entries.
- 49 tasks: 40 scheduled, 5 expired, 4 completed. As of 2026-11-16, 10 scheduled tasks have due dates on or before today, plus 5 expired; none has literal status 'ready'. Do not equate 'scheduled' with Ready without lifecycle logic.
- Public `mark_schemes` SELECT policy `schemes_select` checks privileged membership only, without an organisation-specific predicate; potential cross-tenant exposure, not confirmed by authenticated test.

## Reproducible SQL
```sql
select review_state,active,count(*) from private.grove_practice_bank group by 1,2;
select count(*),count(*) filter(where human_moderated_at is not null),max(created_at) from private.grove_signature_editorial;
select status,count(*) from private.grove_tasks group by 1;
select status,count(*) from private.grove_tasks where due_date <= '2026-11-16' group by 1;
select count(*) filter(where b.id is null or not b.active or b.review_state <> 'approved'),count(*) from private.grove_task_items i left join private.grove_practice_bank b on b.id=i.bank_id;
with stems as (select lower(regexp_replace(trim(prompt),'\s+',' ','g')) stem,count(*) n from private.grove_practice_bank where active and review_state='approved' group by 1 having count(*)>1) select count(*) groups,sum(n-1) extra_copies from stems;
select policyname,qual from pg_policies where tablename='mark_schemes' and cmd='SELECT';
```

## Limits and release decision
No new Signature paper to recompute in this cycle. Private practice bank has no created_at/updated_at, so newly published cohort cannot be proven from database alone. Complete answer/distractor/LaTeX/official syllabus and copyright checks, individual student exposure/adaptation, storage RLS, server timers, GitHub Pages CI and authenticated cross-tenant tests were NOT certified in this cycle. No student/parent Signature results issued. No practice content published, altered or quarantined: there was no sufficiently verified new practice cohort. Verified original practice remains preauthorised for automatic publication without owner approval; uncertain drafts stay staged.
