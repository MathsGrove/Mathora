import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');
const home=read('index.html');
const css=read('maths-in-motion-v10.css');
const js=read('maths-in-motion-v10.js');
const workflow=read('.github/workflows/pages.yml');
const ids=[...home.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
assert.equal(new Set(ids).size,ids.length,'Homepage IDs must remain unique');
assert.ok(home.includes('href="./maths-in-motion-v10.css"'),'Motion stylesheet must load');
assert.ok(home.includes('src="./maths-in-motion-v10.js"'),'Motion controller must load');
assert.ok(home.includes('id="maths-in-motion"')&&home.includes('id="mg10-stage"'),'Dedicated mathematical stage must exist');
assert.ok(home.indexOf('id="hero-title"')<home.indexOf('id="maths-in-motion"'),'Scene must follow hero');
assert.ok(home.indexOf('id="maths-in-motion"')<home.indexOf('id="choose-your-view"'),'Scene must precede role entry');
assert.ok(home.includes('aria-label="Replay the quadratic graph animation"'),'Replay must have accessible name');
for(const text of ['y = (x − 2)² − 1','(2, −1)','x = 1','x = 3','No student data']){
 assert.ok(home.includes(text),'Math explanation or disclosure missing: '+text);
}
assert.ok(css.includes('@media(max-width:680px)'),'Phone layout must be tailored');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),'Reduced-motion preference must work');
assert.ok(!css.includes('infinite'),'Do not introduce compulsory animation loops');
assert.ok(!js.includes('setInterval')&&!js.includes('setTimeout')&&!js.includes('requestAnimationFrame'),'No perpetual motion work');
assert.ok(!/<video\b|autoplay/i.test(home.slice(home.indexOf('id="maths-in-motion"'),home.indexOf('id="choose-your-view"'))),'Avoid heavy video autoplay');
assert.ok(workflow.includes('node --check maths-in-motion-v10.js'),'CI must parse animation script');
assert.ok(workflow.includes('node scripts/check-maths-motion-v10.mjs'),'CI must test new scene');
assert.ok(workflow.split('\n').some(line=>/^\s*cp\s+/.test(line)&&line.includes('maths-in-motion-v10.css')&&line.includes('maths-in-motion-v10.js')&&/\s+site\/\s*$/.test(line)),'Curated public site must include both assets');

let listener,observed=null,unobserved=null;
const classes=new Set();
let reflows=0;
const stage={classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},get offsetWidth(){reflows++;return 1}};
const replay={addEventListener:(event,callback)=>{assert.equal(event,'click');listener=callback}};
const document={getElementById:id=>id==='mg10-stage'?stage:id==='mg10-replay'?replay:null};
let reduceChange;
const media={matches:false,addEventListener:(type,callback)=>{if(type==='change')reduceChange=callback}};
const window={matchMedia:()=>media,IntersectionObserver:true};
class Observer{
 constructor(callback,options){this.callback=callback;assert.equal(options.threshold,.28);Observer.instance=this}
 observe(node){observed=node}
 unobserve(node){unobserved=node}
}
new Function('document','window','IntersectionObserver',js)(document,window,Observer);
assert.equal(observed,stage,'Graph should be observed once');
assert.ok(!classes.has('mg10-playing'),'Do not animate before it enters the viewport');
Observer.instance.callback([{isIntersecting:true,target:stage}]);
assert.equal(unobserved,stage,'Observer must release completed scene');
assert.ok(classes.has('mg10-playing'),'Graph should animate when visible');
listener();
assert.ok(reflows>=2,'Replay should restart CSS animation without timers');
media.matches=true;reduceChange({matches:true});
assert.ok(!classes.has('mg10-playing'),'Reduced motion must cancel animation');
listener();
assert.ok(!classes.has('mg10-playing'),'Replay must respect reduced motion');
console.log('MathsGrove motion v10: correct maths, accessible stage, viewport-only animation, replay, mobile layout and Pages bundle: OK');
