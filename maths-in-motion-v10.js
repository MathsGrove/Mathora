/* One-shot, replayable, reduced-motion-safe public maths illustration. No accounts or data calls. */
(()=>{
  "use strict";
  const stage=document.getElementById("mg10-stage");
  if(!stage)return;
  const replay=document.getElementById("mg10-replay");
  const reduce=window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const play=()=>{
    if(reduce?.matches){stage.classList.remove("mg10-playing");return;}
    stage.classList.remove("mg10-playing");
    // Reading layout restarts the finite CSS keyframes when Replay is used.
    void stage.offsetWidth;
    stage.classList.add("mg10-playing");
  };
  if("IntersectionObserver" in window){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        observer.unobserve(entry.target);
        play();
      });
    },{threshold:0.28});
    observer.observe(stage);
  }else{
    play();
  }
  replay?.addEventListener("click",play);
  reduce?.addEventListener?.("change",event=>{
    if(event.matches)stage.classList.remove("mg10-playing");
  });
})();
