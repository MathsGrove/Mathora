import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessExaminerAwards} from '../content/marking/criterion-engine.mjs';
import {validateFeedbackBank,buildFictionalFeedbackPlan} from '../content/marking/feedback-bank-model.mjs';
const rubrics=JSON.parse(readFileSync('content/marking/original-rubric-examples.json','utf8')).examples;
const bank=JSON.parse(readFileSync('content/marking/criterion-feedback-bank.json','utf8'));
assert.equal(bank.status,'public_editorial_feedback_only');
assert.equal(bank.entries.length,15);
assert.deepEqual(rubrics.map(r=>validateFeedbackBank(r,bank).covered),[4,5,6]);
const review=(rubric,missed=[])=>assessExaminerAwards(rubric,
 rubric.criteria.map(c=>({
  id:c.id,awarded:!missed.includes(c.id),
  note:missed.includes(c.id)?'Working does not satisfy criterion.':
   'Fictional independent working demonstrates the awarded step.'
 })),{completeReview:true});
const [gcse,igcse,level]=rubrics;
const evaluated=review(gcse,['a-red','b-blue']);
assert.equal(evaluated.earned,2);
const student=buildFictionalFeedbackPlan(gcse,evaluated,bank,'student');
const parent=buildFictionalFeedbackPlan(gcse,evaluated,bank,'parent');
const tutor=buildFictionalFeedbackPlan(gcse,evaluated,bank,'tutor');
assert.deepEqual(student.score,{earned:2,possible:4});
assert.equal(student.nextSteps.length,2);
assert.equal(student.nextSteps[0].skill,'Calculate the red share');
assert.match(student.nextSteps[0].whatToTry,/Multiply/);
assert.match(student.nextSteps[0].futureRecheck,/120/);
assert.equal(parent.support.length,2);
assert.equal(parent.teaching,undefined);
assert.equal(parent.nextSteps,undefined);
assert.equal(parent.observedWorking,undefined);
assert.equal(tutor.teaching.length,2);
assert.match(tutor.teaching[0].observedWorking,/does not satisfy/);
assert.match(tutor.message,/not a proven misconception/);
assert.ok(!JSON.stringify(parent).includes('Working does not satisfy criterion.'),
 'A guardian must never receive examiner-only evidence notes.');
assert.ok(!JSON.stringify(student).includes('Working does not satisfy criterion.'),
 'Student preview uses constructive next steps, not private staff evidence.');
assert.equal(parent.releaseAuthorised,false);
assert.equal(tutor.releaseAuthorised,false);
assert.equal(student.oneQuestionOnly,true);

const all=buildFictionalFeedbackPlan(gcse,review(gcse),bank,'student');
assert.deepEqual(all.nextSteps,[]);
assert.match(all.message,/fresh question/);
const zero=buildFictionalFeedbackPlan(level,review(level,level.criteria.map(c=>c.id)),bank,'parent');
assert.equal(zero.score.earned,0);
assert.equal(zero.support.length,6);
assert.ok(!/mastered|predicted grade|guaranteed/i.test(JSON.stringify(zero)));
const igcseReview=buildFictionalFeedbackPlan(igcse,review(igcse,['m-equate','a-roots']),bank,'tutor');
assert.equal(igcseReview.teaching.length,2);
assert.deepEqual(igcseReview.teaching.map(x=>x.markCode),['M1','A1']);

const uncovered=structuredClone(bank);uncovered.entries.pop();
assert.throws(()=>validateFeedbackBank(level,uncovered),/exactly one reviewed/);
const dup=structuredClone(bank);dup.entries.push({...dup.entries[0]});
assert.throws(()=>validateFeedbackBank(gcse,dup),/Duplicate feedback/);
const excessive=structuredClone(bank);excessive.entries[0].studentCorrection='This proves the pupil is lazy and failing';
assert.throws(()=>validateFeedbackBank(gcse,excessive),/must not overstate|meaningful original guidance/);
const unfinished=assessExaminerAwards(gcse,[{id:'m-total-parts',awarded:false}],{completeReview:false});
assert.throws(()=>buildFictionalFeedbackPlan(gcse,unfinished,bank,'student'),/complete fictional examiner review/);
const forged=structuredClone(evaluated);forged.earned=4;
assert.throws(()=>buildFictionalFeedbackPlan(gcse,forged,bank,'parent'),/match examiner-awarded/);
assert.throws(()=>buildFictionalFeedbackPlan(gcse,evaluated,bank,'administrator'),/Unknown feedback audience/);
assert.throws(()=>buildFictionalFeedbackPlan(gcse,{...evaluated,publishable:true},bank,'tutor'),/complete fictional examiner review/);

const source=readFileSync('content/marking/feedback-bank-model.mjs','utf8');
assert.ok(!/\b(?:fetch\s*\(|localStorage|sessionStorage|supabase|\.rpc\s*\(|innerHTML)\b/.test(source));
assert.ok(!source.includes('releaseReport('));
console.log('PASS — 15 original feedback entries across 3 qualifications, examiner-award-based next steps, parent/tutor separation, no invented diagnosis and no learner data/API access.');
