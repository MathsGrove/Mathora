import assert from 'node:assert/strict';
import {createExperimentalMarkingClient} from '../content/marking/staging-rpc-client.mjs';

const calls=[];
const fake={rpc:async(name,args)=>{
 calls.push({name,args});
 return {data:{ok:true,name,args},error:null};
}};
const UUID='abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
assert.throws(()=>createExperimentalMarkingClient(fake,{environment:'production',enabled:true}),/disabled/);
assert.throws(()=>createExperimentalMarkingClient(fake,{environment:'disposable_staging',enabled:false}),/disabled/);
assert.throws(()=>createExperimentalMarkingClient(null,{environment:'disposable_staging',enabled:true}),/RPC client/);
const api=createExperimentalMarkingClient(fake,{environment:'disposable_staging',enabled:true});
assert.throws(()=>api.studentReport('not-a-uuid'),/UUID/);
await api.signoffRubric({
 rubricId:UUID,fingerprint:'a'.repeat(64),
 note:'This is an independent fictional board and mathematics signoff.',
 mathsChecked:true,syllabusChecked:true,markSchemeChecked:true
});
assert.deepEqual(Object.keys(calls.at(-1).args).sort(),[
 'p_hash','p_mark_scheme_checked','p_maths_checked','p_note','p_rubric','p_syllabus_checked'].sort());
await assert.rejects(api.signoffRubric({rubricId:UUID,fingerprint:'a'.repeat(64),
 note:'Independent fictional evidence and review note.',mathsChecked:false,
 syllabusChecked:true,markSchemeChecked:true}),/Explicit independent/);
assert.equal(calls.length,1,'Invalid signoff never invokes a backend RPC');
const awards=[
 {id:'m-parts',awarded:true,note:'Eight equal parts identified clearly.'},
 {id:'a-unit',awarded:false,note:'Incorrect final unit.'},
 {id:'b-check',awarded:true,note:'Total checked independently.'}
];
await api.saveReview({attemptId:UUID,awards,release:false});
assert.equal(calls.at(-1).name,'mg2_staff_mark');
assert.equal(calls.at(-1).args.p_release,false);
assert.deepEqual(calls.at(-1).args.p_awards.map(a=>a.awarded),[true,false,true]);
assert.ok(!Object.keys(calls.at(-1).args).some(k=>/score|marks_total|student_id|org_id|examiner_id/.test(k)));
await assert.rejects(api.saveReview({attemptId:UUID,awards:[{id:'m-parts',awarded:null}],
 release:false}),/explicitly/);
await assert.rejects(api.saveReview({attemptId:UUID,awards,release:true}),/three human-reviewed/);
assert.equal(calls.length,2,'Invalid mark and release payloads never invoke the backend');
await api.saveReview({attemptId:UUID,awards,release:true,
 studentSummary:'You identified the correct total of parts.',
 parentSummary:'Ask why the sum of the two parts is eight.',
 tutorPlan:'Practise unit-share calculations with a second ratio.'});
assert.equal(calls.at(-1).args.p_release,true);
assert.equal(calls.at(-1).args.p_student_summary,'You identified the correct total of parts.');
await api.studentReport(UUID);
assert.equal(calls.at(-1).name,'mg2_student_report');
await api.linkedLearnerReport(UUID,'parent');
assert.equal(calls.at(-1).args.p_role,'parent');
await api.linkedLearnerReport(UUID,'tutor');
assert.equal(calls.at(-1).args.p_role,'tutor');
assert.throws(()=>api.linkedLearnerReport(UUID,'examiner'),/linked-audience/);
assert.ok(!calls.some(c=>c.args.p_student_id||c.args.p_examiner_id||c.args.p_total));
const errorApi=createExperimentalMarkingClient({
 rpc:async()=>({data:null,error:{message:'Permission denied by Supabase RLS'}})
},{environment:'disposable_staging',enabled:true});
await assert.rejects(errorApi.studentReport(UUID),/Permission denied/);
console.log('PASS — disabled-in-production staging client, explicit consented mark payloads, no client score/identity, signed rubric review, separate parent/tutor reads and RPC errors.');
