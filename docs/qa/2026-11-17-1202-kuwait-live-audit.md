# MathsGrove independent QA — 2026-11-17 12:02 Asia/Kuwait

## Scope and evidence
Read-only LIVE Supabase project `nwakgkxytovprrrwyahs` via information_schema, public table aggregates, pg_policies, and recent question queries. GitHub `Mathora-mathematics/Mathora/README.md` could not be fetched; accessible `MathsGrove/Mathora/README.md` fetched. No student personal data exported.

## Confirmed observations
- LIVE `public.question_bank`: 10 rows, 10 active, 0 created within the previous 2 hours; all ten were created 2026-10-28 11:37:12 UTC. No newly created question in the previous 4 hours.
- `public.attempts`: 0; `public.reviews`: 0; released `public.review_summaries`: 0. Consequently no actual student assignment, moderation, tier adaptation, or Ready status can be certified from these tables.
- LIVE public schema includes `question_bank`, `mark_schemes`, `paper_questions`, `attempts`, `student_entitlements`, `student_preferences`, `reviews`, `review_summaries`, and `answer_files`. No `practice_questions` or `signature_papers` table appears in public information_schema.
- **Critical evidence mismatch:** earlier QA journal summaries claimed 2,238 practice questions and 52 Signature papers. The live project queried now exposes 10 public question_bank rows and no Signature table. The earlier totals are NOT independently verified by this run; the content might reside in other schemas, JSON, or another service, which requires mapping before any full-cohort certification.
- `public.mark_schemes` SELECT RLS `schemes_select` allows any authenticated membership with role partner/examiner/admin, without an organisation-specific row predicate. Potential cross-organisation key exposure; no authenticated exploit test performed.
- `public.answer_files` SELECT policy checks `private.can_access_attempt(attempt_id)`; authenticated cross-account test not performed.
- No new questions in the observable question_bank cohort to recompute; no production question activated or quarantined.
- README itself warns against real student data until cross-account RLS tests; it also says mock hard stops/autosubmit not yet implemented in the documented stage. Current deployed behaviour not verified.

## Independent spot-check of all 10 currently observable seed stems
1. x²−7x+12=0 => x=3,4.
2. 3(2x−1)=4x+9 => x=6.
3. Right triangle 6,8 cm => 10 cm.
4. 3/4+5/6=19/12.
5. x+y=10; 2x−y=5 => x=5,y=5.
6. d/dx (3x³−5x²+7x−2)=9x²−10x+7.
7. ∫(6x²−4x+1)dx=2x³−2x²+x+C.
8. x²−6x+5 vertex=(3,−4).
9. mean(4,7,8,9,12)=8.
10. Positive roots x²−7x+12=0 are 3,4; sum=7.

These are *prompt-only mathematical checks*, NOT certification of answer keys, distractors, explanations, LaTeX rendering, official component mapping or originality. Mark schemes have not been read in this run.

## Release and follow-up
No publish, quarantine, moderation or RLS change performed; no candidate meets all required gates. Resolve live bank/schema mapping and mismatch first; run authenticated RLS isolation, browser KaTeX, GitHub Pages CI, student unseen/difficulty/tier/Ready, official syllabi and copyright tests. Do not issue Signature grades without authorised human moderation. Retain automatic publishing authorisation for fully verified original practice; do not require owner approval.
