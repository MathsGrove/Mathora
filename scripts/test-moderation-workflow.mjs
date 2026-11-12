import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rubricFingerprint, reviewModerationPacket, compareIndependentMarking, adjudicateCalibration } from '../content/marking/moderation-workflow.mjs';

const examples = JSON.parse(readFileSync('content/marking/original-rubric-examples.json','utf8')).examples;
assert.deepEqual(examples.map(x=>x.route.qualification),['GCSE','IGCSE','A Level']);
for(const example of examples){
  assert.match(rubricFingerprint(example),/^[a-f0-9]{64}$/);
  assert.equal(reviewModerationPacket(example).eligibleForIndependentSignoff,false);
  assert.equal(reviewModerationPacket(example).releaseAuthorised,false);
}
const rubric=structuredClone(examples[0]);
rubric.route.board='Pearson Edexcel';
rubric.route.syllabusYear='2026';
rubric.route.syllabusStatus='independently mapped';
rubric.route.syllabusObjective='GCSE ratio and proportional reasoning in original structured response';
rubric.route.calculatorPolicy='Calculator status to be confirmed against the target paper';
rubric.provenance='Original authored question with documented MathsGrove reuse rights';
const digest=rubricFingerprint(rubric);
const clone=structuredClone(rubric);clone.route={...clone.route};
assert.equal(rubricFingerprint(clone),digest,'Object key order and cloning must not change the digest');
const tampered=structuredClone(rubric);
tampered.criteria[2].description+=' (editorial change)';
assert.notEqual(rubricFingerprint(tampered),digest,'Mark-scheme changes require a new signoff');
const approve=(reviewerId)=>({
  reviewerId,fingerprint:digest,decision:'approve',
  mathsVerified:true,markSchemeVerified:true,syllabusVerified:true,
  observation:'Fictional independent editor checked equivalent methods and all four marks.',
  reviewedAt:'2026-11-12T08:00:00Z'
});
const packet={
 authorId:'author_alpha',board:'Pearson Edexcel',syllabusYear:'2026',
 syllabusObjective:'GCSE ratio and proportional reasoning in original structured response',
 calculatorPolicy:'Calculator status to be confirmed against the target paper',
 provenance:'Original authored question with documented MathsGrove reuse rights',
 qualification:rubric.route.qualification,academicLevel:rubric.route.level,
 format:'constructed_response',rubricFingerprint:digest,
 reviews:[approve('examiner_one'),approve('examiner_two')]
};
const positive=reviewModerationPacket(rubric,packet);
assert.equal(positive.eligibleForIndependentSignoff,true);
assert.equal(positive.blockers.length,0);
assert.equal(positive.releaseAuthorised,false,'Even perfect editorial metadata cannot release learner work');
assert.equal(positive.dataMigrationAuthorised,false,'Editorial metadata must not authorise SQL changes');
assert.equal(reviewModerationPacket(examples[0],{...packet,rubricFingerprint:rubricFingerprint(examples[0])}).eligibleForIndependentSignoff,false,
 'Original board-neutral candidates cannot be approved by changing packet labels alone');
const rubricMismatch=structuredClone(rubric);rubricMismatch.route.calculatorPolicy='Calculator permitted';
assert.equal(reviewModerationPacket(rubricMismatch,{...packet,rubricFingerprint:rubricFingerprint(rubricMismatch)}).eligibleForIndependentSignoff,false,
 'Route changes require matching signed moderation metadata');
const changed=(changes)=>reviewModerationPacket(rubric,{...packet,...changes});
assert.equal(changed({board:'Board-neutral editorial draft'}).eligibleForIndependentSignoff,false);
assert.equal(changed({syllabusYear:''}).eligibleForIndependentSignoff,false);
assert.equal(changed({rubricFingerprint:'0'.repeat(64)}).eligibleForIndependentSignoff,false);
assert.equal(changed({reviews:[approve('examiner_one'),approve('examiner_one')]}).eligibleForIndependentSignoff,false);
assert.equal(changed({reviews:[approve('author_alpha'),approve('examiner_two')]}).eligibleForIndependentSignoff,false);
assert.equal(changed({reviews:[approve('examiner_one')]}).eligibleForIndependentSignoff,false);
assert.equal(changed({reviews:[approve('examiner_one'),{...approve('examiner_two'),mathsVerified:false}]}).eligibleForIndependentSignoff,false);
assert.equal(changed({reviews:[approve('examiner_one'),{...approve('examiner_two'),fingerprint:'f'.repeat(64)}]}).eligibleForIndependentSignoff,false);
assert.equal(changed({reviews:[approve('examiner_one'),{...approve('examiner_two'),decision:'reject'}]}).eligibleForIndependentSignoff,false);
assert.equal(changed({provenance:''}).eligibleForIndependentSignoff,false);

