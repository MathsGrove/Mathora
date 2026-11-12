import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildReleasedPracticeReport,splitExaminerComment} from '../released-practice-report.mjs';

const privateTask={
 task_id:'fictional-task',mode:'daily',review_status:'awaiting_review',score:null,question_count:3,
 report_note:'Not released.',topics:[{topic:'Algebra',correct:1,total:3}],
 review:[{position:1,topic:'Algebra',mark:0,seconds:58,comment:'Confidential draft comment.'}]
};
assert.equal(buildReleasedPracticeReport(privateTask),null);
assert.equal(buildReleasedPracticeReport({...privateTask,review_status:'submitted'}),null);
assert.equal(buildReleasedPracticeReport(null),null);
const released={
 ...privateTask,review_status:'released',score:2,
 report_note:'Examiner has released the notes below.',
 review:[
  {position:3,topic:'Ratio',mark:1,seconds:42,comment:'Valid proportion shown.'},
  {position:1,topic:'Algebra',mark:0,seconds:58,
   comment:'Examiner observations:\nMethod: Correct equation.\nAccuracy: Sign needs checking.\nNext practice: Substitute your solution and verify both sides.'},
  {position:2,topic:'Geometry',mark:1,seconds:0,comment:''}
 ]
};
const model=buildReleasedPracticeReport(released);
assert.deepEqual(model.score,{earned:2,possible:3});
assert.equal(model.provenance,'released-assigned-practice-only');
assert.equal(model.mode,'Grove Daily · focus practice');
assert.deepEqual(model.questions.map(x=>x.position),[1,2,3]);
assert.equal(model.commentedCount,2);
assert.equal(model.nextStepCount,1);
assert.equal(model.questions[0].mark,0);
assert.equal(model.questions[0].nextPractice,'Substitute your solution and verify both sides.');
assert.match(model.questions[0].observation,/Correct equation/);
assert.equal(model.questions[1].observation,'');
assert.equal(model.questions[2].nextPractice,'');
assert.equal(model.focus[0].topic,'Algebra');
assert.match(model.caveat,/not an official grade/);
assert.doesNotMatch(JSON.stringify(model),/Confidential draft comment|correct_option|answer_key/);

const withUnknownMark=buildReleasedPracticeReport({...released,score:null,
 review:[{position:1,topic:'Algebra',mark:'',comment:'No award evidence.'},
         {position:1,topic:'duplicate',mark:1,comment:'Duplicate discarded.'}]});
assert.equal(withUnknownMark.score,null);
assert.equal(withUnknownMark.questions[0].mark,null);
assert.equal(withUnknownMark.questionCount,1);

assert.deepEqual(splitExaminerComment('No structured next step.'),{observation:'No structured next step.',nextPractice:''});
assert.deepEqual(splitExaminerComment('Next practice: Check the signs.'),{observation:'',nextPractice:'Check the signs.'});
const ui=readFileSync('assigned-practice.js','utf8');
const css=readFileSync('assigned-practice.css','utf8');
const pipeline=readFileSync('.github/workflows/pages.yml','utf8');
assert.match(ui,/import \{buildReleasedPracticeReport\} from '\.\/released-practice-report\.mjs'/);
assert.match(ui,/task\.review_status==='released'/);
assert.match(ui,/document|createEvidenceWorkspace/);
assert.match(ui,/el\('details',undefined,'mg-report-question'\)/);
assert.match(ui,/\.nextPractice/);
assert.match(ui,/if\(!model\)/);
assert.match(css,/prefers-reduced-motion:reduce/);
assert.match(pipeline,/cp released-practice-report\.mjs site\//);
console.log('PASS — private versus released separation, 0/1 mark fidelity, authored next steps only, accessible cards, mobile CSS and Pages asset inclusion.');
