# MathsGrove independent QA — 2026-11-23 08:00 Asia/Kuwait

## Live evidence
Supabase project `nwakgkxytovprrrwyahs`, read-only SQL, checked 2026-11-23 ~05:00 UTC. Requested GitHub `Mathora-mathematics/Mathora` README could not be fetched; connected `MathsGrove/Mathora` README accessible. This journal is in the accessible repository, not proof that the requested repository is equivalent.

Practice bank: 2243 total, 2190 active, 1950 active approved, 240 active blank board/objective metadata, 56 active explanations under 30 characters. These are flags, not proof of invalid mathematics. Assigned items: 52; invalid/inactive source 0; source prompt mismatch 0; difficulty mismatch 3 (not yet classified as defects).

Signature: 64 records; 0 with human_moderated_by. Latest ID eb4ed3e3-3211-4997-9d04-bbf60f3c8974, created 2026-11-23 04:00:02 UTC, title "Vertical Motion and Connected Particles — Original Specialist Mini-Paper", 14 marks.

## Independent recomputation of newest Signature
Q1: u=20 m/s, a=-10 m/s². (a) v=0 => t=2 s (2/2 marks). (b) s=20(2)-5(2²)=20 m (2/2). (c) s(3)=60-45=15 m above O, v(3)=20-30=-10 m/s = downward at 10 m/s (3/3).
Q2: A=3 kg and B=2 kg, frictionless pulley, light inextensible string. (a) 30-T=3a, T-20=2a => 10=5a, a=2 m/s², A down (3/3). (b) T=20+2a=24 N (2/2). (c) s=0.5*2*(1.5²)=2.25 m (2/2). Totals Q1=7, Q2=7, paper=14. Conditions and units consistent. Mathematical verification only; human moderation absent. Do not issue Signature grades or reports.

## Reproducible SQL
```sql
select count(*) total,count(*) filter(where active) active,count(*) filter(where active and review_state='approved') approved,count(*) filter(where active and (nullif(trim(exam_board),'') is null or nullif(trim(syllabus_objective),'') is null)) metadata_gaps,count(*) filter(where active and length(trim(explanation))<30) short_explanations from private.grove_practice_bank;
select count(*) total,count(*) filter(where human_moderated_by is not null) moderated,max(created_at) latest from private.grove_signature_editorial;
select id,title,created_at,total_marks,question_paper,mark_scheme from private.grove_signature_editorial order by created_at desc limit 1;
select count(*) assigned,count(*) filter(where b.id is null or not b.active) invalid_source,count(*) filter(where i.prompt is distinct from b.prompt) prompt_mismatch,count(*) filter(where i.difficulty is distinct from b.difficulty) difficulty_mismatch from private.grove_task_items i left join private.grove_practice_bank b on b.id=i.bank_id;
```

## Release decision and limitations
No new practice published or quarantined: full independent verification of every answer, distractor, explanation, exact board/component official 2026-27 specification and rendering not established for any new candidate in this run. No student data or Signature grade released. Open: near-duplicate families, actual unseen IDs and feedback adaptation, readiness, source difficulty inheritance policy, official copyright, RLS isolation, photo storage/retention, mock timer server enforcement, GitHub Pages CI, KaTeX browser rendering. No claim these checks passed. No owner approval gate for verified original practice.
