# MathsGrove rolling schedule — safe operational rollout

The original `private.grove_assign_student` only creates a 28-day window when an enrolment or preference trigger fires. It deletes certain **future scheduled** tasks on route change and also makes a monthly **mock** placeholder. Therefore it is unsafe to call it unchanged from a recurring cron job.

## Staged solution

The new `private.grove_expected_practice_slots` is a pure calendar function. The new `private.grove_renew_practice_safely(false,current_date)` is a **read-only preview** by default. Neither is an exposed client RPC. Both are in the non-exposed `private` schema, with EXECUTE revoked from `anon` and `authenticated`.

The renewal writer accepts `p_apply=true` only with today's database date, and its operational role should be `postgres`. It uses a transaction advisory lock, checks an active matching entitlement and membership, excludes board-incompatible, unreviewed, baseline and already-seen mathematical stems, checks the projected number of unstarted question slots, detects existing route conflicts, and inserts **only missing future Daily, Exam Daily and Weekly slots** using an idempotent unique constraint. It does **not** schedule mocks or update/delete any existing student task.

## Evidence recorded on 8 November 2026

- Live SQL installed without registering a renewal cron.
- UTC 28-day pure calendar tests: 28 Exam Daily + four Weekly, four Weekly for Grove Weekly.
- Real Supabase dry-run `applied=false`, one current entitled student considered, zero new task rows on 8 November; preview of tomorrow estimates one missing future slot and preview of the next rollover estimates 23 missing slots. **All previews are read-only.**
- `anon` / `authenticated` cannot execute private renewal function; no additional table grants or policy changes.
- Existing two expiry jobs remain untouched.

## Required gates before activating recurring task writes

1. Set up a separate staging Supabase database/project with **synthetic** users, verified role/membership/entitlement combinations and synthetic baseline status.
2. Run tier tests: Weekly 4 sets, Daily 28 short sets + four Weekly, Exam 28 exam-daily + four Weekly; include exact board, academic level, timezones and entitlement expiry.
3. Run actual `p_apply=true` twice for synthetic accounts. Verify same student/date/mode uniqueness; all historical/started/submitted/released rows and evidence remain identical; no mock rows are made.
4. Exhaust content supply for one synthetic route; verify **zero** extra tasks and a clear blocked_content count. Test mismatched route and expired membership.
5. Verify no question repeats from baseline, other sessions or within the same mathematical family. This gate currently remains open (#45). Do not use pilot question records to satisfy it.
6. Confirm all future tasks genuinely have approved original question inventory, staff can see shortage alerts and errors are monitored.
7. Review current Supabase Cron job capacity/permissions and explicitly approve a daily schedule in the organisation's working timezone. A possible schedule is 01:15 UTC daily, but choose a time only after operations approval.

**Do not directly execute `private.grove_renew_practice_safely(true,current_date)` in the production project until gates 1–7 pass.** Simply creating a cron would risk promising scheduled papers to students without enough independently reviewed content.

## Read-only operator query

```sql
select private.grove_renew_practice_safely(false,current_date) as schedule_preview;
```

This reports counts and a 28-day horizon, not student identifiers. If `blocked_content>0`, prioritise academic supply (#20/#59); if `blocked_conflicting_schedule>0`, review route changes; and if `proposed_or_inserted>0`, enrolment task continuity needs attention until the writer is approved.

The Examiner Studio already provides the separate authorised next-seven-day **presence** warning; it does not imply content readiness.

## Rollback

Do not revert any student work. If the rollout were enabled later, first unschedule the dedicated renewal job; do not touch the existing baseline/practice expiry jobs. Then `DROP FUNCTION private.grove_renew_practice_safely(boolean,date)` and `DROP FUNCTION private.grove_expected_practice_slots(date,date,date,text)` only after verifying no callers depend on them. Existing task rows remain intact.
