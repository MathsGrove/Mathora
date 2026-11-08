import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const src=read('family-timing.js');
const model=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const t=model.describeFamilyTiming({
 practice_timing:{window_days:28,scheduled_sessions:9,submitted_sessions:5,
  unstarted_past_schedule:3,submitted_after_day:2,recorded_visible_minutes:142.5},
 practice_activity:[{status:'completed',mode:'daily',scheduled_date:'2026-11-05',
  submitted_at:'2026-11-07T10:30:00Z',days_after_scheduled:2,visible_minutes:45}]
});
assert.equal(t.scheduled,9);
assert.equal(t.submitted,5);
assert.equal(t.unstarted,3);
assert.equal(t.later,2);
assert.equal(t.minutes,142.5);
assert.equal(t.rows.length,1);
assert.equal(model.readablePracticeMinutes(142.5),'2 hr 23 min');
assert.equal(model.readablePracticeMinutes(0),'0 min');
assert.ok(!src.includes('sb.from(')&&!src.includes('.rpc('),
 'Family rendering must never query learner data independently');
const migration=read('supabase/migrations/202611080900_family_engagement_timing.sql');
for(const check of ['l.viewer_id=v_viewer and l.active','i.viewer_email=v_email',
 'and e.tier=','t.student_id=v_row.student_id and t.org_id=v_row.org_id',
 "'practice_timing',v_timing","'practice_activity',v_practice",
 "t.due_date between ((now() at time zone 'UTC')::date - 27)"]){
 assert.ok(migration.includes(check),'Existing family privacy or date boundary missing: '+check);
}
assert.ok(!/\bgrant\b.+\bexecute\b/i.test(migration),'Do not expand privileged RPC grants');
const refined=read('supabase/migrations/202611080901_family_timing_exclude_unpublished_mocks.sql');
assert.equal(refined.split("and t.mode in ('daily','weekly','exam_daily')").length-1,2,
 'Unmoderated mock placeholders cannot inflate parent missed-schedule counts');
assert.ok(refined.includes('l.viewer_id=v_viewer and l.active')&&refined.includes('i.viewer_email=v_email'),
 'Retain verified parent and tutor permissions in refined timing query');

const family=read('family.html'),familyJs=read('family-access.js');
for(const id of ['fa-timing-dashboard','fa-timing-metrics','fa-timing-activity','fa-timing-window'])
 assert.ok(family.includes('id="'+id+'"'),'Family dashboard missing '+id);
assert.ok(familyJs.includes("import {renderFamilyTiming} from './family-timing.js'"));
assert.ok(familyJs.includes('renderFamilyTiming(p)'));
assert.ok(family.includes('separate formal submission deadline'),'Must explain schedule limitation');
const home=read('index.html'),reader=read('report.html'),script=read('report-reader.js'),css=read('report-preview.css');
assert.ok(home.includes('href="./report.html"'),'Home must expose a standalone reader');
assert.ok(home.includes('mg-report-compact'),'Home must use a compact report teaser');
assert.ok(css.includes('@media screen')&&css.includes('#mg7-book'),'Home should hide only the large embedded reader on screen');
assert.ok(reader.includes('href="./examiner-report-book.css"'));
assert.ok(reader.includes('id="mgr-pages"')&&reader.includes('id="mgr-select"'));
assert.ok(script.includes("fetch('./index.html'")&&script.includes("source.length!==7"));
assert.ok(script.includes("removeAttribute('hidden')"),'All specimen pages need to be available when scrolling');
assert.ok(script.includes('IntersectionObserver'),'Reader should update current page with scroll position');
assert.ok(script.includes('window.print()'),'Full original report should remain printable');
const workflow=read('.github/workflows/pages.yml');
for(const asset of ['report.html','report-reader.js','report-reader.css','report-preview.css','family-timing.js','family-timing.css'])
 assert.ok(workflow.includes(asset),'Public Pages deployment is missing '+asset);
console.log('Family timing/privacy and report-reader checks passed: 28-day metrics, existing invitations, compact preview and seven-page standalone reader.');
