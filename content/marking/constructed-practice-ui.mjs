/* MathsGrove constructed-response learner experience.
 * Staging integration component only; NO auth client or live endpoint here.
 * A permitted caller must supply an authenticated, environment-gated API.
 * All learner text is rendered as text, never HTML.
 */
const element=(tag,value,cls)=>{
 const node=document.createElement(tag);
 if(value!==undefined)node.textContent=String(value);
 if(cls)node.className=cls;
 return node;
};
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const looksLikeUuid=x=>typeof x==='string'&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(x);
const plans={weekly:'Grove Weekly',daily:'Grove Daily',exam:'Grove Exam'};

export function mountConstructedPractice(root,{client,attemptId,confirmSubmit}={}){
 assert(root&&typeof root.replaceChildren==='function','An accessible root element is required.');
 assert(client&&typeof client.assignedWork==='function'&&typeof client.saveConstructed==='function',
   'A staging-gated authenticated client must be supplied.');
 assert(looksLikeUuid(attemptId),'A valid attempted-question reference is required.');
 const confirmAction=typeof confirmSubmit==='function'?confirmSubmit:
  ()=>window.confirm('Submit this mathematical working? You cannot edit it after submission.');
 const state={busy:false,status:'loading',revision:null,lastSaved:'',loaded:false};
 const wrapper=element('section',undefined,'mgcw-panel');
 const meta=element('p','Loading assigned question…','mgcw-meta');
 const heading=element('h2','Your mathematical working','mgcw-title');
 const question=element('p','Your assignment is loading.','mgcw-question');
 const field=element('div',undefined,'mgcw-field');
 const label=element('label','Explain your method, calculations and final answer.','mgcw-label');
 const input=document.createElement('textarea');
 input.id='mgcw-working';input.name='working';input.maxLength=12000;input.rows=11;
 input.placeholder='Show each step and include units, diagrams explained in words, or final mathematical reasoning.';
 label.htmlFor=input.id;
 const helper=element('p','Your working is kept in this assignment. It is not graded automatically; an authorised examiner reviews it.','mgcw-help');
 const status=element('p','', 'mgcw-status');status.setAttribute('role','status');
 status.setAttribute('aria-live','polite');
 const count=element('span','0 / 12,000 characters','mgcw-counter');
 const saveButton=element('button','Save draft','mgcw-secondary');
 const submitButton=element('button','Submit for examiner review','mgcw-primary');
 const reloadButton=element('button','Load latest saved draft','mgcw-tertiary');
 for(const button of [saveButton,submitButton,reloadButton])button.type='button';
 const actions=element('div',undefined,'mgcw-actions');
 actions.append(saveButton,submitButton,reloadButton);
 const footer=element('p','Fictional staging flow — no public exam paper, released score, student account or live upload.','mgcw-footnote');
 field.append(label,input,helper);
 wrapper.append(meta,heading,question,field,count,actions,status,footer);
 root.replaceChildren(wrapper);
 function signal(message,error=false){
  status.textContent=String(message);
  status.classList.toggle('mgcw-error',error);
 }
 function enabled(){
  const editable=state.loaded&&state.status==='assigned'&&!state.busy;
  input.disabled=!editable;
  saveButton.disabled=!editable;
  submitButton.disabled=!editable;
  reloadButton.disabled=!editable;
  count.textContent=String(input.value.length)+' / 12,000 characters';
 }
 async function refresh({allowOverwrite=false}={}){
  if(state.busy)return;
  if(state.loaded&&state.status==='assigned'&&input.value!==state.lastSaved&&!allowOverwrite){
   if(!window.confirm('Loading the saved version will replace the text currently in this editor. Continue?')){
    signal('Your unsaved working has been kept.');return;
   }
  }
  state.busy=true;enabled();
  try{
   const data=await client.assignedWork(attemptId);
   assert(data&&['assigned','submitted','released'].includes(data.status),
    'The assignment returned an invalid state.');
   assert(typeof data.question==='string'&&data.question.trim(),
    'No approved question prompt was available.');
   assert(data.revision===null||(Number.isInteger(data.revision)&&data.revision>=1),
    'Invalid saved revision returned.');
   state.loaded=true;state.status=data.status;state.revision=data.revision;
   state.lastSaved=typeof data.written_work==='string'?data.written_work:'';
   input.value=state.lastSaved;
   question.textContent=data.question;
   heading.textContent=data.status==='assigned'?'Show the working. Learn from each step.':
    data.status==='submitted'?'Submitted for examiner review.':'Working submitted and reviewed.';
   meta.textContent=[
    plans[data.plan]||'Assigned MathsGrove practice',
    data.qualification||'Mathematics',
    data.academic_level||'',
    String(data.max_marks||'')+' possible marks'
   ].filter(Boolean).join(' · ');
   signal(data.status==='assigned'?
    'Your assignment is ready. Save the draft as you work; a final submission locks the answer.':
    data.status==='submitted'?'Your final answer is saved. Await examiner release.':
    'This answer is locked. View any authorised released result in your report area.');
  }catch(error){
   signal('Could not load your assigned work. '+(error?.message||'Try again.'),true);
  }finally{state.busy=false;enabled();}
 }
 async function save(submit){
  if(state.busy||state.status!=='assigned'||!state.loaded)return;
  const work=input.value;
  if(submit&&work.trim().length<30){
   signal('Add more mathematical working (at least 30 characters) before submitting.',true);
   input.focus();return;
  }
  if(submit&&!confirmAction())return;
  state.busy=true;enabled();
  try{
   const answer=await client.saveConstructed({
    attemptId,writtenWork:work,expectedRevision:state.revision,submit
   });
   assert(answer&&Number.isInteger(answer.revision)&&answer.revision>=1,
    'An invalid save revision was returned.');
   assert(answer.status===(submit?'submitted':'assigned'),
    'Unexpected save/submit state.');
   state.revision=answer.revision;state.lastSaved=work;state.status=answer.status;
   if(submit)heading.textContent='Submitted for examiner review.';
   signal(submit?'Working submitted and locked. An examiner will assess the method before releasing feedback.':
    'Draft saved (revision '+answer.revision+'). Your final answer is not submitted yet.');
  }catch(error){
   signal('Save not completed. Your text is still in the editor. '+
    (error?.message||'Please try again.'),true);
  }finally{state.busy=false;enabled();}
 }
 input.addEventListener('input',()=>{enabled();if(state.status==='assigned')signal('Unsaved changes — save your draft before leaving.');});
 saveButton.addEventListener('click',()=>save(false));
 submitButton.addEventListener('click',()=>save(true));
 reloadButton.addEventListener('click',()=>refresh());
 enabled();
 void refresh({allowOverwrite:true});
 return Object.freeze({refresh:()=>refresh(),destroy:()=>root.replaceChildren()});
}
