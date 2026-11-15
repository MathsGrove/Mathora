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

 // Seven mathematical line compositions: quiet, original geometry, not a
 // score forecast or a second copy of the learner's exam responses.
 const motionScenes=[
  {name:'orbits',paths:['M0 59 C117 3 178 13 303 49 S506 76 660 8','M0 70 Q155 -28 322 56 T660 20','M110 73 C233 9 385 5 539 71'],dots:[[94,32],[360,30],[555,57]]},
  {name:'proportions',paths:['M0 61 H660','M30 64 C152 13 285 12 366 55 S548 72 643 14','M109 72 L216 18 L318 72 L428 18 L535 72'],dots:[[216,18],[428,18],[535,72]]},
  {name:'curves',paths:['M3 49 C87 11 144 11 204 49 S325 86 391 49 S523 12 654 49','M0 74 H660','M92 79 V7 M316 79 V7 M536 79 V7'],dots:[[204,49],[391,49],[536,26]]},
  {name:'reasoning',paths:['M5 58 H91 V46 H176 V34 H260 V22 H344 V10 H657','M0 75 H658','M73 14 L178 38 L293 18 L413 48 L537 12 L655 39'],dots:[[91,46],[260,22],[537,12]]},
  {name:'geometry',paths:['M203 9 A32 32 0 1 1 202.9 9','M203 41 L171 41 M203 41 L230 24 M203 41 L215 72','M0 68 C112 11 291 10 405 68 S565 13 660 51'],dots:[[203,41],[230,24],[215,72]]},
  {name:'four-steps',paths:['M0 69 H94 V54 H227 V39 H360 V24 H493 V9 H660','M21 76 C125 72 190 50 290 46 S487 13 643 7','M0 80 H660'],dots:[[94,54],[227,39],[360,24],[493,9]]},
  {name:'connections',paths:['M0 61 C126 13 189 13 300 61 S519 87 659 7','M93 55 L274 17 L470 56 L588 18','M6 77 H656'],dots:[[93,55],[274,17],[470,56],[588,18]]}
 ];
 const decorateMathematics=reportPages=>{
  const ns='http://www.w3.org/2000/svg';
  reportPages.forEach((page,i)=>{
   const scene=motionScenes[i],body=page.querySelector('.mg7-page-body');
   if(!scene||!body)return;
   const ribbon=document.createElement('div');
   ribbon.className='mgr17-ribbon';ribbon.setAttribute('aria-hidden','true');
   const svg=document.createElementNS(ns,'svg');
   svg.setAttribute('viewBox','0 0 660 84');
   svg.setAttribute('preserveAspectRatio','none');
   svg.setAttribute('focusable','false');
   scene.paths.forEach(d=>{
    const path=document.createElementNS(ns,'path');
    path.setAttribute('d',d);svg.append(path);
   });
   scene.dots.forEach(([cx,cy])=>{
    const circle=document.createElementNS(ns,'circle');
    circle.setAttribute('cx',String(cx));circle.setAttribute('cy',String(cy));
    circle.setAttribute('r','3');svg.append(circle);
   });
   ribbon.append(svg);
   page.insertBefore(ribbon,body);
   page.dataset.mgr17Scene=scene.name;
  });
  if(!reduce()&&!navigator.connection?.saveData)
   document.body.classList.add('mgr17-motion-ready');
  const outro=document.querySelector('.mgr17-outro');
  if(outro){
   if('IntersectionObserver' in window){
    const outroObserver=new IntersectionObserver(entries=>{
     if(entries.some(entry=>entry.isIntersecting)){
      outro.classList.add('mgr17-seen');outroObserver.disconnect();
     }
    },{threshold:.06});
    outroObserver.observe(outro);
   }else outro.classList.add('mgr17-seen');
  }
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
  pages[n].classList.add('mgr16-page-seen','mgr17-seen');
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
  try{decorateMathematics(pages)}catch(_error){/* Report remains fully readable without decoration. */}
  setActive(0);
  prev.addEventListener('click',()=>go(current-1));
  next.addEventListener('click',()=>go(current+1));
  select.addEventListener('change',()=>go(Number(select.value)-1));
  chapters.forEach(button=>button.addEventListener('click',()=>go(Number(button.dataset.mgrPage)-1)));
  $('mgr-print').addEventListener('click',()=>window.print());
  if('IntersectionObserver' in window){
   observer=new IntersectionObserver(entries=>{
    const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
    visible.forEach(entry=>entry.target.classList.add('mgr16-page-seen','mgr17-seen'));
    if(visible.length){const i=pages.indexOf(visible[0].target);if(i>=0)setActive(i)}
   },{rootMargin:'-13% 0px -32% 0px',threshold:[0,.1,.25,.5,.75]});
   pages.forEach(page=>observer.observe(page));
  }else pages.forEach(page=>page.classList.add('mgr16-page-seen','mgr17-seen'));
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
