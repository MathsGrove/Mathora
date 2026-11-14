-- Isolated fictional learner submission / examiner evidence tests.
-- Run AFTER the earlier "test-marking-v2-postgres.sql" created and approved
-- the original fictional rubric, and AFTER learner-workflow.sql installed.
\set ON_ERROR_STOP on

-- A second fictional learner avoids clashing with the previous legacy attempt.
INSERT INTO auth.users(id,email,email_confirmed_at)
VALUES('cccccccc-cccc-4ccc-8ccc-cccccccccccc','learner-c@example.invalid',now());
INSERT INTO public.memberships(org_id,user_id,member_role)
VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','cccccccc-cccc-4ccc-8ccc-cccccccccccc','student');
INSERT INTO public.student_entitlements(student_id,org_id,tier,starts_at,ends_at)
VALUES('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','exam',now()-interval '1 day',now()+interval '10 days');

-- Wrong organisation and unapproved entitlement cannot be assigned.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
DO $$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_assign_constructed(
   'abcdabcd-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '55555555-5555-4555-8555-555555555555');
 EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%qualifying active programme%';END;
 IF NOT denied THEN RAISE EXCEPTION 'A cross-organisation learner was assigned';END IF;
END $$;
-- Assigned student's access must be based on an actual qualified organisation link.
SELECT (public.mg2_assign_constructed(
 'abcdabcd-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc')->>'attempt_id')::uuid AS attempt_id \gset
SELECT set_config('app.mg2_test_attempt', :'attempt_id',false);

DO $
DECLARE duplicate boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_assign_constructed(
   'abcdabcd-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
 EXCEPTION WHEN unique_violation THEN duplicate:=true;END;
 IF NOT duplicate THEN RAISE EXCEPTION 'Duplicate original-paper assignment allowed';END IF;
END $;

-- An authorised examiner sees no submission or private answer before completion.
DO $$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_examiner_constructed(current_setting('app.mg2_test_attempt')::uuid);
 EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%Submitted examiner record unavailable%';END;
 IF NOT denied THEN RAISE EXCEPTION 'Unsubmitted working exposed to examiner';END IF;
END $$;
-- A staff account cannot masquerade as the learner to submit evidence.
DO $$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_save_constructed(current_setting('app.mg2_test_attempt')::uuid,
   'Fictional working submitted from a staff identity.',NULL,false);
 EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%Only the assigned learner%';END;
 IF NOT denied THEN RAISE EXCEPTION 'Examiner modified student draft';END IF;
END $$;

-- The unrelated second-organisation student cannot read or write learner C.
SELECT set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',false);
DO $$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_my_constructed(current_setting('app.mg2_test_attempt')::uuid);
 EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%not available to this learner%';END;
 IF NOT denied THEN RAISE EXCEPTION 'Other student could see assignment';END IF;
 denied:=false;
 BEGIN
  PERFORM public.mg2_save_constructed(current_setting('app.mg2_test_attempt')::uuid,
   'Other student attempted to overwrite working.',NULL,false);
 EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%Only the assigned learner%';END;
 IF NOT denied THEN RAISE EXCEPTION 'Other student could overwrite draft';END IF;
END $$;

-- Anonymous callers have no EXECUTE even if a test GUC pretends to be a student.
RESET ROLE;
SET ROLE anon;
SELECT set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',false);
DO $$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_my_constructed(current_setting('app.mg2_test_attempt')::uuid);
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'Anonymous role received a protected assignment';END IF;
END $$;

RESET ROLE;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',false);

-- Student can read only public question prompt, never the worked solution / rubric.
DO $$
DECLARE j jsonb;v text;
BEGIN
 j:=public.mg2_my_constructed(current_setting('app.mg2_test_attempt')::uuid);
 IF j->>'status'<>'assigned'
    OR (j->>'question') NOT LIKE '%Share 96 fictional kits%'
    OR j ? 'worked_solution' OR j ? 'criteria' OR j ? 'correct_option'
    OR j->>'written_work'<>'' OR (j->>'revision') IS NOT NULL
 THEN RAISE EXCEPTION 'Student prompt leaked private marking data';END IF;
END $$;

-- A too-short final answer must be rejected; a short draft is allowed.
DO $$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_save_constructed(
   current_setting('app.mg2_test_attempt')::uuid,'96 / 8',NULL,true);
 EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%at least 30 characters%';END;
 IF NOT denied THEN RAISE EXCEPTION 'A blank or insufficient constructed response was finalised';END IF;
END $$;

-- First draft has null expected revision and returns revision one.
DO $$
DECLARE j jsonb;
BEGIN
 j:=public.mg2_save_constructed(current_setting('app.mg2_test_attempt')::uuid,
  'I added five red parts and three blue parts to make eight.',NULL,false);
 IF (j->>'revision')::int<>1 OR j->>'status'<>'assigned'
 THEN RAISE EXCEPTION 'First draft save failed';END IF;
END $$;

-- Old tab (expected revision 0) must fail rather than overwrite a newer answer.
DO $$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_save_constructed(current_setting('app.mg2_test_attempt')::uuid,
   'Old tab overwriting draft working.',0,false);
 EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%Invalid saved-work revision%';END;
 IF NOT denied THEN RAISE EXCEPTION 'Nonpositive revision was accepted';END IF;
 denied:=false;
 BEGIN
  PERFORM public.mg2_save_constructed(current_setting('app.mg2_test_attempt')::uuid,
   'Old tab with the wrong version.',NULL,false);
 EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%Stale answer revision%';END;
 IF NOT denied THEN RAISE EXCEPTION 'Old tab overwrote new working';END IF;
END $$;

DO $$
DECLARE j jsonb;
BEGIN
 j:=public.mg2_save_constructed(current_setting('app.mg2_test_attempt')::uuid,
  'There are eight parts. 96 ÷ 8 = 12 for each part.',1,false);
 IF (j->>'revision')::int<>2 OR j->>'submitted'<>'false'
 THEN RAISE EXCEPTION 'Second draft revision was not incremented';END IF;
END $$;

-- Revoking paid programme access prevents a further save while still assigned.
RESET ROLE;
UPDATE public.student_entitlements SET ends_at=now()-interval '1 minute'
 WHERE student_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',false);
DO $$
DECLARE denied boolean:=false;
BEGIN
 BEGIN PERFORM public.mg2_my_constructed(current_setting('app.mg2_test_attempt')::uuid);
 EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%not available to this learner%';END;
 IF NOT denied THEN RAISE EXCEPTION 'Expired learner could read assigned work';END IF;
 denied:=false;
 BEGIN
  PERFORM public.mg2_save_constructed(current_setting('app.mg2_test_attempt')::uuid,
   'Even with expired entitlement I tried to submit.',2,true);
 EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%Active approved learner assignment%';END;
 IF NOT denied THEN RAISE EXCEPTION 'Expired learner could submit working';END IF;
END $$;
RESET ROLE;
UPDATE public.student_entitlements SET ends_at=now()+interval '10 days'
 WHERE student_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';

-- Atomic final answer saves latest work and transitions to submitted; no repeat.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',false);
DO $$
DECLARE j jsonb;
BEGIN
 j:=public.mg2_save_constructed(current_setting('app.mg2_test_attempt')::uuid,
  'Five plus three gives eight units. 96 / 8 = 12; 5 × 12 = 60 and 3 × 12 = 36.',2,true);
 IF (j->>'revision')::int<>3 OR j->>'status'<>'submitted'
 THEN RAISE EXCEPTION 'Finalised answer revision or state incorrect';END IF;
END $$;
DO $$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_save_constructed(current_setting('app.mg2_test_attempt')::uuid,
   'Trying to overwrite after final submission.',3,false);
 EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%Only the assigned learner%';END;
 IF NOT denied THEN RAISE EXCEPTION 'Final submitted work was editable';END IF;
END $$;

-- Other-org examiner must never see raw working or the private mark scheme.
SELECT set_config('request.jwt.claim.sub','99999999-9999-4999-8999-999999999999',false);
DO $$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_examiner_constructed(current_setting('app.mg2_test_attempt')::uuid);
 EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%Submitted examiner record unavailable%';END;
 IF NOT denied THEN RAISE EXCEPTION 'Other-org examiner read confidential working';END IF;
END $$;

-- Authorised examiner in the same organisation sees submission + marking rubric.
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
DO $$
DECLARE j jsonb;
BEGIN
 j:=public.mg2_examiner_constructed(current_setting('app.mg2_test_attempt')::uuid);
 IF (j->>'status')<>'submitted'
    OR (j->>'written_work') NOT LIKE '%five plus three%' -- case-insensitive test below
 THEN
  IF j->>'status'<>'submitted' OR (j->>'written_work') NOT LIKE '%Five plus three%'
   THEN RAISE EXCEPTION 'Authorised examiner missing submitted evidence';END IF;
 END IF;
 IF jsonb_array_length(j->'criteria')<>3 OR (j->>'worked_solution') NOT LIKE '%red=60%'
 THEN RAISE EXCEPTION 'Examiner mark scheme is incomplete';END IF;
END $$;

-- Human examiner uses the existing server-side criterion mark-and-release endpoint.
SELECT public.mg2_staff_mark(current_setting('app.mg2_test_attempt')::uuid,
 '[{"id":"m-parts","awarded":true,"note":"Eight total parts correctly found."},
   {"id":"a-unit","awarded":true,"note":"One part correctly calculated as twelve."},
   {"id":"b-check","awarded":true,"note":"The learner checked both colour totals."}]'::jsonb,
 true,
 'You identified the total number of parts and applied a correct method.',
 'Praise the clear ratio model and encourage a new independent example.',
 'Use a fresh percentage-versus-ratio comparison to strengthen transfer.');

-- Parent visibility still requires an active link; C has no linked parent.
SELECT set_config('request.jwt.claim.sub','66666666-6666-4666-8666-666666666666',false);
DO $$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  PERFORM public.mg2_family_report(current_setting('app.mg2_test_attempt')::uuid,'parent');
 EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%not found%';END;
 IF NOT denied THEN RAISE EXCEPTION 'Unlinked parent read a different learner report';END IF;
END $$;

-- Verify locked final work, single snapshot and database-computed grade.
RESET ROLE;
DO $$
DECLARE v_score integer;v_count integer;v_status text;denied boolean:=false;
BEGIN
 SELECT score,status INTO v_score,v_status FROM private.mg2_attempts
  WHERE id=current_setting('app.mg2_test_attempt')::uuid;
 SELECT count(*) INTO v_count FROM private.mg2_releases
  WHERE attempt_id=current_setting('app.mg2_test_attempt')::uuid;
 IF v_score<>3 OR v_status<>'released' OR v_count<>1
 THEN RAISE EXCEPTION 'Published score was not derived from examiner criterion awards';END IF;
 BEGIN
  UPDATE private.mg2_student_work SET written_work='Fabricated replacement'
   WHERE attempt_id=current_setting('app.mg2_test_attempt')::uuid;
 EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%immutable%';END;
 IF NOT denied THEN RAISE EXCEPTION 'Submitted working was not immutable';END IF;
END $$;
SELECT 'PASS: fictional constructed-response assignment, own-draft revisions, save/finalise, revocation, staff-only marking evidence, and immutable release' AS result;
