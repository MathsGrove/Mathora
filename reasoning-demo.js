import {assessDemoReasoning,evidenceSummary} from './reasoning-model.mjs';

// All interaction stays in this tab's memory. No Supabase, storage, cookies,
// analytics, network POSTs, or transcript capture are used by this module.
const $=id=>document.getElementById(id);
let first=null,recheck=null,role='student';
const scroll=node=>node?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
const safeText=(id,value)=>{$(id).textContent=String(value)};
const noteFor=result=>{
 if(result.numberCorrect&&result.methodCorrect)return 'The numerical answer and selected method agree. A later, independent check would still be needed to assess retention.';
 if(result.numberCorrect)return 'The number is correct, but the chosen explanation is not. A correct result alone does not demonstrate a secure method.';
 if(result.methodCorrect)return 'The chosen method is useful. Check the arithmetic and substitute your answer back into the original equation.';
 return 'The answer and selected explanation need another look. Work backwards through the outside operation first.';
};
function showFeedback(index,result){
 const suffix=index===0?'first':'second';
 const root=$('rg-feedback-'+suffix),error=$('rg-error-'+suffix);
 error.hidden=true;error.textContent='';
 safeText('rg-result-'+suffix,result.label);
 safeText('rg-explanation-'+suffix,result.feedback);
 safeText('rg-observation-'+suffix,noteFor(result));
 root.hidden=false;
 scroll(root);
}
function submit(index,event){
 event.preventDefault();
 const suffix=index===0?'first':'second',form=$('rg-form-'+suffix);
 const selected=form.querySelector('input[name=method]:checked');
 const result=assessDemoReasoning(index,$('rg-answer-'+suffix).value,selected?.value);
 if(!result.valid){
  $('rg-error-'+suffix).hidden=false;safeText('rg-error-'+suffix,result.message);
  if(!selected&&result.message.includes('reasoning'))form.querySelector('input[name=method]')?.focus();
  else $('rg-answer-'+suffix).focus();
  return;
 }
 if(index===0){first=result;recheck=null;$('rg-second').hidden=true;$('rg-feedback-second').hidden=true;$('rg-summary').hidden=true;}
 else recheck=result;
 showFeedback(index,result);
}
$('rg-form-first').addEventListener('submit',event=>submit(0,event));
$('rg-form-second').addEventListener('submit',event=>submit(1,event));
$('rg-go-second').addEventListener('click',()=>{
 $('rg-second').hidden=false;scroll($('rg-second'));$('rg-answer-second').focus({preventScroll:true});
});
function renderPerspective(){
 const overview=evidenceSummary(first,recheck),complete=first?.valid&&recheck?.valid;
 const positive=complete&&first.numberCorrect&&first.methodCorrect&&recheck.numberCorrect&&recheck.methodCorrect;
 const names={student:['STUDENT VIEW','Your next mathematical step'],
 examiner:['EXAMINER VIEW','The evidence still needs interpretation'],
 parent:['PARENT VIEW','One supportive question at home']};
 const [heading,title]=names[role];
 const texts={
  student:positive
   ?'Your answers and selected explanations worked in both examples. Try another independently checked equation on a different day and explain each inverse operation in your own words.'
   :'Revisit the worked explanation and ask which operation applies to the whole expression. Try a new example without looking at this page, then check by substitution.',
  examiner:'This prepared demonstration checks two numerical results and two selected methods. '+overview.correctSignals+
   ' of '+overview.possibleSignals+' signals matched the model. A real examiner would inspect the original handwritten or typed mathematical steps, identify the actual misconception and set a later independent recheck. Do not infer grade or mastery here.',
  parent:'Ask: “Why do you divide by the number outside the brackets before adjusting the terms inside?” Invite the learner to explain a check using their own example. Encourage the reasoning, not just a correct number.'
 };
 document.querySelectorAll('.rg-perspectives [data-role]').forEach(button=>
  button.setAttribute('aria-pressed',String(button.dataset.role===role)));
 safeText('rg-role-heading',heading);safeText('rg-role-title',title);safeText('rg-role-desc',texts[role]);
}
$('rg-go-summary').addEventListener('click',()=>{
 if(!first?.valid||!recheck?.valid)return;
 const result=evidenceSummary(first,recheck);
 safeText('rg-count',result.submitted+' / 2');
 safeText('rg-signals',result.correctSignals+' / '+result.possibleSignals);
 safeText('rg-summary-desc',result.description);
 $('rg-summary').hidden=false;
 role='student';renderPerspective();scroll($('rg-summary'));
});
document.querySelectorAll('.rg-perspectives [data-role]').forEach(button=>
 button.addEventListener('click',()=>{role=button.dataset.role;renderPerspective()}));
$('rg-restart').addEventListener('click',()=>{
 first=null;recheck=null;role='student';
 $('rg-form-first').reset();$('rg-form-second').reset();
 for(const id of ['rg-feedback-first','rg-feedback-second','rg-second','rg-summary','rg-error-first','rg-error-second'])$(id).hidden=true;
 scroll($('rg-first'));$('rg-answer-first').focus({preventScroll:true});
});
