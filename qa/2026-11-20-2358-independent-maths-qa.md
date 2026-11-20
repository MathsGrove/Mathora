# Independent Maths QA — 2026-11-20 23:58 Asia/Kuwait

## Scope and reproducibility
Read-only LIVE Supabase project `nwakgkxytovprrrwyahs`; GitHub `MathsGrove/Mathora` latest accessible commit before this journal: `607ab2ff7de29c6b2f32a98a7e553edb0f860b4e`. Requested legacy owner `Mathora-mathematics` not separately confirmed.

SQL:
```sql
select q.id,q.qualification,q.topic,q.prompt,q.marks,q.difficulty,q.active,q.created_at,m.scheme
from public.question_bank q left join public.mark_schemes m on m.question_id=q.id order by q.created_at desc;
select tablename,policyname,cmd,qual from pg_policies
where schemaname='public' and tablename in ('question_bank','mark_schemes');
select count(*) from public.paper_questions;
select count(*) from public.question_bank where created_at >= now()-interval '2 hours';
```

## Independent algebraic recomputation
- IGCSE factorisation: (x−3)(x−4)=x²−7x+12; roots 3,4. 3 marks valid.
- IGCSE linear: 6x−3=4x+9 -> 2x=12 -> x=6. 3 marks valid.
- IGCSE Pythagoras: sqrt(6²+8²)=sqrt(100)=10 cm. 3 marks valid.
- GCSE fractions: 3/4+5/6=9/12+10/12=19/12=1 7/12. 3 marks valid.
- GCSE simultaneous: sum x+y=10 and 2x−y=5 gives 3x=15, x=5, y=5. 4 marks valid.
- A Level derivative: d/dx(3x³−5x²+7x−2)=9x²−10x+7. 3 marks valid.
- A Level antiderivative: integral(6x²−4x+1)dx=2x³−2x²+x+C; differentiation restores integrand. 4 marks valid.
- IB AA vertex: x²−6x+5=(x−3)²−4 -> (3,−4). 4 marks valid.
- IB AI mean: (4+7+8+9+12)/5=40/5=8. 2 marks valid.
- TMUA inactive: roots 3 and 4, sum 7; mathematically correct 3-mark scheme but format is not MCQ and duplicates IGCSE factorisation family. Retain quarantine.

Total 32 marks, 29 active; 10 records, 9 active, 1 inactive; 0 new records in last 2 hours; 0 paper_questions; 1 entitlement.

## Findings / limitations
PASS: arithmetic, algebra, final results and scheme-point totals for all ten records. FAIL for TMUA suitability (already inactive). No new cohort eligible for publication.
UNVERIFIED: per-student unseen IDs and adaptive readiness (no allocations), board-specific official syllabus/component, original provenance/copyright, distractor keys (not represented), complete worked explanations, actual KaTeX browser rendering, CI live success, mock timer server enforcement, examiner moderation and Signature editorial part-by-part grading. Do not infer Ready from 9 active questions.
SECURITY RISK: `schemes_select` uses any partner/examiner/admin membership, no matching org predicate; `questions_select` uses any membership and active, no org predicate. These are potential cross-tenant leaks, not proven without authenticated tests. Avoid making a blind RLS change before checking tenant schema and legitimate access patterns. Student-work storage retention and object-level isolation remain unverified; do not expose/delete images.
No Signature grades or reports issued. No database mutation performed. Continue authorised auto-publication ONLY after full question-by-question specification, explanation, key and rendering verification.
