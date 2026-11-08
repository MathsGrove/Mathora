/* MathsGrove examiner review — question-level marks, timings and original evidence. */
export function initAssignedAdmin(db,state){
 const $=id=>document.getElementById(id),list=$('mg-assigned-admin-rows'),summary=$('mg-assigned-admin-summary');
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n};
 let rowsCache=[],studentFilter='';
 const modes={daily:'Daily practice',weekly:'Weekly paper',exam_daily:'Exam Daily',mock_pending:'Moderated mock placeholder',mock:'20-question timed monthly mock'};
 const info=(parent,message)=>{const node=el('p',message,'mg-review-status');parent.append(node);return node};
 async function displayEvidence(root,items){
  for(const f of items||[]){
   const cell=el('div',undefined,'mg-evidence-preview');
   const link=el('a',(f.kind==='whiteboard'?'Whiteboard':'Student photo')+' · '+(f.name||'Working'));
   link.target='_blank';link.rel='noopener noreferrer';
   const {data,error}=await db.storage.from('student-work').createSignedUrl(f.path,900);
   if(error||!data?.signedUrl){cell.append(el('span','File unavailable — check secure storage.'));root.append(cell);continue}
   link.href=data.signedUrl;
   const img=document.createElement('img');img.src=data.signedUrl;img.loading='lazy';img.alt='Submitted student '+f.kind+' working';img.referrerPolicy='no-referrer';
   cell.append(link,img);root.append(cell);
  }
 }
 async function showReview(task,root){
  const container=el('div',undefined,'mg-manual-review');
  container.append(info(container,'Loading examiner-only question records…'));
  root.append(container);
  try{
   const {data,error}=await db.rpc('grove_staff_review_task',{p_task:task.task_id});
   if(error||!Array.isArray(data?.items))throw Error(error?.message||'The private question record is unavailable.');
   container.replaceChildren();
   const intro=el('p','Give a mark out of 1 for each question and explain the student’s method. The answer choice is a guide; the examiner makes the final judgement.','mg-review-guidance');
   container.append(intro);
   const rows=[];
   for(const q of data.items){
    const panel=el('article',undefined,'mg-mark-item');
    const top=el('div',undefined,'mg-mark-header');
    top.append(el('strong','Question '+q.position+' · '+q.topic),el('span',q.seconds_visible+' sec visible'));
    panel.append(top);
    const question=el('div',undefined,'mg-mark-prompt');
    if(window.MathsGroveMath?.write)window.MathsGroveMath.write(question,q.prompt);else question.textContent=q.prompt;
    panel.append(question);
    const choices=el('div',undefined,'mg-mark-choices');
    for(const c of q.choices||[]){
     const answer=el('div',undefined,'mg-mark-choice'+(q.selected===c.id?' chosen':''));
     const title=el('strong',c.id+' · ');
     const value=el('span');if(window.MathsGroveMath?.write)window.MathsGroveMath.write(value,c.text);else value.textContent=c.text;
     answer.append(title,value);
     if(q.selected===c.id)answer.append(el('small',' · Student selected'));
     if(q.correct_option===c.id)answer.append(el('small',' · Answer key'));
     choices.append(answer);
    }
    panel.append(choices);
    const gallery=el('div',undefined,'mg-evidence-gallery');panel.append(gallery);
    if(q.evidence?.length)await displayEvidence(gallery,q.evidence);
    else gallery.append(el('p','No drawing or photograph was submitted for this question.','mg-review-hint'));
    const markLabel=el('label','Examiner mark / 1');const mark=el('select');
    mark.append(new Option('Not yet marked',''),new Option('0 — No credit','0'),new Option('1 — Award mark','1'));
    mark.value=q.mark===null||q.mark===undefined?'':String(q.mark);markLabel.append(mark);
    const commentLabel=el('label','Question feedback');const comment=el('textarea');
    comment.rows=2;comment.maxLength=1000;comment.placeholder='Mention the method, any misconception and what to improve.';
    comment.value=q.comment||'';commentLabel.append(comment);panel.append(markLabel,commentLabel);
    container.append(panel);rows.push({position:q.position,mark,comment});
   }
   const overall=el('label','Examiner summary and next step');
   const input=el('textarea');input.rows=4;input.maxLength=2500;
   input.placeholder='Describe an evidenced strength, a priority, and an actionable next practice step. Minimum 15 characters for release.';
   input.value=task.teacher_feedback||'';overall.append(input);container.append(overall);
   const actions=el('div',undefined,'mg-mark-actions');
   const draft=el('button','Save marks (draft)'),release=el('button','Release examiner report ↗');
   draft.type=release.type='button';release.className='mg-mark-release';
   const notice=info(container,'Mark every question before releasing. Drafts remain private.');
   async function save(releasing){
    draft.disabled=release.disabled=true;notice.textContent='Saving secure examiner marking…';
    try{
     const marks=rows.filter(x=>x.mark.value!=='').map(x=>({position:x.position,mark:Number(x.mark.value),comment:x.comment.value.trim()}));
     if(releasing&&marks.length!==rows.length)throw Error('Mark every question before releasing this assessment.');
     const {data:result,error}=await db.rpc('grove_staff_mark_task',{
      p_task:task.task_id,p_marks:marks,p_feedback:input.value.trim(),p_release:releasing
     });
     if(error||!result?.ok)throw Error(error?.message||'Marking could not be saved.');
     notice.textContent=releasing?'Examiner report released. Student dashboard and analytics will show the reviewed marks.':'Draft marks securely saved. The student cannot see them yet.';
     if(releasing)await refresh();
    }catch(e){notice.textContent=e.message||'Could not save marking.'}
    finally{draft.disabled=release.disabled=false}
   }
   draft.addEventListener('click',()=>void save(false));release.addEventListener('click',()=>void save(true));
   actions.append(draft,release);container.append(actions);
  }catch(error){container.replaceChildren(el('p','Unable to open examiner review: '+error.message,'mg-review-status'))}
 }
 async function refresh(){
  if(!state.membership?.org_id)return;
  const {data,error}=await db.rpc('grove_admin_schedule',{p_org:state.membership.org_id});
  if(error){summary.textContent='Cannot fetch assignments: '+error.message;list.replaceChildren();throw Error(error.message)}
  const rows=Array.isArray(data?.assignments)?data.assignments:[];
  state.assignedReviewRows=rows.filter(x=>['completed','expired'].includes(x.status)&&x.review_status!=='released');
  state.assignedReleasedCount=rows.filter(x=>x.review_status==='released').length;
  const awaiting=rows.filter(x=>['completed','expired'].includes(x.status)&&x.review_status!=='released');
  const released=rows.filter(x=>x.review_status==='released'),active=rows.filter(x=>x.status==='active');
  summary.replaceChildren();
  for(const [num,label] of [[awaiting.length,'AWAITING EXAMINER'],[released.length,'REPORTS RELEASED'],[active.length,'IN PROGRESS']]){
   const cell=el('div');cell.append(el('strong',num),el('span',label));summary.append(cell);
  }
  rowsCache=rows;
  state.assignedAllRows=rows;
  renderRows();
  state.onAssignedRefresh?.();
 }
 $('mg-assigned-admin-refresh').addEventListener('click',()=>void refresh());
 setInterval(()=>{if(!document.hidden&&!$('mg-assigned-admin').closest('[data-panel]')?.hidden&&!list.querySelector('.mg-assigned-detail[open]'))void refresh()},60000);
 function renderRows(){
  const rows=studentFilter?rowsCache.filter(r=>r.student_id===studentFilter):rowsCache;
  list.replaceChildren();
  if(!rows.length){list.append(el('p','New daily and weekly assignments appear here as students begin their programme.'));return}
  const ordered=[...rows].sort((a,b)=>{
   const rank=r=>['completed','expired'].includes(r.status)?(r.review_status==='released'?2:0):r.status==='active'?1:3;
   const priority=rank(a)-rank(b);if(priority)return priority;
   const at=r=>Date.parse(r.submitted_at||r.started_at||((r.due_date||'1970-01-01')+'T12:00:00Z'))||0;
   return rank(a)===0?at(a)-at(b):at(b)-at(a);
  });
  for(const r of ordered.slice(0,75)){
   const card=el('div',undefined,'mg-assigned-row'),meta=el('div',undefined,'mg-task-meta');
   card.dataset.taskId=r.task_id;card.dataset.studentId=r.student_id;
   const stage=r.review_status==='released'?'Released · '+r.score+'/'+r.question_count:
    r.status==='completed'||r.status==='expired'?'Ready to mark':
    r.status==='active'?'In progress':r.mode==='mock_pending'?'Awaiting a moderated mock':'Upcoming';
   meta.append(el('strong',r.student_name||'Student'),
    el('small',[modes[r.mode]||r.mode,r.qualification,r.level,'Scheduled '+r.due_date].join(' · ')),
    el('small',r.submitted_at?'Submitted '+new Date(r.submitted_at).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}):'Not yet submitted'),
    el('span',stage+' · '+(r.minutes_visible||0)+' min of recorded question visibility','mg-task-status'));
   card.append(meta);
   if(['completed','expired'].includes(r.status)&&r.mode!=='mock_pending'){
    const detail=el('details',undefined,'mg-assigned-detail');detail.append(el('summary','Open examiner review · '+r.question_count+' questions, timings & submitted working'));
    detail.addEventListener('toggle',()=>{if(detail.open&&!detail.dataset.loaded){detail.dataset.loaded='yes';void showReview(r,detail)}});
    card.append(detail);
   }else card.append(el('p',r.status==='scheduled'?'Opens on the scheduled date.':'The learner is still working or this mock requires publication.','mg-review-hint'));
   list.append(card);
  }

 }
 function setStudentFilter(id){studentFilter=String(id||'');renderRows()}
 function openTask(id){
  const target=rowsCache.find(r=>r.task_id===id);
  if(!target)return;
  studentFilter=target.student_id;renderRows();
  const card=[...list.querySelectorAll('[data-task-id]')].find(node=>node.dataset.taskId===id);
  if(!card)return;
  const details=card.querySelector('details');
  if(details)details.open=true;
  card.scrollIntoView({behavior:'smooth',block:'start'});
 }
 return {refresh,setStudentFilter,openTask}
}
