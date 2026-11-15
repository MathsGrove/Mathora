/* Public MathsGrove Signature report viewer.
 * Reuses the fictional seven-page specimen already authored on the homepage,
 * so the two presentations never silently diverge. No learner API calls. */
(async()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const root=$('mgr-pages'),status=$('mgr-status'),prev=$('mgr-prev'),next=$('mgr-next'),select=$('mgr-select');
 const chapters=[...document.querySelectorAll('[data-mgr-page]')],progress=$('mgr-progress-fill');

 // Build the animated reader summary only from the canonical ten marked rows.
 // This is public fictional evidence, not a student data request or prediction.
 const overview=$('mgr16-insights');
 const prepareOverview=sourceDoc=>{
  if(!overview)return;
  const rows=[...sourceDoc.querySelectorAll('[data-mg7-question][data-mg7-awarded][data-mg7-available]')].map(row=>({
   question:Number(row.dataset.mg7Question),
   awarded:Number(row.dataset.mg7Awarded),
   available:Number(row.dataset.mg7Available)
  })).filter(r=>Number.isSafeInteger(r.question)&&Number.isSafeInteger(r.awarded)&&
   Number.isSafeInteger(r.available)&&r.available>0&&r.awarded>=0&&r.awarded<=r.available);
  if(rows.length!==10||new Set(rows.map(r=>r.question)).size!==10)return;
  const awarded=rows.reduce((sum,row)=>sum+row.awarded,0);
  const available=rows.reduce((sum,row)=>sum+row.available,0);
  const perfect=rows.filter(row=>row.awarded===row.available).length;
  const rounded=Math.round(100*awarded/available);
  const percent=$('mgr16-score-percent'),total=$('mgr16-score-total'),questions=$('mgr16-count-questions');
  const full=$('mgr16-count-full'),graph=$('mgr16-question-bars');
  const bars=document.createDocumentFragment();
  rows.forEach((record,i)=>{
   const column=document.createElement('span');
   column.className='mgr16-q';
   const track=document.createElement('span');
   track.className='mgr16-q-track';
   const fill=document.createElement('span');
   fill.className='mgr16-q-fill';
   fill.style.setProperty('--mgr16-bar',String(Math.round(100*record.awarded/record.available)));
   fill.style.setProperty('--mgr16-delay',String(i));
   track.append(fill);
   const label=document.createElement('span');
   label.className='mgr16-q-label';label.textContent='Q'+record.question;
   column.append(track,label);bars.append(column);
  });
  graph.replaceChildren(bars);
  graph.setAttribute('aria-label','Fictional question results: '+rows.map(r=>
   'question '+r.question+', '+r.awarded+' out of '+r.available+' marks').join('; '));
  overview.style.setProperty('--mgr16-remaining',String(100-rounded));
  overview.hidden=false;
  let started=false;
  const paint=fraction=>{
   percent.textContent=Math.round(rounded*fraction)+'%';
   total.textContent=Math.round(awarded*fraction)+' / '+available;
   questions.textContent=Math.round(rows.length*fraction)+' / '+rows.length;
   full.textContent=Math.round(perfect*fraction)+' / '+rows.length;
  };
  paint(0);
  const play=()=>{
   if(started)return;
   started=true;
   if(reduce()||navigator.connection?.saveData||document.visibilityState==='hidden'||
      typeof requestAnimationFrame!=='function'){
    paint(1);overview.classList.add('mgr16-visible');return;
   }
   overview.classList.add('mgr16-motion-ready','mgr16-visible');
   let begun=null;
   const duration=920;
   const tick=now=>{
    if(!overview.isConnected)return;
    if(begun===null)begun=now;
    const t=Math.min(1,(now-begun)/duration);
    paint(1-Math.pow(1-t,3));
    if(t<1)requestAnimationFrame(tick);else paint(1);
   };
   requestAnimationFrame(tick);
  };
  if('IntersectionObserver' in window){
   const observer=new IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();play()}
   },{threshold:.08,rootMargin:'110px 0px 110px 0px'});
   observer.observe(overview);
  }else play();
 };
 const labels=['Cover','Executive summary','Topic analysis','Question review','Examiner annotations','Four-week action plan','Family and tutor guidance'];
 let pages=[],current=0,observer=null;
 const reduce=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const setActive=index=>{
  if(!pages.length)return;
  current=Math.max(0,Math.min(pages.length-1,index));
  select.value=String(current+1);
  prev.disabled=current===0;next.disabled=current===pages.length-1;
  status.textContent='Page '+(current+1)+' of '+pages.length+' · '+labels[current];
  pages.forEach((page,i)=>page.classList.toggle('mgr16-current-page',i===current));
  if(progress)progress.style.width=Math.round(100*(current+1)/pages.length)+'%';
  chapters.forEach(button=>{
   const chosen=Number(button.dataset.mgrPage)===current+1;
   if(chosen)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  });
 };
 const go=index=>{
  if(!pages.length)return;
  const n=Math.max(0,Math.min(pages.length-1,index));
  const adjacent=Math.abs(n-current)===1;
  setActive(n);
  pages[n].classList.add('mgr16-page-seen');
  pages[n].scrollIntoView({behavior:reduce()||!adjacent?'instant':'smooth',block:'start'});
  pages[n].focus({preventScroll:true});
  history.replaceState(null,'','#page-'+(n+1));
 };
 try{
  const response=await fetch('./report-pages.html',{cache:'no-store'});
  if(!response.ok)throw Error('Could not retrieve the original specimen');
  const documentCopy=new DOMParser().parseFromString(await response.text(),'text/html');
  const source=[...documentCopy.querySelectorAll('#mg7-book .mg7-pages [data-mg7-page]')];
  if(source.length!==7)throw Error('The seven specimen pages are unavailable');
  const fragment=document.createDocumentFragment();
  for(let i=0;i<source.length;i++){
   const page=document.importNode(source[i],true);
   page.hidden=false;
   page.removeAttribute('hidden');
   page.id='page-'+(i+1);
   page.tabIndex=-1;
   page.dataset.readerPage=String(i+1);
   page.setAttribute('aria-label','Page '+(i+1)+' of 7: '+labels[i]);
   fragment.append(page);
  }
  root.replaceChildren(fragment);
  try{prepareOverview(documentCopy)}catch(_error){if(overview)overview.hidden=true}
  pages=[...root.querySelectorAll('.mg7-page')];
  setActive(0);
  prev.addEventListener('click',()=>go(current-1));
  next.addEventListener('click',()=>go(current+1));
  select.addEventListener('change',()=>go(Number(select.value)-1));
  chapters.forEach(button=>button.addEventListener('click',()=>go(Number(button.dataset.mgrPage)-1)));
  $('mgr-print').addEventListener('click',()=>window.print());
  if('IntersectionObserver' in window){
   observer=new IntersectionObserver(entries=>{
    const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
    visible.forEach(entry=>entry.target.classList.add('mgr16-page-seen'));
    if(visible.length){const i=pages.indexOf(visible[0].target);if(i>=0)setActive(i)}
   },{rootMargin:'-13% 0px -32% 0px',threshold:[0,.1,.25,.5,.75]});
   pages.forEach(page=>observer.observe(page));
  }
  const direct=/^#page-([1-7])$/.exec(location.hash);
  if(direct){requestAnimationFrame(()=>go(Number(direct[1])-1))}
  document.addEventListener('keydown',event=>{
   if(event.altKey||event.ctrlKey||event.metaKey||/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(event.target?.tagName||''))return;
   if(event.key==='ArrowRight'&&current<pages.length-1){event.preventDefault();go(current+1)}
   else if(event.key==='ArrowLeft'&&current>0){event.preventDefault();go(current-1)}
  });
 }catch(err){
  root.replaceChildren();
  const message=document.createElement('p');
  message.className='mgr-error';message.textContent='The report could not be opened right now. Please return to the website and try again.';
  root.append(message);status.textContent='Specimen unavailable';
 }
})();
