# Independent Maths QA — 2026-11-09 12:22 Asia/Kuwait

## Critical correction: production schema reconciled
Live Supabase project `nwakgkxytovprrrwyahs` contains **two distinct banks**: `public.question_bank` (10 legacy questions) and **`private.grove_practice_bank` (2,236 MathsGrove practice questions)**. Previous 06:00–09:56 reports that the production inventory had disappeared were caused by inspecting only the public schema; this run confirms the private production inventory remains present. No evidence of deletion from those counts. The repository requested as `Mathora-mathematics/Mathora` resolves through the GitHub connector to canonical `MathsGrove/Mathora`, main branch.

## Reproducible SQL observations
- `select count(*) from private.grove_practice_bank` = 2,236.
- Group by `review_state, active`: approved/true 1,942; pilot/true 240; draft/false 54.
- `private.grove_tasks`: 42; `private.grove_task_items`: 22.
- 4 task items (positions 1–4) on task `9f8671dd-e793-4576-8ccd-c3320edbfd17` reference active **pilot** bank entries, not approved; IDs `79980d6c-d858-4c45-a6d7-899075272f22`, `97b06f8c-aa01-43da-9251-48dee7ab525d`, `6ce5d829-2147-469a-84c0-25b52d2cb9c1`, `8d71bc07-e03f-4509-a947-9b944b1cb62c`. Do not rewrite existing student work without careful review.
- Active questions: 468 explanations shorter than 100 characters; 240 missing syllabus objective; 0 missing answer keys; 2,182 active entries lack reviewer UUID. These are indicators, not proof of mathematical defects.
- `private.grove_signature_editorial`: 23 assessments, 397 declared marks, **0** with both human moderator UUID and timestamp.

## Verification limits and release decision
This run verified inventory and assignment review-state joins but **did not independently recompute every new/edited question**, every distractor, LaTeX render, official component mapping, every Signature part mark, or student-specific unseen/near-duplicate/adaptation/Ready status. Immutable publication delta unavailable in examined evidence. Effective RLS, evidence storage, copyright provenance, server timers, and Pages deployment/CI not certified. Do not infer absence of issues from unchanged counts.

No questions activated, quarantined or edited; no student records, marks, permissions or Signature reports changed. Original practice is preauthorised for automatic publication only after full mathematical, distractor, explanation, provenance, syllabus and rendering checks, with no owner approval gate. Questionable drafts remain staged. Signature requires authorised human moderation.

## Follow-up
Prioritise 4 pilot-linked task items, provenance/reviewer metadata, publication change ledger, and end-to-end authenticated security and deployment tests. Include the corrected schema interpretation in the established evening report.
