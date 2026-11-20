# Independent Maths QA — 2026-11-20 04:03 Asia/Kuwait

## Scope and evidence
Live Supabase project `nwakgkxytovprrrwyahs`, public schema and storage metadata inspected. GitHub repository `MathsGrove/Mathora` README fetched; the requested `Mathora-mathematics/Mathora` path could not be read through the connector. No new question cohort: ten active questions, all created 2026-10-28; no attempts or reviews. No publication or Signature release authorised by this audit.

## Reproducible queries
```sql
select qualification,count(*) from public.question_bank where active group by qualification order by qualification;
select id,qualification,topic,prompt,marks,difficulty,created_at from public.question_bank order by created_at desc;
select question_id,scheme from public.mark_schemes;
select tablename,policyname,roles,cmd,qual from pg_policies where schemaname='public' and tablename in ('mark_schemes','question_bank','answers','answer_files');
select name,public from storage.buckets;
```

## Findings
- PASS: 10 active questions; answer keys independently recomputed: quadratic roots 3 and 4; linear x=6; Pythagoras 10 cm; fractions 19/12; simultaneous x=y=5; derivative 9x²−10x+7; integral 2x³−2x²+x+C; vertex (3,−4); mean 8; TMUA sum 7. Scheme part marks sum to 32 and agree with question marks.
- FAIL: TMUA question is written-response with three marks, not multiple-choice; same polynomial x²−7x+12 occurs in IGCSE question. Do not certify TMUA exam-mode suitability.
- FAIL: question supply inadequate (GCSE only 2); no observed attempts/reviews; cannot certify adaptive readiness.
- SECURITY REVIEW REQUIRED: `mark_schemes` SELECT policy permits any authenticated user with a partner/examiner/admin membership in any organisation, without matching question organisation. `question_bank` SELECT permits active items for any member, with no organisation filter. Scope impact before changing shared-bank design; cross-tenant mark-scheme exposure is plausible.
- PASS (metadata only): student-work and grove-student-exports storage buckets are private. Storage object policies and effective RLS isolation not tested.
- UNVERIFIED: official 2026–27 board/component syllabus, rendered KaTeX, full worked solutions, all distractors (none stored in these rows), student unseen/near-duplicate allocations, baseline adaptation, mock timers, GitHub Pages CI, copyright provenance, Signature moderation. Public schema has no dedicated Signature editorial tables.
- INVENTORY DISCREPANCY: prior reports mention 2,243 items; current project shows 10. No conclusion about deletion or alternate environment.

No data mutations, quarantines, or student/parent grades. Independently verified originals may publish automatically, but this cycle identified no certifiable new originals.
