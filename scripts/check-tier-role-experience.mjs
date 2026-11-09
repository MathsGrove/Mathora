import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('tier-role-experience.js');
const m=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const insight={
 baseline:{status:'submitted',score:13,total:20},
 baseline_topics:[{topic:'Algebra',correct:1,total:3},{topic:'Geometry',correct:3,total:4}],
 reviewed:2,submitted:3,reviewed_accuracy:75,visible_minutes:118
};
const weekly=m.summariseStudentTier('weekly',insight);
const daily=m.summariseStudentTier('daily',insight);
const exam=m.summariseStudentTier('exam',insight);
assert.equal(weekly.tier,'weekly');assert.equal(daily.tier,'daily');assert.equal(exam.tier,'exam');
assert.match(weekly.rhythm,/Four weekly sets/);
assert.doesNotMatch(weekly.rhythm,/mock/i);
assert.match(daily.rhythm,/Daily Focus/);
assert.doesNotMatch(daily.rhythm,/mock/i);
assert.match(exam.rhythm,/moderation|moderated/i);
assert.match(exam.roleAccess,/parent or assigned tutor/i);
assert.match(weekly.roleAccess,/not included/i);
assert.match(daily.roleAccess,/not included/i);
for(const p of [weekly,daily,exam]){
 assert.equal(p.stats.length,4);
 assert.equal(p.stats[0].value,'2');
 assert.equal(p.stats[1].value,'1');
 assert.equal(p.stats[2].value,'75%');
 assert.equal(p.stats[3].value,'118 min');
 assert.equal(p.focus.topic,'Algebra');
 assert.match(p.next,/1 \/ 3 correct/);
 assert.doesNotMatch(p.next,/mastered|predicted grade/i);
}
const unloaded=m.summariseStudentTier('daily',null);
assert.equal(unloaded.stats[0].value,'—');
assert.equal(unloaded.stats[2].value,'—');
const notStarted=m.summariseStudentTier('weekly',{baseline:{status:'not_started'},baseline_topics:[],reviewed:0,submitted:0});
assert.match(notStarted.next,/starting-point baseline/);
assert.equal(notStarted.stats[2].value,'—');
const inactive=m.summariseStudentTier(null,insight);
assert.equal(inactive.enabled,false);assert.equal(inactive.stats.length,0);
assert.match(inactive.title,/programme begins/);
const familyFixture={
 view_role:'parent',papers_reviewed:2,papers_awaiting_review:1,
 practice_timing:{submitted_sessions:5,recorded_visible_minutes:146.4},
 topics:[
  {topic:'Algebra',earned:2,available:8,questions:3},
  {topic:'Geometry',earned:7,available:9,questions:2}
 ],
 recent_results:[{date:'2026-11-07',score:9,maximum:15}],
 teaching_feedback:[{topic:'Algebra',feedback:'PRIVATE EXAMINER COMMENT TO ASSIGNED TUTOR',marks:2,maximum:4}]
};
const parent=m.summariseFamilyRole(familyFixture);
const tutor=m.summariseFamilyRole({...familyFixture,view_role:'tutor'});
assert.equal(parent.role,'parent');assert.equal(tutor.role,'tutor');
assert.match(parent.title,/Support the learner/);
assert.match(tutor.title,/Plan the intervention/);
assert.equal(parent.stats[0].value,'2');
assert.equal(parent.stats[1].value,'5');
assert.equal(parent.stats[2].value,'146 min');
assert.equal(tutor.stats[1].value,'60%');
assert.equal(tutor.stats[2].value,'1');
assert.ok(parent.cards[2].text.includes('equation balanced'));
assert.ok(tutor.cards[0].text.includes('2 / 8 marks'));
assert.ok(!JSON.stringify(parent).includes('PRIVATE EXAMINER COMMENT'),
 'Parent must not include tutor-only confidential feedback');
assert.ok(!JSON.stringify(parent).includes('Examiner comment items'),
 'Parent must not show tutor-only comment counts');
assert.match(parent.bottom,/read-only/i);
assert.match(tutor.bottom,/released to the tutor/i);
const emptyParent=m.summariseFamilyRole({view_role:'parent',topics:[],recent_results:[]});
const emptyTutor=m.summariseFamilyRole({view_role:'tutor',topics:[],recent_results:[]});
assert.equal(emptyParent.stats[1].value,'—');
assert.equal(emptyParent.stats[2].value,'—');
assert.equal(emptyTutor.stats[1].value,'—');
assert.match(emptyTutor.cards[0].title,/diagnostic baseline/);
assert.ok(!/\b(?:fetch\s*\(|XMLHttpRequest|createClient\s*\(|\.rpc\s*\(|\.from\s*\(|localStorage\s*\.|sessionStorage\s*\.)/.test(source),
 'Renderer must not independently request or persist learner information');
assert.ok(!source.includes('innerHTML'),'Never interpolate user-supplied or examiner text as HTML');
const portal=read('portal.js'),family=read('family-access.js');
assert.ok(portal.includes("renderStudentTier(active?e.tier:null,null)"));
assert.ok(portal.includes("renderStudentTier(state.entitlement?.tier||null,data)"));
assert.ok(portal.includes("clearTierRoleExperience('student')"));
assert.ok(family.includes("renderFamilyRole(p)"));
assert.ok(family.includes("clearTierRoleExperience('family')"));
assert.ok(family.includes('const learnerKey=x=>String(x.student_id')&&
 family.includes('selectedLearnerKey=learnerKey(p)'), 'Family refresh must preserve the actual learner and role, not a list index');
assert.ok(!family.includes('const p=records[Number(chooser.value)||0]'),
 'Do not accidentally switch learners if authorised record order changes');
const studentHtml=read('portal.html'),familyHtml=read('family.html');
for(const id of ['mg-student-tier-experience','mgtr-student-title','mgtr-student-stats','mgtr-student-focus','mgtr-student-role-access']){
 assert.ok(studentHtml.includes('id="'+id+'"'),'Missing student tier element: '+id);
}
for(const id of ['mg-family-role-experience','mgtr-family-title','mgtr-family-stats','mgtr-family-cards']){
 assert.ok(familyHtml.includes('id="'+id+'"'),'Missing private role element: '+id);
}
for(const page of [studentHtml,familyHtml])assert.ok(page.includes('href="./tier-role-experience.css"'));
const deploy=read('.github/workflows/pages.yml');
for(const asset of ['tier-role-experience.js','tier-role-experience.css']){
 assert.ok(deploy.includes(asset),'Curated Pages deployment must publish '+asset);
}
console.log('Tier & role models passed: 3 student plans, parent vs tutor, released-only statistics, no fabricated evidence, selection and permissions.');
