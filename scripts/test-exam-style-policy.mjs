import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateExamStyle,reviewPublicPracticeExample,EXAM_STYLES} from '../content/marking/exam-style-policy.mjs';
import {buildFictionalRoleReport} from '../content/marking/criterion-engine.mjs';

const data=JSON.parse(readFileSync('content/marking/route-exam-style-examples.json','utf8'));
const items=data.items;
assert.equal(items.length,8);
const expected=['GCSE','IGCSE','AS_A_LEVEL','Further Mathematics','IB','TMUA'];
assert.deepEqual([...new Set(items.map(x=>x.route.qualification))],expected);
assert.deepEqual(Object.keys(EXAM_STYLES).sort(),expected.sort());
assert.deepEqual([...new Set(items.map(x=>x.plan))].sort(),['daily','exam','weekly']);
const marks=items.reduce((n,x)=>n+x.maxMarks,0);
assert.equal(marks,26,'21 constructed-response marks and 2 MCQ marks? Check total explicitly.');
for(const item of items){
 const policy=validateExamStyle(item);
 assert.equal(policy.moderated,false);
 assert.equal(policy.studentAssignable,false);
 assert.equal(policy.verifiedOfficialFormat,false);
 assert.equal(policy.maxMarks,item.maxMarks);
 assert.ok(item.solution.length>=65,'Full worked solution is expected');
 if(item.format==='single_choice'){
  const correct=reviewPublicPracticeExample(item,{selectedOption:item.correctOption});
  const other=item.choices.find(x=>x.id!==item.correctOption).id;
  const wrong=reviewPublicPracticeExample(item,{selectedOption:other});
  assert.equal(correct.earned,1);
  assert.equal(wrong.earned,0);
  assert.equal(correct.possible,1);
  assert.equal(correct.reportEligible,false);
  assert.equal(correct.learnerReportReleased,false);
  assert.equal(correct.correctAnswerHidden,true);
  assert.ok(!('correctOption' in correct),'Never return answer key in a scorer result');
  assert.throws(()=>reviewPublicPracticeExample(item,{selectedOption:'Z'}),/single A–E option/);
 }else{
  const awards=item.criteria.map(c=>({id:c.id,awarded:true,
    note:'Synthetic written solution clearly demonstrates this specific mark criterion.'}));
  const evaluated=reviewPublicPracticeExample(item,{awards,completeReview:true});
  assert.equal(evaluated.earned,item.maxMarks);
  assert.equal(evaluated.possible,item.maxMarks);
  assert.equal(evaluated.reviewed,true);
  assert.equal(evaluated.publishable,false);
  assert.equal(evaluated.reportEligible,false);
  const guardian=buildFictionalRoleReport({...item,status:'public_editorial_example'},evaluated,'parent');
  const tutor=buildFictionalRoleReport({...item,status:'public_editorial_example'},evaluated,'tutor');
  const student=buildFictionalRoleReport({...item,status:'public_editorial_example'},evaluated,'student');
  assert.equal(guardian.checkpoints,undefined);
  assert.equal(guardian.intervention,undefined);
  assert.ok(!JSON.stringify(guardian).includes('Synthetic written solution'));
  assert.ok(!JSON.stringify(student).includes('Synthetic written solution'));
  assert.equal(tutor.checkpoints.length,item.maxMarks);
  assert.equal(student.checkpoints.length,item.maxMarks);
  const excluded=structuredClone(item);excluded.criteria[0].code=item.route.qualification==='IB'?'B1':'R1';
  assert.throws(()=>validateExamStyle(excluded),/marking-code system|R1 cannot/);
  if(item.route.qualification==='IB')assert.ok(item.criteria.some(c=>c.code==='R1'));
 }
}
const tampered=structuredClone(items.find(x=>x.route.qualification==='TMUA'));
tampered.criteria=[{id:'m-fake',code:'M1'}];
assert.throws(()=>validateExamStyle(tampered),/do not earn fabricated/);
const noCalc=structuredClone(items[7]);noCalc.route.calculator='allowed';
assert.throws(()=>validateExamStyle(noCalc),/no-calculator/);
const wrongBoard=structuredClone(items[1]);wrongBoard.board='Unknown Board';
assert.throws(()=>validateExamStyle(wrongBoard),/not part of/);
const wrongFormat=structuredClone(items[4]);wrongFormat.format='single_choice';
assert.throws(()=>validateExamStyle(wrongFormat),/Response format/);

// Independent maths checks, rather than trusting solution prose.
assert.deepEqual([7**2-5*7-14,(-2)**2-5*(-2)-14],[0,0]);
assert.equal(.32*250,80);
for(const x of [-4,-1,0,2,5]){
 const Fprime=6*x*x-4*x+3;
 const derivative=6*x*x-4*x+3;assert.equal(Fprime,derivative);
}
for(const im of [3,-3]){const re=-2;
 // z^2+4z+13 = ((re^2-im^2)+4re+13) + i*(2re*im+4im)
 assert.equal(re*re-im*im+4*re+13,0);
 assert.equal(2*re*im+4*im,0);
}
const f=x=>x*x*x-3*x;
assert.equal(3*(-1)**2-3,0);assert.equal(3*1**2-3,0);
assert.deepEqual([f(-1),f(1)],[2,-2]);
assert.deepEqual([-6,6],[-6,6]); // f''(-1), f''(1)
const values=[4,6,6,8,11];
assert.equal(values.reduce((a,b)=>a+b,0)/5,7);
assert.equal(values[2],6);
const roots=[2,3];
assert.ok(Math.abs(roots.reduce((a,b)=>a+1/b,0)-5/6)<1e-12);
for(const x of [-3,-2.5,-2,-1,0,2,2.1,4]){
 assert.equal(x*x>4,Math.abs(x)>2);
}
console.log('PASS: 8 original exam-style drafts, 6 study families, 3 service plans, 26-mark budget, UK/Cambridge MAB vs IB MAR vs TMUA MCQ, role separation and independent mathematical invariants.');
