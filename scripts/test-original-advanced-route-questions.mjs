import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const path='content/editorial/original-advanced-route-questions-20261113.json';
const file=JSON.parse(readFileSync(path,'utf8'));
assert.equal(file.status,'PUBLIC_EDITORIAL_DRAFT_NOT_FOR_ASSIGNMENT');
assert.equal(file.publicationApproved,false);
assert.equal(file.requiresIndependentReview,true);
assert.equal(file.items.length,3);
const ids=new Set();
for(const q of file.items){
 assert.ok(!ids.has(q.id),'Question IDs must be unique');ids.add(q.id);
 assert.equal(q.route.syllabusStatus,'editorial_mapping_pending');
 assert.equal(q.marks.reduce((n,x)=>n+x.points,0),q.maxMarks);
 assert.equal(q.marks.length,q.maxMarks);
 assert.ok(q.solutionSteps.length>=6);
 assert.ok(q.prompt.length>220);
 assert.ok(q.review.length>55);
 assert.ok(q.tierUse.every(x=>['Grove Daily','Grove Weekly','Grove Exam'].includes(x)));
 assert.ok(q.marks.every(x=>/^[MAB]1\b/.test(x.rule)));
}
const close=(actual,expected,tol=1e-9)=>assert.ok(Math.abs(actual-expected)<=tol,
 'Expected '+expected+' got '+actual);
const [ib,further,m1]=file.items;
// Independent logistic checks: P(0), half-capacity crossing, derivative and limiting value.
const P=t=>6000/(1+4*Math.exp(-0.5*t));
const dP=t=>12000*Math.exp(-0.5*t)/(1+4*Math.exp(-0.5*t))**2;
close(P(0),ib.checks.initial);
close(P(2*Math.log(4)),3000);
close(2*Math.log(4),ib.checks.halfCapacityTime);
close(dP(0),ib.checks.growthAtZero);
close((P(1e-5)-P(-1e-5))/(2e-5),dP(0),1e-4);
close(P(100),ib.checks.limit,1e-6);
// Independent complex multiplication and powers; avoid hard-coding the claimed root list as proof.
const mul=([a,b],[c,d])=>[a*c-b*d,a*d+b*c];
const roots=[[Math.sqrt(3),-1],[0,2],[-Math.sqrt(3),-1]];
for(const z of roots){
 const cube=mul(mul(z,z),z);
 close(cube[0],0);close(cube[1],-8);
}
close(roots.reduce((n,z)=>n+z[0],0),further.checks.sumReal);
close(roots.reduce((n,z)=>n+z[1],0),further.checks.sumImag);
const product=roots.reduce((a,z)=>mul(a,z),[1,0]);
close(product[0],0);close(product[1],further.checks.productImag);
// Independent mechanics sign-change intervals and numerical integral consistency.
const v=t=>3*t*t-12*t+9;
const a=t=>6*t-12;
const s=t=>t**3-6*t*t+9*t;
close(a(2),m1.checks.accelerationAtTwo);
assert.deepEqual(m1.checks.restTimes,[1,3]);
for(const t of m1.checks.restTimes)close(v(t),0);
close(s(4)-s(0),m1.checks.displacementAtFour);
const distance=[0,1,3,4].slice(1).reduce((n,t,i)=>n+Math.abs(s(t)-s([0,1,3,4][i])),0);
close(distance,m1.checks.distance);
const numericalIntegral=(fn,l,r,steps=10000)=>{
 const h=(r-l)/steps;let sum=0;
 for(let i=0;i<steps;i++)sum+=fn(l+(i+0.5)*h)*h;
 return sum;
};
close(numericalIntegral(v,0,4),m1.checks.displacementAtFour,1e-5);
close(numericalIntegral(t=>Math.abs(v(t)),0,4),m1.checks.distance,1e-5);
console.log('PASS — 3 original, unpublished questions / 21 marks; logistic, complex roots and mechanics checked independently by substitution, derivatives, finite differences and numerical integration.');
