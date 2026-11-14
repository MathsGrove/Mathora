# Constructed-response learner assignment: MathsGrove v2 staging integration

**Status: Draft #99, unmerged, not deployed, fictional/disposable testing only.**
**Date:** 14 November 2026.
**Depends on:** [marking PR #98](https://github.com/MathsGrove/Mathora/pull/98), [moderation PR #94](https://github.com/MathsGrove/Mathora/pull/94), [rubric PR #89](https://github.com/MathsGrove/Mathora/pull/89), [feedback PR #95](https://github.com/MathsGrove/Mathora/pull/95).

## What was actually built

The previous project already had examiner rubric awarding and released report previews, but did **not** accept a student-authenticated constructed-response answer. This continuation adds:

1. **Staff assignment:** \`mg2_assign_constructed\` can assign only an *approved and independently signed-off* original question to an active student in the same organisation with a matching programme. Weekly allows Weekly/Daily/Exam learners; Daily allows Daily/Exam; Exam only Grove Exam. Each student gets a given rubric version once.
2. **Learner question read:** \`mg2_my_constructed\` returns the question prompt, academic route and the learner's own saved working, never the solution, marking criteria, or another student's content. Checks \`auth.uid()\`, membership, active tier and organisation on each call.
3. **Optimistic revision draft saves:** \`mg2_save_constructed\` requires \`p_expected_revision\`. A stale tab cannot overwrite a newer answer. Empty draft edits can be saved for later; **final submission** must contain at least 30 characters of working. The server owns submitted state/time and locks the record atomically.
4. **Staff review:** \`mg2_examiner_constructed\` returns submitted written work and the private rubric/solution only to the same organisation's active staff after submission. \`mg2_staff_mark\` (from PR #98) remains responsible for examiner-awarded criteria, server-calculated totals and released role-specific report snapshots.
5. **A typed-working student UI:** \`constructed-practice-ui.mjs\` handles loading, draft save, stale version errors, a final-submit confirmation, disabled controls after submission and accessibility/status feedback. \`learner-lab.html\` is an isolated, **in-memory fictional demonstration**, not a real student session or public release.
6. **Privacy and data-integrity guards:** private student-working table, enabled RLS, revoked client table grants, protected EXECUTE, immutable submitted work, duplicate-assignment prevention and genuine role/entitlement validation in RPCs.

## Run the isolated checks

The [PR's marking verification workflow](https://github.com/MathsGrove/Mathora/pull/99/checks) starts a disposable PostgreSQL 16 service with fictional Auth records, organisations, examiners, parents and students. It applies:

\`\`\`text
scripts/fixtures/marking-v2-postgres-fixture.sql
docs/staging/marking-v2-disposable-postgres.sql
docs/staging/marking-v2-learner-workflow.sql
scripts/fixtures/test-marking-v2-postgres.sql
scripts/fixtures/test-marking-v2-learner-workflow.sql
\`\`\`

The negative tests exercise: other-org assignment, repeated question assignment, an examiner trying to submit learner work, cross-student read/write, anonymous execution denial, no answer-key exposure in learner results, short final answer denial, optimistic revision conflict, expired entitlements, final-submit locking, other-organisation examiner denial, release requirements, and immutable saved working.

Browser QA serves the repo locally and exercises \`content/marking/learner-lab.html\` at 1440px desktop and 375px mobile. The fake in-memory client simulates a competing tab so the test checks that **unsaved writing is preserved when the server refuses a stale save**. The page has no external RPC/storage calls. The real Supabase-only adapter remains behind \`environment='disposable_staging'\` + \`enabled=true\`.

## Known release blockers

- The SQL is a **staging extension under \`docs/\`**, not a ready-to-deploy migration. It was **not executed** on connected MathsGrove Supabase, nor is real Auth/JWT ownership tested here. PostgreSQL fake \`auth.uid()\` via a session setting is useful as a basic negative test, **not a substitute for Supabase Auth, token expiry or server protections**.
- Only typed constructed responses are currently supported. **No secure whiteboard/photograph uploads** yet. Supabase Storage objects must go through Storage APIs; do not insert or alter \`storage.objects\` directly. Evidence needs an isolated private bucket, auth/RLS ownership, MIME/size limits, anti-malware policy, authorised examiner reads and short-lived signed URLs. Time-limited URLs may remain valid until expiration after access revocation; document a revocation/retention policy first.
- \`mg2_assign_constructed\` is **not connected to current live weekly/daily scheduling**, and no released marks from existing 0/1 MCQ practice are touched or migrated. Avoid claiming the current live Grove Exam timed mock is now a full official board-specific constructed-response paper.
- Mark criteria must be independently moderated against the exact awarding body, syllabus year and paper before any question becomes assignable to real learners. Existing public examples and their worked solutions are **not unseen bank content**.
- The existing production security advisories tracked in [#81](https://github.com/MathsGrove/Mathora/issues/81) require independent tests; current definer RPC warnings are not proof of a known exploit.
- Staging readiness also requires realistic Auth and revocation tests, Storage negative tests, rate/size controls, examiner calibration, backup and rollback plan, accessibility screen-reader evaluation and explicit owner approval for production changes.

## References

- [Supabase secure database functions](https://supabase.com/docs/guides/database/functions): use restricted \`EXECUTE\`, ownership checks, and an empty \`search_path\` when privileged functions are necessary.
- [Supabase Data API access and RLS](https://supabase.com/docs/guides/api/securing-your-api): table grants and policies are independent controls.
- [Supabase Storage schema](https://supabase.com/docs/guides/storage/schema/design): object metadata is read-only from SQL; use Storage APIs for upload/delete.
- [Supabase Storage URL signing](https://supabase.com/docs/guides/storage/security/signing-keys): signed URLs require a validity and revocation policy.

**No production schema, student marks, entitlements, Auth settings, questions or billable project resources were changed by this PR.**
