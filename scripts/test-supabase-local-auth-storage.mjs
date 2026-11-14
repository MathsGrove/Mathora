import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const base=(process.env.API_URL||'').replace(/\/$/,'');
const anon=process.env.ANON_KEY;
const service=process.env.SERVICE_ROLE_KEY;
assert.match(base,/^http:\/\/(?:127\.0\.0\.1|localhost):[0-9]+$/,'Only an on-runner local Supabase API can be tested');
assert.ok(anon&&service&&anon!==service,'A locally generated anon key and service key are required');
assert.ok(!process.env.SUPABASE_ACCESS_TOKEN,'Must not run with a linked hosted Supabase account');
const bucket='mg2-fictional-evidence';
const paper='abcdabcd-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const password='Local-Fictional-Only-Secret-2026!';
const emailNames=[
 ['author','mg2-author@example.com'],
 ['one','mg2-examiner-one@example.com'],
 ['two','mg2-examiner-two@example.com'],
 ['student','mg2-student@example.com'],
 ['otherStudent','mg2-other-student@example.com'],
 ['otherExaminer','mg2-other-examiner@example.com'],
 ['parent','mg2-parent@example.com'],
 ['tutor','mg2-tutor@example.com']
];
const identities={};
const sessions={};
let checks=0;
function parse(text){try{return JSON.parse(text)}catch{return text}}
async function request(method,path,{jwt,key,body,headers={}}={}){
 const h={apikey:key||anon,...headers};
 if(jwt)h.Authorization='Bearer '+jwt;
 let data=body;
 if(body!==undefined&&!(body instanceof Uint8Array)&&typeof body!=='string'){
  h['Content-Type']=h['Content-Type']||'application/json';
  data=JSON.stringify(body);
 }
 const res=await fetch(base+path,{method,headers:h,body:data});
 const bytes=await res.arrayBuffer();
 const t=Buffer.from(bytes).toString('utf8');
 return {ok:res.ok,status:res.status,data:parse(t),raw:Buffer.from(bytes)};
}
function requireOk(result,label){
 if(!result.ok)throw Error(label+' failed HTTP '+result.status+': '+JSON.stringify(result.data).slice(0,500));
 checks++;return result.data;
}
function denied(result,label){
 if(result.ok)throw Error(label+' unexpectedly ALLOWED');
 checks++;return result.data;
}
function psql(sql){
 return execFileSync('psql',['-X','-v','ON_ERROR_STOP=1','-At','-c',sql],{
  encoding:'utf8',env:process.env,timeout:15000
 }).trim();
}
function fixtureFile(filename){
 execFileSync('psql',['-X','-v','ON_ERROR_STOP=1','-f',filename],{
  stdio:'pipe',encoding:'utf8',env:process.env,timeout:15000
 });
 checks++;
}
async function rpc(who,name,args){
 return request('POST','/rest/v1/rpc/'+name,{
  jwt:sessions[who]?.access_token,body:args
 });
}
async function authSetup(){
 for(const [role,email] of emailNames){
  const newUser=requireOk(await request('POST','/auth/v1/admin/users',{
   jwt:service,key:service,body:{email,password,email_confirm:true,
    user_metadata:{demo_only:true,fictional:true}}
  }),'create fictional '+role);
  assert.match(newUser.id,/^[0-9a-f-]{36}$/i);
  identities[role]={id:newUser.id,email};
  const login=requireOk(await request('POST','/auth/v1/token?grant_type=password',{
   jwt:anon,body:{email,password}
  }),'sign in fictional '+role);
  assert.ok(login.access_token&&login.user.id===newUser.id,'Real GoTrue JWT must identify correct fictional user');
  sessions[role]=login;
 }
}
async function storage(method,name,who,contentType='image/png',bytes=null,opts={}){
 const url='/storage/v1/object/'+bucket+'/'+name;
 const headers={'Content-Type':contentType};
 if(method==='POST')headers['x-upsert']=opts.upsert?'true':'false';
 const body=bytes||undefined;
 return request(method,method==='GET'?'/storage/v1/object/authenticated/'+bucket+'/'+name:url,{
  jwt:sessions[who]?.access_token,body,headers
 });
}
const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wm2V2EAAAAASUVORK5CYII=','base64');

