# Independent Maths QA — 2026-11-08 22:00 Asia/Kuwait

## Live evidence
Supabase project `nwakgkxytovprrrwyahs` queried directly; GitHub `MathsGrove/Mathora` recent commits queried. Latest repository commit before this journal: `4e75f2b44f5e2f0343df97c9846a8574da4515e9` (20:01 Kuwait QA journal). No subsequent feature commit appears in eight most recent commits.

Practice bank: 2236 total, 1942 active approved, 240 other active, 54 inactive (by subtraction). Tasks 42, assigned items 22, 0 duplicate bank IDs, 0 exact whitespace-normalised duplicate stems. Four items reference questions not simultaneously active and approved. All 1942 active approved questions lack reviewer UUIDs. 468 active explanations under 100 characters; 240 active records missing syllabus objective; 0 active blank keys.

Signature: 23 assessments, 397 declared marks; latest created 2026-11-07 22:02:18 UTC; 0 with both human moderator UUID and moderation timestamp.

## Passes
- Database aggregate counts and duplicate-ID/normalised-stem checks recomputed with SQL.
- No new GitHub feature commit identified in the recent returned commit list.
- No active empty answer keys.

## Findings / limitations
- Four assignment eligibility anomalies persist; do not rewrite completed student work.
- No reliable immutable question-publication/change ledger: cannot certify that every newly published/edited practice question has been identified and independently recomputed.
- All 1942 approved active questions lack reviewer identities; 468 short explanations and 240 missing objectives require editorial review, not automatic mathematical-failure classification.
- Signature moderation incomplete across all 23. No authorised human grades/reports issued by this audit.
- Exact distractor/key mathematics, official board/component 2026–27 mapping, LaTeX rendering, student-specific unseen/near-duplicate families, adaptation, tier/mode inheritance, authenticated Ready, RLS effective permissions, student media access, server timers, examiner marking and GitHub Pages deployment were not end-to-end certified in this run. No claim of passing those checks.
- No question activated or quarantined; no confirmed mathematical defect independently established in this run. No production data altered.

## Release rule
Original practice is preauthorised for publication **only after** complete mathematical, distractor, explanation, provenance, syllabus, eligibility and rendering evidence. No owner approval gate. Questionable drafts remain staged. Signature marking requires authorised human moderation.
