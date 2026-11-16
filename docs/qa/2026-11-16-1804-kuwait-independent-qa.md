# MathsGrove independent QA — 2026-11-16 18:04 Asia/Kuwait

Scope: LIVE Supabase project `nwakgkxytovprrrwyahs`, accessible GitHub `MathsGrove/Mathora`. Requested `Mathora-mathematics/Mathora` lookup did not resolve via connector. This journal is an independent read-only production audit; no release or grade issuance is implied.

## Fresh inventory and reproducible SQL
```sql
select count(*) total,count(*) filter(where active and review_state='approved') approved_active,count(*) filter(where active and review_state is distinct from 'approved') unapproved_active,count(*) filter(where not active) inactive from private.grove_practice_bank;
-- 2236,1942,240,54
select count(*) total,count(*) filter(where human_moderated_at is not null) moderated,count(*) filter(where created_at>=now()-interval '2 hours') new_two_hours from private.grove_signature_editorial;
-- 49,0,1
select status,count(*) from private.grove_tasks group by status;
-- scheduled 40, expired 5, completed 4
select count(*) from private.grove_task_items i left join private.grove_practice_bank b on i.bank_id=b.id where i.bank_id is not null and (b.id is null or not b.active or b.review_state is distinct from 'approved');
-- 4
select count(*) groups,coalesce(sum(n-1),0) extra from (select regexp_replace(lower(trim(prompt)),'\\s+',' ','g') stem,count(*) n from private.grove_practice_bank where active and review_state='approved' group by 1 having count(*)>1) d;
-- 516,1143
```

## New Signature: BALLOON Arrangements and Weighted Discrete Outcomes
ID `2a5aee94-79b6-4a5b-940a-da85ee0b16dc`; created 2026-11-16 14:35:17 UTC, awaiting_human_moderation, paper 9709/5, claimed syllabus 2026–2027, total 16.
Independent exact computations:
- Q1(a) seven tiles B,A,L,L,O,O,N: 7!/(2!2!)=1260; 3 marks, all three scheme steps agree.
- Q1(b) LL block: 6!/2!=360; 3 marks, all scheme steps agree.
- Q1(c) OO-adjacent total 6!/2!=360, OO-and-LL adjacent 5!=120, conditional probability 120/360=1/3; 2 marks, both steps agree.
- Q2(a) 10k=1 => k=1/10; 2 marks, both steps agree.
- Q2(b) E(X)=(2+6+12)/10=2; E(X²)=(2+12+36)/10=5; Var(X)=5-4=1; 4 marks, all four steps agree.
- Q2(c) P(X>=2 | X>=1)=(7/10)/(9/10)=7/9; 2 marks, both steps agree.
Part totals 3+3+2+2+4+2=16; paper sections 8+8=16. Mathematical answers, assumptions and scheme marks PASS. Official syllabus section codes are *not independently cross-checked against a current official document in this run*; browser LaTeX/KaTeX rendering not certified. Human moderation absent: **do not issue Signature grade/report**.

## Findings and release decision
- 240 active unapproved pilots missing board/objective metadata; 12 explanations shorter than 20 chars. Not certified for release.
- 516 duplicate approved stem groups (1,143 extra copies). This is bank duplication, not proof of individual learner repetition.
- 4 historically ineligible assignment bank references; no student-specific Ready/unseen/adaptation certification.
- `public.mark_schemes` SELECT policy `schemes_select` checks partner/examiner/admin membership without org scoping; potential cross-org access. No authenticated exploit proven. Requires tested RLS remediation.
- Private practice bank lacks created_at/updated_at, so a complete new practice cohort cannot be identified; no new practice mathematically certified or published in this run.
- Not certified: copyright provenance, storage isolation, mock server timers, Pages CI, and every live question's distractors/KaTeX.
- No practice quarantine, publication, or security mutation performed. All questionable/unapproved content remains staged. Verified originals are preauthorised for publication without owner approval; Signature requires actual human moderation.
- Include findings in the established evening owner report.
