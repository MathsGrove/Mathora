/* Controlled MathsGrove examiner authoring and assignment panel.
   The server, never this form, derives author and organisation permissions. */
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);if(cls)e.className=cls;return e};
const field=(name,control)=>{const label=el('label',undefined,'mg2-field');label.append(el('span',name),control);return label};
const input=(placeholder,max=150)=>{const x=document.createElement('input');x.type='text';x.placeholder=placeholder;x.maxLength=max;return x};
const area=(placeholder,max=1000,rows=3)=>{const x=el('textarea');x.placeholder=placeholder;x.maxLength=max;x.rows=rows;return x};
const choices=values=>{const x=el('select');for(const v of values)x.add(new Option(v,v));return x};
const levels={GCSE:['Foundation','Higher'],IGCSE:['Core','Extended'],AS_A_LEVEL:['AS','A Level'],
 'Further Mathematics':['AS','A Level'],IB:['AA SL','AA HL','AI SL','AI HL']};
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
export function mountOriginalAuthoring(root,{client,orgId,roster=[]}={}){
 if(!root||typeof root.replaceChildren!=='function'||!uuid.test(orgId||''))throw Error('Authorised staff and organisation context required.');
 for(const name of ['authorOriginalDraft','approvedOriginals','assignConstructed'])
  if(typeof client?.[name]!=='function')throw Error('Authenticated marking client missing: '+name);
 let busy=false,rows=[],index=0,offset=0;
 const panel=el('section',undefined,'mg2-authoring');
 panel.append(el('h2','Create an original question. Verify every mark.','mg2-title'),
  el('p','All new questions start as private drafts. Two independent examiners must approve the unchanged rubric before a student can receive it.','mg2-help'));
 const form=el('form',undefined,'mg2-authoring-form');form.noValidate=true;
 const key=input('e.g. gcse-fractions-2026-01',80);
 const qualification=choices(Object.keys(levels));
 const level=choices(levels[qualification.value]);
 const board=input('AQA, Pearson Edexcel, Cambridge International or IB',120);
 const year=input('Syllabus year',4);year.value=String(new Date().getUTCFullYear());
 const plan=choices(['weekly','daily','exam']);
 const calculator=choices(['not_allowed','allowed','paper_specific']);
 const objective=area('Exact syllabus objective being assessed',1000);
 const provenance=area('How you authored this original question and verified reuse rights',2000);
 const question=area('Fully written original question',5000,5);
 const solution=area('Step-by-step solution and valid equivalent methods',10000,6);
 for(const [label,control] of [
  ['Original question key',key],['Academic qualification',qualification],
  ['Level',level],['Awarding body',board],['Syllabus year',year],
  ['Grove programme',plan],['Calculator rule',calculator],
  ['Specific curriculum objective',objective],['Originality and content-rights declaration',provenance],
  ['Question text',question],['Independently checkable worked solution',solution]
 ])form.append(field(label,control));
 qualification.addEventListener('change',()=>{
  level.replaceChildren(...levels[qualification.value].map(v=>new Option(v,v)));
  for(const r of rows){
   const allowed=qualification.value==='IB'?['M1','A1','R1']:['M1','A1','B1'];
   r.code.replaceChildren(...allowed.map(v=>new Option(v,v)));
  }
 });
 form.append(el('h3','Mark-by-mark award conditions'),
  el('p','Every point must have a criterion ID, exact evidence condition and useful withheld-credit feedback. A1 requires an earlier M1.','mg2-help'));
 const criteria=el('div',undefined,'mg2-authoring-criteria');form.append(criteria);
 const add=el('button','Add 1-mark criterion','mg2-secondary');add.type='button';form.append(add);
 const save=el('button','Save private draft for independent review','mg2-primary');save.type='submit';form.append(save);
 const feedback=el('p','', 'mg2-status');feedback.setAttribute('role','status');form.append(feedback);
 const assigned=el('section',undefined,'mg2-inventory');
 assigned.append(el('h3','Approved originals · assign to a learner'));
 const refresh=el('button','Refresh independently approved questions','mg2-secondary');refresh.type='button';
 const inventory=el('div',undefined,'mg2-inventory-list');
 const navigation=el('div',undefined,'mg2-inventory-paging');
 const prev=el('button','Previous','mg2-tertiary');prev.type='button';
 const next=el('button','Next','mg2-tertiary');next.type='button';
 navigation.append(prev,next);
 const actionMessage=el('p','', 'mg2-status');actionMessage.setAttribute('role','status');
 assigned.append(refresh,inventory,navigation,actionMessage);
 panel.append(form,assigned);root.replaceChildren(panel);
 const note=(node,message,error=false)=>{node.textContent=message;node.classList.toggle('mg2-error',error)};
 const setBusy=v=>{busy=v;panel.querySelectorAll('button,input,textarea,select').forEach(x=>x.disabled=v)};
 function addMark(){
  if(rows.length>=30||busy)return;
  const box=el('article',undefined,'mg2-author-mark');
  const allowed=qualification.value==='IB'?['M1','A1','R1']:['M1','A1','B1'];
  const code=choices(allowed),id=input('e.g. m-setup',71),skill=input('Skill',150),
   description=area('Exact award condition',1000,2),
   missingFeedback=area('Specific step if mark is missed',1000,2),
   implied=document.createElement('input');
  implied.type='checkbox';index++;id.value='m-step-'+index;
  box.append(el('strong','Criterion '+(rows.length+1)),field('Mark code',code),field('Criterion identifier',id),
   field('Skill',skill),field('Award condition',description),field('When credit is withheld',missingFeedback));
  const label=el('label',undefined,'mg2-inline');label.append(implied,el('span','A1 only: allow examiner-justified implied method'));
  box.append(label);
  const remove=el('button','Remove criterion','mg2-tertiary');remove.type='button';box.append(remove);
  const model={code,id,skill,description,missingFeedback,implied,box};
  rows.push(model);
  remove.addEventListener('click',()=>{if(busy)return;rows=rows.filter(r=>r!==model);box.remove()});
  criteria.append(box);
 }
 function buildCriteria(){
  const seen=new Set(),output=[];
  for(const r of rows){
   const id=r.id.value.trim(),code=r.code.value;
   if(!/^[a-z][a-z0-9-]{1,70}$/.test(id)||seen.has(id))throw Error('Use unique lowercase criterion IDs.');
   const skill=r.skill.value.trim(),description=r.description.value.trim(),missing=r.missingFeedback.value.trim();
   if(skill.length<4||description.length<10||missing.length<15)throw Error('Every criterion needs a substantive skill, award rule and correction.');
   const previous=output.filter(x=>x.code==='M1');
   if(code==='A1'&&!previous.length)throw Error('Put an M1 method criterion before every A1 accuracy mark.');
   if(r.implied.checked&&code!=='A1')throw Error('Only A1 permits implied-method exceptions.');
   output.push({id,code,skill,description,missingFeedback:missing,
    dependsOn:code==='A1'?[previous.at(-1).id]:[],
    ...(code==='A1'?{allowImpliedMethod:r.implied.checked}:{})});
   seen.add(id);
  }
  if(output.length===0)throw Error('Add at least one award criterion.');
  return output;
 }
 add.addEventListener('click',addMark);addMark();
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;
  let awards;try{awards=buildCriteria()}catch(error){note(feedback,error.message,true);return}
  setBusy(true);
  try{
   const draft=await client.authorOriginalDraft({orgId,questionKey:key.value.trim(),
    qualification:qualification.value,academicLevel:level.value,examBoard:board.value,
    syllabusYear:year.value,plan:plan.value,calculatorRule:calculator.value,
    syllabusObjective:objective.value,sourceDeclaration:provenance.value,
    question:question.value,solution:solution.value,criteria:awards});
   if(draft?.status!=='draft'||!draft.rubric_id)throw Error('Server did not confirm private draft.');
   note(feedback,'Saved version '+draft.version_no+' as a private original. Two different examiners must now review it.');
  }catch(error){note(feedback,'Draft not created: '+(error?.message||'Try again.'),true)}
  finally{setBusy(false)}
 });
 async function refreshApproved(){
  if(busy)return;setBusy(true);
  try{
   const data=await client.approvedOriginals({limit:20,offset});
   if(!Array.isArray(data?.items)||!Number.isInteger(data.total))throw Error('Invalid protected inventory.');
   inventory.replaceChildren();
   if(!data.items.length)inventory.append(el('p','No independently approved originals are available yet.','mg2-help'));
   for(const q of data.items){
    const card=el('article',undefined,'mg2-approved-question');
    card.append(el('strong',q.qualification+' · '+q.academic_level+' · '+q.question_key),
     el('p',q.exam_board+' '+q.syllabus_year+' · '+q.max_marks+' marks · '+q.plan,'mg2-help'));
    if(roster.length){
     const student=el('select');
     for(const item of roster)student.add(new Option(item.name||'Enrolled learner',item.id));
     const assign=el('button','Assign approved original','mg2-primary');assign.type='button';
     card.append(field('Enrolled student',student),assign);
     assign.addEventListener('click',async()=>{
      if(busy)return;setBusy(true);
      try{
       const result=await client.assignConstructed({rubricId:q.rubric_id,studentId:student.value});
       if(!result?.attempt_id)throw Error('No verified assignment was created.');
       note(actionMessage,'Original assigned to the selected learner. Their private practice list will show it.');
      }catch(error){note(actionMessage,'Not assigned: '+(error?.message||'Try again.'),true)}
      finally{setBusy(false)}
     });
    }else card.append(el('p','No enrolled students currently available.','mg2-help'));
    inventory.append(card);
   }
   prev.disabled=offset===0;next.disabled=offset+20>=data.total;
   note(actionMessage,data.total+' approved original questions in this staff-only inventory.');
  }catch(error){note(actionMessage,'Inventory unavailable: '+(error?.message||'Try again.'),true)}
  finally{setBusy(false)}
 }
 refresh.addEventListener('click',()=>void refreshApproved());
 prev.addEventListener('click',()=>{if(offset>=20){offset-=20;void refreshApproved()}});
 next.addEventListener('click',()=>{offset+=20;void refreshApproved()});
 void refreshApproved();
 return Object.freeze({refresh:refreshApproved,destroy:()=>root.replaceChildren()});
}
