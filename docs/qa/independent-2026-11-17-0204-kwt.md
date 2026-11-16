# Independent Maths QA — 2026-11-17 02:04 Asia/Kuwait

## Live sources
Supabase project `nwakgkxytovprrrwyahs`; GitHub canonical `MathsGrove/Mathora`. Inspection read-only, before this journal commit.

## Reproducible checks
```sql
select count(*) total,count(*) filter(where active and review_state='approved') approved_active,count(*) filter(where active and review_state<>'approved') active_not_approved,count(*) filter(where not active) inactive,count(*) filter(where reviewed_at>now()-interval '2 hours') recently_reviewed from private.grove_practice_bank;
select count(*) total,count(*) filter(where human_moderated_at is not null) moderated,count(*) filter(where created_at>now()-interval '2 hours') recent from private.grove_signature_editorial;
select id,title,created_at,total_marks,question_paper,mark_scheme,review_state from private.grove_signature_editorial order by created_at desc limit 1;
select schemaname,tablename,policyname,qual from pg_policies where tablename='mark_schemes';
```

## Verified inventory
Practice 2236; approved active 1942; active not approved 240; inactive 54; reviewed in preceding two hours 0. Signature 51 papers; 1 new in two hours; 0 human-moderated.

## New Signature paper: Two Service Desks and a Triangular Density
ID `769d65cb-25be-433f-93e7-3680d68a82fe`; created 2026-11-16 21:56:24 UTC; 16 marks.
Q1: Independent Poisson(2) and Poisson(4) sum to Poisson(6) (2 marks). P(T=3)=e^-6*6^3/3!=36e^-6=0.089235078... => 0.08924 (3 marks). X|T=3~Bin(3,1/3); P(X=1|T=3)=3*(1/3)*(2/3)^2=4/9 (3 marks).
Q2: Integral from 1 to 3 of (3-w) dw = 2, hence k=1/2 (2 marks). E(W)=1/2*[3w²/2-w³/3] from 1 to 3 = 5/3 (3 marks). P(W>2)=1/2*[3w-w²/2] from 2 to 3 = 1/4, so W<2 has probability 3/4 (3 marks). Six parts sum 2+3+3+2+3+3=16; arithmetic and scheme agree. No human examiner action taken. Official 9709 Paper 6 specification crosswalk, rendered KaTeX and human moderation not certified.

## Security finding
`public.mark_schemes` policy `schemes_select` permits any authenticated membership with partner/examiner/admin role; policy lacks a row-specific organisation condition. Potential cross-organisation key exposure; exploitation not demonstrated. Do not change without authenticated tenant-isolation regression.

## Release
No practice reviewed in interval; private bank lacks created_at/updated_at, so review timestamp cannot prove no new publication. No candidate individually certified for activation. No publication, quarantine, student report or grade. Assignment unseen/adaptation, official copyright, secure upload tenant tests, server timers and Pages CI remain uncertified. Fully verified original practice is preauthorised; no owner approval gate.
