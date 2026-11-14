/* Human examiner question moderation, isolated staging mount.
 * Board/year maths and every method/accuracy/reasoning condition must be
 * verified by an independent human. No automated approval or publishing.
 */
const el=(tag,text,css)=>{
 const node=document.createElement(tag);
 if(text!==undefined)node.textContent=String(text);
 if(css)node.className=css;
 return node;
};
export function mountQuestionModeration(root,{client,confirmSignoff}={}){
 if(!root||typeof root.replaceChildren!=='function')throw Error('Moderation root required.');
 if(typeof client?.moderationQueue!=='function'||typeof client?.signoffRubric!=='function')
  throw Error('An authenticated reviewer client is required.');
 const confirm=typeof confirmSignoff==='function'?confirmSignoff:
  ()=>window.confirm('Sign this exact rubric and record your independent examiner checks?');
 let items=[],selected=null,busy=false;
 const view=el('section',undefined,'mg2-moderation');
 const intro=el('div',undefined,'mg2-mod-head');
 intro.append(el('p','INDEPENDENT EXAMINER MODERATION','mg2-eyebrow'),
  el('h2','Approve the maths before learners see it.','mg2-title'),
  el('p','Read the original question, worked solution, every alternative method and all mark dependencies. Your authenticated signoff is for this exact rubric version.','mg2-help'));
 const refresh=el('button','Refresh question reviews','mg2-secondary');
 refresh.type='button';intro.append(refresh);
 const listing=el('div',undefined,'mg2-moderation-list');
 const detail=el('div',undefined,'mg2-moderation-detail');
 const status=el('p','', 'mg2-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 view.append(intro,listing,detail,status);root.replaceChildren(view);
 function message(s,error=false){status.textContent=s;status.classList.toggle('mg2-error',error)}
 function changeBusy(v){busy=v;refresh.disabled=v;for(const button of view.querySelectorAll('button'))button.disabled=v}
 async function load(){
  if(busy)return;
  changeBusy(true);
  try{
   const data=await client.moderationQueue({limit:20,offset:0});
   if(!Array.isArray(data?.items))throw Error('Invalid protected moderation queue.');
   items=data.items;listing.replaceChildren();
   if(!items.length)listing.append(el('p','No unreviewed original questions are assigned to you.','mg2-help'));
   for(const rubric of items){
    const item=el('button',undefined,'mg2-queue-entry');item.type='button';
    item.dataset.rubric=rubric.rubric_id;
    item.append(el('strong',rubric.qualification+' · '+rubric.academic_level),
      el('span',rubric.board+' · '+rubric.syllabus_year+' · '+rubric.max_marks+' marks'),
      el('small',rubric.independent_reviews+' of 2 independent checks recorded'));
    item.addEventListener('click',()=>{if(busy)return;selected=rubric;renderDetail()});
    listing.append(item);
   }
   if(selected&&!items.some(x=>x.rubric_id===selected.rubric_id)){
    selected=null;detail.replaceChildren();
   }
   message('Independent reviewer inbox updated.');
  }catch(error){message('Cannot load question reviews: '+(error?.message||'Try again.'),true)}
  finally{changeBusy(false)}
 }
 function renderDetail(){
  detail.replaceChildren();if(!selected)return;
  const rubric=selected;
  detail.append(el('h3','Original question and full awarding guidance'),
   el('p','Syllabus objective: '+rubric.syllabus_objective,'mg2-help'),
   el('p','Originality declaration: '+rubric.source_declaration,'mg2-help'),
   el('p','Calculator: '+rubric.calculator_rule,'mg2-help'),
   el('p',rubric.question,'mg2-question'));
  const worked=el('details',undefined,'mg2-solution');
  worked.append(el('summary','Show complete worked solution'),
   el('p',rubric.worked_solution));
  detail.append(worked);
  for(const c of rubric.criteria||[]){
   const row=el('article',undefined,'mg2-criterion');
   row.append(el('strong',c.code+' · '+c.skill),
    el('p','Award condition: '+c.description,'mg2-help'),
    el('p','If uncredited: '+c.missingFeedback,'mg2-help'),
    el('p','Dependencies: '+(c.dependsOn||[]).join(', '),'mg2-deps'));
   detail.append(row);
  }
  const identity=el('p','Rubric fingerprint: '+rubric.fingerprint,'mg2-hash');
  detail.append(identity);
  const checks=el('fieldset',undefined,'mg2-mod-checks');
  checks.append(el('legend','Independent examiner checks'));
  const labels=[
   ['maths','I verified the mathematics and valid alternative methods.'],
   ['syllabus','I verified the exact board, syllabus year, level and topic.'],
   ['scheme','I checked the mark conditions, dependencies, follow-through and permitted notation.']
  ];
  const checkbox={};
  labels.forEach(([id,description])=>{
   const wrap=el('label',undefined,'mg2-inline');
   const input=document.createElement('input');input.type='checkbox';input.dataset.reviewCheck=id;
   checkbox[id]=input;wrap.append(input,el('span',description));checks.append(wrap);
  });
  detail.append(checks);
  const noteLabel=el('label',undefined,'mg2-field');
  noteLabel.append(el('span','Your independent examiner note (at least 25 characters)'));
  const note=document.createElement('textarea');note.rows=4;note.maxLength=2000;
  note.placeholder='Record exact equivalent methods considered, errors to watch and the syllabus mapping you inspected.';
  noteLabel.append(note);detail.append(noteLabel);
  detail.append(el('p','This signoff does not publish a question until a different qualified reviewer signs the same unchanged version.','mg2-help'));
  const submit=el('button','Sign off this exact question','mg2-primary');submit.type='button';
  detail.append(submit);
  submit.addEventListener('click',async()=>{
   if(busy)return;
   if(!Object.values(checkbox).every(x=>x.checked)){
    message('Complete all three independent reviewer checks.',true);return;
   }
   if(note.value.trim().length<25){
    message('Enter a substantive independent examiner observation.',true);return;
   }
   if(!confirm())return;
   changeBusy(true);
   try{
    const result=await client.signoffRubric({
     rubricId:rubric.rubric_id,fingerprint:rubric.fingerprint,
     note:note.value,
     mathsChecked:checkbox.maths.checked,
     syllabusChecked:checkbox.syllabus.checked,
     markSchemeChecked:checkbox.scheme.checked
    });
    message(result.approved?
     'Two independent reviews are recorded; the rubric is approved for controlled assignment.':
     'Your individual reviewer signoff is saved. Another independent reviewer must approve this unchanged rubric.');
    selected=null;detail.replaceChildren();
   }catch(error){message('Signoff was not saved: '+(error?.message||'Try again.'),true)}
   finally{
    changeBusy(false);
    // Keep the explicit outcome visible after the inbox refresh.
    const outcome=status.textContent;
    await load();message(outcome);
   }
  });
 }
 refresh.addEventListener('click',()=>void load());
 void load();
 return Object.freeze({refresh:()=>load(),destroy:()=>root.replaceChildren()});
}
