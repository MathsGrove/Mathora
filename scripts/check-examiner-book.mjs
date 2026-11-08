import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const home=read('index.html'),specimen=read('report-pages.html'),script=read('examiner-report-book.js'),style=read('examiner-report-book.css'),deploy=read('.github/workflows/pages.yml');
const ids=[...home.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'Homepage must not contain duplicate IDs');
assert.ok(home.includes('href="./report.html"')&&read('report.html').includes('href="./examiner-report-book.css"'),'Homepage must link to separate Signature reader');
assert.ok(home.includes('href="#signature-sample"'),'Site navigation must link to specimen');
assert.ok(specimen.includes('id="mg7-book"')&&!home.includes('id="mg7-book"'),'Seven-page source must be separate from homepage HTML');
assert.ok(home.includes('mg7-legacy-comparison'),'Programme-specific report comparisons must remain available');
assert.ok(deploy.split('\n').some(line => /^\s*cp\s+/.test(line) && line.includes('examiner-report-book.css') && line.includes('examiner-report-book.js') && /\s+site\/\s*$/.test(line)),'Deploy must include flipbook assets');
assert.ok(deploy.includes('node --check examiner-report-book.js'),'CI must parse flipbook script');
assert.ok(style.includes('@media print')&&style.includes('body.mg-site main > :not(.mg-v3)'),'Printing must isolate the report');
assert.ok(style.includes('prefers-reduced-motion:reduce'),'Page turns must respect reduced-motion preference');
for(const key of ['ArrowRight','ArrowLeft','touchstart','touchend','aria-current','window.print'])assert.ok(script.includes(key),'Missing reader control '+key);
for(const term of ['not an official','fictional','43 / 60','10 / 10','2 / 10','four-week','centre is twice'])assert.ok(specimen.toLowerCase().includes(term.toLowerCase()),'Report content missing '+term);
const pages=[...specimen.matchAll(/<article class="mg7-page[^"]*" data-mg7-page="(\d+)"[^>]*>/g)].map(m=>+m[1]);
const pageTabs=[...specimen.matchAll(/data-mg7-nav="(\d+)"/g)].map(m=>+m[1]);
assert.deepEqual(pages,[0,1,2,3,4,5,6],'Report must contain seven ordered pages');
assert.deepEqual(pageTabs,[0,1,2,3,4,5,6],'Reader must contain seven ordered navigation buttons');
const rows=[...specimen.matchAll(/<tr data-mg7-question="(\d+)" data-mg7-topic="([^"]+)" data-mg7-awarded="(\d+)" data-mg7-available="(\d+)"/g)].map(m=>({q:+m[1],topic:m[2],earned:+m[3],possible:+m[4]}));
assert.equal(rows.length,10,'Sample assessment needs ten marked questions');
assert.deepEqual(rows.map(r=>r.q),[1,2,3,4,5,6,7,8,9,10]);
const awarded=rows.reduce((a,r)=>a+r.earned,0),possible=rows.reduce((a,r)=>a+r.possible,0);
assert.equal(awarded,43,'Question scores must reconcile to 43');
assert.equal(possible,60,'Maximum marks must reconcile to 60');
assert.equal(Math.round(awarded/possible*100),72,'Percentage must round to 72');
assert.equal(rows.filter(r=>r.earned===r.possible).length,2,'Full-mark items must reconcile');
assert.ok(rows.every(r=>r.earned>=0&&r.earned<=r.possible),'Item marks must be possible');
for(const [q,earned,possible] of [[5,2,6],[9,4,7]]){const row=rows.find(r=>r.q===q);assert.equal(row.earned,earned);assert.equal(row.possible,possible);}
const topics=new Map();
for(const row of rows){
 const state=topics.get(row.topic)||{earned:0,possible:0};
 state.earned+=row.earned;state.possible+=row.possible;topics.set(row.topic,state);
}
const summary=[...specimen.matchAll(/<div class="mg7-topic" data-mg7-topic-summary="([^"]+)"[^>]*><div class="mg7-topic-name">[^<]+<\/div><span class="mg7-topic-count">(\d+) \/ (\d+)<\/span>[\s\S]*?<span class="mg7-topic-pct">(\d+)%<\/span><\/div>/g)].map(m=>({topic:m[1],earned:+m[2],possible:+m[3],pct:+m[4]}));
assert.equal(summary.length,6,'Expect six topic summaries');
for(const s of summary){
 const expected=topics.get(s.topic);
 assert.ok(expected,'Summary topic missing from questions '+s.topic);
 assert.equal(s.earned,expected.earned,'Earned mark breakdown for '+s.topic);
 assert.equal(s.possible,expected.possible,'Available mark breakdown for '+s.topic);
 assert.equal(s.pct,Math.round(expected.earned/expected.possible*100),'Topic percentage for '+s.topic);
}
const allBtns=[0,1,2,3,4,5,6].map(i=>({index:i,attrs:{},listeners:{},setAttribute(n,v){this.attrs[n]=v},removeAttribute(n){delete this.attrs[n]},addEventListener(n,fn){this.listeners[n]=fn},click(){this.listeners.click?.()},classList:{add(){},remove(){}},disabled:false}));
const allPages=[0,1,2,3,4,5,6].map(i=>({hidden:i!==0,offsetWidth:100,classList:{add(){},remove(){}}}));
const buttons={prev:{listeners:{},addEventListener(n,fn){this.listeners[n]=fn},click(){this.listeners.click?.()},disabled:true},next:{listeners:{},addEventListener(n,fn){this.listeners[n]=fn},click(){this.listeners.click?.()},disabled:false}};
const nodes={
 'mg7-next':buttons.next,'mg7-prev':buttons.prev,'mg7-page-status':{textContent:''},
 'mg7-counter':{textContent:''},'mg7-progress-indicator':{style:{}},
 'mg7-print':{listeners:{},addEventListener(n,fn){this.listeners[n]=fn},click(){this.listeners.click?.()}},
 'mg7-book-top':{scrollIntoView(){}}
};
const surface={listeners:{},addEventListener(n,fn){this.listeners[n]=fn}};
const book={dataset:{},listeners:{},querySelectorAll(sel){if(sel==='[data-mg7-page]')return allPages;if(sel==='[data-mg7-nav]')return allBtns;return[]},querySelector(sel){return sel==='.mg7-paper-shadow'?surface:null},addEventListener(n,fn){this.listeners[n]=fn}};
nodes['mg7-book']=book;
const document={getElementById:id=>nodes[id]||null};
const window={matchMedia:()=>({matches:true}),printed:0,print(){this.printed++}};
new Function('document','window',script)(document,window);
assert.equal(book.dataset.enhanced,'true');
assert.equal(allPages.filter(p=>!p.hidden).length,1);
assert.equal(allBtns[0].attrs['aria-current'],'page');
assert.equal(buttons.prev.disabled,true);
buttons.next.click();
assert.equal(allPages[1].hidden,false,'Next should show second page');
assert.equal(buttons.prev.disabled,false);
allBtns[6].click();
assert.equal(buttons.next.disabled,true,'Last page should disable next');
assert.equal(allPages[6].hidden,false);
buttons.prev.click();
assert.equal(allPages[5].hidden,false,'Previous should show prior page');
let prevented=false;
book.listeners.keydown({key:'ArrowLeft',target:{tagName:'BUTTON',isContentEditable:false},preventDefault(){prevented=true},altKey:false,ctrlKey:false,metaKey:false});
assert.ok(prevented&&allPages[4].hidden===false,'ArrowLeft should navigate accessible pages');
surface.listeners.touchstart({touches:[{clientX:220,clientY:50}]});
surface.listeners.touchend({changedTouches:[{clientX:80,clientY:53}]});
assert.equal(allPages[5].hidden,false,'Swipe left should advance');
nodes['mg7-print'].click();
assert.equal(window.printed,1,'Print control should trigger browser printing');
console.log('Signature examiner report: seven pages, 10 marked questions, topic totals, safe scores, reader controls, printing and deployment: OK');
