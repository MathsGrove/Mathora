# Independent Maths QA — 2026-11-20 16:02 Asia/Kuwait

## Live sources
- Supabase project `nwakgkxytovprrrwyahs`: direct SQL reads of public.question_bank, mark_schemes, attempts, paper_questions, answers, reviews, student_entitlements, pg_policies and storage.buckets.
- GitHub: `Mathora-mathematics/Mathora` README fetch failed; `MathsGrove/Mathora` README, `.github/workflows/pages.yml` and `scripts/check-site.mjs` fetched. GitHub Pages workflow *definition* exists; run success and deployed content not verified.

## Counts (SQL as run)
```sql
SELECT (SELECT count(*) FROM question_bank) total,
 (SELECT count(*) FROM question_bank WHERE active) active,
 (SELECT count(*) FROM question_bank WHERE created_at>=now()-interval '2 hours') created_2h,
 (SELECT count(*) FROM attempts) attempts,
 (SELECT count(*) FROM paper_questions) allocations,
 (SELECT count(*) FROM answers) answers,
 (SELECT count(*) FROM reviews) reviews,
 (SELECT count(*) FROM student_entitlements) entitlements;
```
Result: 10 total, 9 active, 0 new, 0 attempts, 0 allocations, 0 answers, 0 reviews, 1 entitlement. Active by qualification: IGCSE 3, GCSE 2, A_LEVEL 2, IB_AA 1, IB_AI 1, TMUA 0.

## Independent mathematical recalculation (all 10 records)
1. IGCSE quadratic: (x-3)(x-4)=0 => roots 3,4; 3 marks consistent.
2. IGCSE linear: 6x-3=4x+9 => 2x=12 => x=6; 3 marks consistent.
3. IGCSE Pythagoras: sqrt(6²+8²)=sqrt(100)=10 cm; 3 marks consistent.
4. GCSE fractions: 3/4+5/6=9/12+10/12=19/12=1 7/12; 3 marks consistent.
5. GCSE simultaneous: (x+y)+(2x-y)=15 => x=5,y=5; 4 marks consistent.
6. A_LEVEL derivative: d/dx(3x³-5x²+7x-2)=9x²-10x+7; 3 marks consistent.
7. A_LEVEL integral: ∫(6x²-4x+1)dx=2x³-2x²+x+C; 4 marks consistent.
8. IB_AA vertex: x²-6x+5=(x-3)²-4 => (3,-4); 4 marks consistent.
9. IB_AI mean: (4+7+8+9+12)/5=40/5=8; 2 marks consistent.
10. Inactive TMUA: roots 3,4 => sum 7; 3 marks mathematically consistent but written-response format and repeated quadratic family; keep inactive.

Total 32 marks; active 29. Checks establish final answers and scheme-point arithmetic only, **not** complete explanations, distractors, board/component provenance, exam-year syllabus mapping, KaTeX visual rendering, or copyright clearance. No newly published question cohort to approve. The schema exposes no structured MCQ options or board/component identifiers.

## Security and product findings
- `mark_schemes` SELECT RLS checks staff role membership but does not bind to an organisation or question owner. Potential cross-org exposure; not proven without authenticated multi-org test. No speculative policy change: `mark_schemes` and `question_bank` have no org_id column, so narrow safe policy design needs schema/ownership decision.
- Storage buckets `student-work` and `grove-student-exports` both private. Storage object policy and signed URL access not verified.
- Zero allocations/attempts means real per-student unseen stems, adaptation, timer enforcement, human moderation, and readiness cannot be demonstrated.
- No examiner review rows. Do not release Signature grades or reports without human moderation.
- Repo README warns not to upload real student data until security testing.
- GitHub Pages workflow has integrity checks; workflow execution and deployment success not certified.

## Decision
No new publication; retain TMUA quarantine. No student data changes or Signature releases. Verified originals may be automatically published only after complete maths, syllabus, copyright and delivery checks. Remaining unverified controls are NOT passes. Findings to feed established evening owner report.
