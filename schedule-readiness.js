/* Read-only staff schedule continuity monitor.
 * Students can have scheduled tasks even when the approved question bank is
 * insufficient; scheduling and content readiness are distinct release gates.
 * No database queries, edits, or cross-org data access are performed here. */
const DAY=86400000;
export const utcDay=value=>{
 if(!value)return null;
 const raw=String(value);
 const d=/^\d{4}-\d{2}-\d{2}/.test(raw)?new Date(raw.slice(0,10)+'T00:00:00Z'):new Date(raw);
 return Number.isFinite(d.getTime())?Math.floor(d.getTime()/DAY):null;
};
function dateForDay(n){return new Date(n*DAY).toISOString().slice(0,10)}
export function assessScheduleCoverage(students=[],entitlements=[],tasks=[],today=new Date()){
 const baseDay=utcDay(today);
 if(baseDay==null)return {checked:0,attention:[],complete:0,unknown:0,days:7};
 if(tasks.length>=600)return {checked:0,attention:[],complete:0,unknown:students.length,days:7,capped:true};
 const roster=new Map(students.map(s=>[String(s.id),s.name||'Enrolled learner']));
 const available=new Set(tasks.filter(t=>t&&t.student_id&&t.due_date&&t.mode&&
  ['scheduled','active','completed','expired'].includes(t.status||'scheduled'))
  .map(t=>String(t.student_id)+'|'+String(t.due_date).slice(0,10)+'|'+String(t.mode)));
 const problems=[];let checked=0,complete=0,unknown=0;
 for(const e of entitlements){
  const id=String(e.student_id||'');
  if(!roster.has(id)||!['weekly','daily','exam'].includes(e.tier))continue;
  const begin=utcDay(e.starts_at),end=e.ends_at?utcDay(e.ends_at):null;
  if(begin==null){unknown++;continue}
  const from=Math.max(baseDay,begin),to=Math.min(baseDay+6,end??(baseDay+6));
  if(to<from)continue;
  const needs=[],starts=begin;
  for(let date=from;date<=to;date++){
   const offset=date-starts;
   if(e.tier==='weekly'&&offset%7===0)needs.push([date,'weekly']);
   if(e.tier==='daily')needs.push([date,'daily']);
   if(e.tier==='exam')needs.push([date,'exam_daily']);
   if(e.tier!=='weekly'&&offset%7===6)needs.push([date,'weekly']);
  }
  if(!needs.length)continue;
  checked++;
  const missing=needs.filter(([day,mode])=>!available.has(id+'|'+dateForDay(day)+'|'+mode));
  if(missing.length){
   problems.push({studentId:id,name:roster.get(id),missing:missing.length,
    expected:needs.length,firstMissing:dateForDay(missing[0][0]),programme:e.tier});
  }else complete++;
 }
 return {checked,complete,unknown,attention:problems.sort((a,b)=>b.missing-a.missing||a.name.localeCompare(b.name)),days:7,capped:false};
}
export function renderScheduleCoverage(result,container){
 if(!container)return;
 container.replaceChildren();
 const heading=document.createElement('strong');
 heading.textContent='Next 7 days · practice schedule health';
 const detail=document.createElement('p');
 let status='pending';
 if(result.capped){
  status='unknown';detail.textContent='More than 600 tasks were returned. The schedule list may be incomplete; check the full calendar before drawing conclusions.';
 }else if(!result.checked){
  detail.textContent='No active, enrolled students have a scheduled practice obligation in the next seven UTC calendar days. Baseline completion or programme activation may still be pending.';
 }else if(!result.attention.length){
  status='ok';detail.textContent='All '+result.checked+' checked learner schedules contain the expected sessions for the next seven days. This does not confirm approved question supply.';
 }else{
  status='attention';
  detail.textContent=result.attention.length+' learner schedule'+(result.attention.length===1?' has':'s have')+
   ' missing entries in the next 7 days. Confirm enrolment and baseline status, then address renewal before the calendar runs out.';
 }
 container.dataset.status=status;
 container.append(heading,detail);
 if(result.attention.length){
  const list=document.createElement('ul');
  for(const p of result.attention.slice(0,6)){
   const li=document.createElement('li');
   li.textContent=p.name+': '+p.missing+' of '+p.expected+
    ' expected sessions missing (first: '+p.firstMissing+').';
   list.append(li);
  }
  container.append(list);
 }
 const foot=document.createElement('small');
 foot.textContent='Read-only staff check · UTC date basis · task presence is not proof that sufficient independently approved questions exist.';
 container.append(foot);
}
