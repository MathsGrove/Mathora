/* MathsGrove private dashboards: decorative maths on real, existing controls.
 * Does not inspect learner records, alter business logic or make requests. */
(()=>{
 "use strict";
 const root=document.getElementById('dashboard-view')||document.getElementById('fa-dashboard');
 if(!root)return;
 const reduce=()=>Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||navigator.connection?.saveData||document.visibilityState==='hidden');
 const symbols=['π','∑','x²','Δ'];
 const selectors='button,select,[role="tab"]';
 let active=0;
 const spark=target=>{
  if(reduce()||active>=3||target.disabled)return;
  const box=target.getBoundingClientRect?.();
  if(!box||!box.width||!box.height)return;
  const wrap=document.createElement('span');
  wrap.className='mg14-private-trail';wrap.setAttribute('aria-hidden','true');
  wrap.style.left=(box.left+Math.min(box.width/2,110))+'px';
  wrap.style.top=(box.top+box.height/2)+'px';
  symbols.forEach((math,i)=>{
   const item=document.createElement('i');
   item.className='mg14-private-spark';item.textContent=math;
   item.style.setProperty('--n',String(i));wrap.append(item);
  });
  active++;
  wrap.addEventListener('animationend',event=>{
   if(event.target!==wrap)return;
   wrap.remove();active=Math.max(0,active-1);
  });
  document.body.append(wrap);
 };
 root.addEventListener('click',event=>{
  if(event.button!==0||event.defaultPrevented)return;
  const control=event.target.closest?.(selectors);
  if(!control||!root.contains(control))return;
  spark(control);
 });
 root.addEventListener('change',event=>{
  const select=event.target;
  if(select?.matches?.('select'))spark(select);
 });
})();
