# MathsGrove Examiner Operations — Multi-Mark Assessment (staging draft)

**Status (14 November 2026):** Draft engineering work, **not deployed** and **not approved for real student assignments**. This guide is for qualified examiners reviewing staged original material. It does not authorise production writes.

## Goal: make the examiner faster, not replace the examiner

The system separates *reviewing a question* from *marking a learner's response*.

**Original question quality gate**
1. A trusted author supplies a genuinely original question, worked solution, exact awarding body and syllabus year, level, topic, calculator rule, mark-code mapping, equivalent accepted methods and rights provenance. Never copy confidential unseen exam papers or assume an example is exam-board endorsed.
2. An independent examiner opens **Question moderation**, compares the actual question with syllabus objectives, verifies the mathematics and alternative methods, checks M/A/B or IB R marks and dependency/follow-through rules, writes their own substantive reviewer note and signs the exact rubric fingerprint.
3. A **different** independently qualified examiner repeats the check. Authors cannot approve their own question, a reviewer cannot sign twice, and an edited rubric must have new independently verified signatures. Only two valid signatures make the rubric eligible for a controlled assignment.
4. Insufficient topic stock remains a release blocker. Do not silently count draft, pilot or previously seen questions as independently approved reusable practice.

**Response marking**
1. A submitted response appears in the **Awaiting your review** queue. Only authorised same-organisation staff can open private working and worked solutions.
2. Look at the student's written steps and any correctly permissioned attachments. For every explicitly defined criterion, choose **Credit awarded** or **Credit withheld**; no marks are inferred from a multiple-choice selection when the rubric calls for constructed reasoning.
3. Record specific evidence for each awarded mark. When an A1 criterion permits an implied method and its associated M1 was not explicitly awarded, explain the exact evidence; otherwise do not use this exception.
4. Save a completed marking draft without releasing it. Return later to resume saved decisions. Other examiners may review the information when authorised but cannot silently overwrite the original examiner's awarded evidence.
5. Choose **Prepare feedback suggestions**. The tool proposes student corrections, supportive parent questions and tutor interventions **from the examiner-awarded criteria only**. It does not identify a guaranteed misconception, award marks automatically, predict grades or send messages.
6. Edit **all three summaries**, personally check the question and each mark, tick the examiner attestation and confirm **Release**. The database recalculates the total and stores a locked report snapshot. After release the submission leaves the pending queue.
7. Students receive their own released criteria and constructive next steps. Verified parents receive only a supportive approved summary, never examiner notes. Approved tutors receive the teaching plan and permitted staff evidence. Each read rechecks role and active linking permissions.

## Rules for different exam styles

| Route | Mark principle in this editorial pilot |
|---|---|
| GCSE Foundation/Higher | Exam-board/year-specific M1 method, A1 accuracy, B1 independent marks where appropriate |
| IGCSE Core/Extended | Cambridge/Pearson-style M/A/B, with paper and permitted-method differences independently checked |
| AS/A Level and Further Mathematics | Method/accuracy/independent credits, equivalent mathematical methods and follow-through moderated per question |
| IB Mathematics AA/AI SL/HL | M, A and R reasoning codes in the drafted examples; check actual IB paper guidance |
| TMUA Papers 1/2 | One correct option earns one mark. Do not fabricate M1/A1/B1 partial credits for TMUA multiple choice |

Service plans (Grove Weekly, Daily, Exam) determine *which practice is eligible*, not which mark code applies.

## Safety, rollout and outstanding work

- Connected production Supabase has **not** received the draft \`mg2_*\` tables, functions, private attachment policies or review queues. The existing live marking system remains separate.
- The 10 new independent worked examples in [PR #102](https://github.com/MathsGrove/Mathora/pull/102) are mathematically checked but **not human moderated**. They cannot be counted as unseen approved stock until verified qualified reviewers approve each version.
- The current approved bank's reviewer attribution must be reconciled before declaring full academic coverage: see [release blocker #100](https://github.com/MathsGrove/Mathora/issues/100).
- Real production migration, authenticated multi-role UI integration, evidence retention/deletion, exception-based reassignments, backup and rollback rehearsal, RLS audits, programme assignment capacity and live performance/accessibility remain mandatory.
- Free disposable **local Supabase Auth/JWT/Storage** CI provides realistic role and evidence tests without a hosted billable project; GitHub Actions minutes may still count against included quota. It is not a replacement for production-specific tests.
- Existing student records, entitlements, released marks and production RLS permissions must not be modified until a separate controlled go/no-go release test passes.

## Technical references

- [Staging examiner queue and safe reviewer draft SQL](./marking-v2-examiner-queue.sql)
- [Independent human rubric moderation inbox](./marking-v2-moderation-queue.sql)
- [Underlying staging marking and release functions](./marking-v2-disposable-postgres.sql)
- [Student assignment and final submission](./marking-v2-learner-workflow.sql)
- [Supabase function security](https://supabase.com/docs/guides/database/functions)
- [Supabase Storage RLS](https://supabase.com/docs/guides/storage/security/access-control)

**Current release recommendation:** keep these components in the stacked draft PR until independently moderated original question inventory and hosted release-path verification are complete.
