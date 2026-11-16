# MathsGrove live-source reconciliation — 2026-11-16 03:05 KWT

Batch: MG-20261116-0305-KWT. Target project: `nwakgkxytovprrrwyahs`.

## Direct observations
- Queried `information_schema.tables` and `information_schema.columns` on the specified project through the connected Supabase SQL action.
- Public schema has `question_bank` (id, qualification, topic, prompt, marks, difficulty, active, created_at), `mark_schemes` (question_id, scheme), `paper_questions`, and assessment/identity tables. **No route-specific editorial approval, provenance, exam board/component/year, candidate answer/distractor, Signature moderation library, or student future-assignment reservation tables were found in the public schema.**
- `select count(*) total,count(*) filter(where active) active,count(*) filter(where not active) inactive from public.question_bank` returned **10 total / 10 active / 0 inactive**. This contradicts prior reports of 339 Weekly, 639 Daily, 964 Exam and 54 drafts. Those figures are **not substantiated in this specified live project**; they must not be presented as current inventory without a verified alternate source.
- The 10 sampled prompts are basic written-response items spanning IGCSE, GCSE, A_LEVEL, IB_AA, IB_AI and TMUA; none has sufficient metadata to certify board, paper, tier, syllabus year, calculator policy or a single-correct MCQ set.
- Requested `Mathora-mathematics/Mathora` README fetch failed; `MathsGrove/Mathora` README was readable and warns that live invitation/access flows and cross-account permission testing remain incomplete.

## Editorial decisions
- Candidates activated: **0**. Candidates rejected for immediate publication: **10 existing active records**, as *unverified for the specified publication workflow*, not as mathematically incorrect. No records were deactivated without establishing current student impact.
- New Signature manuscripts: **0**; no verified private Signature editorial library table is present in the queried public schema. No human sign-off was represented or bypassed.
- No site code changes, GitHub Actions deployment, or student report release.
- Exact route-level eligible shortfalls (Weekly 32, Daily 112 plus weekly, Exam 188 plus weekly): **not computable** from the present schema. Naively counting the 10 active questions would be misleading.

## Remediation required
1. Reconcile which database/schema contains the previously reported editorial inventory; inspect source tables and policies without exposing student data.
2. Add/version a board-component-year-tier-calculator editorial model and atomic approval/activation provenance, plus question-family and student history/reservation constraints; migrate only after security review.
3. Validate every question against current official board specifications, mathematical derivation, distractors, rendering, duplicate families and eligible student routes before activation.
4. Keep Signature material private and `awaiting_human_moderation` until authenticated examiner sign-off.
5. Verify production deployment through passing GitHub Actions, not merely a successful file commit.

Sources: live Supabase SQL inspection and connected GitHub README at time of batch. No claim of official syllabus verification was made for this batch.
