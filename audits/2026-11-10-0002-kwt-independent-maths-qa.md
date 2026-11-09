# MathsGrove independent QA — 2026-11-10 00:02 Kuwait (2026-11-09 21:02 UTC)

## Evidence and scope
Live SQL read from Supabase project `nwakgkxytovprrrwyahs`, private schema. Requested GitHub repository `Mathora-mathematics/Mathora` resolves via GitHub metadata to `MathsGrove/Mathora` (default branch main). GitHub commit discovery failed with connector KeyError, so publication delta cannot be proven. No production mutations.

## Verified database checks
- Practice bank 2,236 total: 1,942 active approved; 240 active non-approved; 54 inactive.
- Latest recorded reviewed_at 2026-11-03 05:56:54 UTC (not a publication audit trail).
- 468 active explanations shorter than 100 characters (editorial screening indicator).
- Four materialised items in task `9f8671dd-e793-4576-8ccd-c3320edbfd17` link to active pilot rather than approved questions (positions 1–4, IDs `79980d6c-d858-4c45-a6d7-899075272f22`, `97b06f8c-aa01-43da-9251-48dee7ab525d`, `6ce5d829-2147-469a-84c0-25b52d2cb9c1`, `8d71bc07-e03f-4509-a947-9b944b1cb62c`). Their mathematical correctness and intended pilot routing were not verified; do not change existing student assignments without a safe migration.
- 23 Signature editorial assessments, 397 declared marks, zero with complete human moderator UUID and timestamp. No Signature reports or grades issued.

## Reproducible mathematical spot-checks (previously reviewed; not newly published)
- `a953c0c3-0416-42ee-bc31-29e1c15821b8`: put t=tan(theta), 2(1+t²)-5t=5 => (2t+1)(t-3)=0; theta=-arctan(1/2), arctan(3) in (-pi/2,pi/2). Key and 3 distractors distinct, explanation correct.
- `546fbdb9-520b-4cfa-97a0-373c5283e1fe`: M=[[2,1],[0,1]], (M-I)v=0 => x+y=0; non-x-axis invariant line y=-x. Key and distractors distinct.
- `5676a2a9-beda-405a-a500-8ac21750269c`: (2sin(theta)-1)(sin(theta)+1)=0, solutions pi/6,5pi/6,3pi/2 in [0,2pi); sum 5pi/2. Key and distractors distinct.
- `1203b6df-bb12-4fdb-a9d2-f6e011863f97`: Euler h=.2, y1=2+.2*2=2.4; y2=2.4+.2*(.2+2.4)=2.92. Key and distractors distinct.
- The four stored explanations are substantively consistent with these calculations. Official 2026–27 syllabus documents, copyright, KaTeX browser rendering and all newly published questions NOT exhaustively checked.

## Not certified
No immutable change feed; cannot enumerate every newly published question. Student-specific assigned/unseen IDs, normalized near-duplicates, adaptation, tiers, Ready status, effective RLS, evidence/photo security, mock timers, CI and deployed Pages, and every Signature part mark remain unverified. No claims of comprehensive passes. No draft activated or quarantined without verified defect; no human examiner impersonation. Preserve automatic publication authorisation for verified originals only.

## Actions
Read-only SQL; GitHub journal write attempted. Outstanding exceptions should be included in established evening owner report.