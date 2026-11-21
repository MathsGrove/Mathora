# Independent Maths QA — 2026-11-21 16:02 Asia/Kuwait

## Live evidence
Supabase project nwakgkxytovprrrwyahs queried directly. question_bank: 10 total, 9 active, 1 inactive; zero records created in previous two hours; latest creation 2026-10-28T11:37:12Z. Read all 10 question prompts and mark_schemes. No new cohort to publish. GitHub MathsGrove/Mathora latest commit before this journal: fce89636cebf418fc6f7ee9469da0f99bc411b25. GitHub Actions Pages deployment run 44897385210 and CodeQL run 44897385317 both reported success for that commit (2026-11-21 11:05 UTC). No live browser end-to-end deployment check.

## Independent arithmetic and marking checks
- IGCSE x²−7x+12=0 => (x−3)(x−4)=0 => 3,4; M1 A1 A1 = 3.
- IGCSE 3(2x−1)=4x+9 => 6x−3=4x+9 => 2x=12 => x=6; M1 M1 A1 = 3.
- IGCSE right triangle 6,8 => sqrt(36+64)=10 cm; M1 M1 A1 = 3.
- GCSE 3/4+5/6 => 9/12+10/12=19/12=1 7/12; M1 M1 A1 = 3.
- GCSE x+y=10, 2x−y=5 => 3x=15 => x=5,y=5; M1 M1 A1 A1 = 4.
- A Level derivative 3x³−5x²+7x−2 => 9x²−10x+7; B1 B1 B1 = 3.
- A Level integral 6x²−4x+1 => 2x³−2x²+x+C; B1 B1 B1 B1 = 4.
- IB AA x²−6x+5=(x−3)²−4 => vertex (3,−4); M1 A1 M1 A1 = 4.
- IB AI 4+7+8+9+12=40, /5=8; M1 A1 = 2.
- Inactive TMUA quadratic roots 3,4 sum 7; M1 A1 B1 = 3. Remains quarantined: exact quadratic-family overlap with active IGCSE question and unsuitable written-response mode.
Total 32 marks, active 29. This validates stored answer and mark allocation only, NOT full worked explanations, distractors, LaTeX rendering or official syllabus compliance.

## Security and certification blockers
Live pg_policies: mark_schemes schemes_select allows eligible-role membership without an organisation match; question_bank questions_select allows active rows for any membership without organisation match. These are potential isolation flaws, not demonstrated cross-tenant exploits. Authenticated cross-org testing still required.
question_bank has no dedicated exam board, component, specification year, distractors, copyright provenance or full explanation fields. No claim of official 2026–27 board-level alignment is justified. Student-specific allocation, unseen families, baseline adaptation, tier inheritance, Ready status, safe student-work object access, mock server timers, examiner marking and Signature moderation were not fully revalidated in this cycle. Do not infer zero errors from untested controls.

## Decision
No new cohort; no publish, quarantine change, grade, report or production database mutation. Previously quarantined TMUA remains inactive. Original practice can be published without owner approval only after full maths/specification/copyright verification. Findings available for established evening owner report.
## Reproducibility
SELECT count(*), count(*) FILTER (WHERE active), count(*) FILTER (WHERE created_at>=now()-interval '2 hours'), max(created_at) FROM public.question_bank;
SELECT q.id,q.qualification,q.topic,q.prompt,q.marks,q.difficulty,q.active,q.created_at,m.scheme FROM public.question_bank q LEFT JOIN public.mark_schemes m ON m.question_id=q.id ORDER BY q.created_at DESC;
SELECT tablename,policyname,cmd,qual FROM pg_policies WHERE schemaname='public' AND tablename IN ('question_bank','mark_schemes');
