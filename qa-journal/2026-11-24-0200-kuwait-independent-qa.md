# Independent Maths QA — 2026-11-24 02:00 Asia/Kuwait

## Verified live evidence
- Supabase project `nwakgkxytovprrrwyahs`: `private.grove_signature_editorial` has **69** records, **0** with `human_moderated_by IS NOT NULL`. Public `question_bank` has 10 rows; this is NOT the authoritative private practice inventory.
- Newest Signature ID `a218cb28-1ee4-489d-b7ed-b8ab5d31c89d`, created 2026-11-23 21:59:44 UTC, title **Signed Momentum, Coalescence and Rebound — Specialist Review**, state `awaiting_human_moderation`, 14 marks.
- Independently recomputed all six parts: Q1(a) +6 kg m/s right (2 marks), (b) +1.2 m/s right (2), (c) initial 42 J, final 3.6 J, loss 38.4 J (3). Q2(a) +6 m/s right (3), (b) initial 12.8 J, final 11.0 J, loss 1.8 J (3), (c) momentum conserved with no external resultant impulse while kinetic energy dissipates (1). Parts 7+7=14; no detected mathematical or marking mismatch. Official syllabus and browser-rendered mathematics not independently certified.
- GitHub repository old owner `Mathora-mathematics/Mathora` redirects to repository ID 1323744009, now `MathsGrove/Mathora`.
- **CRITICAL DEPLOYMENT FAILURE**: workflow run [45275276961](https://github.com/MathsGrove/Mathora/actions/runs/45275276961), commit `01ae7211dda47314ea1fdb2319800185f8e3a700`, failed on 2026-11-23 22:00 UTC. All JavaScript/static integrity, curated artifact build, and private marking-key exclusion checks passed. Upload step reported artifact ID `14866214393`, but `actions/deploy-pages@v4` reported `Found 0 artifact(s)` and `No artifacts named mathsgrove-curated-site`. Thus the new Pages publication was **not** confirmed. Investigate artifact discovery/availability and retry deployment after confirming current workflow; avoid claiming Pages is healthy.

## Reproducible read-only SQL
```sql
select (select count(*) from private.grove_signature_editorial) signature_total,
       (select count(*) from private.grove_signature_editorial where human_moderated_by is not null) moderated,
       (select count(*) from public.question_bank) public_question_bank_count;
select id,title,created_at,total_marks,review_state,human_moderated_by,question_paper,mark_scheme
from private.grove_signature_editorial order by created_at desc limit 1;
```

## Uncertified / no changes
Authoritative private practice inventory, newly published practice keys/distractors, per-student unseen selection and adaptation, metadata and syllabus alignment, copyright, RLS tenant isolation, photo storage, mock timers, live examiner workflow, rendered KaTeX and staff-only permissions were **not comprehensively verified** this run. No practice published/quarantined, no grades/reports released, no production data changed. No owner approval gate is required for independently verified original practice, but unverified drafts remain staged. Report deployment failure and moderation hold in evening owner report.
