import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(p,'utf8');
const home=read('index.html');
const report=read('report.html');
const css=read('maths-cinematic-v11.css');
const js=read('maths-cinematic-v11.js');
const welcome=read('welcome-experience-v8.js');
const programme=read('showcase-v3.js');
const examiner=read('experience-v4.js');
const workflow=read('.github/workflows/pages.yml');
const browser=read('.github/workflows/browser-smoke.yml');
const ids=[...home.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size,'No duplicate homepage IDs');
assert.ok(home.includes('maths-cinematic-v11.css')&&home.includes('maths-cinematic-v11.js'),'Load connected math scene');
assert.ok(report.includes('maths-cinematic-v11.css'),'Full examiner report keeps the arrival design');
assert.ok(!home.includes('mg10-math-section')&&!home.includes('id="maths-in-motion"'),'Remove disconnected standalone graph section');
assert.ok(!home.includes('maths-in-motion-v10.css')&&!home.includes('maths-in-motion-v10.js'),'Retired scene must not load');
for(const item of ['hero','role','sig','programme','report'])assert.ok(home.includes('mg11-'+item+'-atmosphere'),'Missing integrated math background '+item);
for(const id of ['services','signature-sample','signature-discovery','dashboards','choose-your-view','mg11-passage']){
 assert.ok(ids.includes(id),'Destination or transition layer missing '+id);
}
for(const text of ['mg11-passage-equation','mg11-passage-trace','aria-hidden="true" hidden'])assert.ok(home.includes(text),'Cinematic canvas should be decorative and initially hidden');
assert.ok(css.includes('prefers-reduced-motion:reduce')&&css.includes('@media(max-width:820px)')&&css.includes('@media print'),'Accessibility, mobile and print styles required');
assert.ok(css.includes('mg11-atmosphere.mg11-visible svg'),'Only visible background should animate');
assert.ok(!/setInterval|requestAnimationFrame|addEventListener\(["']scroll/.test(js),'No continuous JavaScript render or scroll loop');
assert.ok(js.includes('navigator.connection?.saveData'),'Respect device data conservation');
assert.ok(js.includes('event.metaKey||event.ctrlKey||event.shiftKey||event.altKey'),'Preserve modified navigation');
assert.ok(js.includes('href!=="#main-content"'),'Accessible skip link must stay immediate');
assert.ok(welcome.includes('MathsGroveMotion?.navigateHash'),'Role selection is connected');
assert.ok(programme.includes('MathsGroveMotion?.navigateHash'),'Programme card buttons are connected');
assert.ok(examiner.includes('MathsGroveMotion?.navigateHash'),'Signature booklet button is connected');
assert.ok(workflow.includes('node scripts/check-maths-cinematic-v11.mjs')&&workflow.includes('maths-cinematic-v11.js site/'),'Curated Pages checks and includes new assets');
assert.ok(browser.includes('node scripts/check-maths-cinematic-v11.mjs'),'PR QA runs new motion checks');
assert.ok(!workflow.includes('maths-in-motion-v10.js'),'Retired files not shipped');

const classes=new Set();
const atmosphere={classList:{toggle:(name,flag)=>flag?classes.add(name):classes.delete(name),remove:name=>classes.delete(name)}};
const overlays={};
for(const name of ['.mg11-passage-index','.mg11-passage-equation','.mg11-passage-caption'])overlays[name]={textContent:''};
let durations=[],cancellations=0;
const passage={
 hidden:true,dataset:{},classList:{add:()=>{},remove:()=>{}},
 querySelector:name=>overlays[name],
 animate:(_frames,options)=>{durations.push(options.duration);return {finished:Promise.resolve(),cancel:()=>cancellations++}},
 get offsetWidth(){return 1}
};
let targetScrolled=0,focused=0;
const target={scrollIntoView:()=>targetScrolled++,hasAttribute:()=>true,focus:()=>focused++,classList:{add:()=>{},remove:()=>{}},get offsetWidth(){return 1}};
const allIds=['services','signature-sample','dashboards','learning-journey'];
let handler,observerCall,observerTargets=[];
const document={
 getElementById:id=>id==='mg11-passage'?passage:allIds.includes(id)?target:null,
 querySelectorAll:selector=>selector==='.mg11-atmosphere'?[atmosphere]:[],
 addEventListener:(name,cb)=>{if(name==='click')handler=cb}
};
const historyPaths=[];
const preference={matches:false,addEventListener:()=>{}};
const window={IntersectionObserver:true,matchMedia:()=>preference,history:{pushState:(_1,_2,url)=>historyPaths.push(url),replaceState:(_1,_2,url)=>historyPaths.push('replace:'+url)},location:{assign:()=>{}}};
class IntersectionObserver{
 constructor(fn){observerCall=fn}
 observe(node){observerTargets.push(node)}
}
new Function('document','window','navigator','IntersectionObserver',js)(document,window,{connection:{saveData:false}},IntersectionObserver);
assert.equal(observerTargets.length,1,'Observe one scenic layer without scroll events');
observerCall([{target:atmosphere,isIntersecting:true}]);
assert.ok(classes.has('mg11-visible'),'Scene moves only while visible');
observerCall([{target:atmosphere,isIntersecting:false}]);
assert.ok(!classes.has('mg11-visible'),'Scene pauses offscreen');
assert.equal(window.MathsGroveMotion.navigateHash('#does-not-exist'),false,'Unknown hash retains native navigation');
assert.equal(window.MathsGroveMotion.navigateHash('#services'),true,'Valid hash uses transition');
await Promise.resolve();await Promise.resolve();await Promise.resolve();await Promise.resolve();await Promise.resolve();await Promise.resolve();
assert.deepEqual(historyPaths,['#services'],'Transition must navigate at the covered midpoint');
assert.equal(targetScrolled,1,'Target must be reached once');
assert.equal(focused,1,'Accessible destination focus should be restored');
assert.deepEqual(durations,[215,250],'Passage should be brief and finite');
assert.equal(cancellations,2,'Web Animations should be released after each scene');
assert.equal(passage.hidden,true,'Overlay should disappear after navigation');
assert.match(overlays['.mg11-passage-caption'].textContent,/programmes/i);
const event={defaultPrevented:false,button:0,metaKey:false,ctrlKey:false,shiftKey:false,altKey:false,
 target:{closest:()=>({getAttribute:()=>"#signature-sample",hasAttribute:()=>false,target:''})},preventDefault(){this.defaultPrevented=true}};
handler(event);
assert.equal(event.defaultPrevented,true,'Ordinary report hash clicks trigger cinematic navigation');
await Promise.resolve();await Promise.resolve();await Promise.resolve();await Promise.resolve();await Promise.resolve();
assert.ok(historyPaths.includes('#signature-sample'),'Examiner booklet must reach the intended anchor');
const skip={...event,defaultPrevented:false,target:{closest:()=>({getAttribute:()=>"#main-content",hasAttribute:()=>false,target:''})},preventDefault(){this.defaultPrevented=true}};
handler(skip);
assert.equal(skip.defaultPrevented,false,'Skip link must not be intercepted');
preference.matches=true;
window.MathsGroveMotion.navigateHash('#dashboards',{replace:true});
assert.ok(historyPaths.includes('replace:#dashboards'),'Reduced motion must immediately navigate');
console.log('Connected Maths v11: five backgrounds, graph removal, 450ms navigation, pages, keyboard, reduced motion and CI: OK');
