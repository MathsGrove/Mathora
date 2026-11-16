# Independent Maths QA — 2026-11-16 14:15 Kuwait (11:15 UTC)

## Sources and audit boundary
LIVE Supabase project `nwakgkxytovprrrwyahs` and accessible GitHub `MathsGrove/Mathora`. Requested `Mathora-mathematics/Mathora` could not be resolved by GitHub connector. This is a point-in-time audit; no exhaustive newly published practice cohort can be established because `private.grove_practice_bank` has no creation/update timestamps. Previous checkpoint: `c3c184cf` (10:04 Kuwait). No new Signature record since 06:04:38 UTC.

## Reproducible SQL and results
```sql
select count(*) total,count(*) filter(where active and review_state='approved') approved,count(*) filter(where active and review_state<>'approved') pilots,count(*) filter(where not active) inactive from private.grove_practice_bank;
-- 2236 / 1942 / 240 / 54
select count(*) groups,coalesce(sum(n-1),0) extra from (select count(*) n from private.grove_practice_bank where active and review_state='approved' group by lower(regexp_replace(prompt,'\\s+',' ','g')) having count(*)>1) d;
-- 516 groups, 1143 extra copies
select count(*) filter(where exam_board is null or btrim(exam_board)='') missing_board,count(*) filter(where syllabus_objective is null or btrim(syllabus_objective)='') missing_objective,count(*) filter(where length(coalesce(explanation,''))<20) short_explanation from private.grove_practice_bank where active and review_state<>'approved';
-- 240 / 240 / 12
select count(*) total,max(created_at) latest,count(*) filter(where human_moderated_at is not null) moderated from private.grove_signature_editorial;
-- 46 / 2026-11-16 06:04:38 UTC / 0
select count(*) total,count(*) filter(where b.id is null or not b.active or b.review_state<>'approved') ineligible from private.grove_task_items i left join private.grove_practice_bank b on b.id=i.bank_id;
-- 52 / 4 (all four belong to a completed daily task, not currently scheduled)
select status,count(*) from private.grove_tasks group by status;
-- scheduled 40, expired 5, completed 4
select count(*) filter(where due_date<=date '2026-11-16' and status='scheduled') from private.grove_tasks;
-- 10 (includes due today; not all necessarily overdue)
select policyname,qual from pg_policies where schemaname='public' and tablename='mark_schemes';
-- schemes_select: EXISTS membership user_id=auth.uid() and role in (partner, examiner, admin), NO organisation predicate
```

## Signature recheck
Latest: `8d2a8a70-112c-4b59-9c0f-fccea8370929`, *Fabric Defects and Continuous Density*, 9709 Paper 6, 16 marks, awaiting_human_moderation. Independently recalculated again from live question_paper and mark_scheme:
- Q1(a) exp(-2)=0.135335... => 0.135 (2 marks)
- Q1(b) 1-3exp(-2)=0.593994... => 0.594 (3)
- Q1(c) 3exp(-2)(1-exp(-2))^2=0.303548... (3)
- Q2(a) integral_0^2 ky dy=2k=1 => k=1/2 (2)
- Q2(b) integral_1^2 y/2 dy=3/4 (2)
- Q2(c) integral_0^2 y^2/2 dy=4/3 (2)
- Q2(d) E(Y²)=2, variance=2-16/9=2/9 (2).
Seven part allocations and totals reconcile: 16/16. This does NOT constitute human moderation. Official 2026–27 specification mapping and browser KaTeX rendering remain uncertified.

## Release / security
**No practice published or quarantined**: no new cohort can be proved, and 240 pilots lack specification metadata. **No Signature grade/report issued**. Four historical ineligible assigned items are in a completed task; do not silently rewrite historical answers. RLS `public.mark_schemes` membership-only SELECT still poses possible cross-organisation exposure, not demonstrated by authenticated exploit. Do not apply speculative RLS changes without tests.

## Unverified
Per-student unseen stem/family history and baseline-feedback adaptation, mode/tier inheritance, true Ready status, all distractor mathematics, official qualification/component mappings, copyright provenance, storage isolation for student images, server mock timing, GitHub Pages CI and browser rendering. No claim of passing these checks. Carry security, duplicate-bank and metadata findings to established evening report. Owner approval is not required for fully verified original practice; insufficiently verified drafts stay staged.
