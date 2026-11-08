# MathsGrove: reliability-first implementation plan

**Approved scope (8 November 2026):**
- **A.** Make the public website shorter and more persuasive, with an honest supported-programme comparison and a genuine enquiry path.
- **B.** Pilot a **Reasoning Journey** for **one qualification/board/tier**, connecting original working → structured examiner feedback → focused practice → delayed independent recheck.
- **C.** Show evidence of learning improvement to each authorised student/examiner, and aggregated, released-only coaching information to nominated Grove Exam parents/tutors.

## Release gates before adding features

| Gate | Evidence | Release rule |
| --- | --- | --- |
| Question-bank supply #20/#59 | Board/level/programme-approved *unseen* inventory for the **specific learner** | Do not enrol/activate unsupported routes or promise an assessment that cannot be served; preserve fail-closed `grove_task_start` |
| Rolling assignments #40 | 7- and 28-day schedule horizon | Warn staff immediately; auto-renew only after isolated idempotency, entitlement, expiry and rollback tests |
| Programme integrity #31 | Proposed programme+qualification+board+target-grade changes | One atomic DB operation; failed grade invalidates all updates, never leaves partial setup |
| Repetition #45 | Same-learner baseline / practice prompt and mathematical family | No reissue; don't reuse pilot/draft content to mask shortage |
| Mocks #24/#59 | Approved paper content, exact marks, expiry, marker and private release | Do not advertise as working until end-to-end tested; Signature remains separately commissioned |
| Permissions | Student/examiner/parent/tutor roles, Supabase RLS/RPCs | Least privilege; no exposed unreleased grades, student work or cross-org records |

## Delivery stages

### 0. Verified core reliability (start now)
1. Fix the partial-save bug in the existing student programme form using one staff-authorised transactional RPC.
2. Surface 7-day scheduling horizon gaps in the existing **authorised examiner/admin** overview, without altering student schedules.
3. Add release-ready inventory and assignment continuity checks; record the actual gaps, not marketing claims.
4. Stage an idempotent rolling-renewal scheduler *without enabling writes* until tested with fictional/trial accounts, and verify 28-day rollover and ended entitlements.
5. Keep all mathematics/editorial, family-privacy, browser/mobile and existing paper/whiteboard tests green.

### A. Public website and enquiry (after critical gates)
- Shorter hero: **See the thinking behind the mark.**
- One guided original mathematical demonstration using fictional work; disclose which feedback is specimen vs examiner-verified.
- Exactly one primary enquiry or enrolment route with approved recipient, consent, retention, spam protections and acknowledgement. **Do not invent or expose a personal email.**
- Programme pages state *actually ready* qualification+board+tier availability; accurate Weekly/Daily/Exam commitments.
- Measured desktop/mobile Core Web Vitals, keyboard and WCAG 2.2 testing, proper metadata and indexable pages; avoid publishing student routes to search.

### B. Reasoning Journey pilot
- Pick one route **after** the subject lead independently approves adequate original questions and licence rights.
- Start with existing private student answers and saved whiteboard evidence; expose no raw work publicly.
- Examiner adds a structured misconception code, one positive method observation, one corrective step and one matched recheck.
- Delayed recheck must use a separately approved question of the same skill but different mathematical structure; preserve examiner authority and no automatic pass.
- Make versioned, auditable, read-only student view; normal student work must remain untouched on schema rollback.
- Pilot acceptance: examiners can review, two separate students see only own releases, parent sees only authorised released summaries, no inflated mastery claims.

### C. Proof-of-Progress dashboards
- Evidence states: initial attempt → feedback released → targeted practice → independent recheck.
- Show denominator and confidence: “1/1 correct, needs another recheck”, not “100% mastered”.
- Parent brief includes what changed and one supportive action, not behaviour surveillance or false deadlines.
- Time on question screens is recorded visibility, never proof of all study time; compare only against *real due_at* once a separately approved deadline policy exists.

## Verification and deploy procedure
1. Work in a feature branch, no direct main changes.
2. Implement no-data / fictional-student tests and targeted SQL tests; lint/CI and browser smoke on phone and desktop.
3. Review migration and permissions before any production database deployment.
4. Merge only once required tests pass and no privacy/academic regression is seen.
5. Confirm the live MathsGrove Pages assets after deployment; document what remains untested. No live student data used for QA.

## Success metrics
- No partial programme updates.
- No silent 7-day schedule holes for entitled and supported learners.
- 100% pilot questions independently reviewed, with zero cross-account data disclosure.
- Every released examiner action traceable to a later practice/recheck.
- Public visitors can understand the service and reach an actual enquiry destination, not just sign-in.
- Real device performance and user comprehension improve against measured baseline.

**Requires operator decisions:** business enquiry recipient/workflow, initial qualification pilot route, exact deadline+extension policy, the content editorial approval owner. Never infer these from personal account details.
