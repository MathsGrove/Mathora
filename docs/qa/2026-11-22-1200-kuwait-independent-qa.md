# Independent MathsGrove QA — 2026-11-22 12:00 Asia/Kuwait

## Scope and reproducible live findings
Read-only connected Supabase project `nwakgkxytovprrrwyahs` and GitHub `MathsGrove/Mathora`. The requested `Mathora-mathematics/Mathora` identity did not return a readable README; `MathsGrove/Mathora` did. **Critical correction to prior QA summaries:** the public `question_bank` is NOT the whole live practice inventory. Private `grove_practice_bank` contains **2,243** records: **1,950 active approved, 240 active pilot, 53 inactive draft**. Therefore previous reports claiming there were only nine active questions and no recent content were incomplete and must not be used as global publication certification. Public `question_bank` separately has 10 items, 9 active and one inactive TMUA duplicate.

Private `grove_signature_editorial`: **58** items, all `awaiting_human_moderation`, none marked human-moderated. Do not release Signature grades or reports. Public attempts, paper_questions, answers and reviews each have zero rows; this does NOT establish zero private scheduled practice or baseline activity.

### Mathematical checks performed
Recomputed the ten public pilot question stems and 32 scheme marks: mean (4+7+8+9+12)/5=8 [2]; x²−7x+12=(x−3)(x−4), roots 3,4 [3]; 3(2x−1)=4x+9 => 2x=12 => x=6 [3]; derivative of 3x³−5x²+7x−2 = 9x²−10x+7 [3]; inactive TMUA root sum=7 [3]; 3/4+5/6=9/12+10/12=19/12 [3]; integral of 6x²−4x+1 = 2x³−2x²+x+C [4]; x²−6x+5=(x−3)²−4 vertex (3,−4) [4]; hypotenuse sqrt(6²+8²)=10 cm [3]; x+y=10,2x−y=5 => x=y=5 [4]. No error in these calculations or mark totals. GCSE fraction scheme permits mixed number 1 7/12 despite stem asking for simplified fraction; editorial clarification recommended.

Private practice inventory is **NOT individually certified in this run**: no exhaustive recomputation of 2,190 active questions, distractors, syllabus versions, complete explanations, or near-duplicate families was performed. Five active pilot explanations have fewer than 15 characters; inspected all five and found their arithmetic correct, though pedagogy is terse. Do not infer broad mathematical clearance from aggregate counts. No private records were modified or published.

### Security and readiness
RLS policy `questions_select` allows any member to read active public question_bank; `schemes_select` allows qualifying staff roles without explicit tenant scoping. Confirm whether global shared content is intended and test authenticated cross-tenant access before declaring a breach. Storage `student-work` has 31 objects; object isolation and retention not tested. One upload policy matches attempt ownership and qualification but not explicitly paper-question assignment. Public student attempt/answer/allocation/review tables empty; no student-specific unseen/adaptive/Ready certification. Private scheduled tasks and baseline sessions not inspected in this cycle. GitHub README states public pilot answer keys and warns against real-student high-integrity use; it also describes uninstalled migrations and features requiring separate testing. No claim of Pages CI success, timer security, official 2026–27 syllabus compliance, copyright clearance, or Signature examiner approval.

### Reproduction SQL
```sql
select active,review_state,count(*) from private.grove_practice_bank group by 1,2;
select review_state,human_moderated_by is not null,count(*) from private.grove_signature_editorial group by 1,2;
select count(*),count(*) filter(where active),count(*) filter(where explanation is null or length(trim(explanation))<15) from private.grove_practice_bank;
select tablename,policyname,cmd,qual,with_check from pg_policies where schemaname in ('public','storage') and tablename in ('question_bank','mark_schemes','objects');
select (select count(*) from public.attempts),(select count(*) from public.paper_questions),(select count(*) from public.answers),(select count(*) from public.reviews);
```

**Release decision:** no new publication certified, no auto-release, no Signature release. Fully independently verified original practice may be auto-published without owner approval, but unverified items remain staged. Escalate corrected inventory and remaining audit gaps in established evening report.
