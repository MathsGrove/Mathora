import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const report=read('report.html'),source=read('report-pages.html'),
 reader=read('report-reader.js'),style=read('report-editorial-v17.css');
const pages=read('.github/workflows/pages.yml'),browser=read('.github/workflows/browser-smoke.yml');
const motionScenes=['orbits','proportions','curves','reasoning','geometry','four-steps','connections'];
assert.equal(motionScenes.length,7);
const pagesInSource=[...source.matchAll(/<article class="mg7-page[^"]*" data-mg7-page="(\d+)"/g)];
assert.deepEqual(pagesInSource.map(x=>Number(x[1])),[0,1,2,3,4,5,6],'Keep the original seven source pages');
for(const value of ['43 / 60','10 / 10','2 / 10','four-week','centre is twice','not an official']){
 assert.ok(source.toLowerCase().includes(value.toLowerCase()),'Never change specimen evidence: '+value);
}
const rows=[...source.matchAll(/<tr data-mg7-question="(\d+)" data-mg7-topic="([^"]+)" data-mg7-awarded="(\d+)" data-mg7-available="(\d+)"/g)].map(x=>({question:Number(x[1]),earned:Number(x[3]),possible:Number(x[4])}));
assert.equal(rows.length,10,'All ten assessed questions retained');
assert.deepEqual([rows.reduce((a,r)=>a+r.earned,0),rows.reduce((a,r)=>a+r.possible,0),rows.filter(r=>r.earned===r.possible).length],[43,60,2],'Preserve mark consistency');
for(const [old,newTitle] of [
 ['What the examiner','Beyond the'],['Where the marks','The shape of'],['Every question.<br><em>A meaningful','Every question.<br><em>Every decision'],
 ['The reason behind','Inside the'],['Make the next','Four weeks.'],['A shared view.','One learner.']]){
 assert.ok(source.includes(newTitle),'Missing refined chapter title: '+newTitle);
 assert.ok(!source.includes(old),'Previous long title remains: '+old);
}
for(const [tag,id] of [['link','report-editorial-v17.css'],['div','mgr16-reading-layout'],['section','mgr16-insights']]){
 assert.ok(report.includes(id),'Reader missing '+id);
}
for(const oldAsset of ['maths-cinematic-v11.css','maths-refinement-v14.css']){
 assert.ok(!report.includes(oldAsset),'Standalone reader should not load obsolete/conflicting marketing styles: '+oldAsset);
}
assert.ok(report.includes('mgr17-hero-figure')&&report.includes('mgr17-outro-figure'),'Subtle bookend mathematical visuals exist');
assert.ok(report.includes('mgr17-outro-links')&&report.includes('href="./index.html#signature"')&&report.includes('href="./reasoning-demo.html"'),'Useful closing destination paths retained');
assert.ok((report.match(/data-mgr-page="/g)||[]).length===7,'All seven chapters are navigable');
for(const name of motionScenes){
 assert.ok(reader.includes("name:'"+name+"'"),'Missing maths scene for page '+name);
}
assert.ok(reader.includes("document.createElementNS(ns,'path')")&&reader.includes("document.createElementNS(ns,'circle')"),'Mathematical motifs are real SVG lines, not extra headline clutter');
assert.ok(reader.includes("ribbon.setAttribute('aria-hidden','true')"),'Mathematical-only ornament hidden from screen readers');
assert.ok(reader.includes("page.insertBefore(ribbon,body)")&&reader.includes("page.dataset.mgr17Scene=scene.name"),'Every page has a layout-safe and distinct graphic');
assert.ok(reader.includes("try{decorateMathematics(pages)}catch(_error)"),'Decorations must not break core report reading');
assert.ok(reader.includes("entry.target.classList.add('mgr16-page-seen','mgr17-seen')"),'Page animation reveals once in view');
assert.ok(reader.includes("pages[n].focus({preventScroll:true})"),'Navigation must preserve focus');
assert.ok(reader.includes("navigator.connection?.saveData")&&!/setInterval\s*\(|setTimeout\s*\(/.test(reader),'No persistent visual loops or background activity');
assert.ok(!/fetch\s*\(\s*['"](?:https?:|\/)|createClient\s*\(|\.rpc\s*\(|localStorage\s*\./.test(reader),'No private student records or third-party tracking added');
assert.ok(style.includes('.mgr17-ribbon')&&style.includes('mg17-ribbon-draw')&&style.includes('mg17-soft-rise'),'Mathematical line draw and editorial reveals exist');
assert.ok(style.includes('max-width:950px')&&style.includes('@media(max-width:600px)')&&style.includes('@media(max-width:375px)'),'Document fit must address small and medium screens');
assert.ok(style.includes('@media(prefers-reduced-motion:reduce)')&&style.includes('@media print'),'Motion and print safeguards are mandatory');
assert.ok(style.includes('min-height:270mm!important')&&style.includes('.mgr17-ribbon')&&style.includes('display:none!important'),'Retain original A4 print geometry with no decorative ribbons');
assert.ok(style.includes('grid-template-columns:minmax(0,1fr)')&&style.includes('overflow-x:auto'),'Prevent long navigation and question tables from forcing overflow');
assert.ok(pages.includes('report-editorial-v17.css')&&pages.includes('node scripts/check-report-editorial-v17.mjs'),'Curated Pages deploy must ship and validate redesign');
assert.ok(browser.includes('node scripts/check-report-editorial-v17.mjs'),'Pull-request checks cover design and data integrity');
console.log('MathsGrove Signature v17: seven geometric scenes, shorter editorial chapter titles, canonical 43/60 marks, mobile fit, reduced motion and seven-page A4 print: OK');
