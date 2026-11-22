# Independent QA — 2026-11-22 16:03 Asia/Kuwait

## Live evidence
Supabase project `nwakgkxytovprrrwyahs`; SQL read-only inspection of `private.grove_practice_bank`, `private.grove_tasks`, `private.grove_task_items`, and `private.grove_signature_editorial`. Repository `MathsGrove/Mathora` accessible; requested `Mathora-mathematics/Mathora` lookup failed.

- Practice: 2,243 total, 2,190 active, 1,950 active approved; 240 active records have blank explanation OR board OR syllabus objective. Three inspected examples are pilot records with blank board and objective, not evidence that all 240 are deficient in explanations.
- Tasks: 49; assigned task items: 52. Student-specific unseen and adaptation remain **not certified**.
- Signature editorial: 60 records, zero `human_moderated_by` set. Newest created 2026-11-22 11:56:55 UTC, "Separable Differential Equations: Growth and Initial Conditions", 12 marks, awaiting human moderation.

## Independently recomputed latest Signature draft (not a human moderation)
Q1: dy/dx=3x²y, y(0)=4 -> ln|y|=x³+C -> y=4 exp(x³); y(1)=4e; y'=12x²exp(x³)=3x²y and y(0)=4. Part marks 3+1+2=6.
Q2: dM/dt=-2tM, M(0)=50 -> M=50 exp(-t²) grams; M=25 -> t=sqrt(ln 2) hours (t>=0), unique first time since M strictly decreases for t>0; M>0 for finite t. Part marks 3+2+1=6. Total 12 matches stored total. No arithmetic defect in this sampled draft; **not** an exhaustive Signature review or authorisation to release.

## Open controls / release decision
- 240 active pilot metadata gaps require syllabus/board verification; do not infer their suitability for confidential timed mocks.
- Exact mathematical recomputation, distractor validation and near-duplicate analysis of all 2,190 active items **not performed**; no new practice publication independently certified.
- Official 2026–27 board PDFs, copyright provenance, rendered KaTeX, cross-account RLS/storage, timed mock enforcement, CI and student readiness **not certified** this cycle.
- No question or Signature status changed. No student or parent Signature grade/report issued. No new content published.
- Original verified practice can publish automatically after full mathematical and official specification checks; questionable drafts remain staged. No owner approval gate.
- Carry findings into established evening owner report.

Reproduce inventory:
```sql
select count(*) total, count(*) filter(where active) active,
 count(*) filter(where active and review_state='approved') active_approved,
 count(*) filter(where active and (coalesce(trim(explanation),'')='' or coalesce(trim(exam_board),'')='' or coalesce(trim(syllabus_objective), '')='')) active_metadata_gaps
from private.grove_practice_bank;
select count(*) total, count(*) filter(where human_moderated_by is not null) moderated
from private.grove_signature_editorial;
select count(*) from private.grove_tasks;
select count(*) from private.grove_task_items;
```
