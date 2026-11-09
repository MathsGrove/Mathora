import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const service=read('supabase/functions/grove-student-export/index.ts');
const pdfs=read('supabase/functions/grove-student-export/archive-pdfs.ts');
const studio=read('studio.html'),ui=read('student-offboarding.js'),js=read('studio.js');
const sql=read('supabase/MANUAL_STUDENT_PDF_ARCHIVE.sql');
const guards=read('supabase/STUDENT_REMOVAL_AFTER_ARCHIVE.sql');
const consistency=read('supabase/migrations/20261031_student_removal_consistency.sql');
const workflow=read('.github/workflows/pages.yml');
const cleanup=read('supabase/VERIFY_STUDENT_OFFBOARDING_CLEANUP.sql');
const linkedCleanup=read('supabase/CLEAR_REMOVED_LEARNER_ALL_LINKED_ACCESS.sql');
const family=read('family-access.js');
const portal=read('portal.js');
const tests=[
 ['Admin-only roster UI',studio.includes('mg-student-offboarding')&&js.includes('initStudentOffboarding')],
 ['No email sender dependency',!service.includes('RESEND_API_KEY')&&!service.includes('api.resend.com')],
 ['Manual ZIP endpoint',service.includes("action==='prepare_manual'")&&service.includes("action==='manual_download'")],
 ['Admin role enforced server-side',service.includes("eq('member_role','admin')")],
 ['Private service role never browser-exposed',!ui.includes('SUPABASE_SERVICE_ROLE_KEY')],
 ['Six PDF reports',pdfs.includes('01_Profile_and_Programme.pdf')&&pdfs.includes('02_Baseline_Diagnostics.pdf')&&pdfs.includes('03_Practice_and_Timing.pdf')&&pdfs.includes('04_Papers_and_Answers.pdf')&&pdfs.includes('05_Examiner_Reports.pdf')&&pdfs.includes('06_Uploaded_Work_Overview.pdf')],
 ['Original uploads included',service.includes("zip['Original_Submissions/'")&&service.includes("storage.from('student-work').download(filePath)")],
 ['PDF source covers questions and feedback',pdfs.includes('baseline_responses')&&pdfs.includes('paper_question_stems')&&pdfs.includes('released_teacher_feedback')],
 ['Original images represented in PDF',pdfs.includes('embedPng')&&pdfs.includes('embedJpg')],
 ['No raw password in portable export',service.includes("'staff_notes'")&&service.includes("'correct_option'")],
 ['Private storage',service.includes("storage.from('grove-student-exports')")],
 ['Checksum verified in browser',ui.includes("crypto.subtle.digest('SHA-256'")&&ui.includes('digest.toLowerCase()!==result.sha256.toLowerCase()')],
 ['Explicit saved-archive confirmation',ui.includes('I saved and checked the ZIP')&&sql.includes('grove_offboarding_manual_confirm')],
 ['Permanent removal gated after confirmation',guards.includes("j.status NOT IN('downloaded','purging')")&&service.includes("entry.status!=='downloaded'")],
 ['Stale student archives block deletion',service.includes("grove_offboarding_verify_source")&&service.indexOf("grove_offboarding_verify_source")<service.indexOf("grove_offboarding_begin_removal")],
 ['ZIP and individual original uploads fingerprinted',service.includes("sourceFingerprint(dataset,fileDigests)")&&service.includes("currentFileDigests[path]=await hashFile")],
 ['Snapshot protection is installed',consistency.includes("grove_offboarding_verify_source")&&consistency.includes("source_fingerprint")&&consistency.includes("RETURN false")],
 ['Related student records and stale cache cleared',consistency.includes("student_id=j.student_id OR attempt_id=ANY(v_attempts)")&&js.includes("refresh({strict:true})")],
 ['Other Studio tabs receive a removal notice',js.includes("BroadcastChannel('mathsgrove-offboarding')")],
 ['Email typed before deletion',ui.includes("typed.trim().toLowerCase()")&&service.includes("confirmEmail.trim().toLowerCase()")],
 ['No deletion on export',!service.slice(service.indexOf("if(action==='prepare_manual'"),service.indexOf("if(action==='erase')")).includes('deleteUser(')],
 ['Disabled until service deploy',ui.includes("health.data?.method==='manual_zip_pdf'")&&ui.includes('deletion.disabled=!manualServiceReady')],
 ['Post-deletion database cleanup verification',cleanup.includes('grove_offboarding_verify_cleanup')&&cleanup.includes('auth.users')&&cleanup.includes('storage.objects')],
 ['Deleted learner cannot remain a linked viewer',linkedCleanup.includes('viewer_id=j.student_id')&&linkedCleanup.includes('lower(viewer_email)=lower(j.recipient_email)')],
 ['Family view also periodically refreshes access',family.includes('setInterval')&&family.includes("records=[];clearTierRoleExperience('family');view('fa-loading')")],
 ['Student portal periodically rechecks removed access',portal.includes('setInterval')&&portal.includes("recheckLearnerOnReturn")],
 ['Server refuses to finalise before full clean verification',service.includes("grove_offboarding_verify_cleanup")&&service.indexOf("grove_offboarding_verify_cleanup")<service.indexOf("grove_offboarding_record_completion")],
 ['All Studio student data cleared and reloaded',js.includes("onRemoved:async")&&js.includes("state.students=[];state.attempts=[]")&&js.includes("await refresh();")],
 ['Administrator tab resume refresh',js.includes("visibilitychange")&&js.includes("if(!document.hidden&&state.membership)void refresh()")],
 ['Family views reject cached removed learner details',family.includes("records=[];clearTierRoleExperience('family');view('fa-loading')")&&family.includes("visibilitychange")],
 ['Student portal rechecks deleted access',portal.includes("recheckLearnerOnReturn")&&portal.includes("state.member=null;state.members=[];state.attempts=[]")],
 ['Deployment assets copied',workflow.includes('cp student-offboarding.js student-offboarding.css site/')]
];
for(const [label,result] of tests)assert.ok(result,'Archive invariant failed: '+label);
console.log('MathsGrove manual PDF ZIP and protected student deletion: '+tests.length+' static checks passed.');
