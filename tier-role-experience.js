/* MathsGrove programme and role interpretation.
 * Presentation only: student data is supplied by learner-scoped
 * grove_student_insights(); family data exclusively by permission-checked
 * get_my_learner_views(). No new RPC, network, storage, or write permissions.
 */
const finite=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value));
const count=value=>finite(value)?Math.max(0,Math.floor(Number(value))):0;
const fmt=value=>finite(value)?new Intl.NumberFormat('en-GB').format(count(value)):'—';
const percent=(earned,possible)=>finite(earned)&&finite(possible)&&Number(possible)>0
 ?Math.max(0,Math.min(100,Math.round(100*Number(earned)/Number(possible)))):null;
const wording={
 weekly:{
  tag:'GROVE WEEKLY · METHOD & REFLECTION',
  title:'A stronger method, one set at a time.',
  lead:'Your weekly questions are a chance to slow down, show the mathematics and use examiner feedback before the next set.',
  rhythm:'Four weekly sets across a four-week cycle, subject to approved original question availability.',
  watch:'Which step in a worked solution needed another explanation?',
  action:'Open an assigned weekly set, show each reasoning step, then check the released examiner guidance.',
  label:'WEEKLY SETS',
  next:'Review your most recent released correction before attempting an unfamiliar variation.'
 },
 daily:{
  tag:'GROVE DAILY · FOCUS & CONSISTENCY',
  title:'Small practice, clearer understanding.',
  lead:'Use your available daily focus work to build a useful routine, and bring the weekly set together with what you have learned.',
  rhythm:'Daily Focus opportunities and a weekly set when your authorised assignment calendar and question bank are ready.',
  watch:'Is the same type of mistake appearing in different questions?',
  action:'Open your next available Daily Focus, record your method and revisit the feedback rather than chasing a streak.',
  label:'DAILY FOCUS',
  next:'Try an unseen example of the topic that proved difficult on your starting-point diagnostic.'
 },
 exam:{
  tag:'GROVE EXAM · REASONING & READINESS',
  title:'Know the method. Prepare for the pressure.',
  lead:'Build understanding through daily reasoning and weekly work; use separately moderated timed mocks when a paper has actually been released.',
  rhythm:'Exam Daily and Weekly practice, plus an administrator-published timed mock only after moderation and assignment.',
  watch:'What changed when the question was unfamiliar or time-limited?',
  action:'Complete an assigned practice session, review released examiner guidance and check the mock area for an available moderated paper.',
  label:'EXAM PRACTICE',
  next:'Recheck a previously difficult method on a fresh question; a single correct response does not prove exam readiness.'
 }
};
const topicLabel=x=>String(x?.topic||'Mathematics');
export function summariseStudentTier(tier,insights=null){
 const plan=wording[tier];
 if(!plan)return {
  enabled:false,tier:'pending',tag:'YOUR ACADEMIC ROUTE · AWAITING ACTIVATION',
  title:'Your programme begins with a clear starting point.',
  lead:'Your administrator will confirm the qualification, programme and release of suitable original questions. Complete an available baseline first.',
  rhythm:'Awaiting an authorised Weekly, Daily or Exam programme.',
  watch:'Your first diagnostic will help identify initial topics to revisit.',
  action:'Check your baseline and speak to the administrator about programme activation.',
  next:'No programme-specific completion statistics are available yet.',
  label:'AWAITING PLAN',stats:[],focus:null,roleAccess:'Separate family and tutor accounts are available with Grove Exam only.'
 };
 const baseline=Array.isArray(insights?.baseline_topics)?insights.baseline_topics:[];
 const gaps=baseline.filter(x=>finite(x.correct)&&finite(x.total)&&Number(x.total)>0&&Number(x.correct)<Number(x.total))
  .sort((a,b)=>Number(a.correct)/Number(a.total)-Number(b.correct)/Number(b.total));
 const focus=gaps[0]||null;
 const reviewed=insights&&finite(insights.reviewed)?count(insights.reviewed):null;
 const submitted=insights&&finite(insights.submitted)?count(insights.submitted):null;
 const minutes=insights&&finite(insights.visible_minutes)?count(insights.visible_minutes):null;
 const accuracy=insights&&finite(insights.reviewed_accuracy)?Math.max(0,Math.min(100,Number(insights.reviewed_accuracy))):null;
 const baseDone=['submitted','expired','completed'].includes(insights?.baseline?.status);
 const activityLabel=tier==='weekly'?'Reviewed sets':tier==='daily'?'Reviewed practice':'Exam practice reviewed';
 const stats=[
  {label:activityLabel,value:reviewed===null?'—':fmt(reviewed),note:'Examiner-released practice only'},
  {label:'Awaiting review',value:submitted===null||reviewed===null?'—':fmt(Math.max(0,submitted-reviewed)),note:'Submitted practice awaiting examiner release'},
  {label:'Reviewed accuracy',value:accuracy===null?'—':Math.round(accuracy)+'%',note:'From released marks; not a grade'},
  {label:'Question-screen time',value:minutes===null?'—':fmt(minutes)+' min',note:'Recorded visibility, not total study'}
 ];
 return {
  enabled:true,tier,tag:plan.tag,title:plan.title,lead:plan.lead,rhythm:plan.rhythm,
  watch:plan.watch,action:plan.action,label:plan.label,stats,
  focus:focus?{topic:topicLabel(focus),correct:count(focus.correct),total:count(focus.total)}:null,
  next:focus?
    'Your baseline sampled '+topicLabel(focus)+' at '+count(focus.correct)+' / '+count(focus.total)+
    ' correct. Revisit it with new working; a small diagnostic sample is not a mastery judgement.':
    baseDone?'Your baseline has no specific gap in the sampled topics. Try a fresh explanation-based problem.':
    'Complete the starting-point baseline to unlock an evidence-based topic to revisit.',
  roleAccess:tier==='exam'
   ?'A parent or assigned tutor may receive a separate permission-controlled Grove Exam view when individually nominated.'
   :'This is a student-facing programme. Separate parent and tutor dashboards are not included in this tier.'
 };
}
function sortedTopics(topics){
 return (Array.isArray(topics)?topics:[])
  .filter(t=>t&&finite(t.earned)&&finite(t.available)&&Number(t.available)>0)
  .map(t=>({topic:topicLabel(t),earned:count(t.earned),available:count(t.available),
    questions:count(t.questions),percent:percent(t.earned,t.available)}))
  .sort((a,b)=>a.percent-b.percent||b.available-a.available||a.topic.localeCompare(b.topic));
}
const coachingQuestion=topic=>{
 const t=String(topic||'').toLowerCase();
 if(/algebra|equation|expression/.test(t))return 'Can you show how each step keeps the equation balanced and check the answer?';
 if(/fraction|ratio|percent|number/.test(t))return 'How could you estimate the answer first, then check the calculation another way?';
 if(/geometry|shape|angle|triangle|trigonometry/.test(t))return 'Which rule or theorem explains that step, and why does it apply here?';
 if(/probability|statistics|data/.test(t))return 'What outcomes or data have you counted, and how can you tell nothing was missed?';
 return 'Could you explain the first step in your own words and check it with a fresh example?';
};
export function summariseFamilyRole(learner={}){
 const role=learner?.view_role==='tutor'?'tutor':'parent';
 const topics=sortedTopics(learner.topics);
 const focus=topics[0]||null;
 const strongest=topics.slice().sort((a,b)=>b.percent-a.percent||b.available-a.available)[0]||null;
 const timing=learner?.practice_timing||{};
 const papers=count(learner.papers_reviewed);
 const submitted=count(timing.submitted_sessions);
 const visibility=finite(timing.recorded_visible_minutes)?count(Math.round(Number(timing.recorded_visible_minutes))):null;
 const feedback=role==='tutor'&&Array.isArray(learner.teaching_feedback)?learner.teaching_feedback:[];
 const results=(Array.isArray(learner.recent_results)?learner.recent_results:[])
  .filter(x=>x&&finite(x.maximum)&&Number(x.maximum)>0&&finite(x.score));
 const totalEarned=results.reduce((sum,r)=>sum+count(r.score),0);
 const totalPossible=results.reduce((sum,r)=>sum+count(r.maximum),0);
 if(role==='parent')return {
  role,tag:'GROVE EXAM · AUTHORISED PARENT',
  title:'Understand the learning. Support the learner.',
  lead:'A calm, read-only picture of released work and recorded practice. Useful conversations matter more than comparing scores.',
  stats:[
   {label:'Released papers',value:fmt(papers),note:'Reviewed and released assessments'},
   {label:'Sessions submitted',value:finite(timing.submitted_sessions)?fmt(submitted):'—',note:'Recorded over the recent 28 days'},
   {label:'Question-screen time',value:visibility===null?'—':fmt(visibility)+' min',note:'Visibility, not total independent study'}
  ],
  cards:[
   {tag:'A STRENGTH TO NOTICE',title:strongest?'Evidence from '+strongest.topic:'Celebrate the method',
    text:strongest?strongest.earned+' / '+strongest.available+' marks in '+strongest.topic+
     ' across '+strongest.questions+' reviewed question'+(strongest.questions===1?'':'s')+'. These are sampled results, not a whole-topic verdict.':
     'Ask which question your learner felt proud of explaining, even if they needed help at first.'},
   {tag:'A GENTLE FOCUS',title:focus?'Revisit '+focus.topic:'Wait for released topic evidence',
    text:focus?focus.earned+' / '+focus.available+' marks in the available '+focus.topic+
     ' questions. Ask about the method before the final answer.':
     'The next released review will help identify a specific topic to discuss.'},
   {tag:'ONE QUESTION FOR HOME',title:'Start a useful conversation',
    text:coachingQuestion(focus?.topic)}
  ],
  bottom:'Parent access is read-only. Private examiner notes, unfinished work and unreleased marks are not displayed. A later independent check is needed before claiming lasting improvement.'
 };
 const ratio=totalPossible>0?percent(totalEarned,totalPossible):null;
 return {
  role,tag:'GROVE EXAM · ASSIGNED TUTOR',
  title:'Diagnose the method. Plan the intervention.',
  lead:'A private teaching desk built around released question evidence and the next lesson—not another family scorecard.',
  stats:[
   {label:'Released assessments',value:fmt(papers),note:'Available in this assigned view'},
   {label:'Recent weighted marks',value:ratio===null?'—':ratio+'%',note:totalPossible?'Across '+results.length+' available releases ('+totalEarned+' / '+totalPossible+' marks)':'No released scores yet'},
   {label:'Examiner comment items',value:fmt(feedback.length),note:'Tutor-authorised, released feedback only'}
  ],
  cards:[
   {tag:'DIAGNOSTIC PRIORITY',title:focus?'Investigate '+focus.topic:'Establish a diagnostic baseline',
    text:focus?focus.earned+' / '+focus.available+' marks across '+focus.questions+
     ' reviewed question'+(focus.questions===1?'':'s')+'. Check the actual released method feedback; this sample alone cannot identify a misconception.':
     'No released topic result currently supports a specific remediation claim.'},
   {tag:'NEXT TEACHING MOVE',title:'Contrast and explain',
    text:focus?'Use two different '+focus.topic+' questions. Ask the student to justify each step before independent practice.':
     'Start with one worked example, then ask the student to explain a contrasting example.'},
   {tag:'INDEPENDENT RECHECK',title:'Make the improvement observable',
    text:'After feedback, assign a separately approved unseen question. Record whether the method transfers; a single correct attempt is not secure mastery.'}
  ],
  bottom:'This is an assigned, permission-controlled Grove Exam tutor view. Examiner comments are visible only where released to the tutor; unmarked scripts and private student work remain restricted.'
 };
}

