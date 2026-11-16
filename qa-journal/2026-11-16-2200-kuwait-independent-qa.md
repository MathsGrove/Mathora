# Independent Maths QA — 2026-11-16 22:00 Asia/Kuwait

Scope: live Supabase project `nwakgkxytovprrrwyahs`; accessible GitHub repository `MathsGrove/Mathora`. Requested `Mathora-mathematics/Mathora` was not resolved as the connected writable repository. Read-only production inspection; this document is the only write.

## Confirmed
- Private practice bank 2,236: 1,942 active approved; 240 active unapproved; 54 inactive. All 240 active unapproved have missing board or syllabus-objective metadata; 12 active explanations <20 characters.
- Approved bank: 516 identical normalized prompt groups, 1,143 additional copies (lower(trim(prompt)), collapse whitespace).
- Tasks: 40 scheduled, 5 expired, 4 completed; 4 invalid bank references across one historical task; 10 scheduled tasks due through Nov 16 but zero scheduled tasks with ends_at earlier than current server time. A due_date alone is not proof of expiry.
- Signature 50 papers; newest 2026-11-16 18:03:50 UTC, `Helpdesk Requests and Linear Density`, ID `7483abbe-cdfd-4c1a-9834-0bcdb7edc985`, review_state awaiting_human_moderation; zero human_moderated_at.
- New Signature recomputation, each part and mark scheme:
  - Q1a rate 2 per 10 min => lambda15=3; P(N>=2)=1-4exp(-3)=0.8008517265 -> 0.8009 (3 marks).
  - Q1b lambda30=6; P(N=4)=exp(-6)*6^4/4!=54exp(-6)=0.1338526 -> 0.1339 (2 marks).
  - Q1c independent intervals P(each >=1)=(1-exp(-3))^2=0.902905... -> 0.9029 (3 marks).
  - Q2a integral_1^3 kx dx=4k=1 => k=1/4 (2 marks).
  - Q2b E[X]=integral_1^3 x^2/4 dx=13/6, E[X^2]=integral_1^3 x^3/4 dx=5 (3 marks).
  - Q2c Var(X)=5-(13/6)^2=11/36 (2 marks).
  - Q2d P(X>2)=integral_2^3 x/4 dx=5/8 (1 mark).
  - Part totals 8+8=16; all seven part-mark allocations and answer expressions reconcile. Official 2026–2027 9709/6 syllabus wording, provenance and browser KaTeX were not independently certified.
- Storage buckets student-work and grove-student-exports are nonpublic, with image-only 5MB and zip-only 50MB constraints respectively. Storage SELECT policy restricts student-work by user path or organisation membership; authenticated cross-account isolation not tested.
- `public.mark_schemes` SELECT policy is based on membership role in any organisation without an organisation constraint. Potential cross-org key exposure; exploit not proven.

## Reproducible SQL
```sql
select count(*), count(*) filter(where active and review_state='approved'), count(*) filter(where active and review_state is distinct from 'approved'), count(*) filter(where not active) from private.grove_practice_bank;
select count(*) filter(where active and (nullif(trim(exam_board),'') is null or nullif(trim(syllabus_objective),'') is null)),count(*) filter(where active and length(coalesce(explanation,''))<20) from private.grove_practice_bank;
with stems as (select regexp_replace(lower(trim(prompt)),'\\s+',' ','g') s,count(*) n from private.grove_practice_bank where active and review_state='approved' group by 1 having count(*)>1) select count(*),sum(n-1) from stems;
select status,count(*) from private.grove_tasks group by status;
select count(*),count(distinct i.task_id) from private.grove_task_items i left join private.grove_practice_bank b on b.id=i.bank_id where b.id is null or not b.active or b.review_state is distinct from 'approved';
select id,title,created_at,review_state,total_marks,question_paper,mark_scheme from private.grove_signature_editorial order by created_at desc limit 1;
select policyname,qual from pg_policies where schemaname='public' and tablename='mark_schemes';
select name,public,file_size_limit,allowed_mime_types from storage.buckets;
```

## Release and outstanding gates
No practice activation or quarantine: absence of created_at/updated_at on private practice bank prevents exhaustive cohort identification. No new practice independently certified. Student-specific unseen family, baseline/feedback adaptation, tier/mode inheritance, ready status, full distractors, copyright provenance, official syllabus crosscheck, GitHub Pages CI, server mock timer, authenticated RLS/storage tests and examiner marking workflow remain uncertified. Do not treat inventory/metadata checks as these tests. No Signature marks or reports issued, and no human moderation impersonated. Verified original practice may publish automatically without owner approval after all gates; questionable material stays staged. Include unresolved RLS and traceability in established evening owner report.
