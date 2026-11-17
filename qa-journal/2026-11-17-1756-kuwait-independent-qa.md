# MathsGrove independent QA — 2026-11-17 17:56 Asia/Kuwait

## Live evidence
Project: Supabase nwakgkxytovprrrwyahs; private schema verified.
Read-only inventory: 2,242 practice rows; 1,948 approved+active; 240 active unapproved; 54 inactive. 52 Signature editorial papers, 0 human-moderated. 40 scheduled tasks, 0 ineligible scheduled bank references.
Newly reviewed practice in preceding three hours: 2 rows (reviewed_at 2026-11-17 14:03:45Z and 12:04:12Z). The second was previously audited, but reviewed_at is not a reliable creation/publish timestamp. No exhaustive new-publication claim is possible.

## Independently recomputed new mathematical item
ID 225d877f-0775-4e3c-8156-24766233f791; Cambridge 9709 P6; f(x)=k*x*(3-x), 0<=x<=3.
Integral_0^3 (3x-x²)dx = [3x²/2-x³/3]_0^3=9/2; k=2/9.
Integral_2^3 (3x-x²)dx = [3x²/2-x³/3]_2^3 = 9/2 - 10/3 = 7/6.
P(X>2)=(2/9)(7/6)=7/27. P(X<=2)=20/27.
Options 7/27 (unique correct), 2/9 (k, not probability), 20/27 (complement), 1/3 (uniform shortcut) are distinct and all plausible distractors. Density nonnegative on [0,3], normalized; dimensionless probability; exact fraction. Explanation algebra correct. Official 2026–27 syllabus link is stored in syllabus_objective but was not independently opened in this run. Browser KaTeX rendering untested (plain text item).

## Previously reviewed item checked for cohort
ID b7b76607-7e73-430a-8d3d-9a62ad1f7a08: n=200,p=.015, lambda=3, Poisson P(Y>=2)=1-(1+3)e^-3=0.8008517265; other options represent >=1, <=1, and erroneous omission. Its string contains doubled backslashes in SQL representation; actual rendered KaTeX not checked.

## Unresolved risks and release gate
mark_schemes SELECT policy depends on privileged membership but does not correlate organisation with the protected row. Cross-organisation exploitation untested; requires scoped, tested RLS fix.
Private bank has no created_at or updated_at; reviewed_at alone cannot enumerate all new publications. Per-student unseen/semantic duplicate, adaptation, tier inheritance, Ready status, official board/version verification, copyright provenance, storage access isolation, mock server timers, CI and Signature per-part validation not certified in this run.
No draft activation, quarantine, security migration or Signature grade/report issued. Preauthorised original practice publication remains permitted only after complete verification; no owner approval gate.
Reproduction SQL: SELECT count(*),count(*) FILTER (WHERE active AND review_state='approved') FROM private.grove_practice_bank; SELECT id,prompt,choices,correct_text,explanation FROM private.grove_practice_bank WHERE reviewed_at>=now()-interval '3 hours'; SELECT count(*) FROM private.grove_signature_editorial WHERE human_moderated_at IS NOT NULL;
