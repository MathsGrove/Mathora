# MathsGrove constructed-response marking v2 — staging integration guide

**Status: executable feature prototype, NOT merged, deployed, published or provisioned on real student data.**
**Date:** 14 November 2026. **Source branch:** feature/assessment-marking-integration-20261114.
**Dependencies:** original M/A/B rubric engine (#89), moderation/calibration (#94), feedback bank (#95). This branch is stacked on #94 and imports the distinct bank work from #95.

## Working components

| Component | Code | What it implements |
| --- | --- | --- |
| Qualification-aware mark policy | content/marking/exam-style-policy.mjs | GCSE/IGCSE/AS-A-Level/Further M1-A1-B1; IB M1-A1-R1; TMUA one-point five-option MCQ. Reject incorrect mark code and calculator/format combinations. |
| Original topic-specific exemplars | content/marking/route-exam-style-examples.json | 8 independently calculated public example questions; 26 marks in total; worked answers, original rubrics and corrections. Existing 3 questions in #89 add 15 marks. |
| Editorial feedback | content/marking/criterion-feedback-bank.json, feedback-bank-model.mjs | 15 earlier original detailed feedback entries; method evidence, corrections, check, independent recheck, parent prompts and tutor interventions. |
| Moderation | moderation-workflow.mjs | Exact rubric SHA-256, review identity assertions, independent two-person calibration, third-person adjudication on disputes. Real reviewer identity must be validated by authenticated server workflows. |
| Offline interactive examiner lab | content/marking/reviewer-lab.html | Select any of eight original examples, mark each criterion with evidence, record method implication if applicable, and preview different student/parent/tutor outputs. No login, storage or save/release. |
| Runnable staging schema/RPCs | docs/staging/marking-v2-disposable-postgres.sql | New *separate* constructed-response rubric, signoff, attempt, award and release tables; restricted RPCs for moderation, examiner marks, learner reports and guardian/tutor summaries. Server recalculates score. |
| Staging client adapter | content/marking/staging-rpc-client.mjs | Calls staging RPCs with no client score, org ID, examiner identity or untyped awarded value; refuses any environment except disposable_staging + explicit enable. |
| Safety checks | scripts/fixtures/test-marking-v2-postgres.sql | Disposable PostgreSQL negative tests for signoff, identity, org boundaries, release state, guardian link, revoked invitation, private tables and immutable snapshots. |
| Curriculum gap audit | content/marking/curriculum-coverage.json + test | Maps all six study-route families to explicit level and domain buckets. Fails if unrecognised labels creep in; **does not pretend all topics or qualifications are already covered**. |

## Qualifications are not commercial plans

Weekly = 8 one-point existing MCQs per weekly assignment; Daily = 4 one-point daily MCQs plus Weekly; Grove Exam = 6 one-point daily MCQs, Weekly and planned 20-item timed MCQ mock according to current service-tier configuration. These operational schedules are **not** silently converted into a 26-mark constructed-response exam. The new multi-mark v2 path is separate.

For GCSE, IGCSE, AS/A Level and Further Mathematics the sample mark vocabulary uses method M, accuracy A and independent B credit. IB Mathematics sample mark vocabulary uses method M, answer/accuracy A and reasoning R where valid. TMUA officially uses two 20-question multiple-choice papers with 75 minutes each, five options, no calculator and no negative mark deductions; **do not** assign M/A/B partial credits to a TMUA answer choice. Always map official board, actual paper, year, calculator and mark rules before signing off a real rubric.

The prototype's board labels are *format references*, not board endorsement or approved unseen exam papers. TMUA original sample items cannot automatically become official UAT test replacements.

## How to run locally

Serve the repository root over HTTP (not the file:// protocol) and open:

\`http://localhost:8000/content/marking/reviewer-lab.html\`

For example: \`python3 -m http.server 8000\` run from the root of a local clone. This workbench intentionally has no production credentials or API connection. It does not appear in the curated GitHub Pages bundle.

Node tests:
\`node scripts/test-criterion-engine.mjs\`
\`node scripts/test-moderation-workflow.mjs\`
\`node scripts/test-criterion-feedback-bank.mjs\`
\`node scripts/test-exam-style-policy.mjs\`
\`node scripts/test-curriculum-coverage.mjs\`
\`node scripts/test-staging-rpc-client.mjs\`

The pull-request CI installs pinned test-only Playwright and checks the lab at 1440×960 and 375×812. It also starts disposable PostgreSQL 16, creates only fictional users, applies the staging schema there, executes the negative permission tests and destroys the test database job. The connected production MathsGrove Supabase project is not used for these tests.

## How to stage after external review — not a production runbook

1. Independently review each exemplar's algebra, correct answer, equivalent methods, dependent/independent credits, follow-through and special cases. Record real board and syllabus-year applicability. Match the curriculum mapping and obtain two separately authenticated examiner approvals.
2. Create an isolated, explicitly cost-approved Supabase test project with *fictional* learner accounts and a restricted partner organisation. Do not copy production Auth identities, attempts or student evidence.
3. Check the official Supabase changelog, Data API exposure configuration, function EXECUTE grants and current RLS recommendations. Review the SQL as a **proposal** and run it only on that isolated project after independent security signoff.
4. Validate RPC signoff, student submitted work, evidence uploads, examiner queue, role reassignment, wrong-org writes, expired entitlements, revocation, old/changed rubrics, released revisions, cross-parent and cross-tutor reads. Negative tests must inspect data state as well as errors. The existing GitHub CI is *not* a full Supabase Auth test.
5. Build a server-owned question authoring, student submission and evidence path for constructed responses. Currently v2 attempts are **seeded in staging by a trusted administrator** and the offline lab has no authenticated student submission or signed evidence upload; these missing parts block live release.
6. Validate proper staff-only question/solution access, rubric immutability, versioning, grade-report snapshots, backups, rollback, human screen-reader QA and Core Web Vitals. Do not issue grade forecasts from tiny samples or publish unmoderated questions.
7. Only after a separate risk review, explicit go/no-go and operational test gates can this become a controlled production change. Do not directly execute the staging SQL against the existing active MathsGrove project.

## Known blockers and honest scope

- v2 is not installed on production. Existing assigned-practice 0/1 marks and published reports are unchanged.
- This branch covers *representative* exam-style topics and all six route families, **not every academic level, unit, board or syllabus topic**. The curriculum audit reports missing routes and domains rather than hiding those gaps.
- There is no full constructed-response student assignment/scheduling/submission path, no secure file evidence record and no live examiner queue for these new v2 attempts yet.
- No human examiner has certified the original questions; review assertions and CI checks are not professional independent moderation.
- Database tests use disposable PostgreSQL and synthetic RLS/Auth scaffolding. Supabase-specific permission and storage tests remain unrun.
- The current Supabase security-audit issue #81 remains open; privileged-function advisories are not proven exploits and should not be indiscriminately revoked.

## Reliable references

- [Pearson International GCSE general marking guidance](https://qualifications.pearson.com/content/dam/pdf/International-GCSE/Mathematics-A/2024/Exam-materials/4wm2f-01-rms-20250821.pdf) for M/A/B, follow-through and equivalent methods.
- [Cambridge IGCSE 0580 syllabus 2025–2027](https://www.cambridgeinternational.org/Images/662466-2025-2027-syllabus.pdf), including Core/Extended topic coverage and paper calculator restrictions.
- [International Baccalaureate Mathematics AA specimen markscheme](https://www-prod.ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-analysis-and-approaches-specimen-papers-en.pdf), which uses M/A/R marks.
- [UAT-UK TMUA test format](https://esat-tmua.ac.uk/about-the-tests/tmua-test/).
- [Supabase database function permissions](https://supabase.com/docs/guides/database/functions) and [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).
