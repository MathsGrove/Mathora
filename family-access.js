import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import {renderFamilyTiming} from './family-timing.js';
import {renderFamilyRole,clearTierRoleExperience} from './tier-role-experience.js';
const $=id=>document.getElementById(id);
const conf=window.MATHSGROVE_CONFIG||{};
const ready=/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(conf.url||'')&&Boolean(conf.publishableKey);
const sb=ready?createClient(conf.url,conf.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
let records=[],user=null,selectedLearnerKey=null;
const learnerKey=x=>String(x.student_id||'')+'::'+(x.view_role==='tutor'?'tutor':'parent');
const view=id=>['fa-loading','fa-login','fa-pending','fa-dashboard'].forEach(x=>$(x).hidden=x!==id);
const set=(id,s)=>$(id).textContent=String(s??'');
const err=(id,s,bad=false)=>{set(id,s);$(id).classList.toggle('error',bad)};
const prettyDate=d=>{if(!d)return '—';const dt=new Date(d);return Number.isNaN(dt.getTime())?'—':dt.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})};
const element=(type,cls,value)=>{const n=document.createElement(type);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n};
function render(){
 if(!records.length){view('fa-pending');return}
 const chooser=$('fa-learner-select');
 const selected=selectedLearnerKey||chooser.value;
 chooser.replaceChildren();
 records.forEach(x=>chooser.add(new Option(x.student_name+' · '+(x.view_role==='parent'?'Parent view':'Tutor view'),learnerKey(x))));
 if([...chooser.options].some(o=>o.value===selected))chooser.value=selected;
 else chooser.selectedIndex=0;
 const p=records.find(x=>learnerKey(x)===chooser.value);
 if(!p){view('fa-pending');return}
 selectedLearnerKey=learnerKey(p);
 const parent=p.view_role==='parent';
 set('fa-role-kicker',parent?'GROVE EXAM / AUTHORISED FAMILY':'GROVE EXAM / ASSIGNED TUTOR');
 set('fa-title',parent?'A clearer picture of progress.':'Evidence for better teaching.');
 set('fa-subtitle',parent?'See '+p.student_name+"'s released assessments and find thoughtful ways to encourage progress.":'See what '+p.student_name+' has demonstrated, identify specific misconceptions and plan a purposeful intervention.');
 set('fa-access-chip',parent?'READ-ONLY PARENT':'ASSIGNED TUTOR');
 set('fa-view-type',parent?'Guardian view':'Tutor evidence view');
 const statLabels=parent?['RELEASED PAPERS','AWAITING REVIEW','TOPICS REPORTED','LATEST ACTIVITY']:['REVIEWED ASSESSMENTS','AWAITING MARKING','REVIEWED TOPICS','LATEST EVIDENCE'];
 [statLabels[0],statLabels[1],statLabels[2],statLabels[3]].forEach((l,i)=>set('fa-k'+(i+1),l));
 [p.papers_reviewed||0,p.papers_awaiting_review||0,(p.topics||[]).length,prettyDate(p.last_submission)].forEach((v,i)=>set('fa-v'+(i+1),v));
 set('fa-s1',parent?'Released academic record':'Marked and released papers');
 set('fa-s2','Unreleased marks are not shown');
 set('fa-s3',parent?'Learning areas with reviewed evidence':'Topic priorities for teaching');
 set('fa-s4',p.qualification||'Mathematics');
 const topics=$('fa-topics');topics.replaceChildren();
 const list=(p.topics||[]).filter(x=>x.available>0);
 if(!list.length)topics.append(element('p','fa-fine','No reviewed topic evidence is available yet. The graph will populate after assessment marking is released.'));
 for(const x of list){const row=element('div','fa-topic'),top=element('div'),name=element('span','',x.topic||'Mathematics'),percentage=Math.max(0,Math.min(100,Math.round(100*x.earned/x.available))),val=element('strong','',percentage+'%');top.append(name,val);
 const track=element('div','fa-track'),bar=element('i');bar.style.width=percentage+'%';track.append(bar);row.append(top,track);topics.append(row)}
 set('fa-support-head',parent?'Helping at home':'Planning an intervention');
 set('fa-support-badge',parent?'READ-ONLY PARENT':'TEACHING ANALYSIS');
 const weakest=list.slice().sort((a,b)=>(a.earned/a.available)-(b.earned/b.available))[0];
 const focus=weakest?.topic||'a chosen mathematics topic';
 set('fa-support-summary',parent?'A useful question for the family: what did '+p.student_name+' learn from the last difficult problem?':(weakest?'Priority for the next teaching session: '+focus+'.':'Waiting for question-level examiner evidence before suggesting a targeted intervention.'));
 const guidance=$('fa-support-guidance');guidance.replaceChildren();
 const lines=parent?[
 ['What to celebrate','Notice the effort involved in completing and correcting work, not simply the overall score.'],
 ['What to ask','Invite your child to explain their method in their own words. Avoid comparing scores with others.'],
 ['What to check next','Ask whether an earlier misconception has been revisited with a different problem.']
 ]:[
 ['Diagnose the method','Read examiner comments against released question results, not only an overall percentage.'],
 ['Plan targeted practice','Use a contrasting pair of examples around '+focus+' and have the learner explain each step.'],
 ['Reassess independently','Recheck with a new problem and record whether the error recurs before marking it secure.']
 ];
 for(const [t,desc] of lines){const row=element('div','fa-guidance');row.append(element('strong','',t),element('p','',desc));guidance.append(row)}
 const history=$('fa-history');history.replaceChildren();
 if(!p.recent_results?.length)history.append(element('p','fa-fine','No released assessments yet. Submitted work is not visible until reviewed.'));
 for(const item of p.recent_results||[]){const row=element('div','fa-history'),left=element('div'),title=element('strong','',item.topic||item.paper_mode||'Mathematics assessment'),sub=element('small','',prettyDate(item.date)+' · '+(item.qualification||''));left.append(title,sub);row.append(left,element('b','',String(item.score??'—')+' / '+String(item.maximum??'—')));history.append(row)}
 $('fa-tutor-only').hidden=parent;
 const feedback=$('fa-feedback');feedback.replaceChildren();
 if(!parent){if(!p.teaching_feedback?.length)feedback.append(element('p','fa-fine','No examiner comments have been released yet.'));for(const x of p.teaching_feedback||[]){const item=element('div','fa-guidance');item.append(element('strong','',(x.topic||'Mathematics')+' · '+x.marks+' / '+x.maximum),element('p','',x.feedback||'No explanatory feedback entered.'));feedback.append(item)}}
 const baselineRoot=$('fa-baseline-summary');baselineRoot.replaceChildren();
 const baseline=p.baseline;
 if(!baseline||baseline.status==='not_started'){
   baselineRoot.append(element('p','fa-fine','The learner has not yet completed their first 20-question mathematics baseline. The summary will appear when a sitting is submitted.'));
 }else if(baseline.status==='in_progress'){
   baselineRoot.append(element('p','fa-fine','The learner is currently completing their baseline. Results remain private until the assessment closes.'));
 }else if(baseline.status==='completed'){
   const score=element('div','fa-baseline-score'),value=element('strong','',baseline.score+' / 20'),
   band=element('span','',baseline.band||'Initial academic snapshot');score.append(value,band);baselineRoot.append(score);
   baselineRoot.append(element('h3','','Mathematics topics sampled'));
   const topics=Array.isArray(baseline.topics)?baseline.topics:[];
   for(const t of topics){
     const row=element('div','fa-baseline-row');row.append(element('strong','',t.topic),element('span','',t.correct+' / '+t.total));baselineRoot.append(row)
   }
   const gaps=topics.filter(t=>t.correct<t.total).sort((a,b)=>a.correct/a.total-b.correct/b.total).slice(0,3);
   const advice=parent
    ? 'A helpful next step is to ask '+p.student_name+' to explain how they checked a difficult answer. Celebrate corrections and revisit '+(gaps.map(x=>x.topic).join(', ')||'unfamiliar mathematics')+' without pressure.'
    : 'Suggested targeted teaching: '+(gaps.map(x=>x.teaching_focus||x.topic).join('; ')||'introduce unfamiliar, deeper reasoning tasks')+'. Use a fresh question to confirm transfer rather than treating one multiple-choice result as full mastery.';
   baselineRoot.append(element('p','fa-baseline-advice',advice));
   baselineRoot.append(element('p','fa-fine',baseline.disclaimer||'This is diagnostic topic evidence, not an official grade or prediction.'));
 }else baselineRoot.append(element('p','fa-fine','No released baseline evidence is available yet.'));
 set('fa-role-notice',parent?'Parent access is read-only: released scores and useful academic summaries only. No private tutor notes, student handwriting or draft answers.':'Assigned tutors may view released question-level examiner comments for this specific learner. This does not grant access to unmarked work, identity management, downloads or administrative functions.');
 renderFamilyTiming(p);
 renderFamilyRole(p);
 window.MGInsights?.family(p,parent);
 view('fa-dashboard');
}
// A user may sign out, switch accounts or trigger another refresh while a slow
// network request is still pending. Only the newest permission check may render.
let accessGeneration=0;
async function access(){
 const generation=++accessGeneration;
 const isCurrent=()=>generation===accessGeneration;
 // Clear previously authorised learner records before every permissions check.
 records=[];clearTierRoleExperience('family');view('fa-loading');
 if(!sb){view('fa-login');err('fa-login-message','The secure database connection has not been configured.',true);return}
 try{
  const session=await sb.auth.getSession();
  if(!isCurrent())return;
  if(session.error)throw session.error;
  if(!session.data?.session?.user){user=null;location.replace('./portal.html');return}
  const verify=await sb.auth.getUser();
  if(!isCurrent())return;
  if(verify.error||!verify.data?.user?.email_confirmed_at||
     verify.data.user.id!==session.data.session.user.id){
   user=null;location.replace('./portal.html');return;
  }
  if(user&&user.id!==verify.data.user.id)selectedLearnerKey=null;
  user=verify.data.user;$('fa-sign-out').hidden=false;
  const claim=await sb.rpc('claim_my_learner_views');
  if(!isCurrent())return;
  if(claim.error)throw claim.error;
  const result=await sb.rpc('get_my_learner_views');
  if(!isCurrent())return;
  if(result.error)throw result.error;
  const nextRecords=Array.isArray(result.data?.learners)?result.data.learners:[];
  if(nextRecords.length){
   await Promise.all(nextRecords.map(async learner=>{
    try{
     const {data,error}=await sb.rpc('baseline_family_report',{p_student:learner.student_id});
     if(!error)learner.baseline=data;
    }catch{}
   }));
  }
  if(!isCurrent())return;
  records=nextRecords;
  if(!records.length){
   view('fa-pending');
   set('fa-pending-copy',claim.data?.awaiting_student>0?
    'Your invitation is confirmed, but the student has not yet activated their Grove Exam account. Please return after the student signs in.':
    'Your email is verified, but no active Grove Exam learner is linked to this account. Ask the administrator to check the nominated email and current programme.');
  }else render();
 }catch(e){
  if(!isCurrent())return;
  records=[];view('fa-pending');
  err('fa-pending-message','Linked access is not available yet: '+(e.message||'Unknown error')+'. Check that the access migration is installed and your invitation is active.',true);
 }
}
async function leaveFamilyDashboard(){
 // Invalidate every in-flight permission response before initiating sign-out.
 ++accessGeneration;records=[];user=null;selectedLearnerKey=null;clearTierRoleExperience('family');view('fa-loading');
 $('fa-sign-out').hidden=true;
 try{if(sb)await sb.auth.signOut()}finally{location.replace('./portal.html')}
}
$('fa-sign-out').addEventListener('click',()=>void leaveFamilyDashboard());
$('fa-retry').addEventListener('click',()=>{view('fa-loading');void access()});
$('fa-back').addEventListener('click',()=>void leaveFamilyDashboard());
$('fa-learner-select').addEventListener('change',()=>{
 selectedLearnerKey=$('fa-learner-select').value;
 const panel=$('fa-dashboard');
 panel.classList.remove('mg6-repaint');
 render();
 if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches&&!panel.hidden){
  void panel.offsetWidth;
  panel.classList.add('mg6-repaint');
 }
});
document.addEventListener('visibilitychange',()=>{
 if(!document.hidden&&user)void access();
});
window.addEventListener('pageshow',event=>{
 if(event.persisted&&user)void access();
});
// Refresh authorised family records even if this tab stays open while a learner is removed.
setInterval(()=>{if(!document.hidden&&user)void access()},60000);
void access();