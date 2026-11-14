/* MathsGrove fictional dashboard tour: separate, meaningful learning prompts for
 * student, parent and tutor. Public examples only. No student records or API calls. */
(()=>{
 "use strict";
 const journey=document.getElementById('learning-journey');
 const host=journey?.querySelector('.wrap');
 if(!host||!window.MathsGroveV3)return;
 const node=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=value;return n};
 const root=node('section','mg14-showcase');
 root.id='mg14-showcase';
 root.setAttribute('aria-label','Fictional role-specific questions and decisions');
 const header=node('div','mg14-showcase-heading');
 const headCopy=node('div');
 const kicker=node('span','mg14-kicker','YOUR NEXT INSIGHT / ILLUSTRATIVE');
 const title=node('h3','','The next question matters.');
 const lead=node('p','','Choose a view to explore tailored practical guidance.');
 headCopy.append(kicker,title,lead);
 header.append(headCopy,node('span','mg14-evidence-chip','FICTIONAL DASHBOARD PREVIEW'));
 const insight=node('p','mg14-showcase-focus','');
 const panels=node('div','mg14-showcase-panels');
 const foot=node('p','mg14-caveat','This is a fictional demonstration. Topic samples do not establish mastery, grade predictions or actual learner outcomes.');
 root.append(header,insight,panels,foot);
 host.append(root);
 const choices={
  student:[
   ['YOUR NEXT QUESTION','Explain the first step','What do I know from the question, and why is this step valid?'],
   ['CHECK YOUR ANSWER','Prove it another way','Could substitution, a diagram or an estimate help me check?'],
   ['MAKE IT STICK','Try an unfamiliar variation','Can I use the same method with different numbers and explain why?']
  ],
  parent:[
   ['ASK YOUR CHILD','Start with their thinking','What was a step you understood better this week, even if the answer was not perfect?'],
   ['ASK THEIR TUTOR','Agree one small focus','Which method is worth revisiting, and what practice would be useful at home?'],
   ['NEXT FOLLOW-UP','Check the new attempt','When can we see a different question that checks understanding without hints?']
  ],
  tutor:[
   ['BEFORE THE LESSON','Look behind the mark','Which line of the working shows the precise point where reasoning changes?'],
   ['TEACH THE CONTRAST','Make the choice explicit','Compare two related questions and ask why different methods or checks apply.'],
   ['AFTER THE LESSON','Recheck independently','Use an approved unseen question and record the method, not just the score.']
  ]
 };
 const render=()=>{
  const state=window.MathsGroveV3?.getState?.();
  if(!state)return;
  root.hidden=state.tier!=='exam'&&state.role!=='student';
  if(root.hidden)return;
  const role=['student','parent','tutor'].includes(state.role)?state.role:'student';
  const qualification=window.MathsGroveV3.getExam?.();
  const topics=Array.isArray(qualification?.topics)?qualification.topics:[];
  const scores=Array.isArray(qualification?.scores)?qualification.scores:[];
  let i=0;
  for(let j=1;j<topics.length;j++)if(Number.isFinite(scores[j])&&(!Number.isFinite(scores[i])||scores[j]<scores[i]))i=j;
  const topic=topics[i]||'reasoning';
  const score=Number.isFinite(scores[i])?scores[i]:null;
  const topicNote=score===null?'A fictional topic has been selected for discussion.':
   'Illustrative '+topic+' topic profile: '+score+'% in this example. A short sample is not an assessment of whole-topic mastery.';
  title.textContent=role==='parent'?'Better questions for home and tutor.':role==='tutor'?'An intervention with a clear recheck.':'Make the next question meaningful.';
  lead.textContent=role==='parent'
   ?'Less pressure about marks; more curiosity about methods, corrections and what happens next.'
   :role==='tutor'
   ?'Use question-level reasoning to decide what to teach, then check transfer independently.'
   :'Build a habit of explaining and checking the mathematics, not chasing a streak.';
  kicker.textContent=role==='parent'?'FAMILY SUPPORT / FICTIONAL':role==='tutor'?'TUTOR PLANNING / FICTIONAL':'STUDENT REFLECTION / FICTIONAL';
  insight.textContent=topicNote;
  panels.replaceChildren();
  const cards=choices[role];
  for(let j=0;j<cards.length;j++){
   const [tag,heading,body]=cards[j];
   const card=node('article','mg14-showcase-card');
   card.append(node('small','',tag),node('h4','',heading),node('p','',body));
   if(j===0&&role!=='student'){
    card.append(node('p','mg14-showcase-topic',role==='parent'?
     'Useful opener: What did you find difficult about '+topic+' and what did you try first?':
     'Focus on '+topic+' only after checking the fictional marked method; a percentage alone does not establish a misconception.'));
   }
   panels.append(card);
  }
 };
 render();
 document.addEventListener('click',event=>{
  if(event.target.closest?.('[data-tier],[data-role]'))render();
 });
 document.getElementById('mg3-exam-select')?.addEventListener('change',render);
})();
