import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const moduleSource=read('schedule-readiness.js');
const {assessScheduleCoverage}=await import('data:text/javascript;base64,'+Buffer.from(moduleSource).toString('base64'));
const today=new Date('2026-11-02T15:00:00Z');
const student=[{id:'fictional-1',name:'Test Learner'}];
const entitlement=tier=>[{student_id:'fictional-1',tier,starts_at:'2026-11-02T00:00:00Z',ends_at:'2026-12-10T23:59:00Z'}];
const make=(n,mode)=>({student_id:'fictional-1',mode,status:'scheduled',due_date:
 new Date(Date.UTC(2026,10,2+n)).toISOString().slice(0,10)});
const daily=Array.from({length:7},(_,i)=>make(i,'daily'));
let r=assessScheduleCoverage(student,entitlement('daily'),[...daily,make(6,'weekly')],today);
assert.equal(r.checked,1);assert.equal(r.complete,1);assert.equal(r.attention.length,0);
r=assessScheduleCoverage(student,entitlement('daily'),daily.slice(0,4),today);
assert.equal(r.attention.length,1);assert.equal(r.attention[0].missing,4);
assert.equal(r.attention[0].firstMissing,'2026-11-06');
r=assessScheduleCoverage(student,entitlement('weekly'),[make(0,'weekly')],today);
assert.equal(r.attention.length,0,'Weekly only needs its own weekly schedule');
r=assessScheduleCoverage(student,entitlement('exam'),
 [...daily.map(x=>({...x,mode:'exam_daily'})),make(6,'weekly')],today);
assert.equal(r.attention.length,0,'Exam route requires exam-daily plus weekly');
r=assessScheduleCoverage(student,entitlement('exam'),
 daily.map(x=>({...x,mode:'exam_daily'})),today);
assert.equal(r.attention[0].missing,1,'Exam route should not silently omit weekly assignments');
r=assessScheduleCoverage(student,[{student_id:'fictional-1',tier:'daily',
 starts_at:'2026-10-20T00:00:00Z',ends_at:'2026-11-01T23:59:00Z'}],[],today);
assert.equal(r.checked,0,'Expired entitlements should not trigger false alarms');
r=assessScheduleCoverage(student,[{student_id:'fictional-1',tier:'daily',
 starts_at:'2026-11-05T00:00:00Z',ends_at:'2026-11-06T23:59:00Z'}],[make(3,'daily'),make(4,'daily')],today);
assert.equal(r.attention.length,0,'Do not require tasks beyond entitlement end');
r=assessScheduleCoverage(student,entitlement('daily'),new Array(600).fill(make(0,'daily')),today);
assert.equal(r.capped,true);assert.equal(r.attention.length,0,'Capped calendars must be marked unknown rather than complete');
assert.ok(!moduleSource.includes('.rpc(')&&!moduleSource.includes('.from('),'Monitor is read-only and uses existing authorised data');
const js=read('studio.js');
assert.ok(js.includes("db.rpc('update_student_setup_atomic'")||js.includes("db.rpc('update_student_setup_atomic',"));
const form=js.slice(js.indexOf("$('programme-form').onsubmit="),js.indexOf('function loadPendingIntoForm',js.indexOf("$('programme-form').onsubmit=")));
assert.ok(!form.includes("db.rpc('update_student_setup'")&&!form.includes("db.rpc('grove_admin_set_target'"),
 'Programme form must not retain two independent writes');
assert.ok(js.includes('renderScheduleWarning()'),'Staff overview should refresh schedule alerts');
const sql=read('supabase/migrations/202611081200_atomic_student_programme_save.sql');
for(const guard of ['security invoker',"set search_path to ''",'if (select auth.uid()) is null',
 'v_setup := public.update_student_setup(', 'v_target := public.grove_admin_set_target(',
 'revoke all on function','to authenticated']){
 assert.ok(sql.includes(guard),'Atomic RPC missing safety marker '+guard);
}
assert.ok(!/(\bcommit\b|\brollback\b)\s*;/i.test(sql),
 'RPC must rely on a single PostgreSQL transaction, never commit halfway');
const page=read('studio.html'),workflow=read('.github/workflows/pages.yml');
assert.ok(page.includes('id="mg-schedule-readiness"'));
assert.ok(page.includes('href="./schedule-readiness.css"'));
assert.ok(workflow.includes('schedule-readiness.js')&&workflow.includes('schedule-readiness.css'));
console.log('MathsGrove programme atomicity and schedule horizon checks passed.');
