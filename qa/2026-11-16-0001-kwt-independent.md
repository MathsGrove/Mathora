# Independent QA — 2026-11-16 00:01 Kuwait

Project: Supabase nwakgkxytovprrrwyahs; repository MathsGrove/Mathora (the requested former owner path did not resolve through the connector).

## Live checks
- Private practice bank: 2,236 total, 1,942 approved active, 240 active unapproved, 54 inactive (by subtraction).
- Signature editorial: 45 records, 0 human-moderated; latest ID 85a5ac0c-8476-40be-b56c-175e0327f75b, created 2026-11-15 20:00:12 UTC, awaiting_human_moderation.
- Ineligible historical task items: 4.
- Public mark_schemes SELECT policy: EXISTS privileged membership (partner/examiner/admin) without org_id predicate. Potential cross-organisation answer-key disclosure; authenticated exploit not established. No untested RLS fix applied.

## Latest Signature independently recalculated
Title: Exhibition Mat and Counter Selection — Original Diagnostic; 16 marks, two 8-mark questions.
- Q1a x(x+5)=84 => x²+5x−84=0 (2/2).
- Q1b (x+12)(x−7)=0 => x=7 or -12; physical width x=7 m, length 12 m (4/4).
- Q1c perimeter 2(7+12)=38 m (2/2).
- Q2a P(BB)=(4/12)(3/11)=1/11 (2/2).
- Q2b P(RG or GR)=(3/12)(5/11)+(5/12)(3/11)=5/22 (3/3).
- Q2c Conditional sample has 9 nonred counters: P(GG | neither red)=(5/9)(4/8)=5/18 (3/3).
- Part mark totals 2+4+2+2+3+3=16; all calculations and recorded mark allocations agree. The published syllabus_ref 'E2 algebraic equations; E4 probability' is **not yet verified against exact 0580 syllabus objective codes**, nor is the paper-specific mapping; do not certify official component alignment or release.
- No authorised human moderation and no student/parent Signature grade/report issued.

## Limitations and disposition
- No practice activation or quarantine. Practice bank lacks created_at/updated_at, so exhaustive identification of new publication cohorts is impossible; no claims of full distractor, KaTeX, copyright or official board verification.
- Student-specific unseen stem families, adaptation, tier inheritance and Ready status, photo/whiteboard storage isolation, server mock timers, GitHub Pages deployment and authenticated RLS tests not certified this run.
- Prior duplicate-bank findings require student-specific follow-through. Retain unapproved pilots staged and keep Signature staff-only.

## Reproducible SQL
```sql
select (select count(*) from private.grove_practice_bank) bank_total,(select count(*) from private.grove_practice_bank where active and review_state='approved') approved,(select count(*) from private.grove_practice_bank where active and review_state is distinct from 'approved') pilots,(select count(*) from private.grove_signature_editorial) signature_total,(select count(*) from private.grove_signature_editorial where human_moderated_at is not null) moderated,(select count(*) from private.grove_task_items i left join private.grove_practice_bank b on b.id=i.bank_id where b.id is null or not b.active or b.review_state is distinct from 'approved') ineligible_items;
select id,title,created_at,review_state,total_marks,question_paper,mark_scheme,syllabus_ref,paper_code from private.grove_signature_editorial order by created_at desc limit 2;
select policyname,qual from pg_policies where schemaname='public' and tablename='mark_schemes' and cmd='SELECT';
```

Owner evening report should prioritise org-scoped RLS and duplicate-family enforcement; no owner approval gate for mathematically and specification-verified original practice.
