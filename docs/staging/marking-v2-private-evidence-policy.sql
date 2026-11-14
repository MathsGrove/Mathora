-- NEW V2 PRIVATE EVIDENCE POLICY — apply only after safe release review and new private Storage bucket creation.
-- Requires a private Storage API bucket named mg2-original-evidence, file size <=1MiB and allowed MIME image/png, image/jpeg, application/pdf.
-- Does not modify the existing student-work bucket or its policies. No direct storage.objects writes.
BEGIN;

CREATE FUNCTION private.mg2_evidence_path_ok(p_name text)
 RETURNS boolean LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE v_parts text[];
BEGIN
 v_parts:=pg_catalog.string_to_array(p_name,'/');
 IF pg_catalog.cardinality(v_parts)<>3 THEN RETURN false;END IF;
 IF v_parts[1] !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  OR v_parts[2] !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  OR v_parts[3] !~ '^work[.](png|jpg|jpeg|pdf)$'
 THEN RETURN false;END IF;
 RETURN true;
END $$;

CREATE FUNCTION private.mg2_can_upload_evidence(p_name text)
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();v_parts text[];v_attempt uuid;
BEGIN
 IF v_uid IS NULL OR NOT private.mg2_evidence_path_ok(p_name)
 THEN RETURN false;END IF;
 v_parts:=pg_catalog.string_to_array(p_name,'/');
 IF v_parts[1]<>v_uid::text THEN RETURN false;END IF;
 v_attempt:=v_parts[2]::uuid;
 RETURN EXISTS(
  SELECT 1
  FROM private.mg2_attempts a
  JOIN private.mg2_rubrics r ON r.id=a.rubric_id AND r.org_id=a.org_id
  WHERE a.id=v_attempt AND a.student_id=v_uid AND a.status='assigned'
    AND r.status='approved'
    AND private.mg2_has_active_student_plan(v_uid,a.org_id,r.plan)
 );
END $$;

CREATE FUNCTION private.mg2_can_read_evidence(p_name text)
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();v_parts text[];v_attempt uuid;
BEGIN
 IF v_uid IS NULL OR NOT private.mg2_evidence_path_ok(p_name)
 THEN RETURN false;END IF;
 v_parts:=pg_catalog.string_to_array(p_name,'/');
 v_attempt:=v_parts[2]::uuid;
 RETURN EXISTS(
  SELECT 1
  FROM private.mg2_attempts a
  JOIN private.mg2_rubrics r ON r.id=a.rubric_id AND r.org_id=a.org_id
  WHERE a.id=v_attempt AND a.student_id=v_parts[1]::uuid
   AND (
     (a.student_id=v_uid AND
       private.mg2_has_active_student_plan(v_uid,a.org_id,r.plan))
     OR (a.status IN('submitted','released') AND private.is_staff(a.org_id))
   )
 );
END $$;

REVOKE ALL ON FUNCTION
 private.mg2_evidence_path_ok(text),
 private.mg2_can_upload_evidence(text),
 private.mg2_can_read_evidence(text)
 FROM PUBLIC,anon,authenticated;
-- The helpers run from Storage RLS policies; no direct table access is granted.
GRANT EXECUTE ON FUNCTION
 private.mg2_can_upload_evidence(text),
 private.mg2_can_read_evidence(text)
 TO authenticated;
GRANT EXECUTE ON FUNCTION private.mg2_evidence_path_ok(text)
 TO authenticated;

CREATE POLICY mg2_evidence_student_upload ON storage.objects
 FOR INSERT TO authenticated
 WITH CHECK (
  bucket_id='mg2-original-evidence'
  AND private.mg2_can_upload_evidence(name)
 );

CREATE POLICY mg2_evidence_authorised_read ON storage.objects
 FOR SELECT TO authenticated
 USING (
  bucket_id='mg2-original-evidence'
  AND private.mg2_can_read_evidence(name)
 );

-- No UPDATE or DELETE policy: replacements and deletions must not be available
-- through a student-facing client. Exact MIME and maximum file bytes are
-- enforced by the test bucket's allowed_mime_types and file_size_limit.
COMMIT;
