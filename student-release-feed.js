/* Student release feed. Every backend record is already scoped to the signed-in
 * learner by Supabase RLS or grove_student_insights()'s student-only check. */
const dateTime=value=>{
 if(!value)return '';
 const d=new Date(value);
 return Number.isFinite(d.getTime())?d.toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'';
};
const dateOnly=value=>{
 if(!value)return '';
 const d=new Date(String(value).slice(0,10)+'T12:00:00Z');
 return Number.isFinite(d.getTime())?d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'';
};
export function buildStudentFeed(insights,attempts,summaries){
 const summariesById=new Map((summaries||[]).map(x=>[x.attempt_id,x]));
 const assigned=(Array.isArray(insights?.history)?insights.history:[]).map(x=>({
  id:'practice:'+String(x.task_id||x.mode+':'+x.date),
  kind:'practice',title:({weekly:'Weekly practice',daily:'Daily focus',exam_daily:'Exam daily',mock:'Practice mock'})[x.mode]||'Examiner-reviewed practice',
  value:x.score===null||x.score===undefined?'Reviewed':x.score+' / '+x.total+' examiner marks',
  date:x.feedback_updated_at||x.submitted_at||null,
  timestamp:x.feedback_updated_at||x.submitted_at||x.date+'T12:00:00Z',
  secondary:x.feedback_updated_at?'Examiner feedback updated '+dateTime(x.feedback_updated_at):
   'Scheduled '+dateOnly(x.date)+' · release date not recorded',
  feedback:typeof x.feedback==='string'?x.feedback:'',kindDetail:'assigned'
 }));
 const papers=(attempts||[]).filter(x=>x.status==='marked').map(x=>{
  const summary=summariesById.get(x.id);
  return {
   id:'paper:'+x.id,kind:'paper',ref:x,
   title:(x.qualification||'Mathematics')+' · '+(x.paper_mode||'Paper'),
   value:'Examiner report released',
   date:summary?.released_at||null,
   timestamp:summary?.released_at||x.submitted_at||x.started_at||'',
   secondary:summary?.released_at?'Released '+dateTime(summary.released_at):
    'Release date not recorded',
   feedback:summary?.next_steps||summary?.overview||'',kindDetail:'paper'
  };
 });
 const all=assigned.concat(papers);
 return all.sort((a,b)=>(Date.parse(b.timestamp||'')||0)-(Date.parse(a.timestamp||'')||0));
}
const node=(tag,cls,value)=>{
 const el=document.createElement(tag);if(cls)el.className=cls;
 if(value!==undefined)el.textContent=String(value);
 return el;
};
export function initStudentReleaseFeed({onRefresh,onOpenPaper}){
 const $=id=>document.getElementById(id),root=$('mg-student-releases');
 if(!root)return{update:async()=>{},message:()=>{}};
 let generation=0,refreshing=false;
 const status=$('mgsf-status');
 function message(value){status.textContent=value}
 async function update(insights,attempts,db,uid){
  const nowGeneration=++generation;
  if(!uid)return;
  const released=(attempts||[]).filter(a=>a.status==='marked');
  let summaries=[];
  if(released.length){
   // Student RLS only exposes reviews of marked attempts belonging to this user.
   const response=await db.from('review_summaries')
    .select('attempt_id,released_at,overview,next_steps')
    .in('attempt_id',released.map(a=>a.id));
   if(nowGeneration!==generation)return;
   if(response.error){message('Some report summaries are temporarily unavailable.');}
   else summaries=response.data||[];
  }
  if(nowGeneration!==generation)return;
  const feed=buildStudentFeed(insights,attempts,summaries);
  const waiting=(attempts||[]).filter(a=>a.status==='submitted').length+
   Math.max(0,Number(insights?.submitted||0)-Number(insights?.reviewed||0));
  $('mgsf-released').textContent=String(feed.length);
  $('mgsf-waiting').textContent=String(waiting);
  $('mgsf-accuracy').textContent=insights?.reviewed_accuracy==null?'Pending':insights.reviewed_accuracy+'%';
  const list=$('mgsf-feed');list.replaceChildren();
  if(!feed.length){
   list.append(node('p','mgsf-empty','When your examiner releases your first assessment, its feedback will appear here. Submitted work stays private while marking is in progress.'));
  }else{
   const key='mathsgrove-release-seen:'+uid;
   let previous=null;
   try{previous=JSON.parse(sessionStorage.getItem(key)||'null')}catch{previous=null}
   const known=new Set(Array.isArray(previous)?previous:feed.map(x=>x.id));
   for(const item of feed.slice(0,8)){
    const card=node('article','mgsf-item');
    const main=node('div','mgsf-item-main'),top=node('div','mgsf-item-top');
    const tag=node('span','mgsf-tag',item.kind==='paper'?'PAPER REPORT':'ASSIGNED PRACTICE');
    top.append(tag);
    if(!known.has(item.id))top.append(node('span','mgsf-new','NEW SINCE LAST CHECK'));
    main.append(top,node('h3','',item.title),node('strong','mgsf-result',item.value),
      node('small','mgsf-date',item.secondary));
    if(item.feedback)main.append(node('p','mgsf-feedback',item.feedback.slice(0,460)));
    else main.append(node('p','mgsf-feedback','Open your learning record to see the reviewed work and next steps.'));
    card.append(main);
    if(item.kind==='paper'){
     const button=node('button','mgsf-open','Read examiner report →');
     button.type='button';button.addEventListener('click',()=>onOpenPaper(item.ref));
     card.append(button);
    }
    list.append(card);
   }
   // Persist only opaque record IDs in tab memory. Never cache marks or feedback.
   try{sessionStorage.setItem(key,JSON.stringify(feed.map(x=>x.id).slice(0,180)))}catch{}
  }
  message('Checked '+dateTime(new Date().toISOString())+' · automatically refreshes while you are on this dashboard');
 }
 $('mgsf-refresh').addEventListener('click',async()=>{
  if(refreshing)return;refreshing=true;
  $('mgsf-refresh').disabled=true;message('Checking for newly released examiner feedback…');
  try{await onRefresh()}catch(e){message('Unable to refresh: '+(e?.message||'Try again'))}
  finally{refreshing=false;$('mgsf-refresh').disabled=false}
 });
 return{update,message};
}
