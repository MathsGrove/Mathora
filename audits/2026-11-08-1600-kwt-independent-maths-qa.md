# Independent Maths QA — 2026-11-08 16:00 Asia/Kuwait

## Live evidence
- Supabase project `nwakgkxytovprrrwyahs` queried directly: 2,236 practice questions (1,942 active approved, 240 active pilots, 54 inactive drafts), 42 tasks, 22 task items, 23 Signature editorial assessments. Counts unchanged from 14:00 journal.
- All 2,236 practice rows have null `reviewed_by`; 330 have null `reviewed_at` (across all states); 468 active explanations are shorter than 100 characters. Shortness alone does not prove incorrectness.
- GitHub commit `61bcf2074168348fdc4d70bce9c897e165786812` is one commit ahead of 14:00 QA, adding public original local-only Reasoning Journey and separate report specimen, workflows, SEO files. Compared 18 changed paths.
- Combined commit status returned zero statuses: **CI/deployment NOT certified**. A missing combined status is not a pass.

## Independent mathematics of new public demo (reasoning-model.mjs)
1. `3(x+4)=27`: divide by 3 => x+4=9 => x=5; substitution 3(5+4)=27. Correct method A; B (27-4)/3=23/3 not 5; C 27*3-4=77 not 5. PASS.
2. `4(2y-3)=20`: divide by 4 => 2y-3=5 => y=4; substitution 4(8-3)=20. Correct method A; B gives 5/2+3=5.5; C falsely expands to 8y-3 rather than 8y-12. PASS.
3. `assessDemoReasoning` labels numerical and method correctness separately; `evidenceSummary` explicitly does not claim mastery. Static code inspection PASS for these properties; browser runtime, actual network isolation, and mobile UI NOT independently verified.
4. No new live practice question was identified by this GitHub diff. An immutable database publication-change log is not available from inspected schema; exhaustive new-question certification remains blocked.

## Release and safeguarding
- No practice or Signature records modified. No automatic publication or quarantine; mathematical defects were not established in live questions.
- Signature inventory 23; full part-by-part recheck of all 23 and authorised human moderation NOT certified this run. No human grade/report issued.
- Student-specific unseen IDs, near-duplicate families, adaptation, tier inheritance, authenticated Ready, RLS cross-role checks, photo storage, server timers, official current component syllabuses, copyright provenance, and Pages CI remain unverified.
- The 4 pilot-assignment concern from the previous audit remains open; not independently rejoined this run because task-item column assumptions caused SQL error. No unsupported claim of resolution.
- Verified original practice remains preauthorised without owner sign-off; unsupported drafts must remain staged.
- Findings for established evening report: new public reasoning demo mathematics passed static independent checks; production inventory stable; no CI status; longstanding editorial/eligibility gaps remain.
