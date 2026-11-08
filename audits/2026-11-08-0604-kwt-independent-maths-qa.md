# Independent MathsGrove QA — 2026-11-08 06:04 Asia/Kuwait

## Live sources
Connected Supabase project `nwakgkxytovprrrwyahs` (SQL read queries) and GitHub `MathsGrove/Mathora` (repository and latest commit search). Previous journal commit: `7bc9043f3c4cdbacd771d6fc1c48c6330f37093e`. No new repository commit found before this journal.

## Verified database counts
- Practice: 2,236 total; 1,942 active approved; 240 active non-approved/pilot; 54 inactive. 1,942 approved entries have NULL reviewer UUID.
- Tasks: 41 total, 38 scheduled. Materialised task items: 16, referencing 16 distinct bank IDs; four items reference questions that are not both active and approved.
- Signature: 23 editorial assessments, 397 declared marks, zero with both human_moderated_by and human_moderated_at populated.
- Latest Signature entry: `bb6d4142-c8f7-479b-bedf-ba613504c16a`, created 2026-11-07 22:02:18 UTC, title *P4 Parametric Differentiation and Separable Differential Equations*, 12 marks, awaiting human moderation. No newer entry.

## Reproducible mathematical spot recheck of latest Signature
Q1: x=t²+1, y=t³−3t, t>0. dx/dt=2t, dy/dt=3t²−3, so dy/dx=3(t²−1)/(2t). Stationary at t=1 => (x,y)=(2,−2). As dx/dt>0 and dy/dt changes negative to positive at t=1, it is a local minimum. Scheme Q1(a) 3 and (b) 3 = 6, consistent.
Q2: dy/dx=2x(y+1), y(0)=2. Separate: ln|y+1|=x²+C; initial condition gives y+1=3e^(x²). Hence y=3e^(x²)−1 and y(1)=3e−1. Differentiation returns 6xe^(x²)=2x(y+1). Scheme Q2(a) 4 and (b) 2 = 6. Overall 12/12 allocated consistently. This is independent mathematical checking, **not** human moderation, official syllabus certification or student marking.

## Open findings / non-passes
1. Four assigned questions fail the active+approved gate; confirm pilot eligibility and avoid treating these as approved supply.
2. Missing reviewer UUIDs for 1,942 approved practice entries; historical review provenance not independently established.
3. No reliable immutable per-question publication chronology in the inspected practice schema; cannot certify *every newly published* or changed practice item. No new practice was approved in this run.
4. Student-specific unseen/near-duplicate families, tier/mode inheritance, adaptive difficulty, Ready status, all distractors and explanations, official 2026–27 board-component specifications, copyright provenance, KaTeX/browser rendering, effective RLS, photo/whiteboard storage, server mock timers, GitHub Pages CI and full Signature editorial corpus were **not certified** by this run. Do not infer passes from inventory counts.
5. Signature human moderation remains incomplete for all 23 assessments. No signature report/grade issued.

## Actions
Read-only production inspection. No question activation, quarantine, student assignment, grade, permission, or human-moderation modification. No defect proven mathematically in the latest Signature sample. Existing concerns retained. Verified original practice may be published without owner approval only after full substantive checks; none met that standard in this inspection.

## Evening report handoff
Include four non-approved assignments, missing reviewer provenance, inability to establish exhaustive changed-question QA, and outstanding security/deployment checks. No separate email sent in this run.
