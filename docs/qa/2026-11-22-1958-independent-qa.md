# Independent QA — 2026-11-22 19:58 Asia/Kuwait

## Live source and scope
Supabase project `nwakgkxytovprrrwyahs` queried directly; requested GitHub `Mathora-mathematics/Mathora` README unavailable; connected `MathsGrove/Mathora` README accessible. This is a bounded audit, **not** exhaustive certification of the bank.

## Reproducible SQL
```sql
select count(*) total,count(*) filter(where active) active,count(*) filter(where active and review_state='approved') approved,count(*) filter(where active and (nullif(trim(exam_board),'') is null or nullif(trim(syllabus_objective),'') is null)) metadata_gap from private.grove_practice_bank;
select count(*) total,count(*) filter(where human_moderated_by is not null) moderated,count(*) filter(where review_state='approved') approved,max(created_at) newest from private.grove_signature_editorial;
select id,title,total_marks,review_state,created_at,question_paper,mark_scheme from private.grove_signature_editorial order by created_at desc limit 1;
select count(*) from private.grove_task_items;
```

## Results
Practice total 2243; active 2190; approved active 1950; active metadata gaps 240. Assigned task items 52. Signature total 62, moderated 0, approved 0. Newest Signature paper ID `87179b88-8266-4f39-b78e-30c7a5699836`, 12 marks, awaiting human moderation.

## Signature mathematics — independently recomputed
Arithmetic progression a=7,d=3: (1a) u_n=7+3(n-1)=3n+4 [2]; (1b) S_n=n(14+3(n-1))/2=n(3n+11)/2 [2]; (1c) S9=171, S10=205, so least n=10, as all terms positive [2].
Geometric progression a=81,r=2/3: (2a) u5=81(2/3)^4=16 [2]; (2b) S4=81+54+36+24=195 [2]; (2c) S∞=81/(1-2/3)=243; convergence since |r|<1 [2]. Total 12; no error in six checked part keys/marks.

## Practice spot checks
IGCSE rationalisation 5/sqrt(5)=sqrt(5); IB AI log2(64)=6. Both active pilot entries have empty exam_board and syllabus_objective, hence **not** board-certified. Pearson binomial upper tail X~Bin(10,0.2), P(X>=5)=0.0327934976, reject at 5% (verified reasoning). Full official 2026-27 syllabus mapping not certified here.

## Unresolved / release
No new practice publication or quarantine. No Signature release. No student-specific unseen/dedup/adaptation, official copyright, RLS/storage cross-account, timer, browser KaTeX, or Pages CI certification in this run. Keep questionable drafts staged. Human examiner moderation remains mandatory for Signature, not for fully verified original practice.
