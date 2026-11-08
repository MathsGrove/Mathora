/* Public MathsGrove Signature report viewer.
 * Reuses the fictional seven-page specimen already authored on the homepage,
 * so the two presentations never silently diverge. No learner API calls. */
(async()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const root=$('mgr-pages'),status=$('mgr-status'),prev=$('mgr-prev'),next=$('mgr-next'),select=$('mgr-select');
 const labels=['Cover','Executive summary','Topic analysis','Question review','Examiner annotations','Four-week action plan','Family and tutor guidance'];
 let pages=[],current=0,observer=null;
 const reduce=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const setActive=index=>{
  if(!pages.length)return;
  current=Math.max(0,Math.min(pages.length-1,index));
  select.value=String(current+1);
  prev.disabled=current===0;next.disabled=current===pages.length-1;
  status.textContent='Page '+(current+1)+' of '+pages.length+' · '+labels[current];
 };
 const go=index=>{
  if(!pages.length)return;
  const n=Math.max(0,Math.min(pages.length-1,index));
  setActive(n);
  pages[n].scrollIntoView({behavior:reduce()?'auto':'smooth',block:'start'});
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
  pages=[...root.querySelectorAll('.mg7-page')];
  setActive(0);
  prev.addEventListener('click',()=>go(current-1));
  next.addEventListener('click',()=>go(current+1));
  select.addEventListener('change',()=>go(Number(select.value)-1));
  $('mgr-print').addEventListener('click',()=>window.print());
  if('IntersectionObserver' in window){
   observer=new IntersectionObserver(entries=>{
    const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
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
