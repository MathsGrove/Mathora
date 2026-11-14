import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateRubric,assessExaminerAwards,buildFictionalRoleReport} from '../content/marking/criterion-engine.mjs';

const examples=JSON.parse(readFileSync('content/marking/original-rubric-examples.json','utf8')).examples;
assert.equal(examples.length,3);
assert.deepEqual(examples.map(x=>x.route.qualification),['GCSE','IGCSE','A Level']);
assert.deepEqual(examples.map(x=>x.maxMarks),[4,5,6]);
for(const rubric of examples){
 assert.equal(validateRubric(rubric).total,rubric.criteria.length);
 assert.ok(rubric.criteria.some(x=>x.code==='M1'));
 assert.ok(rubric.criteria.some(x=>x.code==='A1'));
 assert.ok(rubric.solution.length>100);
 assert.equal(rubric.route.syllabusStatus,'Needs examiner mapping');
}

const note='Correct mathematical step visible in fictional student working.';
const fullAwards=rubric=>rubric.criteria.map(c=>({id:c.id,awarded:true,note}));
const passed=examples.map(r=>assessExaminerAwards(r,fullAwards(r),{completeReview:true}));
assert.deepEqual(passed.map(x=>[x.earned,x.possible]),[[4,4],[5,5],[6,6]]);

const [gcse,igcse,level]=examples;
const partial=assessExaminerAwards(gcse,[
 {id:'m-total-parts',awarded:true,note:'Student added five and three equal parts.'},
 {id:'m-one-part',awarded:true,note:'Student divided 96 by 8 to get 12.'},
 {id:'a-red',awarded:false,note:'Multiplied by four rather than five.'},
 {id:'b-blue',awarded:false,note:'Blue quantity was not calculated.'}
],{completeReview:true});
assert.equal(partial.earned,2);
assert.equal(partial.reviewed,true);
assert.equal(partial.publishable,false);
assert.equal(partial.criteria.filter(c=>c.status==='awarded').length,2);

const student=buildFictionalRoleReport(gcse,partial,'student');
const guardian=buildFictionalRoleReport(gcse,partial,'parent');
const tutor=buildFictionalRoleReport(gcse,partial,'tutor');
assert.deepEqual(student.score,{earned:2,possible:4});
assert.equal(student.checkpoints.length,4);
assert.match(student.nextPractice,/Multiply/);
assert.equal(guardian.checkpoints,undefined);
assert.equal(guardian.evidence,undefined);
assert.equal(guardian.intervention,undefined);
assert.equal(tutor.checkpoints.length,4);
assert.match(tutor.intervention,/contrasting example/);
assert.equal(tutor.checkpoints[0].code,'M1');
assert.equal(tutor.checkpoints[0].evidence,'Student added five and three equal parts.');

// B1 is independent: it can be awarded without an M1.
const independent=assessExaminerAwards(gcse,[{id:'b-blue',awarded:true,note:'Blue share 36 using 3 eighths.'}]);
assert.equal(independent.earned,1);
assert.deepEqual(independent.missing,['m-total-parts','m-one-part','a-red']);
assert.throws(()=>buildFictionalRoleReport(gcse,independent,'student'),/fully examiner-reviewed/);

const noMethod=fullAwards(gcse).map(a=>a.id==='m-one-part'?{...a,awarded:false}:a);
assert.throws(()=>assessExaminerAwards(gcse,noMethod,{completeReview:true}),/requires earlier credit/);
const implied=noMethod.map(a=>a.id==='a-red'
 ?{...a,methodImplied:true,impliedReason:'The student gave 60 red kits and wrote 5 eighths of 96 explicitly.'}
 :a);
assert.equal(assessExaminerAwards(gcse,implied,{completeReview:true}).earned,3);
assert.throws(()=>assessExaminerAwards(gcse,implied.map(a=>a.id==='a-red'?{...a,impliedReason:'guess'}:a),{completeReview:true}),/Explain the specific/);

for(const invalid of [
 [{id:'m-total-parts',awarded:true,note:'tiny'}],
 [{id:'m-total-parts',awarded:1,note}],
 [{id:'m-total-parts',awarded:true,note},{id:'m-total-parts',awarded:true,note}],
 [{id:'unknown',awarded:false}],
]) assert.throws(()=>assessExaminerAwards(gcse,invalid),/note|true or false|unique|unknown/);
assert.throws(()=>assessExaminerAwards(gcse,[],{completeReview:true}),/Complete every criterion/);
assert.throws(()=>buildFictionalRoleReport(gcse,partial,'public'),/Unknown audience/);

const wrongMax=structuredClone(gcse);wrongMax.maxMarks=5;
assert.throws(()=>validateRubric(wrongMax),/Declared marks/);
const cyclic=structuredClone(gcse);cyclic.criteria[0].dependsOn=['m-one-part'];cyclic.criteria[1].dependsOn=['m-total-parts'];
assert.throws(()=>validateRubric(cyclic),/Cyclic/);
const missingM=structuredClone(igcse);missingM.criteria.find(x=>x.id==='a-roots').dependsOn=[];
assert.throws(()=>validateRubric(missingM),/associated method/);

// Independent maths invariants for each original question, unrelated to the stated worked solution.
assert.equal(60+36,96);
assert.equal(60/36,5/3);
const roots=[2+Math.sqrt(10),2-Math.sqrt(10)];
for(const x of roots)assert.ok(Math.abs((x*x-3*x-4)-(x+2))<1e-10);
const curve=x=>x*x*x-6*x*x+9*x+1;
const derivative=x=>3*x*x-12*x+9;
assert.equal(derivative(1),0);
assert.equal(derivative(3),0);
assert.deepEqual([curve(1),curve(3)],[5,1]);
assert.deepEqual([6*1-12,6*3-12],[-6,6]);

const diagram=readFileSync('content/marking/ratio-kits-diagram.svg','utf8');
assert.match(diagram,/<title[^>]*>Original ratio bar/);
assert.match(diagram,/not to scale/i);
console.log('PASS — three original route exemplars (4+5+6 marks), evidence-only awards, M/A dependencies, B independence, scoped fictional reports, mathematical invariants and accessible SVG.');
