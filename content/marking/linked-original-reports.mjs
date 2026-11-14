/* Read-only original multi-mark feedback for a verified linked guardian or tutor.
 * The database validates the active invitation + student organisation on EVERY
 * list and detail request; the browser role is not an authority source.
 */
const el=(tag,text,cls)=>{
 const node=document.createElement(tag);
 if(text!==undefined)node.textContent=String(text);
 if(cls)node.className=cls;
 return node;
};
export function mountLinkedOriginalReports(root,{client,studentId,role}={}){
 if(!root||typeof root.replaceChildren!=='function')throw Error('Linked report root required.');
 if(!['parent','tutor'].includes(role))throw Error('Explicit authorised audience required.');
 if(typeof client?.linkedOriginalReports!=='function'||
    typeof client?.linkedLearnerReport!=='function')throw Error('Linked Auth report API required.');
 let disposed=false,active=null;
 const wrap=el('section',undefined,'mg2-linked-originals');
 wrap.append(el('h3',role==='parent'?'Examiner-reviewed mathematical progress':
  'Criterion-level teaching evidence'));
 const intro=el('p',role==='parent'?
  'See only released marks and a supportive examiner-approved explanation for your linked learner.':
  'View released examiner evidence and a practical intervention plan for this linked learner.','mg2-help');
 const button=el('button','Refresh independently reviewed reports','mg2-secondary');
 button.type='button';
 const list=el('div',undefined,'mg2-linked-list');
 const detail=el('div',undefined,'mg2-linked-detail');
 const status=el('p','', 'mg2-status');status.setAttribute('role','status');
 wrap.append(intro,button,list,detail,status);root.replaceChildren(wrap);
 const info=(m,error=false)=>{status.textContent=m;status.classList.toggle('mg2-error',error)};
 async function show(attemptId){
  if(disposed)return;active=attemptId;detail.replaceChildren();
  try{
   const data=await client.linkedLearnerReport(attemptId,role);
   if(disposed||active!==attemptId)return;
   if(data?.released!==true||data.view_role!==role)
    throw Error('A released report for this linked audience was not returned.');
   detail.append(el('p',data.earned+' / '+data.possible+' examiner-awarded marks','mg2-mark-score'));
   if(role==='parent'){
    detail.append(el('p',data.summary||'No approved guardian summary was supplied.','mg2-report-summary'));
   }else{
    detail.append(el('p',data.teaching_plan||'No approved tutor guidance was supplied.','mg2-report-summary'));
    const criteria=el('ol',undefined,'mg2-report-criteria');
    for(const mark of data.criteria||[]){
     const item=el('li',undefined,mark.awarded?'mg2-earned':'mg2-unearned');
     item.append(el('strong',mark.code+' · '+mark.skill+(mark.awarded?' · credited':' · not credited')),
      el('p',mark.nextPractice||'Discuss with the learner.'),
      el('small',mark.examinerEvidence||'No separate examiner observation supplied.'));
     criteria.append(item);
    }
    detail.append(criteria);
   }
   detail.append(el('p','This is evidence from one assessed question, not an exam-board grade prediction.','mg2-help'));
   info('Approved '+role+' report loaded.');
  }catch(error){info('The linked report is unavailable: '+(error?.message||'Try again.'),true)}
 }
 async function refresh(){
  if(disposed)return;
  button.disabled=true;detail.replaceChildren();active=null;
  try{
   const data=await client.linkedOriginalReports(studentId,role,{limit:20});
   if(disposed)return;
   if(data?.view_role!==role||data.student_id!==studentId||!Array.isArray(data.items))
    throw Error('Linked report access could not be verified.');
   list.replaceChildren();
   if(!data.items.length)list.append(el('p','No independently reviewed multi-mark assessments have been released for this learner yet.','mg2-help'));
   for(const record of data.items){
    const card=el('article',undefined,'mg2-student-row');
    card.append(el('strong',record.qualification+' · '+record.academic_level),
     el('p',record.question_key+' · '+record.earned+' / '+record.possible+' marks','mg2-help'));
    const open=el('button',role==='parent'?'Read guardian explanation':'Read tutor intervention','mg2-secondary');
    open.type='button';open.addEventListener('click',()=>void show(record.attempt_id));
    card.append(open);list.append(card);
   }
   info(data.total+' released assessment(s) available for the selected '+role+' view.');
  }catch(error){
   list.replaceChildren();
   info('Cannot retrieve linked learner assessments: '+(error?.message||'Access may have expired.'),true);
  }finally{button.disabled=false}
 }
 button.addEventListener('click',()=>void refresh());
 void refresh();
 return Object.freeze({refresh,destroy:()=>{disposed=true;root.replaceChildren()}});
}
