# Independent QA — 2026-11-23 20:01 Asia/Kuwait

Source: LIVE Supabase project nwakgkxytovprrrwyahs, private schema; connected GitHub repository MathsGrove/Mathora (requested Mathora-mathematics/Mathora resolves to same repository ID 1323744009).

## Inventory and delta
Practice: 2244 total, 2192 active, 1952 approved; unchanged since 17:56 QA. 240 active with empty/null board or syllabus objective; 56 active with explanation <30 chars. Signature: 67 (was 66), zero human-moderated. Task items: 52, no missing/inactive bank references, three difficulty snapshot differences. No new approved practice identified from latest reviewed_at (last approved 2026-11-23 08:04:54 UTC).

## New Signature assessment: 7fd1a0c4-3bfc-45d9-b239-2edbd9066dce
Title: Poisson Arrivals and a Quadratic Probability Density — Advanced Review. Created 2026-11-23 15:57:38 UTC. State awaiting_human_moderation. Stored total 14.

Q1: rate 2.5/hour, interval 2 hours => N~Poisson(5) [2]. P(N=3)=exp(-5)*125/6=0.1403738958 => 0.1404 [2]. P(N>=1)=1-exp(-5)=0.993262053 => 0.9933 [2]. Sum 6.
Q2: f(x)=k x(4-x) on [0,4]. Integral of 4x-x² = [2x²-x³/3]_0^4=32/3; k=3/32 [3]. E(X)=(3/32)*[4x³/3-x⁴/4]_0^4=(3/32)*(64/3)=2 [3]. P(X>3)=(3/32)*([2x²-x³/3]_3^4)=(3/32)*(5/3)=5/32=0.15625 [2]. Sum 8. 6+8=14. All six part values and mark allocations consistent with stored scheme; no human moderation performed. This is mathematical QA, not a signature grade. External official 2026–27 syllabus mapping not independently certified this run.

## Reproducible queries
select count(*) total,count(*) filter(where active) active,count(*) filter(where review_state='approved') approved,count(*) filter(where active and (nullif(trim(exam_board),'') is null or nullif(trim(syllabus_objective),'') is null)) metadata_gaps,count(*) filter(where active and length(trim(coalesce(explanation,'')))<30) short_explanations from private.grove_practice_bank;
select count(*) total,count(*) filter(where human_moderated_by is not null) moderated,max(created_at) latest from private.grove_signature_editorial;
select id,title,total_marks,question_paper,mark_scheme,review_state,human_moderated_by,created_at from private.grove_signature_editorial order by created_at desc limit 2;
select count(*) items,count(*) filter(where b.id is null) missing,count(*) filter(where not coalesce(b.active,false)) inactive,count(*) filter(where i.difficulty is distinct from b.difficulty) difficulty_diff from private.grove_task_items i left join private.grove_practice_bank b on b.id=i.bank_id;

## Uncertified / no production changes
Per-student unseen families, baseline/feedback adaptation, Ready status, official syllabus/copyright mapping, browser KaTeX, RLS and tenant isolation, student photo privacy, mock timers, examiner workflow, GitHub Pages CI and staff-only editorial permissions were not comprehensively tested. No production publication/quarantine/grade issued. Pre-authorisation to publish substantively verified original practice remains in force without an owner approval gate; do not publish drafts lacking sufficient evidence.
