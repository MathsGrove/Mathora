# Independent Maths QA — 2026-11-22 21:57 Asia/Kuwait

## Live sources
Supabase project `nwakgkxytovprrrwyahs`, private tables; connected GitHub `MathsGrove/Mathora` (requested `Mathora-mathematics/Mathora` not visible in connected repository list). Previous QA commit: `2a77b59338598e6188a5c23eb731489b5b01b0f9`.

## Reproducible inventory
```sql
select review_state,active,count(*) from private.grove_practice_bank group by 1,2;
select count(*) filter(where active and (nullif(btrim(exam_board),'') is null or nullif(btrim(syllabus_objective),'') is null)) missing_board_or_objective,
count(*) filter(where active and length(btrim(explanation))<30) short_explanation
from private.grove_practice_bank;
select count(*),count(*) filter(where human_moderated_by is not null),max(created_at) from private.grove_signature_editorial;
```
Practice: 2,243 total = 1,950 active approved + 240 active pilot + 53 inactive drafts. 240 active pilot records lack board/objective (blank strings, not SQL NULL); 56 active explanations shorter than 30 characters. All 1,950 approved records have nonblank board/objective. No active records have non-array or non-four-choice structures under the checked structural predicate. 49 tasks, 52 assigned items. Signature 62 records, zero recorded human moderators, latest created 2026-11-22 16:04:39 UTC. No new Signature record since prior 19:58 QA.

## Mathematical spot checks
Pilot quadratic inequality x²<4: -2<x<2; distractors x<2, x>-2, outside interval are wrong; explanation mathematically correct but brief.
Pilot IQR Q3=28,Q1=12: 16; alternatives 8,12,40 incorrect.
Pilot z-score x=85, mean 70, sd 10: (85-70)/10=1.5; alternatives 0.5,1.0,2.0 incorrect.
Latest Signature arithmetic/geometric progression paper: independently rechecked a_n=3n+4, S_n=n(3n+11)/2, S9=171,S10=205 so least n=10; geometric u5=81(2/3)^4=16, S4=195, infinite sum=243 since |r|<1. Six parts at 2 marks each, total 12. Human moderation still pending.

## Certification boundary and release
No new practice publication, quarantine or grade release. Not certified: exhaustive 2,190-question maths/distractor/KaTeX verification; 2026–27 official syllabus and copyright provenance; student-specific unseen/adaptive/Ready; RLS cross-account penetration, photo retention/storage, examiner workflow, server timers and Pages CI. These remain OPEN, not passed. Existing active pilot questions with missing specification metadata are a publication-quality concern; do not treat as board-certified. Fully verified original practice may publish automatically without owner approval; questionable drafts remain staged.
