-- Runs only after fictional fixture + staging schema in disposable CI PostgreSQL.
\set ON_ERROR_STOP on
INSERT INTO private.mg2_rubrics(
 id,org_id,question_key,version_no,qualification,academic_level,exam_board,
 syllabus_year,plan,question_prompt,worked_solution,max_marks,criteria,authored_by
) VALUES(
 'abcdabcd-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'fictional-original-ratio',1,'GCSE','Foundation','AQA','2026','weekly',
 'Share 96 fictional kits in the ratio 5 to 3. Show each calculation.',
 '5+3=8 equal parts; 96/8=12; red=60 and blue=36; check total and ratio.',
 3,
 '[
 {"id":"m-parts","code":"M1","skill":"Represent ratio","description":"Identify eight equal parts","missingFeedback":"Add the ratio shares before finding one part.","dependsOn":[]},
 {"id":"a-unit","code":"A1","skill":"Find one share","description":"Calculate the correct unit share","missingFeedback":"Divide 96 by all eight parts.","dependsOn":["m-parts"],"allowImpliedMethod":true},
 {"id":"b-check","code":"B1","skill":"Check the total","description":"Independent check of result","missingFeedback":"Verify that both groups total 96.","dependsOn":[]}
 ]'::jsonb,
 '33333333-3333-4333-8333-333333333333'
);
INSERT INTO private.mg2_attempts(id,rubric_id,org_id,student_id) VALUES(
 'abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
 'abcdabcd-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 '44444444-4444-4444-8444-444444444444'
);
SELECT private.mg2_fingerprint(r) AS fp FROM private.mg2_rubrics r
 WHERE id='abcdabcd-aaaa-4aaa-8aaa-aaaaaaaaaaaa' \gset
SELECT set_config('app.mg2_expected_fp', :'fp',false);
-- Unapproved attempts must not be markable, even by a valid examiner.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_staff_mark('abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb','[]'::jsonb,false);
 EXCEPTION WHEN OTHERS THEN blocked:=SQLERRM LIKE '%approvals%';END;
 IF NOT blocked THEN RAISE EXCEPTION 'Unmoderated rubric was incorrectly markable';END IF;
END $$;
-- Author cannot sign off own original question.
SELECT set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_signoff_rubric('abcdabcd-aaaa-4aaa-8aaa-aaaaaaaaaaaa','none','This is a fictional review with sufficient words.');
 EXCEPTION WHEN OTHERS THEN blocked:=SQLERRM LIKE '%Independent examiner%';END;
 IF NOT blocked THEN RAISE EXCEPTION 'Author self-approval was not rejected';END IF;
END $$;
-- Other-organisation examiner cannot sign.
SELECT set_config('request.jwt.claim.sub','99999999-9999-4999-8999-999999999999',false);
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_signoff_rubric('abcdabcd-aaaa-4aaa-8aaa-aaaaaaaaaaaa','none','Fictional other organisation cannot approve this.');
 EXCEPTION WHEN OTHERS THEN blocked:=SQLERRM LIKE '%Independent examiner%';END;
 IF NOT blocked THEN RAISE EXCEPTION 'Cross-organisation reviewer was not rejected';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
SELECT public.mg2_signoff_rubric('abcdabcd-aaaa-4aaa-8aaa-aaaaaaaaaaaa',:'fp',
 'First fictional examiner independently reviewed the algebra and the mark dependencies.');
-- Duplicate first reviewer is rejected; a second independent reviewer must be distinct.
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_signoff_rubric('abcdabcd-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    current_setting('app.mg2_expected_fp'),
    'Repeated same examiner approval is not independent.');
 EXCEPTION WHEN unique_violation THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Duplicate reviewer vote was accepted';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
SELECT public.mg2_signoff_rubric('abcdabcd-aaaa-4aaa-8aaa-aaaaaaaaaaaa',:'fp',
 'Second fictional examiner independently checked the original full mathematical solution.');
-- Wrong organisation staff cannot award marks even after approval.
SELECT set_config('request.jwt.claim.sub','99999999-9999-4999-8999-999999999999',false);
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_staff_mark('abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb','[]'::jsonb,false);
 EXCEPTION WHEN OTHERS THEN blocked:=SQLERRM LIKE '%authorised examiner%';END;
 IF NOT blocked THEN RAISE EXCEPTION 'Cross-organisation marking was accepted';END IF;
