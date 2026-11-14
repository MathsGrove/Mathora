/* MathsGrove cinematic navigation v11.
   Scenic motifs pause offscreen. In-page destinations stay keyboard- and URL-accessible.
   No network requests, storage, persistent scroll handlers or client-side routing. */
(()=>{
 "use strict";
 const passage=document.getElementById("mg11-passage");
 const backgrounds=[...document.querySelectorAll(".mg11-atmosphere")];
 const preference=window.matchMedia?.("(prefers-reduced-motion: reduce)");
 const reduce=()=>Boolean(preference?.matches||navigator.connection?.saveData);
 const labels={
  services:["01 / THE LEARNING PATH","f(x)","Three programmes. One purpose."],
  "signature-sample":["02 / EXAMINER'S REPORT","∑ m","Every method mark tells a story."],
  "signature-discovery":["03 / SIGNATURE","Δ x","A closer look at the working."],
  signature:["04 / HUMAN JUDGEMENT","∴","From reasoning to a useful next step."],
  dashboards:["05 / YOUR PERSPECTIVE","x → y","See progress from a different angle."],
  "choose-your-view":["06 / THREE PERSPECTIVES","1 → 3","One learning journey. Three perspectives."],
  "learning-journey":["07 / INTERACTIVE DEMO","f(x)","The learner's story comes into focus."],
  "interactive-sample":["08 / TRY THE WORKING","x²","Think it through, step by step."],
  experience:["09 / THE METHOD","∫","Practice. Evidence. Recheck."],
  "how-it-works":["09 / THE METHOD","∫","Practice. Evidence. Recheck."],
  "report-page":["10 / EXAMINER BOOKLET","∑ m","Open the complete specimen."],
  top:["MATHSGROVE / HOME","π","Back to the big picture."]
 };
 let busy=false;
 let requested=null;
 const show=(label,action)=>{
   if(reduce()||!passage?.animate){action();return true;}
   requested={label,action};
   if(busy)return true;
   busy=true;
   const scene=()=>{
     const current=requested;
     if(!current){busy=false;return;}
     passage.dataset.scene=current.label==="report-page"?"report":"chapter";
     const [index,equation,caption]=labels[current.label]||labels.experience;
     passage.querySelector(".mg11-passage-index").textContent=index;
     passage.querySelector(".mg11-passage-equation").textContent=equation;
     passage.querySelector(".mg11-passage-caption").textContent=caption;
     passage.hidden=false;
     passage.classList.remove("mg11-active");
     void passage.offsetWidth;
     passage.classList.add("mg11-active");
     const into=passage.animate([{transform:"translateY(101%)"},{transform:"translateY(0)"}],{duration:215,easing:"cubic-bezier(.18,.75,.24,1)",fill:"forwards"});
     into.finished.then(()=>{
       into.cancel();
       const move=requested;requested=null;
       move?.action();
       const out=passage.animate([{transform:"translateY(0)"},{transform:"translateY(-101%)"}],{duration:250,easing:"cubic-bezier(.72,.09,.75,.18)",fill:"forwards"});
       return out.finished.then(()=>out.cancel());
     }).catch(()=>{const move=requested;requested=null;move?.action();}).finally(()=>{
       passage.classList.remove("mg11-active");
       passage.hidden=true;
       busy=false;
       if(requested)show(requested.label,requested.action);
     });
   };
   scene();return true;
 };
 const commitHash=(hash,target,replace)=>{
   if(replace)window.history.replaceState(null,"",hash);
   else window.history.pushState(null,"",hash);
   target.scrollIntoView({behavior:"auto",block:"start"});
   if(target.hasAttribute("tabindex"))target.focus?.({preventScroll:true});
   target.classList.remove("mg11-destination");
   // Restart a finite destination reveal without hiding page content.
   void target.offsetWidth;
   target.classList.add("mg11-destination");
 };
 const navigateHash=(hash,{replace=false}={})=>{
   if(typeof hash!=="string"||!/^#[A-Za-z][A-Za-z0-9-]*$/.test(hash))return false;
   const target=document.getElementById(hash.slice(1));
   if(!target)return false;
   const label=Object.prototype.hasOwnProperty.call(labels,hash.slice(1))?hash.slice(1):"experience";
   return show(label,()=>commitHash(hash,target,replace));
 };
 const navigateReport=(url)=>{
   if(typeof url!=="string"||!url)return false;
   return show("report-page",()=>window.location.assign(url));
 };
 window.MathsGroveMotion=Object.freeze({navigateHash,navigateReport});
 document.addEventListener("click",event=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const link=event.target.closest?.("a[href]");
   if(!link||link.target&&link.target!=="_self"||link.hasAttribute("download")||link.hasAttribute("data-mg11-direct")||link.closest("[data-mg8-route]"))return;
   const href=link.getAttribute("href");
   if(href?.startsWith("#")&&href!=="#main-content"&&document.getElementById(href.slice(1))){
     event.preventDefault();
     navigateHash(href);
   }else if(href==="./report.html"){
     event.preventDefault();
     navigateReport(link.href);
   }
 });
 if(!reduce()&&"IntersectionObserver" in window){
   const observer=new IntersectionObserver(entries=>{
     for(const entry of entries)entry.target.classList.toggle("mg11-visible",entry.isIntersecting);
   },{threshold:0.01,rootMargin:"90px 0px 90px 0px"});
   backgrounds.forEach(background=>observer.observe(background));
 }else{
   backgrounds.forEach(background=>background.classList.remove("mg11-visible"));
 }
 preference?.addEventListener?.("change",event=>{
   if(event.matches)backgrounds.forEach(background=>background.classList.remove("mg11-visible"));
 });
})();
