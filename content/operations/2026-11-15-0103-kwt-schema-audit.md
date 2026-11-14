# MathsGrove live schema safety audit — 2026-11-15 01:03 Kuwait

Batch: MG-20261115-0103-KWT. Target Supabase project: nwakgkxytovprrrwyahs. Requested repository: Mathora-mathematics/Mathora.

## Direct live findings
Read-only information_schema inspection shows public tables: answer_files, answers, attempts, invitations, learner_view_invitations, learner_view_links, mark_schemes, memberships, organisations, paper_questions, pending_student_setups, profiles, question_bank, review_summaries, reviews, student_academic_settings, student_entitlements, student_preferences, student_service_addons.

The live question_bank schema has only id, qualification, topic, prompt, marks, difficulty, active, created_at. It has NO board, component, exam year, calculator, tier, correct option, distractors, full derivation, editorial approval, syllabus provenance, or student-eligibility columns. mark_schemes has question_id and scheme. No Signature editorial manuscript table appears in public schema.

Direct live grouped count: A_LEVEL 2 active / 2 total; GCSE 2/2; IB_AA 1/1; IB_AI 1/1; IGCSE 3/3; TMUA 1/1. TOTAL 10 active questions, not the previously reported 339 Weekly + 639 Daily + 964 Exam. These prior numbers may refer to a different data store, but are NOT supported by this project's public question_bank. No tier-specific counts can be honestly derived from these rows. These ten cannot be classified editorial-approved or route-eligible with current metadata.

## Decisions
Accepted/published this batch: 0. Rejected: 0. Held: all 10 legacy active rows pending board/component/year/tier/QA provenance and no-repeat controls. No wholesale status flips, inserts, or student releases. No private Signature paper inserted because the required private moderated editorial store was not identified. No code deployment attempted. This is a schema/provenance blocker, not a request for manual editorial approval.

## Required remediation
Locate the actual production MathsGrove editorial database or establish migrations with verified route metadata, individual mathematical review records, unique correct MCQ options, student-history exclusion, private Signature manuscript moderation, and atomic approval activation. Then compare production UI route selection and verify Actions before publishing. Weekly 32, Daily 112 plus weekly, Exam 188 plus weekly are targets, not validated shortfalls until route eligibility is queryable.

Official specifications should be checked against the exact exam year and component before any candidate is released; no new candidate was authored or claimed verified in this audit. No credentials or student data included.
