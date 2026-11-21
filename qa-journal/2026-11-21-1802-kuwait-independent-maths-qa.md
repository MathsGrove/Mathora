# Independent Maths QA — 2026-11-21 18:02 Asia/Kuwait

Source: live Supabase project `nwakgkxytovprrrwyahs`, public.question_bank joined to public.mark_schemes, pg_policies, allocation/attempt counts. GitHub repository discovered as `MathsGrove/Mathora`; the requested `Mathora-mathematics/Mathora` owner is not the connected repository.

## Reproducible queries
```sql
select q.id,q.qualification,q.topic,q.prompt,q.marks,q.difficulty,q.active,q.created_at,m.scheme from public.question_bank q left join public.mark_schemes m on m.question_id=q.id order by q.created_at;
select tablename,policyname,cmd,qual from pg_policies where schemaname='public' and tablename in ('question_bank','mark_schemes','attempts','paper_questions') order by tablename,policyname;
select (select count(*) from public.paper_questions) allocations,(select count(*) from public.attempts) attempts,(select count(*) from public.answers) answers,(select count(*) from public.reviews) reviews,(select count(*) from storage.objects where bucket_id='student-work') student_work_objects;
```

## Independent arithmetic and mark checks
- IGCSE quadratic `0cbb3e11`: x²−7x+12=(x−3)(x−4); roots 3,4; 3/3 points consistent.
- IGCSE linear `304efb65`: 6x−3=4x+9 ⇒ 2x=12 ⇒ x=6; 3/3.
- IGCSE Pythagoras `cbcc8ab9`: sqrt(6²+8²)=sqrt(100)=10 cm; 3/3.
- GCSE fractions `58f1e962`: 3/4+5/6=9/12+10/12=19/12=1 7/12; 3/3.
- GCSE simultaneous `eefa886e`: (x+y)+(2x−y)=15 ⇒ x=5,y=5; 4/4.
- A level differentiation `3b23181d`: d/dx(3x³−5x²+7x−2)=9x²−10x+7; 3/3.
- A level integration `6c76fb80`: ∫(6x²−4x+1)dx=2x³−2x²+x+C; derivative cross-check returns integrand; 4/4.
- IB AA vertex `98fff8a2`: x²−6x+5=(x−3)²−4; (3,−4); 4/4.
- IB AI mean `06fd867b`: (4+7+8+9+12)/5=40/5=8; 2/2.
- TMUA inactive `4955338b`: roots 3,4 sum 7; 3/3 arithmetic but inappropriate written-response TMUA format and same quadratic as active IGCSE; keep quarantined.

Total 32 marks, 29 active. All 10 question records dated 2026-10-28, zero new records. No distractor options exist in retrieved prompts, so distractor/key validation NOT APPLICABLE to these written-response records, not a pass for future MCQs. No full worked explanation, source provenance, board/component/version metadata or rendered KaTeX proof; official specification certification NOT PASSED. Question text uses Unicode math rather than demonstrated LaTeX.

## Assignment, security, and Signature
Zero paper_questions, attempts, answers and reviews: cannot certify actual unseen assignment, adaptation, Ready state or human examiner moderation. Student-work bucket has 31 objects; provenance and per-object authorization not established. RLS SELECT policy `schemes_select` checks any eligible staff membership without org correlation; `questions_select` checks any membership and active=true without org correlation. Potential cross-org access; authenticated adversarial tests still required. No student photos accessed. No Signature grades issued. Mock timers, deployed Pages CI, copyright checks and Signature editorial workflow not independently certified in this run.

## Release
No new cohort to certify or publish. Existing TMUA quarantine retained. No database changes or automated Signature release. Automatic original practice publication is preauthorised only after substantive complete verification, not owner approval. Outstanding security and certification gaps to evening owner report.
