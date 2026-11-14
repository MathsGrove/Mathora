import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');
const roleSource=read('tier-role-experience.js');
const model=await import('data:text/javascript;base64,'+Buffer.from(roleSource).toString('base64'));
const css=read('maths-refinement-v14.css'),gallery=read('maths-gallery-v13.js');
const micro=read('maths-private-motion-v14.js');
const preview=read('maths-preview-insights-v14.js');
const portal=read('portal.html'),family=read('family.html');
const home=read('index.html'),report=read('report.html'),reason=read('reasoning-demo.html');
const pages=read('.github/workflows/pages.yml'),browser=read('.github/workflows/browser-smoke.yml');
const fixture={
 view_role:'parent',
 papers_reviewed:2,papers_awaiting_review:1,
 topics:[{topic:'Algebra',earned:2,available:8,questions:3},{topic:'Geometry',earned:7,available:9,questions:2}],
 practice_timing:{submitted_sessions:5,scheduled_sessions:9,recorded_visible_minutes:142.5},
 recent_results:[{date:'2026-11-07',topic:'Algebra',score:9,maximum:15}],
 teaching_feedback:[{topic:'Algebra',feedback:'TUTOR SECRET WORKING COMMENT',marks:2,maximum:4}],
 student_private_notes:'NOT_FOR_PARENT',draft_marking:'CONFIDENTIAL'
};
const parent=model.planFamilyNextSteps(fixture);
const tutor=model.planFamilyNextSteps({...fixture,view_role:'tutor'});
assert.equal(parent.role,'parent');assert.equal(tutor.role,'tutor');
assert.equal(parent.evidence.length,2);assert.equal(parent.evidence[0].topic,'Algebra');
assert.deepEqual([parent.evidence[0].earned,parent.evidence[0].available,parent.evidence[0].questions],[2,8,3]);
assert.match(parent.status,/2 \/ 8 released marks/);
assert.match(parent.activityNote,/5 recorded submitted sessions/);
assert.match(parent.activityNote,/9 scheduled opportunities/);
assert.match(parent.activityNote,/143 min of recorded question-screen visibility/);
assert.equal(parent.sections.length,3);
assert.equal(parent.sections[0].items.length,3);
assert.match(parent.sections[0].label,/ASK YOUR CHILD/);
assert.match(parent.sections[1].label,/ASK THEIR TUTOR/);
assert.match(parent.sections[1].items[2].body,/recheck this idea using a different question/);
assert.match(parent.sections[2].label,/THIS WEEK AT HOME/);
assert.match(tutor.sections[0].label,/BEFORE THE NEXT LESSON/);
assert.match(tutor.sections[1].label,/TEACH AND CONTRAST/);
assert.match(tutor.sections[2].label,/FOLLOW UP WITH EVIDENCE/);
assert.match(JSON.stringify(tutor),/examiner comment item/);
for(const secret of ['TUTOR SECRET WORKING COMMENT','NOT_FOR_PARENT','CONFIDENTIAL','Examiner comment items']){
 assert.ok(!JSON.stringify(parent).includes(secret),'Family must never receive '+secret);
}
const empty=model.planFamilyNextSteps({view_role:'parent',topics:[],practice_timing:{}});
assert.equal(empty.evidence.length,0);
assert.match(empty.status,/no released topic breakdown/i);
assert.match(empty.activityNote,/No 28-day submission count/);
const noQuestions=model.planFamilyNextSteps({view_role:'tutor',topics:[{topic:'Algebra',earned:1,available:5,questions:0}]});
assert.doesNotMatch(JSON.stringify(noQuestions),/Review the 0 released/);
const s=model.planStudentNextSteps('daily',{
 baseline:{status:'submitted'},baseline_topics:[{topic:'Fractions',correct:1,total:4}],
 reviewed:1,submitted:2
});
assert.equal(s.prompts.length,3);
assert.match(s.title,/Fractions/);
assert.match(s.prompts[2],/without hints/);
const pending=model.planStudentNextSteps(null,{});
assert.match(pending.title,/starting point/i);
assert.equal(pending.prompts.length,3);

for(const [file,body,id] of [['portal.html',portal,'mgtr-student-inquiry'],['family.html',family,'mgtr-family-inquiry']]){
 assert.ok(body.includes('id="'+id+'"'),file+' missing evidence-guidance mount');
 assert.ok(body.includes('maths-refinement-v14.css'),file+' missing styles');
 assert.ok(body.includes('maths-private-motion-v14.js'),file+' missing lightweight interactions');
}
assert.ok(home.includes('maths-preview-insights-v14.js'),'Public tour must show distinct family/tutor questions');
for(const page of [home,report,reason])assert.ok(page.includes('maths-refinement-v14.css'),'Page missing smoother quote styling');
assert.ok(gallery.includes('mg14-maths-quote')&&gallery.includes('const quotes={'),'Gallery must show mathematical quote, not handwriting');
assert.ok(!gallery.includes('mg13-hand-line')&&!gallery.includes('mg13-paper'),'No handwritten notes or writing animation');
assert.ok(css.includes('mg14-maths-quote')&&css.includes('mg14-coverage')&&css.includes('mg14-showcase')&&css.includes('prefers-reduced-motion:reduce'),'Responsive quote, inquiry and reduced-motion styles required');
assert.ok(preview.includes('window.MathsGroveV3')&&preview.includes('FICTIONAL DASHBOARD PREVIEW'),'Only the fictional public showcase may be used');
assert.ok(preview.includes("state.tier!=='exam'&&state.role!=='student'"),'Restricted roles must not appear in Weekly or Daily');
assert.ok(!/fetch\s*\(|createClient\s*\(|localStorage\s*\.|sessionStorage\s*\.|\.rpc\s*\(/.test(roleSource+micro+preview),'No new learner-data retrieval, storage or permissions');
assert.ok(!roleSource.includes('innerHTML'),'Role guidance must render arbitrary data as text');
assert.ok(pages.includes('node scripts/check-maths-refinement-v14.mjs')&&pages.includes('maths-preview-insights-v14.js'),'Publish gate checks v14 and ships its assets');
assert.ok(browser.includes('node scripts/check-maths-refinement-v14.mjs'),'Browser CI runs v14 integrity test');
assert.ok(home.length<65000,'Homepage remains below original 65k size budget');
console.log('MathsGrove v14: maths quotes, patient easing, confidential family boundaries, real evidence-driven parent/tutor prompts, student next steps, fictional preview and safe private motion: OK');
