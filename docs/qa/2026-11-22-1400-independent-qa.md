# Independent Maths QA — 2026-11-22 14:00 Asia/Kuwait

## Live evidence
Project: Supabase `nwakgkxytovprrrwyahs`; repository `MathsGrove/Mathora` (the requested `Mathora-mathematics/Mathora` did not resolve in this connected account; existing project repository is `MathsGrove/Mathora`).

- Private `grove_practice_bank`: 2,243 total; 1,950 active approved, 240 active pilot, 53 inactive draft. **Do not conflate approved with independently mathematically certified.**
- 2,190 active records: zero missing key in four choices; zero non-four-option sets; zero repeated choice within a set; zero empty prompts.
- 32 active records have absent board/objective or explanation under 25 characters; inspected examples are pilot records, not established mathematical errors. Pilot questions have public source keys and cannot be treated as secure unseen assessments.
- Normalised exact stem duplication across all active records exists (up to four instances), but zero duplicate groups after grouping by qualification + academic level + programme scope + normalised stem. This does NOT exclude near-duplicate families or unseen reuse across students.
- `grove_tasks`: 49 tasks, 52 assigned items, 21 answers, 22 marks, 1 baseline session. Grouped task status/mode join returned completed daily 4 and exam_daily 18; expired exam_daily 30; scheduled daily 1, exam_daily 32, mock 1, weekly 6. The task counts in this joined result are **row counts** and not distinct task counts. Scheduled tasks have no frozen items until opened, so cannot be declared Ready solely from scheduled state.
- `grove_signature_editorial`: 59 records; all awaiting human moderation, zero human-moderated; structural check of nonpositive totals / absent paper / absent mark scheme returned zero. **No Signature release authorised**.

## Reproducible read-only SQL
```sql
select review_state,active,count(*) from private.grove_practice_bank group by 1,2;
select count(*) filter(where not (choices @> to_jsonb(array[correct_text]))) bad_key,
count(*) filter(where jsonb_array_length(choices)<>4) wrong_count,
count(*) filter(where (select count(distinct v) from jsonb_array_elements_text(choices) v)<4) repeated_choices,
count(*) filter(where trim(prompt)='') empty_prompt
from private.grove_practice_bank where active;
select count(*) total,count(*) filter(where human_moderated_by is not null) moderated
from private.grove_signature_editorial;
with x as (select qualification,academic_level,programme_scope,
lower(regexp_replace(prompt,'[^a-zA-Z0-9]+','','g')) stem,count(*) n
from private.grove_practice_bank where active group by 1,2,3,4 having count(*)>1)
select count(*) duplicate_groups from x;
```

## Uncertified / hold boundaries
This is a structural and sampled editorial QA, **not** an exhaustive independent recomputation of 2,190 answers, all distractors, complete explanations, 59 multi-part Signature schemes, official 2026–27 board specifications, per-student unseen/near-duplicate adaptation, or rendered KaTeX. No unsupported claims of full certification. No production changes or new publication/quarantine performed. Cross-organisation RLS, private photo isolation, copyright provenance, mock timer enforcement and Pages CI still require end-to-end tests. Do not release Signature grades without actual authorised human moderation. Verified original practice may publish automatically after complete substantive verification without owner approval.
