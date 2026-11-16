# Independent Maths QA — 2026-11-16 08:03 Asia/Kuwait

## Scope and provenance
Read-only live Supabase project `nwakgkxytovprrrwyahs`, schemas public/private; GitHub `MathsGrove/Mathora` (latest pre-audit commit a6d80e6ed5ac4888b8cec1c951b6f7e250cb3250). Requested alternate owner `Mathora-mathematics/Mathora` not resolved by GitHub search connector. All figures below are live database query results; no unverified claims of complete mathematics certification.

## Reproducible checks
```sql
SELECT count(*) total,
 count(*) FILTER (WHERE active AND review_state='approved') approved,
 count(*) FILTER (WHERE active AND review_state IS DISTINCT FROM 'approved') pilots,
 count(*) FILTER (WHERE NOT active) inactive
FROM private.grove_practice_bank;
SELECT count(*) FILTER (WHERE active AND review_state <> 'approved' AND
 (nullif(trim(exam_board),'') IS NULL OR nullif(trim(syllabus_objective),'') IS NULL)) unmapped,
 count(*) FILTER (WHERE active AND review_state <> 'approved' AND
 length(trim(coalesce(explanation,'')))<20) short_explanations
FROM private.grove_practice_bank;
SELECT count(*) groups, sum(n-1) extra FROM (
 SELECT count(*) n FROM private.grove_practice_bank
 WHERE active AND review_state='approved'
 GROUP BY lower(regexp_replace(trim(prompt),'\s+',' ','g'))
 HAVING count(*)>1) d;
SELECT count(*) total,count(*) FILTER (WHERE created_at >= now()-interval '2 hours') recent,
 count(*) FILTER (WHERE human_moderated_at IS NOT NULL) moderated
FROM private.grove_signature_editorial;
SELECT status,count(*) FROM private.grove_tasks GROUP BY status;
SELECT count(*) FROM private.grove_task_items i
LEFT JOIN private.grove_practice_bank b ON b.id=i.bank_id
WHERE b.id IS NULL OR NOT b.active OR b.review_state IS DISTINCT FROM 'approved';
SELECT policyname,qual FROM pg_policies WHERE tablename='mark_schemes';
```

## Results
- Practice: 2,236 total; 1,942 active approved, 240 active unapproved, 54 inactive. All 240 pilots missing nonblank exam-board or syllabus-objective mapping; 12 explanations under 20 characters.
- Exact normalized prompt duplicates among approved: 516 groups, 1,143 extra copies. This does not establish individual student repetition.
- Signature: 45 papers, zero created in preceding two hours, zero human-moderated; latest paper created 2026-11-15 20:00:12 UTC, still awaiting human moderation. No new Signature mark scheme to recompute in this window.
- Assignments: 49 tasks: 40 scheduled, 5 expired, 4 completed. Ten scheduled tasks have due_date <= 2026-11-16 (database current_date); 4 task items link to missing/inactive/unapproved bank records.
- Public question_bank: no rows created since 2026-11-16 03:00 UTC. Private practice bank has no created_at/updated_at, so exhaustive two-hour cohort verification is impossible.
- Security: public.mark_schemes SELECT policy `schemes_select` uses existence of any privileged membership with no org_id correlation. Potential cross-tenant scheme exposure, not an authenticated exploit demonstration.

## Release decision and limitations
No practice published or quarantined; no mathematical evidence sufficient to certify an unidentified private-bank publication cohort. No Signature grades or reports issued. Unverified pilots remain staged. No untested RLS changes. Student-specific unseen-family and adaptation, baseline/feedback, tier inheritance, official board/component 2026–27 syllabus, distractors, KaTeX, photo/whiteboard storage isolation, copyright, server mock timing, CI deployment and human moderation workflow not fully certified this run. Prioritize RLS isolation, timestamps, deduplication, task lifecycle and syllabus mapping in evening report. Pre-authorised original practice requires substantive verification, not owner approval.