END $$;
-- Student cannot directly mark their own attempt.
SELECT set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',false);
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_staff_mark('abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb','[]'::jsonb,false);
 EXCEPTION WHEN OTHERS THEN blocked:=SQLERRM LIKE '%authorised examiner%';END;
 IF NOT blocked THEN RAISE EXCEPTION 'Student could mark a reviewed attempt';END IF;
END $$;
-- Student cannot see draft or unapproved report.
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN PERFORM public.mg2_student_report('abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
 EXCEPTION WHEN OTHERS THEN blocked:=SQLERRM LIKE '%not found%';END;
 IF NOT blocked THEN RAISE EXCEPTION 'Unreleased report disclosed';END IF;
END $$;
-- No direct Data API privileges even after signing in.
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN PERFORM 1 FROM private.mg2_awards;
 EXCEPTION WHEN OTHERS THEN blocked:=SQLERRM LIKE '%permission denied%';END;
 IF NOT blocked THEN RAISE EXCEPTION 'Direct access to private examiner award rows was not denied';END IF;
END $$;
-- Examiner awards must obey dependencies and must not omit any criterion.
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_staff_mark('abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '[{"id":"m-parts","awarded":false},{"id":"a-unit","awarded":true,"note":"Fictional accurate unit share recorded."},{"id":"b-check","awarded":true,"note":"Fictional valid independent check."}]'::jsonb,false);
 EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'A1 dependency negative test caught SQLSTATE %, reason: %',SQLSTATE,SQLERRM;
  blocked:=SQLERRM LIKE '%Dependent criterion%';END;
 IF NOT blocked THEN RAISE EXCEPTION 'A1 without its required M1 was accepted';END IF;
END $$;
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_staff_mark('abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '[{"id":"m-parts","awarded":true,"note":"Fictional valid method."}]'::jsonb,false);
 EXCEPTION WHEN OTHERS THEN blocked:=SQLERRM LIKE '%Exactly one%';END;
 IF NOT blocked THEN RAISE EXCEPTION 'Incomplete criterion award array was accepted';END IF;
END $$;
-- Full reviewed save: all marks come from these human decisions.
SELECT public.mg2_staff_mark('abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
 '[{"id":"m-parts","awarded":true,"note":"Eight total ratio parts shown."},
   {"id":"a-unit","awarded":false,"note":"Incorrect unit share."},
   {"id":"b-check","awarded":true,"note":"Student correctly checked the total."}]'::jsonb,
 false);
-- Release requires human-written summaries for each actual authorised audience.
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_staff_mark('abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   '[{"id":"m-parts","awarded":true,"note":"Eight total ratio parts shown."},
     {"id":"a-unit","awarded":false,"note":"Incorrect unit share."},
     {"id":"b-check","awarded":true,"note":"Student correctly checked the total."}]'::jsonb,
   true,'too short','too short','too short');
 EXCEPTION WHEN OTHERS THEN blocked:=SQLERRM LIKE '%Human-reviewed%';END;
 IF NOT blocked THEN RAISE EXCEPTION 'Unsummarised report released';END IF;
END $$;
SELECT public.mg2_staff_mark('abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
 '[{"id":"m-parts","awarded":true,"note":"Eight total ratio parts shown."},
   {"id":"a-unit","awarded":false,"note":"Incorrect unit share."},
   {"id":"b-check","awarded":true,"note":"Student correctly checked the total."}]'::jsonb,
 true,
 'You correctly found eight parts; revisit the value of one part next.',
 'Ask about why the group has eight equal parts before practising a new total.',
 'Practise unit-share calculation and independent checking with a contrasting ratio.');
-- Staff cannot change released result in the same attempt.
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_staff_mark('abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb','[]'::jsonb,false);
 EXCEPTION WHEN OTHERS THEN blocked:=SQLERRM LIKE '%Submitted attempt%';END;
 IF NOT blocked THEN RAISE EXCEPTION 'Released attempt was editable';END IF;
END $$;
-- Authorised student's report contains only student-facing criterion guidance.
SELECT set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',false);
DO $$
DECLARE j jsonb;
BEGIN
 j:=public.mg2_student_report('abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
 IF (j->>'earned')::int<>2 OR (j->>'possible')::int<>3 OR
   jsonb_array_length(j->'criteria')<>3 OR
   j::text LIKE '%Student correctly checked the total.%'
 THEN RAISE EXCEPTION 'Student report score, criterion count or examiner privacy incorrect';END IF;
END $$;
-- Other student cannot read the same attempt.
SELECT set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',false);
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN PERFORM public.mg2_student_report('abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
 EXCEPTION WHEN OTHERS THEN blocked:=SQLERRM LIKE '%not found%';END;
 IF NOT blocked THEN RAISE EXCEPTION 'Cross-student released report disclosed';END IF;
END $$;
-- Parent receives *no* tutor-specific criterion evidence.
SELECT set_config('request.jwt.claim.sub','66666666-6666-4666-8666-666666666666',false);
DO $$
DECLARE j jsonb;
BEGIN
 j:=public.mg2_family_report('abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb','parent');
 IF j->>'view_role'<>'parent' OR j ? 'criteria' OR j ? 'teaching_plan' OR
  j->>'summary' NOT LIKE '%eight equal parts%'
 THEN RAISE EXCEPTION 'Parent view improperly exposes tutor notes';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','77777777-7777-4777-8777-777777777777',false);
DO $$
DECLARE j jsonb;
BEGIN
 j:=public.mg2_family_report('abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb','tutor');
 IF j->>'view_role'<>'tutor' OR jsonb_array_length(j->'criteria')<>3 OR
    j->>'teaching_plan' NOT LIKE '%contrasting ratio%'
 THEN RAISE EXCEPTION 'Tutor report missing approved teaching evidence';END IF;
END $$;
-- A parent account cannot request the tutor-only report, even with a valid parent link.
SELECT set_config('request.jwt.claim.sub','66666666-6666-4666-8666-666666666666',false);
DO $
DECLARE blocked boolean:=false;
BEGIN
 BEGIN PERFORM public.mg2_family_report('abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb','tutor');
 EXCEPTION WHEN OTHERS THEN blocked:=SQLERRM LIKE '%not found%';END;
 IF NOT blocked THEN RAISE EXCEPTION 'Parent could request tutor-only evidence';END IF;
END $;
-- No role link => no family access.
SELECT set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',false);
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN PERFORM public.mg2_family_report('abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb','parent');
 EXCEPTION WHEN OTHERS THEN blocked:=SQLERRM LIKE '%not found%';END;
 IF NOT blocked THEN RAISE EXCEPTION 'Unlinked viewer read a family report';END IF;
END $$;
RESET ROLE;
-- Privileged test verifies database scores and immutable release records.
DO $$
DECLARE s integer;n integer;blocked boolean:=false;
BEGIN
 SELECT score INTO s FROM private.mg2_attempts
   WHERE id='abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 SELECT count(*) INTO n FROM private.mg2_releases
   WHERE attempt_id='abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 IF s<>2 OR n<>1 THEN RAISE EXCEPTION 'Server score or immutable snapshot wrong';END IF;
 BEGIN
  UPDATE private.mg2_releases SET earned=3 WHERE attempt_id='abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 EXCEPTION WHEN OTHERS THEN blocked:=SQLERRM LIKE '%immutable%';END;
 IF NOT blocked THEN RAISE EXCEPTION 'An immutable release was overwritten';END IF;
END $$;
-- Previously valid invitation is now revoked; subsequent reads must fail.
UPDATE public.learner_view_invitations SET revoked_at=now()
 WHERE id='11110000-0000-4000-8000-000000000000';
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','66666666-6666-4666-8666-666666666666',false);
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN PERFORM public.mg2_family_report('abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb','parent');
 EXCEPTION WHEN OTHERS THEN blocked:=SQLERRM LIKE '%not found%';END;
 IF NOT blocked THEN RAISE EXCEPTION 'Revoked guardian still had report access';END IF;
END $$;
RESET ROLE;
SELECT 'PASS: fictional PostgreSQL signoffs, score recomputation, permissions, release, immutable history, parent/tutor privacy and revocation' AS result;
