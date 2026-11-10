# Independent Maths QA — 2026-11-10 17:56 Asia/Kuwait

## Scope and evidence
LIVE Supabase project `nwakgkxytovprrrwyahs` inspected using information_schema, public question/mark-scheme join, pg_policies and assignment table counts. GitHub recent-commit search for `Mathora-mathematics/Mathora` failed (connector KeyError); no publication delta or CI status certified.

## Inventory
19 public tables; public.question_bank = 10 active questions, public.mark_schemes = 10 schemes, attempts = 0, answers = 0, paper_questions = 0. All ten questions created 2026-10-28 11:37:12 UTC. This schema does not substantiate prior reports of 2,236 practice questions. No newly created questions identified here; cannot rule out edits or another database.

## Independent mathematical recomputation (all 10 records)
- 0cbb3e11: x²−7x+12=(x−3)(x−4), roots 3,4; 3/3 scheme points coherent.
- 304efb65: 6x−3=4x+9, 2x=12, x=6; 3/3.
- cbcc8ab9: sqrt(6²+8²)=10 cm; 3/3.
- 58f1e962: 3/4+5/6=9/12+10/12=19/12=1 7/12; 3/3.
- eefa886e: x+y=10, 2x−y=5 => 3x=15 => x=y=5; 4/4.
- 3b23181d: derivative 9x²−10x+7; 3/3.
- 6c76fb80: integral 2x³−2x²+x+C; 4/4.
- 98fff8a2: x²−6x+5=(x−3)²−4, vertex (3,−4); 4/4.
- 06fd867b: sum=40, n=5, mean=8; 2/2.
- 4955338b: roots 3 and 4, sum=7; 3/3.
Total: 32/32 *scheme allocations mathematically coherent*, NOT student-earned marks. TMUA question 4955338b is free response requiring justification, not official TMUA MCQ format; exam-style alignment FAIL / requires reclassification or conversion before advertised TMUA use. IGCSE and TMUA questions share polynomial x²−7x+12, a near-duplicate family.

## Security
public.mark_schemes SELECT policy: EXISTS membership of auth.uid() with role partner/examiner/admin, without organisation or question ownership correlation. Potential cross-organisation exposure; not an exploited breach. public.question_bank SELECT similarly checks any membership and active. Both tables RLS enabled. Do not change policies without ownership model and regression tests.

## Uncertified
No answer-key/distractor/full explanation/syllabus-component fields in this schema. Official 2026–27 board mapping, copyright provenance, KaTeX browser render, question publication delta, assigned/unseen families, tier/mode/baseline adaptation, Ready state, storage object isolation, timer authority, Signature submissions/moderation and Pages CI not certified. No human examiner impersonation or Signature grade issuance.

## Decision
No activation, quarantine, student grade, permission or production data modification. Preauthorised original publication remains permitted only after full substantive verification; no draft cleared here. Escalate TMUA format mismatch and RLS design concern in evening report.
