# Independent QA — 2026-11-16 10:04 Asia/Kuwait (07:04 UTC)

## Source and scope
Live Supabase project `nwakgkxytovprrrwyahs`; accessible GitHub `MathsGrove/Mathora`. Requested `Mathora-mathematics/Mathora` README could not be fetched (connector error). Snapshot is a point-in-time audit, not exhaustive mathematical certification.

## Inventory (read-only SQL)
```sql
SELECT active,review_state,count(*) FROM private.grove_practice_bank GROUP BY 1,2;
SELECT count(*) total,count(*) FILTER (WHERE human_moderated_at IS NOT NULL) moderated,max(created_at) latest FROM private.grove_signature_editorial;
SELECT status,count(*) FROM private.grove_tasks GROUP BY status;
SELECT policyname,qual FROM pg_policies WHERE schemaname='public' AND tablename='mark_schemes';
```
Practice: 1,942 active approved; 240 active pilot; 54 inactive draft. All 240 pilots missing exam board or objective metadata; 12 pilot explanations shorter than 20 characters. Tasks: 40 scheduled, 5 expired, 4 completed. Signature: 46 papers, zero human moderations.

## New Signature paper mathematical recheck
ID `8d2a8a70-112c-4b59-9c0f-fccea8370929`; title *Fabric Defects and Continuous Density — Original Statistics 2 Diagnostic*; created 2026-11-16 06:04:38 UTC; Cambridge 9709 Paper 6; status awaiting_human_moderation.

Q1: X~Poisson(2). (a) P(X=0)=exp(-2)=0.135335283, 0.135 (3 s.f.), 2 marks. (b) P(X>=2)=1-3exp(-2)=0.593994150, 0.594 (3 s.f.), 3 marks. (c) Three independent rolls, exactly one with zero defects: 3exp(-2)(1-exp(-2))^2=0.303548273, 3 marks.

Q2: f(y)=ky on [0,2]. (a) 2k=1 => k=1/2, 2 marks. (b) P(Y>1)=integral_1^2 y/2 dy=3/4, 2 marks. (c) E(Y)=integral_0^2 y^2/2 dy=4/3, 2 marks. (d) E(Y^2)=integral_0^2 y^3/2 dy=2; Var(Y)=2-16/9=2/9, 2 marks.

Seven parts total 16/16 allocated marks mathematically consistent. This is **not** a human examiner moderation, and no student/parent Signature report or grade is authorised. Official 2026–2027 syllabus mapping and rendered LaTeX remain to be separately verified.

## Security and release decision
`public.mark_schemes` SELECT policy `schemes_select` authorises membership roles partner/examiner/admin with no organisation-scoped predicate; potential cross-tenant access, not proven by authenticated exploit. Do not accept real student uploads before tenant-isolation tests. No question published/quarantined: no new practice cohort can be exhaustively identified because private bank lacks creation/modification timestamps; do not infer approval from active flag. Do not auto-release Signature.

## Uncertified
Practice distractor/key and full explanation recomputation, per-student unseen normalized-stem families, baseline adaptation, tier inheritance, Ready status, KaTeX rendering, 2026–2027 official component alignment, copyright, private photo/whiteboard storage, server timer enforcement, Pages CI and live browser checks. Existing bank duplication reported in earlier audits was not recomputed this run.

## Actions
Read-only database inspection; no database mutations or security changes. Verified original practice remains preauthorised for publishing only after substantive verification, without an owner approval gate. Carry unresolved RLS, pilots and missing traceability into evening owner report.
