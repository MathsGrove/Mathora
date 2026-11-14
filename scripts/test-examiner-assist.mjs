import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateExaminerRecord,prepareExaminerAwards,proposeRoleFeedback,validReleaseSummary} from '../content/marking/examiner-assist.mjs';
const examples=JSON.parse(readFileSync('content/marking/route-exam-style-examples.json','utf8')).items;
const base=examples.find(x=>x.id==='quadratic-roots-gcse-higher');
const record={
 attempt_id:'abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
 status:'submitted',question:base.question,written_work:'Factor (x−7)(x+2), so roots 7 and −2. Both make the original quadratic zero.',
 criteria:base.criteria,max_marks:base.maxMarks
};
const awards=base.criteria.map((c,i)=>({id:c.id,awarded:i!==2,
 note:i===2?'Student final roots were not recorded clearly.':'Examiner saw valid working and the correct method.'}));
assert.equal(validateExaminerRecord(record),record);
const prepared=prepareExaminerAwards(record,awards);
assert.equal(prepared.length,3);
assert.deepEqual(prepared.map(x=>x.awarded),[true,true,false]);
assert.equal(prepared[0].methodImplied,false);
const preview=proposeRoleFeedback(record,awards);
assert.deepEqual(preview.scorePreview,{earned:2,possible:3});
assert.equal(preview.releaseAuthorised,false);
assert.match(preview.studentSummary,/credit was not awarded/i);
assert.match(preview.studentSummary,/substitut/i);
assert.match(preview.parentSummary,/explain/i);
assert.match(preview.tutorPlan,/Inspect the submitted working/);
assert.ok(preview.criterionFeedback[2].nextStep.includes(base.criteria[2].missingFeedback));
assert.ok(!preview.parentSummary.includes(awards[0].note));
assert.ok(!preview.studentSummary.includes(awards[0].note));
assert.ok(validReleaseSummary(preview.studentSummary));
assert.ok(validReleaseSummary(preview.parentSummary));
assert.ok(validReleaseSummary(preview.tutorPlan));
const all=base.criteria.map(c=>({id:c.id,awarded:true,note:'The examiner checked the awarded mathematical step in full.'}));
const allReport=proposeRoleFeedback(record,all);
assert.equal(allReport.scorePreview.earned,3);
assert.match(allReport.studentSummary,/independently/);
const none=base.criteria.map(c=>({id:c.id,awarded:false,note:''}));
assert.equal(proposeRoleFeedback(record,none).scorePreview.earned,0);
const failed=fn=>assert.throws(fn);
failed(()=>prepareExaminerAwards(record,[awards[0]]));
failed(()=>prepareExaminerAwards(record,awards.map(a=>({...a,awarded:null}))));
failed(()=>prepareExaminerAwards(record,awards.map(a=>({...a,note:'bad'}))));
failed(()=>prepareExaminerAwards(record,[awards[0],awards[0],awards[2]]));
failed(()=>prepareExaminerAwards(record,awards.map(x=>({...x,id:'different'}))));
failed(()=>prepareExaminerAwards(record,[
 {...awards[0],awarded:false},
 awards[1],awards[2]]));
failed(()=>prepareExaminerAwards(record,[
 {...awards[0],awarded:false},
 {...awards[1],awarded:true,methodImplied:true,impliedReason:'Only a vague remark.'},
 awards[2]]));
failed(()=>prepareExaminerAwards({...record,status:'assigned'},awards));
failed(()=>prepareExaminerAwards({...record,max_marks:7},awards));
assert.equal(validReleaseSummary('x'.repeat(14)),false);
assert.equal(validReleaseSummary('x'.repeat(3001)),false);
const src=readFileSync('content/marking/examiner-workbench-ui.mjs','utf8');
assert.ok(!/innerHTML|outerHTML|eval\(|localStorage|sessionStorage/.test(src),
 'Examiner workbench must never inject untrusted learner work as HTML or persist PII in browser storage.');
assert.ok(src.includes('confirmRelease')&&src.includes('verified'));
console.log('PASS: examiner award integrity, dependency checks, fact-based role feedback, parent redaction, explicit release preview and no local PII storage.');
