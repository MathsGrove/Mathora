import {mountExaminerReviewQueue} from './examiner-workbench-ui.mjs';
import {mountQuestionModeration} from './examiner-moderation-ui.mjs';

const UUID_A='abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const UUID_B='abcdabcd-cccc-4ccc-8ccc-cccccccccccc';
const response=await fetch('./route-exam-style-examples.json',{cache:'no-store'});
if(!response.ok)throw Error('Original public editorial exam examples could not be loaded.');
const examples=(await response.json()).items;
const original=examples.find(x=>x.id==='quadratic-roots-gcse-higher');
const advanced=examples.find(x=>x.id==='stationary-ib-aa-hl');
if(!original||!advanced)throw Error('Fictional example question missing.');
const submitted='2026-11-14T09:00:00Z';
const make=(id,item,working)=>({
 attempt_id:id,status:'submitted',
 qualification:item.route.qualification,academic_level:item.route.level,
 question:item.question,question_key:item.id,
 worked_solution:item.solution,criteria:item.criteria,
 max_marks:item.maxMarks,submitted_at:submitted,written_work:working
});
const records=[
 make(UUID_A,original,
  'I factor x squared minus 5x minus 14 as (x minus 7)(x plus 2). So x is 7 or minus 2. Substitution gives zero for both.'),
 make(UUID_B,advanced,
  'The derivative is 3x²−3. Solving gives x=−1 and x=1. I calculated f(−1)=2, f(1)=−2 and checked second derivative signs.')
];
const drafts=new Map();
const released=new Set();
const sleep=()=>Promise.resolve();
const client={
 async examinerQueue({limit=20,offset=0}={}){
  await sleep();
  const pending=records.filter(r=>!released.has(r.attempt_id));
  return {total:pending.length,limit,offset,
   items:pending.slice(offset,offset+limit).map(r=>({
    attempt_id:r.attempt_id,qualification:r.qualification,
    academic_level:r.academic_level,topic:r.question_key,
    submitted_at:r.submitted_at,possible:r.max_marks,
    decisions_recorded:drafts.get(r.attempt_id)?.length||0,
    marks_awarded:drafts.get(r.attempt_id)?.filter(x=>x.awarded).length||0
   }))
  };
 },
 async examinerSubmission(id){
  const r=records.find(x=>x.attempt_id===id&&!released.has(id));
  if(!r)throw Error('Submission not available.');
  return structuredClone(r);
 },
 async savedExaminerMarks(id){
  const r=records.find(x=>x.attempt_id===id&&!released.has(id));
  if(!r)throw Error('No saved marking draft available.');
  const awards=drafts.get(id)||[];
  return {attempt_id:id,possible:r.max_marks,recorded:awards.length,
   complete:awards.length===r.max_marks,awards:structuredClone(awards)};
 },
 async saveReview({attemptId,awards,release,studentSummary,parentSummary,tutorPlan}){
  const r=records.find(x=>x.attempt_id===attemptId&&!released.has(attemptId));
  if(!r)throw Error('The answer is no longer awaiting release.');
  if(awards.length!==r.max_marks||awards.some(x=>x.awarded===null))
   throw Error('All criteria must have explicit reviewer decisions.');
  const earned=awards.filter(x=>x.awarded).length;
  if(release){
   if([studentSummary,parentSummary,tutorPlan].some(x=>typeof x!=='string'||x.trim().length<15))
    throw Error('Each report needs an examined, role-specific summary.');
   released.add(attemptId);
  }else drafts.set(attemptId,structuredClone(awards));
  return {ok:true,earned,possible:r.max_marks,released:release};
 }
};
window.__fictionalMarkingClient=client; // browser-test hook ONLY
mountExaminerReviewQueue(document.getElementById('examiner-workbench'),{client,
 confirmRelease:()=>window.confirm('Release this fictional examiner report?')});


// Independent author-check: one examiner can approve their own verified slice,
// but cannot satisfy a two-person human moderation gate alone.
let signedOff=false;
const rubricId='abcdabcd-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const fakeModeration={
 async moderationQueue(){
  return {total:signedOff?0:1,items:signedOff?[]:[{
   rubric_id:rubricId,qualification:original.route.qualification,
   academic_level:original.route.level,board:'AQA',syllabus_year:'2026',
   question_key:original.id,question:original.question,
   worked_solution:original.solution,criteria:original.criteria,
   max_marks:original.maxMarks,plan:original.plan,
   fingerprint:'a'.repeat(64),independent_reviews:0
  }]};
 },
 async signoffRubric({rubricId:got,fingerprint,note,mathsChecked,syllabusChecked,markSchemeChecked}){
  if(got!==rubricId||fingerprint!=='a'.repeat(64)||note.trim().length<25||
    !mathsChecked||!syllabusChecked||!markSchemeChecked)
   throw Error('Independent reviewer confirmation is incomplete.');
  if(signedOff)throw Error('Reviewer already signed this unchanged rubric.');
  signedOff=true;
  return {approved:false,independent_reviewers:1};
 }
};
mountQuestionModeration(document.getElementById('moderation-workbench'),
 {client:fakeModeration,confirmSignoff:()=>window.confirm('Sign this fictional original question?')});
