import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
async function moduleFrom(path){
 const src=read(path);
 return import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
}
const {buildExaminerRecords,sortExaminerRecords,scheduleComparison}=await moduleFrom('examiner-workspace.js');
const {buildStudentFeed}=await moduleFrom('student-release-feed.js');

const students=[{id:'s1',name:'Learner A',pref:{qualification:'GCSE'}},{id:'s2',name:'Learner B'}];
const paper={id:'p1',student_id:'s2',status:'submitted',paper_mode:'weekly',
 qualification:'IGCSE',submitted_at:'2026-11-07T14:00:00Z'};
const practice={task_id:'t1',student_id:'s1',status:'completed',review_status:'awaiting_review',
 due_date:'2026-11-01',submitted_at:'2026-11-04T14:00:00Z',mode:'exam_daily'};
const released={task_id:'t2',student_id:'s1',status:'completed',review_status:'released',
 due_date:'2026-11-06',submitted_at:'2026-11-06T17:00:00Z',mode:'weekly'};
const rows=buildExaminerRecords(students,[paper],[practice,released]);
assert.equal(rows.length,3);
assert.equal(rows.filter(r=>r.stage==='submitted').length,2);
assert.equal(rows.find(r=>r.id==='t2').stage,'released');
assert.equal(rows.find(r=>r.id==='p1').scheduled_at,null,
 'Do not invent a due date for self-created papers');
assert.equal(sortExaminerRecords(rows)[0].id,'t1',
 'Oldest submitted assignment must be first in examiner inbox');
assert.equal(sortExaminerRecords(rows)[1].id,'p1');
assert.equal(scheduleComparison(practice).type,'after');
assert.match(scheduleComparison(practice).label,/after scheduled day/);
assert.equal(scheduleComparison({...practice,submitted_at:'2026-11-01T14:00:00Z'}).type,'scheduled');
assert.equal(scheduleComparison({submitted_at:'2026-11-05T12:00:00Z'}).type,'unknown');
assert.ok(!read('examiner-workspace.js').includes('.innerHTML='));
assert.ok(read('examiner-workspace.js').includes('onStudentFocus'));
assert.ok(read('assigned-admin.js').includes('state.assignedAllRows=rows;'));
assert.ok(read('assigned-admin.js').includes('submitted_at'));
assert.ok(read('studio.js').includes("import { initExaminerWorkspace }"));
assert.ok(read('studio.html').includes('id="mg-examiner-workspace"'));
assert.ok(read('studio.html').includes('id="marking-student-filter"'));

const paperReleased={id:'p2',qualification:'GCSE',paper_mode:'topic',status:'marked',
 submitted_at:'2026-11-06T12:00:00Z'};
const paperPending={id:'p3',status:'submitted',qualification:'GCSE'};
const feed=buildStudentFeed({
 history:[{task_id:'t2',date:'2026-11-05',score:4,total:8,mode:'weekly',
  feedback:'Revise transformations',feedback_updated_at:'2026-11-07T14:00:00Z'}]
},[paperReleased,paperPending],
 [{attempt_id:'p2',released_at:'2026-11-08T10:00:00Z',
 overview:'Excellent work',next_steps:'Revisit ratio questions'}]);
assert.equal(feed.length,2,'Unreleased student attempts must not appear');
assert.equal(feed[0].id,'paper:p2','Newest examiner release must appear first');
assert.equal(feed[0].feedback,'Revisit ratio questions');
assert.equal(feed[1].feedback,'Revise transformations');
assert.ok(!feed.some(r=>r.id==='paper:p3'));
assert.ok(!read('student-release-feed.js').includes('.innerHTML='));
assert.ok(read('student-release-feed.js').includes("status==='marked'"));
assert.ok(read('portal.html').includes('id="mg-student-releases"'));
assert.ok(read('portal.js').includes('studentReleaseFeed.update('));
const staffSql=read('supabase/migrations/202611080730_examiner_schedule_submission_metadata.sql');
assert.ok(staffSql.includes('private.is_staff(p_org)'),'Preserve the staff-only schedule scope');
assert.ok(staffSql.includes("'submitted_at',t.submitted_at"));
const studentSql=read('supabase/migrations/202611080731_student_released_feedback_feed.sql');
assert.ok(studentSql.includes('WHERE t.student_id=v_uid AND t.review_status=')&&studentSql.includes("'released'"),
 'Never return draft or other student feedback');
console.log('Examiner and student dashboard checks passed: chronology, student grouping, schedule caveat, released-only feedback, mobile markup and staff/student permissions.');
