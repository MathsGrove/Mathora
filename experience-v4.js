
(()=>{'use strict';
const $=id=>document.getElementById(id);
const core=window.MathsGroveV3;
if(!core||!$('mg4-calendar-dialog'))return;
const get=()=>core.getState();
const put=(id,text)=>{const e=$(id);if(e)e.textContent=String(text)};
let monthOffset=0,lastMonthDate=null,trial=null,interval=null,touchStart=null,lastOpenedFrom=null,restoreCalendarFocus=true;
const baseYear=2026,baseMonth=9; // month index: October
const monthName=d=>d.toLocaleDateString('en-GB',{month:'long',year:'numeric'});
const dateInfo=()=>new Date(baseYear,baseMonth+monthOffset,1);
const inRange=n=>n>=-1&&n<=2;
function eligibleDays(tier,year,month){
 const total=new Date(year,month+1,0).getDate(),dates=[];
 if(tier==='weekly'){for(let i=1;i<=total;i++)if(new Date(year,month,i).getDay()===1&&dates.length<4)dates.push(i)}
 return dates;
}
function mockDay(year,month){return year===2026&&month===8?25:year===2026&&month===9?30:year===2026&&month===10?27:year===2026&&month===11?18:null}
function activity(day){
 const {tier}=get(),date=dateInfo(),y=date.getFullYear(),m=date.getMonth();
 const weekly=eligibleDays(tier,y,m).includes(day),mock=tier==='exam'&&day===mockDay(y,m);
 const scheduled=tier==='weekly'?weekly:true;
 const historical=(y<2026)||(y===2026&&(m<9||(m===9&&day<=29)));
 const completed=scheduled&&!mock&&historical&&day%7!==4;
 const type=mock?'mock':scheduled?'practice':'open';
 return {day,date,y,m,type,scheduled,completed};
}
function renderCalendar(){
 const calendar=$('mg3-calendar');if(!calendar)return;
 const d=dateInfo(),y=d.getFullYear(),m=d.getMonth(),days=new Date(y,m+1,0).getDate(),offset=(d.getDay()+6)%7;
 lastMonthDate=d;calendar.replaceChildren();
 put('mg4-calendar-title',monthName(d)+' · Fictional practice rhythm');
 $('mg4-month-prev').disabled=!inRange(monthOffset-1);
 $('mg4-month-next').disabled=!inRange(monthOffset+1);
 const {tier}=get();put('mg3-calendar-kind',tier==='weekly'?'4 SETS / MONTH':tier==='daily'?'DAILY PRACTICE':'DAILY + MOCK');
 for(const dayLabel of ['MON','TUE','WED','THU','FRI','SAT','SUN']){const l=document.createElement('span');l.className='mg3-cal-label';l.textContent=dayLabel;calendar.append(l)}
 for(let x=0;x<offset;x++){const blank=document.createElement('span');blank.className='mg3-cal-label';blank.setAttribute('aria-hidden','true');calendar.append(blank)}
 for(let n=1;n<=days;n++){
  const ev=activity(n),b=document.createElement('button');b.type='button';b.className='mg3-day';if(ev.type==='mock')b.classList.add('mock');else if(ev.completed)b.classList.add('done');else if(ev.scheduled)b.classList.add('scheduled');else b.classList.add('rest');
  // This is a fictional calendar, not the learner's current date.
  if(monthOffset===0&&n===29)b.dataset.featuredExample='true';
  b.dataset.day=String(n);b.textContent=String(n);
  b.setAttribute('aria-label',new Date(y,m,n).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})+' · '+(ev.type==='mock'?'Fictional monthly timed mock':!ev.scheduled?'No required session':ev.completed?'Example completed session':'Illustrative practice slot')+' · open details');
  b.setAttribute('aria-pressed','false');
  if(ev.scheduled){const mark=document.createElement('span');mark.className='mg3-day-dot';mark.setAttribute('aria-hidden','true');b.append(mark)}
  b.addEventListener('click',()=>{calendar.querySelectorAll('.is-selected').forEach(x=>{x.classList.remove('is-selected');x.setAttribute('aria-pressed','false')});b.classList.add('is-selected');b.setAttribute('aria-pressed','true');lastOpenedFrom=b;restoreCalendarFocus=true;showActivity(ev)});
  calendar.append(b)
 }
 put('mg3-calendar-description',monthName(d)+' · '+(tier==='weekly'?'Four dedicated weekly sets. Click a marked day to see its topic and next action.':tier==='daily'?'A purposeful seven-day rhythm. Choose any date to see the practice focus.':'Daily learning with a separate monthly timed mock. Choose the blue mock date to try a sample session.'));
}
function shiftMonth(n){if(!inRange(monthOffset+n))return;monthOffset+=n;renderCalendar()}
function showActivity(ev){
 const {tier,role,exam}=get(),e=core.getExam();
 const date=new Date(ev.y,ev.m,ev.day),dateLabel=date.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
 const isMock=ev.type==='mock';
 put('mg4-dialog-eyebrow',isMock?'GROVE EXAM · MONTHLY TIMED MOCK':ev.scheduled?'GROVE '+tier.toUpperCase()+' · PRACTICE SESSION':'LEARNING CALENDAR · FLEXIBLE DAY');
 put('mg4-dialog-title',dateLabel);
 put('mg4-dialog-date-mark',String(ev.day).padStart(2,'0')+' '+date.toLocaleDateString('en-GB',{month:'short'}).toUpperCase());
 put('mg4-event-status',isMock?'Fictional mock preview':ev.completed?'Example completed':ev.scheduled?'Planned practice':'Optional review day');
 put('mg4-event-kind',isMock?'Three-question trial, not a full mock':ev.scheduled?'Illustrative '+(tier==='weekly'?'weekly':'daily')+' learning slot':'No required session on this example day');
 const topic=e.topics[(ev.day+1)%e.topics.length],mins=isMock?'Timed specimen · duration varies by qualification':tier==='weekly'?'20–30 min illustrative set':'10–15 min illustrative set';
 const detail=isMock?'A fictional exam-style paper brings together mathematical methods, explanations and time management. The trial below contains just three demonstration questions; it is not an official exam or marked mock.':
 ev.scheduled?('A '+(tier==='weekly'?'structured weekly set':'short daily practice')+' exploring '+topic.toLowerCase()+'. The student may show working on a whiteboard, type their method or upload a photo.'):('No required activity is scheduled on this day. A learner can review released feedback or revisit an earlier method.');
 put('mg4-dialog-desc',detail);
 const tags=$('mg4-event-tags');tags.replaceChildren();[e.name,mins,ev.completed?'Example completed':'Illustrative schedule',role==='student'?'Student workspace':role==='parent'?'Guardian read-only preview':'Assigned tutor preview'].forEach(x=>{const span=document.createElement('span');span.textContent=x;tags.append(span)});
 put('mg4-dialog-focus',isMock?'What the timed trial demonstrates':ev.scheduled?'Learning objective · '+topic:'Keep learning manageable');
 put('mg4-dialog-focus-detail',isMock?'Try three original specimen questions, move between them, and view prepared worked answers after finishing. No answer checking, upload or grade estimate takes place.':role==='parent'?'An authorised parent can see what is planned and encourage explanation of the method. This remains read-only.':role==='tutor'?'An assigned tutor can use the next report to decide how to teach or recheck the topic.':ev.scheduled?'Complete the question, reflect on confidence, then try a new variant to check understanding.':'Choose a relaxed catch-up or review earlier feedback without any streak penalty.');
 $('mg4-start-trial').hidden=!(isMock&&role==='student');
 $('mg4-view-practice').hidden=role!=='student';
 $('mg4-event-details').hidden=false;$('mg4-trial').hidden=true;$('mg4-trial-results').hidden=true;
 const dialog=$('mg4-calendar-dialog');
 if(!dialog.open){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');}
 $('mg4-dialog-close').focus({preventScroll:true});
}
function closeDialog(){stopClock();const dialog=$('mg4-calendar-dialog');if(dialog.open&&typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');trial=null;$('mg4-trial-answer').value=''}
function stopClock(){if(interval!==null){clearInterval(interval);interval=null}}
function trialSet(index){if(!trial)return;trial.answers[trial.index]=$('mg4-trial-answer').value;trial.index=Math.max(0,Math.min(2,index));const q=core.getExample(trial.index);put('mg4-trial-step','QUESTION '+(trial.index+1)+' OF 3 · '+q[5]+' MARKS (SPECIMEN)');put('mg4-trial-prompt',q[1]);$('mg4-trial-answer').value=trial.answers[trial.index]||'';$('mg4-trial-back').disabled=trial.index===0;$('mg4-trial-next').hidden=trial.index===2;$('mg4-trial-finish').hidden=trial.index!==2;$('mg4-trial-progress').style.width=(((trial.index+1)/3)*100)+'%'}
function tick(){if(!trial)return;const remaining=Math.max(0,Math.ceil((trial.deadline-Date.now())/1000));put('mg4-trial-timer',String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0'));if(remaining<=0)finish(true)}
function startTrial(){stopClock();trial={index:0,answers:['','',''],deadline:Date.now()+6*60*1000};$('mg4-event-details').hidden=true;$('mg4-trial').hidden=false;$('mg4-trial-results').hidden=true;$('mg4-trial-answer').value='';trialSet(0);tick();interval=setInterval(tick,1000);$('mg4-trial-answer').focus()}
function finish(timedOut){if(!trial)return;trial.answers[trial.index]=$('mg4-trial-answer').value;stopClock();$('mg4-trial').hidden=true;$('mg4-trial-results').hidden=false;put('mg4-trial-summary',(timedOut?'The sample timer has ended. ':'You have reached the end of the trial. ')+trial.answers.filter(x=>x.trim()).length+' of 3 questions have recorded draft working. You can compare these drafts with the prepared solutions below. This is not automatic marking.');
 const container=$('mg4-trial-answers');container.replaceChildren();
 for(let i=0;i<3;i++){const q=core.getExample(i),section=document.createElement('section');section.className='mg4-trial-review';const title=document.createElement('strong');title.textContent='Question '+(i+1)+' · '+q[0];const answer=document.createElement('p');answer.textContent='Your draft: '+(trial.answers[i].trim()||'No response recorded');const solution=document.createElement('p');solution.className='mg4-answer';solution.textContent='Prepared solution: '+q[2];const observation=document.createElement('p');observation.textContent='Method to watch: '+q[3];section.append(title,answer,solution,observation);container.append(section)}
}
$('mg4-month-prev').addEventListener('click',()=>shiftMonth(-1));$('mg4-month-next').addEventListener('click',()=>shiftMonth(1));
$('mg3-calendar').addEventListener('touchstart',e=>{if(e.touches.length!==1)return;touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});
$('mg3-calendar').addEventListener('touchend',e=>{if(!touchStart)return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.35)shiftMonth(dx<0?1:-1)},{passive:true});
$('mg4-dialog-close').addEventListener('click',closeDialog);$('mg4-calendar-dialog').addEventListener('close',()=>{
 stopClock();trial=null;$('mg4-trial-answer').value='';
 if(restoreCalendarFocus&&lastOpenedFrom?.isConnected)lastOpenedFrom.focus({preventScroll:true});
 restoreCalendarFocus=true;
});
$('mg4-calendar-dialog').addEventListener('cancel',()=>{stopClock();trial=null});
$('mg4-calendar-dialog').addEventListener('click',e=>{if(e.target===$('mg4-calendar-dialog'))closeDialog()});
$('mg4-view-practice').addEventListener('click',()=>{restoreCalendarFocus=false;closeDialog();$('interactive-sample').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})});
$('mg4-start-trial').addEventListener('click',startTrial);
$('mg4-trial-back').addEventListener('click',()=>trialSet(trial.index-1));$('mg4-trial-next').addEventListener('click',()=>trialSet(trial.index+1));$('mg4-trial-finish').addEventListener('click',()=>finish(false));$('mg4-trial-close').addEventListener('click',closeDialog);
function buildAnalytics(){
 const root=document.createElement('section');root.id='mg4-analysis';root.className='mg4-insights';root.setAttribute('aria-label','Detailed mathematics progress analysis');
 root.innerHTML='<div class="mg4-insights-head"><h4 id="mg4-insights-title">A deeper picture of progress</h4><small>FICTIONAL ANALYTICS · NOT A GRADE FORECAST</small></div><div class="mg4-insight-grid"><article class="mg4-insight-card"><h5 id="mg4-chart-heading">Attainment and confidence over time</h5><svg id="mg4-chart" class="mg4-chart" viewBox="0 0 430 185" role="img" aria-label="Illustrative time-series chart"></svg><div class="mg4-chart-axis" id="mg4-chart-labels"></div><div class="mg4-mini-key"><span><i></i>Accuracy</span><span><i class="champ"></i>Self-reported confidence</span></div><p id="mg4-chart-note">Example trends; no statistical claim is made.</p></article><article class="mg4-insight-card"><h5 id="mg4-evidence-heading">What the analysis measures</h5><div class="mg4-evidence-grid" id="mg4-evidence-grid"></div><p id="mg4-evidence-caption">Collected working helps connect mistakes with specific next questions.</p></article></div><div class="mg4-deep-grid"><article class="mg4-story-card"><p class="mg4-tagline" id="mg4-story-tag">UNDERSTANDING</p><h5 id="mg4-story-head">Patterns worth noticing</h5><p id="mg4-story-body"></p><ul id="mg4-story-list"></ul></article><article class="mg4-story-card"><p class="mg4-tagline" id="mg4-action-tag">WHAT TO DO NEXT</p><h5 id="mg4-action-head">Turn insight into action</h5><p id="mg4-action-body"></p><ul id="mg4-action-list"></ul></article></div>';
 $('mg3-role-content').append(root);
}
buildAnalytics();
const trends={weekly:{accuracy:[57,62,68,74],confidence:[51,57,60,69],labels:['Set 1','Set 2','Set 3','Set 4']},daily:{accuracy:[55,59,61,64,66,72,77],confidence:[48,53,58,60,63,66,72],labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun']},exam:{accuracy:[56,61,65,66,72,77],confidence:[47,52,57,63,65,73],labels:['W1','W2','W3','W4','W5','W6']}};
function drawChart(tier){const data=trends[tier],svg=$('mg4-chart');svg.replaceChildren();svg.setAttribute('aria-label','Fictional '+(tier==='weekly'?'four-set':tier==='daily'?'seven-day':'six-period')+' sample trend: accuracy '+data.accuracy.join(', ')+' percent; confidence '+data.confidence.join(', ')+' percent.');const svgNS='http://www.w3.org/2000/svg';const add=(type,attrs)=>{const el=document.createElementNS(svgNS,type);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));svg.append(el);return el};const left=16,right=418,top=22,bottom=153;
 for(let n=40;n<=100;n+=20){const y=bottom-(n-40)/60*(bottom-top);add('line',{x1:left,y1:y,x2:right,y2:y,stroke:'#e9e8e3','stroke-width':'1'});const txt=add('text',{x:3,y:y+3,fill:'#94a0ae','font-size':'9'});txt.textContent=n}
 const xy=(arr)=>arr.map((v,i)=>[(left+20)+(right-left-38)*i/(arr.length-1),bottom-(v-40)/60*(bottom-top)]);
 [[data.accuracy,'#233b57'],[data.confidence,'#baa080']].forEach(([arr,color])=>{const pts=xy(arr);add('polyline',{points:pts.map(p=>p.join(',')).join(' '),stroke:color,fill:'none','stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'});pts.forEach(([x,y])=>add('circle',{cx:x,cy:y,r:3.8,fill:color,stroke:'#fff','stroke-width':1.4}))});
 const labels=$('mg4-chart-labels');labels.replaceChildren();for(const s of data.labels){const el=document.createElement('span');el.textContent=s;labels.append(el)}
}
function setList(id,items){const list=$(id);list.replaceChildren();items.forEach(x=>{const li=document.createElement('li');li.textContent=x;list.append(li)})}
function refresh({tier,role,exam}){
 drawChart(tier);const e=core.getExam(),topic=e.topics[1],hard=e.topics[2];
 const period=tier==='weekly'?'four sets this month':tier==='daily'?'seven practice days':'practice and timed assessments';
 put('mg4-chart-heading',role==='parent'?'Progress families can understand':role==='tutor'?'Assessment evidence over time':'Accuracy and confidence over time');
 put('mg4-chart-note','These are wholly fictional '+period+' trends. Accuracy and confidence are separate signals; neither establishes a predicted examination grade.');
 put('mg4-insights-title',role==='parent'?'A meaningful family progress view':role==='tutor'?'Teaching priorities from collected evidence':'A deeper look at your learning');
 put('mg4-evidence-heading',role==='parent'?'Shared report at a glance':role==='tutor'?'Examiner-led intervention evidence':'Practice evidence at a glance');
 const metrics=role==='parent'?[['6 / 7','Days practised'],['4','Topics visited'],['1','Recheck priority']]:role==='tutor'?[['31','Questions recorded'],['2','Patterns flagged'],['1','Mock planned']]:tier==='weekly'?[['4 / 4','Sets completed'],['3','Topics visited'],['1','Focus area']]:[['6 / 7','Days practised'],['31','Questions recorded'],['4','Topics reviewed']];
 const grid=$('mg4-evidence-grid');grid.replaceChildren();metrics.forEach(([value,caption])=>{const c=document.createElement('div');c.className='mg4-evidence-cell';const sm=document.createElement('small');sm.textContent=caption;const st=document.createElement('strong');st.textContent=value;c.append(sm,st);grid.append(c)});
 if(role==='parent'){put('mg4-evidence-caption','Read-only visibility into released reports and exam preparation. The focus is conversation and support, never editing a student’s marks.');
 put('mg4-story-tag','FOR FAMILIES');put('mg4-story-head','What has changed for the better?');put('mg4-story-body','Alex is completing regular tasks and showing stronger confidence. The next useful question is whether '+topic.toLowerCase()+' methods remain secure in unfamiliar examples.');
 setList('mg4-story-list',['A completed session is evidence of engagement, not proof of mastery.','The reported difficulty is specific enough to support a calm conversation.','A future mock will help distinguish practice success from timed performance.']);
 put('mg4-action-tag','HOW TO SUPPORT');put('mg4-action-head','A conversation for tonight');put('mg4-action-body','Ask Alex to explain why an answer works rather than asking only what score they received.');
 setList('mg4-action-list',['“Which question taught you something new?”','“Can you show me how you checked a sign or calculation?”','Praise returning to difficult material and making corrections.'])}
 else if(role==='tutor'){put('mg4-evidence-caption','Access is limited to this assigned learner. Raw evidence may require professional interpretation and moderation.');
 put('mg4-story-tag','DIAGNOSE');put('mg4-story-head','Question-level teaching intelligence');put('mg4-story-body','A recurring sign error in a multi-step '+topic.toLowerCase()+' response suggests the method is partially secure but verification is inconsistent.');
 setList('mg4-story-list',['Misconception tag: sign selection / accuracy.','Method evidence: initial approach sound, final verification absent.','Secondary focus: '+hard.toLowerCase()+' explanations.']);
 put('mg4-action-tag','INTERVENTION PLAN');put('mg4-action-head','The next 20 minutes');put('mg4-action-body','Use a short contrast-and-recheck teaching sequence before assigning a more demanding problem.');
 setList('mg4-action-list',['5 min: model two factor pairs with different signs.','10 min: supervised unfamiliar questions; require a check.','5 min: independent exit question and note if the error repeats.'])}
 else{put('mg4-evidence-caption',tier==='weekly'?'A monthly picture combines four sets.':tier==='daily'?'Weekly reporting follows a seven-day learning routine.':'A mock provides formal evidence alongside daily learning.');
 put('mg4-story-tag','REFLECT');put('mg4-story-head','Where are you becoming more secure?');put('mg4-story-body','Fictional accuracy and confidence improve across this sample. The priority is not to maximise a streak: it is to understand '+topic.toLowerCase()+' and explain every mathematical choice.');
 setList('mg4-story-list',['Strength: organised calculations and willingness to attempt a method.','To revisit: '+topic.toLowerCase()+' with careful checking.','Reassessment: a new question rather than a memorised answer.']);
 put('mg4-action-tag','YOUR NEXT STEP');put('mg4-action-head','A small plan that builds confidence');put('mg4-action-body','Start with one focused task, show your working and explain a reason for each step.');
 setList('mg4-action-list',['Review the earlier misconception for two minutes.','Complete the next practice task independently.','Write one sentence describing what you would check next time.'])}
 if(role!=='student'&&tier!=='exam')$('mg4-analysis').hidden=true;else $('mg4-analysis').hidden=false;
}
document.querySelectorAll('[data-mg4-report="signature"]').forEach(el=>el.addEventListener('click',ev=>{ev.preventDefault();const tab=document.querySelector('[data-report="signature"]');if(tab)tab.click();$('signature-sample').scrollIntoView({behavior:'smooth',block:'start'})}));
window.MathsGroveExperienceV4={renderCalendar,refresh};
renderCalendar();refresh(get());
})();
