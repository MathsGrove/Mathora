import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessDemoReasoning,evidenceSummary,DEMO_STAGES} from '../reasoning-model.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
assert.equal(DEMO_STAGES.length,2);
assert.equal(DEMO_STAGES[0].answer,5);
assert.equal(DEMO_STAGES[1].answer,4);
assert.ok(DEMO_STAGES[0].methods.filter(x=>x.correct).length===1);
assert.ok(DEMO_STAGES[1].methods.filter(x=>x.correct).length===1);
const first=assessDemoReasoning(0,'x = 5','a');
assert.equal(first.valid,true);assert.equal(first.numberCorrect,true);
assert.equal(first.methodCorrect,true);assert.equal(first.checksPassed,2);
const wrongMethod=assessDemoReasoning(0,'5','b');
assert.equal(wrongMethod.numberCorrect,true);
assert.equal(wrongMethod.methodCorrect,false,'Correct number must not hide a wrong method');
const arithmetic=assessDemoReasoning(1,'y = 3','a');
assert.equal(arithmetic.numberCorrect,false);
assert.equal(arithmetic.methodCorrect,true,'Useful method and arithmetic error must be distinct');
assert.equal(assessDemoReasoning(1,'y = 4','a').checksPassed,2);
assert.equal(assessDemoReasoning(0,'x = 5; DROP TABLE','a').valid,false);
assert.equal(assessDemoReasoning(1,'<img src=x>','c').valid,false);
assert.equal(assessDemoReasoning(0,'5','').valid,false);
const strong=evidenceSummary(first,assessDemoReasoning(1,'4','a'));
assert.deepEqual({submitted:strong.submitted,correctSignals:strong.correctSignals,
 possibleSignals:strong.possibleSignals,readyToClaimMastery:strong.readyToClaimMastery},
 {submitted:2,correctSignals:4,possibleSignals:4,readyToClaimMastery:false});
assert.match(strong.description,/later|another day/i,'Correct two examples cannot claim lasting mastery');
const corrected=evidenceSummary(assessDemoReasoning(0,'6','b'),assessDemoReasoning(1,'4','a'));
assert.equal(corrected.readyToClaimMastery,false);
assert.match(corrected.description,/later check|needs/i);
const page=read('reasoning-demo.html'),app=read('reasoning-demo.js'),home=read('index.html');
for(const id of ['rg-form-first','rg-form-second','rg-feedback-first','rg-feedback-second',
 'rg-summary','rg-role-desc','rg-restart']){
 assert.ok(page.includes('id="'+id+'"'),'Missing interactive stage '+id);
}
assert.ok(home.includes('href="./reasoning-demo.html"'),'Homepage must present the live example');
assert.ok(page.includes('not human examiner marking')&&page.includes('Nothing you type here is submitted'),
 'No misleading automated-marking or private submission claims');
assert.ok(!/\b(?:localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|sendBeacon|supabase)\b/i.test(app),
 'Question responses must never leave the device or persist in browser storage');
assert.ok(!app.includes('innerHTML'),'Prepared guidance must only use safe text nodes');
assert.ok(!app.includes('mastered'),'Short demo must not promise mastery');
const reader=read('report-reader.js'),source=read('report-pages.html');
assert.ok(reader.includes("fetch('./report-pages.html'"),
 'Standalone report should fetch its own content, not the heavy homepage');
assert.deepEqual([...source.matchAll(/data-mg7-page="(\d+)"/g)].map(m=>Number(m[1])),[0,1,2,3,4,5,6]);
assert.ok(!home.includes('id="mg7-book"'),'Homepage must not eagerly parse 7 complete report pages');
assert.ok(home.length<65000,'Homepage HTML must be substantially smaller than previous 77 KB');
assert.ok(read('robots.txt').includes('Disallow: /Mathora/studio.html'));
assert.ok(read('sitemap.xml').includes('https://mathsgrove.github.io/Mathora/reasoning-demo.html'));
const deploy=read('.github/workflows/pages.yml');
for(const name of ['reasoning-demo.html','reasoning-demo.js','reasoning-model.mjs','report-pages.html','robots.txt','sitemap.xml']){
 assert.ok(deploy.includes(name),'Deploy missing '+name);
}
console.log('Reasoning Journey public demonstration: correct algebra, separate method/error feedback, no user-data storage, no mastery inflation, standalone report and public metadata — PASS');
