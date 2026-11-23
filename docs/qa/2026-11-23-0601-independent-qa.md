# Independent Maths QA — 2026-11-23 06:01 Asia/Kuwait

## Live sources and scope
- Supabase project `nwakgkxytovprrrwyahs`, private.grove_practice_bank and private.grove_signature_editorial, queried this cycle.
- GitHub accessible repository `MathsGrove/Mathora`; requested `Mathora-mathematics/Mathora` is not among connected repositories.
- Latest pre-existing editorial journal commit: bc068c7728ae5826e0e4e3848115011e96f23d0c at 2026-11-23 02:01:35 UTC.

## Reproducible inventory
```sql
select count(*) total,
 count(*) filter(where active) active,
 count(*) filter(where active and review_state='approved') approved,
 count(*) filter(where active and (nullif(trim(exam_board),'') is null or nullif(trim(syllabus_objective),'') is null)) metadata_gaps,
 count(*) filter(where active and length(coalesce(explanation,''))<30) short_explanations
from private.grove_practice_bank;
select count(*),max(created_at) from private.grove_signature_editorial;
select id,title,created_at,total_marks,review_state,human_moderated_by,question_paper,mark_scheme
from private.grove_signature_editorial order by created_at desc limit 1;
```
Results: 2243 total; 2190 active; 1950 approved; 240 active metadata gaps; 56 active short explanations. Signature: 63 records, latest created 2026-11-23 02:01:28 UTC.

## Newest Signature paper independent mathematics
Record ef15deb6-01ee-4373-8961-a5853546b2ed, *Binomial Coefficients and Stationary Points — Original Mini-Paper*, 12 marks; awaiting_human_moderation, human_moderated_by NULL.
- Q1(a), 3 marks: (2+x)^5 = 32 + 80x + 80x² + 40x³ + 10x⁴ + x⁵. First three coefficients 32,80,80. Scheme correct.
- Q1(b), 3 marks: [x²](1-3x)(2+x)^5 = 80 - 3(80) = -160. Scheme correct.
- Q2(a), 2 marks: y'=3x²-12x+9=3(x-1)(x-3); x=1,3. Scheme correct.
- Q2(b), 2 marks: y(1)=6, y(3)=2, points (1,6), (3,2). Scheme correct.
- Q2(c), 2 marks: y''=6x-12, values -6 at x=1 (local max) and +6 at x=3 (local min). Scheme correct.
- Marks: 3+3+2+2+2=12; question totals 6+6=12. No mathematical discrepancy found in this paper. This is NOT human moderation and does not authorise release of Signature grades/reports.

## Unresolved / not certified
- 240 active records missing board/objective metadata; 56 short explanations require editorial assessment, not automatically mathematical failures.
- Full-bank exact answer/distractor/KaTeX/official 2026–27 component checks and copyright provenance not exhaustively verified this run.
- Student-specific assigned/unseen family duplicates, adaptive baseline/feedback, tier/mode inheritance and Ready status not verified this run.
- Cross-account RLS, student photo/whiteboard storage, examiner marking, server mock timers, GitHub Pages deployment CI not tested this run.
- Previous three assignment difficulty mismatches remain unresolved; possible adaptation, not yet classified as defects.
- No production records modified, no new practice published or quarantined, no Signature grades issued.
- Verified original practice can publish without owner approval; unverified/questionable content must stay staged.
- Findings available to established evening owner-report workflow.
