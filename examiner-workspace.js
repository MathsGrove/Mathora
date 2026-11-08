/* MathsGrove examiner command centre.
 * Group secure staff-visible records by student without additional personal-data queries.
 * due_date means "opens on this date", not a contractual submission deadline.
 */
const localStamp=value=>{
 if(!value)return 'Not submitted';
 const date=new Date(value);
 return Number.isFinite(date.getTime())
  ?date.toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})
  :'Date unavailable';
};
const shortDate=value=>{
 if(!value)return 'Not scheduled';
 const d=/^\d{4}-\d{2}-\d{2}$/.test(String(value))
  ?new Date(value+'T12:00:00Z'):new Date(value);
 return Number.isFinite(d.getTime())?d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'Date unavailable';
};
const duration=ms=>{
 const minutes=Math.max(1,Math.ceil(ms/60000));
 const days=Math.floor(minutes/1440),hours=Math.floor(minutes%1440/60),mins=minutes%60;
 return [days?days+'d':'',hours?hours+'h':'',mins?mins+'m':''].filter(Boolean).join(' ');
};
export function scheduleComparison(row){
 if(!row?.due_date||!row?.submitted_at)return {type:'unknown',label:'No submission comparison'};
 const end=Date.parse(String(row.due_date).slice(0,10)+'T23:59:59.999Z');
 const submitted=Date.parse(row.submitted_at);
 if(!Number.isFinite(end)||!Number.isFinite(submitted))return {type:'unknown',label:'Date unavailable'};
 const late=submitted-end;
 return late<=0?{type:'scheduled',label:'On or before scheduled day'}:
  {type:'after',label:duration(late)+' after scheduled day'};
}
function stageForPractice(row){
 if(row.review_status==='released')return 'released';
 if(['completed','expired'].includes(row.status))return 'submitted';
 if(row.status==='active')return 'draft';
 return 'scheduled';
}
export function buildExaminerRecords(students=[],attempts=[],assignments=[]){
 const names=new Map(students.map(s=>[s.id,s.name||'Enrolled student']));
 const paper=attempts.map(a=>({
  key:'paper:'+a.id,kind:'paper',id:a.id,studentId:a.student_id,
  studentName:names.get(a.student_id)||'Enrolled student',
  stage:a.status==='marked'?'released':a.status==='submitted'?'submitted':'draft',
  title:(a.paper_mode||'Practice')+' · '+a.qualification,
  submitted_at:a.submitted_at||null,started_at:a.started_at||null,scheduled_at:null,
  timestamp:a.submitted_at||a.started_at||null,mode:a.paper_mode||'practice',
  ref:a
 }));
 const practice=assignments.map(a=>({
  key:'practice:'+a.task_id,kind:'practice',id:a.task_id,studentId:a.student_id,
  studentName:names.get(a.student_id)||a.student_name||'Enrolled student',
  stage:stageForPractice(a),
  title:({weekly:'Weekly practice',daily:'Daily focus',exam_daily:'Exam daily',mock:'Monthly practice mock'})[a.mode]||'Assigned practice',
  submitted_at:a.submitted_at||null,started_at:a.started_at||null,scheduled_at:a.due_date||null,
  timestamp:a.submitted_at||a.started_at||(a.due_date?a.due_date+'T12:00:00Z':null),
  mode:a.mode||'practice',ref:a
 }));
 return paper.concat(practice);
}
const timeNumber=r=>{
 const n=Date.parse(r.timestamp||'');
 return Number.isFinite(n)?n:0;
};
export function sortExaminerRecords(records){
 return [...records].sort((a,b)=>{
  const rank=x=>x.stage==='submitted'?0:x.stage==='draft'?1:x.stage==='released'?2:3;
  const r=rank(a)-rank(b);if(r)return r;
  return a.stage==='submitted' ? timeNumber(a)-timeNumber(b)
   :timeNumber(b)-timeNumber(a);
 });
}
const text=(tag,cls,value)=>{
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(value!==undefined)e.textContent=String(value);
 return e;
};
const prettyStage={
 submitted:'Awaiting examiner',
 released:'Examiner released',
 draft:'In progress',
 scheduled:'Scheduled'
};
function recentActivity(rec){
 if(rec.submitted_at)return 'Submitted '+localStamp(rec.submitted_at);
 if(rec.started_at)return 'Started '+localStamp(rec.started_at);
 if(rec.scheduled_at)return 'Scheduled '+shortDate(rec.scheduled_at);
 return 'No activity recorded';
}
function addAction(rec,{openPaper,openPractice}){
 if(!['submitted','released'].includes(rec.stage))return null;
 const b=text('button','mgex-open',rec.stage==='released'?'View report →':'Review working →');
 b.type='button';
 b.addEventListener('click',()=>{
  if(rec.kind==='paper')openPaper(rec.ref);
  else openPractice(rec.id);
 });
 return b;
}
export function initExaminerWorkspace(state,{openPaper,openPractice,onRefresh,onStudentFocus}){
 const root=document.getElementById('mg-examiner-workspace');
 if(!root)return {render(){},focusStudent(){}};
 const $=id=>document.getElementById(id);
 const search=$('mgex-search'),stage=$('mgex-stage'),sort=$('mgex-sort');
 let selectedId='',expandedLimit=10,refreshing=false;
 const row=(rec)=>{
  const item=text('div','mgex-activity');
  const leading=text('div','mgex-activity-main');
  leading.append(text('strong','',rec.title),text('span','',recentActivity(rec)));
  const timing=text('small','mgex-timing',rec.scheduled_at?'Scheduled '+shortDate(rec.scheduled_at)+' · '+scheduleComparison(rec.ref).label:
    'No submission deadline recorded');
  leading.append(timing);
  const right=text('div','mgex-activity-right');
  right.append(text('span','mgex-stage mgex-stage-'+rec.stage,prettyStage[rec.stage]||rec.stage));
  const button=addAction(rec,{openPaper,openPractice});if(button)right.append(button);
  item.append(leading,right);return item;
 };
 const render=()=>{
  const students=state.students||[];
  const records=sortExaminerRecords(buildExaminerRecords(students,state.attempts||[],state.assignedAllRows||[]));
  const pending=records.filter(r=>r.stage==='submitted');
  const released=records.filter(r=>r.stage==='released');
  const after=records.filter(r=>r.stage==='submitted'&&scheduleComparison(r.ref).type==='after');
  $('mgex-total').textContent=String(students.length);
  $('mgex-awaiting').textContent=String(pending.length);
  $('mgex-released').textContent=String(released.length);
  $('mgex-after').textContent=String(after.length);
  const term=search.value.trim().toLocaleLowerCase();
  const filterStage=stage.value;
  const visibleStudents=students.filter(s=>{
   if(selectedId&&s.id!==selectedId)return false;
   if(term&&!String(s.name+' '+(s.pref?.qualification||'')+' '+(s.pref?.exam_board||'')).toLocaleLowerCase().includes(term))return false;
   return filterStage==='all'||records.some(r=>r.studentId===s.id&&r.stage===filterStage);
  });
  const studentStats=s=>{
   const entries=records.filter(r=>r.studentId===s.id);
   return {student:s,entries,pending:entries.filter(x=>x.stage==='submitted').length,
    reviewed:entries.filter(x=>x.stage==='released').length,
    last:Math.max(0,...entries.map(timeNumber))};
  };
  const profiles=visibleStudents.map(studentStats);
  if(sort.value==='name')profiles.sort((a,b)=>a.student.name.localeCompare(b.student.name));
  else if(sort.value==='activity')profiles.sort((a,b)=>b.last-a.last||a.student.name.localeCompare(b.student.name));
  else profiles.sort((a,b)=>b.pending-a.pending||b.last-a.last||a.student.name.localeCompare(b.student.name));
  const directory=$('mgex-students');directory.replaceChildren();
  if(!profiles.length)directory.append(text('p','mgex-empty','No students match these filters.'));
  for(const p of profiles.slice(0,expandedLimit)){
   const card=text('article','mgex-student-card');
   const head=text('div','mgex-student-head');
   const avatar=text('span','mgex-avatar',p.student.name.split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'MG');
   const info=text('div','mgex-student-copy');
   info.append(text('h3','',p.student.name),text('p','',(p.student.pref?.qualification||'Qualification not assigned')+' · '+(p.student.pref?.exam_board||'Board to be confirmed')));
   const stats=text('div','mgex-student-stats');
   stats.append(text('span','',p.pending+' awaiting'),text('span','',p.reviewed+' released'));
   head.append(avatar,info,stats);card.append(head);
   const recent=text('div','mgex-card-activity');
   const recentRows=p.entries.filter(r=>r.stage!=='scheduled').slice(0,2);
   if(!recentRows.length)recent.append(text('p','mgex-empty','No submitted assessments yet.'));
   else for(const entry of recentRows)recent.append(row(entry));
   card.append(recent);
   const open=text('button','mgex-student-action','Open individual student record →');
   open.type='button';open.addEventListener('click',()=>focusStudent(p.student.id));
   card.append(open);directory.append(card);
  }
  const more=$('mgex-more');
  more.hidden=profiles.length<=expandedLimit;
  more.textContent='Show more learners ('+(profiles.length-expandedLimit)+' remaining)';
  const focused=$('mgex-selected');
  if(selectedId){
   const student=students.find(s=>s.id===selectedId);
   focused.hidden=false;
   $('mgex-selected-title').textContent=(student?.name||'Student')+' · Individual record';
   const activities=$('mgex-selected-activities');activities.replaceChildren();
   const data=records.filter(r=>r.studentId===selectedId&&r.stage!=='scheduled');
   if(!data.length)activities.append(text('p','mgex-empty','No work yet for this student.'));
   else for(const rec of data.slice(0,30))activities.append(row(rec));
  }else focused.hidden=true;
  const inbox=$('mgex-inbox');inbox.replaceChildren();
  const visibleInbox=pending.filter(r=>!selectedId||r.studentId===selectedId);
  if(!visibleInbox.length)inbox.append(text('p','mgex-empty','No student submissions awaiting review.'));
  else for(const rec of visibleInbox.slice(0,12)){
   const item=row(rec);
   item.prepend(text('span','mgex-inbox-name',rec.studentName));
   inbox.append(item);
  }
  $('mgex-order-note').textContent=visibleInbox.length?
   visibleInbox.length+' awaiting · oldest submission first':'All visible submissions have been reviewed.';
  $('mgex-checked').textContent='Updated '+localStamp(new Date().toISOString());
 };
 function focusStudent(id){
  selectedId=id||'';expandedLimit=10;
  if(onStudentFocus)onStudentFocus(selectedId);
  render();
  root.scrollIntoView({behavior:'smooth',block:'start'});
 }
 search.addEventListener('input',()=>{expandedLimit=10;render()});
 stage.addEventListener('change',render);sort.addEventListener('change',render);
 $('mgex-clear').addEventListener('click',()=>focusStudent(''));
 $('mgex-more').addEventListener('click',()=>{expandedLimit+=10;render()});
 $('mgex-refresh').addEventListener('click',async()=>{
  if(refreshing)return;refreshing=true;
  $('mgex-refresh').disabled=true;$('mgex-checked').textContent='Refreshing authorised records…';
  try{await onRefresh();render()}
  catch(e){$('mgex-checked').textContent='Refresh failed: '+(e?.message||'Try again')}
  finally{refreshing=false;$('mgex-refresh').disabled=false}
 });
 return {render,focusStudent,getSelectedStudent:()=>selectedId};
}
