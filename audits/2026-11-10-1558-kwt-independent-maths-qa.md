# Independent Maths QA — 2026-11-10 15:58 Asia/Kuwait

## Scope and provenance
Read-only live Supabase project `nwakgkxytovprrrwyahs` and GitHub `MathsGrove/Mathora` (the repository used by earlier QA journals). This audit does not infer the earlier reported 2,236-question inventory from the different live schema. GitHub commit search showed latest repository commit before this journal `8846b3e14f9f5eeb57a6957d3299cc0e4c88a03b` (2026-11-10 08:58:59 UTC), an audit-only change. No new question-bank rows: all 10 records have created_at 2026-10-28 11:37:12 UTC. No immutable question edit/publication log was established, so absence of newly created rows is not proof of no content edits.

## Reproducible SQL checks
`select q.id,q.qualification,q.topic,q.prompt,q.marks,q.difficulty,q.created_at,m.scheme from public.question_bank q left join public.mark_schemes m on m.question_id=q.id order by q.created_at desc;`
Result: 10 question records, 10 linked mark schemes, all created 2026-10-28. Sum of maximum marks 32. Table lacks distractors, answer keys, explanations, syllabus component and publication status. Other public tables include attempts, answers, paper_questions, reviews; previously inspected counts were zero, not a demonstration of student-specific eligibility.
`select policyname,cmd,qual,with_check from pg_policies where schemaname='public' and tablename in ('mark_schemes','question_bank','answer_files','answers','reviews','paper_questions');`
Result: mark_schemes SELECT 'schemes_select' requires *some* membership with partner/examiner/admin role, with no matching organisation predicate. **Potential cross-organisation disclosure** if multiple organisations share this table. Not exploit-tested. Question-bank SELECT similarly checks any membership. No policy change without org ownership model and authenticated regression tests.
`select name,public from storage.buckets order by name;`
Result: student-work and grove-student-exports both private. Object-level access and signed URL checks not completed.

## Exhaustive mathematical verification of accessible 10 questions and schemes
1. IGCSE quadratic x²−7x+12=0: (x−3)(x−4)=0, x=3,4. Stored M1+A1+A1 =3 correct.
2. IGCSE 3(2x−1)=4x+9: 6x−3=4x+9, 2x=12, x=6. Stored M1+M1+A1=3 correct.
3. IGCSE right triangle legs 6,8 cm: sqrt(6²+8²)=10 cm. Stored M1+M1+A1=3 correct.
4. GCSE 3/4+5/6: 9/12+10/12=19/12=1 7/12. Stored M1+M1+A1=3 correct.
5. GCSE x+y=10,2x−y=5: add to get 3x=15, x=5,y=5. Stored M1+M1+A1+A1=4 correct.
6. A-level derivative 3x³−5x²+7x−2: 9x²−10x+7. Stored B1+B1+B1=3 correct.
7. A-level indefinite integral 6x²−4x+1: 2x³−2x²+x+C. Stored four B1 marks=4 correct.
8. IB AA vertex x²−6x+5=(x−3)²−4: (3,−4). Stored M1+A1+M1+A1=4 correct.
9. IB AI mean (4+7+8+9+12)/5=40/5=8. Stored M1+A1=2 correct.
10. TMUA x²−7x+12=0 positive roots 3 and 4, sum 7. Stored M1+A1+B1=3 mathematically correct; **TMUA examination is multiple choice, while prompt and scheme require written justification**. Do not claim official TMUA exam-format alignment.

Total 32/32 available marking-scheme points mathematically consistent, **not** a human-issued student score. Questions 1 and 10 reuse the same quadratic polynomial in different qualification contexts, a near-duplicate family; no student exposure established. The stored questions have no answer choices/distractors or full worked solutions to validate. Official 2026–27 board/component mapping not independently checked.

## Remaining checks and release gate
No evidence for a newly published practice-question delta, authenticated student assigned/unseen IDs, adaptation and tier inheritance, Ready state, Signature human moderation or complete part-by-part Signature bank, browser KaTeX, copyright provenance, storage object policy, server timers or latest Pages CI. No release or quarantine write made; unverified content stays staged. No student marks, reports or staff moderation changed. Prior 2,236/23 counts refer to an unlocated schema or system and must not be repeated as confirmed current counts. The possible cross-org mark-scheme access policy and mismatch between repository application content and inspected Supabase schema remain priority follow-ups.
