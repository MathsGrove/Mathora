# Independent Maths QA — 2026-11-08 12:00 Asia/Kuwait

## Scope and reproducibility
Live read-only SQL against Supabase project `nwakgkxytovprrrwyahs`; GitHub commit search, compare and combined-status lookup against `MathsGrove/Mathora` (the connected repository). Prior journal commit: `8b1eea9054f7912309aafd8bf7745c8d1c27ae76`. Current inspected head: `cc8073c7ad1e679dbd4df9ccae92ffa900f1b0b1`. Five new commits, primarily dashboards, family report, schedule-readiness and transactional student programme controls. No practice question source changes visible in GitHub compare; database question changes cannot be ruled out without immutable content history.

## Live counts
```sql
select count(*) total, count(*) filter(where active and review_state='approved') approved_active,
count(*) filter(where active and review_state='pilot') pilot_active,
count(*) filter(where not active) inactive,
count(*) filter(where active and review_state='approved' and reviewed_by is null) approved_missing_reviewer,
count(*) filter(where active and length(explanation)<100) short_explanations
from private.grove_practice_bank;
```
Result: total 2236; approved_active 1942; pilot_active 240; inactive 54; approved_missing_reviewer 1942; short_explanations 468 (length alone is not proof of error).
```sql
select count(*) total,count(*) filter(where status='scheduled') scheduled from private.grove_tasks;
select count(*) total,count(distinct bank_id) distinct_ids,
count(*) filter(where not (b.active and b.review_state='approved')) not_approved_active
from private.grove_task_items i join private.grove_practice_bank b on b.id=i.bank_id;
select count(*) total, sum(total_marks) marks,
count(*) filter(where human_moderated_by is not null and human_moderated_at is not null) moderated
from private.grove_signature_editorial;
```
Results: tasks 42, scheduled 38; materialised items 22, distinct bank IDs 22, four not approved-and-active; Signature 23 assessments, 397 marks, zero with complete human moderation metadata.

## Passes and failures
PASS: Aggregate inventory reconciles; assigned IDs unique across current materialised items; no new Signature assessment since latest recorded creation at 2026-11-07 22:02:18 UTC. New GitHub changes include explicit tests/workflows for dashboards, family analytics and programme integrity, but these are not proof of passing CI. Combined commit status endpoint returned an empty statuses array.
OPEN: four assignments use non-approved or inactive content (inspect task status and policy before intervention); 1942 approved questions lack reviewer UUID; 468 active explanations under 100 characters need substantive review. Newly changed DB questions cannot be exhaustively detected from schema (no immutable publication event ledger); no claim of independently recomputing all practice answers/distractors, LaTeX, syllabus mapping or all 23 Signature papers. Student-specific unseen/semantic duplication, baseline adaptation, tier/mode, Ready status, official 2026–27 syllabus/copyright, effective RLS role tests, photo evidence security, examiner marking, authoritative timers, live Pages and browser KaTeX are NOT CERTIFIED.
NEW REVIEW: 42 tasks and 22 materialised items, compared with 41 tasks/16 items in previous journal. Investigate new task's mode, supply, assignment eligibility and correctness before marking Ready.
NO WRITE to production DB; no practice activation, quarantine, grades or moderation. No questionable draft published. Verified originals remain preauthorised, but none could be newly certified in this cycle. Include findings in established evening report.
