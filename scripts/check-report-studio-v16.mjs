import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=file=>readFileSync(file,'utf8');
const source=read('report-pages.html');
const report=read('report.html');
const css=read('report-experience-v16.css');
const reader=read('report-reader.js');
const workflow=read('.github/workflows/pages.yml');
const smoke=read('.github/workflows/browser-smoke.yml');
const home=read('index.html');
const rows=[...source.matchAll(/<tr data-mg7-question="(\d+)" data-mg7-topic="([^"]+)" data-mg7-awarded="(\d+)" data-mg7-available="(\d+)"/g)]
 .map(m=>({question:Number(m[1]),topic:m[2],awarded:Number(m[3]),available:Number(m[4])}));
assert.equal(rows.length,10,'The data behind the animated statistics must remain the original ten specimen rows');
assert.deepEqual(rows.map(r=>r.question),[1,2,3,4,5,6,7,8,9,10]);
assert.deepEqual([
 rows.reduce((a,r)=>a+r.awarded,0),
 rows.reduce((a,r)=>a+r.available,0),
 rows.filter(r=>r.awarded===r.available).length
],[43,60,2],'Canonical question rows reconcile to exact sample marks');
assert.equal(Math.round(100*43/60),72,'Ring percentage is the rounded mark share');
assert.equal((source.match(/<article class="mg7-page[^"]*" data-mg7-page=/g)||[]).length,7,'Preserve all seven report pages');
assert.equal((report.match(/data-mgr-page="/g)||[]).length,7,'All seven report chapters remain linked');
for(const id of ['mgr16-insights','mgr16-ring-fg','mgr16-score-percent','mgr16-score-total','mgr16-count-questions','mgr16-count-full','mgr16-question-bars']){
 assert.ok(report.includes('id="'+id+'"'),'Missing animated report overview slot: '+id);
}
assert.ok(report.includes('class="mgr16-reading-layout"')&&report.includes('class="mgr16-reader"'),'Reader should use a dedicated responsive page layout');
assert.ok(report.includes('report-experience-v16.css'),'The report must load v16 fit and animation design');
assert.ok(home.includes('href="./report.html"'),'Existing public homepage link still opens the full reader');
assert.ok(reader.includes("fetch('./report-pages.html'")&&reader.includes("root.replaceChildren(fragment)"),'Original canonical report must still drive the reader');
for(const token of ['prepareOverview(documentCopy)','data-mg7-question','data-mg7-awarded','data-mg7-available','rows.reduce','Math.round(100*awarded/available)','rows.filter','graph.setAttribute','overview.hidden=false']){
 assert.ok(reader.includes(token),'No invented sample metrics: '+token);
}
assert.ok(!/fetch\s*\(\s*['"](?:https?:|\/)|createClient\s*\(|\.rpc\s*\(|localStorage\s*\.|sessionStorage\s*\./.test(reader),'No private learner data, external requests, or persistent report tracking');
assert.ok(reader.includes('navigator.connection?.saveData')&&reader.includes("document.visibilityState==='hidden'"),'Animations avoid low-data and background conditions');
assert.ok(reader.includes('observer.disconnect();play()'),'The first data reveal must run once only');
assert.ok(!/setInterval\s*\(|setTimeout\s*\(/.test(reader),'Avoid persistent or scheduled animation loops');
assert.ok(reader.includes("pages[n].focus({preventScroll:true})"),'Keyboard focus follows report chapter changes');
assert.ok(reader.includes("reduce()||!adjacent?'instant':'smooth'"),'Long page jumps skip lengthy smooth-scroll while adjacent pages flow');
assert.ok(reader.includes("aria-current")&&reader.includes("history.replaceState"),'Preserve accessible chapter state and stable page anchors');
assert.ok(css.includes('grid-template-columns:214px minmax(0,1fr)')&&css.includes('max-width:920px'),'Pages are readable with a desktop navigation rail');
assert.ok(css.includes('@media(max-width:1120px)')&&css.includes('@media(max-width:570px)'),'Both tablet and phone layouts are explicitly refined');
assert.ok(css.includes('.mg7-mark-table')&&css.includes('overflow-x:auto'),'Dense question tables are contained on small screens');
assert.ok(css.includes('mgr16-ring-fg')&&css.includes('mgr16-q-fill')&&css.includes('mgr16-paper-arrival'),'Score ring, ten bar chart and pages get finite, meaningful motion');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),'All report animations must be optional');
assert.ok(css.includes('@media print')&&css.includes('min-height:270mm!important')&&css.includes('.mgr16-reading-layout'),'Print must keep the canonical seven A4 pages despite the on-screen layout');
assert.ok(workflow.includes('node scripts/check-report-studio-v16.mjs')&&workflow.includes('report-experience-v16.css'),'The deploy must verify and include report v16');
assert.ok(smoke.includes('node scripts/check-report-studio-v16.mjs'),'Browser CI must check new report constraints');
console.log('MathsGrove report studio v16: canonical 43/60, 72%, 10 questions, 2 full marks, seven pages, reduced-motion animations and A4 print safeguards: OK');
