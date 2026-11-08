# Independent Maths QA — 2026-11-08 14:00 Asia/Kuwait

## Live scope
Read-only SQL against Supabase project `nwakgkxytovprrrwyahs`; GitHub search and commit CI lookup on `MathsGrove/Mathora`. Compared with 2026-11-08 12:00 journal (commit `be06a7774193ef0d15c0537499145aa96ae2ab35`). Latest visible commit `5e9260342cfe389f2574e6ebbb5da77262b91559` dated 2026-11-08 10:50:42 UTC: staged future-only, content-gated rolling scheduler, explicitly *not* production cron enabled. Combined statuses empty; commit workflow runs empty, so CI and Pages delivery NOT CERTIFIED.

## Reproducible live SQL and results
```sql
select count(*) total,count(*) filter(where active and review_state='approved') approved,
count(*) filter(where active and review_state='pilot') pilots,
count(*) filter(where not active) inactive,
count(*) filter(where active and review_state='approved' and reviewed_by is null) missing_reviewer,
count(*) filter(where active and length(explanation)<100) short_explanations
from private.grove_practice_bank;
select count(*) total,count(*) filter(where status='scheduled') scheduled from private.grove_tasks;
select count(*) total,count(distinct bank_id) distinct_ids,
count(*) filter(where not(b.active and b.review_state='approved')) nonapproved
from private.grove_task_items i join private.grove_practice_bank b on b.id=i.bank_id;
select count(*) total,sum(total_marks) marks,
count(*) filter(where human_moderated_by is not null and human_moderated_at is not null) moderated,
max(created_at) newest from private.grove_signature_editorial;
select count(*) duplicate_groups from
(select regexp_replace(lower(prompt),'[[:space:]]+',' ','g') stem,count(*)
from private.grove_task_items group by 1 having count(*)>1) s;
```
Results: 2236 total; 1942 active approved; 240 active pilot; 54 inactive; 1942 approved lacking reviewer UUID; 468 active explanations shorter than 100 characters. 42 tasks, 38 scheduled. 22 materialised items, 22 unique IDs, 4 pilot (active, non-approved). Zero exact whitespace-normalised assigned stem duplicate groups. 23 Signature assessments, 397 declared marks, zero with complete human moderation metadata; newest created 2026-11-07 22:02:18 UTC.

## Concrete assignment and mathematical checks
All four non-approved assignments belong to completed daily task `9f8671dd-e793-4576-8ccd-c3320edbfd17`, due 2026-10-31, and are active pilots (IDs `79980d6c-d858-4c45-a6d7-899075272f22`, `97b06f8c-aa01-43da-9251-48dee7ab525d`, `6ce5d829-2147-469a-84c0-25b52d2cb9c1`, `8d71bc07-e03f-4509-a947-9b944b1cb62c`). Do not alter completed historical student work without evidence of error and safe remediation.
Sample independently checked live assignment maths: 40 cm × 96 cm right triangle area 1920 cm² (D), hypotenuse 104 cm; 45 cm ×108 cm area 2430 cm² (A), hypotenuse 117 cm; x+y=44, 2x−y=76 => x=40,y=4, 3x+2y=128 (A); 3200×1.15×0.9−3200=112 (B); conditional pass probability (1/4×2/5)/(1/4×2/5+3/4×4/5)=1/7 (B). Each of these five samples has four distinct displayed distractor values and matching key. Note a triangle-area explanation unnecessarily calculates the hypotenuse, but its result is correct. These are *samples*, not an exhaustive independent question-bank certification.

Newest Signature assessment `bb6d4142-c8f7-479b-bedf-ba613504c16a` is unchanged, still awaiting human moderation. Recomputed all four parts: dx/dt=2t,dy/dt=3t²−3, dy/dx=3(t²−1)/(2t), 3 marks; t=1 -> (2,−2) minimum because dx/dt>0 and derivative changes negative to positive, 3 marks; dy/(y+1)=2x dx -> y=3exp(x²)−1, initial y(0)=2, 4 marks; y(1)=3e−1, 2 marks. Total 12. Independently differentiating solution confirms DE. Other 22 Signature papers NOT recomputed this run.

## Open failures, restrictions, and release decision
Four historical completed Daily pilot assignments remain policy-review exceptions, not proof of wrong answers. New rolling scheduler is staged behind dry-run/content gates; **do not enable cron** until content supply, unseen IDs, qualification/tier inheritance, adaptation, permissions and 28-day schedule tests pass. The newly scheduled December task has zero materialised items, which is not itself a failure for future-only scheduling; Ready cannot be inferred from task status.

Uncertified: complete mathematical recomputation of all newly modified practice (no immutable DB publication ledger), every distractor/explanation, full board/component official 2026–27 syllabus and copyright provenance, browser KaTeX, per-student seen IDs and near-duplicate families, difficulty/baseline feedback adaptation, tier/mode inheritance, authenticated Ready, effective RLS and cross-role isolation, private student evidence, marking, server mock timers, Signature staff-only access, live Pages deployment/CI. No claim of passing these gates.

No production DB writes, no activation or quarantine, no examiner identity/grade/report fabrication. Original verified practice remains preauthorised for automatic publication, but no new question passed the full release evidence gates in this inspection. Include in established evening owner report.
