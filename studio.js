import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { initContentBank } from './content-bank.js';
import { initAccessManagement } from './access-management.js';
import { initBaselineAdmin } from './baseline-admin.js';
import { initAssignedAdmin } from './assigned-admin.js';
import { initEditorialReview } from './editorial-review.js';
import { initSignatureEditorial } from './signature-editorial.js';
import { initStudentOffboarding } from './student-offboarding.js';
import { initExaminerWorkspace } from './examiner-workspace.js';
const $ = id => document.getElementById(id);
const config = window.MATHSGROVE_CONFIG || {};
const connected = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url || '') && !!config.publishableKey;
const db = connected ? createClient(config.url, config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}) : null;
const state = {user:null,org:null,membership:null,memberships:[],students:[],attempts:[],invites:[],entitlements:[],academic:[],addons:[],pending:[],activeReview:null,reviewFields:[],lastCode:null,lastEmail:null};
const linkedManager=initAccessManagement(db,state);
const baselineManager=initBaselineAdmin(db,state);
const assignedManager=initAssignedAdmin(db,state);
state.onAssignedRefresh=()=>{if(state.membership){renderOverview();renderQueue();examinerWorkspace.render()}};
const editorialManager=initEditorialReview(db,state);
const signatureManager=initSignatureEditorial(db,state);
const offboardingChannel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('mathsgrove-offboarding'):null;
const offboardingManager=initStudentOffboarding(db,state,{onRemoved:async(studentId)=>{
 // Discard the entire in-memory student roster and derived metrics before a fresh server read.
 state.students=[];state.attempts=[];state.invites=[];state.entitlements=[];
 state.assignedAllRows=[];state.assignedReviewRows=[];
 state.academic=[];state.addons=[];state.pending=[];
 state.activeReview=null;
 $('review-card').hidden=true;
 // Tell other open Studio tabs to discard the removed learner immediately.
 offboardingChannel?.postMessage({type:'student-removed',studentId});
 await refresh({strict:true});
 if(state.students.some(x=>x.id===studentId)||state.attempts.some(x=>x.student_id===studentId))
  throw Error('A removed student still appears in a refreshed Studio panel.');
 inform('Student removed. Overview, marking, reports, baseline, timetable, linked access and invitations have been reloaded.');
}});
const examinerWorkspace=initExaminerWorkspace(state,{
 openPaper:paper=>{setTab('marking');void openReview(paper)},
 openPractice:id=>{setTab('marking');assignedManager.openTask(id)},
 onRefresh:()=>refresh(),
 onStudentFocus:id=>{
  state.examinerSelectedStudentId=id;
  syncMarkingStudentFilter();assignedManager.setStudentFilter(id);renderQueue();
 }
});
const examLabels={IGCSE:'IGCSE Mathematics',GCSE:'GCSE Mathematics',A_LEVEL:'A Level Mathematics',FURTHER_MATHS:'A Level Further Mathematics',IB_AA:'IB Mathematics AA',IB_AI:'IB Mathematics AI',TMUA:'TMUA'};
const date=s=>s?new Date(s).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'—';
const fmt=s=>String(s||'').trim();
const status={submitted:'Awaiting marking',marked:'Released',draft:'In progress'};
const adminRole=()=>['partner','admin'].includes(state.membership?.member_role);
const markRole=()=>['examiner','partner','admin'].includes(state.membership?.member_role);
const shortId=id=>'MG-'+String(id||'').slice(0,8).toUpperCase();
function showStatus(title,description){$('status-title').textContent=title;$('status-description').textContent=description;$('status-screen').hidden=false;$('application').hidden=true;}
function inform(message,error=false,id='app-message'){const el=$(id);el.textContent=message;el.classList.toggle('error',error)}
function clear(el){el.replaceChildren()}
function make(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el}
function pill(t,cls=''){return make('span','status-pill '+cls,t)}
function itemRow(title,description,trailing){const row=make('div','record'),a=make('div');a.append(make('strong','',title),make('small','',description));row.append(a);if(trailing)row.append(trailing);return row}
function setTab(tab){
 const update=()=>{
  document.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==tab);
  document.querySelectorAll('.nav [data-tab]').forEach(b=>{
   const selected=b.dataset.tab===tab;
   b.classList.toggle('active',selected);
   if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
  if(tab==='reports')renderReleased();
  if(tab==='marking')renderQueue();
 };
 update();
}
function openStudentRemoval(){
 if(state.membership?.member_role!=='admin'){inform('Only the organisation administrator may manage complete student data exports.',true);return}
 setTab('students');
 $('mg-student-offboarding').hidden=false;
 void offboardingManager.refresh().catch(e=>inform('Student exports could not load: '+e.message,true));
 history.replaceState(null,'',location.pathname+location.search+'#student-removal');
 requestAnimationFrame(()=>$('mg-student-offboarding').scrollIntoView({behavior:'smooth',block:'start'}));
}
$('mg-offboarding-nav').addEventListener('click',openStudentRemoval);
$('mg-student-export-shortcut').addEventListener('click',openStudentRemoval);

document.querySelectorAll('.nav [data-tab]').forEach(b=>b.addEventListener('click',()=>{
 setTab(b.dataset.tab);
 if(b.dataset.tab==='students' && state.membership)void refresh();
}));
document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.goto)));
$('logout').onclick=async()=>{if(db)await db.auth.signOut();location.href='./portal.html'};
function inviteStatus(a){if(a.redeemed_at)return 'Redeemed';if(a.revoked_at)return 'Revoked';if(new Date(a.expires_at).getTime()<=Date.now())return 'Expired';return 'Awaiting claim'}
async function edge(action,body={}){if(!db)throw Error('Supabase is not configured.');const {data,error}=await db.functions.invoke('invitations',{body:{action,...body}});if(error)throw Error('Invitation service is unavailable. Check the Edge Function deployment.');if(!data?.ok)throw Error(data?.error||'Invitation request failed.');return data}
async function init(){
 if(!connected){showStatus('Supabase connection required.','The marking board is installed on GitHub, but your Supabase project must be connected before it can create student keys or save marks. No example keys will be mistaken for real credentials.');return}
 try{
  const {data:{user},error}=await db.auth.getUser();
  if(error||!user){showStatus('Please sign in first.','Use the MathsGrove portal and a verified email address. Then return to this private administration page.');return}
  state.user=user;
  const {data:memberships,error:me}=await db.from('memberships').select('org_id,member_role').eq('user_id',user.id);
  if(me)throw me;
  state.memberships=(memberships||[]).filter(x=>['admin','partner','examiner'].includes(x.member_role));
  if(!state.memberships.length){showStatus('Authorised staff only.','Your account is verified, but is not assigned an administrator, partner or examiner role. An existing administrator must authorise it.');return}
  state.membership=state.memberships.find(x=>x.member_role==='admin')||state.memberships[0];
  const canOffboard=state.membership.member_role==='admin';
  $('mg-offboarding-nav').hidden=!canOffboard;
  $('mg-student-export-shortcut').hidden=!canOffboard;
  const {data:org,error:oe}=await db.from('organisations').select('id,name').eq('id',state.membership.org_id).single();
  if(oe)throw oe;
  state.org=org;
  $('org-name').textContent=org.name;
  $('admin-name').textContent=user.email||'MathsGrove team';
  $('logout').hidden=false;
  $('status-screen').hidden=true;$('application').hidden=false;
  // Restrict sensitive administrative actions to organisation owners/partners.
  if(!adminRole()){
   $('programme-form').querySelectorAll('input,select,button').forEach(x=>x.disabled=true);
   $('invite-form').querySelectorAll('input,select,textarea,button').forEach(x=>x.disabled=true);
   $('mg-linked-form').querySelectorAll('input,select,button').forEach(x=>x.disabled=true);
   $('invite-feedback').textContent='Only an authorised partner administrator can issue or revoke student invitation keys.';
  }
  await refresh();
  initContentBank(db,state);
  if(location.hash==='#student-removal' && state.membership?.member_role==='admin')openStudentRemoval();
  else setTab('overview');
 }catch(e){showStatus('Could not open the studio.','The secure connection could not verify your permissions: '+(e?.message||'Unknown error'));}
}
async function refresh({strict=false}={}){
 const issues=[];
 const results=await Promise.allSettled([loadRoster(),loadAttempts(),loadInvites(),loadProgrammes(),loadStudentSetups()]);
 const failures=results.filter(x=>x.status==='rejected').map(x=>x.reason?.message||'Unknown error');
 if(failures.length){issues.push(...failures);inform('Some studio data could not load: '+failures.join(' | '),true);}
 renderOverview();renderRoster();renderInvites();renderProgrammes();syncMarkingStudentFilter();renderQueue();renderReleased();examinerWorkspace.render();
 const inspect=async(label,task)=>{
  try{await task()}catch(err){
   const reason=label+': '+(err?.message||String(err));
   issues.push(reason);inform(reason,true);
  }
 };
 if(adminRole())await inspect('Linked access',()=>linkedManager.refresh());
 await inspect('Baseline register',()=>baselineManager.refresh());
 await inspect('Assigned practice',()=>assignedManager.refresh());
 await inspect('Signature editorial',()=>signatureManager.refresh());
 if(adminRole())await inspect('Editorial register',()=>editorialManager.refresh());
 if(state.membership?.member_role==='admin')await inspect('Student archive register',()=>offboardingManager.refresh());
 if(strict&&issues.length)throw Error('Some dashboards could not reload: '+issues.join(' | '));
}