const correctNote='Fictional written working shows the required valid method and result.';
const all=rubric.criteria.map(x=>({id:x.id,awarded:true,note:correctNote}));
const sheet=(examinerId,awards=all,fixtureId='fictional-ratio-script-a')=>({
 examinerId,fingerprint:digest,fixtureId,awards
});
const identical=compareIndependentMarking(rubric,sheet('examiner_one'),sheet('examiner_two'));
assert.equal(identical.agreementPercent,100);
assert.equal(identical.requiresAdjudication,false);
assert.deepEqual([identical.firstScore,identical.secondScore],[4,4]);
assert.equal(identical.releaseAuthorised,false);
assert.equal(identical.studentDataIncluded,false);

const adjusted=all.map(x=>x.id==='a-red'?{...x,awarded:false,note:'Incorrect red share.'}:x);
const conflict=compareIndependentMarking(rubric,sheet('examiner_one'),sheet('examiner_two',adjusted));
assert.equal(conflict.agreementPercent,75);
assert.equal(conflict.requiresAdjudication,true);
assert.deepEqual(conflict.differences.map(x=>x.id),['a-red']);
assert.deepEqual([conflict.firstScore,conflict.secondScore],[4,3]);
assert.throws(()=>compareIndependentMarking(rubric,sheet('examiner_one'),sheet('examiner_one')),/distinct examiners/);
assert.throws(()=>compareIndependentMarking(rubric,sheet('examiner_one'),sheet('examiner_two',all,'fictional-ratio-script-b')),/same fictional/);
assert.throws(()=>compareIndependentMarking(rubric,sheet('examiner_one'),{...sheet('examiner_two'),studentId:'real-id'}),/actual learner identity/);
assert.throws(()=>compareIndependentMarking(rubric,sheet('examiner_one'),{...sheet('examiner_two'),fingerprint:'0'.repeat(64)}),/different rubric version/);

const adjudicated=adjudicateCalibration(rubric,conflict,{
 fingerprint:digest,examinerId:'examiner_three',fixtureId:'fictional-ratio-script-a',
 awards:adjusted,
 explanation:'The final result does not contain the required correct red-share value, so A1 is not awarded.'
});
assert.equal(adjudicated.finalMarks,3);
assert.equal(adjudicated.possible,4);
assert.equal(adjudicated.publicationApproved,false);
assert.equal(adjudicated.learnerReportReleased,false);
assert.throws(()=>adjudicateCalibration(rubric,identical,{
 fingerprint:digest,examinerId:'examiner_three',fixtureId:'fictional-ratio-script-a',awards:all,
 explanation:'No disagreement to resolve.'}),/No disagreement/);
assert.throws(()=>adjudicateCalibration(rubric,conflict,{
 fingerprint:digest,examinerId:'examiner_two',fixtureId:'fictional-ratio-script-a',awards:all,
 explanation:'Fictional statement explaining a full moderation decision.'}),/separate third/);
assert.throws(()=>adjudicateCalibration(rubric,conflict,{
 fingerprint:digest,examinerId:'examiner_three',fixtureId:'fictional-ratio-script-b',awards:all,
 explanation:'Fictional statement explaining a full moderation decision.'}),/same fictional/);

const document=readFileSync('docs/staging/CRITERION_MARKING_SCHEMA_PROPOSAL.md','utf8');
const fence=String.fromCharCode(96).repeat(3);
const blocks=document.split(fence+'sql');
assert.equal(blocks.length,2,'There should be exactly one demonstration SQL block');
const sql=blocks[1].split(fence)[0].trim();
assert.ok(sql.startsWith('-- NOT AN APPLIED MIGRATION.'),'SQL must clearly warn before commands');
assert.ok(sql.endsWith('ROLLBACK;'),'No accidentally persistent database demo');
assert.ok(!/\bCOMMIT\s*;/i.test(sql));
assert.ok(!/\bGRANT\s+(?:ALL|SELECT|INSERT|UPDATE|EXECUTE)\b/i.test(sql),'Never add direct Data API grants');
assert.ok(!/\bCREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\b/i.test(sql),'Do not expose a callable privileged RPC yet');
const tables=[...sql.matchAll(/CREATE TABLE private\.([a-z0-9_]+)/g)].map(x=>x[1]);
assert.equal(tables.length,6);
for(const table of tables){
 assert.ok(sql.includes('ALTER TABLE private.'+table+' ENABLE ROW LEVEL SECURITY'),table+' missing RLS');
}
assert.ok(sql.includes('FROM PUBLIC, anon, authenticated'),'Direct user access must be revoked');
assert.ok(sql.includes('FOREIGN KEY (attempt_id,rubric_id,org_id)'),'Awards and releases must align organisation/attempt/rubric');
assert.ok(sql.includes('UNIQUE(attempt_id,revision_no)'),'Release revisions must not overwrite one another');
console.log('PASS: 3 original rubric hashes, independent two-reviewer moderation, forgery guards, full double-mark comparison, third-reviewer adjudication, and deny-by-default staging schema static safety.');
