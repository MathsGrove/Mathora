/* MathsGrove human-in-the-loop marking assistant.
 * NO automated award decisions, grades, publication or student-data fetching.
 * Exam board M/A/B/R rules remain in the approved server rubric; suggestions are
 * editable proposals, NOT verified error diagnoses.
 */
const ensure=(ok,message)=>{if(!ok)throw Error(message)};
const str=x=>typeof x==='string'?x.trim():'';
const key=/^[a-z][a-z0-9-]{1,70}$/;

export function validateExaminerRecord(record){
 ensure(record&&typeof record==='object'&&!Array.isArray(record),'Submitted examiner record required.');
 ensure(record.status==='submitted','Only submitted working can be marked.');
 ensure(typeof record.attempt_id==='string'&&record.attempt_id.length>20,'Attempt reference missing.');
 ensure(typeof record.question==='string'&&record.question.trim().length>15,'Question unavailable.');
 ensure(typeof record.written_work==='string'&&record.written_work.trim().length>=30,
   'Submitted written working unavailable.');
 ensure(Array.isArray(record.criteria)&&record.criteria.length>=1&&record.criteria.length<=30,
   'Reviewed criterion scheme required.');
 ensure(Number.isInteger(record.max_marks)&&record.max_marks===record.criteria.length,
   'Every mark must correspond to one explicit criterion.');
 const seen=new Set();
 for(const criterion of record.criteria){
  ensure(criterion&&key.test(criterion.id)&&!seen.has(criterion.id),
   'Invalid or duplicate mark criterion.');
  seen.add(criterion.id);
  ensure(['M1','A1','B1','R1'].includes(criterion.code),'Unsupported criterion mark code.');
  ensure(str(criterion.skill).length>=4&&str(criterion.description).length>=10&&
   str(criterion.missingFeedback).length>=15,'Mark criterion guidance incomplete.');
  ensure(Array.isArray(criterion.dependsOn)&&criterion.dependsOn.every(x=>typeof x==='string'),
   'Criterion dependencies must be explicit.');
 }
 for(const c of record.criteria){
  ensure(c.dependsOn.every(id=>seen.has(id)), 'Unknown criterion dependency.');
 }
 return record;
}

export function prepareExaminerAwards(record,decisions){
 validateExaminerRecord(record);
 ensure(Array.isArray(decisions)&&decisions.length===record.criteria.length,
  'Every mark requires an explicit examiner decision.');
 const byId=new Map();
 for(const item of decisions){
  ensure(item&&key.test(item.id)&&!byId.has(item.id),'Duplicate or invalid mark decision.');
  ensure(item.awarded===true||item.awarded===false,'Do not infer unmarked criteria as zero.');
  ensure(typeof item.note==='string'&&item.note.length<=1000,'Examiner note must be text.');
  if(item.awarded)ensure(str(item.note).length>=8,'Credited marks require a specific observed working note.');
  byId.set(item.id,item);
 }
 const code=new Map(record.criteria.map(x=>[x.id,x.code]));
 return record.criteria.map(rule=>{
  const d=byId.get(rule.id);
  ensure(d,'Missing decision for '+rule.id);
  let implied=d.methodImplied===true;
  ensure(!d.methodImplied||d.methodImplied===true,'Invalid implied-method flag.');
  if(implied){
   ensure(d.awarded&&rule.code==='A1'&&rule.allowImpliedMethod===true,
    'Implied method is permitted only by an A1 rubric.');
   ensure(str(d.impliedReason).length>=15,'Give the specific evidence for implied method.');
  }
  if(d.awarded){
   let missedMethod=false;
   for(const dep of rule.dependsOn){
    const prior=byId.get(dep);
    ensure(prior,'Missing prerequisite mark.');
    if(!prior.awarded){
     ensure(implied&&code.get(dep)==='M1',
      'Credit for '+rule.id+' depends on the stated method award.');
     missedMethod=true;
    }
   }
   ensure(!implied||missedMethod,'Do not claim implied method if explicit method credit exists.');
  }
  return {id:rule.id,awarded:d.awarded,note:str(d.note),
   methodImplied:implied,impliedReason:implied?str(d.impliedReason):''};
 });
}

// Guidance is composed from credited / uncredited *human decisions*, never
// from AI analysis of a student's written answer. Parent text excludes private
// examiner evidence, while tutor text is subject to backend authorisation.
export function proposeRoleFeedback(record,decisions){
 const awards=prepareExaminerAwards(record,decisions);
 const byId=new Map(awards.map(x=>[x.id,x]));
 const missed=record.criteria.filter(c=>!byId.get(c.id).awarded);
 const credited=record.criteria.filter(c=>byId.get(c.id).awarded);
 const lead=missed.length?
  'On this answer, credit was not awarded for '+missed.slice(0,3).map(c=>c.skill.toLowerCase()).join(', ')+'.':
  'On this answer, all available criteria were credited.';
 const student=missed.length?
  lead+' '+missed.slice(0,2).map(c=>c.missingFeedback).join(' ')+
  ' Try a fresh question and check each step independently.':
  lead+' Try a different question to check that you can use the method independently.';
 const parent=missed.length?
  'On this question, encourage your learner to explain '+missed.slice(0,2).map(c=>c.skill.toLowerCase()).join(' and ')+
  '. Ask them to talk through a fresh example without giving the answer.':
  'Praise the clear working on this question. Ask your learner to explain the reasoning on a new example.';
 const tutor=missed.length?
  'Inspect the submitted working for '+missed.map(c=>c.skill.toLowerCase()).join('; ')+
  '. Suggested intervention: '+missed.slice(0,2).map(c=>c.missingFeedback).join(' ')+
  ' Verify the learner can transfer the method to an unseen original question.':
  'All criteria received credit on this question. Check independent transfer with a fresh problem before increasing difficulty.';
 return {
  scorePreview:{earned:credited.length,possible:record.max_marks},
  criterionFeedback:record.criteria.map(c=>({
   id:c.id,code:c.code,skill:c.skill,credited:byId.get(c.id).awarded,
   nextStep:byId.get(c.id).awarded?
    'Credit awarded on this worked answer.':'Not credited on this answer. '+c.missingFeedback,
   examinerNote:byId.get(c.id).note
  })),
  studentSummary:student,parentSummary:parent,tutorPlan:tutor,
  releaseAuthorised:false,
  source:'human-awarded criteria — editable suggestions only',
  warning:'The examiner must inspect the actual working, edit each audience summary and explicitly authorise release.'
 };
}

export function validReleaseSummary(value){
 return str(value).length>=15&&str(value).length<=3000;
}
