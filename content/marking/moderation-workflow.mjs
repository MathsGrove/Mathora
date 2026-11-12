/* MathsGrove · isolated EDITORIAL moderation and examiner calibration.
 * Requires Node.js; no connection to auth, Supabase, learners or live release.
 * A metadata reviewer ID is never proof of the person's actual identity.
 */
import { createHash } from 'node:crypto';
import { validateRubric, assessExaminerAwards } from './criterion-engine.mjs';

const isObject = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const str = x => typeof x === 'string' ? x.trim() : '';
const fail = msg => { throw new Error(msg); };
const validId = x => /^[a-z][a-z0-9_-]{2,70}$/.test(str(x));
const stable = value => {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (isObject(value)) return '{' + Object.keys(value).sort()
    .map(key => JSON.stringify(key) + ':' + stable(value[key])).join(',') + '}';
  if (value === null || ['string','number','boolean'].includes(typeof value)) return JSON.stringify(value);
  return fail('Unsupported rubric value in canonical fingerprint.');
};
export function rubricFingerprint(rubric) {
  validateRubric(rubric);
  return createHash('sha256').update(stable(rubric),'utf8').digest('hex');
}

export function reviewModerationPacket(rubric, packet = {}) {
  validateRubric(rubric);
  if (!isObject(packet)) fail('Moderation packet must be an object.');
  const digest = rubricFingerprint(rubric);
  const blockers = [];
  const issues = (condition,why) => {if (!condition) blockers.push(why);};
  const isYear = /^\d{4}(?:[-/]\d{4})?$/.test(str(packet.syllabusYear));
  const reviewers = Array.isArray(packet.reviews) ? packet.reviews : [];
  issues(validId(packet.authorId),'A recorded author identity is required.');
  issues(str(packet.board).length >= 4 && !/neutral|pending|unknown|example/i.test(str(packet.board)),
    'Map the question to a real approved awarding body, rather than a board-neutral draft.');
  issues(isYear,'Specify the approved syllabus/examination year.');
  issues(str(packet.syllabusObjective).length >= 12,'Provide a syllabus objective and exact route reference.');
  issues(str(packet.calculatorPolicy).length >= 8,'Record calculator policy for the selected syllabus.');
  issues(str(packet.provenance).length >= 16,'Document original-content provenance and rights.');
  issues(['constructed_response','multiple_choice'].includes(packet.format),
    'Record the actual assessment response format.');
  issues(packet.format === 'constructed_response',
    'M/A/B criterion moderation here is for original constructed responses only.');
  issues(packet.rubricFingerprint === digest,
    'Moderation must bind to the exact immutable rubric fingerprint.');
  issues(str(packet.qualification) === rubric.route.qualification &&
         str(packet.academicLevel) === rubric.route.level,
    'Moderation qualification and academic level must match the question.');
  issues(str(packet.board) === str(rubric.route.board) &&
         !/neutral|pending|unknown|example/i.test(str(rubric.route.board)),
    'Awarding body must be mapped into the exact signed rubric route.');
  issues(str(packet.syllabusYear) === str(rubric.route.syllabusYear) &&
         rubric.route.syllabusStatus === 'independently mapped',
    'Syllabus year and independent mapping must be recorded in the signed rubric.');
  issues(str(packet.syllabusObjective) === str(rubric.route.syllabusObjective) &&
         str(packet.calculatorPolicy) === str(rubric.route.calculatorPolicy) &&
         str(packet.provenance) === str(rubric.provenance),
    'Syllabus objective, calculator rule and rights provenance must be part of the signed rubric.');
  issues(reviewers.length >= 2,'At least two independent examiner approvals are needed.');
  issues(reviewers.length <= 5,'Reviewer count exceeds this pilot workflow.');
  const ids = new Set();
  let approved = 0;
  for (const [index,review] of reviewers.entries()) {
    const label = 'Reviewer ' + (index+1);
    if (!isObject(review)) {blockers.push(label + ' must be an object.');continue;}
    issues(validId(review.reviewerId),label + ' needs a reviewer identifier.');
    issues(!ids.has(review.reviewerId),label + ' duplicates an earlier reviewer.');
    ids.add(review.reviewerId);
    issues(review.reviewerId !== packet.authorId,label + ' cannot also be the author.');
    issues(review.fingerprint === digest,label + ' did not sign off the exact rubric version.');
    issues(review.decision === 'approve',label + ' did not approve the rubric.');
    issues(review.mathsVerified === true,label + ' has not explicitly verified the mathematics.');
    issues(review.markSchemeVerified === true,label + ' has not explicitly checked mark dependencies and equivalent methods.');
    issues(review.syllabusVerified === true,label + ' has not explicitly verified current syllabus fit.');
    issues(str(review.observation).length >= 18,label + ' needs a substantive independent review note.');
    issues(typeof review.reviewedAt === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(review.reviewedAt)
      && !Number.isNaN(Date.parse(review.reviewedAt)),
      label + ' needs a valid ISO review timestamp.');
    if(review.decision === 'approve')approved++;
  }
  // Reviewer IDs and checkboxes are editorial assertions only: no identity verification.
  return Object.freeze({
    kind:'public-editorial-moderation-check',
    questionId:rubric.id, fingerprint:digest, questionMarks:rubric.maxMarks,
    reviewCount:reviewers.length,approvedCount:approved,
    eligibleForIndependentSignoff:blockers.length===0,
    blockers:Object.freeze(blockers),
    releaseAuthorised:false, dataMigrationAuthorised:false
  });
}

