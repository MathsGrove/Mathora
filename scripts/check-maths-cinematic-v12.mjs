import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(p,'utf8');
const home=read('index.html');
const report=read('report.html');
const reasoning=read('reasoning-demo.html');
const css=read('maths-cinematic-v12.css');
const js=read('maths-cinematic-v12.js');
const welcome=read('welcome-experience-v8.js');
const tour=read('marketing-experience-v5.js');
const programme=read('showcase-v3.js');
const examiner=read('experience-v4.js');
const pages=read('.github/workflows/pages.yml');
const browser=read('.github/workflows/browser-smoke.yml');
const ids=[...home.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size,'Homepage IDs remain unique');
assert.ok(home.includes('id="mg12-passage"')&&!home.includes('id="mg11-passage"'),'New gallery replaces the abrupt overlay');
assert.ok(home.includes('maths-cinematic-v12.css')&&home.includes('maths-cinematic-v12.js'),'Homepage loads constellation');
assert.ok(!home.includes('src="./maths-cinematic-v11.js"'),'Do not double-intercept navigation');
assert.ok(home.includes('Caveat:wght@400;600'),'Handwriting font is available with fallback');
assert.ok(report.includes('maths-cinematic-v12.css')&&reasoning.includes('maths-cinematic-v12.css'),'Page entrances carry the design language');
assert.equal((home.match(/class="mg12-symbol"/g)||[]).length,28,'28 deterministic formula stars, no randomized runtime DOM');
assert.equal((home.match(/class="mg11-atmosphere mg11-/g)||[]).length,5,'Five existing anchored mathematical backgrounds remain');
assert.ok(home.includes('x² − 5x + 6 = 0')&&home.includes('(x − 2)(x − 3) = 0')&&home.includes('x = 2 or x = 3'),'Handwritten sample is mathematically correct');
assert.ok(js.includes('3(x + 4) = 27')&&js.includes('x + 4 = 9')&&js.includes('x = 5'),'Algebra solution on reasoning navigation is correct');
assert.ok(js.includes('theme')&&welcome.includes('theme:role')&&tour.includes('theme:role'),'Student/parent/tutor routes use distinct scenes');
assert.ok(programme.includes('MathsGroveMotion?.navigateHash')&&examiner.includes('MathsGroveMotion?.navigateHash'),'Existing buttons preserve native fallbacks');
for(const selector of ['.mg12-symbol','.mg12-orbit','.mg12-hand-line','.mg12-scene-formula','.mg12-galaxy-trace'])assert.ok(css.includes(selector),'Missing constellation layer '+selector);
for(const required of ['prefers-reduced-motion:reduce','@media(max-width:720px)','@media print'])assert.ok(css.includes(required),'Mobile/reduced-motion/print safeguards');
assert.ok(js.includes('navigator.connection?.saveData')&&js.includes('document.visibilityState'),'Respect power and data savings');
assert.ok(js.includes('event.metaKey||event.ctrlKey||event.shiftKey||event.altKey'),'Preserve modified link navigation');
assert.ok(!/setInterval|setTimeout|requestAnimationFrame|addEventListener\(["']scroll/.test(js),'No persistent JS motion loop or arbitrary delay');
assert.ok(pages.includes('node --check maths-cinematic-v12.js')&&pages.includes('node scripts/check-maths-cinematic-v12.mjs'),'Publish gate checks v12');
assert.ok(pages.includes('maths-cinematic-v11.css maths-cinematic-v12.css maths-cinematic-v12.js site/'),'Ship backgrounds and new constellation files');
assert.ok(!pages.includes('maths-cinematic-v11.js site/'),'Do not ship previous controller');
assert.ok(browser.includes('node scripts/check-maths-cinematic-v12.mjs'),'Browser QA includes constellation checks');

const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup({mobile=false}={}){
 const animations=[],changed=[],bgClasses=new Set(),bodyClasses=new Set(),listeners={};
 let cancels=0;
 const fields={
  '.mg12-scene-kicker':{textContent:''},
  '.mg12-scene-formula':{textContent:''},
  '.mg12-scene-subtitle':{textContent:''}
 };
 const lines=Array.from({length:3},()=>({textContent:''}));
 const passage={
  hidden:true,dataset:{},classList:{add:()=>{},remove:()=>{}},
  querySelector:key=>fields[key],
  querySelectorAll:key=>key==='.mg12-hand-line'?lines:[],
  get offsetWidth(){return 1},
  animate(_frames,opts){animations.push(opts.duration);return {finished:Promise.resolve(),cancel(){cancels++}}}
 };
 const targets=Object.fromEntries(['services','signature-sample','dashboards','interactive-sample'].map(key=>[key,{
  scrollIntoView(){changed.push('scroll:'+key)},hasAttribute:()=>true,
  focus(){changed.push('focus:'+key)},classList:{add:()=>{},remove:()=>{}},get offsetWidth(){return 1}
 }]));
 const atmosphere={classList:{toggle:(key,on)=>on?bgClasses.add(key):bgClasses.delete(key),remove:key=>bgClasses.delete(key)}};
 const document={
  visibilityState:'visible',
  body:{classList:{add:key=>bodyClasses.add(key),remove:key=>bodyClasses.delete(key)}},
  getElementById:key=>key==='mg12-passage'?passage:targets[key]||null,
  querySelectorAll:key=>key==='.mg11-atmosphere'?[atmosphere]:[],
  addEventListener:(name,fn)=>{listeners[name]=fn}
 };
 let reduce=false,saveData=false;
 const history=[];
 const pagesOpened=[];
 const window={
  IntersectionObserver:true,
  matchMedia:query=>query.includes('max-width')?{matches:mobile}:{get matches(){return reduce},addEventListener(){}},
  history:{pushState:(_a,_b,url)=>history.push(url),replaceState:(_a,_b,url)=>history.push('replace:'+url)},
  location:{assign:url=>pagesOpened.push(url)}
 };
 const navigator={connection:{get saveData(){return saveData}}};
 class IntersectionObserver{
  constructor(fn){this.callback=fn;IntersectionObserver.last=this}
  observe(node){changed.push('observe')}
 }
 new Function('document','window','navigator','IntersectionObserver',js)(document,window,navigator,IntersectionObserver);
 return {window,document,navigator,passage,fields,lines,animations,history,changed,bgClasses,bodyClasses,listeners,pagesOpened,
  setReduced:v=>reduce=v,setSaveData:v=>saveData=v,get cancels(){return cancels},observer:IntersectionObserver.last};
}
const t=setup();
assert.ok(t.window.MathsGroveMotion,'Exports a safe navigation API');
assert.equal(t.changed.filter(x=>x==='observe').length,1,'Observe scenic background once');
t.observer.callback([{target:{classList:{toggle:(name,yes)=>yes?t.bgClasses.add(name):t.bgClasses.delete(name)}},isIntersecting:true}]);
assert.ok(t.bgClasses.has('mg11-visible'),'Background becomes visible only while on screen');
assert.equal(t.window.MathsGroveMotion.navigateHash('#not-found'),false,'Unknown anchors retain native behavior');
assert.equal(t.window.MathsGroveMotion.navigateHash('#services'),true);
assert.equal(t.passage.hidden,false,'Premium scene becomes visible');
assert.equal(t.passage.dataset.scene,'programmes','Programme CTA shows flowing maths scene');
await tick();
assert.deepEqual(t.animations,[440,650,550],'Desktop timings: 440ms reveal, 650ms mathematics, 550ms unveiling');
assert.deepEqual(t.history,['#services'],'Destination changes once during scene');
assert.equal(t.passage.hidden,true,'Scene completely clears after navigation');
assert.equal(t.cancels,3,'Finished Web Animations are released');
assert.ok(!t.bodyClasses.has('mg12-transitioning'),'Ambient animation restores after destination');
t.window.MathsGroveMotion.navigateHash('#dashboards',{replace:true,theme:'parent'});
assert.equal(t.passage.dataset.scene,'parent','Parent view uses its own constellation');
assert.match(t.fields['.mg12-scene-formula'].textContent,/confidence/);
await tick();
assert.ok(t.history.includes('replace:#dashboards'),'Guided role navigation keeps replace state');
t.window.MathsGroveMotion.navigateReport('/report.html');
assert.equal(t.passage.dataset.scene,'report','Examiner booklet has method-mark scene');
assert.deepEqual(t.lines.map(n=>n.textContent),['x² − 5x + 6 = 0','(x − 2)(x − 3) = 0','x = 2 or x = 3']);
await tick();
assert.deepEqual(t.pagesOpened,['/report.html'],'Full report opens once');
const before=t.animations.length;
t.setReduced(true);
t.window.MathsGroveMotion.navigateHash('#services',{replace:true});
assert.equal(t.animations.length,before,'Reduced motion skips cinematic phases');
assert.ok(t.history.includes('replace:#services'),'Reduced motion still navigates');
t.setReduced(false);t.setSaveData(true);
t.window.MathsGroveMotion.navigateReport('/report.html?light=1');
assert.deepEqual(t.pagesOpened,['/report.html','/report.html?light=1'],'Save-Data skips animation but preserves navigation');
const mobile=setup({mobile:true});
mobile.window.MathsGroveMotion.navigateHash('#interactive-sample');
await tick();
assert.deepEqual(mobile.animations,[330,480,440],'Phone timings: 330/480/440 ms');
assert.equal(mobile.passage.dataset.scene,'practice');
console.log('MathsGrove v12: 28 formula stars; five backgrounds; 1.64s desktop / 1.25s mobile; correct handwritten maths; role, report, reduced-motion and Save-Data navigation: OK');
