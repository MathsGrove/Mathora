/* MathsGrove / illustrative week in focus
 * Uses only the existing fictional public demo controls, never real learner data.
 * 7-day counts are labelled examples, not a report or a study-time measure. */
(()=>{
 "use strict";
 const tour=document.getElementById("learning-journey");
 const wrap=tour?.querySelector(".wrap");
 const get=window.MathsGroveV3?.getState;
 if(!wrap||typeof get!=="function")return;
 const node=(tag,cls,txt)=>{
  const n=document.createElement(tag);
  if(cls)n.className=cls;
  if(txt!==undefined)n.textContent=String(txt);
  return n;
 };
 const week=node("section","mg15-week");
 week.id="mg15-week";
 week.setAttribute("aria-labelledby","mg15-week-title");
 const heading=node("div","mg15-week-head");
 const headingCopy=node("div");
 headingCopy.append(node("span","mg15-week-kicker","A WEEK IN FOCUS / FICTIONAL EXAMPLE"));
 const title=node("h3",null,"Seven days, one clearer picture");
 title.id="mg15-week-title";
 headingCopy.append(title,node("p",null,"Change the programme or dashboard perspective above to see how the same fictional week could be explained."));
 const pill=node("span","mg15-week-pill","ILLUSTRATIVE DATA");
 heading.append(headingCopy,pill);
 const body=node("div","mg15-week-body");
 const chart=node("div","mg15-week-plot");
 chart.setAttribute("role","img");
 chart.setAttribute("aria-label","Fictional question counts across seven days");
 const labels=["M","T","W","T","F","S","S"];
 const bars=labels.map((day,i)=>{
  const column=node("div","mg15-week-day");
  const value=node("span","mg15-week-value","0");
  const track=node("span","mg15-week-track");
  const fill=node("span","mg15-week-fill");
  fill.style.setProperty("--day",i);
  track.append(fill);
  const name=node("span","mg15-week-day-name",day);
  column.append(value,track,name);chart.append(column);
  return {value,fill};
 });
 const insight=node("aside","mg15-week-insight");
 const insightTop=node("div");
 insightTop.append(node("small",null,"WHAT THIS EXAMPLE COULD TELL YOU"));
 const insightTitle=node("strong",null,"See the rhythm, then the method");
 const insightBody=node("p",null,"A question count is not a measure of understanding.");
 insightTop.append(insightTitle,insightBody);
 const context=node("p",null,"Questions shown are fictional attempts, not recorded time or independent mastery.");
 insight.append(insightTop,context);
 body.append(chart,insight);
 const foot=node("p","mg15-week-foot","FICTIONAL PREVIEW · No private learner records · Questions per day, not study minutes · A correct attempt alone does not verify mastery");
 week.append(heading,body,foot);
 const next=wrap.querySelector("#mg14-showcase");
 if(next)wrap.insertBefore(week,next);
 else wrap.append(week);
 const examples={
  weekly:{values:[0,0,0,6,0,0,0],title:"One meaningful weekly set",message:"One sample set gives a starting point for explanation and a later monthly review. It is not a daily streak.",hint:"A single set this example week",context:"6 fictional example questions · weekly programme"},
  daily:{values:[5,4,6,4,5,7,0],title:"Small steps across the week",message:"Short practice across six example days leaves room to revisit a mistake using a different question.",hint:"Consistency is context, not mastery",context:"31 fictional example questions · six practice days"},
  exam:{values:[4,5,4,6,5,7,0],title:"Practice and exam preparation",message:"An example week of question attempts can show routine; separately reviewed working and moderated mocks are needed to judge exam readiness.",hint:"Separate practice from mock evidence",context:"31 fictional example questions · not a mock score"}
 };
 const roles={
  student:{title:"Your example practice week",message:"Choose a day to reflect on which method you could explain without hints. Attempt counts alone do not measure understanding.",hint:"Ask: why did that step work?"},
  parent:{title:"Questions to ask after the week",message:"Ask which question your child found most interesting, what they checked and what they would try differently. Avoid using counts as a target.",hint:"Ask about effort, corrections and the method"},
  tutor:{title:"Evidence to revisit next lesson",message:"Use this illustrative pattern only as context. Compare approved released feedback and independently recheck one method on a fresh problem.",hint:"Plan an unseen recheck, not a new streak"}
 };
 let visible=false;
 const draw=()=>{
  const state=get();
  if(!state)return;
  const tier=Object.prototype.hasOwnProperty.call(examples,state.tier)?state.tier:"exam";
  const role=Object.prototype.hasOwnProperty.call(roles,state.role)?state.role:"student";
  const locked=tier!=="exam"&&role!=="student";
  week.hidden=locked;
  if(locked)return;
  const data=examples[tier],perspective=roles[role];
  const max=Math.max(...data.values,1);
  title.textContent=role==="student"?data.title:perspective.title;
  insightTitle.textContent=perspective.hint;
  insightBody.textContent=role==="student"?data.message:perspective.message;
  pill.textContent=tier.toUpperCase()+" · "+role.toUpperCase()+" / EXAMPLE";
  context.textContent=data.context+" · Not verified progress";
  const sum=data.values.reduce((a,b)=>a+b,0);
  chart.setAttribute("aria-label","Fictional week: "+data.values.map((value,i)=>labels[i]+" "+value+" question"+(value===1?"":"s")).join(", ")+". "+sum+" example questions in total.");
  week.dataset.tier=tier;week.dataset.role=role;
  bars.forEach((bar,i)=>{
   bar.value.textContent=String(data.values[i]);
   bar.fill.style.setProperty("--v",String(data.values[i]===0?0:Math.max(12,Math.round(100*data.values[i]/max))));
  });
  if(visible&&window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches!==true){
   week.classList.remove("mg15-week-visible");
   void week.offsetWidth;
   week.classList.add("mg15-week-visible");
  }
 };
 if("IntersectionObserver" in window){
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){visible=entry.isIntersecting;if(visible)week.classList.add("mg15-week-visible");}
  },{rootMargin:"80px 0px 80px 0px",threshold:0.03});
  observer.observe(week);
 }else{visible=true;week.classList.add("mg15-week-visible")}
 draw();
 document.addEventListener("click",event=>{
  if(event.target.closest?.("[data-tier],[data-role]"))draw();
 });
 document.getElementById("mg3-exam-select")?.addEventListener("change",draw);
})();
