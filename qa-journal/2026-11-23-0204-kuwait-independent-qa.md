# Independent QA — 2026-11-23 02:04 Asia/Kuwait

Repository identity: requested Mathora-mathematics/Mathora not in connected account; audited accessible MathsGrove/Mathora. Supabase project: nwakgkxytovprrrwyahs.

## Live checks
- private.grove_practice_bank: 2243 total, 2190 active, 1950 active approved.
- 240 active records have blank/missing exam_board or syllabus_objective; 0 of these are approved. IMPORTANT: SQL must test NULL *and empty string* via nullif(trim(...),'').
- 56 active explanations shorter than 30 characters (editorial flags, not proven errors).
- 0 active records with missing prompt, missing correct_text, or choices not a four-element JSON array.
- private.grove_signature_editorial: 62 total, 0 human_moderated_by. Latest remains Arithmetic and Geometric Progressions — Original Mini-Paper, 12 marks, awaiting_human_moderation.
- private.grove_tasks: 49; private.grove_task_items: 52.
- 0 task items missing source bank, 0 referencing inactive bank records, 0 prompt snapshot drift.
- **3 task items have difficulty snapshot 4 while source-bank difficulty is 3,5,3 respectively**, all in task f701b4a2-8a55-4e6a-a1e6-00a626d363f1, positions 4–6. This may be intentional adaptive difficulty; verify policy before changing immutable assigned snapshots. No automatic mutation.

## Reproducible SQL
```sql
select count(*) total, count(*) filter(where active) active,
 count(*) filter(where active and review_state='approved') approved,
 count(*) filter(where active and (nullif(trim(exam_board),'') is null or nullif(trim(syllabus_objective),'') is null)) metadata_gap,
 count(*) filter(where active and length(coalesce(explanation,''))<30) short_explanations
from private.grove_practice_bank;
select count(*) total, count(*) filter(where human_moderated_by is not null) moderated from private.grove_signature_editorial;
select count(*) assigned, count(*) filter(where b.id is null) missing_bank,
 count(*) filter(where b.id is not null and not b.active) inactive_bank,
 count(*) filter(where b.id is not null and b.prompt is distinct from i.prompt) prompt_drift,
 count(*) filter(where b.id is not null and b.difficulty is distinct from i.difficulty) difficulty_drift
from private.grove_task_items i left join private.grove_practice_bank b on b.id=i.bank_id;
```

## Certification boundary
No new Signature paper since previous cycle. The previously checked progression mini-paper remains staged for human moderation. No full-bank independent maths, official 2026–27 board/component syllabus, distractor correctness, near-duplicate student exposure, copyright, RLS cross-tenant penetration, photo storage, server timers, examiner marking, rendered KaTeX, or GitHub Pages CI certification performed in this run. Do not infer a pass from status fields. No question published, quarantined, or changed; no Signature report issued. Verified original practice may publish without owner approval once substantive checks pass. Carry difficulty drift and outstanding checks to evening owner report.
