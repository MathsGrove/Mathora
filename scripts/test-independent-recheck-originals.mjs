import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateExamStyle,reviewPublicPracticeExample} from '../content/marking/exam-style-policy.mjs';

const read=x=>JSON.parse(readFileSync(x,'utf8'));
const payload=read('content/marking/independent-recheck-originals.json');
const old=read('content/marking/route-exam-style-examples.json').items;
const curriculum=read('content/marking/curriculum-coverage.json');
const items=payload.items;
assert.equal(items.length,10,'Exactly ten independent worked originals are expected.');
assert.equal(payload.studentAssignable,false,'Drafts cannot be assigned without real board/year moderation.');
assert.equal(payload.humanModerationCompleted,false,'CI does not provide independent examiner signoff.');
const unique=new Set(),sourceIds=new Set();
let codeCount=0;
for(const item of items){
 assert.ok(!unique.has(item.id),'Independent question IDs must be unique.');
 unique.add(item.id);
 const route=validateExamStyle(item);
 assert.equal(route.studentAssignable,false);
 assert.equal(route.moderated,false);
 assert.equal(item.reviewState,'unmoderated');
 assert.ok(item.question.length>=70&&item.solution.length>=100,
   'Each original question needs a complete prompt and worked explanation.');
 assert.ok(curriculum.families[route.qualification].topics.includes(item.topicKey),
   'Every independent question must have a recognised route-specific curriculum domain.');
 if(item.sourceId){
  const prior=old.find(x=>x.id===item.sourceId);
  assert.ok(prior,'Recheck must reference a real earlier source question.');
  assert.equal(prior.route.qualification,item.route.qualification);
  assert.equal(prior.route.level,item.route.level);
  assert.notEqual(prior.question,item.question,'A recheck cannot simply repeat the marked question.');
  assert.ok(!sourceIds.has(item.sourceId),'Only one held-out recheck per original source in this pilot.');
  sourceIds.add(item.sourceId);
 }
 const awards=item.criteria.map(x=>({id:x.id,awarded:true,
  note:'Fictional examiner explicitly observed the correct independent mathematical step.'}));
 const reviewed=reviewPublicPracticeExample(item,{awards,completeReview:true});
 assert.equal(reviewed.earned,item.maxMarks);
 assert.equal(reviewed.possible,item.maxMarks);
 assert.equal(reviewed.publishable,false);
 assert.equal(reviewed.reportEligible,false);
 codeCount+=item.criteria.length;
}
assert.equal(sourceIds.size,6,'Six fresh parameter rechecks should map to the six prior multi-mark original examples.');
assert.equal(items.filter(x=>x.sourceId===null).length,4);
assert.equal(codeCount,42,'Every one of 42 available marks has an explicit criterion.');
const routes=items.map(x=>x.route.qualification+':'+x.route.level);
for(const x of ['IB:AA SL','IB:AI HL','Further Mathematics:AS','IGCSE:Extended']){
 assert.ok(routes.includes(x),'Expected unfilled level or topic candidate '+x);
}

// SECOND-PASS MATHEMATICS: independent calculations, not copied answer strings.
const near=(x,y)=>assert.ok(Math.abs(x-y)<1e-10,'Maths values differ '+x+' versus '+y);
for(const x of [4,-3])assert.equal(x*x-x-12,0);
near(.24*200,48);
const integrand=x=>9*x*x+2*x-7;
const primitive=x=>3*x*x*x+x*x-7*x;
for(const x of [-3,-.5,0,1,4]){
 const h=1e-5;
 assert.ok(Math.abs((primitive(x+h)-primitive(x-h))/(2*h)-integrand(x))<1e-7);
}
for(const imag of [-2,2]){
 const real=-1;
 assert.equal(real*real-imag*imag+2*real+5,0);
 assert.equal(2*real*imag+2*imag,0);
}
const h=x=>x*x*x-12*x, hd=x=>3*x*x-12, hdd=x=>6*x;
for(const x of [-2,2])near(hd(x),0);
assert.deepEqual([h(-2),h(2),hdd(-2),hdd(2)],[16,-16,-12,12]);
const data=[2,3,6,7,12];
assert.equal(data.reduce((a,b)=>a+b,0)/5,6);
assert.equal(data[2],6);
const f=x=>2*x+3,g=x=>x*x-1;
assert.equal(g(f(2)),48);
assert.equal(f(4),11);
assert.deepEqual([g(f(0)),f(g(0))],[8,1]);
const P=t=>800*Math.pow(1.05,t);
near(P(3),926.1);
assert.ok(P(4)<1000&&P(5)>1000);
const threshold=Math.log(1.25)/Math.log(1.05);
assert.ok(threshold>4&&threshold<5);
function multiply(A,B){
 return A.map(row=>B[0].map((_,j)=>row.reduce((sum,value,k)=>sum+value*B[k][j],0)));
}
const A=[[1,2],[0,1]],B=[[2,0],[1,1]];
assert.deepEqual(multiply(A,B),[[4,2],[1,1]]);
assert.deepEqual(multiply(B,A),[[2,4],[1,3]]);
assert.equal(Math.sqrt(13*13-5*5),12);
near(5/13,Math.sin(Math.asin(5/13)));
near(5/12,5/Math.sqrt(13*13-5*5));

const baseline=[...old,...read('content/marking/original-rubric-examples.json').examples];
const key=x=>x.route.qualification==='A Level'?'AS_A_LEVEL':x.route.qualification;
let newlyCovered=[];
for(const [family,policy] of Object.entries(curriculum.families)){
 for(const level of policy.levels){
  if(!baseline.some(x=>key(x)===family&&x.route.level===level) &&
     items.some(x=>key(x)===family&&x.route.level===level)){
    newlyCovered.push(family+':'+level);
  }
 }
}
assert.deepEqual(newlyCovered.sort(),['Further Mathematics:AS','IB:AA SL','IB:AI HL'].sort());
console.log('PASS: 10 original independently solved holdout questions, 42 individual marks, 6 genuine fresh-recheck links; independent numerical maths verification; 3 formerly missing levels covered as UNMODERATED drafts.');
