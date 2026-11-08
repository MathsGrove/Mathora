import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=p=>readFileSync(p,'utf8');
const sql=src('supabase/migrations/20261031_evidence_manual_marking.sql');
const timings=src('supabase/migrations/20261031_baseline_timing_and_evidence.sql');
const archive=src('supabase/migrations/20261031_archive_extended_evidence.sql');
const base=src('baseline.js'),daily=src('assigned-practice.js'),practiceUI=src('portal.html');
const baselineUI=src('baseline.html'),examiner=src('assigned-admin.js'),admin=src('studio.html'),adminJs=src('studio.js');
const evidence=src('evidence-workspace.js'),student=src('portal.js'),workflow=src('.github/workflows/pages.yml');
const archiveEdge=src('supabase/functions/grove-student-export/index.ts');
const tests=[
['Practice never automatically grants marks',sql.includes("score=NULL,submitted_at=now()")&&sql.includes("review_status='awaiting_review'")],
['Only released examiner marks in student practice payload',sql.includes("v_released:=v.review_status='released'")&&sql.includes("CASE WHEN v_released THEN v.score")],
['No correct options leaked in unmarked student review',!sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION private.grove_payload'),sql.indexOf('CREATE OR REPLACE FUNCTION public.grove_staff_review_task')).includes("'correct_option'")],
['Practice examiner can mark each question',sql.includes('grove_staff_mark_task')&&examiner.includes('grove_staff_mark_task')],
['Full examiner marking required for report release',sql.includes("v_count<>v.question_count")&&sql.includes("length(trim(coalesce(p_feedback,'')))<15")],
['Private files bound to student and active assessment',sql.includes('grove_evidence_upload_allowed')&&sql.includes("t.student_id=v_uid")&&sql.includes("s.student_id=v_uid")],
['Student can save photos and drawings',evidence.includes('grove_save_work_evidence')&&evidence.includes("fileKind==='whiteboard'")&&evidence.includes("'photo'")],
['Question navigation flushes working',base.includes('await evidence.flush()')&&daily.includes('await evidence.flush()')],
['Baseline browser focus events retained',base.includes("logEvent('tab_hidden')")&&base.includes("logEvent('window_blur')")],
['Baseline question timing recorded',timings.includes('baseline_question_focus')&&base.includes("baseline_question_focus")],
['Baseline automatic marking retained',timings.includes('PERFORM private.baseline_close(p_session)')],
['Practice report waits for examiner review',daily.includes("task.review_status==='released'")],
['Student progress uses released marks',student.includes('grove_student_insights')&&sql.includes("review_status='released'")],
['Target grade admin controlled',admin.includes('programme-target-grade')&&adminJs.includes('update_student_setup_atomic')&&src('supabase/migrations/202611081200_atomic_student_programme_save.sql').includes('public.grove_admin_set_target(')],
['Student sees exam and plan, not backend jargon',practiceUI.includes('mg-student-route-grid')&&practiceUI.includes('Your progress atlas.')],
['Examiner views secure work image',examiner.includes('createSignedUrl')&&admin.includes('mg-assigned-admin')],
['Baseline examiner evidence',src('baseline-admin.js').includes('grove_staff_evidence')],
['Student archive includes work and manual marks',archive.includes('manual_question_marks')&&archiveEdge.includes('grove_offboarding_extra')],
['All assets deployed',workflow.includes('cp evidence-workspace.js evidence-workspace.css student-analysis.css examiner-evidence.css site/')],
['Responsive whiteboard and analysis',src('evidence-workspace.css').includes('@media')&&src('student-analysis.css').includes('@media')]
];
for(const [test,okay] of tests)assert.ok(okay,'MathsGrove evidence invariant failed: '+test);
console.log('MathsGrove evidence-first, manual marking, and student analysis: '+tests.length+' static checks passed.');
