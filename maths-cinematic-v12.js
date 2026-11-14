/* Mathematical Constellations / v12
   Native graphics, finite phases, and native links if JavaScript is unavailable.
   Reduced motion, Save-Data, page visibility, modified clicks and skip navigation bypass motion. */
(()=>{
 "use strict";
 const passage=document.getElementById("mg12-passage");
 if(!passage)return;
 const preference=window.matchMedia?.("(prefers-reduced-motion: reduce)");
 const small=window.matchMedia?.("(max-width: 720px)");
 const shouldSkip=()=>Boolean(preference?.matches||navigator.connection?.saveData||document.visibilityState==="hidden");
 const scenes={
  services:{kind:"programmes",kicker:"01 / THE PATH AHEAD",formula:"f(x) → ∞",subtitle:"A rhythm for every learner",working:["Start with the question","Understand the method","Grow with practice"]},
  "signature-sample":{kind:"report",kicker:"02 / AN EXAMINER'S EYE",formula:"∑ method marks",subtitle:"Every line of working has meaning",working:["x² − 5x + 6 = 0","(x − 2)(x − 3) = 0","x = 2 or x = 3"]},
  "signature-discovery":{kind:"report",kicker:"03 / THE SIGNATURE DIFFERENCE",formula:"∴ understanding",subtitle:"Beyond the score, into the reasoning",working:["x² − 5x + 6 = 0","(x − 2)(x − 3) = 0","x = 2 or x = 3"]},
  signature:{kind:"report",kicker:"04 / HUMAN MARKING",formula:"∑ method marks",subtitle:"A closer look at every step",working:["x² − 5x + 6 = 0","(x − 2)(x − 3) = 0","x = 2 or x = 3"]},
  dashboards:{kind:"student",kicker:"05 / THE LEARNING JOURNEY",formula:"Δ understanding",subtitle:"One learner. A clearer next step.",working:["Show the working","See what it tells us","Recheck a new question"]},
  "choose-your-view":{kind:"student",kicker:"06 / THREE PERSPECTIVES",formula:"1 → 3",subtitle:"One journey, different insights",working:["The learner practises","The family understands","The tutor guides"]},
  "learning-journey":{kind:"student",kicker:"07 / YOUR VIEW",formula:"f(x)",subtitle:"Make the next step visible",working:["Practise with purpose","Understand the feedback","Build on the evidence"]},
  "interactive-sample":{kind:"practice",kicker:"08 / SHOW THE WORKING",formula:"x² − 5x + 6",subtitle:"Make every line count",working:["x² − 5x + 6 = 0","(x − 2)(x − 3) = 0","x = 2 or x = 3"]},
  "how-it-works":{kind:"practice",kicker:"09 / THE MATHSGROVE METHOD",formula:"∫ understanding",subtitle:"From practice to the next insight",working:["Try a new question","Look at the method","Check your understanding"]},
  experience:{kind:"practice",kicker:"09 / THE MATHSGROVE METHOD",formula:"∫ understanding",subtitle:"From practice to the next insight",working:["Try a new question","Look at the method","Check your understanding"]},
  "report-page":{kind:"report",kicker:"10 / OPEN THE EXAMINER BOOKLET",formula:"x² − 5x + 6",subtitle:"A written solution, then the examiner's insight",working:["x² − 5x + 6 = 0","(x − 2)(x − 3) = 0","x = 2 or x = 3"]},
  "reasoning-page":{kind:"practice",kicker:"11 / TRY THE METHOD",formula:"3(x + 4) = 27",subtitle:"Follow the solution, not just the answer",working:["3(x + 4) = 27","x + 4 = 9","x = 5"]},
  top:{kind:"programmes",kicker:"MATHSGROVE / RETURN",formula:"π",subtitle:"Back to the big picture",working:["Question","Method","Understanding"]}
 };
 const perspectives={
  student:{kind:"student",kicker:"THE STUDENT'S PERSPECTIVE",formula:"x → progress",subtitle:"Think it through. Make the next move.",working:["Try a question","Show your working","Understand the feedback"]},
  parent:{kind:"parent",kicker:"THE FAMILY'S PERSPECTIVE",formula:"Δ confidence",subtitle:"Beyond percentages, into understanding.",working:["See emerging strengths","Understand the priorities","Know how to support"]},
  tutor:{kind:"tutor",kicker:"THE TUTOR'S PERSPECTIVE",formula:"f′(x)",subtitle:"From evidence to teaching decisions.",working:["Spot the misconception","Teach the method","Recheck independently"]}
 };
 const fields={
  kicker:passage.querySelector(".mg12-scene-kicker"),
  formula:passage.querySelector(".mg12-scene-formula"),
  subtitle:passage.querySelector(".mg12-scene-subtitle"),
  lines:[...passage.querySelectorAll(".mg12-hand-line")]
 };
 let busy=false,pending=null;
 const render=(key,theme)=>{
  const scene=(theme&&perspectives[theme])||scenes[key]||scenes.services;
  passage.dataset.scene=scene.kind;
  fields.kicker.textContent=scene.kicker;
  fields.formula.textContent=scene.formula;
  fields.subtitle.textContent=scene.subtitle;
  fields.lines.forEach((node,i)=>{node.textContent=scene.working[i]||""});
  return scene;
 };
 const timings=()=>{
   if(small?.matches)return {enter:330,hold:480,exit:440};
   return {enter:440,hold:650,exit:550};
 };
 const phase=async(frames,options)=>{
   const animation=passage.animate(frames,{...options,fill:"forwards"});
   try{await animation.finished}finally{animation.cancel()}
 };
 const start=(key,action,theme)=>{
  if(shouldSkip()||typeof passage.animate!=="function"){action();return true;}
  if(busy){pending={key,action,theme};return true;}
  busy=true;
  render(key,theme);
  passage.hidden=false;
  passage.classList.remove("mg12-active");
  void passage.offsetWidth;
  passage.classList.add("mg12-active");
  const t=timings();
  let committed=false;
  const commit=()=>{if(committed)return;committed=true;action()};
  (async()=>{
    try{
      await phase([{transform:"translateY(102%)",opacity:1},{transform:"translateY(0)",opacity:1}],{duration:t.enter,easing:"cubic-bezier(.16,.74,.23,1)"});
      await phase([{transform:"translateY(0)",opacity:1},{transform:"translateY(0)",opacity:1}],{duration:t.hold,easing:"linear"});
      commit();
      await phase([{transform:"translateY(0)",opacity:1},{transform:"translateY(-8%) scale(1.04)",opacity:0}],{duration:t.exit,easing:"cubic-bezier(.65,.04,.46,.98)"});
    }catch(_error){commit()}
    finally{
      passage.hidden=true;
      passage.classList.remove("mg12-active");
      busy=false;
      if(pending){const next=pending;pending=null;start(next.key,next.action,next.theme)}
    }
  })();
  return true;
 };
 const commitHash=(hash,target,replace)=>{
   if(replace)window.history.replaceState(null,"",hash);
   else window.history.pushState(null,"",hash);
   target.scrollIntoView({behavior:"auto",block:"start"});
   if(target.hasAttribute("tabindex"))target.focus?.({preventScroll:true});
   target.classList.remove("mg11-destination");
   void target.offsetWidth;
   target.classList.add("mg11-destination");
 };
 const navigateHash=(hash,{replace=false,theme}={})=>{
  if(typeof hash!=="string"||!/^#[A-Za-z][A-Za-z0-9-]*$/.test(hash))return false;
  const key=hash.slice(1),target=document.getElementById(key);
  if(!target)return false;
  if(!Object.prototype.hasOwnProperty.call(scenes,key))return false;
  return start(key,()=>commitHash(hash,target,replace),theme);
 };
 const navigatePage=(url,key="report-page")=>{
  if(typeof url!=="string"||!url||!Object.prototype.hasOwnProperty.call(scenes,key))return false;
  return start(key,()=>window.location.assign(url));
 };
 const navigateReport=(url)=>navigatePage(url,"report-page");
 window.MathsGroveMotion=Object.freeze({navigateHash,navigatePage,navigateReport});
 document.addEventListener("click",event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest?.("a[href]");
  if(!link||(link.target&&link.target!=="_self")||link.hasAttribute("download")||link.hasAttribute("data-mg11-direct")||link.closest("[data-mg8-route]"))return;
  const href=link.getAttribute("href");
  if(href?.startsWith("#")&&href!=="#main-content"&&document.getElementById(href.slice(1))&&Object.prototype.hasOwnProperty.call(scenes,href.slice(1))){
    event.preventDefault();navigateHash(href);return;
  }
  if(href==="./report.html"||href==="./reasoning-demo.html"){
    event.preventDefault();navigatePage(link.href,href==="./report.html"?"report-page":"reasoning-page");
  }
 });
})();
