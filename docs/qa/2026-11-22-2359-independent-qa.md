# Independent Maths QA — 2026-11-22 23:59 Asia/Kuwait

## Live evidence
Supabase project `nwakgkxytovprrrwyahs`, read-only SQL executed this cycle:
```sql
select count(*) total,count(*) filter(where active) active,count(*) filter(where active and review_state='approved') approved,count(*) filter(where active and (nullif(trim(exam_board),'') is null or nullif(trim(syllabus_objective),'') is null)) metadata_gap,count(*) filter(where active and length(trim(coalesce(explanation,'')))<30) short_explanation from private.grove_practice_bank;
select count(*) total,count(*) filter(where human_moderated_by is not null) moderated,max(created_at) newest from private.grove_signature_editorial;
select id,title,total_marks,created_at,review_state,question_paper,mark_scheme from private.grove_signature_editorial order by created_at desc limit 1;
select count(*) total from private.grove_task_items;
```
Results: 2243 practice total, 2190 active, 1950 active approved, 240 active metadata gaps, 56 active explanations shorter than 30 characters; 62 Signature editorial records, zero human-moderated, newest created 2026-11-22 16:04:39 UTC; 52 assigned task items. These counts match the previous cycle; no new Signature paper was found.

## Reproducible independent check of latest Signature paper
Record 87179b88-8266-4f39-b78e-30c7a5699836, Arithmetic and Geometric Progressions — Original Mini-Paper, awaiting human moderation.
Arithmetic a=7,d=3: u_n=7+3(n-1)=3n+4 (2 marks); S_n=n(14+3n-3)/2=n(3n+11)/2 (2); S_9=171 <=200, S_10=205>200, monotonic since positive terms, least n=10 (2).
Geometric a=81,r=2/3: u_5=81*(2/3)^4=16 (2); S_4=81+54+36+24=195 (2); S_infinity=81/(1-2/3)=243 because |r|<1 (2). All six mark-scheme results and 12 total agree. No human moderation was asserted or applied.

## Findings and release boundary
No new practice content was mathematically certified in this cycle; no publish or quarantine change. 240 active metadata gaps and 56 short explanations are **flags requiring item-level editorial assessment**, not automatically proof of mathematical incorrectness. Full-bank exact-answer/distractor/explanation/official specification/copyright review, student-specific unseen/adaptation/Ready, RLS and photo storage, server timers, rendered KaTeX, Pages CI and examiner marking were NOT independently certified. Do not label these passes. The requested Mathora-mathematics/Mathora repository search returned a permission/not-found error; journal saved in accessible MathsGrove/Mathora. Verified original practice may be published without owner approval only after substantive verification; Signature remains staff-only and awaiting authorised human moderation.