/* Decision support uses only permission-filtered, released evidence already
 * delivered by the existing family RPC or student baseline. No score
 * forecast, trend inference or private tutor notes are exposed to parents. */
const topicConversation=topic=>{
 const t=String(topic||'').toLowerCase();
 if(/algebra|equation|expression|quadratic/.test(t))return{
  home:'Which operation would you undo first, and how could you check by substituting your answer?',
  lesson:'Give one worked and one contrasting equation; observe whether the learner preserves equal operations and checks the final result.'
 };
 if(/fraction|ratio|percent|number/.test(t))return{
  home:'Could you estimate what a sensible answer looks like before calculating?',
  lesson:'Contrast two fraction or ratio tasks with different wholes, then ask the learner to justify the quantity each part represents.'
 };
 if(/geometry|angle|triangle|trigonometry/.test(t))return{
  home:'What do you know from the diagram, and which rule connects those facts?',
  lesson:'Ask the learner to name the theorem and explain why its conditions apply before calculating a result.'
 };
 if(/probability|statistics|data/.test(t))return{
  home:'How can you be sure every possible outcome or piece of data has been counted?',
  lesson:'Compare a simple and a less familiar sample-space problem; require a complete argument before using a formula.'
 };
 return{
  home:'What did you notice first, and how would you test whether your method works on a new example?',
  lesson:'Use two related but unfamiliar problems; ask for an explanation of the first step and compare the methods.'
 };
};
export function planFamilyNextSteps(learner={}){
 const role=learner.view_role==='tutor'?'tutor':'parent';
 const topics=sortedTopics(learner.topics);
 const focus=topics[0]||null;
 const coach=topicConversation(focus?.topic);
 const sampled=focus&&focus.questions>0;
 const evidence=topics.slice(0,5).map(t=>({
  topic:t.topic,earned:t.earned,available:t.available,questions:t.questions,
  percent:t.percent,quality:t.questions>=4?'Several reviewed questions':t.questions>0?'Small question sample':'Question count not supplied'
 }));
 const status=focus
  ?focus.topic+' has '+focus.earned+' / '+focus.available+' released marks over '+
    (sampled?focus.questions+' reviewed question'+(focus.questions===1?'':'s'):'an unspecified number of reviewed questions')+
    '. This is a priority for conversation, not a mastery claim.'
  :'There is no released topic breakdown yet. Choose one recently attempted method and focus on explaining it.';
 const activity=learner.practice_timing||{};
 const submitted=finite(activity.submitted_sessions)?count(activity.submitted_sessions):null;
 const scheduled=finite(activity.scheduled_sessions)?count(activity.scheduled_sessions):null;
 const visibility=finite(activity.recorded_visible_minutes)?Math.max(0,Math.round(Number(activity.recorded_visible_minutes))):null;
 const activityNote=submitted===null
  ?'No 28-day submission count has been released yet.'
  :submitted+' recorded submitted session'+(submitted===1?'':'s')+' in the supplied 28-day window'+
   (scheduled!==null?' out of '+scheduled+' scheduled opportunities':'')+
   (visibility!==null?'; '+visibility+' min of recorded question-screen visibility':'')+
   '. Visibility is not verified study time.';
 if(role==='parent'){
  return{
   role,evidence,status,activityNote,
   sections:[
    {label:'ASK YOUR CHILD',heading:'A conversation that starts with thinking',
     items:[
      {title:'Start gently',body:focus?'What felt interesting or tricky about '+focus.topic+' this week?':'Which question made you think hardest this week?'},
      {title:'Ask for the method',body:coach.home},
      {title:'Notice a small win',body:'What did you check or correct that you could not explain before?'}
     ]},
    {label:'ASK THEIR TUTOR',heading:'Useful questions for the next check-in',
     items:[
      {title:'Evidence',body:focus?'The released sample in '+focus.topic+' is limited. Which step in their working should we discuss?':'Is there enough reviewed work to suggest one useful focus yet?'},
      {title:'Support at home',body:'What one short, low-pressure practice activity would help without teaching a conflicting method?'},
      {title:'Check understanding',body:'When will you recheck this idea using a different question, and what should we look for?'}
     ]},
    {label:'THIS WEEK AT HOME',heading:'Support without pressure',
     items:[
      {title:'One short explanation',body:'Invite your child to show one question they chose, talk through the reasoning and take a break.'},
      {title:'Keep it manageable',body:'Ask if they want help choosing a calm time to practise. A longer session is not automatically better.'}
     ]}
   ],
   caveat:'Parent prompts use released topic summaries and general pedagogy only. They never reveal tutor-only remarks, unpublished feedback or individual student working.'
  };
 }
 const authorised=Array.isArray(learner.teaching_feedback)?learner.teaching_feedback:[];
 return{
  role,evidence,status,activityNote,
  sections:[
   {label:'BEFORE THE NEXT LESSON',heading:'Turn marks into a diagnosis',
    items:[
     {title:'Inspect released evidence',body:focus?focus.questions>0?'Review the '+focus.questions+' released '+focus.topic+' question'+(focus.questions===1?'':'s')+' and identify which reasoning step needs explanation.':'Review the released '+focus.topic+' marks; check the actual methods once question-level evidence is available.':'Use an approved starting-point example; wait for released work before selecting a narrow misconception.'},
     {title:'Interpret with caution',body:'A lower topic percentage might reflect question difficulty or a small sample. Compare the actual reasoning, not just the bar height.'},
     {title:'Read permitted comments',body:authorised.length?authorised.length+' examiner comment item'+(authorised.length===1?' is':'s are')+' available in your assigned teaching view. Compare them with the marked steps.':'No released tutor-only examiner comments are available yet.'}
    ]},
   {label:'TEACH AND CONTRAST',heading:'A focused lesson sequence',
    items:[
     {title:'Check the first move',body:coach.home},
     {title:'Model a contrast',body:coach.lesson},
     {title:'Hand back the reasoning',body:'Ask the learner to explain the decision before independently completing an approved fresh question.'}
    ]},
   {label:'FOLLOW UP WITH EVIDENCE',heading:'What to record after the next check',
    items:[
     {title:'Independent transfer',body:'Use a new, separately approved problem after feedback. Record the method and whether the earlier error recurs.'},
     {title:'Family-friendly update',body:'Share one concrete strength, one next practice step and a date for the recheck—without disclosing restricted examiner notes.'},
     {title:'Do not overclaim',body:'If there is only a single corrected response, describe it as an encouraging attempt, not secure mastery or a grade forecast.'}
    ]}
  ],
  caveat:'Assigned tutor guidance only: use released, learner-scoped evidence and tutor-authorised feedback. Never infer unseen mistakes or expose draft scripts.'
 };
}
export function planStudentNextSteps(tier,insights={}){
 const model=summariseStudentTier(tier,insights);
 if(!model.enabled)return{
  title:'Begin with a clear starting point',
  intro:'Until your programme is activated, focus on a diagnostic and asking useful questions.',
  prompts:['What do I already understand?','Which question would I like to explain?','What should I ask my teacher next?']
 };
 const topic=model.focus?.topic;
 return{
  title:topic?'Build confidence in '+topic:'Make the method your focus',
  intro:topic?'Your starting-point sample identifies a topic worth revisiting, not a judgement about what you can do.':'Use your next approved question to explain a clear method.',
  prompts:[
   topic?'Choose one new '+topic+' question and write or say why the first step works.':'Choose one available question and describe the first step.',
   'Check your result using a different approach or by substituting it.',
   'After feedback, try a different question without hints and notice whether the method still works.'
  ]
 };
}
function renderDecisionSupport(root,model){
 if(!root)return;
 root.replaceChildren();
 const header=node('div','mg14-inquiry-header');
 const left=node('div');
 left.append(node('span','mg14-kicker',model.role==='parent'?'FOR FAMILIES / NEXT CONVERSATION':'FOR TUTORS / NEXT TEACHING DECISION'),
  node('h3','',model.role==='parent'?'A better conversation at home.':'A lesson plan grounded in evidence.'),
  node('p','',model.status));
 header.append(left,node('span','mg14-evidence-chip','RELEASED EVIDENCE ONLY'));
 root.append(header);
 const grid=node('div','mg14-coverage');
 const chart=node('section','mg14-evidence-panel');
 chart.append(node('h4','','What the topic samples show'),
  node('p','mg14-subtle',model.evidence.length?'Sorted by available mark percentage. Different topics may have different question counts and difficulty.':'Topic evidence will appear after reviewed marks are released.'));
 if(model.evidence.length){
  const list=node('div','mg14-bars');
  for(const item of model.evidence){
   const row=node('div','mg14-evidence-row');
   const heading=node('div','mg14-bar-head');
   heading.append(node('strong','',item.topic),node('span','',item.earned+' / '+item.available+' marks'));
   const track=node('div','mg14-bar-track');
   track.setAttribute('role','img');
   track.setAttribute('aria-label',item.topic+': '+item.earned+' of '+item.available+' reviewed marks');
   const fill=node('span','mg14-bar-fill');
   fill.style.width=item.percent+'%';
   track.append(fill);
   row.append(heading,track,node('small','',item.questions?item.questions+' reviewed question'+(item.questions===1?'':'s')+' · '+item.quality:item.quality));
   list.append(row);
  }
  chart.append(list);
 }else chart.append(node('p','mg14-empty','No released topic results available yet.'));
 const activity=node('section','mg14-activity-panel');
 activity.append(node('h4','','Practice context'),node('p','',model.activityNote),
  node('p','mg14-subtle',model.role==='parent'?'Ask about the learning routine rather than treating screen minutes as effort.':'Use timing information for context, not as evidence of attention or retention.'));
 grid.append(chart,activity);root.append(grid);
 const sections=node('div','mg14-guides');
 for(const section of model.sections){
  const panel=node('article','mg14-guide');
  panel.append(node('span','mg14-kicker',section.label),node('h4','',section.heading));
  const list=node('ol');
  for(const item of section.items){
   const entry=node('li');
   entry.append(node('strong','',item.title),node('p','',item.body));list.append(entry);
  }
  panel.append(list);sections.append(panel);
 }
 root.append(sections,node('p','mg14-caveat',model.caveat));
}
function renderStudentNext(root,model){
 if(!root)return;
 root.replaceChildren();
 root.append(node('span','mg14-kicker','YOUR NEXT THREE MATHEMATICS MOVES'),node('h3','',model.title),node('p','',model.intro));
 const list=node('ol','mg14-student-steps');
 for(const item of model.prompts)list.append(node('li','',item));
 root.append(list);
}