await authSetup();
fixtureFile('scripts/fixtures/marking-v2-supabase-local-seed.sql');

const hash=psql("SELECT private.mg2_fingerprint(r) FROM private.mg2_rubrics r WHERE id='"+paper+"'");
assert.match(hash,/^[a-f0-9]{64}$/);
const note='I independently checked this original fictional solution, rubric and current GCSE topic classification.';
const signed={
 p_rubric:paper,p_hash:hash,p_note:note,
 p_maths_checked:true,p_syllabus_checked:true,p_mark_scheme_checked:true
};
denied(await rpc('author','mg2_signoff_rubric',signed),'author self-approval');
const first=requireOk(await rpc('one','mg2_signoff_rubric',signed),'first examiner signoff');
assert.equal(first.approved,false);
const second=requireOk(await rpc('two','mg2_signoff_rubric',signed),'second independent examiner');
assert.equal(second.approved,true);

denied(await rpc('otherExaminer','mg2_assign_constructed',{
 p_rubric:paper,p_student:identities.student.id
}),'other-organisation examiner assigning');
const assignment=requireOk(await rpc('one','mg2_assign_constructed',{
 p_rubric:paper,p_student:identities.student.id
}),'assign original fictional question');
const attempt=assignment.attempt_id;
assert.match(attempt,/^[0-9a-f-]{36}$/i);
denied(await rpc('one','mg2_assign_constructed',{
 p_rubric:paper,p_student:identities.student.id
}),'duplicate version assignment');
const learner=requireOk(await rpc('student','mg2_my_constructed',{p_attempt:attempt}),'student question read');
assert.equal(learner.status,'assigned');
assert.match(learner.question,/96 kits/);
assert.ok(!('worked_solution'in learner)&&!('criteria'in learner)&&!('correctOption'in learner));
denied(await rpc('otherStudent','mg2_my_constructed',{p_attempt:attempt}),'other learner question');
denied(await rpc('student','mg2_examiner_constructed',{p_attempt:attempt}),'learner private rubric');
denied(await rpc('one','mg2_examiner_constructed',{p_attempt:attempt}),'examiner before submission');

requireOk(await request('POST','/storage/v1/bucket',{
 jwt:service,key:service,body:{id:bucket,name:bucket,public:false,
  file_size_limit:1048576,allowed_mime_types:['image/png','image/jpeg','application/pdf']}
}),'create isolated private evidence bucket');
const object=identities.student.id+'/'+attempt+'/work.png';
const wrongObject=identities.otherStudent.id+'/'+attempt+'/work.png';
denied(await storage('POST',object,'otherStudent','image/png',image),'other student upload to owner path');
denied(await storage('POST',wrongObject,'otherStudent','image/png',image),'other student upload to different attempt');
denied(await storage('POST',object,'parent','image/png',image),'parent upload');
denied(await storage('POST',object,null,'image/png',image),'anonymous upload');
denied(await storage('POST',identities.student.id+'/'+attempt+'/../work.png','student','image/png',image),
 'path traversal attempt');
denied(await storage('POST',identities.student.id+'/'+attempt+'/work.exe','student','application/octet-stream',image),
 'invalid MIME and object name');
const uploaded=requireOk(await storage('POST',object,'student','image/png',image),'assigned student uploads image');
assert.ok(uploaded.Key||uploaded.key||uploaded.Id||uploaded.id,'Storage API should return an uploaded object key');
denied(await storage('POST',object,'student','image/png',image,{upsert:true}),
 'student cannot upsert signed evidence');
const ownerRead=await storage('GET',object,'student');
requireOk(ownerRead,'student download own draft evidence');
assert.equal(ownerRead.raw.length,image.length);
denied(await storage('GET',object,'otherStudent'),'other student download');
denied(await storage('GET',object,'parent'),'parent read examiner attachment');
denied(await storage('GET',object,'one'),'examiner read before final submission');
denied(await storage('GET',object,'otherExaminer'),'cross organisation examiner read');