async function loadRoster(){
 const {data,error}=await db.from('memberships').select('user_id,member_role').eq('org_id',state.membership.org_id).eq('member_role','student').limit(200);
 if(error)throw error;
 const members=data||[],ids=members.map(x=>x.user_id);
 if(!ids.length){state.students=[];return}
 const [p,q]=await Promise.all([
  db.from('profiles').select('id,display_name').in('id',ids),
  db.from('student_preferences').select('student_id,qualification,exam_board,tier').in('student_id',ids)
 ]);
 if(p.error||q.error)throw p.error||q.error;
 const names=new Map((p.data||[]).map(x=>[x.id,x.display_name]));
 const prefs=new Map((q.data||[]).map(x=>[x.student_id,x]));
 state.students=ids.map(id=>({id,name:names.get(id)||'Enrolled student',pref:prefs.get(id)||null}));
}
async function loadProgrammes(){
 const {data,error}=await db.from('student_entitlements')
 .select('student_id,org_id,tier,signature_credits,starts_at,ends_at').eq('org_id',state.membership.org_id).limit(200);
 if(error){state.entitlements=[];return}
 state.entitlements=data||[];
}
async function loadStudentSetups(){
 if(!adminRole()){state.academic=[];state.addons=[];state.pending=[];return}
 const [academic,addons,pending]=await Promise.all([
  db.from('student_academic_settings').select('student_id,org_id,focus_topics,staff_notes,target_grade').eq('org_id',state.membership.org_id).limit(200),
  db.from('student_service_addons').select('student_id,service_type,quantity').eq('org_id',state.membership.org_id).limit(600),
  db.from('pending_student_setups').select('org_id,email,qualification,exam_board,exam_tier,programme,ends_at,focus_topics,staff_notes,add_ons').eq('org_id',state.membership.org_id).limit(200)
 ]);
 // The interface is also safe during database upgrade: the save RPC will explain
 // that the new migration must be installed before issuing configured keys.
 state.academic=academic.data||[];state.addons=addons.data||[];state.pending=pending.data||[];
}
const setupSuffix=['signature','advanced','specialist'];
const programmeDesc={
 weekly:'4 marked weekly question sets · monthly progress report',
 daily:'Fresh daily opportunities (7 days per week) · weekly progress report',
 exam:'Grove Daily plus one timed mock each month · exam outlook · proposed linked tutor/guardian access'
};
const defaultAccessDate=()=>{
 const d=new Date();d.setMonth(d.getMonth()+1);return d.toISOString().slice(0,10)
};
function setupAddons(prefix){
 const values=setupSuffix.map(k=>Number($(prefix+'-'+(k==='signature'&&prefix==='programme'?'credits':k)).value));
 if(values.some(v=>!Number.isInteger(v)||v<0||v>20))throw Error('Add-on quantities must be whole numbers between 0 and 20.');
 return{signature:values[0],signature_advanced:values[1],specialist_review:values[2]};
}
const routeLevels={
 GCSE:{test:/^(foundation|higher)$/i,example:'Foundation or Higher'},
 IGCSE:{test:/^(core|extended)$/i,example:'Core or Extended'},
 A_LEVEL:{test:/^(as|a2|year 12|year 13|full)$/i,example:'AS or A2'},
 IB_AA:{test:/^(sl|hl|standard|higher)$/i,example:'SL or HL'},
 IB_AI:{test:/^(sl|hl|standard|higher)$/i,example:'SL or HL'},
 FURTHER_MATHS:{test:/^.+$/,example:'Further'},
 TMUA:{test:/^.+$/,example:'TMUA'}
};
function guideAcademicRoute(){
 const qualification=$('invite-qualification').value,route=routeLevels[qualification];
 const hint=$('mg-invite-level-hint');
 if(route){
  $('invite-level').placeholder=route.example;
  hint.textContent='Choose '+route.example+' to match a moderated 20-question diagnostic.';
 }else hint.textContent='Choose a qualification first, then assign the corresponding academic level.';
}
$('invite-qualification').addEventListener('change',()=>{
 $('invite-level').value='';
 guideAcademicRoute();
});
guideAcademicRoute();
function setupArgs(prefix,student){
 const p=prefix==='invite'?'invite-programme':'programme-tier';
 const qualification=$(prefix+'-qualification').value,level=$(prefix+'-level').value.trim();
 const route=routeLevels[qualification];
 if(!route||!route.test.test(level))throw Error('Set a valid academic level for '+qualification+'. Choose '+(route?.example||'a supported exam route')+'. This is required for the initial 20-question baseline.');
 const until=$(prefix+'-until').value;
 if(!until)throw Error('Choose an access end date.');
 const expiry=new Date(until+'T23:59:59.000Z');
 if(!(expiry>new Date()))throw Error('Access end date must be in the future.');
 return{
  p_qualification:$(prefix+'-qualification').value,
  p_board:$(prefix+'-board').value.trim(),
  p_level:$(prefix+'-level').value.trim(),
  p_programme:$(p).value,p_ends_at:expiry.toISOString(),
  p_focus:$(prefix+'-focus').value.trim(),
  p_notes:$(prefix+'-notes').value.trim(),
  p_addons:setupAddons(prefix),
  ...(prefix==='invite'?{p_org:state.membership.org_id,p_email:$('invite-email').value.trim().toLowerCase()}:{p_student:student})
 };
}
function fillAddons(prefix,addons){
 const lookup={signature:'signature',advanced:'signature_advanced',specialist:'specialist_review'};
 for(const k of setupSuffix){
  const id=prefix+'-'+(prefix==='programme'&&k==='signature'?'credits':k);
  $(id).value=Number(addons?.[lookup[k]]||0);
 }
}
function renderProgrammes(){
 const select=$('programme-student'),previous=select.value;
 select.replaceChildren(new Option('Choose a verified student',''));
 for(const student of state.students)select.add(new Option(student.name+' · '+shortId(student.id),student.id));
 if([...select.options].some(o=>o.value===previous))select.value=previous;
 if(select.value)fillStudentEditor(select.value);
 if(!$('invite-until').value)$('invite-until').value=defaultAccessDate();
}
function fillStudentEditor(id){
 const st=state.students.find(x=>x.id===id),plan=state.entitlements.find(x=>x.student_id===id),
   extra=state.academic.find(x=>x.student_id===id);
 if(!st)return;
 const pref=st.pref||{};
 $('programme-qualification').value=pref.qualification||'GCSE';
 $('programme-board').value=pref.exam_board||'';
 $('programme-level').value=pref.tier||'';
 $('programme-tier').value=plan?.tier||'weekly';
 $('programme-until').value=plan?.ends_at?plan.ends_at.slice(0,10):defaultAccessDate();
 $('programme-focus').value=extra?.focus_topics||'';
 $('programme-notes').value=extra?.staff_notes||'';
 $('programme-target-grade').value=extra?.target_grade||'';
 const addons={};for(const a of state.addons.filter(x=>x.student_id===id))addons[a.service_type]=a.quantity;
 fillAddons('programme',addons);
}
$('programme-student').onchange=()=>fillStudentEditor($('programme-student').value);
$('programme-form').onsubmit=async e=>{
 e.preventDefault();if(!adminRole())return;
 const button=$('programme-save'),student=$('programme-student').value;
 if(!student){inform('Select a verified student first.',true,'programme-feedback');return}
 button.disabled=true;
 try{
  const payload=setupArgs('programme',student);
  const {data,error}=await db.rpc('update_student_setup',payload);
  if(error||!data?.ok)throw Error(error?.message||'Student settings could not be saved.');
  const target=$('programme-target-grade').value.trim();
  const {data:gradeResult,error:gradeError}=await db.rpc('grove_admin_set_target',{p_student:student,p_grade:target});
  if(gradeError||!gradeResult?.ok)throw Error('Programme saved, but target grade was not updated: '+(gradeError?.message||'Please try again.'));
  await Promise.all([loadRoster(),loadProgrammes(),loadStudentSetups()]);
  renderRoster();renderProgrammes();
  inform('Saved exam information, programme, target grade and add-ons. Previous submissions and reports remain unchanged.',false,'programme-feedback');
 }catch(err){inform(err.message,true,'programme-feedback')}
 finally{button.disabled=false}
};
function loadPendingIntoForm(email){
 const p=state.pending.find(x=>x.email===email);if(!p)return;
 $('invite-email').value=p.email;
 $('invite-qualification').value=p.qualification;
 $('invite-board').value=p.exam_board||'';
 $('invite-level').value=p.exam_tier||'';
 $('invite-programme').value=p.programme;
 $('invite-until').value=p.ends_at.slice(0,10);
 $('invite-focus').value=p.focus_topics||'';
 $('invite-notes').value=p.staff_notes||'';
 fillAddons('invite',p.add_ons);
 $('invite-form').scrollIntoView({behavior:'smooth',block:'start'});
 inform('Pending configuration loaded. Saving will replace any existing unused key for this email.',false,'invite-feedback');
}
$('invite-email').addEventListener('blur',()=>{
 const email=$('invite-email').value.trim().toLowerCase();
 if(state.pending.some(p=>p.email===email))loadPendingIntoForm(email)
});
async function loadAttempts(){
 // Timed sessions are closed by the server-side scheduled jobs.
 // Do not call the retired finalize_expired_mock_sessions RPC (404).
 const {data,error}=await db.from('attempts').select('id,student_id,org_id,qualification,paper_mode,status,started_at,submitted_at')
  .eq('org_id',state.membership.org_id).order('started_at',{ascending:false}).limit(150);
 if(error)throw error;
 state.attempts=data||[];
}
async function loadInvites(){
 if(!adminRole()){state.invites=[];return}
 const result=await edge('list',{orgId:state.membership.org_id});
 state.invites=result.invitations||[];
}
function renderOverview(){
 const students=state.students,attempts=state.attempts;
 const assigned=state.assignedReviewRows||[];
 const openReviewCount=attempts.filter(x=>x.status==='submitted').length+assigned.length;
 const releasedPractice=state.assignedReleasedCount||0;
 $('s-students').textContent=students.length;
 $('s-invites').textContent=state.invites.filter(x=>inviteStatus(x)==='Awaiting claim').length;
 $('s-awaiting').textContent=openReviewCount;
 $('s-marked').textContent=attempts.filter(x=>x.status==='marked').length+releasedPractice;
 window.MGInsights?.studio({students:students.map(s=>({id:s.id})),attempts:attempts.map(a=>({status:a.status,started_at:a.started_at})),entitlements:state.entitlements.map(e=>({student_id:e.student_id,tier:e.tier,starts_at:e.starts_at,ends_at:e.ends_at})),assignedOpen:assigned.length,assignedReleased:releasedPractice,capped:attempts.length>=150});
 const hour=new Date().getHours(),greeting=hour<12?'Good morning.':hour<17?'Good afternoon.':'Good evening.';
 $('mg-admin-greeting').textContent=greeting;
 const pending=state.invites.filter(x=>inviteStatus(x)==='Awaiting claim').length;
 const awaiting=openReviewCount;
 $('mg-admin-priority').textContent=awaiting
  ?awaiting+' submitted assessment'+(awaiting===1?' is':'s are')+' awaiting an examiner. Open Marking to inspect working and release feedback.'
  :pending?'You have '+pending+' invitation'+(pending===1?'':'s')+' awaiting activation. Your student register is ready when they sign in.'
  :students.length?'Everything is up to date. '+students.length+' enrolled learner'+(students.length===1?'':'s')+' in your workspace.'
  :'Your workspace is ready. Enrol your first learner to begin the welcome and baseline journey.';
 const root=$('recent-attempts');clear(root);
 const queue=attempts.filter(x=>x.status==='submitted').slice(0,5);
 const scheduled=assigned.slice().sort((a,b)=>String(b.due_date).localeCompare(String(a.due_date))).slice(0,5);
 if(!queue.length&&!scheduled.length){root.append(make('p','empty','No assignments currently awaiting marking.'));return}
 for(const a of queue){const student=students.find(x=>x.id===a.student_id);
 const button=make('button','link-action','Review →');button.onclick=()=>{setTab('marking');void openReview(a)};
 root.append(itemRow(student?.name||'Student', (examLabels[a.qualification]||a.qualification)+' · Submitted '+date(a.submitted_at),button))}
 for(const task of scheduled.slice(0,Math.max(0,5-queue.length))){
  const label=({weekly:'Grove Weekly',daily:'Grove Daily',exam_daily:'Grove Exam · Daily'})[task.mode]||'Assigned practice';
  const button=make('button','link-action','Mark working →');
  button.onclick=()=>{setTab('marking');const panel=$('mg-assigned-admin');panel?.scrollIntoView({behavior:'smooth',block:'start'})};
  root.append(itemRow(task.student_name||'Student',label+' · '+task.due_date+' · '+(task.question_count||0)+' questions',button));
 }
}
function renderRoster(){
 const root=$('students-body');clear(root);
 const term=$('student-search').value.trim().toLowerCase();
 const filtered=state.students.filter(x=>(x.name+' '+x.id+' '+(x.pref?.qualification||'')).toLowerCase().includes(term));
 if(!filtered.length){const row=make('tr'),cell=make('td','','No enrolled students match your search.');cell.colSpan=4;row.append(cell);root.append(row);return}
 for(const student of filtered){
  const row=make('tr');
  const name=make('td');name.append(make('strong','',student.name));if(adminRole()){const issued=state.invites.find(i=>i.redeemed_by===student.id);if(issued)name.append(make('small','',issued.email))}
  const ref=make('td','',shortId(student.id));
  const route=make('td','',student.pref?(examLabels[student.pref.qualification]||student.pref.qualification)+(student.pref.exam_board?' · '+student.pref.exam_board:''):'Not selected');
  const count=state.attempts.filter(x=>x.student_id===student.id&&x.status==='draft').length;
  const plan=state.entitlements.find(e=>e.student_id===student.id);
  const programmeNote=make('small','',plan?'Programme: '+({weekly:'Grove Weekly',daily:'Grove Daily',exam:'Grove Exam'}[plan.tier]||plan.tier):'Programme: not yet assigned');
  name.append(programmeNote);
  const profile=make('button','link-action roster-profile','View individual progress →');
  profile.type='button';profile.onclick=()=>{setTab('overview');examinerWorkspace.focusStudent(student.id)};
  name.append(profile);
  if(adminRole()){
   const edit=make('button','link-action roster-edit','Edit learner ↗');
   edit.type='button';edit.onclick=()=>{setTab('students');$('programme-student').value=student.id;fillStudentEditor(student.id);$('programme-admin').scrollIntoView({behavior:'smooth',block:'start'})};
   name.append(edit);
  }
  row.append(name,ref,route,make('td','',count));root.append(row);
 }
}
$('student-search').oninput=renderRoster;
function renderInvites(){
 const root=$('invite-table');clear(root);
 if(!adminRole()){root.append(make('p','empty','Invitations are managed by authorised partner administrators.'));return}
 if(!state.invites.length){root.append(make('p','empty','No invitations issued yet.'));return}
 state.invites.slice(0,60).forEach(inv=>{
  const label=inviteStatus(inv);
  const group=make('div','record-actions');
  group.append(pill(label,label==='Redeemed'?'done':label==='Awaiting claim'?'':'danger'));
  if(label==='Awaiting claim'){
   const revoke=make('button','link-action','Revoke');
   revoke.onclick=async()=>{if(!confirm('Revoke the invitation for '+inv.email+'? This code will stop working.'))return;
     revoke.disabled=true;try{await edge('revoke',{orgId:state.membership.org_id,invitationId:inv.id});inform('Invitation revoked.');await loadInvites();renderInvites();renderOverview()}catch(e){inform(e.message,true)}finally{revoke.disabled=false}};
   group.append(revoke);
  }
  const assigned=state.pending.find(p=>p.email===inv.email);
  const description=date(inv.created_at)+' · Expires '+date(inv.expires_at)+
   (assigned?' · '+({weekly:'Grove Weekly',daily:'Grove Daily',exam:'Grove Exam'}[assigned.programme]||assigned.programme)+
   ' · '+(examLabels[assigned.qualification]||assigned.qualification):'');
  if(assigned&&label==='Awaiting claim'){
   const edit=make('button','link-action','Edit setup');edit.type='button';
   edit.onclick=()=>loadPendingIntoForm(inv.email);group.append(edit);
  }
  root.append(itemRow(inv.email,description,group));
 })
}
$('invite-form').onsubmit=async e=>{
 e.preventDefault();if(!adminRole())return;
 const email=$('invite-email').value.trim().toLowerCase();
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){
  inform('Enter a valid student email.',true,'invite-feedback');return}
 const button=$('invite-submit');button.disabled=true;$('key-result').hidden=true;
 try{
  // Programme configuration is saved before issuing a key. If this RPC fails
  // (e.g., migration missing), do not create an incomplete invitation.
  const setup=setupArgs('invite');
  const {data:configured,error:setupError}=await db.rpc('save_pending_student_setup',setup);
  if(setupError||!configured?.ok)throw Error(setupError?.message||'Setup was not saved. Install the administrator SQL migration before issuing keys.');
  const name=$('invite-name').value.trim();
  if(name.length<2||name.length>100)throw Error('Enter the student’s full name (2–100 characters).');
  const {data:nameSaved,error:nameError}=await db.rpc('set_pending_student_name',{p_org:state.membership.org_id,p_email:email,p_name:name});
  if(nameError||!nameSaved?.ok)throw Error(nameError?.message||'Student name not saved. Install the email-first database migration.');
  const top=setup.p_programme==='exam';
  const parent=top?$('invite-parent-email').value.trim().toLowerCase():'';
  const tutor=top?$('invite-tutor-email').value.trim().toLowerCase():'';
  const {data:links,error:linkError}=await db.rpc('configure_learner_viewers',{p_org:state.membership.org_id,p_student_email:email,p_parent_email:parent,p_tutor_email:tutor});
  if(linkError||!links?.ok)throw Error(linkError?.message||'Linked account permissions could not be saved.');
  const response=await edge('issue',{email,orgId:state.membership.org_id});
  state.lastCode=response.code;state.lastEmail=email;
  $('new-code').textContent=response.code;$('key-result').hidden=false;
  inform('Student access created. Share the welcome message. The student signs in with their verified email; Grove Exam parent and tutor invitations become usable after student activation.',false,'invite-feedback');
  await Promise.all([loadInvites(),loadStudentSetups()]);
  renderInvites();renderOverview();await linkedManager.refresh();
 }catch(err){inform(err.message,true,'invite-feedback')}
 finally{button.disabled=false}
};
async function copy(t){try{await navigator.clipboard.writeText(t);inform('Copied to clipboard.','','invite-feedback')}catch{inform('Clipboard access unavailable. Select the code above and copy it manually.',true,'invite-feedback')}}
$('copy-code').onclick=()=>state.lastCode&&copy(state.lastCode);
$('copy-message').onclick=()=>state.lastCode&&copy(
 'Welcome to MathsGrove. Your private mathematics dashboard has been prepared. Open '+new URL('./portal.html',location.href).href+
 ' and enter your registered email ('+state.lastEmail+
 ') to receive a private sign-in email. Open the secure link to access your authorised dashboard. No password or invitation key is required. Keep the link private.');
