# Independent Maths QA — 2026-11-17 06:04 Asia/Kuwait

## Evidence and scope
Live project `nwakgkxytovprrrwyahs` queried through Supabase SQL; accessible repository `MathsGrove/Mathora` checked via GitHub commits. Requested `Mathora-mathematics/Mathora` was not listed as accessible; no assumption of separate repository identity. Previous QA commit: a563004ca5345a573deda8c1073a5c1f668acb99. Latest content publication log commit: 2151438390175c075411bf340a7c0f4141b4e9d6 (2026-11-17 01:58:44 UTC).

## New approved practice — verified
Question ID `22c91bb1-cca3-42c8-8414-e5192d6e1451`, reviewed 2026-11-17 01:58:31 UTC, Cambridge IGCSE 0580, Extended Paper 2 (non-calculator), 2025–2027 E2.13 inverse/composite functions.
Given f(x)=(3x−7)/2 and g(x)=x+4, f^{-1}(g(5))=(2·9+7)/3=25/3. Independent substitution f(25/3)=9=g(5). Distinct options 25/3 (correct), 11/3 (f(11/3)=2), 9 (f(9)=10), 29/3 (f(29/3)=11); exactly one satisfies the defining inverse relation. All real domain conditions valid (f linear nonzero slope, inverse defined globally). No units. Explanation is mathematically complete and distractor causes credible. Plain-text syntax `f^(-1)` is unambiguous but live KaTeX browser rendering not tested. Exact normalised stem occurrence count=1; currently assigned references=0. Official syllabus: https://www.cambridgeinternational.org/Images/662466-2025-2027-syllabus.pdf (E2.13 page 42; Paper 2 non-calculator). Originality provenance declared in bank but independent external copyright similarity not exhaustive. **PASS mathematics, key, choices, syllabus and simple stem uniqueness; PARTIAL presentation/copyright and adaptation.** No reason to unpublish this verified item.

## Signature
Latest manuscript `54d65ba8-35f9-4832-9c0d-4a320d7897e2` unchanged since previous QA, 16 marks; awaiting_human_moderation; human_moderated_at null. Previous independent recomputation documented in earlier QA journal; no new moderation or student report authorised. Do not release Signature grades without real human moderation.

## Inventory / assignment checks
SQL count: 2,237 practice questions; 1,943 active approved, 240 active unapproved, 54 inactive; exactly one newly reviewed item since 2026-11-17 01:04 UTC. Tasks: 40 scheduled, 5 expired, 4 completed. Four historical task items reference missing/inactive/unapproved questions (not established as current scheduled exposure). Student-specific unseen/near-duplicate family, tier inheritance, baseline/feedback adaptation and Ready status not independently proven. Publication timestamps absent in private.grove_practice_bank; reviewed_at is not equivalent to created_at or activated_at, so cohort completeness cannot be certified.

## Security / release constraints
Live public.mark_schemes SELECT RLS policy `schemes_select` allows any membership with partner/examiner/admin role without row-specific organisation scope; potential cross-org answer key disclosure, unproven without two-org authenticated test. No speculative migration applied. Private storage and authenticated access, GitHub Pages CI, server timer enforcement, complete copyright similarity and KaTeX UI remain untested this cycle. No questionable draft published; no Signature report released. No safe narrow code/database correction identified.

## Reproduction SQL
```sql
select count(*) total,count(*) filter(where active and review_state='approved') approved,count(*) filter(where active and review_state<>'approved') pilots,count(*) filter(where not active) inactive,count(*) filter(where reviewed_at >= '2026-11-17 01:04:00+00') recent_reviewed from private.grove_practice_bank;
select id,prompt,choices,correct_text,explanation,reviewed_at from private.grove_practice_bank where reviewed_at >= '2026-11-17 01:04:00+00';
select status,count(*) from private.grove_tasks group by status;
select count(*) from private.grove_task_items i left join private.grove_practice_bank b on b.id=i.bank_id where b.id is null or not b.active or b.review_state <> 'approved';
select policyname,qual from pg_policies where schemaname='public' and tablename='mark_schemes';
```
Follow-up: establish immutable publication timestamps/event journal, org-scoped RLS test and repair, assignment-aware readiness checks and authenticated storage/CI/browser tests. Escalate through established evening owner report; no approval gate for mathematically verified original practice.
