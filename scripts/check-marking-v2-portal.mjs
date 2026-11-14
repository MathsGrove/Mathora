import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=path=>readFileSync(path,'utf8');
const cfg=read('mathsgrove-config.js');
const student=read('portal.js'),studio=read('studio.js');
const studentHtml=read('portal.html'),staffHtml=read('studio.html');
const client=read('content/marking/staging-rpc-client.mjs');
const author=read('content/marking/original-authoring-ui.mjs');
const feed=read('content/marking/student-assignment-feed.mjs');
const marking=read('content/marking/examiner-workbench-ui.mjs');
const moderation=read('content/marking/examiner-moderation-ui.mjs');
const pages=read('.github/workflows/pages.yml');
const workflow=read('.github/workflows/assessment-marking-integration-ci.yml');
assert.match(cfg,/markingV2Enabled:\s*false/,'Original marking must remain off until independently released.');
assert.match(studentHtml,/<section id="mg2-student-pilot"[^>]*hidden/);
assert.match(staffHtml,/<section id="mg2-staff-pilot"[^>]*hidden/);
assert.match(student,/config\.markingV2Enabled!==true/);
assert.match(studio,/config\.markingV2Enabled!==true/);
assert.match(student,/state\.member\?\.member_role!=='student'/);
assert.match(studio,/!markRole\(\)\|\|!state\.membership/);
assert.match(student,/createControlledMarkingClient\(sb,\{enabled:true,pilotApproved:true\}\)/);
assert.match(studio,/createControlledMarkingClient\(db,\{enabled:true,pilotApproved:true\}\)/);
assert.match(client,/createExperimentalMarkingClient/);
assert.match(client,/createControlledMarkingClient/);
assert.match(client,/return rpc\('mg2_author_original_draft'/);
assert.match(client,/return rpc\('mg2_my_original_assignments'/);
assert.match(client,/return rpc\('mg2_assignable_originals'/);
assert.match(studio,/mountOriginalAuthoring/);
assert.match(studio,/mountQuestionModeration/);
assert.match(studio,/mountExaminerReviewQueue/);
assert.match(student,/mountStudentOriginalAssignments/);
assert.match(author,/sourceDeclaration:/);
assert.match(author,/question:question\.value,solution:solution\.value,criteria:awards/);
assert.match(feed,/mountConstructedPractice/);
assert.match(feed,/client\.studentReport/);
assert.match(marking,/confirmRelease/);
assert.match(moderation,/signoffRubric/);
for(const content of [author,feed,marking,moderation]){
 assert.ok(!/\.(?:innerHTML|outerHTML)\s*=/.test(content),
  'Never insert student working or examiner annotations through raw HTML.');
 assert.ok(!/\b(?:localStorage|sessionStorage)\s*[.[]/.test(content),
  'No unencrypted student content in browser persistent storage.');
}
assert.ok(!/cp .*content\/marking\/route-exam-style-examples|cp .*content\/marking\/original-rubric-examples/.test(pages),
 'Public deployment must not upload examiner solutions and answer keys.');
for(const f of [
 'content/marking/original-authoring-ui.mjs',
 'content/marking/student-assignment-feed.mjs',
 'content/marking/staging-rpc-client.mjs',
 'content/marking/examiner-workbench-ui.mjs',
 'content/marking/examiner-moderation-ui.mjs'
]){
 execFileSync('node',['--check',f],{stdio:'pipe',timeout:8000});
}
for(const f of ['portal.js','studio.js']){
 const result=execFileSync('node',['--input-type=module','--check'],{
  input:read(f),encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:8000
 });
 assert.equal(result,'');
}
assert.match(workflow,/marking-v2-operational-interfaces\.sql/);
console.log('PASS — role-gated student and examiner portal integration, disabled production flag, private marking authoring and solution-safe DOM rendering.');
