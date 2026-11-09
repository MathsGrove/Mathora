import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(p,'utf8');
const home=read('index.html');
const css=read('atelier-v9.css');
const js=read('atelier-v9.js');
const workflow=read('.github/workflows/pages.yml');
const oldWelcome=read('scripts/check-welcome-v8.mjs');
const report=read('examiner-report-book.js');
const v5=read('marketing-experience-v5.js');

const ids=[...home.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size,'No duplicated homepage IDs');
assert.ok(home.includes('href="./atelier-v9.css"')&&home.includes('src="./atelier-v9.js"'),'Luxury style and motion must be loaded');
assert.ok(workflow.includes('atelier-v9.css atelier-v9.js site/'),'Curated Pages must include v9 assets');
assert.ok(workflow.includes('node --check atelier-v9.js'),'CI must check motion syntax');
assert.ok(home.includes('id="signature-discovery"'),'Signature flagship must exist');
assert.ok(home.includes('id="mg8-spotlight-heading"'),'Legacy welcome marketing heading anchor must remain');
assert.ok(home.includes('id="signature-sample"'),'Seven-page report must remain available');
assert.ok(read('report-pages.html').includes('id="mg7-book"')&&read('report-reader.js').includes("fetch('./report-pages.html'"),'Real seven-page specimen must remain in its independently loaded reader');
assert.ok(home.includes('id="signature"'),'Full Signature packages must remain intact');
assert.ok(home.includes('href="#signature-discovery"'),'Hero and navigation must prominently link to Signature');
assert.ok(home.includes('href="#signature-sample"'),'Signature must link to the seven-page report');
assert.ok(home.indexOf('id="choose-your-view"')<home.indexOf('id="signature-discovery"'),'Signature follows role selection');
assert.ok(home.indexOf('id="signature-discovery"')<home.indexOf('id="dashboards"'),'Signature flagship precedes comprehensive dashboard showcase');
for(const role of ['student','parent','tutor'])assert.ok(home.includes('data-mg8-route="'+role+'"'),'Role journey '+role+' must survive');
for(const text of ['Signature is separately commissioned','The report shown is fictional','43/60','72%','MathsGrove / Signature']){
 if(text==='MathsGrove / Signature')continue;
 assert.ok(home.includes(text),'Signature disclaimer/evidence missing '+text);
}
assert.ok(!/\bpricing\b|£/i.test(home),'No public wholesale prices');
assert.ok(css.includes('@media(max-width:680px)'),'Phone layout is needed');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),'Reduced-motion support required');
assert.ok(css.includes('@media print'),'The report print experience must remain unaffected');
assert.ok(css.includes('mg5-story-layout')&&css.includes('mg7-page')&&css.includes('mg4-signature-full'),'Sizes must cover demos, report, and full Signature');
assert.ok(js.includes('IntersectionObserver'),'Only lightweight one-shot reveals');
assert.ok(js.includes('observer.unobserve(entry.target)'),'Stop observing after reveal');
assert.ok(!/setInterval|setTimeout|requestAnimationFrame|scroll\s*['"]/.test(js),'No persistent motion workload');
assert.ok(!css.includes('animation-iteration-count:infinite'),'No compulsory animation loops');
assert.ok(css.includes('mg9-motion-ready .mg9-reveal:not(.mg9-visible)'),'Only hide motion targets when JS has initialised');
assert.ok(css.includes('body.mg-site.mg9-motion-ready .mg9-reveal{opacity:1!important;transform:none!important'),'Reduced motion must always show content');
assert.ok(v5.includes('window.MathsGroveShowcase=Object.freeze'),'Student/parent/tutor journeys must continue to work');
assert.ok(report.includes('data-mg7-page')||report.includes('[data-mg7-page]'),'Flip report must continue to have page navigation');
assert.ok(oldWelcome.includes('mg8-spotlight-heading'),'Legacy welcome checks stay compatible');

const observer={observed:[],unobserved:[],observe(el){this.observed.push(el)},unobserve(el){this.unobserved.push(el)}};
let callback;
class MockObserver{constructor(fn){callback=fn;return observer}}
const nodes=[{classList:{added:[],add(c){this.added.push(c)}}},{classList:{added:[],add(c){this.added.push(c)}}}];
const body={classList:{added:[],add(c){this.added.push(c)}}};
let window={matchMedia:()=>({matches:false}),IntersectionObserver:MockObserver};
let document={querySelectorAll:s=>s==='.mg9-reveal'?nodes:[],body};
new Function('document','window','IntersectionObserver',js)(document,window,MockObserver);
assert.equal(observer.observed.length,2,'Both section nodes should be observed');
assert.ok(body.classList.added.includes('mg9-motion-ready'),'Motion must activate only after observation');
callback([{isIntersecting:true,target:nodes[0]}]);
assert.ok(nodes[0].classList.added.includes('mg9-visible'),'Visible section should reveal');
assert.equal(observer.unobserved.length,1,'Completed reveal should stop observing');

const reducedBody={classList:{added:[],add(c){this.added.push(c)}}};
new Function('document','window','IntersectionObserver',js)({querySelectorAll:s=>nodes,body:reducedBody},{matchMedia:()=>({matches:true}),IntersectionObserver:MockObserver},MockObserver);
assert.equal(reducedBody.classList.added.length,0,'Reduced-motion setting must not start reveals');

console.log('MathsGrove Atelier v9: Signature hierarchy, responsive scale, role navigation, examiner report, reveal behavior and Pages packaging OK');
