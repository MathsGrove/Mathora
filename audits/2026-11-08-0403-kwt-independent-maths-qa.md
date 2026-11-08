# Independent MathsGrove QA — 2026-11-08 04:03 Asia/Kuwait

## Evidence and scope
Live Supabase project `nwakgkxytovprrrwyahs` inspected via read-only SQL; GitHub repository `Mathora-mathematics/Mathora` resolves to `MathsGrove/Mathora` (repository ID 1323744009). Last observed repository head before this journal: `b43652faa6ffe7e772c97c8bf36c6f93089f11b3`. This is a **partial evidence-based audit**, not an exhaustive certification.

## Observed passes
- Practice inventory: 1,942 active approved, 240 active pilot, 54 inactive draft (2,236 total).
- 41 tasks, 38 scheduled; 16 materialised task items reference 16 distinct bank IDs.
- No active practice question has a blank `correct_text` key (database non-empty check only; not mathematical key validation).
- Signature: 23 editorial assessments, 397 declared marks; newest entry remains the parametric/differential-equation 12-mark diagnostic created 2026-11-07 22:02 UTC. No new Signature assessment since preceding inspection.
- Recomputed latest Signature diagnostic: dx/dt=2t, dy/dt=3t²−3, dy/dx=3(t²−1)/(2t); t=1 gives (2,−2) and a minimum since dx/dt>0 and derivative switches − to +. Separation gives ln|y+1|=x²+C; y(0)=2 implies y=3exp(x²)−1 and y(1)=3e−1. Part marks 3+3+4+2=12; scheme consistent. This is mathematical verification, not human moderation.

## Findings and unresolved blockers
- Four materialised task items reference bank questions not simultaneously `approved` and `active` (previously identified active pilots); requires explicit pilot eligibility rule review.
- All 1,942 approved practice records lack `reviewed_by`; 36 approved records lack `reviewed_at`.
- 468 active practice records have explanations under 100 characters; this is a triage heuristic, **not** proof of error.
- All 23 Signature records lack complete human moderation; no Signature report or grade authorised.
- Practice bank has no creation/update timestamp or immutable publication change log; cannot reliably enumerate all newly published/edited questions, hence no claim of full mathematical/distractor/syllabus audit.
- Not certified this run: per-student unseen eligibility and near-duplicate families, adaptation and tier inheritance, authenticated Ready status, official 2026–2027 board/component scope, copyright provenance, RLS cross-role isolation, student evidence storage, mock timer enforcement, deployed Pages CI/browser KaTeX and staff-only Signature UI. No claim of passing these checks.

## Action
No practice publication, quarantine, student-data mutation, grant modification, or examiner-grade/report issuance. No narrow safe fix established by the evidence. Verified original practice remains preauthorised for automatic publication once independently certified; ambiguous content stays staged. Findings available to the established evening reporting workflow.
