# MathsGrove · Marking & evidence-led feedback (design proposal)

**Status:** design + examiner-side 0/1 feedback assistant candidate, **not** a production schema change or a published rubric.
**Reviewed:** 12 November 2026. **Boundary:** original illustrative content only; no real learner records or unmoderated unseen exam keys.

## Current verified constraint

In the active MathsGrove Supabase project, **private.grove_practice_marks** records (task_id, position, mark, comment, marked_by, updated_at). The current **assigned-admin.js** gives each practice question **0 or 1** point and calls **public.grove_staff_mark_task(p_task, p_marks, p_feedback, p_release)**. Students see the released question mark out of 1 and examiner comments in assigned practice. **No distinct M/A/B awards exist for assigned practice yet.**

The draft **practice-feedback-assist.mjs** therefore **does not award component marks**, change the score, infer from a selected MCQ choice or contact a model. It proposes language only after a human examiner selects observed **Method**, **Accuracy** and/or **Explanation** evidence. The examiner can edit it; only the existing protected RPC saves/releases it. Unknown observations are never interpreted as missing skill. A score/evidence tension prompts the examiner to recheck.

## Next phase: true criterion-level marking for original, multi-mark questions

Proposed (NOT installed) data contracts:

- **question_rubric_versions:** immutable version per approved original question with qualification, board, syllabus year, calculator rule, question marks, learning objectives, moderation and provenance.
- **question_rubric_criteria:** ID, display code (such as M1, A1 or B1), max marks, precise credit condition, linked/dependent criterion IDs, allowed equivalent method, follow-through/accuracy policy, misconception tag, teaching action. Repeated M1 codes in different steps require distinct internal IDs.
- **question_criterion_awards:** private task/position, rubric version, criterion ID, examiner-awarded 0/1, evidence reference (answer line/whiteboard/photo), rationale, examiner identity and timestamp.
- **review_release_snapshot:** immutable released roll-up of marks, reviewed narrative, topic-level evidence and next-practice assignments. Revisions require an audit entry and a new explicit release; they do not overwrite historical pupil evidence.

**Rules:** rubric max must equal question max; no missing/duplicated awards at release; marks cannot exceed available; dependencies must be satisfied, or a specifically authorised "method implied" rule must be documented. Support alternate valid methods, follow-through where specified, special cases and equivalent answers. These policies are board/qualification-specific and need independent examiner approval. The server must recompute awarded total from criterion awards and reject inconsistent submissions. No client-supplied total or generated comment determines a score.

### Original fictional four-mark exemplar (not in any live bank)

*A rectangle has perimeter 30 metres and area 54 square metres. Find its side lengths. Give mathematical working.*

A reviewer-approved candidate rubric could be:

| Criterion | Mark | Evidence required | Example student feedback if absent |
| --- | ---: | --- | --- |
| M1 · perimeter | 1 | Sides modelled as x and 15−x, or valid equivalent | Start by halving the perimeter to find the sum of adjacent sides |
| M1 · area | 1 | x(15−x)=54, or equivalent valid simultaneous equations | Write an area equation before solving |
| M1 · solve | 1 | Derive and solve x²−15x+54=0=(x−6)(x−9), or equivalent | Check for two numbers with sum 15 and product 54 |
| A1 · dimensions | 1 | 6 m and 9 m; method earned or validly implied | Substitute both sides into the original perimeter and area |

**Independently checkable solution:** 2(x+y)=30, so x+y=15. Since xy=54, x(15−x)=54, so x²−15x+54=(x−6)(x−9)=0. Thus the dimensions are **6 m × 9 m**. Check 2(6+9)=30 m and 6×9=54 m². See [original schematic](marking-rectangle.svg), which is **not to scale**.

**Fictional examiner finding:** first two M criteria awarded, final method and A criterion not awarded → **2/4**. A report can truthfully say: “You translated the perimeter and area into correct equations. The algebraic solving step needs another look; check the pair of factors, then verify both measurements.” It must **not** claim that this has been awarded in the operational 0/1 practice system.

## Per-person report hierarchy (released evidence only)

| Student | Parent / guardian | Assigned tutor |
| --- | --- | --- |
| “The step you got right” + “where the method slipped” + next original question | Calm strength, one grounded focus and supportive question; denominator/sample size visible | Exact criterion and misconception, evidence reference and contrasting examples for next session |
| Visible earned/available marks and examiner release date | Read-only trends; no examiner-only note or unmoderated answer key | Teaching actions and delayed independent recheck, restricted to explicitly authorised learner |
| Recheck status “not yet observed” until a new independent attempt | No punitive deadline claims or guaranteed grades | Distinguish evidence gap, inaccurate result and unassessed reasoning |

**No progress inflation:** no predicted grades from tiny samples, no false mastery labels, no publishing unreleased scores, no sharing of tutor-only annotations with parents. Check access against both student identity and viewer role at every read. Revoke cached state on sign-out/role change.

## Interface, copy and motion direction for subsequent PRs

**Shared visual language:** restrained navy/ivory/champagne; consistent spacing, semantic headings, clear typography and contrast, keyboard-first controls, 44px touch targets. Do not hide essential reports behind hover, animated charts or horizontally scrolling panels.

- **Marketing hero:** “See the thinking behind every mark.” Supporting copy: “Original practice, considered examiner feedback and a clearer next step.” Avoid promising an automatic human-marked assessment or guaranteed progress.
- **Student:** “Your next step in maths.” Prioritise one current task, last released examiner observation, visible working and a meaningful retrieval/recheck; differentiate Weekly (four weekly sets), Daily (daily + Weekly) and Exam (approved assigned mock **only if genuinely present**).
- **Parent:** “See the progress. Know how to help.” One strength, one focus, one non-pressuring conversation prompt; explain evidence quality and denominators.
- **Tutor:** “Turn marked work into a better next lesson.” Diagnostic misconception with source and confidence, contrasting example and reassessment plan. Never expose an unassigned student's data.
- **Examiner:** “From marks to meaningful next steps.” Make the marking queue, student working, observable method/accuracy and human release decision a clear workflow.

**Motion:** progressive disclosure, hover/focus polish and short opacity/color transitions; only animate transform/opacity when useful. Respect prefers-reduced-motion; do not animate report scores or slide moving controls while marking. Measure LCP, CLS and INP on phone/desktop with real network conditions before making speed claims. Calendar dialog: focus trap/restore, Escape, backdrop semantics, scroll lock and accessible slot labels, with test coverage before visual restyling.

## Quality and release sequence

1. **Phase 1:** test examiner-assisted narrative helper with fictional 0/1 practice and ensure no score/RLS/schema changes; independent accessibility and browser validation.
2. **Phase 2:** independently moderate original 2–8-mark rubrics by route and board; define follow-through, alternative methods and inter-rater reliability tests.
3. **Phase 3:** add new versioned rubric storage in a staged Supabase project only, with least-privilege RLS and negative cross-role/cross-org tests; take backup and obtain explicit owner approval before live migration.
4. **Phase 4:** report screens for student/parent/tutor linked to released, scoped criterion evidence only; monitor rendering performance and permission revocation.
5. **Phase 5:** populate governed misconception-to-practice recommendation catalogue and audit whether delayed independent rechecks actually occurred. Do not automatically award marks or release reports.

**References:** Cambridge International 0580 specimen marking notes: https://www.cambridgeinternational.org/Images/663670-2025-specimen-paper-1-mark-scheme.pdf ; W3C animation guidance: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions ; web.dev INP: https://web.dev/articles/inp .
