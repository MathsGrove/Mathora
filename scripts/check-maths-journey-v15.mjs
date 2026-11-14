import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(p,'utf8');
const home=read('index.html'),galaxy=read('maths-gallery-v13.js');
const weekly=read('maths-weekly-demo-v15.js'),style=read('maths-journey-v15.css');
const report=read('report.html'),reader=read('report-reader.js');
const pages=read('.github/workflows/pages.yml'),smoke=read('.github/workflows/browser-smoke.yml');
const ids=[...home.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size,'Homepage must not repeat IDs');
assert.ok(home.length<65000,'Keep the existing homepage size budget');
const chapters=['services','choose-your-view','learning-journey','dashboards','signature-discovery','signature','signature-sample','interactive-sample','questions'];
const offsets=chapters.map(id=>{const at=home.indexOf('id="'+id+'"');assert.ok(at>=0,'Missing homepage chapter '+id);return at});
assert.deepEqual(offsets,offsets.slice().sort((a,b)=>a-b),'Site must flow programmes → dashboards → Signature → reports → extras');
assert.equal((home.match(/class="mg15-wayfinder"/g)||[]).length,1,'Exactly one simple four-step journey');
for(const id of ['services','learning-journey','signature','signature-sample']){
 assert.ok(home.includes('href="#'+id+'"'),'Easy navigation to '+id);
}
assert.ok(home.includes('<details class="mg15-tier-comparison">'),'Long programme comparison must be optional');
for(const label of ['Grove Weekly','Grove Daily','Grove Exam'])assert.ok(home.includes(label),'Three essential programmes must be explained');
assert.ok(home.includes('Human examiner marking')||home.includes('Human examiner assessment'),'Signature remains a separately described human assessment');
assert.ok(home.includes('maths-weekly-demo-v15.js')&&home.includes('maths-journey-v15.css'),'Homepage loads week and gallery polish');
assert.ok(!home.includes('Caveat:wght@400;600'),'Do not load unused handwriting font on homepage');

assert.ok(galaxy.includes('mg13-tile')&&galaxy.includes('mg13-trails'),'Gallery keeps maths tiles and curves');
assert.ok(galaxy.includes('mg15-galaxy-core')&&galaxy.includes('mg15-galaxy-core-ring'),'Galaxy uses a decorative math-only core');
for(const eliminated of ['mg14-maths-quote','mg13-eyebrow','mg13-title','mg13-paper','mg13-hand-line','mg13-tile-label','mg13-progress']){
 assert.ok(!galaxy.includes(eliminated),'Transition includes unwanted writing: '+eliminated);
}
assert.ok(galaxy.includes('["01","π","x²","∑"'),'The galaxy still showcases mathematical symbols');
assert.ok(!galaxy.includes('const quotes={'),'Remove all destination writing from the transition');
assert.ok(galaxy.includes('{enter:500,hold:250,exit:600}')&&galaxy.includes('{enter:350,hold:180,exit:480}'),'Crossfaded passages use short, smooth desktop/mobile phases');
assert.ok(galaxy.includes('navigator.connection?.saveData')&&galaxy.includes('canReduce?.matches'),'Reduce animation for accessibility and low-data connections');
assert.ok(galaxy.includes('event.metaKey||event.ctrlKey||event.shiftKey||event.altKey'),'Modified-click links must still navigate natively');
assert.ok(!/fetch\s*\(|createClient\s*\(|localStorage\.|sessionStorage\./.test(galaxy),'Motion must never fetch or persist student records');
assert.ok(style.includes('@media(prefers-reduced-motion:reduce)')&&style.includes('mg15-galaxy-core')&&style.includes('mg15-week'),'Responsive reduced-motion-safe styles are present');

for(const attr of ['id="mg15-week"','mg15-week-plot','mg15-week-value','mg15-week-visible'])assert.ok(weekly.includes(attr.replace('id="','').replace('"','')),'Missing weekly chart '+attr);
for(const seven of ['weekly:{values:[0,0,0,6,0,0,0]','daily:{values:[5,4,6,4,5,7,0]','exam:{values:[4,5,4,6,5,7,0]'])assert.ok(weekly.includes(seven),'Week must have bounded fictional data and match totals: '+seven);
assert.ok(weekly.includes('FICTIONAL EXAMPLE')&&weekly.includes('No private learner records')&&weekly.includes('Not verified progress'),'Week must not be mistaken for actual analytics');
assert.ok(weekly.includes('tier!=="exam"&&role!=="student"'),'Family/tutor preview restricted to Exam');
assert.ok(weekly.includes("window.MathsGroveV3?.getState"),'Weekly chart must use existing public demo selections only');
assert.ok(!/\bfetch\s*\(|createClient\s*\(|\.rpc\s*\(|\.from\s*\(|localStorage|sessionStorage/.test(weekly),'Sample chart must never touch a learner database');
assert.ok(!weekly.includes('innerHTML'),'Avoid injecting untrusted user text into chart');
for(const label of ['A WEEK IN FOCUS','ILLUSTRATIVE DATA','not a measure of understanding'])assert.ok(weekly.includes(label),'Require clear sample explanations');

const buttons=[...report.matchAll(/data-mgr-page="([1-7])"/g)].map(m=>Number(m[1]));
assert.deepEqual(buttons,[1,2,3,4,5,6,7],'All seven reader chapters must be accessible');
assert.ok(report.includes('mgr-progress-fill')&&report.includes('id="mgr-select"'),'Reader shows progress and retains native select');
assert.ok(reader.includes("button.setAttribute('aria-current','page')"),'Chapter nav announces active page');
assert.ok(reader.includes('progress.style.width')&&reader.includes('chapters.forEach(button=>button.addEventListener'),'Report progress and buttons must work');
assert.ok(reader.includes("root.replaceChildren(fragment)")&&reader.includes("fetch('./report-pages.html'"),'Keep original seven-page canonical fictional specimen');

for(const file of ['maths-journey-v15.css','maths-weekly-demo-v15.js'])assert.ok(pages.includes(file),'Curated deployment must ship '+file);
assert.ok(pages.includes('node scripts/check-maths-journey-v15.mjs'),'Pages gate must check logical flow');
assert.ok(smoke.includes('node scripts/check-maths-journey-v15.mjs'),'Browser smoke must check logical flow');
console.log('MathsGrove v15: clear chapters, 3 tier descriptions, optional comparison, 24 wordless galaxy panels, fictional sample week and seven report chapters: OK');