function renderQueue(){
 const root=$('marking-queue');clear(root);
 const filter=$('marking-filter').value;
 const selected=state.examinerSelectedStudentId||'';
 const matched=state.attempts.filter(a=>(filter==='all'||a.status===filter)&&(!selected||a.student_id===selected))
   .sort((a,b)=>filter==='marked'
     ?Date.parse(b.submitted_at||b.started_at)-Date.parse(a.submitted_at||a.started_at)
     :Date.parse(a.submitted_at||a.started_at)-Date.parse(b.submitted_at||b.started_at));
 if(!matched.length){root.append(make('p','empty','No assessments match this filter.'));return}
 for(const a of matched){
  const student=state.students.find(x=>x.id===a.student_id);
  const btn=make('button','link-action','Open review →');
  btn.onclick=()=>void openReview(a);
  const trailing=make('div','record-actions');trailing.append(pill(status[a.status]||a.status,a.status==='marked'?'done':''),btn);
  const timing=a.submitted_at?'Submitted '+new Date(a.submitted_at).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'})
    :'Started '+new Date(a.started_at).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'});
  root.append(itemRow(student?.name||'Student',
   (examLabels[a.qualification]||a.qualification)+' · '+timing+' · No separate due date recorded',trailing));
 }
}
function syncMarkingStudentFilter(){
 const input=$('marking-student-filter');
 const selected=state.examinerSelectedStudentId||'';
 input.replaceChildren(new Option('All students',''));
 for(const s of [...state.students].sort((a,b)=>a.name.localeCompare(b.name)))
  input.add(new Option(s.name,s.id));
 if(selected&&state.students.some(s=>s.id===selected))input.value=selected;
 else{input.value='';state.examinerSelectedStudentId=''}
 assignedManager.setStudentFilter(state.examinerSelectedStudentId||'');
}
$('marking-student-filter').onchange=()=>{
 state.examinerSelectedStudentId=$('marking-student-filter').value||'';
 assignedManager.setStudentFilter(state.examinerSelectedStudentId);
 renderQueue();
};
$('marking-filter').onchange=renderQueue;
$('refresh-marking').onclick=async()=>{await refresh();inform('Queue refreshed.')};
$('close-review').onclick=()=>{$('review-card').hidden=true;state.activeReview=null;state.reviewFields=[]};
async function openReview(attempt){
 try{
  if(!markRole())throw Error('Only authorised staff can review work.');
  if(attempt.status==='draft')throw Error('A student must submit the paper before it can be marked.');
  state.activeReview=attempt;
  const [ar,qr,fr,rr]=await Promise.all([
   db.from('answers').select('question_id,typed_answer,difficulty,confidence,clarity').eq('attempt_id',attempt.id),
   db.from('question_bank').select('id,topic,prompt,marks').eq('qualification',attempt.qualification),
   db.from('answer_files').select('question_id,storage_path,original_name,file_kind').eq('attempt_id',attempt.id),
   db.from('reviews').select('id,question_id,marks_awarded,feedback').eq('attempt_id',attempt.id)
  ]);
  for(const r of [ar,qr,fr,rr])if(r.error)throw r.error;
  const answers=ar.data||[],qmap=new Map((qr.data||[]).map(x=>[x.id,x]));
  const rmap=new Map((rr.data||[]).map(x=>[x.question_id,x]));
  const questionIds=answers.map(x=>x.question_id);
  const {data:schemes,error:schemeErr}=await db.from('mark_schemes').select('question_id,scheme').in('question_id',questionIds);
  if(schemeErr)throw schemeErr;
  const schemeMap=new Map((schemes||[]).map(x=>[x.question_id,x.scheme]));
  const root=$('review-questions');clear(root);state.reviewFields=[];
  const name=state.students.find(x=>x.id===attempt.student_id)?.name||'Student';
  $('review-title').textContent=name+' — '+(examLabels[attempt.qualification]||attempt.qualification);
  $('review-caption').textContent=shortId(attempt.student_id)+' · '+(attempt.status==='marked'?'Previously released':'Awaiting examiner review');
  if(!answers.length){root.append(make('p','empty','No saved answers found for this paper.'));$('review-card').hidden=false;return}
  for(let i=0;i<answers.length;i++){
   const answer=answers[i],q=qmap.get(answer.question_id);if(!q)continue;
   const section=make('section','review-question');
   section.append(make('h3','','Question '+(i+1)+' · '+q.topic+' · '+q.marks+' marks'));
   const prompt=make('p','prompt');if(window.MathsGroveMath)window.MathsGroveMath.write(prompt,q.prompt);else prompt.textContent=q.prompt;section.append(prompt);
   const work=make('div','student-work',answer.typed_answer||'No typed response; check the student’s attached working.');
   section.append(work);
   section.append(make('p','reflection','Student confidence: '+(answer.confidence||'Not provided')+'  ·  Difficulty: '+(answer.difficulty||'Not provided')+'  ·  Clarity: '+(answer.clarity||'Not provided')));
   const scheme=schemeMap.get(q.id);
   if(scheme){const details=make('details');const summary=make('summary','','Approved marking guidance');const guidance=make('p','student-work');if(window.MathsGroveMath)window.MathsGroveMath.write(guidance,scheme);else guidance.textContent=scheme;details.append(summary,guidance);section.append(details)}
   const attachments=make('div','files');
   for(const file of (fr.data||[]).filter(f=>f.question_id===q.id)){
     const details=make('details','examiner-attachment');
     const summary=make('summary','','View '+(file.file_kind==='drawing'?'graph-paper drawing':'notebook photograph')+' · '+file.original_name);
     details.append(summary);
     details.addEventListener('toggle',async()=>{
       if(!details.open||details.dataset.loaded)return;
       try{
         const {data,error}=await db.storage.from('student-work').createSignedUrl(file.storage_path,120);
         if(error)throw error;
         const img=make('img');img.loading='lazy';img.alt='Student-submitted '+(file.file_kind==='drawing'?'digital working':'photograph of handwritten work');
         img.src=data.signedUrl;
         const link=make('a','link-action','Open full-size image ↗');link.href=data.signedUrl;link.target='_blank';link.rel='noopener noreferrer';
         details.append(img,link);details.dataset.loaded='true';
       }catch(e){inform('Unable to preview attached working: '+e.message,true)}
     });
     attachments.append(details);
   }
   section.append(attachments);
   const fields=make('div','review-fields');
   const marklabel=make('label','','Marks / '+q.marks),mark=make('input');
   mark.type='number';mark.min='0';mark.max=String(q.marks);mark.step='1';mark.required=true;
   const existing=rmap.get(q.id);mark.value=existing?.marks_awarded??'';
   marklabel.append(mark);
   const commentlabel=make('label','','Examiner feedback'),comment=make('textarea');comment.rows=3;comment.maxLength=5000;
   comment.placeholder='What did the student understand? What should they improve next?';comment.value=existing?.feedback||'';
   commentlabel.append(comment);fields.append(marklabel,commentlabel);section.append(fields);root.append(section);
   state.reviewFields.push({question:q,mark,comment,existing});
  }
  const {data:summary,error:summaryError}=await db.from('review_summaries')
   .select('overview,strengths,gaps,next_steps,readiness_note').eq('attempt_id',attempt.id).maybeSingle();
  if(summaryError)inform('Detailed report fields unavailable until the new Supabase migration is installed.',true);
  for(const [id,key] of [['n-overview','overview'],['n-strengths','strengths'],['n-gaps','gaps'],['n-next-steps','next_steps'],['n-readiness','readiness_note']]){
   $(id).value=summary?.[key]||'';$(id).readOnly=attempt.status==='marked';
  }
  $('review-confirm').checked=false;$('review-card').hidden=false;
  $('release-review').disabled=attempt.status==='marked';
  $('save-review').disabled=attempt.status==='marked';
  if(attempt.status==='marked'){for(const field of state.reviewFields){field.mark.readOnly=true;field.comment.readOnly=true}}
  $('review-card').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(err){inform('Unable to load the paper: '+err.message,true)}
}
function validateReview(releasing){
 if(!state.activeReview||!state.reviewFields.length)throw Error('No submitted answers available to mark.');
 for(const field of state.reviewFields){const value=Number(field.mark.value);
  if(field.mark.value===''||!Number.isInteger(value)||value<0||value>field.question.marks)throw Error('Enter a whole-number mark from 0 to '+field.question.marks+' for each question.');
  if(releasing&&!field.comment.value.trim())throw Error('Enter feedback for every question before releasing the paper.');
 }
 if(releasing){
  const needed=[['n-overview',25],['n-strengths',15],['n-gaps',15],['n-next-steps',15]];
  for(const [id,len] of needed)if($(id).value.trim().length<len)throw Error('Complete the detailed examiner report before release (minimum '+len+' characters per required section).');
 }
 if(releasing&&!$('review-confirm').checked)throw Error('Confirm you have checked all marks and feedback.');
}
async function writeReview(releasing){
 const buttons=[$('save-review'),$('release-review')];buttons.forEach(b=>b.disabled=true);
 try{
  validateReview(releasing);
  const attempt=state.activeReview;
  if(attempt.status==='marked')throw Error('This report is already released and locked.');
  const items=state.reviewFields.map(field=>({
   question_id:field.question.id,
   marks_awarded:Number(field.mark.value),
   feedback:field.comment.value.trim()
  }));
  const {data:summarySaved,error:summaryError}=await db.rpc('save_review_summary',{
  p_attempt:attempt.id,
  p_overview:$('n-overview').value.trim(),p_strengths:$('n-strengths').value.trim(),
  p_gaps:$('n-gaps').value.trim(),p_next_steps:$('n-next-steps').value.trim(),
  p_readiness_note:$('n-readiness').value.trim()
 });
 if(summaryError||!summarySaved?.ok)throw Error(summaryError?.message||'Examiner narrative could not be saved.');
 // One Postgres transaction validates all marks and saves/release all at once.
  const {data,error}=await db.rpc('save_marking_review',{
    p_attempt:attempt.id,p_items:items,p_release:releasing
  });
  if(error)throw error;
  if(!data?.ok)throw Error('The database did not confirm that the review was saved.');
  if(releasing){
   $('review-card').hidden=true;state.activeReview=null;
   inform('Examiner assessment released to the student dashboard.');
  }else{inform('Draft examiner marks saved privately. They are not yet visible to the student.')}
  await loadAttempts();renderOverview();renderQueue();renderReleased();
 }catch(err){inform('Review not saved: '+err.message,true)}
 finally{buttons.forEach(b=>b.disabled=false);if(state.activeReview?.status==='marked')buttons.forEach(b=>b.disabled=true)}
}
$('save-review').onclick=()=>void writeReview(false);
$('release-review').onclick=()=>void writeReview(true);
function renderReleased(){
 const root=$('released-list');clear(root);
 const done=state.attempts.filter(a=>a.status==='marked');
 if(!done.length){root.append(make('p','empty','No examiner reports have been released yet.'));return}
 for(const a of done){const st=state.students.find(x=>x.id===a.student_id);
 const button=make('button','link-action','View marks →');button.onclick=()=>{setTab('marking');void openReview(a)};
 root.append(itemRow(st?.name||'Student',(examLabels[a.qualification]||a.qualification)+' · '+date(a.submitted_at),button))}
}
document.addEventListener('visibilitychange',()=>{
 if(!document.hidden&&state.membership)void refresh();
});
window.addEventListener('pageshow',event=>{
 if(event.persisted&&state.membership)void refresh();
});
offboardingChannel?.addEventListener('message',event=>{
 if(event.data?.type==='student-removed'&&state.membership)void refresh();
});

void init();
