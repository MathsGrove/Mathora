# MathsGrove independent QA — 2026-11-20 18:03 Asia/Kuwait

## Live evidence
Supabase project nwakgkxytovprrrwyahs queried live. public.question_bank: 10 rows, 9 active, 1 inactive; 0 created within previous 2 hours. All ten question prompts and associated mark_schemes were retrieved. public.attempts, answers, reviews, paper_questions each report zero rows in table metadata. Two storage buckets, student-work and grove-student-exports, have public=false.

## Independent mathematical recomputation (all records)
- IGCSE x²−7x+12=0 => (x−3)(x−4)=0, roots 3,4; 3 marks consistent.
- IGCSE 3(2x−1)=4x+9 => 6x−3=4x+9 => 2x=12 => x=6; 3 marks consistent.
- IGCSE right triangle 6,8 => sqrt(36+64)=10 cm; 3 marks consistent.
- GCSE 3/4+5/6 => 9/12+10/12=19/12=1 7/12; 3 marks consistent.
- GCSE x+y=10, 2x−y=5 => 3x=15 => (x,y)=(5,5); 4 marks consistent.
- A_LEVEL d/dx(3x³−5x²+7x−2)=9x²−10x+7; 3 marks consistent.
- A_LEVEL integral(6x²−4x+1)dx=2x³−2x²+x+C; 4 marks consistent.
- IB_AA vertex of x²−6x+5=(x−3)²−4 => (3,−4); 4 marks consistent.
- IB_AI (4+7+8+9+12)/5=40/5=8; 2 marks consistent.
- Inactive TMUA x²−7x+12 roots 3,4 => sum 7; 3-mark scheme mathematically consistent but written-response format incompatible with TMUA multiple choice and overlaps IGCSE quadratic; retain quarantine.

Total 32 marks, 29 active. All stored answer schemes mathematically agree with prompts. These are short mark schemes, not complete student-facing worked explanations. No structured distractors, board-specific component/version metadata, or renderer output to certify. No new cohort to approve or publish.

## Security findings
Live pg_policies: public.mark_schemes SELECT policy schemes_select checks authenticated membership role partner/examiner/admin, but lacks an organisation or question-scope condition. public.question_bank SELECT questions_select checks active plus any membership, likewise no organisation condition. Potential cross-tenant access risk; authenticated negative tests required. Do not assert demonstrated exploit. Storage SELECT policy mathsgrove_storage_read scopes student-work object paths by owner or staff org membership; bucket public flags false. Storage INSERT policies mathsgrove_assessment_evidence_upload and mathsgrove_storage_upload exist. Effective policy/function tests not completed. IMPORTANT: storage.objects query returned actual student-work image object paths even though public.attempts metadata reports zero rows. This may reflect stale/orphaned objects or independent storage lifecycle; investigate retention and ownership without exposing image content or deleting evidence.

## Readiness and Signature
Active counts: IGCSE 3, GCSE 2, A_LEVEL 2, IB_AA 1, IB_AI 1, TMUA 0. Cannot certify Ready, unseen supply, adaptation, timed mock integrity, human Signature moderation, copyright provenance, official 2026–27 board/component alignment, KaTeX rendering, or successful Pages CI from this evidence. No Signature grades released.

## Actions
No new publication, no production modifications. Existing TMUA quarantine preserved. Audit recorded; report findings in evening owner report. Narrow RLS changes require verified tenant-scope semantics and tests before deployment.
