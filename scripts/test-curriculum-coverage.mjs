import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EXAM_STYLES,validateExamStyle} from '../content/marking/exam-style-policy.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const syllabus=read('content/marking/curriculum-coverage.json');
const examples=read('content/marking/route-exam-style-examples.json').items;
const legacy=read('content/marking/original-rubric-examples.json').examples;
assert.deepEqual(Object.keys(syllabus.families).sort(),Object.keys(EXAM_STYLES).sort());
assert.equal(syllabus.qualityGates.allowReleaseFromPublicEditorial,false);
const existingTags={
 'ratio-kits-gcse-foundation':'ratio',
 'intersection-igcse-extended':'algebra',
 'stationary-points-alevel':'differentiation'
};
const rows=[];
for(const example of examples){
 validateExamStyle(example);
 rows.push({qualification:example.route.qualification,level:example.route.level,
  topic:example.curriculumTopicKey,plan:example.plan,moderated:false,id:example.id});
}
for(const example of legacy){
 const qualification=example.route.qualification==='A Level'?'AS_A_LEVEL':example.route.qualification;
 rows.push({qualification,level:example.route.level,topic:existingTags[example.id],
  plan:'weekly',moderated:false,id:example.id});
}
assert.equal(rows.length,11);
const ids=new Set(rows.map(x=>x.id));
assert.equal(ids.size,11,'Each practice draft must have a unique ID');
const missingTopics=[];
const missingLevels=[];
for(const [name,route] of Object.entries(syllabus.families)){
 assert.deepEqual(route.levels,EXAM_STYLES[name].levels);
 assert.ok(route.reference.startsWith('https://'));
 const covered=rows.filter(x=>x.qualification===name);
 for(const row of covered){
  assert.ok(route.levels.includes(row.level),row.id+' invalid academic level');
  assert.ok(route.topics.includes(row.topic),row.id+' missing curriculum taxonomy');
  assert.equal(row.moderated,false);
 }
 for(const topic of route.topics){
  if(!covered.some(x=>x.topic===topic))missingTopics.push(name+':'+topic);
 }
 for(const level of route.levels){
  if(!covered.some(x=>x.level===level))missingLevels.push(name+':'+level);
 }
}
assert.ok(missingTopics.length>0,'Do not claim complete curriculum coverage from illustrative samples');
assert.ok(missingLevels.includes('IB:AA SL'));
assert.ok(missingLevels.includes('IB:AI HL'));
assert.ok(missingLevels.includes('TMUA:Paper 1')===false);
assert.ok(missingTopics.includes('IGCSE:trigonometry'));
assert.equal(rows.filter(x=>x.moderated).length,0,'No publicly included draft is released/moderated');
const plans=new Set(examples.map(x=>x.plan));
assert.deepEqual([...plans].sort(),['daily','exam','weekly']);
console.log('PASS: 6 route families; 11 original public drafts checked against explicit academic level/topic keys; '+missingTopics.length+
 ' curriculum-topic gaps and '+missingLevels.length+
 ' academic-level gaps truthfully flagged. Publication remains blocked pending moderation.');
