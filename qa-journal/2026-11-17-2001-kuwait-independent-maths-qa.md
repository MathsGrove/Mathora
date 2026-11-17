# Independent Maths QA — 2026-11-17 20:01 Asia/Kuwait

## Live evidence
Supabase project `nwakgkxytovprrrwyahs`, private schema. Counts: practice 2243; approved active 1948; active not approved 240; inactive 55. Prior recorded 17:56 inventory: 2242/1948/240/54; net +1 inactive draft. No reliable creation/updated timestamp on practice bank; this is **not proof** that the newly added row was the differential-equation draft or that all new questions were found. Latest reviewed_at 2026-11-17 14:03:45 UTC; within 3 hours of run, one previously reviewed continuous density item. Signature editorial 52, human moderated 0, latest created 2026-11-17 00:01:11 UTC. Tasks 40 scheduled, 5 expired, 4 completed; 0 scheduled items pointing to missing/inactive/unapproved bank entries.

## Independent mathematics recheck
Previously reviewed density: f(x)=k x(3-x), 0<=x<=3. Integral [3x²/2-x³/3]_0^3=9/2, k=2/9. Integral_2^3 x(3-x) dx = [3x²/2-x³/3]_2^3 = 7/6, hence P(X>2)=7/27. Other options 2/9,20/27,1/3 are distinct and wrong; 20/27 is complementary probability. Text explanation agrees. This does **not** certify browser KaTeX rendering or an independent official syllabus fetch.

Newest Signature paper: independent normal X~N(12,4), Y~N(8,9): E(2X-Y)=16, Var(2X-Y)=25; P(2X-Y>21)=1-Phi(1)=0.158655... -> 0.1587; X+Y~N(20,13). For n=36, sigma=12, SE=2g; P(Xbar>=67 | mu=64)=1-Phi(1.5)=0.066807... -> 0.06681; CI=67±1.96(2)=[63.08,70.92]g. Mark allocations 3+3+2+2+3+3=16; scheme internally consistent. Human moderation absent, no grades released.

## Risk and release
RLS `public.mark_schemes` SELECT `schemes_select` grants any member with role partner/examiner/admin access without organisation-specific row condition; potential cross-tenant disclosure, not an authenticated exploit demonstration. Avoid untested policy changes. Full student-specific unseen/semantic-family/adaptation/Ready checks, storage auth isolation, official syllabus and copyright provenance, rendered KaTeX, GitHub Pages CI, timers, and editorial permissions not certified in this run. No questions published/quarantined; no speculative mutation. Original practice can publish automatically only after comprehensive verification, not owner approval. Inadequate evidence stays staged.

## Reproducible SQL
```sql
select count(*) total,count(*) filter(where active and review_state='approved') approved,count(*) filter(where active and review_state<>'approved') pilots,count(*) filter(where not active) inactive,max(reviewed_at) latest_review from private.grove_practice_bank;
select id,prompt,choices,correct_text,explanation from private.grove_practice_bank where reviewed_at >= now()-interval '3 hours';
select count(*) total,count(*) filter(where human_moderated_at is not null) moderated,max(created_at) newest from private.grove_signature_editorial;
select count(*) invalid from private.grove_task_items i join private.grove_tasks t on t.id=i.task_id left join private.grove_practice_bank b on b.id=i.bank_id where t.status='scheduled' and (b.id is null or not b.active or b.review_state<>'approved');
select policyname,qual from pg_policies where schemaname='public' and tablename='mark_schemes';
```