function completeSheet(rubric, sheet) {
  if (!isObject(sheet)) fail('Examiner calibration sheet must be an object.');
  if (!validId(sheet.examinerId)) fail('Examiner ID is required.');
  if (sheet.fingerprint !== rubricFingerprint(rubric)) fail('Sheet is for a different rubric version.');
  if (!/^fictional-[a-z0-9-]{3,72}$/.test(str(sheet.fixtureId)))
    fail('Only explicitly fictional calibration fixtures are supported.');
  if ('studentId' in sheet || 'student_id' in sheet || 'email' in sheet || 'taskId' in sheet)
    fail('Never put actual learner identity or task identifiers into this public editorial check.');
  const result = assessExaminerAwards(rubric,sheet.awards,{completeReview:true});
  return { examinerId:sheet.examinerId, fixtureId:sheet.fixtureId, result };
}

export function compareIndependentMarking(rubric, first, second) {
  validateRubric(rubric);
  const left=completeSheet(rubric,first),right=completeSheet(rubric,second);
  if(left.examinerId===right.examinerId)fail('Calibration requires two distinct examiners.');
  if(left.fixtureId!==right.fixtureId)fail('Calibration must compare the same fictional work.');
  const mismatches = [];
  for(let i=0;i<rubric.criteria.length;i++){
    const a=left.result.criteria[i],b=right.result.criteria[i];
    if(a.points!==b.points)mismatches.push({
      id:a.id,code:a.code,skill:a.skill,first:a.points,second:b.points
    });
  }
  const matched = rubric.criteria.length - mismatches.length;
  return Object.freeze({
    kind:'fictional-double-marking-calibration',
    fixtureId:left.fixtureId,fingerprint:rubricFingerprint(rubric),
    examiners:Object.freeze([left.examinerId,right.examinerId]),
    firstScore:left.result.earned,secondScore:right.result.earned,
    marksCompared:rubric.criteria.length,matched,
    agreementPercent:Math.round(100*matched/rubric.criteria.length),
    differences:Object.freeze(mismatches),
    requiresAdjudication:mismatches.length>0,
    // This is educational editorial QA, never a release or permission decision.
    releaseAuthorised:false,studentDataIncluded:false
  });
}

export function adjudicateCalibration(rubric, comparison, adjudication) {
  validateRubric(rubric);
  if(!isObject(comparison) || comparison.kind!=='fictional-double-marking-calibration' ||
     comparison.fingerprint!==rubricFingerprint(rubric)) fail('Calibration fingerprint mismatch.');
  if(!comparison.requiresAdjudication)fail('No disagreement requires an adjudicator.');
  if(!isObject(adjudication) || !validId(adjudication.examinerId) ||
     comparison.examiners.includes(adjudication.examinerId))
    fail('A separate third examiner is required for adjudication.');
  if(adjudication.fixtureId!==comparison.fixtureId)fail('Adjudication must use the same fictional fixture.');
  if(adjudication.fingerprint!==comparison.fingerprint)fail('Adjudication fingerprint mismatch.');
  const finalSheet = completeSheet(rubric,adjudication);
  if(str(adjudication.explanation).length<25)fail('Adjudication needs an explicit explanation of the resolved mark decisions.');
  return Object.freeze({
    kind:'fictional-calibration-adjudicated',
    fixtureId:comparison.fixtureId,fingerprint:comparison.fingerprint,
    moderatorId:finalSheet.examinerId,
    finalMarks:finalSheet.result.earned,
    possible:rubric.maxMarks,unresolved:0,
    publicationApproved:false,learnerReportReleased:false
  });
}
