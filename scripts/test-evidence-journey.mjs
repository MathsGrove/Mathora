import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('tier-role-experience.js','utf8');
const tier=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const student=tier.summariseStudentTier('daily',{
 baseline:{status:'submitted'},baseline_topics:[{topic:'Ratio',correct:1,total:3}],
 reviewed:2,submitted:3,reviewed_accuracy:75,visible_minutes:23
});
assert.deepEqual(student.journey.map(x=>x.status),['Recorded','Released','Not yet verified']);
assert.match(student.journey[2].detail,/fresh, separately reviewed question/);
const first=tier.summariseStudentTier('weekly',{
 baseline:{status:'not_started'},baseline_topics:[],reviewed:0,submitted:0
});
assert.deepEqual(first.journey.map(x=>x.status),['Not yet recorded','Awaiting release','Not yet verified']);
assert.equal(tier.summariseStudentTier(null,null).journey[2].status,'Not yet verified');

const fixture={
 view_role:'parent',baseline:{status:'completed'},papers_reviewed:2,
 topics:[{topic:'Ratio',earned:2,available:8,questions:3}],
 teaching_feedback:[{feedback:'TUTOR ONLY HIDDEN METHOD NOTE',marks:2,maximum:8}]
};
const parent=tier.summariseFamilyRole(fixture);
assert.deepEqual(parent.journey.map(x=>x.status),['Recorded','Released','Not yet verified']);
assert.ok(!JSON.stringify(parent).includes('TUTOR ONLY HIDDEN METHOD NOTE'));
const tutor=tier.summariseFamilyRole({...fixture,view_role:'tutor'});
assert.deepEqual(tutor.journey.map(x=>x.status),['Recorded','Released','Not yet verified']);
assert.equal(parent.cards.length,3);
assert.equal(tutor.cards.length,3);
assert.notEqual(parent.journey[1].label,tutor.journey[1].label);
assert.match(tutor.journey[1].detail,/Authorised results/);
const empty=tier.summariseFamilyRole({view_role:'tutor',topics:[]});
assert.equal(empty.journey[2].status,'Not yet verified');
for(const path of ['portal.html','family.html']){
 const html=readFileSync(path,'utf8');
 assert.match(html,/mgtr-(student|family)-evidence-flow/);
 assert.match(html,/aria-label="[^"]*evidence journey"/);
}
const css=readFileSync('tier-role-experience.css','utf8');
assert.match(css,/\.mgtr-evidence-steps/);
assert.match(css,/@media\(max-width:790px\)/);
assert.match(css,/prefers-reduced-motion:reduce/);
assert.ok(!/fetch\s*\(|\.rpc\s*\(|localStorage|sessionStorage|innerHTML/.test(source));
console.log('PASS — student, parent, tutor evidence journeys, truthful unverified recheck, private notes isolation, mobile semantics and no new network/storage.');
