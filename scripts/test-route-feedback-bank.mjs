import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateExamStyle,reviewPublicPracticeExample} from '../content/marking/exam-style-policy.mjs';
import {validateFeedbackBank,buildFictionalFeedbackPlan} from '../content/marking/feedback-bank-model.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const items=read('content/marking/route-exam-style-examples.json').items;
const bank=read('content/marking/route-feedback-bank.json');
const longform=items.filter(x=>x.format==='constructed');
assert.equal(longform.length,6);
assert.equal(bank.entries.length,24);
assert.equal(new Set(bank.entries.map(x=>x.rubricId+':'+x.criterionId)).size,24);
for(const rubric of longform){
 validateExamStyle(rubric);
 assert.equal(validateFeedbackBank(rubric,bank).covered,rubric.maxMarks);
 const allDenied=rubric.criteria.map(c=>({
  id:c.id,awarded:false,note:'Fictional working did not satisfy this exact criterion.'
 }));
 const reviewed=reviewPublicPracticeExample(rubric,{awards:allDenied,completeReview:true});
 assert.equal(reviewed.earned,0);
 const student=buildFictionalFeedbackPlan(rubric,reviewed,bank,'student');
 const parent=buildFictionalFeedbackPlan(rubric,reviewed,bank,'parent');
 const tutor=buildFictionalFeedbackPlan(rubric,reviewed,bank,'tutor');
 assert.equal(student.nextSteps.length,rubric.maxMarks);
 assert.equal(parent.support.length,rubric.maxMarks);
 assert.equal(tutor.teaching.length,rubric.maxMarks);
 assert.deepEqual(student.score,{earned:0,possible:rubric.maxMarks});
 assert.equal(parent.teaching,undefined);
 assert.equal(parent.nextSteps,undefined);
 assert.equal(student.teaching,undefined);
 assert.equal(tutor.releaseAuthorised,false);
 assert.ok(!JSON.stringify(parent).includes('Fictional working did not satisfy'));
 assert.ok(!JSON.stringify(student).includes('Fictional working did not satisfy'));
 assert.ok(JSON.stringify(tutor).includes('Fictional working did not satisfy'));
 for(const step of student.nextSteps){
  assert.ok(step.whatToTry.length>35 && step.checkYourWork.length>35 && step.futureRecheck.length>35);
 }
 const allGranted=rubric.criteria.map(c=>({
  id:c.id,awarded:true,note:'Fictional examiner observed valid solution working for this exact mark.'
 }));
 const granted=reviewPublicPracticeExample(rubric,{awards:allGranted,completeReview:true});
 const completed=buildFictionalFeedbackPlan(rubric,granted,bank,'student');
 assert.equal(completed.nextSteps.length,0,'Do not invent a missing skill when every mark was earned.');
}
const unknown=structuredClone(bank);unknown.entries.push({...bank.entries[0],rubricId:longform[0].id,criterionId:'made-up'});
assert.throws(()=>validateFeedbackBank(longform[0],unknown),/absent from the signed rubric/);
const incomplete=structuredClone(bank);incomplete.entries.shift();
assert.throws(()=>validateFeedbackBank(longform[0],incomplete),/exactly one reviewed feedback entry/);
const script=readFileSync('content/marking/reviewer-lab.js','utf8');
assert.ok(script.includes('buildFictionalFeedbackPlan')&&script.includes('validateFeedbackBank'));
assert.ok(script.includes('route-feedback-bank.json'));
assert.ok(!/localStorage|sessionStorage|supabase.*createClient/i.test(script));
console.log('PASS — 24 detailed feedback checkpoints across six qualification/level examples, human-credit-only corrections, parent redaction, tutor interventions, no invented unearned credit and no network-connected learner data.');
