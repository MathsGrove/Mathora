# MathsGrove independent QA — 2026-11-24 00:00 Asia/Kuwait

## Scope and evidence
Live Supabase project `nwakgkxytovprrrwyahs`, schema `private`; connected GitHub repository `MathsGrove/Mathora` (the accessible repository; requested `Mathora-mathematics/Mathora` not confirmed accessible). Baseline: 2026-11-23 22:03 QA journal commit `e8afb9f3529b3f6d6f7998540630521fb16245ff`. Latest repository commit at inspection: `8c09635c4756d5a5a36626a333e113d03cd23805` (editorial coverage audit).

## Live inventory and deltas
- Practice bank: 2,244 total, 2,192 active, 1,952 approved. **No inventory change** from previous QA.
- 240 active items lack a nonblank board or syllabus objective; 56 active items have explanations shorter than 30 characters. These are flags, not individually proven errors.
- 52 assigned items; zero missing/inactive referenced bank items; **three difficulty mismatches**.
- Signature: 68 editorial assessments, zero with nonnull `human_moderated_by`; latest is the previously reviewed 'Stationary Points, Tangents and Enclosed Area — Original Review', created 2026-11-23 17:58:40 UTC, 13 marks, awaiting human moderation. No new Signature assessment since previous QA.

## Reproducible read-only SQL
```sql
select count(*) total,count(*) filter(where active) active,
count(*) filter(where review_state='approved') approved,
count(*) filter(where active and (nullif(trim(coalesce(exam_board,'')),'') is null or nullif(trim(coalesce(syllabus_objective,'')),'') is null)) missing_metadata,
count(*) filter(where active and length(trim(coalesce(explanation,'')))<30) short_explanation
from private.grove_practice_bank;

select (select count(*) from private.grove_task_items) assigned,
(select count(*) from private.grove_signature_editorial) signature,
(select count(*) from private.grove_signature_editorial where human_moderated_by is not null) moderated,
(select count(*) from private.grove_task_items i left join private.grove_practice_bank b on b.id=i.bank_id where b.id is null or not b.active) invalid_assignments,
(select count(*) from private.grove_task_items i join private.grove_practice_bank b on b.id=i.bank_id where i.difficulty is distinct from b.difficulty) difficulty_mismatch;
```

## Mathematical recheck
Latest Signature paper's stored solutions independently rechecked: for y=x³−6x²+9x+2, derivative 3(x−1)(x−3), points (1,6) and (3,2), second derivative −6 and +6, tangent at x=2: y=−3x+10. For y=6x−x², maximum (3,9), roots 0 and 6, integral over [0,6] =36. Mark allocations 3+2+2+2+1+3=13. These checks are mathematical only; no human moderation is inferred.

## Controls not certified
No newly approved practice record was identified by inventory delta, but without publication timestamps an unchanged count does not rule out substitutions. Per-student unseen IDs, near-duplicate families, baseline/feedback adaptation, Ready status, official 2026–27 syllabus mapping, rendered KaTeX, copyright provenance, tenant-isolation RLS, private photo/whiteboard storage, examiner marking, server-side mock timers, GitHub Pages CI and staff-only Signature access were **not comprehensively tested** this cycle. Do not interpret absence of findings as passes.

## Actions
Read-only audit. No question published, quarantined, or edited; no Signature grade/report issued. Original practice can be published without owner approval only after substantive verification; questionable drafts stay staged. Findings for established evening owner report.
