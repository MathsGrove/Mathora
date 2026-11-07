# Independent Maths QA — 2026-11-08 00:01 Kuwait (2026-11-07 21:01 UTC)

## Evidence and scope
Live read-only SQL queries against Supabase project `nwakgkxytovprrrwyahs`; GitHub commit search for `MathsGrove/Mathora` (latest existing QA commit `ba6244374e71c17992c4ec52f4c2f23c48003c6d`). The requested historical `Mathora-mathematics/Mathora` search did not resolve in the connector. No new GitHub commits beyond the 22:01 QA journal were returned.

## Reproducible SQL
```sql
select count(*) total,count(*) filter(where active and review_state='approved') approved,count(*) filter(where active and review_state='pilot') pilots,count(*) filter(where not active) inactive,count(*) filter(where active and review_state='approved' and reviewed_by is null) no_reviewer from private.grove_practice_bank;
select count(*) total,sum(total_marks) marks,count(*) filter(where human_moderated_by is not null and human_moderated_at is not null) moderated from private.grove_signature_editorial;
select id,title,created_at,total_marks,question_paper,mark_scheme,review_state,human_moderated_by from private.grove_signature_editorial order by created_at desc limit 1;
select count(*) tasks,count(*) filter(where status='scheduled') scheduled from private.grove_tasks;
select count(*) assignments,count(distinct bank_id) distinct_ids from private.grove_task_items;
```

## Results
PASS inventory consistency: practice 2,236 = 1,942 active approved + 240 active pilot + 54 inactive; Signature 22 assessments, 385 declared marks, 0 with both human moderation fields; tasks 41 (38 scheduled); materialised assignments 16 (16 distinct bank IDs). No inventory change since preceding QA journal. Latest Signature remains `5975a42c-179c-4a5f-882b-e5693d29d7c9`, 12-mark P4 vectors/integration diagnostic, awaiting human moderation.

PASS repeat independent arithmetic on latest Signature: AB=(2,-4,3), AC=(4,-2,2); dot=22; squared norms 29 and 24, cosine=11/sqrt(174); integral antiderivative exp(x)(x²-2x+2)+C differentiates to x²exp(x), definite value e-2. Parts 2+4+4+2 = 12. This does NOT constitute full verification of all 22 Signature assessments.

OPEN: 1,942 approved practice records have no reviewer UUID. No immutable per-question publication timestamps available in the practice-bank schema; therefore cannot certify exhaustive new/changed-question audit. Pilot use in completed Daily assignments remains a policy question. No authenticated end-to-end test, effective RLS attack test, student-specific unseen/near-duplicate audit, adaptation/Ready/tier audit, browser KaTeX test, official current board specification cross-check, copyright provenance check, image-storage security test, timer/marking workflow test or fresh CI run verification completed. These are NOT passes.

## Decision
No newly detected Signature content, no evidence-backed practice publication candidate. Zero practice activations/quarantines, zero examiner releases, zero production data changes. Verified original practice remains preauthorised without owner approval; questionable/unverifiable content stays staged. Carry unresolved controls into established evening report.
