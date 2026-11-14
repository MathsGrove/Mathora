import {mountConstructedPractice} from './constructed-practice-ui.mjs';

// Explicitly fictional, in-memory learning UX demonstration. No Supabase client.
// The actual RPC adapter is connected only by an approved isolated staging host.
const question={
  status:'assigned',question:'A fictional club has 96 kits to share in the ratio red : blue = 5 : 3. Calculate how many red kits there are, showing your working.',
  qualification:'GCSE',academic_level:'Foundation',plan:'weekly',max_marks:3
};
let revision=null,saved='',state='assigned';
const client={
 async assignedWork(){
  return {...question,status:state,revision,written_work:saved};
 },
 async saveConstructed({writtenWork,expectedRevision,submit}){
  if(state!=='assigned')throw Error('The answer was already submitted.');
  if(revision!==expectedRevision)throw Error('Stale answer revision; load the latest saved version before continuing.');
  if(submit&&writtenWork.trim().length<30)throw Error('Show the calculation and explain your reasoning.');
  revision=revision===null?1:revision+1;
  saved=writtenWork;
  if(submit)state='submitted';
  return {revision,status:state,submitted:submit};
 }
};
const attemptId='abcdabcd-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
mountConstructedPractice(document.getElementById('student-editor'),{client,attemptId});
// Dev fixture used only by the isolated browser test to emulate another open tab.
window.__fictionalBrowserTab=Object.freeze({
 emulateNewerSave(){
  if(state==='assigned'){
   revision=revision===null?1:revision+1;
   saved='A fictional second tab saved a newer version of this exact answer.';
  }
 }
});
