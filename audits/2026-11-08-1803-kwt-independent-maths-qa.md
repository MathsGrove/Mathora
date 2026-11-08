# Independent Maths QA — 2026-11-08 18:03 Asia/Kuwait

## Live sources and scope
Read live Supabase project `nwakgkxytovprrrwyahs` via SQL, and GitHub `MathsGrove/Mathora` recent commits and commit status. Latest visible commit at inspection: `27cbbda1a3b3c8c591aa6eb2b7b56fb5e150f847` (previous 16:00 QA journal). No subsequent commit was returned in recent commit search. These are read-time observations, not an immutable publication ledger.

## Reproducible inventory SQL
```sql
select (select count(*) from private.grove_practice_bank) practice_total,
(select count(*) from private.grove_practice_bank where active and review_state='approved') approved_active,
(select count(*) from private.grove_practice_bank where active and review_state<>'approved') other_active,
(select count(*) from private.grove_practice_bank where not active) inactive,
(select count(*) from private.grove_tasks) tasks,
(select count(*) from private.grove_task_items) items,
(select count(*) from private.grove_signature_editorial) signature,
(select sum(total_marks) from private.grove_signature_editorial) marks,
(select count(*) from private.grove_signature_editorial where human_moderated_by is not null and human_moderated_at is not null) moderated,
(select count(*) from private.grove_task_items i join private.grove_practice_bank b on b.id=i.bank_id where not(b.active and b.review_state='approved')) pilot_items;
```
Result: 2236 total; 1942 approved active; 240 other active; 54 inactive; 42 tasks; 22 items; 23 Signature assessments; 397 declared marks; 0 fully human-moderated; 4 non-approved/active assigned items.

## Editorial SQL
```sql
select count(*) filter(where reviewed_by is null and active and review_state='approved') missing_reviewer,
count(*) filter(where reviewed_at is null and active and review_state='approved') missing_review_date,
count(*) filter(where active and length(coalesce(explanation,''))<100) short_explanations,
count(*) filter(where active and (correct_text is null or btrim(correct_text)='')) blank_keys,
count(*) filter(where active and (syllabus_objective is null or btrim(syllabus_objective)='')) missing_objective
from private.grove_practice_bank;
```
Result: 1942 missing reviewer IDs; 36 missing review dates; 468 short explanations (triage only); 0 blank active answer keys; 240 missing active syllabus objectives.

## Checks and limitations
PASS: live database read; counts agree with previous run; no newer Signature assessment by created_at (latest is P4 Parametric Differentiation and Separable Differential Equations created 2026-11-07 22:02 UTC); no newly visible GitHub commit after prior QA journal.
UNRESOLVED: 4 pilot assignments; missing reviewer metadata; no immutable practice publication change history; no exhaustive newly changed question recomputation; student-level unseen/dedup/adaptation/Ready status; official 2026–27 specification verification; RLS policy execution tests; copyright provenance; photo/whiteboard storage controls; timers; browser KaTeX and live deployment. GitHub combined commit statuses for feature commit `61bcf207` returned empty; this does not prove a CI pass or failure. No independent full-part recomputation of all 23 Signature assessments in this run; no human moderation claim.

## Release decisions
No newly verified original practice identified for activation. Zero activations, zero quarantines, zero learner/grade/permission changes. No Signature report or grade issued. Continue automated publication without owner approval only for originals that satisfy substantive maths and specification verification. Retain questionable drafts staged. Include outstanding concerns in established evening report.
