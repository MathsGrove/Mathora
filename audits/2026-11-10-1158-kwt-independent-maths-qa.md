# Independent QA — 2026-11-10 11:58 Asia/Kuwait

## Verified live database scope
Supabase project nwakgkxytovprrrwyahs. Read-only SQL on 2026-11-10 around 08:58–09:00 UTC.
- public.question_bank contains **10** records, all with created_at 2026-10-28 11:37:12 UTC and active=true in inspected rows; no more recent records observed.
- public.question_bank has columns id, qualification, topic, prompt, marks, difficulty, active, created_at. It has **no stored exact answer, distractors, answer key, worked explanation, syllabus reference or publication status**. Exhaustive certification is impossible from this table.
- Exact normalised duplicate prompts among active rows: **none**.
- public.mark_schemes SELECT RLS policy 'schemes_select' allows any authenticated membership with role partner/examiner/admin; it does not correlate membership org_id to the selected question or assessment. RLS is enabled but this policy requires security remediation after schema-specific tests. No exploit attempted.
- The public schema contains question_bank, paper_questions, mark_schemes, attempts, answers, answer_files, reviews, memberships and related tables. This schema differs materially from previous reports of 2,236 practice questions and 23 Signature assessments; **those historical figures cannot be confirmed in the inspected project**.

## Maths spot-check, independently derived (prompts only)
1. Solve x²−7x+12=0: (x−3)(x−4)=0, so x=3 or 4.
2. Solve 3(2x−1)=4x+9: 6x−3=4x+9, 2x=12, x=6.
3. Triangle legs 6cm and 8cm: hypotenuse sqrt(36+64)=10cm.
4. 3/4+5/6 = 9/12+10/12=19/12.
5. x+y=10 and 2x−y=5: 3x=15, x=5,y=5.
6. d/dx (3x³−5x²+7x−2)=9x²−10x+7.
7. Integral (6x²−4x+1)dx = 2x³−2x²+x+C.
8. Vertex of x²−6x+5: (3,−4).
9. Mean of 4,7,8,9,12 = 40/5=8.
10. Positive roots of x²−7x+12=0 sum to 7.
These are independent prompt solutions, NOT stored-answer/mark-scheme verification.

## Release decision
No publication, quarantine, grading, permission or assignment writes. No proof of publication delta, student unseen eligibility, tier adaptation, Signature moderation, copyright provenance, official syllabus mapping, KaTeX rendering, secure storage or server timers. All uncertified material remains staged. Follow up on RLS policy and discrepancy in database content before any release.
