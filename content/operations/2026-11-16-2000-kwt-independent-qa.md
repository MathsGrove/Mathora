# MathsGrove independent QA — 2026-11-16 20:00 Asia/Kuwait

## Scope and evidence
Direct read-only SQL against Supabase project `nwakgkxytovprrrwyahs`; accessible GitHub repository `MathsGrove/Mathora`. The requested `Mathora-mathematics/Mathora` repository identifier failed to resolve through GitHub connector. Latest prior journal: https://github.com/MathsGrove/Mathora/commit/9f573adb9a05f92963ac58aa68061b4b6a03ab4e.

## Reproducible live SQL
```sql
select (select count(*) from private.grove_practice_bank) practice_total,
 (select count(*) from private.grove_practice_bank where active and review_state='approved') approved_active,
 (select count(*) from private.grove_practice_bank where active and review_state is distinct from 'approved') active_unapproved,
 (select count(*) from private.grove_signature_editorial) signature_total,
 (select count(*) from private.grove_signature_editorial where human_moderated_at is not null) moderated,
 (select count(*) from private.grove_signature_editorial where created_at >= '2026-11-16 15:00+00') new_signature,
 (select count(*) from private.grove_tasks) tasks,
 (select count(*) from private.grove_task_items i left join private.grove_practice_bank b on b.id=i.bank_id where b.id is null or not b.active or b.review_state is distinct from 'approved') ineligible_items;
select count(*) filter (where nullif(trim(exam_board),'') is null or nullif(trim(syllabus_objective),'') is null) missing_mapping,
 count(*) filter (where length(coalesce(explanation,''))<20) short_explanations
 from private.grove_practice_bank where active and review_state is distinct from 'approved';
```
Results: practice_total=2236; approved_active=1942; active_unapproved=240; signature_total=49; moderated=0; new_signature=0; tasks=49; ineligible_items=4; missing_mapping=240; short_explanations=12.

## Signature check
No new Signature manuscript since 18:00 Kuwait. Latest paper `2a5aee94-79b6-4a5b-940a-da85ee0b16dc` is awaiting_human_moderation, 16 marks. Recomputed BALLOON counts: 7!/(2!2!)=1260, 6!/2!=360, 5!/(6!/2!)=1/3. For weights (1,2,3,4)k, k=1/10, E[X]=2, E[X²]=5, Var(X)=1, P(X>=2|X>=1)=7/9. Part allocations 3+3+2+2+4+2=16, consistent. This mathematical pass does not constitute authorised human moderation, exact official syllabus mapping, or rendered typesetting certification.

## Findings / release decision
- Four ineligible task item references remain.
- 240 active unapproved pilots have missing board/objective mapping, 12 with explanations shorter than 20 characters. Do not count as approved supply.
- Publication timestamps absent from private practice bank, so a complete newly published cohort cannot be isolated. No exhaustive answer/distractor audit or student-specific no-repeat/Ready/adaptation certification possible this run.
- Previously identified mark_schemes SELECT organisation-scope concern remains open; no authenticated cross-tenant exploit tested this run.
- Official syllabus PDFs, copyright provenance, browser KaTeX, student uploads/storage isolation, server mock timers, examiner workflow, and GitHub Pages CI not independently certified this run.
- No new practice activated, no quarantine mutations, no student/parent Signature grades or reports, no untested RLS changes.
- Owner's preauthorisation for mathematically and specification-verified original practice publication remains in force; no approval gate introduced. This run had no sufficiently verified new practice candidate to publish.
- Escalate persistent security and supply findings via established evening owner report. No direct email was sent by this QA run.
