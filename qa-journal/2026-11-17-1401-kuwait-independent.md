# Independent QA — 2026-11-17 14:01 Asia/Kuwait

Project: Supabase `nwakgkxytovprrrwyahs`; repository: `MathsGrove/Mathora` (accessible owner; requested historical alias `Mathora-mathematics/Mathora`).

## Live observations
- Private practice bank: **2240**; approved and active **1946**; active not approved **240**; inactive **54**. Earlier run reported 2238/1944: **net +2** approved active, but missing creation timestamps mean the identities of the additions cannot be proven from the delta.
- `reviewed_at >= now()-interval '3 hours'`: **zero rows**. This is not evidence of zero publications.
- Signature editorial **52**; human moderated **0**; created in last 3 hours **0**.
- Tasks **49**: scheduled 40, completed 4, expired 5. Scheduled task items referencing absent/inactive/unapproved bank rows **0**. Repeated exact normalized assigned stems per learner in scheduled tasks **0**; semantic family repeats and actual unseen availability not certified.
- Active explanations under 20 characters **12**. Active unapproved with null board/objective **0** (does not certify accuracy of metadata).
- Storage buckets `student-work` and `grove-student-exports` private, size and MIME constrained; cross-account authenticated isolation not tested.
- `public.mark_schemes` SELECT policy `schemes_select` checks membership role partner/examiner/admin but **not the organisation of the mark-scheme row**. Potential cross-organisation disclosure remains; no exploit proven.

## Independently recomputed sample (NOT a complete new-cohort certification)
1. `ff6aa41b-ec35-4f73-a5fc-495ffba14374`: X~Bin(10,0.2), upper-tail P(X>=5)=sum_{k=5}^{10} C(10,k)0.2^k 0.8^(10-k)=0.0327934976, four decimals 0.0328 < 0.05, reject H0. All four choices contain one matching value-and-decision pair. Explanation consistent. The claim that P(X>=6)=0.0063693824 is consistent with subtracting P(X=5). Board syllabus mapping not independently checked against current official document.
2. `fb15e041-70df-40df-b53f-c1a81506e12a`: substitute x=2+t,y=-1+2t,z=3t into 2x-y+z=7 -> 5+3t=7 -> t=2/3; point (8/3,1/3,2); plane check 16/3-1/3+2=7. Other three choices differ. Explanation correct. Official 9231 objective and browser rendering not independently certified.

## Reproducible SQL
```sql
SELECT count(*) total, count(*) FILTER (WHERE active AND review_state='approved') approved_active,
 count(*) FILTER (WHERE active AND review_state <> 'approved') active_other,
 count(*) FILTER (WHERE NOT active) inactive
FROM private.grove_practice_bank;
SELECT id FROM private.grove_practice_bank WHERE reviewed_at >= now()-interval '3 hours';
SELECT count(*) FROM private.grove_signature_editorial WHERE human_moderated_at IS NOT NULL;
SELECT policyname,qual FROM pg_policies WHERE schemaname='public' AND tablename='mark_schemes';
SELECT count(*) FROM private.grove_task_items i JOIN private.grove_tasks t ON t.id=i.task_id
LEFT JOIN private.grove_practice_bank b ON b.id=i.bank_id
WHERE t.status='scheduled' AND (b.id IS NULL OR NOT b.active OR b.review_state<>'approved');
```

## Release / limits
No new activation or quarantine: cannot prove full cohort identification or all syllabus, KaTeX, copyright, adaptation and distractor gates. No Signature student/parent reports. No RLS change without regression test. Outstanding: robust immutable publication log, per-student unseen supply and near-duplicate families, Ready/tier/mode, official current component specifications, authenticated storage and RLS regression, mock server timer, GitHub Pages CI, copyright provenance, Signature editorial mark-by-mark moderation.
