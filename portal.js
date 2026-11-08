import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import {getAccessChoices,preferredSingleChoice} from './access-router.js';
import {initAssignedPractice} from './assigned-practice.js';
import {initPasswordAccess} from './auth-password.js';
import {initStudentWelcome} from './student-welcome.js';
import {initStudentReleaseFeed} from './student-release-feed.js';
import {renderStudentProof,clearProgressEvidence} from './progress-evidence.js';
const $=id=>document.getElementById(id);
const config=window.MATHSGROVE_CONFIG||{};
const configured=Boolean(config.url&&config.publishableKey&&/^https:\/\//.test(config.url)&&!config.url.includes('YOUR_PROJECT'));
const sb=configured?createClient(config.url,config.publishableKey,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}}):null;
const state={entitlement:null,user:null,member:null,members:[],profile:null,preference:null,attempts:[],questions:[],attempt:null,question:0,answer:null,autosave:null,photos:[],pen:false,eraser:false,drawingChanged:false,mouseDown:false,mockClock:null,mockSeconds:0,mockAnchor:0,mockFinalizing:false,mockQuestionTimes:{},questionTimer:null,questionActiveId:null,questionEntered:0,questionElapsed:{}};
const assignedPractice=sb?initAssignedPractice(sb):null;
const studentReleaseFeed=initStudentReleaseFeed({
 onRefresh:()=>refreshStudentReleases(),
 onOpenPaper:paper=>{showPanel('progress');void viewPaperRecord(paper)}
});
const passwordAccess=initPasswordAccess(sb,{show,boot});
const studentWelcome=initStudentWelcome(sb,{show,continueToDashboard:dashboard});
const quals={IGCSE:'IGCSE Mathematics',GCSE:'GCSE Mathematics',A_LEVEL:'A Level Mathematics',FURTHER_MATHS:'A Level Further Mathematics',IB_AA:'IB Mathematics: Analysis & Approaches',IB_AI:'IB Mathematics: Applications & Interpretation',TMUA:'TMUA'};
function show(id){['loading-view','configure-view','login-view','claim-view','role-view','dashboard-view','security-view','student-onboarding-view'].forEach(x=>$(x).hidden=x!==id)}
function text(id,value){$(id).textContent=String(value??'')}
function message(id,s,error=false){let e=$(id);e.textContent=s;e.classList.toggle('is-error',error)}
function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function labelState(s){return ({draft:'In progress',submitted:'Awaiting examiner',marked:'Reviewed'})[s]||s}
function friendlyError(e){return e?.message||'Something went wrong. Please try again.'}
function requireReady(){if(!sb)throw Error('The Supabase connection is not configured yet.')}
function isStaff(){return state.member&&['partner','examiner','admin'].includes(state.member.member_role)}
function isPartner(){return state.member&&['partner','admin'].includes(state.member.member_role)}
function showPanel(id){
 const update=()=>{
  document.querySelectorAll('.dash-panel').forEach(e=>e.hidden=e.id!==id+'-panel');
  document.querySelectorAll('[data-view]').forEach(b=>{
   const selected=b.dataset.view===id;
   b.classList.toggle('active',selected);
   if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
  if(id==='papers')renderPaperList();
  if(id==='progress')renderProgress();
  if(id==='mocks')void loadAssignedMocks();
 };
 update();
}
function initials(name){return (name||'Student').trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()||'').join('')||'MG'}
async function requestLink(e){
 e.preventDefault();
 const button=$('send-link');
 button.disabled=true;
 try{
  requireReady();
  const email=$('access-email').value.trim().toLowerCase();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||email.length>250)throw Error('Enter a valid registered email address.');
  const code=$('access-code').value.trim().toUpperCase().replace(/\s/g,'');
  if(code&&!/^MG-[0-9A-F]{8}-[0-9A-F]{8}-[0-9A-F]{8}$/.test(code))throw Error('Use the full MG-... value if you have a legacy recovery key.');
  if(code)sessionStorage.setItem('mathsgrove_pending_code',code);
  else sessionStorage.removeItem('mathsgrove_pending_code');
  const {error}=await sb.auth.signInWithOtp({
   email,
   options:{emailRedirectTo:new URL('./portal.html',location.href).href}
  });
  if(error)throw error;
  message('login-message','Check your inbox for the secure MathsGrove sign-in link. Open it to continue to your authorised dashboard. Keep your link private.');
 }catch(err){message('login-message',friendlyError(err),true)}
 finally{button.disabled=false}
}
async function redeem(code){const {data,error}=await sb.functions.invoke('invitations',{body:{action:'redeem',code:code.trim().toUpperCase()}});if(error)throw Error('Invitation could not be verified. Ensure your code matches the email address you used.');if(!data?.ok)throw Error(data?.error||'Invitation could not be redeemed.');sessionStorage.removeItem('mathsgrove_pending_code');return data}
async function loadMembership(){
 const {data,error}=await sb.from('memberships').select('org_id,member_role').eq('user_id',state.user.id).limit(20);
 if(error)throw error;
 state.members=data||[];
 state.member=state.members.find(x=>x.member_role==='student')||state.members[0]||null;
 return state.member;
}
async function linkedAccess(){
 // Role data is not supplied by the login form: it comes from verified-email,
 // account-bound Supabase functions. A missing migration cannot grant access.
 const claim=await sb.rpc('claim_my_learner_views');
 if(claim.error)return {learners:[],awaiting:0,error:claim.error};
 const view=await sb.rpc('get_my_learner_views');
 if(view.error)return {learners:[],awaiting:0,error:view.error};
 return {
  learners:Array.isArray(view.data?.learners)?view.data.learners:[],
  awaiting:Number(claim.data?.awaiting_student)||0,
  error:null
 };
}
async function enterAuthorisedSpace(choice){
 if(!choice)return;
 if(choice.kind==='studio'){location.replace('./studio.html');return}
 if(choice.kind==='family'){location.replace('./family.html');return}
 if(choice.kind==='student'){
  state.member=choice.member;
  if(await studentWelcome.maybeShow(state.user))return;
  await dashboard();
  return;
 }
 throw Error('Invalid dashboard choice.');
}
function displayRoleChoices(choices){
 const root=$('role-options');root.replaceChildren();
 for(const choice of choices){
  const button=document.createElement('button');button.type='button';button.className='mg-role-option';
  const title=document.createElement('strong');title.textContent=choice.label;
  const sub=document.createElement('span');sub.textContent=choice.description;
  const hint=document.createElement('small');hint.textContent='CONTINUE TO PRIVATE DASHBOARD ↗';
  button.append(title,sub,hint);
  button.addEventListener('click',async()=>{
   root.querySelectorAll('button').forEach(x=>x.disabled=true);
   try{await enterAuthorisedSpace(choice)}
   catch(err){message('role-message',friendlyError(err),true);root.querySelectorAll('button').forEach(x=>x.disabled=false)}
  });
  root.append(button);
 }
 show('role-view');
}
async function boot(){
 $('mg-account-link').hidden=true;
 if(!sb){show('configure-view');return}
 try{
  const {data:{session},error}=await sb.auth.getSession();
  if(error)throw error;
  if(!session?.user){show('login-view');return}
  const {data:verified,error:verificationError}=await sb.auth.getUser();
  if(verificationError||!verified?.user?.email_confirmed_at){
   show('login-view');
   message('login-message','Please verify the secure link sent to your email address before continuing.',true);
   return;
  }
  state.user=verified.user;
  $('sign-out').hidden=false;
  $('mg-account-link').hidden=false;
  await loadMembership();
  if(!state.members.length){
   // The student invitation, not email text in the form, authorises account creation.
   const {data:automatic,error:autoError}=await sb.rpc('claim_my_student_access');
   if(!autoError&&automatic?.ok)await loadMembership();
   if(!state.members.length){
    const pending=sessionStorage.getItem('mathsgrove_pending_code');
    if(pending){
     try{await redeem(pending);await loadMembership()}
     catch(err){message('claim-message',friendlyError(err),true)}
    }
   }
  }
  const linked=await linkedAccess();
  const choices=getAccessChoices(state.members,linked.learners,linked.awaiting);
  if(passwordAccess.wantsSecurityView()){
   if(choices.length>0){passwordAccess.showForUser(state.user.email);return}
   show('claim-view');
   message('claim-message','Your email is verified, but an administrator must authorise an active MathsGrove role before a password can be set.',true);
   return;
  }
  if(choices.length>1){displayRoleChoices(choices);return}
  const sole=preferredSingleChoice(choices);
  if(sole){await enterAuthorisedSpace(sole);return}
  show('claim-view');
  if(linked.error){
   message('claim-message','Your email is verified, but the role-access service could not be checked. The administrator may need to activate the Supabase access upgrade. No account access has been granted.',true);
  } else {
   message('claim-message','Your email is verified, but it is not currently attached to a MathsGrove dashboard. Ask the administrator to confirm your enrolment or linked access.');
  }
 }catch(err){
  show('login-view');
  message('login-message',friendlyError(err),true);
 }
}
async function loadStudentAnalysis(){
 const container=$('mg-student-analysis');if(!container)return;
 try{
  const {data,error}=await sb.rpc('grove_student_insights');
  if(error)throw error;
  window.MGInsights?.student(data);
  renderStudentProof(data);
  const write=(id,v)=>{const el=$(id);if(el)el.textContent=String(v??'—')};
  write('mg-insight-target',data?.target_grade||'Not set');
  write('mg-insight-baseline',data?.baseline?.status==='submitted'||data?.baseline?.status==='expired'?(data.baseline.score+'/20'):'Not started');
  write('mg-insight-reviewed',(data?.reviewed||0)+' / '+(data?.submitted||0));
  write('mg-insight-accuracy',data?.reviewed_accuracy===null||data?.reviewed_accuracy===undefined?'Pending':data.reviewed_accuracy+'%');
  write('mg-insight-time',(data?.visible_minutes||0)+' minutes of recorded question visibility. This approximates engagement, not independent working.');
  const topics=$('mg-insight-topics');topics.replaceChildren();
  const baseline=Array.isArray(data?.baseline_topics)?data.baseline_topics:[];
  const weaker=baseline.filter(t=>t.correct<t.total).sort((a,b)=>a.correct/a.total-b.correct/b.total).slice(0,4);
  if(!baseline.length)topics.append(document.createTextNode('Your 20-question baseline will identify the initial topic priorities.'));
  else if(!weaker.length)topics.append(document.createTextNode('Strong multiple-choice starting point. Focus next on explaining unfamiliar methods.'));
  else for(const t of weaker){
   const item=document.createElement('div');item.className='mg-topic-row';
   const label=document.createElement('span');label.textContent=t.topic;
   const value=document.createElement('strong');value.textContent=t.correct+' / '+t.total;
   item.append(label,value);topics.append(item);
  }
  const trend=$('mg-insight-trend');trend.replaceChildren();
  const history=Array.isArray(data?.history)?data.history.slice(-8):[];
  if(!history.length){const empty=document.createElement('p');empty.textContent='Your progress trend begins after an examiner releases your first practice report.';trend.append(empty)}
  else for(const item of history){
   const line=document.createElement('div');line.className='mg-trend-row';
   const d=document.createElement('span');d.textContent=new Date(item.date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'});
   const bar=document.createElement('div');bar.className='mg-trend-track';
   const fill=document.createElement('i');const percent=item.total?Math.round(100*item.score/item.total):0;fill.style.width=percent+'%';bar.append(fill);
   const pct=document.createElement('strong');pct.textContent=percent+'%';line.append(d,bar,pct);trend.append(line);
  }
  try{
   await studentReleaseFeed.update(data,state.attempts,sb,state.user?.id);
   lastReleaseCheck=Date.now();
  }catch(err){studentReleaseFeed.message('Recent examiner updates could not be checked. Use refresh to try again.')}
 }catch(e){
  clearProgressEvidence('student');
  const note=$('mg-insight-topics');note.replaceChildren();
  note.textContent='Your analysis could not load right now. Refresh after your programme is active.';
   window.MGInsights?.student(null);
 }
}

let releaseRefreshBusy=false,lastReleaseCheck=0;
async function refreshStudentReleases(){
 if(releaseRefreshBusy||!sb||!state.user||!state.member)return;
 if(state.attempt||!$('mg-practice-workspace').hidden)
  throw Error('Complete or leave the current assessment before checking for newly released feedback.');
 releaseRefreshBusy=true;
 try{
  const {data,error}=await sb.from('attempts')
   .select('id,student_id,org_id,qualification,paper_mode,status,started_at,submitted_at')
   .eq('student_id',state.user.id).eq('org_id',state.member.org_id)
   .order('started_at',{ascending:false}).limit(80);
  if(error)throw error;
  state.attempts=data||[];
  text('metric-progress',state.attempts.filter(a=>a.status==='draft').length);
  text('metric-submitted',state.attempts.filter(a=>a.status==='submitted').length);
  text('metric-marked',state.attempts.filter(a=>a.status==='marked').length);
  await loadStudentAnalysis();
  await renderEvidence();
  if(!$('progress-panel').hidden)await renderProgress();
 }finally{releaseRefreshBusy=false}
}
async function dashboard(){
 if(isStaff()){location.replace('./studio.html');return}
 // Existing students are routed into their one-time, qualification-level baseline
 // before routine practice. Do not block the portal if this optional migration
 // has not yet been installed, or if the bank is incomplete.
 try{
  const {data:baseline,error:baselineError}=await sb.rpc('baseline_status');
  if(!baselineError&&baseline?.ready===true &&
   (baseline.status==='active'||(baseline.status==='not_started'&&baseline.bank_ready))){
   location.replace('./baseline.html');return;
  }
 }catch{}
 const [p,org,prof]=await Promise.all([sb.from('profiles').select('id,display_name').eq('id',state.user.id).maybeSingle(),sb.from('organisations').select('id,name').eq('id',state.member.org_id).maybeSingle(),sb.from('student_preferences').select('qualification,exam_board,tier').eq('student_id',state.user.id).maybeSingle()]);if(p.error||org.error||prof.error)throw(p.error||org.error||prof.error);state.profile=p.data||{display_name:'Student'};state.preference=prof.data||null;$('student-name').value=state.profile.display_name==='Student'?'':(state.profile.display_name||'');text('organisation-label',org.data?.name?.toUpperCase()||'YOUR PROGRAMME');text('sidebar-name',state.profile.display_name||'Student');text('sidebar-role',state.member.member_role.toUpperCase());text('member-initials',initials(state.profile.display_name));text('welcome-text','Welcome'+(state.profile.display_name?' back, '+state.profile.display_name.split(' ')[0]:'')+'.');text('membership-pill',state.member.member_role==='student'?'Student access':'Organisation team');$('pathway-form').hidden=isStaff();$('begin-paper').disabled=isStaff();if(state.preference){$('qualification-select').value=state.preference.qualification||'';$('exam-board').value=state.preference.exam_board||'';$('exam-tier').value=state.preference.tier||''}text('mg-student-route-qualification',state.preference?.qualification?(quals[state.preference.qualification]||state.preference.qualification):'To be assigned');text('mg-student-route-board',state.preference?.exam_board||'Your assigned route');text('mg-student-route-level',state.preference?.tier||'Not yet assigned');show('dashboard-view');await refresh();showPanel('overview');await assignedPractice?.refresh();await loadStudentAnalysis()}
async function refresh(){if(!state.member)return;let query=sb.from('attempts').select('*').eq('org_id',state.member.org_id).order('started_at',{ascending:false}).limit(80);if(!isStaff())query=query.eq('student_id',state.user.id);let {data,error}=await query;if(error)throw error;state.attempts=data||[];text('metric-progress',state.attempts.filter(a=>a.status==='draft').length);text('metric-submitted',state.attempts.filter(a=>a.status==='submitted').length);text('metric-marked',state.attempts.filter(a=>a.status==='marked').length);const q=state.preference?.qualification;text('paper-availability',q?('Your selected pathway: '+quals[q]+'. Only original pilot questions are currently available; board-specific past papers are not yet provided.'): 'Ask your administrator to assign an exam pathway before building a paper.');if(q)await loadTopicOptions(q);await loadProgrammeAndEvidence()}

const programmeNames={weekly:'Grove Weekly',daily:'Grove Daily',exam:'Grove Exam'};
const programmeDescriptions={
 weekly:'Up to four selected weekly or topic-focused papers per calendar month.',
 daily:'Daily Focus opportunities seven days per week, with a weekly progress report when supported.',
 exam:'Grove Daily plus one administrator-assigned, server-timed mock session per month once a full paper has passed moderation.'
};
async function loadProgrammeAndEvidence(){
 state.entitlement=null;
 const {data:e,error}=await sb.from('student_entitlements')
  .select('tier,signature_credits,starts_at,ends_at').eq('student_id',state.user.id).maybeSingle();
 const active=e&&!error&&new Date(e.starts_at)<=new Date()&&(!e.ends_at||new Date(e.ends_at)>new Date());
 if(active)state.entitlement=e;
 updateExamPracticeAvailability();
 $('student-programme-title').textContent=active?programmeNames[e.tier]||'Private programme':'Programme awaiting activation';
 text('mg-student-route-programme',active?programmeNames[e.tier]||'Your programme':'Awaiting activation');
 $('student-programme-description').textContent=active?programmeDescriptions[e.tier]:'Your tutor assigns Weekly, Daily or Exam access. Until your programme is activated, no new paper can be created.';
 $('student-programme-expiry').textContent=active?(e.ends_at?'Active until '+new Date(e.ends_at).toLocaleDateString('en-GB'):'Access currently active'):'Ask your tutor to confirm programme access';
 $('student-signature-credits').textContent='Signature Reviews: '+(active?e.signature_credits:'—');
 $('membership-pill').textContent=active?programmeNames[e.tier]:'Invited · pending access';
 const allowed=active?(e.tier==='weekly'?['weekly','topic']:e.tier==='daily'?['daily','weekly','topic']:['daily','weekly','topic']):[];
 for(const option of $('paper-mode').options)option.disabled=!allowed.includes(option.value);
 if(!allowed.includes($('paper-mode').value))$('paper-mode').value=allowed[0]||'weekly';
 $('paper-mode').dispatchEvent(new Event('change'));
 $('begin-paper').disabled=!active||!state.preference?.qualification;
 // Assignments are rendered from the server, not drawn as suggested dates.
 if(!assignedPractice)showPracticeDiary(e,Boolean(active));
 await renderEvidence();
}
function showPracticeDiary(e,active){
 const root=$('student-calendar');root.replaceChildren();
 if(!active){root.textContent='Your next practice pattern will appear when your tutor activates a programme.';return}
 const now=new Date();now.setHours(12,0,0,0);
 const days=e.tier==='weekly'?[3]:e.tier==='daily'?[0,1,2,3,4,5,6]:[0,1,2,4,6];
 for(let i=0;i<7;i++){
  const d=new Date(now);d.setDate(d.getDate()+i);
  const day=document.createElement('div');day.className='practice-day'+(days.includes(i)?' scheduled':'');
  const name=document.createElement('small');name.textContent=d.toLocaleDateString('en-GB',{weekday:'short'});
  const number=document.createElement('strong');number.textContent=d.getDate();
  const task=document.createElement('span');task.textContent=days.includes(i)?(e.tier==='weekly'?'Weekly':'Focus'):'Review';
  day.append(name,number,task);root.append(day);
 }
}
async function renderEvidence(){
 const root=$('student-evidence');root.replaceChildren();
 const marked=state.attempts.filter(x=>x.status==='marked').slice(0,8);
 if(!marked.length){root.textContent='No released reviews yet. Your first examiner-marked paper will start your learning record.';return}
 try{
  const ids=marked.map(a=>a.id);
  const rv=await sb.from('reviews').select('attempt_id,question_id,marks_awarded').in('attempt_id',ids);
  if(rv.error)throw rv.error;
  const questionIds=[...new Set((rv.data||[]).map(x=>x.question_id))];
  if(!questionIds.length){root.textContent='Examiner marks are not yet available for these papers.';return}
  const qResult=await sb.from('question_bank').select('id,marks').in('id',questionIds);
  if(qResult.error)throw qResult.error;
  const maximum=new Map((qResult.data||[]).map(q=>[q.id,q.marks]));
  const rows=marked.map(a=>{
   const parts=(rv.data||[]).filter(r=>r.attempt_id===a.id);
   const earned=parts.reduce((x,r)=>x+Number(r.marks_awarded||0),0);
   const available=parts.reduce((x,r)=>x+Number(maximum.get(r.question_id)||0),0);
   return{a,earned,available,percent:available?Math.round(earned/available*100):0};
  }).filter(x=>x.available>0).reverse();
  if(!rows.length){root.textContent='Marks are not yet available for your reviewed papers.';return}
  const total=rows.reduce((a,x)=>a+x.earned,0),outOf=rows.reduce((a,x)=>a+x.available,0);
  const summary=document.createElement('p');summary.className='evidence-overview';
  summary.textContent=rows.length+' reviewed paper(s) · '+total+'/'+outOf+' marks across reviewed questions · '+Math.round(total/outOf*100)+'% mark-weighted score';
  root.append(summary);
  const chart=document.createElement('div');chart.className='student-trend';
  for(const x of rows){
    const item=document.createElement('div');item.className='student-trend-col';
    const val=document.createElement('strong');val.textContent=x.percent+'%';
    const bar=document.createElement('i');bar.style.height=(25+x.percent*1.25)+'px';
    const when=document.createElement('small');when.textContent=new Date(x.a.started_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
    item.append(val,bar,when);chart.append(item);
  }
  root.append(chart);
  const caveat=document.createElement('p');caveat.className='insight-disclaimer';
  caveat.textContent=rows.length>=3&&outOf>=60?'Multiple marked papers are available. A formal predicted grade still requires representative timed assessments and moderated board-specific grade boundaries.':'Predicted grade unavailable: at least three substantial reviewed papers plus board-specific calibration are needed.';
  root.append(caveat);
 }catch(err){root.textContent='Evidence summary unavailable. Your saved papers remain accessible in My progress.'}
}

$('invite-login-form').addEventListener('submit',requestLink);
$('existing-member').addEventListener('click',()=>{$('access-code').value='';message('login-message','Enter your registered email to receive a secure sign-in link.')});
$('claim-form').addEventListener('submit',async e=>{e.preventDefault();try{await redeem($('claim-code').value);await loadMembership();if(!state.member)throw Error('Enrolment pending.');message('claim-message','Invitation accepted.');await boot()}catch(err){message('claim-message',friendlyError(err),true)}});
$('sign-out').addEventListener('click',async()=>{studentReleaseFeed.invalidate();clearProgressEvidence('student');await sb?.auth.signOut();sessionStorage.removeItem('mathsgrove_pending_code');location.href='./portal.html'});
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showPanel(b.dataset.view)));
$('pathway-form').addEventListener('submit',async e=>{
 e.preventDefault();
 try{
  const name=$('student-name').value.trim();
  if(!name||name.length>100)throw Error('Enter a valid display name.');
  const {error}=await sb.from('profiles').update({display_name:name}).eq('id',state.user.id);
  if(error)throw error;
  state.profile.display_name=name;
  text('sidebar-name',name);text('member-initials',initials(name));
  text('welcome-text','Welcome back, '+name.split(' ')[0]+'.');
  message('global-message','Your display name was saved. Your tutor manages examination route and programme settings.');
 }catch(err){message('global-message',friendlyError(err),true)}
});
const paperTargets={daily:3,weekly:5,topic:3,exam_practice:8};
async function loadTopicOptions(qualification){
 const {data,error}=await sb.from('question_bank').select('topic').eq('qualification',qualification).eq('active',true).limit(100);
 if(error)return;
 const el=$('paper-topic'),previous=el.value;el.replaceChildren();
 el.add(new Option('Mixed topics',''));
 for(const t of [...new Set((data||[]).map(x=>x.topic).filter(Boolean))].sort())el.add(new Option(t,t));
 if([...el.options].some(o=>o.value===previous))el.value=previous;
 const count=(data||[]).length;
 if(count)text('paper-availability',count+' original questions currently available for '+(quals[qualification]||qualification)+'. The programme and exam-level filters determine which questions you can receive. Full timed mocks are assigned separately.');
 else text('paper-availability','No suitable questions have been published for this academic pathway yet. Your administrator can expand the original practice library.');
}
function updateExamPracticeAvailability(){
 const option=[...$('paper-mode').options].find(o=>o.value==='exam_practice');
 if(!option)return;
 const permitted=state.entitlement?.tier==='exam';
 option.hidden=!permitted;option.disabled=!permitted;
 if(!permitted&&$('paper-mode').value==='exam_practice')$('paper-mode').value='weekly';
}
$('paper-mode').addEventListener('change',e=>{
 $('paper-length').value=String(paperTargets[e.target.value]||3);
 $('paper-topic').disabled=e.target.value!=='topic' && e.target.value!=='weekly';
 if(e.target.value==='topic')$('paper-topic').focus();
});
$('paper-mode').dispatchEvent(new Event('change'));
$('begin-paper').addEventListener('click',async()=>{
 const btn=$('begin-paper');btn.disabled=true;
 try{
  if(!state.preference?.qualification)throw Error('Ask your tutor to assign your qualification first.');
  const mode=$('paper-mode').value,topic=$('paper-topic').disabled?'':$('paper-topic').value,level=$('paper-level').value;
  const wanted=Number($('paper-length').value)||3;
  // The public open-practice index makes product tiers and academic tier
  // server-verifiable. A full timed mock is never generated here.
  const [{data:q,error},{data:tags,error:tagsError},{data:seenRows}]=await Promise.all([
   sb.from('question_bank').select('id,qualification,topic,prompt,marks,difficulty')
     .eq('qualification',state.preference.qualification).eq('active',true).limit(300),
   sb.from('practice_content_index').select('question_id,programme,exam_tier')
     .eq('qualification',state.preference.qualification).limit(300),
   sb.from('answers').select('question_id').eq('student_id',state.user.id).limit(300)
  ]);
  if(error)throw error;
  if(tagsError&&mode==='exam_practice')throw new Error('Exam preparation content has not yet been installed by your administrator.');
  const index=new Map((tags||[]).map(x=>[x.question_id,x]));
  const seen=new Set((seenRows||[]).map(x=>x.question_id));
  const levelName=(state.preference.tier||'').trim().toLowerCase();
  const matchTier=t=>!t||t.toLowerCase()===levelName||
   (state.preference.qualification==='GCSE'&&levelName==='higher'&&t==='Foundation')||
   (state.preference.qualification==='IGCSE'&&levelName==='extended'&&t==='Core');
  const requiredProgramme=mode==='topic'?'weekly':mode==='exam_practice'?'exam':mode;
  const allowed={foundation:[1,2],standard:[2,3],challenge:[3,4,5]};
  let chosen=(q||[]).filter(x=>{
   const tag=index.get(x.id);
   return (!topic||x.topic===topic)&&(!allowed[level]||allowed[level].includes(x.difficulty))
     &&(tag?(tag.programme===requiredProgramme&&matchTier(tag.exam_tier)):
        (mode==='weekly'||mode==='topic'));
  });
  if(!chosen.length)throw new Error('No suitable questions match your qualification, academic tier and Grove programme yet. Ask your tutor to expand or change the assigned practice settings.');
  // Fisher-Yates shuffle within seen/unseen groups so the student does not
  // repeatedly receive the easiest questions, without implying AI adaptation.
  const mix=list=>{for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]]}return list};
  chosen=[...mix(chosen.filter(x=>!seen.has(x.id))),...mix(chosen.filter(x=>seen.has(x.id)))].slice(0,wanted);
  const ids=chosen.map(x=>x.id);
  const {data:id,error:createError}=await sb.rpc('create_student_paper',{p_mode:mode,p_topic:topic,p_difficulty:level,p_requested_count:wanted,p_questions:ids});
  if(createError)throw Error(createError.message||'The selected paper could not be created.');
  const {data:a,error:fetchError}=await sb.from('attempts').select('*').eq('id',id).single();
  if(fetchError)throw fetchError;
  state.attempt=a;state.questions=chosen;state.question=0;
  await refresh();showPanel('papers');await showQuestion();
  if(chosen.length<wanted)message('global-message','Created a pilot paper with '+chosen.length+' of '+wanted+' requested questions. More original questions are being prepared.');
 }catch(err){message('global-message',friendlyError(err),true)}finally{btn.disabled=!state.preference?.qualification}
});
function stopQuestionTimer(){
 if(state.questionTimer)clearInterval(state.questionTimer);
 state.questionTimer=null;
 if(state.questionActiveId&&state.questionEntered){
  state.questionElapsed[state.questionActiveId]=(state.questionElapsed[state.questionActiveId]||0)+(performance.now()-state.questionEntered)/1000;
 }
 state.questionActiveId=null;state.questionEntered=0;
}
function beginQuestionTimer(question){
 stopQuestionTimer();
 state.questionActiveId=question.id;state.questionEntered=performance.now();
 const paint=()=>{
  const seconds=Math.floor((state.questionElapsed[question.id]||0)+(performance.now()-state.questionEntered)/1000);
  text('work-question-elapsed','On question '+Math.floor(seconds/60).toString().padStart(2,'0')+':'+(seconds%60).toString().padStart(2,'0'));
 };
 paint();state.questionTimer=setInterval(paint,1000);
}
function mockMode(){return Boolean(state.attempt?.mock_pack_id)}
function stopMockClock(){
 if(state.mockClock)clearInterval(state.mockClock);
 state.mockClock=null;$('mock-clock-bar').hidden=true;
}
function formatRemaining(sec){const n=Math.max(0,Math.ceil(sec));return Math.floor(n/3600).toString().padStart(2,'0')+':'+Math.floor(n%3600/60).toString().padStart(2,'0')+':'+(n%60).toString().padStart(2,'0')}
function lockTimedWorkspace(){stopQuestionTimer();
 $('work-text').disabled=true;$('work-photos').disabled=true;
 $('save-and-next').disabled=true;$('previous-work').disabled=true;
 $('mock-submit-early').disabled=true;
 board.setEnabled(false);
 text('save-status','Time is over. Your saved working is locked.');
}
async function syncMockClock(){
 if(!mockMode())return;
 const id=state.attempt.id;
 const {data,error}=await sb.rpc('mock_session_clock',{p_attempt:id});
 if(error)throw error;
 const snapshot=Array.isArray(data)?data[0]:data;
 if(!snapshot)throw Error('Unable to verify exam timing with the server.');
 if(state.attempt?.id!==id)return;
 state.mockSeconds=Math.max(0,Number(snapshot.seconds_remaining)||0);
 state.mockAnchor=performance.now();
 if(snapshot.is_expired||state.mockSeconds<=0)await expireMock();
}
function startMockClock(){
 stopMockClock();
 if(!mockMode())return;
 $('mock-clock-bar').hidden=false;
 $('work-text').disabled=false;$('work-photos').disabled=false;
 $('mock-submit-early').disabled=false;
 const session=state.attempt.id;
 let ticks=0;
 state.mockClock=setInterval(()=>{
  if(state.attempt?.id!==session){stopMockClock();return}
  const sec=Math.max(0,state.mockSeconds-(performance.now()-state.mockAnchor)/1000);
  text('mock-time-remaining',formatRemaining(sec));
  $('mock-clock-bar').classList.toggle('clock-critical',sec<=300);
  if(sec<=0){lockTimedWorkspace();void expireMock()}
  else if(++ticks%30===0)void syncMockClock().catch(err=>{
    text('mock-clock-hint','Connection lost. Saves may be refused after the deadline.');
  });
 },1000);
 text('mock-time-remaining',formatRemaining(state.mockSeconds));
}
async function expireMock(){
 if(state.mockFinalizing||!mockMode())return;
 state.mockFinalizing=true;lockTimedWorkspace();
 try{
  const {data,error}=await sb.rpc('finish_mock_session',{p_attempt:state.attempt.id});
  if(error)throw error;
  stopQuestionTimer();stopMockClock();state.attempt=null;state.questions=[];$('question-workspace').hidden=true;
  await refresh();showPanel('progress');
  message('global-message','Time is over. The mock is now submitted. Only work saved before the server deadline is included.');
 }catch(err){
  message('global-message','Your time is over. Late submissions are blocked by the server. Reconnect and open the mock again to finalise it: '+friendlyError(err),true);
 }finally{state.mockFinalizing=false}
}
async function finishMockEarly(){
 if(!mockMode())return;
 if(!confirm('Finish this timed mock now? Unfinished questions will remain blank and you cannot restart the clock.'))return;
 const btn=$('mock-submit-early');btn.disabled=true;
 try{
  if(state.autosave)clearTimeout(state.autosave);
  await persistAnswer();await uploadPending();
  const {error}=await sb.rpc('finish_mock_session',{p_attempt:state.attempt.id});
  if(error)throw error;
  stopMockClock();state.attempt=null;state.questions=[];$('question-workspace').hidden=true;
  await refresh();showPanel('progress');
  message('global-message','Your timed mock has been submitted to the examiner.');
 }catch(err){message('global-message',friendlyError(err),true)}
 finally{btn.disabled=false}
}
$('mock-submit-early').addEventListener('click',()=>void finishMockEarly());
async function loadAssignedMocks(){
 const root=$('mock-list');root.replaceChildren();
 if(!state.entitlement||state.entitlement.tier!=='exam'){
  root.textContent='Grove Exam membership is required for a timed mock sitting. Your tutor manages programme access.';return}
 const {data,error}=await sb.from('mock_packs')
 .select('id,title,qualification,board_key,exam_tier,paper_code,duration_seconds,target_marks,calculator_allowed')
 .eq('status','published').order('created_at',{ascending:false}).limit(30);
 if(error){root.textContent='Mock sittings are being prepared. Your tutor must install and test the secure mock-session upgrade before assignments appear.';return}
 if(!data?.length){root.textContent='No complete, moderated mock has been assigned to you yet. Practice papers remain available while your examiner prepares the first mock.';return}
 for(const p of data){
  const card=document.createElement('article');card.className='mock-offer';
  const info=document.createElement('div'),heading=document.createElement('h3'),meta=document.createElement('p');
  heading.textContent=p.title;meta.textContent=p.board_key+' · '+p.exam_tier+' · '+p.target_marks+' marks · '+Math.round(p.duration_seconds/60)+' minutes · '+(p.calculator_allowed?'Calculator allowed':'Non-calculator');
  info.append(heading,meta);
  const button=document.createElement('button');button.className='button button-primary';button.type='button';button.textContent='Start timed sitting';
  button.onclick=async()=>{
   if(!confirm('Starting begins the official MathsGrove sitting timer immediately. It cannot be paused or restarted. Are you ready?'))return;
   button.disabled=true;
   try{
    const {data:id,error}=await sb.rpc('start_mock_session',{p_pack:p.id});
    if(error)throw error;
    const {data:attempt,error:fetchErr}=await sb.from('attempts').select('*').eq('id',id).single();
    if(fetchErr)throw fetchErr;
    await refresh();showPanel('papers');await resume(attempt);
   }catch(err){message('global-message',friendlyError(err),true)}
   finally{button.disabled=false}
  };
  card.append(info,button);root.append(card);
 }
}
async function renderPaperList(){
 const box=$('paper-list');box.replaceChildren();
 if(!state.attempts.length){box.textContent='No papers yet. Go to Overview, select your paper type and create a practice set.';return}
 for(const a of state.attempts){
  const row=document.createElement('div');row.className='paper-row';
  const left=document.createElement('div'),title=document.createElement('strong'),sub=document.createElement('small');
  title.textContent=quals[a.qualification]||a.qualification;
  const mode=({daily:'Daily Focus',weekly:'Weekly Paper',topic:'Topic Focus',mock:'Mock Preview'})[a.paper_mode]||'Practice paper';
  sub.textContent=mode+' · '+labelState(a.status)+' · '+new Date(a.started_at).toLocaleDateString();
  left.append(title,sub);
  const button=document.createElement('button');button.type='button';button.className='button button-muted';
  button.textContent=a.status==='draft'?(a.mock_pack_id?'Resume timed mock':'Resume paper'):'View learning record';
  button.onclick=()=>a.status==='draft'?resume(a):showPanel('progress');
  row.append(left,button);box.append(row);
 }
}
async function resume(a){
 try{
  const {data:links,error:linkError}=await sb.from('paper_questions')
   .select('position,question_bank(id,qualification,topic,prompt,marks,difficulty)')
   .eq('attempt_id',a.id).order('position',{ascending:true});
  if(linkError)throw Error('Your paper record could not be loaded. Ask your tutor to complete the student paper database upgrade.');
  let questions=(links||[]).map(x=>x.question_bank).filter(Boolean);
  if(!questions.length && !['daily','weekly','mock','topic'].includes(a.paper_mode)){
   // Compatibility for legacy pilot papers created before the question-sequence migration.
   const legacy=await sb.from('question_bank').select('id,qualification,topic,prompt,marks,difficulty')
    .eq('qualification',a.qualification).eq('active',true).order('difficulty',{ascending:true}).limit(8);
   if(legacy.error)throw legacy.error;questions=legacy.data||[];
  }
  if(!questions.length)throw Error('There are no saved questions for this assessment. Please contact your tutor.');
  state.attempt=a;state.questions=questions;state.question=0;
  if(a.mock_pack_id){
   const {data:times,error:timesError}=await sb.from('mock_pack_questions')
    .select('question_id,suggested_seconds').eq('pack_id',a.mock_pack_id);
   if(timesError)throw timesError;
   state.mockQuestionTimes=Object.fromEntries((times||[]).map(x=>[x.question_id,x.suggested_seconds]));
   await syncMockClock();
   if(!state.attempt)return;
   startMockClock();
  }else stopMockClock();
  await showQuestion();
 }catch(err){message('global-message',friendlyError(err),true)}
}
async function showQuestion(){const q=state.questions[state.question];if(!q)return;$('question-workspace').hidden=false;text('work-count','QUESTION '+(state.question+1)+' OF '+state.questions.length);text('work-topic',q.topic);text('work-marks',q.marks+' MARKS');text('work-suggested-time','Suggested '+Math.ceil((state.mockQuestionTimes[q.id]||q.marks*65)/60)+' min');if(window.MathsGroveMath)window.MathsGroveMath.write($('work-prompt'),q.prompt);else text('work-prompt',q.prompt);const {data,error}=await sb.from('answers').select('id,typed_answer,difficulty,confidence,clarity').eq('attempt_id',state.attempt.id).eq('question_id',q.id).maybeSingle();if(error)throw error;state.answer=data||null;$('work-text').value=data?.typed_answer||'';$('work-difficulty').value=data?.difficulty||'';$('work-confidence').value=data?.confidence||'';$('work-clarity').value=data?.clarity||'';$('previous-work').disabled=state.question===0;$('save-and-next').textContent=state.question===state.questions.length-1?'Submit completed paper →':'Save & next →';state.photos=[];board.setContext('paper:'+state.attempt.id+':'+q.id);state.drawingChanged=board.isDirty();board.setEnabled(true);await showFiles();beginQuestionTimer(q);text('save-status','Question '+(state.question+1)+' ready');$('question-workspace').scrollIntoView({behavior:'smooth',block:'start'})}
// Serialise answer writes; a delayed autosave must never overwrite a newer manual save.
let answerWriteQueue=Promise.resolve();
async function persistAnswer(){
 if(!state.attempt||!state.questions.length)return;
 if(mockMode()&&state.mockSeconds-(performance.now()-state.mockAnchor)/1000<=0)throw Error('Mock time has expired; work can no longer be saved.');
 const attemptId=state.attempt.id,questionId=state.questions[state.question].id,studentId=state.user.id;
 const fields={typed_answer:$('work-text').value.slice(0,20000),difficulty:$('work-difficulty').value||null,confidence:$('work-confidence').value||null,clarity:$('work-clarity').value||null};
 const doWrite=async()=>{
  const {data,error}=await sb.from('answers').upsert({
   ...fields,attempt_id:attemptId,question_id:questionId,student_id:studentId
  },{onConflict:'attempt_id,question_id'}).select().single();
  if(error)throw error;
  // A response for the previous question may finish after navigation.
  if(state.attempt?.id===attemptId&&state.questions[state.question]?.id===questionId){
   state.answer=data;
   const latest=$('work-text').value.slice(0,20000)===fields.typed_answer&&
    ($('work-difficulty').value||null)===fields.difficulty&&
    ($('work-confidence').value||null)===fields.confidence&&
    ($('work-clarity').value||null)===fields.clarity;
   text('save-status',latest?'Saved securely':'Newer edits are waiting to save');
  }
  return data;
 };
 const queued=answerWriteQueue.catch(()=>{}).then(doWrite);
 answerWriteQueue=queued;
 return queued;
}
async function autosave(){
 if(!state.attempt)return;
 try{await persistAnswer()}catch(err){text('save-status','Save failed — '+friendlyError(err))}
}
['work-text','work-difficulty','work-confidence','work-clarity'].forEach(id=>$(id).addEventListener(id==='work-text'?'input':'change',()=>{if(state.autosave)clearTimeout(state.autosave);text('save-status','Saving…');state.autosave=setTimeout(autosave,1300)}));
async function uploadOne(file,kind){
 if(mockMode()&&state.mockSeconds-(performance.now()-state.mockAnchor)/1000<=0)throw Error('Time expired. No late uploads are permitted.');
 const q=state.questions[state.question],attemptId=state.attempt.id,studentId=state.user.id,orgId=state.member.org_id;
 const valid=['image/png','image/jpeg','image/webp'];
 if(!valid.includes(file.type)||file.size>5*1024*1024)throw Error('Use a JPG, PNG or WebP image smaller than 5 MB.');
 const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
 const path=[orgId,studentId,attemptId,q.id,crypto.randomUUID()+'.'+ext].join('/');
 const {error}=await sb.storage.from('student-work').upload(path,file,{contentType:file.type,upsert:false});
 if(error)throw error;
 const {error:e}=await sb.from('answer_files').insert({
  attempt_id:attemptId,question_id:q.id,student_id:studentId,org_id:orgId,
  storage_path:path,original_name:kind==='drawing'?'Whiteboard working':file.name,file_kind:kind
 });
 if(e)throw e;
}
async function uploadPending(){
 if(!state.photos.length&&!state.drawingChanged)return;
 if(state.photos.length>3)throw Error('Maximum three photographs per question.');
 // Remove only successfully uploaded photos from the pending queue.
 const pending=state.photos.splice(0);
 for(let i=0;i<pending.length;i++){
  try{await uploadOne(pending[i],'photo')}
  catch(err){state.photos=pending.slice(i).concat(state.photos);throw err}
 }
 if(state.drawingChanged){
  const version=board.getVersion(),blob=await board.exportBlob();
  if(!blob)throw Error('Could not save whiteboard image.');
  await uploadOne(new File([blob],'whiteboard.png',{type:'image/png'}),'drawing');
  if(board.markSaved(version))state.drawingChanged=false;
 }
 await showFiles();
}
async function showFiles(){const q=state.questions[state.question];const {data,error}=await sb.from('answer_files').select('id,original_name,storage_path,file_kind').eq('attempt_id',state.attempt.id).eq('question_id',q.id);if(error)throw error;const el=$('attached-files');el.replaceChildren();for(const f of data||[]){const btn=document.createElement('button');btn.type='button';btn.className='small-button';btn.textContent='📎 '+f.original_name+' ↗';btn.onclick=async()=>{const {data:d,error:e}=await sb.storage.from('student-work').createSignedUrl(f.storage_path,60);if(e){message('global-message',friendlyError(e),true);return}window.open(d.signedUrl,'_blank','noopener,noreferrer')};el.append(btn)}if(state.photos.length){const pending=document.createElement('span');pending.textContent=state.photos.length+' photo(s) selected for upload';el.append(pending)}}
$('work-photos').addEventListener('change',e=>{state.photos=Array.from(e.target.files||[]).slice(0,3);const el=$('attached-files');const row=document.createElement('span');row.textContent=state.photos.length+' new photo(s) selected; saved when you continue.';el.append(row);e.target.value=''});
async function saveNext(){if(state.autosave)clearTimeout(state.autosave);const btn=$('save-and-next');btn.disabled=true;try{await persistAnswer();await uploadPending();if(state.question<state.questions.length-1){state.question++;await showQuestion()}else{if(mockMode()){await finishMockEarly();return}if(!confirm('Submit your paper for examiner review? You will not be able to edit it afterwards.'))return;const {error}=await sb.from('attempts').update({status:'submitted',submitted_at:new Date().toISOString()}).eq('id',state.attempt.id);if(error)throw error;stopQuestionTimer();state.attempt=null;state.questions=[];$('question-workspace').hidden=true;await refresh();await renderPaperList();showPanel('progress');message('global-message','Your paper has been submitted and saved for authorised examiner review.')}}catch(err){message('global-message',friendlyError(err),true)}finally{btn.disabled=false}}
$('save-and-next').addEventListener('click',saveNext);
$('previous-work').addEventListener('click',async()=>{if(state.question===0)return;try{await persistAnswer();await uploadPending();state.question--;await showQuestion()}catch(err){message('global-message',friendlyError(err),true)}});
const board=window.MathsGroveBoard.setup({
 canvas:$('student-canvas'),
 toolbar:$('student-board-toolbar'),
 onChange:()=>{state.drawingChanged=true;text('save-status','Whiteboard changes not yet saved')}
});
function clearCanvas(){board.clear()}
async function renderProgress(){
 const el=$('progress-list');el.replaceChildren();$('report-detail').hidden=true;
 if(!state.attempts.length){el.textContent='You have no saved papers yet. Create your first practice set from Overview to begin building your personal learning record.';return}
 for(const attempt of state.attempts){
  const row=document.createElement('div');row.className='paper-row';
  const details=document.createElement('div'),name=document.createElement('strong'),meta=document.createElement('small');
  name.textContent=quals[attempt.qualification]||attempt.qualification;
  const mode=({daily:'Daily Focus',weekly:'Weekly Paper',mock:'Mock Preview',topic:'Topic Focus'})[attempt.paper_mode]||'Practice paper';
  meta.textContent=mode+' · '+labelState(attempt.status)+' · '+new Date(attempt.started_at).toLocaleDateString();
  details.append(name,meta);
  const btn=document.createElement('button');btn.type='button';btn.className='button button-muted';
  btn.textContent=attempt.status==='marked'?'Open examiner report':'View saved work';
  btn.onclick=()=>viewPaperRecord(attempt);row.append(details,btn);el.append(row);
 }
}
async function viewPaperRecord(attempt){
 const root=$('report-detail');root.hidden=false;root.replaceChildren();
 const loading=document.createElement('p');loading.textContent='Opening your private paper record…';root.append(loading);
 try{
  const [answers,reviewResult,files,questions,summaryResult]=await Promise.all([
   sb.from('answers').select('question_id,typed_answer,difficulty,confidence,clarity').eq('attempt_id',attempt.id),
   sb.from('reviews').select('question_id,marks_awarded,feedback').eq('attempt_id',attempt.id),
   sb.from('answer_files').select('question_id,original_name,storage_path,file_kind').eq('attempt_id',attempt.id),
   sb.from('question_bank').select('id,topic,prompt,marks').eq('qualification',attempt.qualification),
   sb.from('review_summaries').select('overview,strengths,gaps,next_steps,readiness_note,released_at').eq('attempt_id',attempt.id).maybeSingle()
  ]);
  for(const r of [answers,reviewResult,files,questions])if(r.error)throw r.error;
  root.replaceChildren();
  const qs=new Map((questions.data||[]).map(q=>[q.id,q])),reviews=new Map((reviewResult.data||[]).map(r=>[r.question_id,r]));
  const label=document.createElement('p');label.className='card-kicker';label.textContent=attempt.status==='marked'?'YOUR RELEASED EXAMINER REVIEW':'YOUR SAVED WORK';
  const title=document.createElement('h2');title.textContent=(quals[attempt.qualification]||attempt.qualification)+' · '+(attempt.paper_mode||'practice');
  const note=document.createElement('p');note.className='record-intro';note.textContent=attempt.status==='marked'?'This report reflects examiner marks and feedback saved to your own account.':'Your paper is saved in your private history. Question-by-question examiner feedback appears here after review.';
  root.append(label,title,note);
  const actual=(answers.data||[]).reduce((sum,r)=>sum+(reviews.get(r.question_id)?.marks_awarded||0),0);
  const maximum=(answers.data||[]).reduce((sum,r)=>sum+(qs.get(r.question_id)?.marks||0),0);
  if(attempt.status==='marked'){
   const score=document.createElement('div');score.className='record-score';
   const scoreValue=document.createElement('strong');scoreValue.textContent=actual+' / '+maximum;
   const scoreNote=document.createElement('span');scoreNote.textContent=maximum?Math.round(100*actual/maximum)+'% · Marks recorded by your examiner':'Examiner marks recorded';
   score.append(scoreValue,scoreNote);root.append(score);
   const summary=summaryResult?.data;
   if(summary){
    const heading=document.createElement('h3');heading.className='report-narrative-title';heading.textContent='Your detailed examiner review';root.append(heading);
    const parts=[['Examiner overview',summary.overview],['Your mathematical strengths',summary.strengths],
      ['Misconceptions and lost marks',summary.gaps],['Your individual next steps',summary.next_steps],
      ['Exam-readiness evidence',summary.readiness_note]];
    for(const [label,value] of parts){
     if(!value)continue;
     const sec=document.createElement('section');sec.className='review-summary-card';
     const h=document.createElement('h3');h.textContent=label;
     const p=document.createElement('p');p.textContent=value;sec.append(h,p);root.append(sec);
    }
   }else{
    const note=document.createElement('p');note.className='record-intro';
    note.textContent='This paper contains released question marks. A narrative report has not yet been added; ask your examiner for a full Signature Review.';
    root.append(note);
   }
  }
  if(attempt.status==='marked')window.MGInsights?.report(root,answers.data||[],questions.data||[],reviewResult.data||[]);
  const sorted=(answers.data||[]).sort((a,b)=>String(qs.get(a.question_id)?.topic||'').localeCompare(String(qs.get(b.question_id)?.topic||'')));
  for(let i=0;i<sorted.length;i++){
   const a=sorted[i],q=qs.get(a.question_id),r=reviews.get(a.question_id);
   const section=document.createElement('section');section.className='record-question';
   const h=document.createElement('h3');h.textContent='Question '+(i+1)+' · '+(q?.topic||'Mathematics');
   const prompt=document.createElement('p');prompt.textContent=q?.prompt||'Original question';
   const response=document.createElement('div');response.className='record-working';response.textContent=a.typed_answer||'Handwritten working was supplied separately.';
   const refl=document.createElement('small');refl.textContent='Your reflection: '+(a.difficulty||'not recorded')+' · confidence '+(a.confidence||'not recorded');
   section.append(h,prompt,response,refl);
   if(attempt.status==='marked'){
    const examiner=document.createElement('div');examiner.className='record-examiner';
    const marks=document.createElement('strong');marks.textContent='Examiner marks: '+(r?.marks_awarded??'—')+' / '+(q?.marks??'—');
    const feedback=document.createElement('p');feedback.textContent=r?.feedback||'No written comment recorded for this question.';
    examiner.append(marks,feedback);section.append(examiner);
   }
   for(const file of (files.data||[]).filter(x=>x.question_id===a.question_id)){
    const btn=document.createElement('button');btn.type='button';btn.className='small-button record-attachment';btn.textContent='View saved '+(file.file_kind==='drawing'?'graph-paper working':'photo')+' · '+file.original_name+' ↗';
    btn.onclick=async()=>{
      try{const {data,error}=await sb.storage.from('student-work').createSignedUrl(file.storage_path,60);if(error)throw error;window.open(data.signedUrl,'_blank','noopener,noreferrer')}
      catch(err){message('global-message',friendlyError(err),true)}
    };
    section.append(btn);
   }
   root.append(section);
  }
  if(!(answers.data||[]).length){const p=document.createElement('p');p.textContent='No saved answers were found for this paper.';root.append(p)}
  if(attempt.status==='marked'){
   const tip=document.createElement('div');tip.className='record-next';tip.textContent='Your next step: revisit questions where method or accuracy marks were lost, then select a new practice paper from your Dashboard.';root.append(tip);
  }
  const actions=document.createElement('div');actions.className='record-actions';
  const print=document.createElement('button');print.type='button';print.className='button button-primary';print.textContent='Print / Save this record as PDF';print.onclick=()=>window.print();
  const sample=document.createElement('a');sample.className='button button-muted';sample.href='./sample.html#report';sample.textContent='Compare specimen report ↗';
  actions.append(print,sample);root.append(actions);
  root.scrollIntoView({behavior:'smooth',block:'start'});
 }catch(err){root.replaceChildren();message('global-message','Unable to open your private record: '+friendlyError(err),true)}
}
$('export-history').addEventListener('click',async()=>{
 try{
  const [answers,files,reviews]=await Promise.all([
   sb.from('answers').select('attempt_id,question_id,typed_answer,difficulty,confidence,clarity,updated_at').eq('student_id',state.user.id).limit(500),
   sb.from('answer_files').select('attempt_id,question_id,original_name,file_kind,created_at').eq('student_id',state.user.id).limit(500),
   sb.from('reviews').select('attempt_id,question_id,marks_awarded,feedback').limit(500)
  ]);
  for(const result of [answers,files,reviews])if(result.error)throw result.error;
  const ids=new Set(state.attempts.map(a=>a.id));
  const record={label:'MathsGrove private student record',exported_at:new Date().toISOString(),
    note:'JSON contains records and attachment names, but does not include photograph image binaries.',
    profile:{display_name:state.profile?.display_name||'',qualification:state.preference?.qualification||'',exam_board:state.preference?.exam_board||'',tier:state.preference?.tier||''},
    papers:state.attempts,
    answers:(answers.data||[]).filter(x=>ids.has(x.attempt_id)),
    attachments:(files.data||[]).filter(x=>ids.has(x.attempt_id)),
    released_reviews:(reviews.data||[]).filter(x=>ids.has(x.attempt_id))
  };
  const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='MathsGrove_my_learning_record.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  message('global-message','Your learning record JSON has been downloaded. Uploaded photographs remain private in Supabase.');
 }catch(err){message('global-message',friendlyError(err),true)}
});
// Discard locally cached learner records when an account is removed in another session.
let accessRecheckBusy=false;
async function recheckLearnerOnReturn(){
 if(accessRecheckBusy||!sb||!state.user||$('dashboard-view').hidden)return;
 accessRecheckBusy=true;
 $('dashboard-view').hidden=true;
 try{
  const {data:verified,error:authError}=await sb.auth.getUser();
  if(authError||!verified?.user)throw Error('Account session is no longer valid');
  const {data:roles,error:roleError}=await sb.from('memberships').select('org_id,member_role')
   .eq('user_id',verified.user.id).eq('member_role','student').limit(1);
  if(roleError)throw roleError;
  if(!roles?.length){
   studentReleaseFeed.invalidate();clearProgressEvidence('student');
   state.member=null;state.members=[];state.attempts=[];state.questions=[];
   state.preference=null;state.profile=null;state.entitlement=null;state.attempt=null;
   show('claim-view');
   message('claim-message','This student account no longer has active MathsGrove access. No previous submissions or progress are available.');
   return;
  }
  state.member=roles[0];state.members=roles;
  show('dashboard-view');
  if(!state.attempt){
   await refresh();
   if(Date.now()-lastReleaseCheck>90000&&$('mg-practice-workspace').hidden)
    await loadStudentAnalysis();
  }
 }catch{
  studentReleaseFeed.invalidate();clearProgressEvidence('student');
  state.member=null;state.members=[];state.attempts=[];state.questions=[];
  state.profile=null;state.preference=null;state.entitlement=null;state.attempt=null;
  show('login-view');
  message('login-message','Your current learner access could not be verified. Sign in again to continue.',true);
 }finally{accessRecheckBusy=false}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void recheckLearnerOnReturn()});
window.addEventListener('pageshow',e=>{if(e.persisted)void recheckLearnerOnReturn()});
setInterval(()=>{
 if(!document.hidden&&state.user&&!$('dashboard-view').hidden)void recheckLearnerOnReturn();
},60000);
await boot();
$('sign-out').hidden=!state.user;
