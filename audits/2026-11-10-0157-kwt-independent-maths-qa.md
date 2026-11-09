# Independent Maths QA — 2026-11-10 01:57 Asia/Kuwait

## Live targets and scope
Requested GitHub `Mathora-mathematics/Mathora` redirects (HTTP 301) to canonical `MathsGrove/Mathora`; queried canonical GitHub REST API and Supabase `nwakgkxytovprrrwyahs` directly. Read-only database queries; no question or student mutations.

## Reproducible database observations
`select count(*) total, count(*) filter(where active and review_state='approved') approved, count(*) filter(where active and review_state<>'approved') other_active, count(*) filter(where not active) inactive, count(*) filter(where active and length(coalesce(explanation,''))<100) short_explanations, count(*) filter(where active and nullif(trim(syllabus_objective),'') is null) blank_objectives, max(reviewed_at) last_review from private.grove_practice_bank;`
Result: total 2236; approved 1942; other active 240; inactive 54; short explanations 468; blank objectives 240; latest reviewed_at 2026-11-03 05:56:54 UTC.

`select (select count(*) from private.grove_signature_editorial) signature_total,(select count(*) from private.grove_signature_editorial where human_moderated_by is not null and human_moderated_at is not null) moderated,(select count(*) from private.grove_task_items i left join private.grove_practice_bank b on b.id=i.bank_id where b.id is null or not b.active or b.review_state <> 'approved') ineligible_items,(select count(*) from private.grove_task_items) total_items;`
Result: Signature 23, fully human moderated 0; ineligible task items 4 of 22.

## Recomputed mathematical sample (not a new-publication delta)
Five most recently reviewed approved records independently inspected against their complete prompt, choices, correct_text and explanation:
- a953c0c3-0416-42ee-bc31-29e1c15821b8: 2sec²θ−5tanθ=5 gives (2t+1)(t−3)=0; θ=−arctan(1/2), arctan(3) in (−π/2,π/2). Key and distractors consistent.
- d20d1ccb-5ee6-4359-a36e-d4c666544bfa: Kruskal edges CD 2, AB 3, BC 4, DE 5, total 14; alternatives 15,16,18 incorrect.
- 5676a2a9-beda-405a-a500-8ac21750269c: (2sinθ−1)(sinθ+1)=0, θ=π/6,5π/6,3π/2, sum 5π/2.
- 1203b6df-bb12-4fdb-a9d2-f6e011863f97: Euler y1=2.4, y2=2.92, h=.2, y'=x+y.
- 546fbdb9-520b-4cfa-97a0-373c5283e1fe: M=[[2,1],[0,1]], non-x-axis invariant eigenline x+y=0, y=−x.
All five mathematical keys and explanation logic pass; no claim of independent official syllabus-version validation or actual browser KaTeX render.

## GitHub Pages
Canonical GitHub Actions GET returned workflow run 42698704790, 'Deploy MathsGrove website', completed SUCCESS for head 1011a1b498bc3e9770960eb51f3d492c3b42d62e, run 944, created 2026-11-09 21:02:44 UTC. This verifies CI result, not end-to-end client or student security.

## Exceptions and limitations
4/22 task items link to bank records absent/inactive/not approved; avoid certifying them Ready until eligibility and pilot policy checked. 468 short explanations and 240 blank syllabus objectives are review indicators, not proof of mathematical incorrectness. All 23 Signature records lack completed human moderation metadata; do not release grades/reports. No immutable publication delta or per-student unseen/adaptation evaluation completed. Official 2026–27 board/component specification, copyright, effective authenticated RLS, photo/whiteboard storage, server timer, staff-only Signature UI, browser rendering and all Signature part marks not exhaustively verified. No drafts published; no quarantine performed without confirmed individual error. Do not conflate five spot checks with exhaustive certification.

## Decision
Read-only QA. Existing authorisation permits verified original practice publication without owner gate, but no new question passed complete publication criteria in this run. Continue independent audits and carry unresolved findings to evening report.
