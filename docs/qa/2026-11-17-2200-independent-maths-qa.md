# MathsGrove independent QA — 2026-11-17 22:00 Asia/Kuwait

## Scope and evidence
Live Supabase project `nwakgkxytovprrrwyahs` inspected via read-only SQL; GitHub repository `MathsGrove/Mathora` recent commits inspected (latest prior commit `edcc708e53c51ef24c0f366d86a42452c3ec1cf3`). Requested `Mathora-mathematics/Mathora` lookup failed at connector; accessible repo is MathsGrove/Mathora. This is a bounded audit, not exhaustive certification.

## Inventory
`private.grove_practice_bank`: 2243 total; 1948 active approved; 240 active other; 55 inactive. No reviewed_at >= 2026-11-17 17:00 UTC (20:00 Kuwait); lack of created_at/updated_at means no exhaustive new-publication discovery. `private.grove_signature_editorial`: 52 total, 0 human_moderated_at. Most recent created 2026-11-17 00:01 UTC. `private.grove_tasks`: 40 scheduled, 5 expired, 4 completed. Scheduled items with missing/inactive/unapproved bank refs: 0.

## Reproducible mathematics spot checks
Latest reviewed active question `225d877f-0775-4e3c-8156-24766233f791`: density k x(3-x), 0<=x<=3. Integral = 9/2 so k=2/9. Integral from 2 to 3 = 7/6 so P(X>2)=7/27. Complement 20/27. All options 7/27, 2/9, 20/27, 1/3 are distinct; keyed 7/27. Previously reviewed Poisson `b7b76607-7e73-430a-8d3d-9a62ad1f7a08`: lambda=200*.015=3; P(Y>=2)=1-4exp(-3)=0.8008517265. Its four options represent distinct expressions. Caveat: stored strings contain doubled backslashes before math delimiters; browser rendering not tested and must not be certified.

Latest Signature `54d65ba8-35f9-4832-9c0d-4a320d7897e2`: independently recomputed six part results and allocated marks: Z=2X-Y mean 16 variance 25 (3), P(Z>21)=1-Phi(1)=0.158655... (3), W=X+Y~N(20,13) (2); sample mean SD=12/sqrt(36)=2 g (2), P(Xbar>=67 | mu=64)=1-Phi(1.5)=0.066807... (3), 95% known-sigma interval 67±1.96*2=[63.08,70.92] g (3). Total 16/16; mark scheme agrees. Still awaiting authorised human moderation; no grade/report release.

## Security finding
`pg_policies` `public.mark_schemes` SELECT `schemes_select` condition checks any membership of current auth.uid() with role partner/examiner/admin, without row-specific organisation condition. Potential cross-organisation key exposure; no authenticated exploit test performed. Requires tested RLS fix, not speculative migration.

## Remaining blockers
No full student-by-student unseen/adaptation/tier/Ready certification, semantic near-duplicate audit, official 2026–27 syllabus recertification, copyright provenance review, authenticated storage isolation, browser KaTeX, server mock timers or GitHub Pages CI verification this cycle. No new activation/quarantine; no Signature reports. All unverified material remains staged; fully mathematically and syllabus-verified original practice can publish without owner approval. Evening owner report should include the ongoing RLS risk and lack of reliable practice timestamps.

## SQL reproduction
```sql
select count(*) total,count(*) filter(where active and review_state='approved') approved,count(*) filter(where active and review_state is distinct from 'approved') active_other,count(*) filter(where not active) inactive from private.grove_practice_bank;
select count(*) from private.grove_practice_bank where reviewed_at >= '2026-11-17 17:00:00+00';
select count(*) total,count(*) filter(where human_moderated_at is not null) moderated,max(created_at) latest from private.grove_signature_editorial;
select status,count(*) from private.grove_tasks group by status;
select count(*) bad from private.grove_task_items i join private.grove_tasks t on t.id=i.task_id left join private.grove_practice_bank b on b.id=i.bank_id where t.status='scheduled' and (b.id is null or not b.active or b.review_state<>'approved');
select policyname,qual from pg_policies where schemaname='public' and tablename='mark_schemes';
```
