/* MathsGrove Proof of Progress — conservative, released-evidence summaries.
 * Frontend-only. No independent data requests, no inferred mastery and no
 * cross-student storage. Parent data comes only from get_my_learner_views().
 */
const num=value=>Number.isFinite(Number(value))?Math.max(0,Number(value)):0;
const finiteRatio=(a,b)=>num(b)>0?Math.round(100*num(a)/num(b)):null;
const date=value=>{
 if(!value)return'';
 const d=new Date(value);
 return Number.isFinite(d.getTime())?
  d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'';
};
const promptFor=topic=>{
 const t=String(topic||'').toLowerCase();
 if(/algebra|equation|factor|expression/.test(t))
  return 'Can you explain why each algebraic step keeps the equation balanced, then check the answer?';
 if(/geometry|angle|shape|circle|trigonometry/.test(t))
  return 'Which property or theorem justifies your first step, before you calculate?';
 if(/probability|statistics|data|sample/.test(t))
  return 'What are all the possible outcomes, and how can you tell you counted each one correctly?';
 if(/number|fraction|ratio|percent/.test(t))
  return 'How did you choose your calculation, and what is a second way to check it?';
 return 'Why did you choose that method, and how would you check it on a different question?';
};
export function studentProgressEvidence(insights={}){
 const reviewed=num(insights.reviewed);
 const baseline=insights.baseline||null;
 const baselineReady=Boolean(baseline&&['submitted','expired','completed'].includes(baseline.status));
 const topics=(Array.isArray(insights.topics)?insights.topics:[])
  .filter(x=>num(x.total)>0).map(x=>({
   topic:String(x.topic||'Mathematics'),earned:num(x.correct),possible:num(x.total),
   percent:finiteRatio(x.correct,x.total)
  })).sort((a,b)=>a.percent-b.percent||b.possible-a.possible);
 const focus=topics[0]||null;
 const last=(Array.isArray(insights.history)?insights.history:[])
  .filter(h=>h&&h.task_id&&h.score!==null&&h.score!==undefined)
  .sort((a,b)=>Date.parse(b.feedback_updated_at||b.submitted_at||b.date||0)-
                    Date.parse(a.feedback_updated_at||a.submitted_at||a.date||0))[0]||null;
 return {
  baselineReady,reviewed,last: last?{
   score:num(last.score),max:num(last.total),date:last.feedback_updated_at||last.submitted_at||last.date,
   kind:last.mode||'practice',feedback:typeof last.feedback==='string'?last.feedback:''
  }:null,
  focus,
  task:focus?'Try an unseen '+focus.topic+' question and explain the method before calculating.':
   'Complete your mathematics baseline or wait for released examiner guidance before claiming a specific focus.',
  nextCheck:'Independent later recheck not yet linked to this record',
  evidenceDisclaimer:reviewed
   ?'These observations describe released questions, not whole-syllabus mastery or an examination prediction.'
   :'No released examiner practice yet. A starting-point assessment alone cannot establish improvement.'
 };
}
export function familyProgressEvidence(learner={}){
 const results=(Array.isArray(learner.recent_results)?learner.recent_results:[])
  .filter(x=>x&&num(x.maximum)>0);
 const topics=(Array.isArray(learner.topics)?learner.topics:[])
  .filter(x=>x&&num(x.available)>0)
  .map(x=>({topic:String(x.topic||'Mathematics'),earned:num(x.earned),
   possible:num(x.available),questions:num(x.questions),percent:finiteRatio(x.earned,x.available)}))
  .sort((a,b)=>a.percent-b.percent||b.questions-a.questions);
 const focus=topics[0]||null;
 const positive=topics.slice().sort((a,b)=>b.percent-a.percent||b.questions-a.questions)[0]||null;
 const latest=results.slice().sort((a,b)=>Date.parse(b.date||0)-Date.parse(a.date||0))[0]||null;
 const completed=num(learner.papers_reviewed);
 const role=learner.view_role==='tutor'?'tutor':'parent';
 return {
  role,completed,focus,positive,
  latest:latest?{topic:latest.topic||latest.paper_mode||'Mathematics',earned:num(latest.score),
   possible:num(latest.maximum),date:latest.date}:null,
  headline:completed?
   completed+' released paper'+(completed===1?'':'s')+' in this permitted academic view':
   'Waiting for the first examiner-released paper',
  prompt:focus?promptFor(focus.topic):
    'Can you explain one mathematical idea you feel more confident about this week?',
  focusText:focus?
   focus.topic+': '+focus.earned+' / '+focus.possible+' marks across '+
   focus.questions+' reviewed question'+(focus.questions===1?'':'s')+'; this is a sample, not a mastery judgement.':
   'A topic-level coaching priority will appear after reviewed work is released.',
  positiveText:positive?
   positive.topic+': '+positive.earned+' / '+positive.possible+' marks across '+
   positive.questions+' reviewed question'+(positive.questions===1?'':'s')+'.':
   'Celebrate a clear explanation or carefully checked method, not only a headline score.',
  recheck:'A later independent check must be recorded before an improvement claim is confirmed.'
 };
}
const el=(tag,cls,content)=>{
 const n=document.createElement(tag);
 if(cls)n.className=cls;
 if(content!==undefined)n.textContent=String(content);
 return n;
};
function renderList(root,steps){
 root.replaceChildren();
 for(const step of steps){
  const item=el('article','mgpe-step');
  item.append(el('span','mgpe-step-state '+(step.done?'mgpe-done':'mgpe-pending'),
   step.done?'RECORDED':'NEXT CHECK'),
   el('strong','',step.title),el('p','',step.description));
  root.append(item);
 }
}
export function renderStudentProof(insights){
 const root=document.getElementById('mg-student-proof');if(!root)return;
 const value=studentProgressEvidence(insights||{});
 document.getElementById('mgpe-student-status').textContent=value.evidenceDisclaimer;
 const list=document.getElementById('mgpe-student-steps');
 renderList(list,[
  {done:value.baselineReady,title:'Starting-point diagnostic',
   description:value.baselineReady?
    'Your first mathematics baseline has been recorded. It is a starting point—not a predicted grade.':
    'Awaiting your first completed diagnostic.'},
  {done:value.reviewed>0,title:'Examiner-released learning evidence',
   description:value.reviewed?
    value.reviewed+' reviewed practice session'+(value.reviewed===1?'':'s')+
      ' released. '+(value.last&&value.last.max?
      'Latest released practice: '+value.last.score+' / '+value.last.max+' marks.':''):
    'No examiner-awarded practice marks have been released yet.'},
  {done:false,title:'Targeted method repair',
   description:value.task},
  {done:false,title:'Later independent recheck',
   description:'Not yet verified. This view cannot claim that a misconception was permanently corrected.'}
 ]);
 const focus=document.getElementById('mgpe-student-focus');
 focus.textContent=value.focus?
  'Evidence to revisit: '+value.focus.topic+' · '+value.focus.earned+' of '+
  value.focus.possible+' marked questions answered correctly ('+value.focus.percent+
  '% in this reviewed sample).':
  'Specific topic evidence will appear as examiner-marked practice is released.';
}
export function renderFamilyProof(learner){
 const root=document.getElementById('fa-proof');if(!root)return;
 const evidence=familyProgressEvidence(learner||{});
 document.getElementById('mgpe-family-kicker').textContent=evidence.role==='tutor'?
  'ASSIGNED TUTOR · RELEASED EVIDENCE':'AUTHORISED FAMILY · RELEASED EVIDENCE';
 document.getElementById('mgpe-family-headline').textContent=evidence.headline;
 document.getElementById('mgpe-family-positive').textContent=evidence.positiveText;
 document.getElementById('mgpe-family-focus').textContent=evidence.focusText;
 document.getElementById('mgpe-family-question').textContent=evidence.prompt;
 document.getElementById('mgpe-family-recheck').textContent=evidence.recheck;
}
export function clearProgressEvidence(type){
 const ids=type==='family'?['mgpe-family-headline','mgpe-family-positive','mgpe-family-focus',
  'mgpe-family-question','mgpe-family-recheck']:
  ['mgpe-student-status','mgpe-student-focus'];
 for(const id of ids){const e=document.getElementById(id);if(e)e.textContent=''}
 if(type!=='family')document.getElementById('mgpe-student-steps')?.replaceChildren();
}
