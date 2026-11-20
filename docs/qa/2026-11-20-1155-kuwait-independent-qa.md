# MathsGrove independent QA — 2026-11-20 11:55 Asia/Kuwait

## Live evidence
Supabase project nwakgkxytovprrrwyahs; GitHub repository requested as Mathora-mathematics/Mathora resolves to MathsGrove/Mathora (repository ID 1323744009, default branch main).

Read-only SQL: `select q.id,q.qualification,q.topic,q.prompt,q.marks,q.difficulty,q.active,q.created_at,m.scheme from public.question_bank q left join public.mark_schemes m on m.question_id=q.id order by q.created_at desc;`
Counts: 10 total questions, 9 active, 1 inactive TMUA; no questions created in previous two hours; 0 attempts, 0 paper_questions, 0 answers, 0 reviews.
Active distribution: IGCSE 3, GCSE 2, A_LEVEL 2, IB_AA 1, IB_AI 1, TMUA 0. Existing questions all created 2026-10-28.

## Independent arithmetic recheck (all 10)
- IGCSE quadratic x²−7x+12=(x−3)(x−4), roots 3,4; 3/3 marks coherent.
- IGCSE linear 3(2x−1)=4x+9 => 2x=12 => x=6; 3/3.
- IGCSE Pythagoras sqrt(6²+8²)=10 cm; 3/3.
- GCSE 3/4+5/6=9/12+10/12=19/12=1 7/12; 3/3.
- GCSE x+y=10, 2x−y=5 => 3x=15 => (5,5); 4/4.
- A Level derivative 3x³−5x²+7x−2 => 9x²−10x+7; 3/3.
- A Level integral (6x²−4x+1) dx => 2x³−2x²+x+C; 4/4.
- IB AA vertex x²−6x+5=(x−3)²−4 => (3,−4); 4/4.
- IB AI mean (4+7+8+9+12)/5=40/5=8; 2/2.
- Inactive TMUA roots 3,4 => sum 7; 3/3 mathematical marks, but format unsuitable (written justification, not multiple choice), repeats IGCSE family; quarantine remains effective.
Total 32 marks (29 active). Checks establish only stored final answers and scheme arithmetic, NOT full explanation, distractor/key, LaTeX rendering or syllabus certification. These fields are not available in the inspected public question_bank schema.

## Security and readiness
Both storage buckets (student-work, grove-student-exports) are private; per-object cross-account policies untested.
RLS enabled on inspected public tables. `mark_schemes` SELECT policy grants access to any member with partner/examiner/admin role without organisation predicate; potential cross-tenant disclosure requires authenticated adversarial test before claiming isolation.
`question_bank` SELECT policy exposes all active questions to any member; verify this matches intended confidentiality boundaries. No assignment/attempt records means adaptive sequencing, unseen IDs, tier inheritance and actual Ready status cannot be proven.
README explicitly warns not to upload real student data pending security/privacy tests, and describes draft practice content and migrations not automatically installed. GitHub Pages CI, server mock timer enforcement, copyright provenance, Signature staff moderation and official 2026–27 component syllabus checks not independently certified this run.

## Decision
No new cohort to publish. Existing defective TMUA remains inactive. No production modifications, no examiner impersonation or grade release. Retain staged status for content lacking independent full verification. Owner findings to existing evening reporting channel; no separate notification sent.
