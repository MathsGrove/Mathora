# Independent QA — 2026-11-21 02:00 Asia/Kuwait

## Sources and scope
Live Supabase project `nwakgkxytovprrrwyahs`, tables `question_bank`, `mark_schemes`, `pg_policies`, `storage.objects`; connected GitHub repository `MathsGrove/Mathora` (ID 1323744009). Requested owner `Mathora-mathematics` returned no accessible repositories. Read-only inspection; no new cohort in last two hours.

## Reproducible SQL
```sql
select q.*,row_to_json(m) scheme from public.question_bank q left join public.mark_schemes m on m.question_id=q.id order by q.created_at desc;
select count(*) from public.question_bank where created_at>=now()-interval '2 hours';
select qualification,active,count(*),sum(marks) from public.question_bank group by qualification,active;
select tablename,policyname,cmd,qual from pg_policies where schemaname='public' and tablename in ('question_bank','mark_schemes');
select bucket_id,count(*) from storage.objects group by bucket_id;
```

## Independent mathematical checks (all 10)
- IGCSE factorisation: (x-3)(x-4)=0 => x=3,4. 3 marks valid.
- IGCSE linear: 6x-3=4x+9 => 2x=12 => x=6. 3 marks valid.
- IGCSE Pythagoras: sqrt(6²+8²)=sqrt(100)=10 cm. 3 marks valid.
- GCSE fractions: 3/4+5/6=9/12+10/12=19/12=1 7/12. 3 marks valid.
- GCSE simultaneous: adding equations => 3x=15 => x=5,y=5. 4 marks valid.
- A Level differentiation: derivative 9x²-10x+7. 3 marks valid.
- A Level integration: 2x³-2x²+x+C; derivative returns original. 4 marks valid.
- IB AA vertex: x²-6x+5=(x-3)²-4 => (3,-4). 4 marks valid.
- IB AI mean: (4+7+8+9+12)/5=40/5=8. 2 marks valid.
- TMUA inactive: roots 3,4 => sum 7; 3 stored marks internally consistent but format written-response, not TMUA MCQ; overlaps IGCSE quadratic. Remain quarantined.

Total 32 marks, 29 active; 10 records, 9 active, 1 inactive. No recent question creations. This verifies stored answers and point counts, NOT complete examiner-standard marking guidance or official specification coverage.

## Security and readiness
- `mark_schemes.schemes_select`: eligible membership roles without organisation match. `question_bank.questions_select`: active and membership without organisation match. Potential cross-organisation exposure; authenticated isolation testing still needed. Do not claim proven exploit.
- `student-work` has 31 storage objects while attempts=0 (per live table inventory). Do not inspect/delete student photos without provenance and retention assessment.
- Zero attempts, answers, reviews and paper_questions; one entitlement. No evidence to certify unseen assignment, baseline/feedback adaptation, Ready status, Signature human moderation, timer enforcement.
- Schema does not carry distractor options, official board/component mappings, provenance or complete worked solutions. Cannot certify distractors, official 2026-27 syllabus/copyright, KaTeX rendering. GitHub Pages workflow path `.github/workflows/deploy.yml` was not found; deployment CI not certified.

## Release decision
No new publication cohort; no publication or database mutation. Previously quarantined TMUA remains inactive. No Signature grades/reports generated. Original practice may be auto-published only after full mathematical/specification verification. Security issues remain open; findings to be included in established evening report.