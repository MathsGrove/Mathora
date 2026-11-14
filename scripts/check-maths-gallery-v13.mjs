import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const get=p=>readFileSync(p,'utf8');
const home=get('index.html'),report=get('report.html'),reason=get('reasoning-demo.html');
const css=get('maths-gallery-v13.css'),polish=get('maths-refinement-v14.css'),js=get('maths-gallery-v13.js');
const workflow=get('.github/workflows/pages.yml');
const smoke=get('.github/workflows/browser-smoke.yml');
const showcase=get('showcase-v3.js'),calendar=get('experience-v4.js');
const ids=[...home.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'Homepage IDs must remain unique');
assert.ok(home.length<65000,'Gallery must preserve homepage performance budget');
assert.ok(home.includes('maths-gallery-v13.css')&&home.includes('maths-gallery-v13.js')&&home.includes('maths-refinement-v14.css'),'Homepage loads refined mathematical quote gallery');
assert.ok(!home.includes('id="mg12-passage"')&&!home.includes('src="./maths-cinematic-v12.js"'),'No duplicated old transition controller or static gallery');
assert.ok((home.match(/class="mg11-atmosphere mg11-/g)||[]).length===5,'Retain five integrated mathematical section backgrounds');
assert.ok(report.includes('maths-gallery-v13.css')&&report.includes('maths-gallery-v13.js'),'Full report gets shared gallery');
assert.ok(reason.includes('maths-gallery-v13.css')&&reason.includes('maths-gallery-v13.js'),'Reasoning demo gets shared gallery');
assert.ok(showcase.includes("MathsGroveMotion?.navigateHash?.('#'+b.dataset.nav"),'Dashboard navigation uses shared gallery');
assert.ok(calendar.includes("MathsGroveMotion?.navigateHash?.('#interactive-sample'"),'Calendar-to-practice uses shared gallery');
for(const token of ['mg13-passage','mg13-wall','mg13-tile','mg13-orbit','mg13-trails','mg14-maths-quote','mg13-number-trail','mg13-spark'])assert.ok(js.includes(token)&&(css.includes(token)||polish.includes(token)),'Missing gallery part '+token);
for(const token of ['prefers-reduced-motion:reduce','@media(max-width:820px)','@media(max-width:480px)','@media print'])assert.ok(css.includes(token),'Missing accessibility or responsive style '+token);
assert.ok(js.includes('navigator.connection?.saveData')&&js.includes('document.visibilityState'),'Data, battery and background preference respected');
assert.ok(js.includes('event.metaKey||event.ctrlKey||event.shiftKey||event.altKey'),'Modified links must remain native');
assert.ok(!/setInterval|setTimeout|requestAnimationFrame|addEventListener\(["']scroll/.test(js),'No continuous JavaScript animations or scroll work');
assert.ok(!/\bfetch\s*\(|createClient\s*\(|localStorage\s*\.|sessionStorage\s*\./.test(js),'No student data calls or persistent navigation tracking');
assert.ok(js.includes('Every mark has a reason worth exploring.')&&js.includes('Ask about the thinking, not only the score.'),'Transition must use original mathematical quotes');
assert.ok(!js.includes('mg13-hand-line')&&!js.includes('mg13-paper'),'No handwritten transition notes');
assert.ok(js.includes('Every step reveals another idea.')&&js.includes('Mathematics is a world of connections.'),'Reasoning and homepage quote cues required');
assert.ok(workflow.includes('node --check maths-gallery-v13.js')&&workflow.includes('node scripts/check-maths-gallery-v13.mjs'),'Deployment must validate new controller');
assert.ok(workflow.includes('maths-cinematic-v11.css maths-gallery-v13.css maths-gallery-v13.js site/'),'Deployment packages gallery and existing atmospheric backgrounds');
assert.ok(!workflow.includes('maths-cinematic-v12.js site/'),'Avoid deploying deprecated controller');
assert.ok(smoke.includes('node scripts/check-maths-gallery-v13.mjs'),'Real browser smoke must test the gallery');

const tick=()=>new Promise(resolve=>setImmediate(resolve));
function harness({mobile=false,reduced=false,saveData=false}={}){
 const values={reduced,saveData},events={},animations=[],pages=[],history=[],targets={},observers=[],nodes=[];
 const cls=()=>{const names=new Set();return{add:key=>names.add(key),remove:key=>names.delete(key),toggle:(key,on)=>on?names.add(key):names.delete(key),contains:key=>names.has(key)}};
 const createElement=(tag)=>{
  const attrs={},styleVals={};
  const item={
   tagName:tag.toUpperCase(),className:'',children:[],dataset:{},hidden:false,textContent:'',style:{setProperty:(key,value)=>styleVals[key]=value},
   classList:cls(),append(...children){this.children.push(...children)},
   setAttribute(key,val){attrs[key]=String(val)},hasAttribute:key=>Object.prototype.hasOwnProperty.call(attrs,key),
   get offsetWidth(){return 1},
   focus(){item.focused=true},scrollIntoView(){item.scrolled=(item.scrolled||0)+1},
   animate(_frames,settings){
    animations.push(settings.duration);
    return{finished:Promise.resolve(),cancel(){}};
   },
   getBoundingClientRect(){return {left:10,top:20,width:120,height:40}},
   addEventListener(name,callback){(item.events||={})[name]=callback},
   remove(){item.removed=true}
  };
  nodes.push(item);return item;
 };
 const body=createElement('body');
 const byId=id=>{if(id==='top')return body; if(['services','dashboards','pathways','signature-sample','interactive-sample'].includes(id))return targets[id]||(targets[id]=createElement('section'));return null};
 const doc={
  body,visibilityState:'visible',
  createElement,createElementNS:(_ns,tag)=>createElement(tag),
  getElementById:byId,querySelectorAll:key=>key==='.mg11-atmosphere'?[createElement('div')]:[],
  addEventListener(name,cb,capture){(events[name]||=[]).push({cb,capture:Boolean(capture)})}
 };
 const uri='https://mathsgrove.github.io/Mathora/index.html';
 const location={href:uri,pathname:'/Mathora/index.html',origin:'https://mathsgrove.github.io',assign:url=>pages.push(url)};
 const win={
  location,history:{pushState:(_a,_b,hash)=>history.push(hash),replaceState:(_a,_b,hash)=>history.push('replace:'+hash)},
  matchMedia:query=>query.includes('max-width')?{matches:mobile}:{get matches(){return values.reduced},addEventListener(){}},
  addEventListener() {},IntersectionObserver:true
 };
 const navigator={connection:{get saveData(){return values.saveData}}};
 class IntersectionObserver{
  constructor(callback){this.callback=callback}
  observe(node){observers.push(node)}
 }
 new Function('document','window','navigator','IntersectionObserver','URL',js)(doc,win,navigator,IntersectionObserver,URL);
 const stage=body.children.find(x=>x.id==='mg13-passage'); // DOM ID assignment is a native property.
 assert.ok(stage,'Gallery should be constructed at runtime');
 const recurse=(n,clsName)=>[...(n.className?.split(' ').includes(clsName)?[n]:[]),...(n.children||[]).flatMap(c=>recurse(c,clsName))];
 const dispatch=(name,event,capture=false)=>{for(const x of events[name]||[])if(x.capture===capture)x.cb(event)};
 return{doc,win,values,body,stage,history,pages,targets,animations,nodes,dispatch,find:clsName=>recurse(stage,clsName)};
}
const app=harness();
assert.equal(app.find('mg13-tile').length,24,'The number gallery is a 24-panel mathematical exhibition');
assert.equal(app.find('mg14-maths-quote').length,1,'Display one concise mathematics quote');
assert.equal(app.doc.body.children.length,1,'One hidden reusable gallery; no document markup inflation');
assert.equal(app.stage.hidden,true,'Gallery is hidden before navigation');
assert.equal(app.win.MathsGroveMotion.navigateHash('#unknown'),false,'Missing hashes fall back to native behavior');
assert.equal(app.win.MathsGroveMotion.navigateHash('#services'),true,'All established public anchors are covered');
assert.equal(app.stage.hidden,false,'Gallery opens immediately');
assert.equal(app.stage.dataset.scene,'programmes','Programme entrance has its own scene');
assert.equal(app.stage.dataset.mode,'major','Main destination uses full cinematic gallery');
await tick();
assert.deepEqual(app.animations,[490,420,590],'Smooth desktop phases should take 1.5 seconds');
assert.deepEqual(app.history,['#services'],'Destination is reached once');
assert.equal(app.targets.services.scrolled,1);
assert.equal(app.targets.services.focused,true,'Keyboard focus should follow the destination');
assert.equal(app.stage.hidden,true,'Gallery must clear when animation finishes');
app.win.MathsGroveMotion.navigateHash('#pathways');
assert.equal(app.stage.dataset.mode,'small','Secondary anchor uses a lighter passage');
await tick();
assert.deepEqual(app.animations.slice(3),[210,145,275],'Small chapters keep a brief 630ms passage');
app.win.MathsGroveMotion.navigateHash('#dashboards',{replace:true,theme:'parent'});
assert.equal(app.stage.dataset.scene,'people','Role-specific parent scene remains distinct');
await tick();
assert.ok(app.history.includes('replace:#dashboards'));
app.win.MathsGroveMotion.navigateReport('https://mathsgrove.github.io/Mathora/report.html');
assert.equal(app.stage.dataset.scene,'report');
assert.equal(app.find('mg14-maths-quote')[0].textContent,'See the thinking behind the mark.','Report transition uses a short quote, not handwritten working');
await tick();
assert.deepEqual(app.pages,['https://mathsgrove.github.io/Mathora/report.html']);
const linkEvent=href=>{
 let prevented=0;
 const link={href:new URL(href,app.win.location.href).href,target:'',hasAttribute:()=>false,closest:()=>null,getAttribute:key=>key==='href'?href:null};
 const event={defaultPrevented:false,button:0,metaKey:false,ctrlKey:false,shiftKey:false,altKey:false,
  target:{closest:selector=>selector==='a[href]'?link:null},preventDefault(){this.defaultPrevented=true;prevented++}};
 return{event,link,get prevented(){return prevented}};
};
const homeLink=linkEvent('#pathways');app.dispatch('click',homeLink.event);
assert.equal(homeLink.prevented,1,'All ordinary in-page links receive a passage');
await tick();
const external=linkEvent('https://example.org');app.dispatch('click',external.event);
assert.equal(external.prevented,0,'External links remain native');
const modified=linkEvent('./report.html');modified.event.ctrlKey=true;app.dispatch('click',modified.event);
assert.equal(modified.prevented,0,'Control-click remains native');
const skip=linkEvent('#main-content');app.dispatch('click',skip.event);
assert.equal(skip.prevented,0,'Skip link is never delayed');
const microButton={disabled:false,matches:()=>true,getBoundingClientRect:()=>({left:0,top:0,width:100,height:30})};
app.dispatch('click',{defaultPrevented:false,button:0,target:{closest:selector=>selector==='button'?microButton:null}},true);
assert.equal(app.body.children.filter(x=>x.className==='mg13-number-trail').length,1,'Small controls produce non-blocking number trails');
assert.equal(app.find('mg13-spark').length,0,'Number trails are independent of full gallery DOM');
const beforeReduced=app.animations.length;
app.values.reduced=true;app.win.MathsGroveMotion.navigateHash('#services',{replace:true});
assert.equal(app.animations.length,beforeReduced,'Reduced motion must bypass every animation');
assert.ok(app.history.includes('replace:#services'),'Reduced motion still reaches destination');
app.values.reduced=false;app.values.saveData=true;app.win.MathsGroveMotion.navigateReport('/Mathora/report.html');
assert.equal(app.pages.at(-1),'/Mathora/report.html','Save-Data must navigate immediately');
const mobileApp=harness({mobile:true});
mobileApp.win.MathsGroveMotion.navigateHash('#signature-sample');
await tick();
assert.deepEqual(mobileApp.animations,[350,330,480],'Mobile gallery is smooth at 1.16 seconds');
const quick=harness({mobile:true});
quick.win.MathsGroveMotion.navigateHash('#pathways');
await tick();
assert.deepEqual(quick.animations,[155,120,225],'Small mobile passages should take only 500ms');
console.log('MathsGrove gallery v13: 24 formula panels, maths quotes, public links, lightweight control trails, 1.5s desktop / 1.16s phone, data and motion safeguards: OK');
