# MathsGrove independent QA — 2026-11-07 20:01 Asia/Kuwait

## Live sources and scope
Queried Supabase project `nwakgkxytovprrrwyahs` using SQL against the **private** MathsGrove schema and inspected prior 18:00 journal in connected GitHub `MathsGrove/Mathora`. Historical requested `Mathora-mathematics/Mathora` path did not resolve via connector; do not claim it was directly audited. Read-only inspection; no practice, permission, mark or student data mutation.

## Reproducible checks (SQL summary)
- `private.grove_practice_bank`: COUNT(*)=2236; COUNT FILTER(active AND review_state='approved')=1942; active pilot=240. No inventory delta from 18:00.
- `private.grove_tasks`: 41, 38 scheduled. `private.grove_task_items`: 16 assignments, 16 distinct bank IDs and 16 distinct lower(trim/whitespace-normalised) stems.
- Join task items to bank: 12 active approved, 4 active pilot. Pilot eligibility for completed Daily task **not certified**.
- `private.grove_signature_editorial`: 21 assessments, 373 declared marks, zero rows with both human_moderated_by and human_moderated_at populated. Latest ID `60fae077-a5e9-499f-a58e-47c7210f77a2`, created 2026-11-07 14:05:42 UTC; no new assessment since 18:00 journal.
- `private.grove_practice_bank` has no created_at/updated_at/publication log columns; exhaustive identification of new/changed practice since last audit impossible. No new practice certified, activated or quarantined.
- `pg_policies` contains zero policies in schema private; this alone is not a permission-exposure finding (private schema may be inaccessible to API roles). Effective grants/function-security testing still required.

## Mathematical and editorial coverage
No new Signature item since prior cycle; previously inspected P4 diagnostic remains awaiting human moderation. This cycle did **not** independently recompute every historical Signature part, inspect each active practice distractor, render KaTeX, or verify official board 2026–27 mapping. These checks are **not passed** by absence of new rows. No Signature report or grade released.

## Risks and decisions
- Unresolved pilot use (4 materialised assignments).
- No immutable practice publication history; reviewer and official syllabus evidence need independent certification.
- Student-specific unseen eligibility, near-duplicate families, adaptation, tier inheritance, authenticated Ready status, copyright, storage/RLS cross-role tests, server timers, examiner release, and deployed GitHub Pages CI/browser checks not certified this cycle.
- Zero publishing or production fixes: insufficient evidence to make safe changes. Verified original practice remains preauthorised for automatic publication once substantively certified, without owner approval gate.
- Record findings for existing evening report; avoid duplicate ad-hoc email.
