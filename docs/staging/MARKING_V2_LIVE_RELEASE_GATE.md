# MathsGrove marking v2 — controlled live-release gate

**14 November 2026: staged engineering candidate, not yet live for students.**

## What is implemented
Original question creation with examiner-verified board, syllabus year, level, calculator policy, provenance and full worked solution; individual M1/A1/B1 or IB R1 marks; two-person independent signature of each unchanged mark scheme; reviewed inventory and staff assignment; student draft save, optional bounded private photo/PDF, final submit; examiner queue, resume and explicit release; role-separated student, guardian and tutor reports with revoked-link protections.

## Production prerequisites
1. Back up the existing project and rehearse recovery on a compatible isolated Supabase environment; do not put real learner data into GitHub Actions.
2. Revalidate production roles, membership and entitlements. The existing private.is_staff(uuid) helper currently accepts partner, examiner and admin; live schema currently contains no mg2_* tables.
3. Convert the additive staging SQL into a reviewed Supabase CLI migration (generate it with 'supabase migration new'); check dependency order and run it against local real Auth/Storage before a hosted project.
4. Create a separate NON-PUBLIC bucket named mg2-original-evidence through Supabase Storage API/dashboard with maximum 1 MiB and image/png, image/jpeg, application/pdf MIME allowlist. Never weaken the existing student-work bucket.
5. Recheck new private-object RLS with hosted JWT identities: wrong student, wrong org, parent, tutor, anonymous, revoked user, unsubmitted examiner, staff-only after submission, expired programme, and short-lived signed links.
6. Get two actually independent qualified examiners to inspect and sign each original question with its valid alternative methods and exact board/year mark criteria. Do not treat unmoderated examples or old question rows with incomplete reviewer provenance as signed.
7. Verify real student and staff portal flow, multiple browser tabs, mobile/keyboard/screen reader behavior, latency, final report redaction, accurate criteria totals, retention/deletion and incident logging.
8. Reconcile the stacked feature PRs with current main before deploying any Pages assets; the initial criterion-engine PR is not currently mergeable into main. Never bulk merge without conflict and security review.
9. Enable the browser pilot flag (markingV2Enabled, currently false) only for a controlled rollout after these checks, monitoring error and user-feedback rates.

## Isolated SQL rehearsal order
1. docs/staging/marking-v2-disposable-postgres.sql
2. docs/staging/marking-v2-learner-workflow.sql
3. docs/staging/marking-v2-examiner-queue.sql
4. docs/staging/marking-v2-moderation-queue.sql
5. docs/staging/marking-v2-operational-interfaces.sql
6. docs/staging/marking-v2-private-evidence-policy.sql (separate private bucket required)

These are draft staging scripts, NOT a reviewed production migration or a command to run them on the live Supabase SQL editor.

## Non-destructive rollback
1. Switch the browser feature flag off.
2. Controlled database operation: revoke authenticated access to the NEW mg2_* API functions only, without changing existing practice RPCs.
3. Preserve all submitted original working and immutable examiner releases; do not drop student data during rollback.
4. Investigate logs, membership access and any outstanding short-lived signed URLs before resuming.

## Limitations
Automated tests support the synthetic maths cases and role denial matrix. They cannot certify an entire board syllabus or substitute for independent human moderation. Production security warnings and legacy reviewer attribution gaps remain separately tracked. Free local Supabase CI avoids a new billable project but GitHub Actions usage and hosted data quotas may still apply.

**Release classification: NOT YET LIVE; hold until these objective gates pass.**
