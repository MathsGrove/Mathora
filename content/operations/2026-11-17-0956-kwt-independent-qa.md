# MathsGrove independent QA — 2026-11-17 09:56 Kuwait

## Scope and source
Live Supabase project `nwakgkxytovprrrwyahs`, private.grove_practice_bank and task/signature tables; GitHub repository `MathsGrove/Mathora` (requested historical `Mathora-mathematics/Mathora` was not directly resolvable by commit search). Previous checkpoint 08:00 Kuwait. Editorial publication: [d334657](https://github.com/MathsGrove/Mathora/commit/d33465710740c92f081366905d123f63cbf99f5a), batch MG-20261117-0901-KWT.

## Newly published question — defect and narrow correction
UUID `18e85549-ffef-43a0-b434-8b61464b139d`; IGCSE 0580 Extended, Paper 4, E1.10 limits of accuracy; published approved/active, with `reviewed_at IS NULL`. Prompt: rectangle 12.4 cm by 8.6 cm, both nearest 0.1 cm, upper bound for area.

Independent exact arithmetic:
- length in [12.35,12.45), width in [8.55,8.65); all positive.
- upper area bound/supremum 12.45*8.65 = 107.6925 cm²; the upper endpoint is not attained.
- distractors: 106.64 = 12.4*8.6; 107.07 = 12.45*8.6; 106.0225 is neither upper bound nor the lower-bound product.
- **CONFIRMED EXPLANATION ERROR:** published text said 106.0225 "uses both lower bounds"; actual 12.35*8.55 = 105.5925. Key and options are unique; only 107.6925 is the upper bound.
- **FIX APPLIED:** conditional UPDATE changed only the false distractor explanation to identify 106.0225 as an incorrect numerical value and give the true lower-bound product. Readback confirmed corrected explanation, unchanged choices/key, approved/active state. Zero existing task-item references for this UUID. Exact whitespace-normalised stem duplicate count = 0. No speculative bulk change.
- Official Cambridge 0580 version 3, 2025–2027, E1.10 explicitly includes bounds of calculated area of rectangle; Paper 4 calculator Extended: https://www.cambridgeinternational.org/Images/662466-2025-2027-syllabus.pdf (checked 2026-11-17). Original authoring claimed by editorial provenance; no reproduction of copyrighted past-paper text identified. Plain-text math, no LaTeX delimiters in this item; browser rendering not verified.

## Live aggregates and access
Private practice bank: 2,238 total; 1,944 approved active; 240 active unapproved; 54 inactive. No additional practice row with `reviewed_at` after 05:00 UTC; the new row had NULL reviewed_at, proving timestamp-only discovery is incomplete. Tasks: 40 scheduled, 5 expired, 4 completed; 52 task items; 0 ineligible scheduled item references. Signature: 52 papers, 0 human-moderated, latest paper created 00:01 UTC, no new Signature since previous checkpoint. Latest 16-mark Normal Combinations paper already checked in preceding run, not newly re-certified here. Student-specific unseen/near-duplicate families, baseline adaptation, tier inheritance and Ready status not certified. Both storage buckets private, with student-work images limited to JPEG/PNG/WebP and 5 MiB; authenticated isolation not exercised.

## Unresolved security issue
`public.mark_schemes` SELECT policy `schemes_select` checks existence of ANY privileged membership for auth.uid(), without row-specific organisation scoping. Potential cross-organisation answer-key exposure; no authenticated exploit test. Needs policy design and migration/test with representative multi-org identities, not an untested live RLS change.

## Release and limits
Corrected a confirmed explanation error; no new questions activated, no Signature grades/reports issued, no human moderation impersonated. Full semantic dedupe, per-student unseen supply, KaTeX browser checks, mock server timers, GitHub Pages deployment CI and copyright provenance beyond original-text evidence remain uncertified. Findings are available for the established evening owner report. Verified original practice publication is preauthorised; questionable drafts remain staged.

## Reproducible read-only SQL
```sql
SELECT count(*) total,count(*) FILTER (WHERE active AND review_state='approved') approved,
count(*) FILTER (WHERE active AND review_state IS DISTINCT FROM 'approved') pilots,
count(*) FILTER (WHERE NOT active) inactive FROM private.grove_practice_bank;
SELECT id,prompt,choices,correct_text,explanation,reviewed_at FROM private.grove_practice_bank WHERE id='18e85549-ffef-43a0-b434-8b61464b139d';
SELECT count(*) FROM private.grove_task_items WHERE bank_id='18e85549-ffef-43a0-b434-8b61464b139d';
SELECT policyname,qual FROM pg_policies WHERE schemaname='public' AND tablename='mark_schemes' AND cmd='SELECT';
```
