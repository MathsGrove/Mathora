import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>readFileSync(p,'utf8');
const home=read('index.html');
const css=read('welcome-experience-v8.css');
const app=read('welcome-experience-v8.js');
const tour=read('marketing-experience-v5.js');
const workflow=read('.github/workflows/pages.yml');
const ids=[...home.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'Homepage contains duplicate IDs');
for(const id of ['top','main-content','hero-title','choose-your-view','dashboards','services','signature','signature-sample','how-it-works','mg8-spotlight-heading']){
 assert.ok(ids.includes(id),'Missing welcome flow anchor '+id);
}
for(const text of ['WELCOME TO MATHSGROVE','See the thinking','behind the mark.','A correct answer is just a beginning.','examiner feedback that explains the method']){
 assert.ok(home.includes(text),'Missing value proposition: '+text);
}
assert.ok(home.includes('href="./welcome-experience-v8.css"')&&home.includes('src="./welcome-experience-v8.js"'),'Homepage must load welcome styles and interaction');
assert.ok(home.indexOf('id="choose-your-view"')<home.indexOf('id="dashboards"'),'Role selector must appear before full dashboard preview');
assert.ok(home.indexOf('id="dashboards"')<home.indexOf('id="signature-sample"'),'Detailed report after accessible entry');
assert.ok(home.includes('href="#signature-sample"'),'Report CTA must link to the seven-page reader');
const links=[...home.matchAll(/<a\b[^>]*data-mg8-route="([^"]+)"[^>]*>/g)].map(m=>m[1]);
assert.deepEqual(links,['student','parent','tutor'],'Welcome must contain exactly three guided perspectives');
assert.ok(!home.includes('href="mailto:')&&!home.includes('action="/submit"'),'Do not invent unconnected enquiry destinations');
assert.ok(!/\bpricing\b|£/i.test(home),'Public website must not show partner rates');
assert.ok(home.includes('fictional learners')&&home.includes('Grove Exam only'),'Showcase must disclose simulated data and role permissions');
assert.ok(css.includes('prefers-reduced-motion:reduce'),'Welcome animations must respect reduced motion');
assert.ok(css.includes('@media(max-width:680px)'),'Welcome must provide compact mobile layout');
assert.ok(!/setInterval|setTimeout/.test(app),'Welcome should not introduce looping animations');
assert.ok(workflow.includes('node --check welcome-experience-v8.js'),'CI must syntax-check welcome interactions');
assert.ok(workflow.split('\n').some(line => /^\s*cp\s+/.test(line) && line.includes('welcome-experience-v8.css') && line.includes('welcome-experience-v8.js') && /\s+site\/\s*$/.test(line)),'Curated Pages bundle must contain welcome assets');
assert.ok(tour.includes('window.MathsGroveShowcase=Object.freeze'),'Existing showcase must expose a role selection API');
let navigated=[],selected=[],historyRecords=[];
const destination={scrollIntoView(args){navigated.push(args)}};
const cases=['student','parent','tutor'].map(role=>({dataset:{mg8Route:role},callbacks:{},addEventListener(name,handler){this.callbacks[name]=handler},click(){let prevented=false;this.callbacks.click({preventDefault(){prevented=true}});return prevented}}));
const document={querySelectorAll:s=>s==='[data-mg8-route]'?cases:[],getElementById:id=>id==='dashboards'?destination:null,querySelector:()=>null};
const window={matchMedia:()=>({matches:true}),history:{replaceState(_1,_2,hash){historyRecords.push(hash)}},MathsGroveShowcase:{select(payload){selected.push(payload);return true}}};
new Function('document','window',app)(document,window);
assert.ok(cases.every(c=>c.click()),'Guided cards must prevent default once handled');
assert.deepEqual(selected,[{caseKey:'growth',viewRole:'student'},{caseKey:'eleven',viewRole:'parent'},{caseKey:'stretch',viewRole:'tutor'}],'Role choices must lead to distinct, correct fictional examples');
assert.deepEqual(historyRecords,['#dashboards','#dashboards','#dashboards'],'Guided links should preserve shareable dashboard anchor');
assert.equal(navigated.length,3,'All three cards should navigate to the product preview');
assert.ok(navigated.every(x=>x.behavior==='auto'),'Reduced motion preference must disable animated scrolling');
console.log('MathsGrove welcome funnel: clear value proposition, three distinct role journeys, report CTA, privacy, reduced motion and Pages packaging: OK');
