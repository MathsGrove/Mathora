# Independent Maths QA — 2026-11-23 17:56 Asia/Kuwait

## Live sources
Supabase project `nwakgkxytovprrrwyahs`, private schema; connected GitHub `MathsGrove/Mathora`. Requested `Mathora-mathematics/Mathora` is not present in accessible repository listing.

## Inventory (live)
Practice 2244 total, 2192 active, 1952 approved; 240 active with empty/NULL board or objective metadata; 56 active explanations <30 characters. Signature 66 editorial records, 0 human-moderated. Assignment 52 items, 0 missing/inactive source, 0 prompt mismatch, 3 assigned-vs-bank difficulty differences.

## New Signature editorial review
ID `fc0ad8f2-7900-4bb3-b217-8465d867837f`, created 2026-11-23 14:04:03 UTC; *Variable Acceleration and Vertical Motion — Specialist Review*; awaiting human moderation.
Q1: a=6t-4, v(0)=3 => v=3t²-4t+3 (3 marks). s(0)=0 => s=t³-2t²+3t (3 marks); s(2)=6m (1 mark). Q1=7.
Q2: u=24m/s, g=10m/s²; apex t=24/10=12/5s (2 marks); h=24²/(2*10)=144/5m (2 marks); s=20 => 5t²-24t+20=0; discriminant 176=16*11; t=(12±2√11)/5 seconds (3 marks). Both times positive, below apex height. Q2=7. Sum=14, matching stored 14. All six part allocations and method/accuracy steps checked; no mathematical mismatch detected. This is NOT human moderation and does not authorise grades.

## Practice delta
No practice rows with reviewed_at >= 2026-11-23 12:00 UTC in the queried field; note reviewed_at is not a creation timestamp, so this is not conclusive proof of no new unreviewed questions. Inventory unchanged versus preceding cycle. No new practice published or quarantined by QA.

## Reproducible checks
```sql
select count(*) total,count(*) filter(where active) active,count(*) filter(where review_state='approved') approved,
count(*) filter(where active and (nullif(trim(exam_board),'') is null or nullif(trim(syllabus_objective),'') is null)) metadata_gaps,
count(*) filter(where active and length(trim(coalesce(explanation,'')))<30) short_explanations
from private.grove_practice_bank;
select count(*) total,count(*) filter(where human_moderated_by is not null) moderated,max(created_at) latest from private.grove_signature_editorial;
select count(*) items,count(*) filter(where b.id is null or not b.active) invalid_sources,
count(*) filter(where i.prompt is distinct from b.prompt) prompt_mismatch,
count(*) filter(where i.difficulty is distinct from b.difficulty) difficulty_differences
from private.grove_task_items i left join private.grove_practice_bank b on i.bank_id=b.id;
```

## Open controls
Official component syllabus source confirmation for the new Signature, complete practice question-by-question independent verification, distractors and browser KaTeX, per-student unseen/adaptation and Ready status, near-duplicate family analysis, copyright provenance, RLS cross-user policy testing, photo/whiteboard storage, examiner marking, server mock timers, GitHub Pages deployment and staff-only editorial access were NOT certified in this run. RLS-enabled alone is insufficient to prove isolation. Do not infer pass. No production data changed; no Signature grades/reports released. Verified original practice may publish without owner gate only after full mathematical and official specification checks.
