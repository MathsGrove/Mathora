/* MathsGrove / The Mathematics Gallery v13
 * A single accessible motion language for public page/section navigation and small controls.
 * No student data, third-party scripts, background timers, canvas, or tracking. */
(()=>{
 "use strict";
 if(!document.body)return;
 const canReduce=window.matchMedia?.("(prefers-reduced-motion: reduce)");
 const phone=window.matchMedia?.("(max-width: 720px)");
 const galleryTiles=[
   ["01","START"],["π","NUMBER"],["x²","ALGEBRA"],["∑","SEQUENCE"],["√2","ROOTS"],["∆","CHANGE"],
   ["f(x)","FUNCTION"],["∞","LIMIT"],["2x+3","PATTERN"],["∫","AREA"],["03","PROGRESS"],["θ","ANGLE"],
   ["x = 4","SOLUTION"],["sin θ","WAVES"],["y = mx+c","LINEAR"],["f′(x)","RATE"],["05","METHOD"],["a²+b²","GEOMETRY"],
   ["∴","REASONING"],["cos θ","TRIG"],["n²","SEQUENCE"],["Σm","MARKS"],["Δy/Δx","GRADIENT"],["07","RECHECK"]
 ];
 const scenes={
  services:{kind:"programmes",eyebrow:"A PATH IN MATHEMATICS",title:"Discover your rhythm",equation:"1 → 2 → 3"},
  "choose-your-view":{kind:"people",eyebrow:"ONE LEARNER, THREE PERSPECTIVES",title:"See what matters to you",equation:"x → y"},
  dashboards:{kind:"people",eyebrow:"A CLEARER VIEW",title:"Explore the learning journey",equation:"Δx → Δy"},
  "learning-journey":{kind:"people",eyebrow:"INTERACTIVE LEARNING EXPERIENCE",title:"The next step becomes clear",equation:"f(x)"},
  "signature-discovery":{kind:"report",eyebrow:"SIGNATURE / AN EXAMINER'S EYE",title:"Every method has a meaning",equation:"∑ marks"},
  "signature-sample":{kind:"report",eyebrow:"THE EXAMINER'S BOOKLET",title:"Look behind every mark",equation:"x² − 5x + 6"},
  signature:{kind:"report",eyebrow:"HUMAN EXAMINER FEEDBACK",title:"From method to meaning",equation:"∴"},
  "report-page":{kind:"report",eyebrow:"SEVEN-PAGE EXAMINER BOOKLET",title:"Open the examiner's notes",equation:"∑ method marks"},
  "reasoning-page":{kind:"working",eyebrow:"TRY MATHEMATICAL REASONING",title:"Show the working",equation:"3(x + 4) = 27"},
  "interactive-sample":{kind:"working",eyebrow:"YOUR MATHEMATICS WORKSPACE",title:"Make every step count",equation:"3(x + 4) = 27"},
  "how-it-works":{kind:"working",eyebrow:"THE MATHSGROVE METHOD",title:"Practice. Explain. Recheck.",equation:"∫ understanding"},
  experience:{kind:"working",eyebrow:"THE MATHSGROVE METHOD",title:"The method matters",equation:"∫"},
  top:{kind:"home",eyebrow:"RETURN TO THE BIG PICTURE",title:"See the thinking",equation:"π"},
  "portal-page":{kind:"home",eyebrow:"PRIVATE MATHSGROVE ACCESS",title:"Continue your journey",equation:"x → x + 1"},
  "family-page":{kind:"people",eyebrow:"FAMILY AND TUTOR ACCESS",title:"See the wider picture",equation:"Δy/Δx"},
  "studio-page":{kind:"report",eyebrow:"EXAMINER STUDIO",title:"A closer look at the method",equation:"∑ m"},
  "home-page":{kind:"home",eyebrow:"MATHSGROVE / THE HOME PAGE",title:"Return to mathematics",equation:"∞"},
  "chapter":{kind:"programmes",eyebrow:"EXPLORE MATHEMATICS",title:"Discover what's next",equation:"f(x)"}
 };
 const quotes={
  services:"Every new pattern begins with a question.",
  "choose-your-view":"One idea, many ways to understand it.",
  dashboards:"Progress is built from small discoveries.",
  "learning-journey":"Understanding grows through thoughtful practice.",
  "signature-discovery":"A method tells more than the answer alone.",
  "signature-sample":"Every mark has a reason worth exploring.",
  signature:"Good feedback opens the next possibility.",
  "report-page":"See the thinking behind the mark.",
  "reasoning-page":"Every step reveals another idea.",
  "interactive-sample":"The journey matters as much as the answer.",
  "how-it-works":"Curiosity gives mathematics its direction.",
  experience:"An explanation turns an answer into insight.",
  top:"Where there is curiosity, there is mathematics.",
  "portal-page":"Your next question is another beginning.",
  "family-page":"Ask about the thinking, not only the score.",
  "studio-page":"Look for the reasoning behind each line.",
  "home-page":"Mathematics is a world of connections.",
  chapter:"A new idea starts with a question.",
  student:"Every step counts when you understand why.",
  parent:"Confidence grows through curious conversations.",
  tutor:"Teach the thinking, then test the understanding."
 };
 const roles={
  student:{kind:"people",eyebrow:"STUDENT / YOUR JOURNEY",title:"Learn by doing",equation:"x → progress"},
  parent:{kind:"people",eyebrow:"PARENT / A CLEARER VIEW",title:"See the learning story",equation:"Δ understanding"},
  tutor:{kind:"working",eyebrow:"TUTOR / THE EVIDENCE",title:"Turn mistakes into methods",equation:"f′(x)"}
 };
 const choose=(key,role)=>{
  if(role&&Object.prototype.hasOwnProperty.call(roles,role))return roles[role];
  if(Object.prototype.hasOwnProperty.call(scenes,key))return scenes[key];
  if(/signature|report|examiner|booklet/i.test(key))return scenes["signature-sample"];
  if(/dashboard|calendar|student|parent|tutor|learn/i.test(key))return scenes.dashboards;
  if(/pathway|service|programme|tier|price/i.test(key))return scenes.services;
  if(/sample|question|practice|method/i.test(key))return scenes["interactive-sample"];
  return scenes.chapter;
 };
 const node=(tag,cls,txt)=>{
  const item=document.createElement(tag);
  if(cls)item.className=cls;
  if(txt!==undefined)item.textContent=txt;
  return item;
 };
 const gallery=node("div","mg13-passage");
 gallery.id="mg13-passage";
 gallery.hidden=true;
 gallery.setAttribute("aria-hidden","true");
 const ambient=node("div","mg13-space");
 const aura=node("div","mg13-aura");
 const wall=node("div","mg13-wall");
 wall.setAttribute("aria-hidden","true");
 galleryTiles.forEach(([math,label],i)=>{
  const tile=node("div","mg13-tile");
  tile.style.setProperty("--i",String((i*7)%24));
  const symbol=node("strong","mg13-tile-math",math);
  const sub=node("small","mg13-tile-label",label);
  tile.append(symbol,sub);
  wall.append(tile);
 });
 const orbit=node("div","mg13-orbit");
 const orbit2=node("div","mg13-orbit mg13-orbit-two");
 const trail=document.createElementNS("http://www.w3.org/2000/svg","svg");
 trail.setAttribute("class","mg13-trails");
 trail.setAttribute("viewBox","0 0 1440 900");
 trail.setAttribute("preserveAspectRatio","xMidYMid slice");
 trail.setAttribute("aria-hidden","true");
 [
  "M-80 720 C290 250 460 900 800 430 S1300 130 1550 320",
  "M-80 400 Q440 10 760 470 T1530 330",
  "M40 1050 C390 190 710 120 975 610 S1360 950 1510 200"
 ].forEach(path=>{
  const trace=document.createElementNS("http://www.w3.org/2000/svg","path");
  trace.setAttribute("d",path);
  trace.setAttribute("pathLength","1");
  trail.append(trace);
 });
 ambient.append(aura,wall,orbit,orbit2,trail);
 const content=node("div","mg13-content");
 const eyebrow=node("span","mg13-eyebrow","MATHSGROVE / THE NEXT CHAPTER");
 const formula=node("span","mg13-formula","f(x)");
 const title=node("span","mg13-title","The next idea is waiting");
 const quote=node("p","mg14-maths-quote","A new idea starts with a question.");
 const indicator=node("span","mg13-progress","MATHEMATICS / IN MOTION");
 indicator.setAttribute("aria-hidden","true");
 content.append(eyebrow,formula,title,quote,indicator);
 gallery.append(ambient,content);
 document.body.append(gallery);

 const reduced=()=>Boolean(canReduce?.matches||navigator.connection?.saveData||document.visibilityState==="hidden");
 const touch=()=>Boolean(phone?.matches);
 const timings=kind=>{
  if(touch())return kind==="small"?{enter:155,hold:120,exit:225}:{enter:350,hold:330,exit:480};
  return kind==="small"?{enter:210,hold:145,exit:275}:{enter:490,hold:420,exit:590};
 };
 // Major destinations receive a full gallery; nearby chapter jumps receive a shorter passage.
 const isMajor=key=>/^(services|dashboards|learning-journey|choose-your-view|signature|signature-sample|signature-discovery|report-page|reasoning-page|portal-page|family-page|studio-page|home-page|interactive-sample)$/.test(key);
 const show=(key,run,{theme,mode}={})=>{
  if(reduced()||typeof gallery.animate!=="function"){run();return true}
  if(active)return true; // The visible gallery is already performing the requested journey.
  active=true;
  const scene=choose(key,theme);
  gallery.dataset.scene=scene.kind;
  gallery.dataset.mode=mode|| (isMajor(key)?"major":"small");
  eyebrow.textContent=scene.eyebrow;
  formula.textContent=scene.equation;
  title.textContent=scene.title;
  quote.textContent=quotes[theme]||quotes[key]||quotes.chapter;
  const t=timings(mode|| (isMajor(key)?"major":"small"));
  gallery.hidden=false;
  document.body.classList.add("mg13-transitioning");
  gallery.classList.remove("mg13-active");
  void gallery.offsetWidth;
  gallery.classList.add("mg13-active");
  let committed=false;
  const commit=()=>{if(!committed){committed=true;run()}};
  (async()=>{
   try{
    await phase([{opacity:0,transform:"translateY(18px) scale(.98)"},{opacity:1,transform:"translateY(0) scale(1)"}],t.enter,"cubic-bezier(.18,.75,.28,1)");
    await phase([{opacity:1},{opacity:1}],t.hold,"linear");
    commit();
    await phase([{opacity:1,transform:"translateY(0) scale(1)"},{opacity:0,transform:"translateY(-13px) scale(1.045)"}],t.exit,"cubic-bezier(.24,.66,.24,1)");
   }catch(_error){commit()}
   finally{
    gallery.hidden=true;gallery.classList.remove("mg13-active");
    document.body.classList.remove("mg13-transitioning");
    active=false;
   }
  })();
  return true;
 };
 let active=false,animation=null;
 const phase=async(keyframes,duration,easing)=>{
   const current=gallery.animate(keyframes,{duration,easing,fill:"forwards"});
   animation=current;
   try{await current.finished}finally{current.cancel();if(animation===current)animation=null}
 };
 const finish=()=>{if(animation)animation.cancel()};
 const navigateHash=(hash,{replace=false,theme}={})=>{
   if(typeof hash!=="string"||!/^#[A-Za-z][\w-]*$/.test(hash))return false;
   const target=document.getElementById(hash.slice(1));
   if(!target)return false;
   return show(hash.slice(1),()=>{
    if(replace)window.history.replaceState(null,"",hash);else window.history.pushState(null,"",hash);
    target.scrollIntoView({behavior:"auto",block:"start"});
    if(target!==document.body){
     if(!target.hasAttribute("tabindex"))target.setAttribute("tabindex","-1");
     target.focus?.({preventScroll:true});
    }
    target.classList.remove("mg13-arrived");
    void target.offsetWidth;
    target.classList.add("mg13-arrived");
   },{theme});
 };
 const navigatePage=(uri,key)=>{
   if(typeof uri!=="string"||!uri)return false;
   return show(key||"chapter",()=>window.location.assign(uri),{mode:"major"});
 };
 const navigateReport=uri=>navigatePage(uri,"report-page");
 window.MathsGroveMotion=Object.freeze({navigateHash,navigatePage,navigateReport});
 const siteRoot=new URL("./",window.location.href).pathname;
 const identify=url=>{
  const file=url.pathname.split("/").pop();
  if(file==="report.html")return "report-page";
  if(file==="reasoning-demo.html")return "reasoning-page";
  if(file==="family.html")return "family-page";
  if(file==="portal.html")return "portal-page";
  if(file==="studio.html")return "studio-page";
  if(!file||file==="index.html")return "home-page";
  if(file.endsWith(".html"))return "chapter";
  return null;
 };
 document.addEventListener("click",event=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const link=event.target.closest?.("a[href]");
   if(!link||link.hasAttribute("download")||(link.target&&link.target!=="_self")||
      link.closest("[data-mg8-route]")||link.hasAttribute("data-mg13-direct")||
      link.closest("dialog[open]"))return;
   const href=link.getAttribute("href");
   if(!href||href==="#"||href==="#main-content"||href==="#rg-main")return;
   if(href.startsWith("#")){
     if(document.getElementById(href.slice(1))){event.preventDefault();navigateHash(href)}
     return;
   }
   let url;
   try{url=new URL(link.href,window.location.href)}catch{return}
   if(url.origin!==window.location.origin||!url.pathname.startsWith(siteRoot))return;
   if(url.pathname===window.location.pathname&&url.hash&&document.getElementById(url.hash.slice(1))){
    event.preventDefault();navigateHash(url.hash);return;
   }
   const key=identify(url);
   if(!key||url.href===window.location.href)return;
   event.preventDefault();navigatePage(url.href,key);
 },false);

 // Beautiful, immediate punctuation for real interactive controls — never a blocking overlay.
 const localControls=".mg6-proof-tab,[data-mg5-case],[data-mg5-role],.mg3-pill,.mg3-day,[data-report],[data-nav],.rg-action,.rg-perspectives button,.mgr-controls button,#rg-restart,#rg-go-second,#rg-go-summary,[data-mg4-view]";
 const micro=(element)=>{
   if(reduced())return;
   const bounds=element.getBoundingClientRect?.();
   if(!bounds||!bounds.width||!bounds.height)return;
   const spark=node("span","mg13-number-trail");
   spark.setAttribute("aria-hidden","true");
   spark.style.left=(bounds.left+bounds.width/2)+"px";
   spark.style.top=(bounds.top+bounds.height/2)+"px";
   ["π","+","x²","∑","1"].forEach((symbol,i)=>{
    const item=node("i","mg13-spark",symbol);
    item.style.setProperty("--n",String(i));
    spark.append(item);
   });
   document.body.append(spark);
   spark.addEventListener("animationend",event=>{
    // Child animations bubble; only the trail container finishing should remove it.
    if(event.target===spark)spark.remove();
   });
 };
 document.addEventListener("click",event=>{
   if(event.defaultPrevented||event.button!==0)return;
   const button=event.target.closest?.("button");
   if(button?.matches?.(localControls)&&!button.disabled)micro(button);
 },true);
 document.addEventListener("change",event=>{
  if(event.target?.matches?.("#mg3-exam-select,#mgr-select"))micro(event.target);
 },true);
 document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&active)finish();
 });
 const background=[...document.querySelectorAll(".mg11-atmosphere")];
 if(!reduced()&&"IntersectionObserver" in window){
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries)entry.target.classList.toggle("mg11-visible",entry.isIntersecting);
  },{threshold:0,rootMargin:"90px 0px 90px 0px"});
  background.forEach(item=>observer.observe(item));
 }
 const pauseAmbient=()=>{
   if(canReduce?.matches||document.visibilityState==="hidden")background.forEach(item=>item.classList.remove("mg11-visible"));
 };
 canReduce?.addEventListener?.("change",pauseAmbient);
 document.addEventListener("visibilitychange",pauseAmbient);
 window.addEventListener("pagehide",()=>{if(animation)animation.cancel()},{once:true});
})();
