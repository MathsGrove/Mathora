import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const src=read('progress-evidence.js');
const {studentProgressEvidence,familyProgressEvidence}=await import(
 'data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const student=studentProgressEvidence({
 baseline:{status:'submitted',score:14,total:20},
 submitted:4,reviewed:2,
 topics:[
  {topic:'Algebra',correct:1,total:3},
  {topic:'Number',correct:3,total:4}
 ],
 history:[{task_id:'released-a',date:'2026-11-08',score:3,total:4,
  mode:'daily',feedback:'Revise inverse operations',feedback_updated_at:'2026-11-08T09:00:00Z'}]
});
assert.equal(student.baselineReady,true);
assert.equal(student.reviewed,2);
assert.equal(student.last.score,3);
assert.equal(student.focus.topic,'Algebra');
assert.equal(student.focus.possible,3);
assert.match(student.nextCheck,/not yet linked/i);
assert.ok(!student.evidenceDisclaimer.toLowerCase().includes('predicted grade is'));
const zero=studentProgressEvidence({baseline:{status:'in_progress'},topics:[],reviewed:0,history:[]});
assert.equal(zero.baselineReady,false);
assert.equal(zero.focus,null);
assert.match(zero.evidenceDisclaimer,/No released/);
const family=familyProgressEvidence({
 view_role:'parent',papers_reviewed:2,
 recent_results:[{date:'2026-11-08T11:00:00Z',score:5,maximum:8,topic:'Algebra'},
  {date:'2026-11-01T11:00:00Z',score:7,maximum:9,topic:'Geometry'}],
 topics:[{topic:'Algebra',earned:4,available:10,questions:3},
  {topic:'Geometry',earned:7,available:9,questions:2}],
 teaching_feedback:[{feedback:'PRIVATE TUTOR-ONLY CONTENT'}]
});
assert.equal(family.role,'parent');
assert.equal(family.focus.topic,'Algebra');
assert.equal(family.positive.topic,'Geometry');
assert.match(family.prompt,/algebraic step/i);
assert.ok(!JSON.stringify(family).includes('PRIVATE TUTOR-ONLY CONTENT'));
assert.match(family.recheck,/independent check/);
const waiting=familyProgressEvidence({view_role:'parent',papers_reviewed:0,topics:[],recent_results:[]});
assert.equal(waiting.focus,null);
assert.match(waiting.headline,/Waiting/);
const tutor=familyProgressEvidence({view_role:'tutor',papers_reviewed:1});
assert.equal(tutor.role,'tutor');

assert.ok(!/\b(?:localStorage\s*\.|sessionStorage\s*\.|indexedDB\s*\.|fetch\s*\(|new\s+XMLHttpRequest|createClient\s*\()/.test(src),
 'The rendering component must not make data requests or persist private student records');
assert.ok(!src.includes('innerHTML'),'Evidence must use textContent, not insert untrusted HTML');
assert.ok(!/readyToClaimMastery\s*:\s*true/.test(src),'No mastery prediction from small samples');
const portal=read('portal.js'),familyApp=read('family-access.js');
assert.ok(portal.includes('renderStudentProof(data)'));
assert.ok(familyApp.includes('renderFamilyProof(p)'));
assert.ok(portal.includes("clearProgressEvidence('student')"));
assert.ok(familyApp.includes("clearProgressEvidence('family')"));
const parentPage=read('family.html'),studentPage=read('portal.html');
for(const id of ['fa-proof','mgpe-family-positive','mgpe-family-focus','mgpe-family-question']){
 assert.ok(parentPage.includes('id="'+id+'"'));
}
for(const id of ['mg-student-proof','mgpe-student-status','mgpe-student-steps']){
 assert.ok(studentPage.includes('id="'+id+'"'));
}
const deploy=read('.github/workflows/pages.yml');
for(const asset of ['progress-evidence.js','progress-evidence.css'])
 assert.ok(deploy.includes(asset),'Pages deploy missing '+asset);
console.log('Proof of Progress checks passed: learner baseline/released evidence, parent coaching, role isolation, no invented recheck and sign-out clearing.');
