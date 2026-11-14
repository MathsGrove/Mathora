import {reviewPublicPracticeExample,validateExamStyle} from './exam-style-policy.mjs';
import {buildFictionalRoleReport} from './criterion-engine.mjs';

const $=id=>document.getElementById(id);
const node=(tag,value,css)=>{
 const n=document.createElement(tag);
 if(value!==undefined)n.textContent=String(value);
 if(css)n.className=css;
 return n;
};
const preview=$('preview'),message=$('notice'),listing=$('question');
let examples=[],current=null,role='student',result=null;
const choices=['Not assessed','Credit earned','Credit not earned'];

function setStatus(messageText,error=false){
 message.replaceChildren(node('p',messageText,error?'notice-error':'notice-info'));
}
function labelWrap(text,control){
 const label=node('label',text);
 label.append(control);
 return label;
}
function setRoleButtons(){
 document.querySelectorAll('[data-role]').forEach(button=>{
  button.setAttribute('aria-pressed',String(button.dataset.role===role));
 });
}
function fillMeta(example){
 const metadata=$('meta');metadata.replaceChildren();
 const fields=[
  example.route.qualification+' · '+example.route.level,
  example.plan==='daily'?'Grove Daily':example.plan==='weekly'?'Grove Weekly':'Grove Exam',
  example.format==='single_choice'?'Multiple choice · one mark':'Constructed response · '+example.maxMarks+' marks',
  example.route.calculator==='not_allowed'?'Non-calculator':example.route.calculator==='allowed'?'Calculator permitted':'Calculator policy is paper-specific'
 ];
 for(const field of fields)metadata.append(node('span',field,'meta-tag'));
}
function showQuestion(){
 current=examples.find(x=>x.id===listing.value)||examples[0];
 if(!current)return;
 listing.value=current.id;
 result=null;
 $('report').replaceChildren(node('p','No report yet. Examiner decisions must be complete before generating a fictional preview.','empty'));
 message.replaceChildren();
 const policy=validateExamStyle(current);
 $('prompt').textContent=current.question;
 $('solution').textContent=current.solution;
 $('solution-panel').open=false;
 fillMeta(current);
 const marking=$('marking');marking.replaceChildren();
 const heading=node('h3','Mark-by-mark examiner decisions');
 marking.append(heading);
 if(policy.format==='single_choice'){
  marking.append(node('p','TMUA-style questions have one correct option. Do not invent M, A or B working marks. This is only a public sample.','fine'));
  const fieldset=node('fieldset');fieldset.id='mcq-options';
  const legend=node('legend','Fictional response (choose one option)');fieldset.append(legend);
  for(const choice of current.choices){
   const row=node('label',undefined,'option-row');
   const input=document.createElement('input');input.type='radio';input.name='mcq-answer';input.value=choice.id;
   row.append(input,node('span',choice.id+' · '+choice.text));fieldset.append(row);
  }
  marking.append(fieldset);
  return;
 }
 marking.append(node('p','Every criterion requires an explicit mark decision. No credit is inferred from the final answer. Evidence notes are kept inside this local demonstration.','fine'));
 const list=node('div',undefined,'criteria');
 for(const c of current.criteria){
  const card=node('section',undefined,'criterion');
  card.dataset.criterion=c.id;
  const head=node('div',undefined,'criterion-head');
  head.append(node('span',c.code,'code'),node('strong',c.skill));
  card.append(head,node('p',c.description,'fine'));
  const selector=document.createElement('select');
  selector.name='mark-'+c.id;selector.dataset.award=c.id;
  choices.forEach((x,i)=>selector.append(new Option(x,['unknown','earned','missed'][i])));
  selector.value='unknown';
  card.append(labelWrap('Award decision',selector));
  const input=document.createElement('textarea');
  input.name='evidence-'+c.id;input.dataset.evidence=c.id;input.rows=2;
  input.maxLength=600;input.placeholder='Quote a specific step in this fictional working; do not enter learner identifiers.';
  card.append(labelWrap('Examiner observation (mandatory for awarded credit)',input));
  if(c.code==='A1'&&c.allowImpliedMethod){
   const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.dataset.implied=c.id;
   const row=node('label',undefined,'implied-row');
   row.append(checkbox,node('span','Associated method may be implied by the working. Requires written justification.'));
   card.append(row);
   const justification=document.createElement('textarea');
   justification.rows=2;justification.maxLength=500;justification.dataset.impliedReason=c.id;
   justification.placeholder='Describe the exact step demonstrating why method credit is implied.';
   card.append(labelWrap('Implied-method justification (only if needed)',justification));
  }
  if(c.dependsOn.length)card.append(node('p','Dependent on: '+c.dependsOn.join(', '),'dep'));
  list.append(card);
 }
 marking.append(list);
}
function getDecisions(){
 if(current.format==='single_choice'){
  const selected=document.querySelector('input[name="mcq-answer"]:checked');
  if(!selected)throw Error('Select a fictional response option before previewing a one-mark question.');
  return reviewPublicPracticeExample(current,{selectedOption:selected.value});
 }
 const awards=current.criteria.map(c=>{
  const card=document.querySelector('[data-criterion="'+c.id+'"]');
  const selected=card.querySelector('[data-award]').value;
  if(selected==='unknown')throw Error('Complete the '+c.code+' decision for '+c.skill+' before previewing.');
  const observation=card.querySelector('[data-evidence]').value.trim();
  const implied=card.querySelector('[data-implied]');
  const why=card.querySelector('[data-implied-reason]');
  return {
   id:c.id,awarded:selected==='earned',note:observation,
   ...(implied?.checked?{methodImplied:true,impliedReason:why.value.trim()}:{})
  };
 });
 return reviewPublicPracticeExample(current,{awards,completeReview:true});
}
function reportLine(root,title,body){
 const div=node('div',undefined,'report-row');
 div.append(node('strong',title),node('p',body));root.append(div);
}
function renderReport(){
 const root=$('report');root.replaceChildren();
 if(!result){root.append(node('p','Review the question to build a fictional report.','empty'));return;}
 root.append(node('p','Fictional preview · '+(role==='student'?'student view':role==='parent'?'guardian view':'assigned-tutor view'),'eyebrow'));
 const score=node('div',result.earned+' / '+result.possible+' marks','score');root.append(score);
 root.append(node('p','This is one unmoderated example. It is not an official grade, confirmed mastery, or a released learner record.','fine'));
 if(current.format==='single_choice'){
  reportLine(root,'Marking style','TMUA-style multiple-choice: one mark for the selected correct answer, otherwise zero. No method or accuracy partial marks.');
  if(role==='student')reportLine(root,'What to try next','Explain in words why the choice follows, then try a fresh application/reasoning question without a calculator.');
  if(role==='parent')reportLine(root,'How to support','Ask the learner to explain their choice without telling them which option to choose.');
  if(role==='tutor')reportLine(root,'Teaching focus','Inspect the fictional learner’s reasoning. An option choice alone does not identify a misconception.');
 }else{
  const target=buildFictionalRoleReport({...current,status:'public_editorial_example'},result,role);
  if(target.strength)reportLine(root,'Credit shown',target.strength);
  if(target.focus)reportLine(root,'First next focus',target.focus);
  if(target.nextPractice)reportLine(root,'Next independent practice',target.nextPractice);
  if(role==='parent'){
   reportLine(root,'Conversation prompt',target.coachingPrompt);
   reportLine(root,'Evidence boundary','Guardians receive a supportive summary, not examiner-only working notes or private teaching annotations.');
  }else if(role==='student'){
   const sections=node('ul',undefined,'checkpoint-list');
   for(const c of target.checkpoints){
    const li=node('li');li.append(node('strong',c.label+' · '+c.credit+' / '+c.max),node('p',c.note));sections.append(li);
   }
   root.append(sections);
  }else{
   const sections=node('ul',undefined,'checkpoint-list');
   for(const c of target.checkpoints){
    const li=node('li');li.append(node('strong',c.code+' · '+c.label+' · '+c.credit+' / 1'),node('p','Examiner note: '+(c.evidence||'No note recorded')),
     node('p','Teaching response: '+c.nextAction));
    sections.append(li);
   }
   root.append(sections);
   reportLine(root,'Next lesson',target.intervention);
  }
 }
 root.append(node('p','Release disabled. There is no learner record, database write, account login or publishing endpoint.','privacy-note'));
}
async function start(){
 try{
  const paths=['./route-exam-style-examples.json'];
  const response=await Promise.all(paths.map(path=>fetch(path,{cache:'no-store'})));
  if(response.some(x=>!x.ok))throw Error('Local editorial examples could not be loaded. Open this page through a local HTTP server.');
  const payload=await response[0].json();
  examples=payload.items||[];
  for(const example of examples){
   validateExamStyle(example);
   listing.append(new Option(example.route.qualification+' · '+example.route.level+' · '+example.topic,example.id));
  }
  if(!examples.length)throw Error('No public examples available.');
  showQuestion();
 }catch(error){setStatus(error.message||'Unable to initialise examiner lab.',true);preview.disabled=true;}
}
listing.addEventListener('change',showQuestion);
preview.addEventListener('click',()=>{
 try{result=getDecisions();renderReport();setStatus('Fictional report preview updated. No marks were saved or released.');}
 catch(error){result=null;$('report').replaceChildren(node('p','No report generated. Please correct the marking decisions.','empty'));setStatus(error.message||'Cannot generate preview.',true);}
});
$('reset').addEventListener('click',showQuestion);
document.querySelectorAll('[data-role]').forEach(button=>{
 button.addEventListener('click',()=>{role=button.dataset.role;setRoleButtons();renderReport();});
});
start();
