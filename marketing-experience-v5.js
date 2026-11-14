/* MathsGrove marketing v5: deliberate, fictional multi-role learning-story product tour. */
(()=>{'use strict';
const root=document.getElementById('dashboards');if(!root)return;
const q=id=>document.getElementById(id);
const text=(id,value)=>{const e=q(id);if(e)e.textContent=String(value??'—')};
const cases={
 eleven:{
  name:'Jamie Patel',initials:'JP',route:'11+ MATHEMATICS',qual:'Year 5 · 11+ entrance preparation',
  heading:'A stronger foundation, one question at a time.',
  subtitle:'Moving from confident arithmetic to multi-step reasoning.',
  scores:[44,49,55,60,67,72],xlabels:['Baseline','Set 2','Set 3','Set 4','Set 5','Latest'],
  topics:[['Number fluency',81],['Problem solving',64],['Multi-step reasoning',52]],
  latest:'72%',baseline:'44%',set:'6 / 7',focus:'Multi-step reasoning',
  studentTask:'Solve a two-step word problem',parentTask:'Ask Jamie to explain each step aloud',tutorTask:'Model two-step word problems with bar diagrams',
  studentReport:'Clear progress in number fluency. The next opportunity is explaining why each operation is chosen.',
  parentReport:'Jamie is becoming more confident with number work. At home, ask what the question is really asking before calculating.',
  tutorReport:'Arithmetic accuracy is improving in these example sets; next probe the interpretation of multi-step word problems.',
  badge:'FOUNDATION STAGE',level:'Entrance preparation · illustrative pathway',
  sampleSummary:'An illustrative 11+ learning story. This does not assert that a complete board-specific 11+ bank is currently live.'
 },
 growth:{
  name:'Maya Ellis',initials:'ME',route:'GCSE HIGHER',qual:'Year 10 · GCSE Higher mathematics',
  heading:'Confidence built on visible progress.',
  subtitle:'From uncertain algebra to a more consistent method.',
  scores:[47,51,58,64,71,76],xlabels:['Baseline','Week 1','Week 2','Week 3','Week 4','Latest'],
  topics:[['Linear equations',88],['Quadratic methods',76],['Problem solving',61]],
  latest:'76%',baseline:'47%',set:'6 / 7',focus:'Problem solving',
  studentTask:'Try a fresh quadratic equation',parentTask:'Celebrate improvements in Maya’s written method',tutorTask:'Check transfer with one unfamiliar quadratic',
  studentReport:'Your working is more organised. You are now securing more method marks; check the final line and units.',
  parentReport:'The fictional paper trend illustrates steadier working and improved confidence, not simply a higher score.',
  tutorReport:'Maya now shows stronger algebraic structure. Next lesson: independent choice of method in an unfamiliar context.',
  badge:'GROWING CONFIDENCE',level:'GCSE mathematics · fictional student',
  sampleSummary:'An illustrative progression story. Scores come from fictional papers of varying difficulty and cannot establish a predicted grade.'
 },
 stretch:{
  name:'Sophie Chen',initials:'SC',route:'A LEVEL MATHEMATICS',qual:'A Level · advanced mathematics',
  heading:'Excellence still has a next step.',
  subtitle:'Extending an already strong mathematical foundation.',
  scores:[82,84,86,88,92,94],xlabels:['Review 1','Review 2','Review 3','Review 4','Review 5','Latest'],
  topics:[['Pure algebra',96],['Calculus',92],['Non-routine proof',83]],
  latest:'94%',baseline:'82%',set:'7 / 7',focus:'Non-routine proof',
  studentTask:'Complete an unfamiliar proof challenge',parentTask:'Support quality of practice over quantity',tutorTask:'Extend reasoning with non-routine problems',
  studentReport:'Accuracy on familiar structures is strong. Explain each assumption and test the boundaries of your method.',
  parentReport:'A high score is only part of the story: meaningful challenge matters even when a learner is already excelling.',
  tutorReport:'Focus less on routine accuracy and more on proof structure, mathematical communication and adaptation.',
  badge:'HIGH ACHIEVER',level:'Advanced mathematics · fictional student',
  sampleSummary:'An illustrative high-achiever story. These figures do not represent actual students or official exam predictions.'
 }
};
let activeCase='growth',role='student';
function svg(tag,attrs){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [name,value]of Object.entries(attrs||{}))el.setAttribute(name,String(value));return el}
function lineChart(data){
 const host=q('mg5-chart');if(!host)return;host.replaceChildren();
 const w=420,h=148,left=27,right=12,top=11,bottom=23;
 const x=i=>left+i*(w-left-right)/(data.scores.length-1);
 const y=v=>top+(100-v)*(h-top-bottom)/100;
 const graph=svg('svg',{class:'mg5-chart-svg',viewBox:'0 0 '+w+' '+h,role:'img','aria-label':data.name+' fictional review scores: '+data.scores.map((v,i)=>data.xlabels[i]+' '+v+' percent').join(', ')});
 for(const v of [25,50,75,100]){
  const g=svg('line',{x1:left,y1:y(v),x2:w-right,y2:y(v),stroke:'#e5e9ec','stroke-width':'1','stroke-dasharray':'3 4'});
  const label=svg('text',{x:2,y:y(v)+3.5,fill:'#92a0aa','font-size':'9'});
  label.textContent=v;graph.append(g,label);
 }
 const points=data.scores.map((v,i)=>x(i)+','+y(v)).join(' ');
 const area=svg('polygon',{points:points+' '+x(data.scores.length-1)+','+(h-bottom)+' '+x(0)+','+(h-bottom),fill:'#eef2f5'});
 const path=svg('polyline',{points,fill:'none',stroke:'#213d5a','stroke-width':'2.8','stroke-linejoin':'round','stroke-linecap':'round'});
 graph.append(area,path);
 data.scores.forEach((value,i)=>{
  const circle=svg('circle',{cx:x(i),cy:y(value),r:i===data.scores.length-1?5.2:3.4,fill:i===data.scores.length-1?'#c4ad90':'#fff',stroke:'#213d5a','stroke-width':i===data.scores.length-1?2.4:2});
  const title=svg('title');title.textContent=data.xlabels[i]+': '+value+'% (fictional)';circle.append(title);
  graph.append(circle);
 });
 host.append(graph);
 text('mg5-chart-start',data.baseline+' at first review');
 text('mg5-chart-end',data.latest+' at latest review');
}
function roleDetails(d){
 const latest=d.latest,first=d.baseline,topic=d.topics[2];
 if(role==='student')return{
  eyebrow:'STUDENT VIEW / PERSONAL WORKSPACE',
  title:'Welcome back, '+d.name.split(' ')[0]+'.',summary:'Your practice, feedback and next step in one place.',
  labels:['LATEST REVIEW','PRACTICE COMPLETION','FIRST REVIEW'],values:[latest,d.set,first],
  subs:['This fictional paper','Example learning week','Fictional starting point'],
  nextLabel:'YOUR NEXT PRACTICE',next:d.studentTask,
  nextDetail:'See the question, record your working and review how the method can improve.',
  insightTitle:'YOUR EXAMINER INSIGHT',insight:d.studentReport,
  chartTitle:'Your reviewed paper journey',topicTitle:'Topics worth revisiting',
  caption:'Scores across six different fictional papers',
  explanation:'A learning view that helps the student decide what to do next.'
 };
 if(role==='parent')return{
  eyebrow:'PARENT VIEW / AUTHORISED READ-ONLY',
  title:d.name.split(' ')[0]+'’s progress, made clearer.',summary:'See the learning evidence without the marking complexity.',
  labels:['LATEST REVIEW','REVIEWED SETS','TOPIC TO SUPPORT'],values:[latest,'6',d.focus],
  subs:['Illustrative paper','Fictional sample series','Most useful at-home focus'],
  nextLabel:'HOW TO HELP AT HOME',next:d.parentTask,
  nextDetail:'A short conversation about reasoning can be more useful than simply asking for another score.',
  insightTitle:'A PARENT-FRIENDLY SUMMARY',insight:d.parentReport,
  chartTitle:'How performance has changed',topicTitle:'Learning areas at a glance',
  caption:'Individual paper marks, not predicted grades',
  explanation:'A calm, read-only view of progress and practical family support.'
 };
 return{
  eyebrow:'TUTOR VIEW / TARGETED INTERVENTIONS',
  title:'A clearer teaching decision.',summary:d.name+' · '+d.qual+'.',
  labels:['LATEST REVIEW','REVIEWED EVIDENCE','PRIORITY TOPIC'],values:[latest,'6 papers',d.focus],
  subs:['Examiner-marked sample','Fictional score history','Target for next intervention'],
  nextLabel:'NEXT TEACHING ACTION',next:d.tutorTask,
  nextDetail:'Inspect awarded marks and examiner remarks, teach the misconception, then use an unseen question to reassess.',
  insightTitle:'EXAMINER OBSERVATIONS',insight:d.tutorReport,
  chartTitle:'Evidence across reviewed papers',topicTitle:'Question-topic performance',
  caption:'Illustrative mark percentages over time',
  explanation:'A teaching view for identifying gaps and tracking whether intervention worked.'
 };
}
function render(){
 const d=cases[activeCase],r=roleDetails(d);
 q('mg5-preview').classList.remove('mg5-focus-pulse');void q('mg5-preview').offsetWidth;q('mg5-preview').classList.add('mg5-focus-pulse');
 document.querySelectorAll('[data-mg5-case]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mg5Case===activeCase)));
 document.querySelectorAll('[data-mg5-role]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mg5Role===role)));
 text('mg5-case-story',d.heading);text('mg5-case-summary',d.subtitle);
 text('mg5-preview-eyebrow',r.eyebrow);text('mg5-preview-name',r.title);text('mg5-preview-subtitle',r.summary);
 text('mg5-preview-user',d.name);text('mg5-preview-initials',d.initials);
 text('mg5-preview-badge',d.route);text('mg5-preview-level',d.level);
 text('mg5-metric1-label',r.labels[0]);text('mg5-metric2-label',r.labels[1]);text('mg5-metric3-label',r.labels[2]);
 text('mg5-metric1-value',r.values[0]);text('mg5-metric2-value',r.values[1]);text('mg5-metric3-value',r.values[2]);
 text('mg5-metric1-note',r.subs[0]);text('mg5-metric2-note',r.subs[1]);text('mg5-metric3-note',r.subs[2]);
 text('mg5-chart-title',r.chartTitle);text('mg5-chart-meta',r.caption);
 text('mg5-topics-title',r.topicTitle);text('mg5-next-label',r.nextLabel);
 text('mg5-next-title',r.next);text('mg5-next-detail',r.nextDetail);
 text('mg5-insight-label',r.insightTitle);text('mg5-insight-text',r.insight);
 text('mg5-story-moral',r.explanation);text('mg5-story-accuracy',d.sampleSummary);
 text('mg5-dashboard-note',role==='student'?'Student learning space':role==='parent'?'Guardian academic overview':'Tutor evidence dashboard');
 const topics=q('mg5-topics');topics.replaceChildren();
 d.topics.forEach(([name,value])=>{
  const row=document.createElement('div');row.className='mg5-topic-row';
  const title=document.createElement('div');title.className='mg5-topic-name';
  const label=document.createElement('span');label.textContent=name;
  const pct=document.createElement('b');pct.textContent=value+'%';
  title.append(label,pct);
  const track=document.createElement('div');track.className='mg5-topic-track';
  const fill=document.createElement('div');fill.className='mg5-topic-fill';fill.style.width=value+'%';track.append(fill);row.append(title,track);topics.append(row);
 });
 lineChart(d);
}
function changePreview(update){
 const renderNow=()=>{update();render()};
 if(document.startViewTransition&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  document.startViewTransition(renderNow);
 }else renderNow();
}
document.querySelectorAll('[data-mg5-case]').forEach(btn=>btn.addEventListener('click',()=>changePreview(()=>{activeCase=btn.dataset.mg5Case})));
document.querySelectorAll('[data-mg5-role]').forEach(btn=>btn.addEventListener('click',()=>changePreview(()=>{role=btn.dataset.mg5Role})));
const full=q('mg5-open-full-demo');
if(full)full.addEventListener('click',event=>{
 const exam=q('mg3-exam-select');const target=q('learning-journey');
 if(!exam||!target)return;
 event.preventDefault();
 const choice=activeCase==='eleven'?'11plus':activeCase==='growth'?'gcse':'alevel';
 exam.value=choice;exam.dispatchEvent(new Event('change',{bubbles:true}));
 const examTier=document.querySelector('[data-tier="exam"]');
 if(examTier)examTier.click();
 const roleButton=document.querySelector('[data-role="'+role+'"]');
 if(roleButton)roleButton.click();
 if(window.MathsGroveMotion?.navigateHash?.('#learning-journey',{replace:true}))return;
 history.replaceState(null,'','#learning-journey');
 target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
});
window.MathsGroveShowcase=Object.freeze({
 select({caseKey,viewRole}){
  if(!Object.prototype.hasOwnProperty.call(cases,caseKey)||!['student','parent','tutor'].includes(viewRole))return false;
  changePreview(()=>{activeCase=caseKey;role=viewRole});
  return true;
 }
});
render();
// Motion is decorative: the page remains fully visible without JavaScript and with reduced-motion settings.
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduce&&'IntersectionObserver' in window){
 const sections=[...document.querySelectorAll('.mg5-reveal')];
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.add('mg5-visible');observer.unobserve(entry.target)}
 }),{threshold:.09,rootMargin:'0px 0px 35px 0px'});
 document.body.classList.add('mg5-motion-ready');sections.forEach(el=>{observer.observe(el)});
}
})();