const node=(tag,klass,text)=>{
 const n=document.createElement(tag);if(klass)n.className=klass;
 if(text!==undefined)n.textContent=String(text);return n;
};
function renderCards(container,cards){
 container.replaceChildren();
 for(const card of cards){
  const article=node('article','mgtr-card');
  article.append(node('span','mgtr-card-label',card.tag),node('h3','',card.title),node('p','',card.text));
  container.append(article);
 }
}
function renderStats(container,stats){
 container.replaceChildren();
 for(const item of stats){
  const card=node('article','mgtr-stat');
  card.append(node('span','',item.label),node('strong','',item.value),node('small','',item.note));
  container.append(card);
 }
}
export function renderStudentTier(tier,insights){
 const root=document.getElementById('mg-student-tier-experience');if(!root)return;
 const model=summariseStudentTier(tier,insights);
 root.dataset.tier=model.tier;
 const set=(id,value)=>{const e=document.getElementById(id);if(e)e.textContent=value};
 set('mgtr-student-tag',model.tag);
 set('mgtr-student-title',model.title);
 set('mgtr-student-lead',model.lead);
 set('mgtr-student-rhythm',model.rhythm);
 set('mgtr-student-watch',model.watch);
 set('mgtr-student-action',model.action);
 set('mgtr-student-focus',model.next);
 set('mgtr-student-role-access',model.roleAccess);
 set('mgtr-student-badge',model.label);
 renderStats(document.getElementById('mgtr-student-stats'),model.stats);
 renderStudentNext(document.getElementById('mgtr-student-inquiry'),planStudentNextSteps(tier,insights));
}
export function renderFamilyRole(learner){
 const root=document.getElementById('mg-family-role-experience');if(!root)return;
 const model=summariseFamilyRole(learner);
 root.dataset.role=model.role;
 const set=(id,value)=>{const e=document.getElementById(id);if(e)e.textContent=value};
 set('mgtr-family-tag',model.tag);
 set('mgtr-family-title',model.title);
 set('mgtr-family-lead',model.lead);
 set('mgtr-family-bottom',model.bottom);
 renderStats(document.getElementById('mgtr-family-stats'),model.stats);
 renderCards(document.getElementById('mgtr-family-cards'),model.cards);
 renderDecisionSupport(document.getElementById('mgtr-family-inquiry'),planFamilyNextSteps(learner));
}
export function clearTierRoleExperience(which){
 const root=document.getElementById(which==='student'?'mg-student-tier-experience':'mg-family-role-experience');
 if(!root)return;
 root.querySelectorAll('[id^="mgtr-"]').forEach(n=>{
  if(n.id.endsWith('-stats')||n.id.endsWith('-cards')||n.id.endsWith('-inquiry'))n.replaceChildren();
  else n.textContent='';
 });
 delete root.dataset.tier;delete root.dataset.role;
}
