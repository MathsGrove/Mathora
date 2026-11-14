/* Route-sensitive exam-style policy. This is an editorial VALIDATION boundary,
 * not a claim of current awarding-body endorsement or grade equivalence.
 * Commercial plans (Weekly/Daily/Exam) do not choose mark rules.
 */
import {validateRubric,assessExaminerAwards} from './criterion-engine.mjs';

export const EXAM_STYLES=Object.freeze({
 GCSE: Object.freeze({levels:['Foundation','Higher'],format:'constructed',codes:['M1','A1','B1'],boards:['AQA','Pearson Edexcel','OCR']}),
 IGCSE: Object.freeze({levels:['Core','Extended'],format:'constructed',codes:['M1','A1','B1'],boards:['Cambridge International 0580','Pearson International GCSE']}),
 AS_A_LEVEL: Object.freeze({levels:['AS','A Level','Pure mathematics'],format:'constructed',codes:['M1','A1','B1'],boards:['AQA','Pearson Edexcel','OCR','Cambridge International 9709']}),
 'Further Mathematics': Object.freeze({levels:['AS','A Level'],format:'constructed',codes:['M1','A1','B1'],boards:['AQA','Pearson Edexcel','OCR']}),
 IB: Object.freeze({levels:['AA SL','AA HL','AI SL','AI HL'],format:'constructed',codes:['M1','A1','R1'],boards:['International Baccalaureate']}),
 TMUA: Object.freeze({levels:['Paper 1','Paper 2'],format:'single_choice',codes:[],boards:['UAT-UK']})
});
const allowedPlans=new Set(['weekly','daily','exam']);
const set=(a)=>new Set(a);
const assert=(condition,message)=>{if(!condition)throw Error(message)};
const normalQualification=q=>q==='A Level'?'AS_A_LEVEL':q;

export function validateExamStyle(example){
 assert(example && typeof example==='object' && !Array.isArray(example),'Example must be a structured object.');
 const route=example.route;
 assert(route && typeof route==='object','Qualification metadata required.');
 const qualification=normalQualification(route.qualification);
 const policy=EXAM_STYLES[qualification];
 assert(policy,'Unsupported academic qualification.');
 assert(policy.levels.includes(route.level),'Level is not offered for the chosen qualification.');
 assert(allowedPlans.has(example.plan),'Specify the independent Weekly/Daily/Exam commercial plan.');
 assert(['public_editorial_example','public_editorial_mcq'].includes(example.status),'Only publicly illustrative, unmoderated examples can enter this validator.');
 assert(typeof example.topic==='string' && example.topic.trim().length>=5,'Topic required.');
 assert(typeof example.question==='string' && example.question.trim().length>=24,'Original question required.');
 assert(typeof example.solution==='string' && example.solution.trim().length>=30,'Complete original working required.');
 if(example.board !== undefined && example.board !== null){
  assert(policy.boards.includes(example.board),'Example board is not part of the selected qualification policy.');
 }
 assert(example.reviewState==='unmoderated' || example.reviewState==='editorial_test_only',
  'These public examples are not examiner-approved or released.');
 const explicitStyle=example.format;
 assert(explicitStyle===policy.format,'Response format must match the qualification.');
 if(policy.format==='single_choice'){
  assert(example.maxMarks===1,'Official-style TMUA preparation MCQ must be scored as one point.');
  assert(Array.isArray(example.choices)&&example.choices.length===5,'TMUA MCQ needs five distinct options.');
  const ids=example.choices.map(x=>x?.id);
  assert(ids.join(',')==='A,B,C,D,E','TMUA options must be labelled A–E once each.');
  assert(new Set(example.choices.map(x=>x?.text?.trim())).size===5,'Distinct MCQ options are needed.');
  assert(ids.includes(example.correctOption),'Valid MCQ answer key required for a PUBLIC editorial example.');
  assert(!example.criteria && !example.allowMethodMarks,
    'TMUA options do not earn fabricated M1/A1/B1 working marks.');
  assert(route.calculator==='not_allowed','TMUA has a no-calculator policy.');
 }else{
  validateRubric({...example,status:'public_editorial_example'});
  assert(example.criteria.every(c=>policy.codes.includes(c.code)),
   'The marking-code system is not valid for this exam family.');
  if(qualification==='IB')assert(example.criteria.some(c=>c.code==='R1'),
   'This IB reasoning example must actually credit reasoning.');
  if(qualification!=='IB')assert(!example.criteria.some(c=>c.code==='R1'),
   'R1 cannot be substituted for B1 in a non-IB scheme.');
  assert(route.calculator==='allowed'||route.calculator==='not_allowed'||route.calculator==='paper_specific',
   'Calculator permission must be explicit and board/paper mapped before moderation.');
 }
 return {
  qualification,level:route.level,format:policy.format,maxMarks:example.maxMarks,
  codeSystem:policy.codes.join('/'),plan:example.plan,
  verifiedOfficialFormat:false,moderated:false,studentAssignable:false
 };
}

export function reviewPublicPracticeExample(example,{awards,selectedOption,completeReview=false}={}){
 const policy=validateExamStyle(example);
 if(policy.format==='single_choice'){
  assert(typeof selectedOption==='string' && /^[A-E]$/.test(selectedOption),
   'MCQ selection must be a single A–E option.');
  // A PUBLIC practice fixture only. In production, answer key belongs on server
  // and any released feedback still requires a separate authorised release.
  return {
   kind:'public-fictional-mcq',
   earned:Number(selectedOption===example.correctOption),possible:1,
   correctAnswerHidden:true,approved:false,learnerReportReleased:false,
   reportEligible:false,plan:policy.plan,qualification:policy.qualification
  };
 }
 const result=assessExaminerAwards({...example,status:'public_editorial_example'},awards,
  {completeReview});
 return {
  ...result,
  qualifier:policy.qualification,plan:policy.plan,
  markSystem:policy.codeSystem,approved:false,reportEligible:false
 };
}
