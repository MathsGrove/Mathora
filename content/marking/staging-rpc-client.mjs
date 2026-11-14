/* MathsGrove experimental v2 RPC client.
 * Only for disposable STAGING with fictional accounts. This is never
 * imported into a public Pages entrypoint or current production Studio.
 * Security lives in the database functions; client checks are not RLS.
 */
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const check=(ok,message)=>{if(!ok)throw Error(message)};
const clean=text=>typeof text==='string'?text.trim():'';
export function createExperimentalMarkingClient(db,{environment,enabled}={}){
 check(environment==='disposable_staging'&&enabled===true,
   'Constructed-response RPCs are disabled outside explicitly enabled disposable staging.');
 check(db&&typeof db.rpc==='function','A connected staging Supabase-style RPC client is required.');
 async function rpc(name,args){
  const {data,error}=await db.rpc(name,args);
  if(error)throw Error(error.message||'Staging marking RPC failed.');
  if(!data||typeof data!=='object')throw Error('Unexpected staging RPC response.');
  return data;
 }
 function id(x){check(typeof x==='string'&&uuid.test(x),'Valid fictional attempt or rubric UUID required.');return x}
 return Object.freeze({
  async assignConstructed({rubricId,studentId}={}){
   // The server resolves the organisation from the approved rubric and verifies
   // the learner's active programme; no caller-supplied org or staff identity.
   return rpc('mg2_assign_constructed',{p_rubric:id(rubricId),p_student:id(studentId)});
  },
  async assignedWork(attemptId){
   // Server returns only the caller's question prompt and their own draft.
   return rpc('mg2_my_constructed',{p_attempt:id(attemptId)});
  },
  async saveConstructed({attemptId,writtenWork,expectedRevision=null,submit=false}={}){
   id(attemptId);
   check(submit===true||submit===false,'An explicit draft or submit decision is required.');
   check(typeof writtenWork==='string'&&writtenWork.length<=12000,
     'Working must be text within the 12,000-character pilot limit.');
   check(expectedRevision===null||
     (Number.isInteger(expectedRevision)&&expectedRevision>=1&&expectedRevision<=2147483647),
     'Expected revision must be null on first save or a positive integer.');
   if(submit)check(writtenWork.trim().length>=30,
     'Final submission requires meaningful written working.');
   // No client-supplied mark, grade, user ID, organisation or release status.
   // The revision check and one-time submission lock execute transactionally in SQL.
   return rpc('mg2_save_constructed',{
    p_attempt:attemptId,p_work:writtenWork,
    p_expected_revision:expectedRevision,p_submit:submit
   });
  },
  async examinerSubmission(attemptId){
   // Only server-authorised staff see solution, rubric and submitted answer.
   return rpc('mg2_examiner_constructed',{p_attempt:id(attemptId)});
  },
  async signoffRubric({rubricId,fingerprint,note,mathsChecked,syllabusChecked,markSchemeChecked}={}){
   id(rubricId);check(typeof fingerprint==='string'&&/^[a-f0-9]{64}$/i.test(fingerprint),'Rubric hash required.');
   check(clean(note).length>=25,'Substantive reviewer note required.');
   check(mathsChecked===true&&syllabusChecked===true&&markSchemeChecked===true,
     'Explicit independent mathematics, syllabus and mark-scheme review required.');
   return rpc('mg2_signoff_rubric',{
    p_rubric:rubricId,p_hash:fingerprint.toLowerCase(),p_note:clean(note),
    p_maths_checked:true,p_syllabus_checked:true,p_mark_scheme_checked:true
   });
  },
  async saveReview({attemptId,awards,release=false,studentSummary='',parentSummary='',tutorPlan=''}={}){
   id(attemptId);
   check(release===true||release===false,'Release must be an explicit boolean.');
   check(Array.isArray(awards)&&awards.length>=1&&awards.length<=30,
     'All examiner criteria must be supplied as explicit decisions.');
   const ids=new Set();
   const out=awards.map(a=>{
    check(a&&typeof a.id==='string'&&!ids.has(a.id)&&/^[a-z][a-z0-9-]{1,70}$/.test(a.id),
     'Unique criterion ID required.');
    ids.add(a.id);
    check(a.awarded===true||a.awarded===false,
     'A criterion cannot silently be treated as zero; award true or false explicitly.');
    check(!a.awarded||clean(a.note).length>=8,'Earned credit requires observed evidence.');
    const implied=a.methodImplied===true;
    if(implied)check(clean(a.impliedReason).length>=15,'A method exception requires a reason.');
    return {
     id:a.id,awarded:a.awarded,note:clean(a.note),
     methodImplied:implied,impliedReason:implied?clean(a.impliedReason):''
    };
   });
   if(release)check([studentSummary,parentSummary,tutorPlan].every(x=>clean(x).length>=15),
     'Releasing requires three human-reviewed, role-separated summaries.');
   // Do not accept, calculate or transmit any browser-supplied score, role,
   // organisation, examiner identity, author ID or release timestamp.
   return rpc('mg2_staff_mark',{
    p_attempt:attemptId,p_awards:out,p_release:release,
    p_student_summary:clean(studentSummary),p_parent_summary:clean(parentSummary),
    p_tutor_plan:clean(tutorPlan)
   });
  },
  async studentReport(attemptId){
   return rpc('mg2_student_report',{p_attempt:id(attemptId)});
  },
  async linkedLearnerReport(attemptId,role){
   check(role==='parent'||role==='tutor','Explicit linked-audience role required.');
   return rpc('mg2_family_report',{p_attempt:id(attemptId),p_role:role});
  }
 });
}
