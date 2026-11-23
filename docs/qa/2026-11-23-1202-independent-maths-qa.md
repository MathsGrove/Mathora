# Independent Maths QA — 2026-11-23 12:02 Asia/Kuwait

## Live sources
- Supabase project `nwakgkxytovprrrwyahs`, private.grove_practice_bank and private.grove_signature_editorial, read-only queries during this run.
- Connected GitHub repository `MathsGrove/Mathora`; requested `Mathora-mathematics/Mathora` was not in installed repository search results.
- Latest editorial commit: https://github.com/MathsGrove/Mathora/commit/58f61de773d09146c4365046fcdc4ed54381ad59
- Official Cambridge 9709 2026–2027 v5: https://www.cambridgeinternational.org/Images/697427-2026-2027-syllabus.pdf (Paper 1 topic 1.1 Quadratics).

## Live counts
Practice: 2244 total, 2192 active, 1952 active approved; 240 active with blank board/objective; 56 active with explanation under 30 characters. Signature: 64 total; 0 human-moderated; newest created 2026-11-23 04:00 UTC (unchanged since prior audit).

## Newly approved P1 practice question
ID `6f55072f-6d58-4003-9217-e675f4e7b52b`. For real k, y=x²−2(k+1)x+k²+4 touches x-axis exactly once. Recompute Δ=[−2(k+1)]²−4(k²+4)=8k−12, so Δ=0 iff k=3/2. At k=3/2, y=(x−5/2)², one repeated real intercept. Distractors: k=−3/2 => Δ=−24 (no real intercept); k=2 => Δ=4 (two); k=3 => Δ=12 (two). Unique correct choice is 3/2. Four distinct options; answer matches. Worked explanation independently confirmed. Cambridge 9709 Paper 1 §1.1 Quadratics is present in official 2026–2027 syllabus. The mathematical delimiters were inspected in stored JSON but not browser-rendered; KaTeX certification pending.

## Signature
Newest 14-mark mechanics mini-paper remains awaiting human moderation. Independently recomputed: vertical projectile t_top=2 s, h_max=20 m, at t=3 s displacement +15 m and velocity −10 m/s; connected masses a=(30−20)/5=2 m/s², A downward; T=24 N; s=1/2·2·1.5²=2.25 m. Part allocations 2+2+3+3+2+2=14. No human moderation; no Signature grade issued.

## Controls and limitations
No new question was published or quarantined in this QA run. No erroneous new P1 mathematics found. Active metadata gaps 240 and short explanations 56 remain review flags. Student-level unseen selection, near-duplicate families, baseline adaptation, tier/mode inheritance and Ready status were not certified. Cross-tenant RLS, private photo/whiteboard storage, server mock timers, examiner marking and live GitHub Pages deployment not fully tested. GitHub combined commit status API returned zero status records, which is not evidence of a passing Pages deployment. Copyright: original item inspected; no external similarity scan performed. Avoid releasing any Signature student/parent reports without human examiner moderation.

## Reproducible read-only SQL
```sql
select count(*) total, count(*) filter(where active) active,
count(*) filter(where active and review_state='approved') approved,
count(*) filter(where active and (nullif(btrim(exam_board),'') is null or nullif(btrim(syllabus_objective),'') is null)) metadata_gaps,
count(*) filter(where active and length(coalesce(explanation,''))<30) short_explanations
from private.grove_practice_bank;
select count(*) total,count(*) filter(where human_moderated_by is not null) moderated,max(created_at) latest
from private.grove_signature_editorial;
```
