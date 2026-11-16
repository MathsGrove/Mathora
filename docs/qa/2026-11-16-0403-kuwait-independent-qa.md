# Independent Maths QA — 2026-11-16 04:03 Asia/Kuwait (01:03 UTC)

## Live scope and evidence
Connected Supabase project `nwakgkxytovprrrwyahs`, private production tables; GitHub `MathsGrove/Mathora` README fetched. Requested owner spelling `Mathora-mathematics/Mathora` did not resolve via connector; accessible repository is `MathsGrove/Mathora`.

## Verified database results
- Practice inventory 2,236; active approved 1,942; active unapproved 240; inactive 54 (derived remainder).
- Approved bank exact normalized-stem duplicates: 516 groups, 1,143 excess copies. Normalization used lower(trim(prompt)) and whitespace collapsing. This does **not** prove student-level duplicate delivery.
- All 240 active unapproved pilots missing exam_board or syllabus_objective; 12 have explanation length <20.
- Task inventory 49: scheduled 40, expired 5, completed 4; four task items linked to missing/inactive/nonapproved bank entries.
- Signature editorial 45 papers, latest created 2026-11-15 20:00:12 UTC, no new paper since 2026-11-15 23:01 UTC; zero human_moderated_at values. No new Signature mark scheme to recompute this cycle.
- `public.mark_schemes` SELECT policy `schemes_select` allows any partner/examiner/admin membership without an organisation correlation in its predicate. Potential cross-tenant key exposure; not an authenticated exploit proof.

## Reproduction SQL
```sql
SELECT count(*) FROM private.grove_practice_bank;
SELECT count(*) FROM private.grove_practice_bank WHERE active AND review_state='approved';
WITH norm AS (SELECT regexp_replace(lower(trim(prompt)),'\\s+',' ','g') stem FROM private.grove_practice_bank WHERE active AND review_state='approved'), dup AS (SELECT count(*) n FROM norm GROUP BY stem HAVING count(*)>1) SELECT count(*) groups, sum(n-1) extra FROM dup;
SELECT count(*) FILTER (WHERE active AND review_state<>'approved') pilots, count(*) FILTER (WHERE active AND review_state<>'approved' AND (coalesce(trim(exam_board),'')='' OR coalesce(trim(syllabus_objective),'')='')) unmapped, count(*) FILTER (WHERE active AND review_state<>'approved' AND length(trim(coalesce(explanation,'')))<20) short FROM private.grove_practice_bank;
SELECT count(*) FROM private.grove_task_items ti LEFT JOIN private.grove_practice_bank b ON b.id=ti.bank_id WHERE b.id IS NULL OR NOT b.active OR b.review_state<>'approved';
SELECT status,count(*) FROM private.grove_tasks GROUP BY status;
SELECT count(*),max(created_at),count(*) FILTER (WHERE human_moderated_at IS NOT NULL) FROM private.grove_signature_editorial;
SELECT policyname,cmd,qual FROM pg_policies WHERE schemaname='public' AND tablename='mark_schemes';
```

## Release and risk disposition
No new practice cohort can be exhaustively identified because private.grove_practice_bank has no created_at/updated_at fields. Therefore no new question was mathematically or syllabus-certified this run, and **none published or quarantined**. No Signature grades/reports issued. No untested RLS migration made. Unapproved and unverified content must remain staged. Existing approved duplicate families need student-level exposure checking before being represented as unseen.

## Not certified
Every answer/distractor/explanation for newly published practice, official 2026–27 board/component mapping, actual unseen exposure and adaptive difficulty, student Ready status, rendered KaTeX, originality/copyright provenance, multi-tenant authenticated RLS and storage tests, examiner release controls, mock server expiry, and Pages CI. README explicitly warns against real student onboarding without cross-account security testing and notes strict mock hard stops incomplete.

## Owner evening report handoff
Escalate missing organisation scope in mark_schemes SELECT, 516 duplicate families, four ineligible assigned items, 240 unmapped active pilots, missing publication traceability and lack of end-to-end production security verification. Practice originals may publish automatically **only after substantive mathematical and specification verification**; Signature requires actual authorised human moderation.
