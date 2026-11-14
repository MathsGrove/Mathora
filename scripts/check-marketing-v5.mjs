import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>readFileSync(p,'utf8');
const home=read('index.html'),app=read('marketing-experience-v5.js'),style=read('marketing-experience-v5.css'),pages=read('.github/workflows/pages.yml');
const ids=[...home.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(new Set(ids).size,ids.length,'Homepage has duplicate IDs');
const targets=[...app.matchAll(/\b(?:q|text)\('([^']+)'\)/g)].map(x=>x[1]);
for(const id of targets)assert.ok(ids.includes(id),'Missing v5 dashboard element '+id);
for(const key of ['eleven','growth','stretch'])assert.ok(home.includes('data-mg5-case="'+key+'"'),'Missing learner scenario '+key);
for(const key of ['student','parent','tutor'])assert.ok(home.includes('data-mg5-role="'+key+'"'),'Missing role '+key);
assert.ok(home.includes('id="services"')&&home.includes('id="dashboards"')&&home.indexOf('id="services"')<home.indexOf('id="dashboards"'),'The three programmes must precede dashboard previews in the new MathsGrove journey');
assert.ok(home.indexOf('id="learning-journey"')<home.indexOf('id="dashboards"'),'The interactive dashboard tour precedes the detailed analytics showcase');
assert.ok(home.indexOf('id="dashboards"')<home.indexOf('id="signature-discovery"'),'Signature follows the learning dashboard story');
assert.ok(home.includes('marketing-experience-v5.css')&&home.includes('marketing-experience-v5.js'),'Homepage script and styles must be loaded');
const curatedCopy=pages.split('\n').find(line=>line.includes('cp index.html'))||'';
assert.ok(['marketing-experience-v5.css','marketing-experience-v5.js',' site/'].every(asset=>curatedCopy.includes(asset)),'Curated Pages bundle must contain v5 files');
assert.ok(pages.includes('node --check marketing-experience-v5.js'),'Check v5 script syntax in CI');
assert.ok(!/\bpricing\b|£/i.test(home),'No prices on public pages');
assert.ok(home.includes('fictional')&&home.includes('11+'),'Demo must distinguish fictional scores and planned routes');
assert.ok(style.includes('prefers-reduced-motion:reduce'),'Motion must respect reduced-motion preference');

class El{
 constructor(dataset={}){this.dataset=dataset;this.textContent='';this.children=[];this.listeners={};this.attributes={};this.style={};this.value='';this.offsetWidth=1;this.classList={add(){},remove(){}}}
 setAttribute(k,v){this.attributes[k]=String(v)}
 append(...x){this.children.push(...x)}
 replaceChildren(...x){this.children=x}
 addEventListener(name,fn){this.listeners[name]=fn}
 click(){this.listeners.click?.({preventDefault(){}})}
 dispatchEvent(ev){this.event=ev.type}
 scrollIntoView(){this.scrolled=true}
}
const elements=Object.fromEntries(ids.map(id=>[id,new El()]));
const scenarios=['eleven','growth','stretch'].map(value=>new El({mg5Case:value}));
const roles=['student','parent','tutor'].map(value=>new El({mg5Role:value}));
const tier=new El();tier.click=()=>{tier.wasClicked=true};
const rolePreview=Object.fromEntries(['student','parent','tutor'].map(role=>[role,new El()]));
for(const role in rolePreview)rolePreview[role].click=()=>{rolePreview[role].wasClicked=true};
const document={
 getElementById:id=>elements[id]||null,
 createElement:()=>new El(),createElementNS:()=>new El(),
 querySelectorAll:sel=>sel==='[data-mg5-case]'?scenarios:sel==='[data-mg5-role]'?roles:[],
 querySelector:sel=>sel==='[data-tier="exam"]'?tier:rolePreview[sel.match(/data-role="(.*?)"/)?.[1]]||null,
 body:{classList:{add(){}}},
 documentElement:{scrollHeight:2000}
};
const window={matchMedia:()=>({matches:true}),addEventListener(){}};
const history={replaceState(){}};
class Event{constructor(type){this.type=type}}
new Function('document','window','history','Event','scrollY','innerHeight','requestAnimationFrame',app)(document,window,history,Event,0,1000,fn=>fn());
assert.match(elements['mg5-preview-name'].textContent,/Maya/,'Default story should render');
assert.equal(elements['mg5-topics'].children.length,3,'Chart should include all topic rows');
assert.equal(elements['mg5-chart'].children.length,1,'Score trend chart should render');
scenarios[0].click();roles[1].click();
assert.match(elements['mg5-preview-name'].textContent,/Jamie/,'11+ parent view should render');
assert.equal(scenarios[0].attributes['aria-pressed'],'true','11+ tab should be selected');
assert.equal(roles[1].attributes['aria-pressed'],'true','Parent tab should be selected');
assert.match(elements['mg5-chart'].children[0].attributes['aria-label'],/Jamie Patel/,'Chart should update with learner');
scenarios[2].click();roles[2].click();
assert.match(elements['mg5-next-title'].textContent,/non-routine/i,'High achiever tutor next step should differ');
for(let i=0;i<scenarios.length;i++){
 scenarios[i].click();
 for(let j=0;j<roles.length;j++){
  roles[j].click();
  assert.equal(scenarios[i].attributes['aria-pressed'],'true','Scenario state should persist');
  assert.equal(roles[j].attributes['aria-pressed'],'true','Perspective state should persist');
  assert.equal(elements['mg5-chart'].children.length,1,'Chart should rerender across all nine examples');
  assert.equal(elements['mg5-topics'].children.length,3,'Topic bars should rerender across all nine examples');
 }
}
scenarios[2].click();roles[2].click();
elements['mg5-open-full-demo'].click();
assert.equal(elements['mg3-exam-select'].value,'alevel','Full demo should reflect selected route');
assert.ok(tier.wasClicked&&rolePreview.tutor.wasClicked&&elements['learning-journey'].scrolled,'Full demo link should open matching role/qualification');
console.log('Marketing v5: assets, navigation, fictional labelling, responsive motion and 9 role-story states: OK');
