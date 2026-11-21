# Independent MathsGrove QA — 2026-11-21 04:00 Asia/Kuwait

## Evidence and scope
Live project `nwakgkxytovprrrwyahs`; connected GitHub `MathsGrove/Mathora`. Requested former path `Mathora-mathematics/Mathora` README fetch failed. Read-only database and repository checks; no live data changed. Previous audit baseline: 10 stored / 9 active / 1 quarantined.

## Reproducible database checks
```sql
select id, qualification, topic, prompt, marks, difficulty, active, created_at from public.question_bank order by created_at desc;
select q.id,q.prompt,q.marks,m.scheme from public.question_bank q left join public.mark_schemes m on m.question_id=q.id order by q.id;
select (select count(*) from question_bank) total,(select count(*) from question_bank where active) active,(select count(*) from attempts) attempts,(select count(*) from paper_questions) allocations,(select count(*) from student_entitlements) entitlements,(select count(*) from storage.objects where bucket_id='student-work') student_work_objects;
select schemaname,tablename,policyname,cmd,qual from pg_policies where schemaname='public' and tablename in ('question_bank','mark_schemes');
```

## Actual findings
10 total, 9 active, 1 inactive; all created 2026-10-28 11:37:12 UTC; zero new cohort. 0 attempts, 0 allocations, 1 entitlement, 31 student-work storage objects. No student work opened.

Independent exact mathematical recomputation, each compared with scheme:
- IB AI mean: (4+7+8+9+12)/5=8 (2 marks).
- IGCSE quadratic: (x-3)(x-4)=0; roots 3,4 (3).
- IGCSE linear: 6x-3=4x+9 -> 2x=12 -> x=6 (3).
- A Level derivative: 9x²-10x+7 (3).
- TMUA inactive: roots 3,4; sum 7 (3); unsuitable written-response format and near-duplicate of IGCSE quadratic; retain quarantine.
- GCSE fractions: 3/4+5/6=9/12+10/12=19/12=1 7/12 (3).
- A Level integral: 2x³-2x²+x+C (4).
- IB AA vertex: (x-3)²-4; (3,-4) (4).
- IGCSE hypotenuse: sqrt(6²+8²)=10 cm (3).
- GCSE simultaneous: 3x=15 -> x=5, y=5 (4).
All final results and scheme mark totals reconcile to 32 (29 active). This does NOT certify every possible student working or every board-specific marking convention.

## Security and operational caveats
Live `mark_schemes` SELECT policy checks membership role partner/examiner/admin without an explicit matching org. Live `question_bank` SELECT checks active + any membership without org match. Potential cross-org leakage; not exploit-proven. Both need authenticated two-org tests. Student-work has 31 objects despite no attempts; provenance, lifecycle, and object-level isolation not verified. The README explicitly says do not upload real student data until security/privacy checks.

The Pages workflow file exists and includes multiple content, role, marking, and security static tests, but its successful latest execution and actual deployed behavior were not established. README says server mock hard stops and full moderation are not yet certified. No actual student assignments exist to prove unseen IDs, adaptation, Ready or mode/tier inheritance. No live Signature moderation/grade release certified.

Question bank lacks explicit board/component identifiers, distractor arrays, complete explanations and provenance; official 2026–27 mapping, copyright provenance and actual KaTeX rendering remain unverified. The 300+ repository practice candidates are NOT evidence of production publication.

## Release decision
No new cohort; no publish or quarantine changes. Previously inactive TMUA item remains inactive. No Signature marks, reports, or grades released. Original practice may publish without owner approval only after all mathematical, official specification, explanation and duplication checks pass. Uncertain content stays staged. Include unresolved RLS and student-work retention concerns in established evening report.
