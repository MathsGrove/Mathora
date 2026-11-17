# Independent Maths QA — 2026-11-17 15:56 Asia/Kuwait

## Live evidence
Project: Supabase `nwakgkxytovprrrwyahs`; accessible GitHub `MathsGrove/Mathora`. The public schema has 10 seed questions, whereas the live operational bank is `private.grove_practice_bank`. **Do not conflate these banks.**

At inspection: 2,241 private practice rows, 1,947 active approved, 240 active non-approved, 54 inactive. This is one more approved question than the 14:01 audit. 52 Signature editorial manuscripts; zero recorded human moderations.

Newly reviewed question `b7b76607-7e73-430a-8d3d-9a62ad1f7a08` (reviewed 2026-11-17 12:04:12 UTC): 9709 Paper 6, Poisson approximation to Bin(200,0.015). Lambda=np=3. For Y~Po(3), P(Y>=2)=1-P(0)-P(1)=1-(1+3)e^-3=1-4e^-3=0.8008517265. Four options: (1) 1-4e^-3 correct; (2) 1-e^-3=0.9502129316 is P(Y>=1); (3) 4e^-3=0.1991482735 is P(Y<=1); (4) 1-3e^-3=0.8506387956 wrongly omits P(0). Unique key, explanation internally consistent, notation balanced. The approximation is not the exact binomial probability. Official 9709 syllabus section mapping is recorded in the row but an independent official PDF refresh and browser KaTeX render were not completed in this cycle. No approval or publication action taken: question was already active approved.

Latest Signature manuscript `54d65ba8-35f9-4832-9c0d-4a320d7897e2`: independently recomputed: Z=2X-Y has mean 16 and variance 25; P(Z>21)=1-Phi(1)=0.158655; W=X+Y ~N(20,13); sample mean SD 12/sqrt(36)=2 g; P(Xbar>=67|mu=64)=1-Phi(1.5)=0.0668072; 95% interval 67±1.96(2)=[63.08,70.92] g. Per-part allocations 3+3+2+2+3+3=16; paper and scheme reconcile. Awaiting human moderation; no grades/reports issued.

## Risks and scope
`public.mark_schemes` SELECT policy currently checks only that a user is a privileged member of *some* organisation; it does not scope the requested mark scheme to that organisation. Potential cross-organisation key disclosure, not a proven exploit. No untested RLS migration applied.

Publication discovery using `reviewed_at` is incomplete because existing rows may lack this timestamp. Full new-cohort coverage, per-learner assigned/unseen family comparisons, adaptive feedback, tier and mode inheritance, Ready flags, official specification certification, copyright provenance, storage authenticated isolation, mock timer enforcement, GitHub Pages CI and rendered KaTeX remain **uncertified**. A query restricted to `status='scheduled'` yielded zero items and is not evidence of no invalid assigned items; status taxonomy requires inspection.

## Reproducibility
```sql
select count(*),count(*) filter(where active and review_state='approved'),count(*) filter(where active and review_state<>'approved') from private.grove_practice_bank;
select id,prompt,choices,correct_text,explanation,reviewed_at from private.grove_practice_bank where reviewed_at>=now()-interval '4 hours' order by reviewed_at desc;
select count(*),count(*) filter(where human_moderated_at is not null) from private.grove_signature_editorial;
select policyname,qual from pg_policies where schemaname='public' and tablename='mark_schemes';
```

**Release:** no new activation, quarantine, Signature release or security mutation. Confirmed mathematical pass for the identified new approved question; remaining coverage limitations explicitly open. Notify via established evening CEO reporting workflow.
