# Independent Maths QA — 2026-11-08 20:01 Asia/Kuwait

## Scope and evidence
Live SQL read of Supabase project `nwakgkxytovprrrwyahs`, private production tables; GitHub `MathsGrove/Mathora` previous QA journal and commit/status. GitHub recent-commit search failed with connector KeyError, so no claim is made about newest repository HEAD, publication diffs or deployment.

## Reproducible inventory SQL
```sql
select (select count(*) from private.grove_practice_bank) practice_total,
(select count(*) from private.grove_practice_bank where active and review_state='approved') approved,
(select count(*) from private.grove_practice_bank where active and review_state<>'approved') pilots,
(select count(*) from private.grove_tasks) tasks,
(select count(*) from private.grove_task_items) assignments,
(select count(*) from private.grove_signature_editorial) signature,
(select sum(total_marks) from private.grove_signature_editorial) marks,
(select count(*) from private.grove_signature_editorial where human_moderated_by is not null and human_moderated_at is not null) moderated;
```
Result: 2236, 1942, 240, 42, 22, 23, 397, 0 respectively. Remaining 54 practice items inactive.

```sql
select count(*) filter(where reviewed_by is null and active and review_state='approved') missing_reviewer,
count(*) filter(where reviewed_at is null and active and review_state='approved') missing_review_date,
count(*) filter(where active and length(coalesce(explanation,''))<100) short_explanations,
count(*) filter(where active and nullif(btrim(coalesce(syllabus_objective,'')),'') is null) missing_objective
from private.grove_practice_bank;
```
Result: 1942, 36, 468, 240 respectively. Short explanations are triage flags, not confirmed defects.

```sql
select count(*) as ineligible_items,count(distinct i.task_id) as affected_tasks
from private.grove_task_items i join private.grove_practice_bank b on b.id=i.bank_id
where not(b.active and b.review_state='approved');
```
Result: 4 assignments, 1 task. Do not alter historical student work without further evidence.

## Signature
Newest by created_at: P4 Parametric Differentiation and Separable Differential Equations, created 2026-11-07 22:02:18 UTC, 12 marks, awaiting_human_moderation. No newly created Signature assessment identified. All 23 assessments lack complete human moderation metadata. This run did not recompute every part of all 23 assessments; mathematical certification NOT claimed. No grades or reports issued.

## PASS / UNRESOLVED
PASS: live database connectivity; reproducible counts stable relative to 18:03 journal; latest Signature record unchanged; historical pilot assignment exposure confirmed.
UNRESOLVED: immutable question publication diff; full exact-answer/distractor/explanation/LaTeX recomputation of newly changed practice; official current component-specific syllabus and copyright; unseen/near-duplicate and student-specific adaptation/Ready status; RLS role-based execution tests; evidence storage; server mock timing; GitHub Pages deployment/CI; complete Signature part-by-part verification. GitHub combined statuses for prior QA commit were empty, which is not a CI pass. Recent commit search failed; repository HEAD cannot be certified.

## Release decision
No new practice activation or quarantine; no production records modified; no Signature marks/reports released. Preauthorised original practice may publish without owner approval only after independent maths/specification evidence; questionable drafts stay staged. Findings to established evening report.
