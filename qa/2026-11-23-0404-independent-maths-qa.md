# Independent Maths QA — 2026-11-23 04:04 Asia/Kuwait

## Live evidence
Project: Supabase `nwakgkxytovprrrwyahs`. Accessible GitHub repository: `MathsGrove/Mathora`; requested `Mathora-mathematics/Mathora` not verified.

- `private.grove_practice_bank`: 2,243 total; 2,190 active; 1,950 active approved; 240 active nonapproved with blank board/objective fields (empty strings must be treated as missing); 56 active explanations shorter than 30 characters.
- Zero active records with empty prompt/answer; zero invalid four-choice array counts. These are structural checks only.
- `private.grove_signature_editorial`: 62 records; zero recorded human moderators; newest record created 2026-11-22 16:04:39 UTC.
- Latest Signature arithmetic/geometric mini-paper: recomputation confirms u_n=3n+4, S_n=n(3n+11)/2, S_9=171, S_10=205, geometric fifth term 16, first four sum 195, convergent infinite sum 243. Part marks 2+2+2+2+2+2=12, grouped 6+6=12. Human moderation remains required.

## Reproducible read-only SQL
```sql
select count(*) total,count(*) filter(where active) active,
count(*) filter(where active and review_state='approved') approved,
count(*) filter(where active and (nullif(trim(exam_board),'') is null or nullif(trim(syllabus_objective),'') is null)) blank_metadata,
count(*) filter(where active and length(coalesce(explanation,''))<30) short_explanations,
count(*) filter(where active and (jsonb_typeof(choices)<>'array' or jsonb_array_length(choices)<>4)) bad_choices
from private.grove_practice_bank;
select count(*) total,count(*) filter(where human_moderated_by is not null) moderated,max(created_at) newest
from private.grove_signature_editorial;
```

## Certification boundaries
No newly created Signature assessment found since previous cycle. No evidence to certify exhaustive question mathematics, individual distractors, official 2026–27 board/component syllabus, actual student unseen/near-duplicate/adaptation/Ready logic, copyright, RLS, student images, server timers, rendered KaTeX, or Pages CI in this run. No automatic practice publication or status changes; staged content remains staged pending substantive verification. No Signature grades issued. Prior assignment difficulty drift remains unresolved. This journal is an evidence-limited QA record, not a blanket pass.
