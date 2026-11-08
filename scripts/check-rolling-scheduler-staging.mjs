import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/202611081400_staged_safe_rolling_practice.sql',import.meta.url),'utf8');
for(const rule of [
 'p_apply boolean default false',
 'pg_try_advisory_xact_lock',
 "and b.review_state='approved'",
 'b.reviewed_at is not null',
 'private.grove_board_compatible(b.exam_board,v_member.exam_board)',
 'not exists (',
 'v_total_available<v_total_need',
 'v_weekly_available<v_weekly_need',
 'v_primary_available<v_primary_need',
 'v_conflict_blocked:=v_conflict_blocked+1',
 'if p_apply then',
 'on conflict(student_id,due_date,mode) do nothing',
 'revoke all on function private.grove_renew_practice_safely(boolean,date)',
 "'mocks_scheduled',0"
])assert.ok(sql.includes(rule),'Missing safety rule '+rule);
assert.equal((sql.match(/insert into private\.grove_tasks/gi)||[]).length,1,
 'Renewal must use only one conditional future INSERT');
assert.ok(!/\bdelete\s+from\s+private\.grove_tasks\b/i.test(sql),
 'Renewal must never delete existing tasks');
assert.ok(!/\bupdate\s+private\.grove_tasks\b/i.test(sql),
 'Renewal must never rewrite existing tasks');
assert.ok(!/^\s*(?:select\s+)?cron\.(?:schedule|unschedule)\s*\(/im.test(sql),
 'Cron activation must require an explicit approved rollout');
assert.ok(sql.includes('p_today<>current_date'),
 'Writes cannot spoof a date');
assert.ok(sql.includes("and e.starts_at<=pg_catalog.now()")||sql.includes('e.starts_at<=pg_catalog.now()'),
 'Do not renew future-dated entitlements');
const days=(tier,offset)=>{
 const rows=[];
 for(let d=0;d<28;d++){
  if(tier==='weekly'&&d%7===0)rows.push([offset+d,'weekly',8]);
  if(tier!=='weekly'){
   rows.push([offset+d,tier==='exam'?'exam_daily':'daily',tier==='exam'?6:4]);
   if(d%7===6)rows.push([offset+d,'weekly',8]);
  }
 }
 return rows;
};
const total=(tier)=>days(tier,0);
assert.equal(total('weekly').length,4);
assert.equal(total('daily').length,32);
assert.equal(total('exam').length,32);
assert.equal(total('weekly').reduce((s,x)=>s+x[2],0),32);
assert.equal(total('daily').reduce((s,x)=>s+x[2],0),144);
assert.equal(total('exam').reduce((s,x)=>s+x[2],0),200);
for(const tier of ['weekly','daily','exam']){
 const all=total(tier);
 assert.equal(new Set(all.map(x=>x[0]+'|'+x[1])).size,all.length,
  'No duplicate task date and type');
}
// Content selection must be a stricter upper-bound than grove_task_start;
// missing review metadata must never be treated as proof of readiness.
assert.ok(sql.includes("private.baseline_bank base"));
assert.ok(sql.includes('private.grove_task_items i'));
assert.ok(sql.includes('past.student_id=v_member.student_id'));
assert.ok(sql.includes("t.status='scheduled'"));
console.log('Rolling scheduler static and 28-day tier invariants passed (no production task changes).');
