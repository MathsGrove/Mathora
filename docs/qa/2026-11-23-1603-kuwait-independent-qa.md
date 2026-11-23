# Independent Maths QA — 2026-11-23 16:03 Asia/Kuwait

## Live source reconciliation (critical correction)
Queried Supabase project `nwakgkxytovprrrwyahs`, including **private** schema. Earlier 14:00 QA's reported 10-question discrepancy was a **schema-selection error**, not a proven data loss: `public.question_bank` has 10 legacy pilot records; the authoritative practice catalogue is `private.grove_practice_bank` with **2,244** records. The authoritative Signature catalogue is `private.grove_signature_editorial` with **65** records. This corrects the previous incident and must be reflected in the evening owner report.

### Reproducible inventory SQL
```sql
select count(*) total, count(*) filter(where active) active, count(*) filter(where review_state='approved') approved,
 count(*) filter(where active and (nullif(trim(exam_board),'') is null or nullif(trim(syllabus_objective),'') is null)) metadata_gaps,
 count(*) filter(where active and length(trim(explanation))<30) short_explanations
from private.grove_practice_bank;
select count(*) total, count(*) filter(where human_moderated_by is not null) moderated from private.grove_signature_editorial;
select count(*) items, count(*) filter(where i.difficulty is distinct from b.difficulty) difficulty_mismatches,
 count(*) filter(where b.id is null) missing_source, count(*) filter(where b.active=false) inactive_source,
 count(*) filter(where i.prompt is distinct from b.prompt) prompt_mismatches
from private.grove_task_items i left join private.grove_practice_bank b on i.bank_id=b.id;
```
Observed: 2244 total, 2192 active, 1952 approved, 240 active metadata gaps, 56 short explanations; 65 Signature, 0 moderated; 52 assigned, 3 difficulty mismatches, 0 missing/inactive sources and 0 prompt mismatches.

## New Signature assessment: independent recomputation
Record `7b5700a0-3de3-490c-b871-aeec8d4480f9`, created 2026-11-23 11:56:43 UTC; title *Exponential Substitution and Logarithmic Stationary Point — Original Advanced Mini-Paper*; Cambridge 9709/3; 13 marks; awaiting human moderation.

- 1(a), 2 marks: u=3^x>0 yields u²−10u+9=0. Correct.
- 1(b), 3 marks: (u−1)(u−9)=0, hence x=0,2. Correct.
- 1(c), 1 mark: both roots positive and 3^x is one-to-one onto positive reals; no further real solutions. Correct.
- 2(a), 2 marks: y'=2x ln x+x=x(2 ln x+1), x>0. Correct.
- 2(b), 3 marks: stationary x=e^(−1/2), y=−1/(2e). Correct.
- 2(c), 2 marks: y''=2 ln x+3; at x=e^(−1/2), y''=2>0, local minimum. Correct.
- 6+7=13 marks, every part and mark-scheme allocation reconciles. Official 2026–27 syllabus document and browser KaTeX not independently tested in this run. Do not treat this as human moderation or release a grade.

## Security and certification
Supabase security advisors report 24 RLS-enabled/no-policy informational findings (private tables may intentionally be service-only), 51 authenticated-executable SECURITY DEFINER function warnings (requires per-function authorization review), and 1 leaked-password-protection warning. No proof of cross-tenant access; do not assert isolation passed. Remediation: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable and https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Outstanding: verify all new practice since prior authoritative timestamp by ID; independently test official board/component syllabus and KaTeX, full student-specific unseen/adaptation and Ready, near-duplicate families, cross-tenant RLS, storage, server timer, copyright and Pages CI. Three assignment difficulty mismatches remain unclassified; do not silently overwrite adaptive assignments.

No practice publication, quarantine or grade release performed in this QA run; no candidate received comprehensive certification. Automatic publication of independently verified original practice remains preauthorised without owner approval.
