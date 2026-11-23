# Independent QA — 2026-11-23 09:55 Asia/Kuwait

## Live evidence
Supabase project `nwakgkxytovprrrwyahs`, read-only SQL. Connected GitHub repository `MathsGrove/Mathora`; requested `Mathora-mathematics/Mathora` is not in the accessible repository list. Previous QA commit: `0a4a931bcbca4ff737cc066d5436190f7b0f0cce`. Editorial publication commit `528ba60ae0efbbcf01b0cf55490130e5c54aee85` (2026-11-23 06:04 UTC).

- Practice bank: 2243 total, 2191 active, 1951 approved. Since previous QA: +1 active approved, total unchanged. 240 active records have blank board/objective metadata; 56 have explanations under 30 characters.
- Newly approved `6bf97c89-3e3a-4949-8cd5-785d63ef9721`, Cambridge 9709 P6, independent normals X mean 5 variance 4 and Y mean 7 variance 9, Z=2X+Y. E(Z)=17, Var(Z)=4*4+9=25, SD=5. P(Z>22)=P(N(0,1)>1)=0.1586552539, to 4 s.f. 0.1587. Options 0.1587, 0.8413 (lower tail), 0.0228 (z=2 upper tail), 0.3085 (z≈0.5 upper tail). Exactly one correct option. Independent arithmetic and explanation PASS. Syllabus string cites Cambridge 9709 2026–2027 v5 P6; official source was not independently re-opened this cycle, so formal source certification remains pending. No changes made.
- Student tasks: 49, assigned items 52. 0 missing/inactive source questions, 0 prompt mismatches; 52/52 correct letter IDs map to matching correct answer text in assigned object-format choices. Important: bank choices are string arrays while assigned choices are object arrays; comparing JSON equality or correct_option directly to correct_text yields false mismatches. 0 same-student exact normalised prompt duplicates. Three assigned difficulty values differ from source (task `f701b4a2-8a55-4e6a-a1e6-00a626d363f1`, positions 4,5,6: assigned 4/4/4 versus source 3/5/3); investigate whether deliberate adaptation, do not overwrite without policy evidence.
- Signature: 64 records, 0 human moderated, newest remains `eb4ed3e3-3211-4997-9d04-bbf60f3c8974`, 14 marks, awaiting human moderation. No new Signature since prior QA. Previously recomputed mechanics: 2s, 20m, displacement +15m and velocity -10m/s at 3s; acceleration 2m/s², tension 24N, distance 2.25m; 7+7=14. No grades issued.
- RLS enabled on inspected public.answer_files, public.answers, public.attempts, private.grove_practice_bank, private.grove_tasks, private.grove_work_evidence. RLS enabled is not proof of correct tenant isolation. Storage privacy, marking, timers, GitHub Pages CI, browser KaTeX, official syllabus/copyright and near-duplicate/adaptive selection still require dedicated verification.
- No production writes, quarantines or publication by QA; no unsupported claim of comprehensive certification. Owner approval is not required for original practice that passes substantive checks; questionable drafts remain staged.

## Reproducible SQL
```sql
select count(*) total,count(*) filter(where active) active,
count(*) filter(where active and review_state='approved') approved,
count(*) filter(where active and (nullif(btrim(exam_board),'') is null or nullif(btrim(syllabus_objective),'') is null)) metadata_gap,
count(*) filter(where active and length(coalesce(explanation,''))<30) short_explanation
from private.grove_practice_bank;
select count(*) total,count(*) filter(where human_moderated_by is not null) moderated
from private.grove_signature_editorial;
select count(*) assigned,count(*) filter(where b.id is null) missing_bank,
count(*) filter(where b.id is not null and not b.active) inactive_bank,
count(*) filter(where i.prompt is distinct from b.prompt) prompt_mismatch,
count(*) filter(where i.difficulty is distinct from b.difficulty) difficulty_mismatch
from private.grove_task_items i left join private.grove_practice_bank b on b.id=i.bank_id;
select count(*) filter(where exists(select 1 from jsonb_array_elements(i.choices) c where c->>'id'=i.correct_option and c->>'text'=b.correct_text)) valid_key
from private.grove_task_items i join private.grove_practice_bank b on b.id=i.bank_id;
```
