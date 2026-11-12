# Staging-only proposal: versioned M/A/B marking & moderation

**Status: DESIGN PROTOTYPE ONLY — DO NOT APPLY TO PRODUCTION.**
**Date:** 12 November 2026 · **Tracker:** [#93](https://github.com/MathsGrove/Mathora/issues/93).
**Dependency:** [PR #89](https://github.com/MathsGrove/Mathora/pull/89), which introduces the *public/editorial* M/A/B calculator.
**Not a migration:** this file is under docs, not \`supabase/migrations\`. It ends with \`ROLLBACK\` and does not implement any grant or callable RPC.

## Grounded constraints

Read-only inspection of the connected MathsGrove project found the existing \`private.grove_tasks\`, \`private.grove_task_items\`, and \`private.grove_practice_marks\` support **one point per multiple-choice question**. The existing staff marking RPC \`public.grove_staff_mark_task\` explicitly validates a \`0\` or \`1\` mark per question and uses an \`org_id\` and \`private.is_staff(org_id)\` check. Student feedback RPC \`public.grove_my_feedback\` reads only a task belonging to \`auth.uid()\` and returns feedback only after release. These contracts must not be repurposed to receive a constructed-response paper without new audited permissions and careful student-data migration planning.

This prototype deliberately creates a separate future path for constructed responses and does not touch those operational records.

## Illustrative DDL — intentionally rolled back

Run **only** in an isolated disposable PostgreSQL/Supabase test environment with fictional accounts, after reviewing all dependencies. This code has not been executed or database-integration tested in this review.

\`\`\`sql
-- NOT AN APPLIED MIGRATION. Requires a dedicated disposable staging database.
BEGIN;

CREATE TABLE private.grove_moderation_rubrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id),
  source_question_ref text NOT NULL,
  version_no integer NOT NULL CHECK (version_no > 0),
  qualification text NOT NULL,
  academic_level text NOT NULL,
  awarding_body text NOT NULL,
  syllabus_year text NOT NULL,
  calculator_policy text NOT NULL,
  max_marks smallint NOT NULL CHECK (max_marks BETWEEN 1 AND 30),
  rubric_sha256 text NOT NULL CHECK (rubric_sha256 ~ '^[a-f0-9]{64}$'),
  authored_by uuid NOT NULL REFERENCES auth.users(id),
  moderation_state text NOT NULL DEFAULT 'draft'
    CHECK (moderation_state IN ('draft','under_review','approved','withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id,source_question_ref,version_no),
  UNIQUE(id,org_id)
);

CREATE TABLE private.grove_moderation_criteria (
  rubric_id uuid NOT NULL,
  org_id uuid NOT NULL,
  criterion_key text NOT NULL CHECK (criterion_key ~ '^[a-z][a-z0-9-]{1,70}$'),
  sequence_no smallint NOT NULL CHECK (sequence_no BETWEEN 1 AND 30),
  code text NOT NULL CHECK (code IN ('M1','A1','B1')),
  credit_condition text NOT NULL,
  missing_feedback text NOT NULL,
  depends_on text[] NOT NULL DEFAULT ARRAY[]::text[],
  allow_implied_method boolean NOT NULL DEFAULT false,
  CHECK (NOT allow_implied_method OR code = 'A1'),
  PRIMARY KEY (rubric_id,criterion_key),
  UNIQUE(rubric_id,sequence_no),
  UNIQUE(rubric_id,org_id,criterion_key),
  FOREIGN KEY (rubric_id,org_id)
    REFERENCES private.grove_moderation_rubrics(id,org_id)
);

CREATE TABLE private.grove_moderation_signoffs (
  rubric_id uuid NOT NULL,
  org_id uuid NOT NULL,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id),
  reviewed_sha256 text NOT NULL CHECK (reviewed_sha256 ~ '^[a-f0-9]{64}$'),
  decision text NOT NULL CHECK (decision IN ('approve','request_changes','reject')),
  maths_checked boolean NOT NULL DEFAULT false,
  syllabus_checked boolean NOT NULL DEFAULT false,
  marking_checked boolean NOT NULL DEFAULT false,
  rationale text NOT NULL,
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (rubric_id,reviewer_id),
  FOREIGN KEY (rubric_id,org_id)
    REFERENCES private.grove_moderation_rubrics(id,org_id)
);

CREATE TABLE private.grove_constructed_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id),
  rubric_id uuid NOT NULL,
  student_id uuid NOT NULL REFERENCES auth.users(id),
  state text NOT NULL DEFAULT 'awaiting_review'
    CHECK (state IN ('awaiting_review','in_moderation','released')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id,rubric_id,org_id),
  FOREIGN KEY (rubric_id,org_id)
    REFERENCES private.grove_moderation_rubrics(id,org_id)
);

CREATE TABLE private.grove_constructed_criterion_awards (
  attempt_id uuid NOT NULL,
  rubric_id uuid NOT NULL,
  org_id uuid NOT NULL,
  criterion_key text NOT NULL,
  examiner_id uuid NOT NULL REFERENCES auth.users(id),
  awarded boolean NOT NULL,
  evidence_note text NOT NULL DEFAULT '',
  method_implied boolean NOT NULL DEFAULT false,
  implied_reason text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (NOT awarded OR length(btrim(evidence_note)) >= 8),
  CHECK (NOT method_implied OR
    (awarded AND length(btrim(implied_reason)) >= 15)),
  PRIMARY KEY (attempt_id,criterion_key,examiner_id),
  FOREIGN KEY (attempt_id,rubric_id,org_id)
    REFERENCES private.grove_constructed_attempts(id,rubric_id,org_id),
  FOREIGN KEY (rubric_id,org_id,criterion_key)
    REFERENCES private.grove_moderation_criteria(rubric_id,org_id,criterion_key)
);

CREATE TABLE private.grove_constructed_release_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL,
  rubric_id uuid NOT NULL,
  org_id uuid NOT NULL,
  revision_no integer NOT NULL CHECK (revision_no > 0),
  released_by uuid NOT NULL REFERENCES auth.users(id),
  earned_marks smallint NOT NULL CHECK (earned_marks >= 0),
  possible_marks smallint NOT NULL CHECK (possible_marks BETWEEN 1 AND 30),
  released_student_feedback text NOT NULL,
  released_parent_summary text NOT NULL,
  released_tutor_plan text NOT NULL,
  released_at timestamptz NOT NULL DEFAULT now(),
  CHECK (earned_marks <= possible_marks),
  UNIQUE(attempt_id,revision_no),
  FOREIGN KEY (attempt_id,rubric_id,org_id)
    REFERENCES private.grove_constructed_attempts(id,rubric_id,org_id)
);

-- Defense in depth: no direct Data API tables, client grants or SELECT policies.
ALTER TABLE private.grove_moderation_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.grove_moderation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.grove_moderation_signoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.grove_constructed_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.grove_constructed_criterion_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.grove_constructed_release_snapshots ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
 private.grove_moderation_rubrics,
 private.grove_moderation_criteria,
 private.grove_moderation_signoffs,
 private.grove_constructed_attempts,
 private.grove_constructed_criterion_awards,
 private.grove_constructed_release_snapshots
FROM PUBLIC, anon, authenticated;

CREATE INDEX grove_rubrics_org_idx
  ON private.grove_moderation_rubrics(org_id,moderation_state);
CREATE INDEX grove_attempts_student_idx
  ON private.grove_constructed_attempts(student_id,created_at DESC);
CREATE INDEX grove_attempts_org_idx
  ON private.grove_constructed_attempts(org_id,state);
CREATE INDEX grove_awards_examiner_idx
  ON private.grove_constructed_criterion_awards(examiner_id,updated_at DESC);
CREATE INDEX grove_signoffs_reviewer_idx
  ON private.grove_moderation_signoffs(reviewer_id,reviewed_at DESC);
CREATE INDEX grove_releases_org_idx
  ON private.grove_constructed_release_snapshots(org_id,released_at DESC);

-- Intentional rollback: this is an *architecture rehearsal*, not a deployment.
ROLLBACK;
\`\`\`

## Non-negotiable release gates absent from the DDL

This is a **schema proposal**, not a fully safe executable deployment. It deliberately contains *no* \`GRANT EXECUTE\`, no \`SECURITY DEFINER\`, and no public RPC. Additional safeguards MUST be implemented and validated before anyone permits a staging migration to persist:

1. **Moderation integrity:** an authenticated server action must verify that author != each moderator, that two reviewers are independent, and that both approvals match the exact saved SHA-256 rubric and the same board, syllabus year, calculator rule, answer-format and original-content provenance. Authenticated reviewer IDs come from the session, never client-supplied.
2. **Immutable rubric versions:** disallow edits to approved rubric/criterion rows; new changes require a new version and fresh moderation. Enforce referenced criterion dependencies, no cycles, valid alternate methods, follow-through policies and exact mark totals **in the database transaction**, not just in JavaScript.
3. **Staging mark RPC:** compare attempt student/org/rubric to the active examiner’s org; reject unauthorised graders, duplicate awards, omitted criteria at release and questionable implied-method exceptions. Server recalculates \`earned_marks\` and \`possible_marks\` from protected criterion rows, never trusts a browser total.
4. **Released snapshots:** release needs explicit authorised human action after full review. Add append-only auditing/immutable snapshot enforcement (including preventing privileged UPDATE or DELETE outside a controlled append-only service). Role-filtered read RPCs must select only approved fields **after validating the student ID and parent/tutor assignment**, not return all three report text fields in one payload.
5. **Existing scheme remains stable:** do not overwrite \`private.grove_practice_marks\`, \`private.grove_tasks.score\`, or the 0/1 practice workflow. Constructed-response work is a distinct pilot. No real student data, no full mock or entitlements changes.
6. **Permission tests:** isolated fictional student, parent, assigned tutor, non-assigned tutor, authorised examiner, second organisation, and revoked user. Test direct table access, horizontal/vertical permission checks, cross-org writes, released vs unreleased, role revocation, immutable snapshots, and signed evidence files. Verify expected deny outcomes and no row changes, not just exception messages.
7. **Deployment decision:** provision a disposable isolated Supabase project or local PostgreSQL instance, test transactionally, review advisor deltas, then document rollback, backup, key handling and formal owner signoff. **Never apply this documentation block to the connected production database.**

Reference guidance: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase function privileges](https://supabase.com/docs/guides/database/functions), and [Cambridge 2025 IGCSE mark-scheme notes](https://www.cambridgeinternational.org/Images/662631-2025-specimen-paper-1-mark-scheme.pdf).

### Test status
The CI checks for this document are **static only**. The SQL has **not** been executed or validated by PostgreSQL. The new editorial moderation/calibration module is Node-tested separately against fictional original practice examples. Those checks do not establish access-control correctness.
