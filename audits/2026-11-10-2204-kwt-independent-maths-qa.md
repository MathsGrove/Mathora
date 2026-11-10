# MathsGrove independent maths QA — 2026-11-10 22:04 Kuwait

## Live evidence
Supabase project `nwakgkxytovprrrwyahs`, queried during this cycle. Public schema: `question_bank` 10 rows, `mark_schemes` 10, `attempts` 0, `answers` 0, `paper_questions` 0, `reviews` 0. All ten question creation timestamps are `2026-10-28 11:37:12.144858+00`. No new *created* questions were found in this table. No immutable publication log or full update-history was available; therefore no claim of comprehensive new-publication coverage. Previous reports of 2,236 questions cannot be reconciled with this accessible schema. The source of the actual wider practice publication pipeline remains unknown.

## Reproducible mathematics and marks
All ten stored prompts and schemes re-read in this cycle; independent algebra checks:
- `0cbb3e11`: `x²−7x+12=(x−3)(x−4)`; roots 3 and 4; 3/3 scheme points consistent.
- `304efb65`: `3(2x−1)=4x+9 => 2x=12 => x=6`; 3/3.
- `cbcc8ab9`: `sqrt(6²+8²)=10 cm`; 3/3.
- `58f1e962`: `3/4+5/6=9/12+10/12=19/12=1 7/12`; 3/3.
- `eefa886e`: `x+y=10,2x−y=5 => 3x=15 => x=y=5`; 4/4.
- `3b23181d`: `d/dx(3x³−5x²+7x−2)=9x²−10x+7`; 3/3.
- `6c76fb80`: `integral(6x²−4x+1)dx=2x³−2x²+x+C`; 4/4.
- `98fff8a2`: `x²−6x+5=(x−3)²−4`; vertex (3,−4); 4/4.
- `06fd867b`: `(4+7+8+9+12)/5=40/5=8`; 2/2.
- `4955338b`: roots 3 and 4, sum 7; 3/3 mathematical scheme points, **not** valid TMUA examination response format.

Total 10/10 mathematical prompts and 32/32 available marking-scheme points consistent; this is **not** a human examiner moderation decision. These are stored schemes, not student submissions. No Signature part marks or grades issued. Stored questions have no distractor/key/full worked explanation/component-syllabus fields, so those criteria cannot be certified.

## Findings and restrictions
- **Format mismatch:** `4955338b` is TMUA-labelled but asks for free-response justification with process marks. Must not be presented as authentic TMUA multiple-choice practice without rewriting and full QA.
- **Near duplicate:** `4955338b` and `0cbb3e11` reuse `x²−7x+12`; no student exposure established.
- **Potential tenant RLS leak:** `mark_schemes` SELECT `schemes_select` permits any authenticated member with role partner/examiner/admin; it does not correlate requested scheme/question to member's organisation. `question_bank` SELECT similarly checks membership anywhere. Both RLS enabled, but cross-tenant negative test and ownership-model mapping not done. Do not modify policy blindly.
- Storage buckets `student-work` and `grove-student-exports` are private; object policies and signed URL isolation not verified.
- Assignment adaptation, actual unseen IDs, baseline, tier, Ready, publication delta, official 2026–27 component mapping, copyright provenance, KaTeX rendering, timers, Signature staff-only moderation, and latest Pages CI **not certified in this run**.

## Publication and action
No new question independently established as fully eligible; no questions activated or quarantined, no RLS edits, student records, marks, reports or permissions changed. Owner's standing preauthorisation for publication of *fully verified original practice* remains; no approval bottleneck. Existing concerns persist and should be included in established evening report. Next priority: reconcile actual practice inventory and prove tenant-isolated scheme access before narrow security correction.
