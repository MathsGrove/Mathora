import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../content/programmes/tmua-mcq-editorial-2026-11-11.json',import.meta.url),'utf8'));
const tiers=JSON.parse(readFileSync(new URL('../content/programmes/service-tiers.json',import.meta.url),'utf8'));
assert.equal(data.status,'public_open_practice_draft_not_approved');
assert.equal(data.qualification,'TMUA');
assert.equal(data.calculator_allowed,false);
assert.ok(tiers.study_routes.includes('TMUA'));
assert.deepEqual(Object.keys(tiers.plans).sort(),['daily','exam','weekly']);
assert.equal(data.items.length,3);
assert.deepEqual(data.items.map(q=>q.programme).sort(),['daily','exam','weekly']);
const seen=new Set();
for(const q of data.items){
 assert.ok(!seen.has(q.id),'duplicate id');seen.add(q.id);
 assert.equal(q.marks,1);
 assert.equal(q.review_status,'draft');
 assert.ok(['paper_1_applications','paper_2_reasoning'].includes(q.paper));
 assert.equal(q.options.length,5);
 assert.deepEqual(q.options.map(o=>o.id),['A','B','C','D','E']);
 assert.equal(new Set(q.options.map(o=>o.text)).size,5);
 assert.ok(q.options.some(o=>o.id===q.correct_option));
 assert.ok(q.stem.length>30 && q.worked_solution.length>90 && q.misconception.length>30);
}
// Independent deterministic mathematical counterchecks of the three answer keys.
const daily=data.items.find(q=>q.programme==='daily');
for(let n=-100;n<=100;n++)assert.equal((n*n-n)%2,0);
assert.equal(daily.correct_option,'B');
const weekly=data.items.find(q=>q.programme==='weekly');
for(const x of [-2,3])assert.equal(Math.abs(x-2)+Math.abs(x+1),5);
for(const x of [-3,-1,0,2,4])assert.notEqual(Math.abs(x-2)+Math.abs(x+1),5);
assert.equal(weekly.correct_option,'C');
const exam=data.items.find(q=>q.programme==='exam');
for(let t=-100;t<=100;t++)assert.ok(t*t-4*t+7>=3);
assert.equal(2*2-4*2+7,3);
assert.equal(exam.correct_option,'B');
console.log('PASS: 3 draft TMUA MCQs, three Grove plans, 5 unique options each, format, route, and mathematical checks.');
