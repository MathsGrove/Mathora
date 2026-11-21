# Independent QA — 2026-11-21 06:04 Asia/Kuwait

## Evidence and scope
Live read-only Supabase project `nwakgkxytovprrrwyahs` and GitHub `MathsGrove/Mathora` inspected on 2026-11-21. Requested `Mathora-mathematics/Mathora` could not be resolved through repository search. Last visible repository commit before this journal: `67723adb829804911d119cc2f8a7e811dba0bd7b` (04:00 Kuwait QA). All ten question-bank rows carry created_at 2026-10-28 11:37:12 UTC: no newly created question in this cycle. This does NOT independently prove no activation/edit since the question_bank schema has no updated_at field.

## Independent mathematical recalculation
All IDs refer to live question_bank.id, with corresponding mark_schemes.question_id. Individual marking points sum to the stored question marks.

| Question ID prefix | Qualification | Recalculation / check | Marks | Decision |
|---|---|---|---:|---|
| 0cbb3e11 | IGCSE | x²−7x+12=(x−3)(x−4); roots 3,4 | 3 | correct |
| 304efb65 | IGCSE | 3(2x−1)=4x+9 => 6x−3=4x+9 => x=6 | 3 | correct |
| cbcc8ab9 | IGCSE | right triangle hypotenuse sqrt(6²+8²)=10 cm | 3 | correct |
| 58f1e962 | GCSE | 3/4+5/6=9/12+10/12=19/12=1 7/12 | 3 | correct |
| eefa886e | GCSE | (x+y)+(2x−y)=15 => x=5, y=5 | 4 | correct |
| 3b23181d | A_LEVEL | d/dx (3x³−5x²+7x−2)=9x²−10x+7 | 3 | correct |
| 6c76fb80 | A_LEVEL | integral (6x²−4x+1)dx=2x³−2x²+x+C | 4 | correct |
| 98fff8a2 | IB_AA | x²−6x+5=(x−3)²−4 => vertex (3,−4) | 4 | correct |
| 06fd867b | IB_AI | (4+7+8+9+12)/5=40/5=8 | 2 | correct |
| 4955338b | TMUA | roots 3 and 4, sum 7; mathematical answer correct but written-response format and near-duplicate of 0cbb3e11 | 3 | remain inactive |

Total 32 marks, 29 active. These are checks of exact answers and stored mark-point consistency, NOT proof of distractor validation, detailed worked explanations, rendered LaTeX, provenance or official syllabus certification. No distractor columns, full explanations, board/component mapping or provenance exist in the inspected question_bank/mark_schemes schemas. All active items are generic qualification-tagged; do not certify precise board/component eligibility.

## Live inventory, adaptation, safety
- 10 stored / 9 active / 1 inactive. Active by qualification: IGCSE 3, GCSE 2, A_LEVEL 2, IB_AA 1, IB_AI 1, TMUA 0.
- 1 entitlement: exam tier, 0 Signature credits, valid through 2026-12-25; 1 preference: GCSE / AQA_8300 / Higher. No attempts, answers, reviews or paper-question allocations. Consequently actual unseen sets, baseline/feedback adaptation, student Ready status, mode inheritance and moderated Signature marks cannot be empirically verified. Question supply is plainly too small for sustained nonrepetitive practice.
- 31 private `student-work` storage objects but 0 attempts. Provenance, retention, orphan handling and effective per-user object isolation are unresolved; no student photos opened or deleted.
- `mark_schemes` SELECT RLS: eligible staff membership check without an organisation match. `question_bank` SELECT RLS: active + any membership, also without organisation match. Potential tenant isolation issue; requires authenticated cross-tenant tests. No policy change made without a tested tenant-aware replacement.
- GitHub Pages CI success, server mock timer enforcement, student photo/whiteboard RLS, copyright provenance and official 2026–27 qualification/component verification were not established in this cycle. Do not equate presence of workflows with successful deploy.
- No Signature attempts or reviews; no automated examiner impersonation, grade or parent report issued.

## Reproduction SQL
```sql
select id,qualification,topic,prompt,marks,difficulty,active,created_at from public.question_bank order by created_at,id;
select question_id,scheme from public.mark_schemes order by question_id;
select qualification,count(*) filter(where active) active,count(*) filter(where not active) inactive from public.question_bank group by qualification;
select (select count(*) from public.attempts) attempts,(select count(*) from public.answers) answers,(select count(*) from public.paper_questions) allocations,(select count(*) from public.reviews) reviews,(select count(*) from storage.objects where bucket_id='student-work') student_work_objects;
select tablename,policyname,cmd,qual from pg_policies where schemaname='public' and tablename in ('question_bank','mark_schemes');
```

## Release decision
No newly created cohort to publish or quarantine. Existing TMUA quarantine retained. No live content edits or student-facing Signature grades. Owner approval is NOT required for original practice that passes substantive mathematical, board, copyright, formatting and security checks; insufficiently evidenced drafts must stay staged. Findings should be included in established evening owner report. This journal is a reproducible record, not certification of all requested controls.
