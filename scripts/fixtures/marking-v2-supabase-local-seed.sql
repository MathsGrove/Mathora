-- Fictional records only. The eight users are created through REAL local GoTrue.
-- This seed file MUST NOT be applied to hosted MathsGrove.
DO $$
BEGIN
 IF (SELECT count(*) FROM auth.users WHERE email IN (
  'mg2-author@example.com','mg2-examiner-one@example.com',
  'mg2-examiner-two@example.com','mg2-student@example.com',
  'mg2-other-student@example.com','mg2-other-examiner@example.com',
  'mg2-parent@example.com','mg2-tutor@example.com'))<>8
 THEN RAISE EXCEPTION 'Exactly eight local fictional Auth users required';END IF;
END $$;

INSERT INTO public.organisations(id,name) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Local Fictional School A'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Local Fictional School B');

INSERT INTO public.memberships(org_id,user_id,member_role)
SELECT x.org_id,u.id,x.role
 FROM (VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,'mg2-author@example.com','admin'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,'mg2-examiner-one@example.com','examiner'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,'mg2-examiner-two@example.com','examiner'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,'mg2-student@example.com','student'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,'mg2-other-student@example.com','student'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,'mg2-other-examiner@example.com','examiner')
 ) AS x(org_id,email,role)
 JOIN auth.users u ON lower(u.email)=x.email;

INSERT INTO public.student_entitlements(student_id,org_id,tier,starts_at,ends_at)
 SELECT id,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','exam',
  now()-interval '1 day',now()+interval '7 days'
 FROM auth.users WHERE email='mg2-student@example.com';

INSERT INTO public.student_entitlements(student_id,org_id,tier,starts_at,ends_at)
 SELECT id,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','exam',
  now()-interval '1 day',now()+interval '7 days'
 FROM auth.users WHERE email='mg2-other-student@example.com';

INSERT INTO private.mg2_rubrics (
 id,org_id,question_key,version_no,qualification,academic_level,exam_board,
 syllabus_year,plan,question_prompt,worked_solution,max_marks,criteria,authored_by
)
SELECT
 'abcdabcd-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'original-fictional-ratio-for-security-test',1,
 'GCSE','Foundation','AQA','2026','weekly',
 'A fictional club shares 96 kits in the ratio red to blue 5:3. Find the red count and show working.',
 'There are 5+3=8 equal parts. One part is 96/8=12 kits. Red is 5*12=60 and blue 3*12=36, which total 96.',
 3,
 '[
  {"id":"m-parts","code":"M1","skill":"Total ratio parts",
   "description":"Identify eight equal parts","missingFeedback":"Add five parts and three parts before finding a unit.","dependsOn":[]},
  {"id":"a-unit","code":"A1","skill":"Unit-share calculation",
   "description":"Work out twelve kits per equal part",
   "missingFeedback":"Divide the total by eight equal parts.","dependsOn":["m-parts"],"allowImpliedMethod":true},
  {"id":"b-check","code":"B1","skill":"Independent verification",
   "description":"Check the combined total after sharing",
   "missingFeedback":"Confirm red and blue counts total 96.","dependsOn":[]}
 ]'::jsonb,
 u.id
FROM auth.users u WHERE u.email='mg2-author@example.com';

DO $$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.memberships;
 IF n<>6 THEN RAISE EXCEPTION 'Six fictional organisation memberships expected, got %',n;END IF;
 IF (SELECT count(*) FROM private.mg2_rubrics)<>1
 THEN RAISE EXCEPTION 'The original fictional rubric was not seeded';END IF;
END $$;
SELECT 'PASS: local real-Auth fictional examiner and student fixtures seeded' AS result;
