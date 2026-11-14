/* MathsGrove · original editorial feedback bank preview, not a marking service.
 * Requires a fully human-reviewed fictional criterion-award result from
 * criterion-engine.mjs. No auth, data access, auto-awards or release.
 */
import {validateRubric} from './criterion-engine.mjs';

const asText = x=>typeof x==='string'?x.trim():'';
const ensure = (condition,msg)=>{if(!condition)throw Error(msg)};
const fields=[
 'evidenceToInspect','studentCorrection','studentCheck',
 'independentRecheck','parentPrompt','tutorIntervention'
];
const unsafe=/\b(?:guaranteed|mastered|failing|lazy|predicted grade|definitely misunderstood)\b/i;

export function validateFeedbackBank(rubric,bank){
 validateRubric(rubric);
 ensure(bank && bank.status==='public_editorial_feedback_only' &&
   Array.isArray(bank.entries),'Feedback bank is not an approved editorial catalogue.');
 const seen=new Set(),own=[];
 for(const row of bank.entries){
  ensure(row && typeof row==='object' && !Array.isArray(row),
   'Each feedback entry must be an object.');
  const key=row.rubricId+':'+row.criterionId;
  ensure(!seen.has(key),'Duplicate feedback entry '+key);
  seen.add(key);
  for(const field of fields){
   ensure(asText(row[field]).length>=35,field+' requires meaningful original guidance.');
   ensure(!unsafe.test(row[field]),'Feedback must not overstate the learner diagnosis.');
  }
  if(row.rubricId===rubric.id){
   ensure(rubric.criteria.some(c=>c.id===row.criterionId),
     'Feedback references a criterion absent from the signed rubric.');
   own.push(row);
  }
 }
 ensure(own.length===rubric.criteria.length,
  'The rubric must have exactly one reviewed feedback entry per criterion.');
 return {rubricId:rubric.id,covered:own.length,total:rubric.maxMarks};
}

export function buildFictionalFeedbackPlan(rubric,evaluation,bank,role){
 validateFeedbackBank(rubric,bank);
 ensure(['student','parent','tutor'].includes(role),'Unknown feedback audience.');
 ensure(evaluation?.source==='fictional_editorial_only' &&
   evaluation?.rubricId===rubric.id && evaluation?.reviewed===true &&
   evaluation?.publishable===false && Array.isArray(evaluation.criteria) &&
   Array.isArray(evaluation.missing) && evaluation.missing.length===0,
 'Only a complete fictional examiner review can yield a preview.');
 ensure(evaluation.criteria.length===rubric.criteria.length &&
   evaluation.possible===rubric.maxMarks,'Rubric/result totals differ.');
 const byId=new Map();
 for(const item of evaluation.criteria){
  ensure(item&&typeof item.id==='string'&&!byId.has(item.id) &&
    rubric.criteria.some(c=>c.id===item.id),'Unexpected or duplicate evaluated criterion.');
  ensure((item.status==='awarded'&&item.points===1)||
    (item.status==='not_awarded'&&item.points===0),
   'Unassessed or inconsistent evidence cannot appear in a completed report.');
  byId.set(item.id,item);
 }
 ensure(rubric.criteria.every(c=>byId.has(c.id)),'Missing rubric criterion.');
 const earned=evaluation.criteria.reduce((sum,c)=>sum+c.points,0);
 ensure(earned===evaluation.earned,'Reported total must match examiner-awarded criteria.');
 const bankRows=new Map(bank.entries.filter(x=>x.rubricId===rubric.id).map(x=>[x.criterionId,x]));
 const successes=rubric.criteria.filter(c=>byId.get(c.id).points===1);
 const missed=rubric.criteria.filter(c=>byId.get(c.id).points===0);
 const common={
  status:'editorial_preview_only',
  role,qualification:rubric.route.qualification,academicLevel:rubric.route.level,
  topic:rubric.topic,oneQuestionOnly:true,
  score:{earned,possible:rubric.maxMarks},
  strengths:successes.map(x=>x.skill),
  focusCount:missed.length,
  releaseAuthorised:false,
  warning:'Human-awarded fictional example, not a grade, a verified diagnosis or a released learner report.'
 };
 if(role==='parent')return {
  ...common,
  support:missed.map(c=>({skill:c.skill,question:bankRows.get(c.id).parentPrompt})),
  message:missed.length?
   'Ask about one of the methods in the reviewed question; later independent practice will be needed.':
   'Praise the careful explanation and encourage a different, independently checked problem.'
 };
 if(role==='student')return {
  ...common,
  nextSteps:missed.map(c=>{
   const row=bankRows.get(c.id);
   return {skill:c.skill,awarded:0,possible:1,
    whatToTry:row.studentCorrection,
    checkYourWork:row.studentCheck,
    futureRecheck:row.independentRecheck};
  }),
  message:missed.length?
   'These are next-step suggestions after an examiner decision, not claims about exactly why you made an error.':
   'All available marks were awarded on this fictional question. Try a fresh question to check transfer.'
 };
 return {
  ...common,
  teaching:missed.map(c=>{
   const row=bankRows.get(c.id),item=byId.get(c.id);
   return {criterion:c.id,markCode:c.code,skill:c.skill,
    observedWorking:item.evidence||'Not described in the fictional review',
    questionToInvestigate:row.evidenceToInspect,
    intervention:row.tutorIntervention,
    recheck:row.independentRecheck};
  }),
  message:'The missed criterion identifies an award decision, not a proven misconception. Verify the working before planning intervention.'
 };
}
