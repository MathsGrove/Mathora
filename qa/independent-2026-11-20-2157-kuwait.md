# Independent QA — 2026-11-20 21:57 Asia/Kuwait

## Live evidence
Supabase project nwakgkxytovprrrwyahs queried using read-only SQL. All ten question_bank rows have created_at 2026-10-28 11:37:12+00; nine active and the TMUA row 4955338b-1fe1-4719-a636-48c572d34b9c inactive. No newly created questions in this two-hour window. Stored mark schemes inspected.

## Reproducible checks
SQL:
```sql
select qualification, active, count(*) from public.question_bank group by 1,2;
select id, prompt, marks, difficulty, active, created_at from public.question_bank order by created_at;
select q.id, q.prompt, m.scheme from public.question_bank q join public.mark_schemes m on m.question_id=q.id;
select count(*) from public.paper_questions;
```
Independent calculations: roots 3,4; linear x=6; Pythagoras 10cm; fractions 19/12; simultaneous x=y=5; derivative 9x²-10x+7; integral 2x³-2x²+x+C; vertex (3,-4); mean 8; TMUA roots sum 7. All ten final answers match schemes, 32 total marks (29 active). This is NOT a certification of full explanations, distractors, exact official board/component specifications, copyright provenance, KaTeX rendering or actual authenticated access.

## Failures / open risks
TMUA written-response item is quarantined and overlaps the IGCSE factorisation family. Nine active questions cannot support broad unseen adaptive practice. Question-bank schema contains no structured answer options, board/component, explanation or provenance fields. Student allocations, baseline adaptation, tier inheritance and Ready status need authenticated application-level tests. Prior RLS organisation scoping and orphaned student-work objects need effective-access/retention tests. Signature editorial, human moderation, storage access, server mock timers and GitHub Pages successful CI not certified in this cycle.

## Release decision
No newly published cohort to certify. No production writes; no Signature reports or grades released. Verified original practice may publish without owner approval, but unverified drafts remain staged. Evening owner report should include unresolved security, readiness and evidence gaps.
