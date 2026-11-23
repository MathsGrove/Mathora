# Independent Maths QA — 2026-11-23 22:03 Asia/Kuwait

Source: live Supabase project `nwakgkxytovprrrwyahs`, private schema; GitHub connected repository `MathsGrove/Mathora` (requested `Mathora-mathematics/Mathora` not accessible under that owner). Comparison: prior QA commit `eee05cce6ba00c25d794bbc476e4d2d4c92b4ce9`.

## Inventory
- Private practice bank: 2,244 total; 2,192 active; 1,952 approved. No increase since 20:01 QA.
- Active missing board/objective (NULL **or empty**): 240. Active explanations <30 chars: 56. These are review flags, not independently proven errors.
- Private Signature editorial: 68 total (+1); zero human moderators. Newest ID `47081e1f-4c45-499e-8c45-f00363264081`, *Stationary Points, Tangents and Enclosed Area — Original Review*, 13 marks, awaiting human moderation.
- Assignment snapshot: 52 items, zero missing/inactive source IDs, zero source prompt mismatches, 3 assigned-vs-bank difficulty mismatches. No duplicate normalized assigned stems per student (lowercase, whitespace collapse). 49 tasks: 40 scheduled, 5 expired, 4 completed. Ready status and unseen/near-duplicate-family checks remain unverified.
- Answer-key verification: 0/2,192 active practice records have correct_text absent from choices; 0/52 assignment records have invalid choice IDs or choice text differing from bank correct_text. Note: task choices are JSON objects `{id,text}`, not string arrays. A naive `jsonb_array_elements_text` comparison falsely flags all 52.

## Independent new Signature paper recomputation
Paper 1 curve y=x^3-6x^2+9x+2:
- Q1a derivative 3x²-12x+9=3(x-1)(x-3). x=1 => y=1-6+9+2=6; x=3 => 27-54+27+2=2. Scheme 3/3 structurally correct.
- Q1b y''=6x-12: -6 at x=1 local maximum, +6 at x=3 local minimum. Scheme 2/2.
- Q1c at x=2, y=8-24+18+2=4, derivative=12-24+9=-3; tangent y-4=-3(x-2), y=-3x+10. Scheme 2/2.
Paper 2 curve y=6x-x²:
- Q2a derivative 6-2x=0 at x=3, y=9, second derivative -2: maximum. Scheme 2/2.
- Q2b x(6-x)=0 -> (0,0),(6,0). Scheme 1/1.
- Q2c integral from 0 to 6 of 6x-x²: [3x²-x³/3]_0^6=108-72=36 square units. Scheme 3/3.
- Part totals Q1 3+2+2=7, Q2 2+1+3=6, total 13. All six mathematical results and allocations consistent with stored scheme. Human moderation **not** performed and must not be inferred. Official 2026–27 Cambridge 9709 P1 mapping, browser KaTeX, and assessment copyright not independently certified in this run.

## Reproducible SQL
```sql
select count(*) total, count(*) filter(where active) active,
 count(*) filter(where review_state='approved') approved,
 count(*) filter(where active and (nullif(trim(exam_board),'') is null or nullif(trim(syllabus_objective),'') is null)) metadata_missing,
 count(*) filter(where active and length(trim(coalesce(explanation,'')))<30) short_explanations
from private.grove_practice_bank;
select count(*) total, count(*) filter(where human_moderated_by is not null) human_moderated from private.grove_signature_editorial;
select id,title,question_paper,mark_scheme,review_state from private.grove_signature_editorial order by created_at desc limit 1;
select count(*) assigned, count(*) filter(where b.id is null or not b.active) missing_or_inactive,
 count(*) filter(where i.prompt is distinct from b.prompt) prompt_mismatch,
 count(*) filter(where i.difficulty is distinct from b.difficulty) difficulty_mismatch
from private.grove_task_items i left join private.grove_practice_bank b on b.id=i.bank_id;
select count(*) filter(where not exists(select 1 from jsonb_array_elements(i.choices) c where c->>'id'=i.correct_option)) invalid_option_id,
 count(*) filter(where not exists(select 1 from jsonb_array_elements(i.choices) c where c->>'id'=i.correct_option and c->>'text'=b.correct_text)) wrong_answer_mapping
from private.grove_task_items i join private.grove_practice_bank b on b.id=i.bank_id;
```

## Uncertified / controls
No new practice publication confirmed, and no production mutations made. Student-specific unseen and near-duplicate family matching, baseline/feedback adaptation, mode/tier inheritance, Ready logic, complete official syllabus and copyright review, security/RLS isolation, safe student photos/whiteboards, examiner marking, server-side mock timers, published GitHub Pages CI, staff-only Signature editorial access and browser-rendered KaTeX were not comprehensively tested. Do not report them as passed. No Signature grades/reports released. Verified original practice may be auto-published without owner approval only after substantive mathematical and official-specification verification; questionable drafts remain staged. Owner evening report should include the new paper and persistent flags.
