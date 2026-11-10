(function(){
"use strict";
const button=document.getElementById("mobile-toggle"),nav=document.getElementById("primary-nav");
if(!button||!nav)return;
function setOpen(open){
 nav.classList.toggle("show",open);
 button.setAttribute("aria-expanded",String(open));
 button.setAttribute("aria-label",open?"Close navigation":"Open navigation");
 button.textContent=open?"✕":"☰";
}
function isOpen(){return button.getAttribute("aria-expanded")==="true"}
button.addEventListener("click",()=>setOpen(!isOpen()));
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>setOpen(false)));
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"&&isOpen()){
  setOpen(false);
  if(nav.contains(document.activeElement))button.focus();
 }
});
document.addEventListener("pointerdown",e=>{
 if(isOpen()&&!nav.contains(e.target)&&!button.contains(e.target))setOpen(false);
});
// Clear stale mobile disclosure state when the layout switches to desktop.
window.addEventListener("resize",()=>{
 if(window.matchMedia("(min-width: 721px)").matches&&isOpen())setOpen(false);
});
setOpen(false);
})();
