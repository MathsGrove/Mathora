# Independent Maths QA — 2026-11-20 14:02 Asia/Kuwait

## Live scope
Supabase project `nwakgkxytovprrrwyahs`; GitHub accessible repository `MathsGrove/Mathora` (README fetched). Requested old owner `Mathora-mathematics/Mathora` was not successfully fetched this run.

SQL reproducibility:
```sql
select count(*) total, count(*) filter (where active) active,
count(*) filter (where created_at >= now()-interval '2 hours') recent
from public.question_bank;
select q.id,q.prompt,q.marks,q.active,m.scheme from public.question_bank q
left join public.mark_schemes m on m.question_id=q.id;
select policyname,tablename,cmd,qual from pg_policies
where schemaname='public' and tablename in ('mark_schemes','question_bank');
```
Results: total 10; active 9; recent 0; attempts 0; answers 0; reviews 0; paper_questions 0; entitlements 1.

## Independent mathematics
All ten stored question prompts and schemes checked by substitution/algebra:
- IGCSE quadratic: (x-3)(x-4), roots 3,4, 3 marks PASS.
- IGCSE linear: 6x-3=4x+9 -> x=6, 3 marks PASS.
- IGCSE Pythagoras: sqrt(36+64)=10 cm, 3 marks PASS.
- GCSE fractions: 9/12+10/12=19/12=1 7/12, 3 marks PASS.
- GCSE simultaneous: 3x=15 -> (x,y)=(5,5), 4 marks PASS.
- A-level derivative: 9x²-10x+7, 3 marks PASS.
- A-level antiderivative: 2x³-2x²+x+C, 4 marks PASS.
- IB AA vertex: (3,-4), 4 marks PASS.
- IB AI mean: (4+7+8+9+12)/5=8, 2 marks PASS.
- TMUA roots sum 7, 3 marks mathematical PASS; **inactive/quarantined** for written-response format and duplicate IGCSE quadratic family.

All 32 stored marks arithmetically agree; 29 active marks. This is NOT full board-specific or assessment certification. Question_bank lacks structured board/component, distractors, keys, full explanations and rendering fields. No newly published question cohort exists to certify. No Signature mark records or human moderation evidence were found in inspected public table names.

## Security and readiness
`mark_schemes` SELECT policy `schemes_select` checks staff membership role but has no organisation-specific match. Potential cross-tenant exposure: effective access not proven; requires two-organisation authenticated test and a carefully designed scoped policy. `questions_select` checks active and any membership. Do not upload real student data until security/privacy tests pass, consistent with repository README. Zero recorded paper_questions or attempts means unseen allocation, adaptation, mode/tier and Ready status cannot be certified. No GitHub Pages CI, timer, photo object isolation, copyright provenance or official 2026–27 syllabus tests completed in this run.

## Release decision
0 published; 0 newly quarantined; previous TMUA quarantine confirmed. No Signature grades or reports issued. No database changes. Fully verified original practice remains preauthorised for release without owner approval; uncertified drafts remain staged. Findings available for established evening owner report.
