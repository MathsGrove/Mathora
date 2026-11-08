/* MathsGrove authorised family engagement:
 * This module renders aggregates supplied by the existing verified-email,
 * per-student get_my_learner_views() RPC. It does not query student records. */
export function describeFamilyTiming(learner){
 const t=learner?.practice_timing||{};
 const number=v=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
 const scheduled=number(t.scheduled_sessions);
 const submitted=number(t.submitted_sessions);
 const later=number(t.submitted_after_day);
 const unstarted=number(t.unstarted_past_schedule);
 const minutes=number(t.recorded_visible_minutes);
 const windowDays=number(t.window_days)||28;
 const rows=Array.isArray(learner?.practice_activity)?learner.practice_activity:[];
 return {scheduled,submitted,later,unstarted,minutes,windowDays,rows};
}
const names={daily:'Daily focus',exam_daily:'Exam daily practice',weekly:'Weekly practice',mock:'Monthly practice mock'};
const d=(value,{dateOnly=false}={})=>{
 if(!value)return '';
 const raw=String(value);
 const parsed=new Date(dateOnly?raw.slice(0,10)+'T12:00:00Z':raw);
 if(!Number.isFinite(parsed.getTime()))return '';
 return dateOnly?parsed.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):
  parsed.toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
};
export function readablePracticeMinutes(n){
 const minutes=Math.max(0,Math.round(Number(n)||0));
 return minutes<60?minutes+' min':Math.floor(minutes/60)+' hr '+String(minutes%60).padStart(2,'0')+' min';
}
const el=(tag,className,content)=>{
 const node=document.createElement(tag);
 if(className)node.className=className;
 if(content!==undefined)node.textContent=String(content);
 return node;
};
function timingStatus(item){
 if(item.submitted_at){
  const days=Math.max(0,Number(item.days_after_scheduled)||0);
  return days>0?{kind:'after',text:days+' calendar day'+(days===1?'':'s')+' after scheduled day'}:
   {kind:'done',text:'Submitted on scheduled day or earlier'};
 }
 if(item.status==='active')return {kind:'active',text:'In progress'};
 if(item.status==='expired')return {kind:'after',text:'Closed without a recorded submission'};
 if(item.status==='scheduled')return {kind:'waiting',text:'No submission recorded'};
 return {kind:'waiting',text:'Submission not recorded'};
}
export function renderFamilyTiming(learner){
 const root=document.getElementById('fa-timing-dashboard');if(!root)return;
 const metrics=document.getElementById('fa-timing-metrics'),list=document.getElementById('fa-timing-activity');
 const t=describeFamilyTiming(learner);
 metrics.replaceChildren();list.replaceChildren();
 const values=[
  {title:'Recorded question-screen time',value:readablePracticeMinutes(t.minutes),
   sub:'On-screen question visibility, not total study time'},
  {title:'Submitted sessions',value:t.submitted,sub:'Within the recorded 28-day schedule'},
  {title:'After scheduled day',value:t.later,sub:'Calendar days, not a contractual deadline'},
  {title:'Unstarted past schedule',value:t.unstarted,sub:'Past planned opening dates without a start'}
 ];
 for(const item of values){
  const card=el('div','fat-stat');
  card.append(el('span','',item.title),el('strong','',item.value),el('small','',item.sub));
  metrics.append(card);
 }
 const note=document.getElementById('fa-timing-window');
 note.textContent='Rolling '+t.windowDays+' days · '+t.scheduled+' recorded scheduled session'+(t.scheduled===1?'':'s')+' · Assigned practice only';
 if(!t.rows.length){list.append(el('p','fat-empty','No scheduled activity has been recorded in this period. The student’s timetable may not yet have been prepared.'));return}
 for(const row of t.rows.slice(0,12)){
  const item=el('article','fat-event');
  const label=el('div','fat-event-main');
  label.append(el('strong','',names[row.mode]||'Assigned mathematics practice'));
  const detail=el('small','','');
  detail.textContent='Scheduled '+(d(row.scheduled_date,{dateOnly:true})||'date unavailable')+
   (row.submitted_at?' · Submitted '+d(row.submitted_at):' · Not submitted');
  const duration=el('span','fat-duration','Question screen '+readablePracticeMinutes(row.visible_minutes));
  label.append(detail,duration);
  const status=timingStatus(row);
  item.append(label,el('span','fat-event-status fat-'+status.kind,status.text));
  list.append(item);
 }
}
