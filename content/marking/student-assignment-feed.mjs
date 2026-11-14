/* Student-only constructed-response assignment discovery.
 * Read and write only via authenticated, server-filtered Supabase RPCs.
 * Text from original questions and feedback is never interpreted as HTML.
 */
import {mountConstructedPractice} from './constructed-practice-ui.mjs';
const el=(tag,text,cls)=>{
 const e=document.createElement(tag);
 if(text!==undefined)e.textContent=String(text);
 if(cls)e.className=cls;
 return e;
};
const label=(name,value)=>{
 const x=el('div',undefined,'mg2-student-meta');
 x.append(el('strong',name),el('span',String(value??'—')));return x;
};
export function mountStudentOriginalAssignments(root,{client}={}){
 if(!root||typeof root.replaceChildren!=='function')throw Error('Student assignment root missing.');
 for(const name of ['myOriginalAssignments','assignedWork','saveConstructed','studentReport']){
  if(typeof client?.[name]!=='function')throw Error('Authenticated student client missing: '+name);
 }
 let busy=false,offset=0,items=[],active=null,disposed=false;
 const wrapper=el('section',undefined,'mg2-student-assignments');
 const top=el('div',undefined,'mg2-student-head');
 top.append(el('p','MULTI-MARK PRACTICE · YOUR VERIFIED ACCOUNT','mg2-eyebrow'),
  el('h2','Show your thinking. Earn credit for each step.','mg2-title'),
  el('p','Work through your assigned question and save as you go. An examiner checks the reasoning before any marks or detailed feedback are released.','mg2-help'));
 const toolbar=el('div',undefined,'mg2-student-toolbar');
 const reload=el('button','Refresh assignments','mg2-secondary');
 const back=el('button','Previous','mg2-tertiary');
 const next=el('button','Next','mg2-tertiary');
 for(const button of [reload,back,next])button.type='button';
 toolbar.append(reload,back,next);
 const list=el('div',undefined,'mg2-student-list');
 const detail=el('div',undefined,'mg2-student-detail');
 const notice=el('p','', 'mg2-student-status');
 notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
 wrapper.append(top,toolbar,list,detail,notice);root.replaceChildren(wrapper);
 const announce=(message,error=false)=>{
  notice.textContent=message;notice.classList.toggle('mg2-error',error);
 };
 function setBusy(flag){
  busy=flag;
  for(const button of toolbar.querySelectorAll('button'))button.disabled=flag;
 }
 async function open(item){
  if(busy||disposed)return;
  active=item.attempt_id;
  detail.replaceChildren();
  const heading=el('div',undefined,'mg2-student-detail-head');
  const returnButton=el('button','Back to all assigned questions','mg2-tertiary');
  returnButton.type='button';
  returnButton.addEventListener('click',()=>{active=null;detail.replaceChildren();});
  heading.append(returnButton,el('h3',item.question_key||'Assigned original practice'));
  detail.append(heading);
  if(item.status==='released'){
   try{
    const report=await client.studentReport(item.attempt_id);
    if(disposed||active!==item.attempt_id)return;
    const score=el('p',report.earned+' / '+report.possible+' examiner-awarded marks','mg2-mark-score');
    const summary=el('p',report.summary,'mg2-report-summary');
    const checklist=el('ol',undefined,'mg2-report-criteria');
    for(const c of report.criteria||[]){
     const li=el('li',undefined,c.awarded?'mg2-earned':'mg2-unearned');
     li.append(el('strong',c.code+' · '+c.skill+(c.awarded?' · credited':' · not credited')),
      el('p',c.nextPractice||'Review this part with your teacher.'));checklist.append(li);
    }
    detail.append(score,summary,checklist);
    announce('Your examiner-approved report has loaded.');
   }catch(error){announce('Released report unavailable: '+(error?.message||'Try again.'),true)}
   return;
  }
  if(item.status==='submitted'){
   detail.append(el('p','Your submitted working is locked and awaiting examiner review. You will see your awarded criteria and next practice steps only after release.','mg2-help'));
   return;
  }
  if(item.status!=='assigned'){
   detail.append(el('p','This assignment is not currently open for editing.','mg2-help'));return;
  }
  const studentEditor=el('div',undefined,'mg2-student-editor');detail.append(studentEditor);
  mountConstructedPractice(studentEditor,{
   client,attemptId:item.attempt_id,
   confirmSubmit:()=>window.confirm('Submit your final mathematical working for examiner marking? You will not be able to edit it afterwards.')
  });
  if(typeof client.uploadEvidence==='function'){
   const box=el('section',undefined,'mg2-evidence-upload');
   box.append(el('h4','Add one secure image or PDF of your working'),
    el('p','Optional: provide a photo of handwritten steps before final submission. PNG, JPEG or PDF, up to 1 MiB. This is private to you and the authorised examiner.','mg2-help'));
   const file=document.createElement('input');file.type='file';
   file.accept='image/png,image/jpeg,application/pdf';
   const upload=el('button','Upload private working evidence','mg2-secondary');upload.type='button';
   const attachments=el('div',undefined,'mg2-evidence-list');
   const feedback=el('p','', 'mg2-help');feedback.setAttribute('role','status');
   box.append(file,upload,attachments,feedback);detail.append(box);
   async function listFiles(){
    if(typeof client.listEvidence!=='function')return;
    try{
     const records=await client.listEvidence({attemptId:item.attempt_id});
     attachments.replaceChildren();
     for(const f of records){
      const label=el('button','View '+f.name+' (temporary private link)','mg2-tertiary');
      label.type='button';
      label.addEventListener('click',async()=>{
       try{
        const url=await client.signedEvidenceUrl(f.path);
        window.open(url,'_blank','noopener,noreferrer');
       }catch(error){feedback.textContent='Evidence could not be opened: '+error.message}
      });
      attachments.append(label);
     }
    }catch(error){feedback.textContent='Private evidence list unavailable: '+error.message}
   }
   upload.addEventListener('click',async()=>{
    if(!file.files?.length){feedback.textContent='Choose a photo or PDF first.';return;}
    upload.disabled=true;
    try{
     const result=await client.uploadEvidence({attemptId:item.attempt_id,file:file.files[0]});
     if(!result?.stored)throw Error('Storage did not confirm the upload.');
     feedback.textContent='Your working photo was saved privately. You can now submit the full written answer.';
     file.value='';await listFiles();
    }catch(error){feedback.textContent='Evidence not saved: '+error.message}
    finally{upload.disabled=false}
   });
   void listFiles();
  }
 }
 function render(){
  list.replaceChildren();
  if(!items.length){
   list.append(el('p','You have no multi-mark constructed-response questions assigned yet. Your existing Daily and Weekly practice remains available.','mg2-help'));
   return;
  }
  for(const item of items){
   const card=el('article',undefined,'mg2-student-row');
   card.append(el('strong',item.qualification+' · '+item.academic_level),
    el('p',(item.question_key||'Original problem')+' · '+item.max_marks+' marks · '+item.plan,'mg2-help'));
   const name={assigned:'Open written working',submitted:'Awaiting examiner',released:'View detailed feedback'}[item.status]||'View assignment';
   const button=el('button',name,'mg2-secondary');
   button.type='button';
   button.addEventListener('click',()=>void open(item));
   card.append(button);
   list.append(card);
  }
 }
 async function refresh(){
  if(busy||disposed)return;
  setBusy(true);
  try{
   const data=await client.myOriginalAssignments({limit:20,offset});
   if(!Array.isArray(data?.items)||!Number.isInteger(data.total))
    throw Error('Invalid private assignment list.');
   items=data.items;render();
   back.disabled=offset<=0;next.disabled=offset+20>=data.total;
   announce(data.total+' private multi-mark assignment(s) found.');
  }catch(error){announce('Your multi-mark assignments could not be loaded: '+(error?.message||'Try again.'),true)}
  finally{setBusy(false)}
 }
 reload.addEventListener('click',()=>void refresh());
 back.addEventListener('click',()=>{if(offset>=20){offset-=20;void refresh()}});
 next.addEventListener('click',()=>{offset+=20;void refresh()});
 void refresh();
 return Object.freeze({refresh,destroy:()=>{disposed=true;root.replaceChildren()}});
}
