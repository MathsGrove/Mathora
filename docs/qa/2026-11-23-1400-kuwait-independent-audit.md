# Independent Maths QA — 2026-11-23 14:00 Asia/Kuwait

## Critical environment discrepancy (BLOCKER)
Queried live Supabase project `nwakgkxytovprrrwyahs` via the connected Supabase tool. Public schema exposes 19 tables including `question_bank`, `mark_schemes`, `paper_questions`, but **not** the previously reported 2,244-record practice inventory or 64 Signature editorial records. Current observed counts: question_bank=10 (9 active), mark_schemes=10, paper_questions=0, attempts=0, reviews=0. Earlier cycle's claimed 2,244 practice questions / 64 Signature papers cannot be reconciled with this accessible schema. Do not equate these separate datasets or claim production-wide certification.

## Reproducible reads
```sql
select table_name from information_schema.tables where table_schema='public' order by table_name;
select (select count(*) from question_bank) question_bank_total,
(select count(*) from question_bank where active) question_bank_active,
(select count(*) from paper_questions) assigned_paper_questions,
(select count(*) from mark_schemes) mark_schemes,
(select count(*) from attempts) attempts,(select count(*) from reviews) reviews;
select q.id,q.prompt,q.active,q.marks,m.scheme
from question_bank q left join mark_schemes m on m.question_id=q.id order by q.created_at;
```

## Independent maths audit — all 10 visible bank records
- Quadratic x²−7x+12=0: (x−3)(x−4), roots 3,4; 3/3 scheme marks valid.
- Linear 3(2x−1)=4x+9: 6x−3=4x+9 -> 2x=12 -> x=6; 3/3 valid.
- Pythagoras 6,8: sqrt(36+64)=10 cm; 3/3 valid.
- 3/4+5/6: (9+10)/12=19/12=1 7/12; 3/3 valid.
- x+y=10, 2x−y=5: 3x=15, x=y=5; 4/4 valid.
- d/dx(3x³−5x²+7x−2)=9x²−10x+7; 3/3 valid.
- integral(6x²−4x+1)dx=2x³−2x²+x+C; 4/4 valid.
- vertex of x²−6x+5=(x−3)²−4 is (3,−4); 4/4 valid.
- mean(4,7,8,9,12)=40/5=8; 2/2 valid.
- INACTIVE: sum of positive roots of x²−7x+12=0 is 3+4=7; 3/3 valid. Stem is a near-duplicate family of the first question; keep inactive unless deduplication policy resolves.

All 10 visible scheme totals agree with stated marks (32 total marks). No MCQ options/distractors are stored in this schema; no student assignments exist in the visible `paper_questions` table. No question created since 2026-10-28 is visible here. Do not extrapolate these passes to the previously reported production practice bank.

## Uncertified / follow-up
Official board/component/year mapping (qualification labels are generic), LaTeX browser rendering, copyright, tenant RLS isolation, student images, server timers, adaptive Ready state, published Pages CI, and Signature staff moderation remain unverified. Connected GitHub installation exposes `MathsGrove/Mathora`, not the requested `Mathora-mathematics/Mathora`. No student grades, reports, publication, quarantine or DB writes were performed. The mismatch is a critical blocker to claiming the requested production-wide audit; identify authoritative schema/project before any production mutation. Verified originals do not require owner approval, but verification must be of the correct production dataset.
