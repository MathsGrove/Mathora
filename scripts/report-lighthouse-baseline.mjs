import assert from 'node:assert/strict';
import {readFileSync,appendFileSync} from 'node:fs';

// Only locally produced public-homepage Lighthouse reports. No logged-in user
// sessions, student responses or tokens may be included in these reports.
const file='.lhci-public-reports/manifest.json';
const entries=JSON.parse(readFileSync(file,'utf8'));
assert.ok(Array.isArray(entries)&&entries.length>=2,
 'Expected two independent public-homepage Lighthouse runs.');
const sample=entries.find(x=>x.isRepresentativeRun)||entries[0];
assert.ok(sample.url?.includes('/index.html'),'Only the public landing page is in scope.');
const report=JSON.parse(readFileSync(sample.jsonPath,'utf8'));
const c=report.categories||{},a=report.audits||{};
const rounded=(n,factor=1)=>typeof n==='number'&&Number.isFinite(n)?
  String(Math.round(n*factor)/factor):'Not measured';
const rows=[
 ['Performance',rounded(c.performance?.score*100)],
 ['Accessibility',rounded(c.accessibility?.score*100)],
 ['Best practices',rounded(c['best-practices']?.score*100)],
 ['SEO',rounded(c.seo?.score*100)],
 ['Largest Contentful Paint (ms)',rounded(a['largest-contentful-paint']?.numericValue)],
 ['Total Blocking Time (ms)',rounded(a['total-blocking-time']?.numericValue)],
 ['Cumulative Layout Shift',rounded(a['cumulative-layout-shift']?.numericValue,1000)]
];
console.log('MathsGrove public homepage — Lighthouse baseline');
for(const [metric,value] of rows)console.log(metric+': '+value);
if(process.env.GITHUB_STEP_SUMMARY){
 appendFileSync(process.env.GITHUB_STEP_SUMMARY,
  '### MathsGrove public-homepage Lighthouse baseline\n\n'+
  '| Metric | Median-run result |\n|---|---:|\n'+
  rows.map(([metric,value])=>'| '+metric+' | '+value+' |').join('\n')+
  '\n\n**Note:** lab results on a synthetic anonymous browser, not real-user performance. '+
  'Scores are warnings in this first baseline so they can be calibrated before becoming blocking targets.\n');
}
