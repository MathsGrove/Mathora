import {
 validateExaminerRecord,prepareExaminerAwards,
 proposeRoleFeedback,validReleaseSummary
} from './examiner-assist.mjs';

const el=(tag,text,cls)=>{
 const n=document.createElement(tag);
 if(text!==undefined)n.textContent=String(text);
 if(cls)n.className=cls;
 return n;
};
const text=x=>typeof x==='string'?x:'';
const friendlyDate=value=>{
 const date=new Date(value);
 return Number.isFinite(date.getTime())?date.toLocaleString():'Submission time unavailable';
};

export function mountExaminerReviewQueue(root,{client,confirmRelease}={}){
 if(!root||typeof root.replaceChildren!=='function')throw Error('Examiner workbench root required.');
 for(const method of ['examinerQueue','examinerSubmission','savedExaminerMarks','saveReview']){
  if(typeof client?.[method]!=='function')throw Error('A guarded examiner client with '+method+' is required.');
 }
 const confirm=typeof confirmRelease==='function'?confirmRelease:
  ()=>window.confirm('Release this examiner-reviewed mark scheme and its reports? This cannot be undone.');
 const state={busy:false,loading:false,queue:[],total:0,offset:0,
  selected:null,record:null,rows:[],summaries:null,verified:false,sequence:0,notesDirty:false};

 const shell=el('div',undefined,'mg2-examiner');
 const header=el('div',undefined,'mg2-header');
 header.append(el('p','EXAMINER STUDIO · CONSTRUCTED RESPONSES','mg2-eyebrow'),
  el('h2','Review the method. Credit the evidence.','mg2-title'),
  el('p','Human-controlled marking. Each M1, A1, B1 or R1 decision needs a specific observation before a report can be released.','mg2-subtitle'));
 const body=el('div',undefined,'mg2-workspace');
 const sidebar=el('section',undefined,'mg2-sidebar');
 sidebar.setAttribute('aria-label','Pending submissions');
 const queueHead=el('div',undefined,'mg2-queue-head');
 const queueTitle=el('h3','Awaiting your review');
 const refresh=el('button','Refresh queue','mg2-secondary');
 refresh.type='button';
 queueHead.append(queueTitle,refresh);
 const queueSummary=el('p','Loading submitted work…','mg2-help');
 const queueList=el('div',undefined,'mg2-queue-list');
 const queueFoot=el('div',undefined,'mg2-queue-foot');
 const newer=el('button','Previous','mg2-tertiary'),older=el('button','Next','mg2-tertiary');
 for(const b of [newer,older])b.type='button';
 queueFoot.append(newer,older);
 sidebar.append(queueHead,queueSummary,queueList,queueFoot);
 const review=el('section',undefined,'mg2-review');
 review.setAttribute('aria-label','Examiner decision form');
 const empty=el('div',undefined,'mg2-empty');
 empty.append(el('h3','Choose a submitted answer'),el('p','Only authorised examiners can see private worked solutions and student evidence here.'));
 review.append(empty);
 body.append(sidebar,review);
 const status=el('p','', 'mg2-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 shell.append(header,body,status);
 root.replaceChildren(shell);

 function announce(message,error=false){
  status.textContent=message;
  status.classList.toggle('mg2-error',error);
 }
 function updateBusy(busy){
  state.busy=busy;
  refresh.disabled=busy;
  newer.disabled=busy||state.offset<=0;
  older.disabled=busy||state.offset+20>=state.total;
  for(const b of queueList.querySelectorAll('button'))b.disabled=busy;
  for(const b of review.querySelectorAll('button[data-action]'))b.disabled=busy;
 }
 function escapeRecord(record){
  // Strictly render untrusted student content via textContent only.
  // Do not use innerHTML, DOMParser, rich-text markup or HTML interpolation.
  return text(record);
 }
 function field(label,control){
  const wrap=el('label',undefined,'mg2-field');
  wrap.append(el('span',label),control);
  return wrap;
 }
 function textarea(rows,placeholder,max=1000){
  const t=document.createElement('textarea');
  t.rows=rows;t.maxLength=max;t.placeholder=placeholder;
  return t;
 }
 function renderQueue(){
  queueList.replaceChildren();
  queueSummary.textContent=state.total+' submitted answer'+(state.total===1?'':'s')+
    ' awaiting release. Show only the organisation you can examine.';
  if(!state.queue.length)queueList.append(el('p','No pending constructed-response submissions on this page.','mg2-empty-queue'));
  for(const item of state.queue){
   const btn=el('button',undefined,'mg2-queue-entry');
   btn.type='button';btn.dataset.attempt=item.attempt_id;
   btn.setAttribute('aria-pressed',String(state.selected===item.attempt_id));
   const topic=el('strong',text(item.topic)||'Assigned original question');
   const tags=el('span',(item.qualification||'Mathematics')+' · '+(item.academic_level||'')+
     ' · '+item.decisions_recorded+'/'+item.possible+' decisions');
   const when=el('small',friendlyDate(item.submitted_at));
   btn.append(topic,tags,when);
   btn.addEventListener('click',()=>void select(item.attempt_id));
   queueList.append(btn);
  }
  updateBusy(state.busy);
 }
 async function loadQueue({silent=false}={}){
  if(state.busy)return;
  updateBusy(true);
  try{
   const data=await client.examinerQueue({limit:20,offset:state.offset});
   if(!Array.isArray(data?.items)||!Number.isInteger(data.total))
    throw Error('Invalid protected examiner queue response.');
   state.queue=data.items;
   state.total=data.total;
   renderQueue();
   if(state.selected&&!state.queue.some(x=>x.attempt_id===state.selected)){
    state.selected=null;state.record=null;review.replaceChildren(el('p','Selected submission is no longer in the pending queue.'));
   }
   if(!silent)announce('Examiner queue updated.');
  }catch(error){announce('Could not load the queue: '+(error?.message||'Try again.'),true)}
  finally{updateBusy(false)}
 }
 async function select(id){
  if(state.busy)return;
  const selection=++state.sequence;
  updateBusy(true);announce('Loading submitted working and mark criteria…');
  try{
   const [record,saved]=await Promise.all([
    client.examinerSubmission(id),client.savedExaminerMarks(id)
   ]);
   if(selection!==state.sequence)return;
   validateExaminerRecord(record);
   if(!Array.isArray(saved?.awards)||saved.attempt_id!==record.attempt_id)
    throw Error('The saved marking draft did not match this submission.');
   const known=new Set(record.criteria.map(c=>c.id));
   if(saved.awards.some(c=>!known.has(c.id)))throw Error('Unexpected mark in saved draft.');
   state.selected=id;state.record=record;state.summaries=null;state.verified=false;
   state.notesDirty=false;
   const remembered=new Map(saved.awards.map(x=>[x.id,x]));
   state.rows=record.criteria.map(c=>{
    const previous=remembered.get(c.id);
    return {id:c.id,awarded:previous?.awarded??null,
     note:previous?.note||'',methodImplied:previous?.methodImplied===true,
     impliedReason:previous?.impliedReason||''};
   });
   renderReview();
   // Evidence files remain private: Storage lists only submitted work for
   // authenticated same-organisation examiners. Signed links last 60 seconds.
   if(typeof client.listEvidence==='function'&&typeof client.signedEvidenceUrl==='function'){
    try{
     const files=await client.listEvidence({attemptId:id,studentId:record.student_id});
     if(selection!==state.sequence)return;
     const paper=review.querySelector('.mg2-paper');
     if(paper&&files.length){
      const attachments=el('section',undefined,'mg2-private-evidence');
      attachments.append(el('h4','Submitted handwritten evidence'));
      for(const item of files){
       const link=el('button','Open '+item.name+' · secure temporary link','mg2-secondary');
       link.type='button';
       link.addEventListener('click',async()=>{
        try{
         const url=await client.signedEvidenceUrl(item.path);
         window.open(url,'_blank','noopener,noreferrer');
        }catch(error){announce('Private attachment unavailable: '+error.message,true)}
       });
       attachments.append(link);
      }
      paper.append(attachments);
     }
    }catch(error){announce('Submitted written response loaded; photo evidence unavailable: '+error.message,true)}
   }
   renderQueue();
   announce('Submitted working loaded. Review the evidence before awarding any mark.');
  }catch(error){
   announce('The selected submission is unavailable: '+(error?.message||'Permission denied.'),true);
  }finally{updateBusy(false)}
 }
 function collectDecisions(){
  const fields=review.querySelectorAll('[data-decision]');
  for(const fieldElement of fields){
   const idx=state.rows.findIndex(r=>r.id===fieldElement.dataset.decision);
   if(idx<0)continue;
   const row=state.rows[idx];
   const statusChoice=fieldElement.querySelector('[data-award]');
   row.awarded=statusChoice.value==='earned'?true:
    statusChoice.value==='missed'?false:null;
   row.note=fieldElement.querySelector('[data-evidence]').value;
   const check=fieldElement.querySelector('[data-implied]');
   row.methodImplied=check?.checked||false;
   row.impliedReason=fieldElement.querySelector('[data-implied-reason]')?.value||'';
  }
 }
 function readiness(){
  const marked=state.rows.filter(row=>row.awarded!==null).length;
  return {marked,total:state.record?.max_marks||0};
 }
 function renderReview(){
  review.replaceChildren();
  const record=state.record;
  if(!record){review.append(empty);return;}
  const rubricIntro=el('div',undefined,'mg2-section-head');
  rubricIntro.append(el('p','MARKING PAPER · HUMAN REVIEW','mg2-eyebrow'),
   el('h3',text(record.qualification)+' · '+text(record.academic_level)),
   el('p',record.max_marks+' individual credit decisions · Submitted '+friendlyDate(record.submitted_at),'mg2-help'));
  review.append(rubricIntro);
  const work=el('div',undefined,'mg2-paper');
  work.append(el('h4','Question'),el('p',escapeRecord(record.question),'mg2-question'),
   el('h4','Submitted student working'),el('pre',escapeRecord(record.written_work),'mg2-student-work'));
  const solution=document.createElement('details');
  solution.className='mg2-solution';
  solution.append(el('summary','View private worked solution'),el('p',escapeRecord(record.worked_solution)));
  work.append(solution);
  review.append(work);

  const form=el('div',undefined,'mg2-marks');
  form.append(el('h4','Award marks against the rubric'));
  state.rows.forEach((decision,index)=>{
   const rule=record.criteria[index];
   const card=el('section',undefined,'mg2-criterion');card.dataset.decision=rule.id;
   const head=el('div',undefined,'mg2-criterion-head');
   head.append(el('strong',rule.code+' · '+rule.skill),el('small','1 mark'));
   card.append(head,el('p',rule.description,'mg2-help'));
   const selector=document.createElement('select');
   selector.dataset.award='true';
   [['unknown','Choose a decision'],['earned','Credit awarded'],['missed','Credit withheld']]
    .forEach(([v,l])=>selector.append(new Option(l,v)));
   selector.value=decision.awarded===true?'earned':decision.awarded===false?'missed':'unknown';
   card.append(field('Examiner decision',selector));
   const note=textarea(2,'What specific evidence in this submitted working supports your decision?',1000);
   note.dataset.evidence='true';note.value=decision.note;
   card.append(field('Specific observation — required for credited marks',note));
   if(rule.code==='A1'&&rule.allowImpliedMethod){
    const implied=el('label',undefined,'mg2-inline');
    const check=document.createElement('input');check.type='checkbox';
    check.dataset.implied='true';check.checked=decision.methodImplied;
    implied.append(check,el('span','Allow implied method only when written evidence justifies it'));
    card.append(implied);
    const reason=textarea(2,'Explain why the missing method was implied by demonstrated working.',500);
    reason.dataset.impliedReason='true';reason.value=decision.impliedReason;
    card.append(field('Implied-method rationale',reason));
   }
   if(rule.dependsOn?.length)card.append(el('p','Dependencies: '+rule.dependsOn.join(', '),'mg2-deps'));
   if(rule.missingFeedback)card.append(el('p','If not credited: '+rule.missingFeedback,'mg2-hint'));
   form.append(card);
  });
  review.append(form);

  const tools=el('div',undefined,'mg2-examiner-actions');
  const progress=el('p','', 'mg2-progress');
  const preview=el('button','Prepare feedback suggestions','mg2-secondary');
  const save=el('button','Save completed marking draft','mg2-secondary');
  const release=el('button','Release reviewed report','mg2-primary');
  for(const [button,act] of [[preview,'preview'],[save,'save'],[release,'release']]){
   button.dataset.action=act;button.type='button';
  }
  tools.append(progress,preview,save,release);review.append(tools);
  const summaryArea=el('section',undefined,'mg2-feedback');
  summaryArea.setAttribute('aria-label','Editable feedback report summaries');
  summaryArea.append(el('p','Select “Prepare feedback suggestions” after marking every criterion. Suggested text is editable and requires examiner review.','mg2-help'));
  review.append(summaryArea);
  const verifiedLabel=el('label',undefined,'mg2-inline mg2-attest');
  const verified=document.createElement('input');verified.type='checkbox';
  verified.dataset.verified='true';verified.checked=state.verified;
  verifiedLabel.append(verified,el('span','I have checked the student working, every mark and all three edited audience summaries.'));
  review.append(verifiedLabel);
  verified.addEventListener('change',()=>{state.verified=verified.checked});
  const invalidate=()=>{
   state.verified=false;verified.checked=false;
   const done=readiness();progress.textContent=done.marked+' / '+done.total+' marking decisions recorded';
  };
  form.addEventListener('input',()=>{collectDecisions();state.summaries=null;invalidate()});
  form.addEventListener('change',()=>{collectDecisions();state.summaries=null;invalidate()});
  preview.addEventListener('click',()=>{
   try{
    collectDecisions();
    const proposal=proposeRoleFeedback(record,state.rows);
    state.summaries={
     studentSummary:proposal.studentSummary,
     parentSummary:proposal.parentSummary,
     tutorPlan:proposal.tutorPlan
    };
    state.verified=false;verified.checked=false;
    renderSummaries(summaryArea,proposal,verified);
    announce('Feedback suggestions created from examiner decisions. Review and edit each audience before release.');
   }catch(err){announce('Complete marking before suggesting feedback: '+err.message,true);}
  });
  save.addEventListener('click',()=>void persist(false,summaryArea,verified));
  release.addEventListener('click',()=>void persist(true,summaryArea,verified));
  invalidate();
 }
 function renderSummaries(root,proposal,verified){
  root.replaceChildren();
  root.append(el('h4','Role-specific feedback · edit before release'),
   el('p',proposal.scorePreview.earned+' / '+proposal.scorePreview.possible+
    ' marks in this examiner preview; the server recalculates the final total.','mg2-help'));
  for(const [key,label] of [
   ['studentSummary','Student · clear next steps'],
   ['parentSummary','Parent · supportive discussion prompts'],
   ['tutorPlan','Tutor · teaching intervention']
  ]){
   const entry=textarea(5,'Edit this examiner-approved audience summary.',3000);
   entry.value=state.summaries[key];
   entry.dataset.summary=key;
   entry.addEventListener('input',()=>{
    state.summaries[key]=entry.value;state.verified=false;verified.checked=false;
   });
   root.append(field(label,entry));
  }
  root.append(el('p','These are draft words about this question, not proof of mastery or a predicted grade. Release requires an examiner acknowledgement and confirmation.','mg2-help'));
 }
 async function persist(release,summaryArea,verified){
  if(state.busy||!state.record)return;
  let awards;
  try{
   collectDecisions();
   awards=prepareExaminerAwards(state.record,state.rows);
   if(release){
    if(!state.summaries)throw Error('Generate and check feedback suggestions before releasing.');
    if(!state.verified||!verified.checked)throw Error('Confirm that you personally reviewed the working and audience summaries.');
    if(![state.summaries.studentSummary,state.summaries.parentSummary,state.summaries.tutorPlan].every(validReleaseSummary))
     throw Error('Each audience summary must contain 15–3,000 characters.');
    if(!confirm())return;
   }
  }catch(error){announce('Review is incomplete: '+error.message,true);return;}
  updateBusy(true);
  try{
   const result=await client.saveReview({
    attemptId:state.record.attempt_id,awards,release,
    ...(release?state.summaries:{})
   });
   if(result?.earned!==awards.filter(x=>x.awarded).length||result?.possible!==state.record.max_marks)
    throw Error('Server and examiner mark totals differ. Contact an administrator.');
   if(release){
    state.selected=null;state.record=null;state.rows=[];state.summaries=null;
    review.replaceChildren(el('p','Report released after your explicit examiner confirmation.','mg2-done'));
    announce('Examiner-confirmed report released and its score recalculated server-side.');
    updateBusy(false);
    await loadQueue({silent:true});
   }else announce('Mark decisions saved. You can return later; no learner report was released.');
  }catch(error){announce('The marking was not confirmed: '+(error?.message||'Try again.'),true)}
  finally{updateBusy(false)}
 }
 refresh.addEventListener('click',()=>void loadQueue());
 newer.addEventListener('click',()=>{if(state.offset>=20){state.offset-=20;void loadQueue();}});
 older.addEventListener('click',()=>{if(state.offset+20<state.total){state.offset+=20;void loadQueue();}});
 void loadQueue();
 return Object.freeze({refresh:()=>loadQueue(),destroy:()=>{state.sequence++;root.replaceChildren()}});
}
