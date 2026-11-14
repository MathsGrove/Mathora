/* MathsGrove welcome-first guided entry. Marketing routing only; no accounts or data access. */
(()=>{
 "use strict";
 const links=[...document.querySelectorAll("[data-mg8-route]")];
 if(!links.length)return;
 const reduce=()=>Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
 const allowed={
  student:{caseKey:"growth",viewRole:"student"},
  parent:{caseKey:"eleven",viewRole:"parent"},
  tutor:{caseKey:"stretch",viewRole:"tutor"}
 };
 for(const link of links){
  link.addEventListener("click",event=>{
   const role=link.dataset.mg8Route;
   const scenario=allowed[role];
   const destination=document.getElementById("dashboards");
   if(!scenario||!destination)return;
   event.preventDefault();
   const tour=window.MathsGroveShowcase;
   if(tour&&typeof tour.select==="function"){
    tour.select(scenario);
   }else{
    // Graceful fallback when the existing product tour is temporarily unavailable.
    document.querySelector('[data-mg5-case="'+scenario.caseKey+'"]')?.click();
    document.querySelector('[data-mg5-role="'+scenario.viewRole+'"]')?.click();
   }
   if(window.MathsGroveMotion?.navigateHash?.("#dashboards",{replace:true}))return;
   if(window.history?.replaceState)window.history.replaceState(null,"","#dashboards");
   destination.focus?.({preventScroll:true});
   destination.scrollIntoView({behavior:reduce()?"auto":"smooth",block:"start"});
  });
 }
})();
