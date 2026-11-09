# Independent Maths QA — 2026-11-09 15:58 Asia/Kuwait

## Scope and evidence
Live read-only SQL against Supabase project nwakgkxytovprrrwyahs, private.grove_practice_bank, private.grove_task_items, private.grove_signature_editorial. GitHub repository resolves as MathsGrove/Mathora despite legacy Mathora-mathematics/Mathora input. Recent-commit search failed (connector KeyError); no immutable publication diff established.

## Reproducible counts
Practice bank total 2236; active approved 1942; other active 240; inactive 54. Active explanations under 100 chars: 468. Missing syllabus_objective IS NULL: 0 (empty strings not counted). Materialised task items: 22; 4 refer to missing/inactive/nonapproved bank entries. Signature editorial: 23; fully human-moderated metadata: 0.

## Independently recomputed five approved examples (not necessarily newly published)
a953c0c3: t=tan(theta), 2t²−5t−3=(2t+1)(t−3); t=-1/2 or 3, both in interval; correct first option.
d20d1ccb: Kruskal CD=2 AB=3 BC=4 DE=5, total 14; correct third option.
5676a2a9: sin(theta)=1/2 or -1; theta=pi/6,5pi/6,3pi/2; sum 5pi/2; correct third option.
1203b6df: Euler y1=2.4, y2=2.4+0.2(2.6)=2.92; correct second option.
546fbdb9: eigenvalue 1 yields x+y=0, invariant line y=-x; correct fourth option.
All five choices are distinct and explanations mathematically consistent. This is a sample, not a newly-published question census.

## Failures, limitations, actions
Four assignment eligibility exceptions remain unresolved. Short explanations are screening flags, not proven errors. No Signature human moderation; no automated grades. No newly published content certified due to unavailable change history; no question activated/quarantined. Not verified: all official current board/component specifications, copyright, student unseen and semantic near-duplicate histories, adaptive/tier logic, authenticated Ready, RLS cross-tenant behavior, evidence storage, server timers, browser KaTeX, deployed Pages CI. No student records changed. Escalate assignment exceptions in evening report.