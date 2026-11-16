# MathsGrove independent QA — 2026-11-17 00:00 Asia/Kuwait

## Live targets
- Supabase project: `nwakgkxytovprrrwyahs`; SQL reads performed at this run.
- GitHub: requested `Mathora-mathematics/Mathora` resolves to canonical `MathsGrove/Mathora` (same repository id 1323744009).
- Scope: read-only audit; no practice publishing, quarantines, student marks or Signature releases.

## Reproducible queries
```sql
SELECT count(*) FROM private.grove_practice_bank;
SELECT count(*) FROM private.grove_practice_bank WHERE active AND review_state='approved';
SELECT count(*) FROM private.grove_practice_bank WHERE active AND review_state IS DISTINCT FROM 'approved';
SELECT count(*) FROM private.grove_practice_bank WHERE reviewed_at >= now()-interval '2 hours';
SELECT count(*) FROM private.grove_signature_editorial;
SELECT count(*) FROM private.grove_signature_editorial WHERE human_moderated_at IS NOT NULL;
SELECT status,count(*) FROM private.grove_tasks GROUP BY status;
SELECT lower(regexp_replace(trim(prompt),'\s+',' ','g')) AS stem,count(*) AS n FROM private.grove_practice_bank WHERE active AND review_state='approved' GROUP BY 1 HAVING count(*)>1;
SELECT * FROM pg_policies WHERE schemaname='public' AND tablename='mark_schemes';
SELECT id,public FROM storage.buckets;
```

## Findings (live)
- Practice: 2,236 total; 1,942 approved active; 240 active unapproved; 54 inactive.
- Reviewed in last two hours: **0**. Latest non-null practice reviewed_at: 2026-11-03 05:56:54 UTC. There are no created_at/updated_at columns on this bank: cannot prove a complete newly published cohort.
- Unapproved active: 240 lack complete exam-board/syllabus-objective mapping; 12 have explanation length below 20 characters.
- Approved bank: 516 identical normalised-stem groups, 1,143 extra copies. This is bank-level duplication, not proof of student-specific repeats.
- Tasks: 40 scheduled, 5 expired, 4 completed; 4 historical question-item references to missing/inactive/unapproved bank entries.
- Signature: 50 papers, 0 human-moderated. Latest created 2026-11-16 18:03:50 UTC, Helpdesk Requests and Linear Density, awaiting human moderation.
- Storage buckets student-work and grove-student-exports are private; authenticated cross-account access not proven.
- `public.mark_schemes` SELECT policy grants any partner/examiner/admin membership access without organisation condition: possible cross-org key disclosure. Not exploited in this run.
- README explicitly warns not to upload real student data before permissions testing.

## Independent latest Signature mathematical recheck
Q1: Poisson mean 3 in 15 minutes and 6 in 30 minutes. (a) 1-4exp(-3)=0.8008517 -> 0.8009 (4 s.f.), 3 marks; (b) exp(-6)*6^4/4!=54exp(-6)=0.1338526 -> 0.1339, 2 marks; (c) (1-exp(-3))^2=0.9029046 -> 0.9029, 3 marks. Disjoint intervals independent.
Q2: density kx on (1,3). Normalisation k*(9-1)/2=1 -> k=1/4 (2 marks); E(X)=(27-1)/12=13/6 and E(X^2)=(81-1)/16=5 (3 marks); variance 5-(13/6)^2=11/36 (2 marks); P(X>2)=(9-4)/8=5/8 (1 mark). Sum 16; seven part allocations match scheme. This is mathematical verification, not human moderation or official syllabus certification.

## Not certified / release decision
Full per-question distractor and explanation checks, exact official 2026–27 syllabus/component alignment, KaTeX rendering, student-specific unseen families, baseline/feedback adaptation, tier/mode inheritance, Ready state, copyright provenance, authenticated RLS/storage isolation, mock timers and GitHub Pages CI were not end-to-end verified. No newly reviewed practice candidate was found; no questionable draft promoted. No automated Signature grade/report issued. Prioritise org-scoped mark-scheme access, immutable publication timestamps, and end-to-end authenticated tests. Fully verified original practice remains preauthorised without an owner approval gate. Carry findings into established evening CEO report.