const written='5+3=8 equal parts. 96/8=12. Red has 5×12=60 kits, blue has 36, and they sum to 96.';
const save=requireOk(await rpc('student','mg2_save_constructed',{
 p_attempt:attempt,p_work:written,p_expected_revision:null,p_submit:true
}),'final student submission');
assert.equal(save.status,'submitted');
denied(await rpc('student','mg2_save_constructed',{
 p_attempt:attempt,p_work:written,p_expected_revision:1,p_submit:true
}),'resubmission');
denied(await storage('POST',identities.student.id+'/'+attempt+'/work.jpg','student','image/jpeg',image),
 'image upload after final submission');
const examinerRead=requireOk(await rpc('one','mg2_examiner_constructed',{p_attempt:attempt}),
 'authorised examiner reads working');
assert.match(examinerRead.written_work,/Red has/);
assert.equal(examinerRead.criteria.length,3);
assert.ok(examinerRead.worked_solution);
denied(await rpc('otherExaminer','mg2_examiner_constructed',{p_attempt:attempt}),
 'other-org examiner sees private scheme');
requireOk(await storage('GET',object,'one'),'examiner download submitted evidence');
denied(await storage('GET',object,'otherExaminer'),'other-org examiner download after submission');

const awards=[
 {id:'m-parts',awarded:true,note:'All eight equal parts were identified.'},
 {id:'a-unit',awarded:true,note:'One part correctly calculated as 12.'},
 {id:'b-check',awarded:false,note:'The check was omitted.'}
];
const released=requireOk(await rpc('one','mg2_staff_mark',{
 p_attempt:attempt,p_awards:awards,p_release:true,
 p_student_summary:'You found the parts and unit size. Add a final independent check.',
 p_parent_summary:'Praise the ratio method and ask the learner how to verify the total.',
 p_tutor_plan:'Practise checking ratio shares independently, before starting a new ratio.'
}),'human examiner publishes a fictional review');
assert.equal(released.earned,2);
assert.equal(released.possible,3);
const studentReport=requireOk(await rpc('student','mg2_student_report',{p_attempt:attempt}),
 'learner gets only released result');
assert.equal(studentReport.earned,2);
assert.ok(!JSON.stringify(studentReport).includes('The check was omitted.'));
const parentReport=requireOk(await rpc('parent','mg2_family_report',{
 p_attempt:attempt,p_role:'parent'
}),'parent gets linked report');
assert.equal(parentReport.view_role,'parent');
assert.ok(!('criteria'in parentReport)&&!('teaching_plan'in parentReport));
const tutorReport=requireOk(await rpc('tutor','mg2_family_report',{
 p_attempt:attempt,p_role:'tutor'
}),'assigned tutor gets teaching plan');
assert.equal(tutorReport.view_role,'tutor');
assert.equal(tutorReport.criteria.length,3);
denied(await rpc('parent','mg2_family_report',{p_attempt:attempt,p_role:'tutor'}),
 'parent trying to access tutor notes');
denied(await rpc('otherStudent','mg2_student_report',{p_attempt:attempt}),
 'unrelated student report');

psql("UPDATE public.learner_view_invitations SET revoked_at=now() WHERE viewer_email='mg2-parent@example.com'");
denied(await rpc('parent','mg2_family_report',{p_attempt:attempt,p_role:'parent'}),
 'revoked parent report');
psql("DELETE FROM public.memberships WHERE user_id=(SELECT id FROM auth.users WHERE email='mg2-examiner-one@example.com')");
denied(await storage('GET',object,'one'),'revoked examiner image read');
denied(await rpc('one','mg2_examiner_constructed',{p_attempt:attempt}),
 'revoked examiner private scheme read');
psql("UPDATE public.student_entitlements SET ends_at=now()-interval '1 minute' WHERE student_id=(SELECT id FROM auth.users WHERE email='mg2-student@example.com')");
denied(await storage('GET',object,'student'),'expired learner image access');

console.log('PASS — '+checks+' real local Supabase Auth/JWT, REST RPC and private Storage checks with fictional accounts; no hosted project or real learner data.');
