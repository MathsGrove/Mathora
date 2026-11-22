# Independent QA — 2026-11-22 18:00 Asia/Kuwait

## Live evidence
Supabase project `nwakgkxytovprrrwyahs`, read-only SQL:
```sql
select (select count(*) from private.grove_practice_bank) total,
(select count(*) from private.grove_practice_bank where active) active,
(select count(*) from private.grove_practice_bank where active and review_state='approved') approved,
(select count(*) from private.grove_signature_editorial) signature,
(select count(*) from private.grove_signature_editorial where human_moderated_by is not null) moderated,
(select count(*) from private.grove_tasks) tasks,
(select count(*) from private.grove_task_items) items,
(select count(*) from private.grove_practice_bank where active and
 (coalesce(exam_board,'')='' or coalesce(syllabus_objective,'')='')) metadata_gaps;
```
Results: total 2243; active 2190; approved active 1950; Signature 61; human moderated 0; tasks 49; task items 52; active metadata gaps 240. These are inventory and metadata checks, NOT exhaustive mathematical certification.

## Newest Signature record independently recomputed
ID `a03ee7e3-7132-4d82-9203-66b0c13d8346`, created 2026-11-22 14:00:06 UTC; 12 marks, awaiting human moderation.

Q1: f(x)=2x²−12x+11 = 2(x−3)²−7. Roots 3±sqrt(14)/2. f(x)≤1 iff 1≤x≤5. Part marks 3+2+1=6. PASS.
Q2: h(x)=(x−2)²+3, x≥2. Range [3,∞); strictly increasing on domain. Inverse h^-1(x)=2+sqrt(x−3), domain x≥3. h^-1(12)=5, h(5)=12. Part marks 2+2+2=6. PASS.
Grand total 12. No human examiner action or grade release performed. This verifies only this paper's mathematical content and part allocations, not official syllabus mapping or human moderation.

## Findings / limitations
- 240 active practice records missing exam board or syllabus objective. These are not certified for board-specific claims.
- 61 Signature records; none human moderated. Maintain staff-only staging.
- GitHub `Mathora-mathematics/Mathora` README not retrievable; connected `MathsGrove/Mathora` README retrieved. Repository identity discrepancy unresolved.
- Exhaustive 2190-item exact answers, distractors, near-duplicate families, individual student adaptation and unseen status, official 2026–27 specs, KaTeX rendering, RLS isolation, photos retention, examiner controls, mock timers and Pages CI not verified in this run. Do not count as passes.
- No practice or Signature publication/status mutation. No student reports issued.
