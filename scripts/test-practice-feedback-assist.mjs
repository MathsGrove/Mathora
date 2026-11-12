import assert from 'node:assert/strict';
import { EVIDENCE_FIELDS, composePracticeFeedback } from '../practice-feedback-assist.mjs';

assert.deepEqual(EVIDENCE_FIELDS.map(x => x.key), ['method', 'accuracy', 'reasoning']);
const source = { mark: 0, observations: { method: 'demonstrated', accuracy: 'needs_work', reasoning: 'not_assessed' } };
const draft = composePracticeFeedback(source);
assert.match(draft.text, /Method: The approach used was mathematically valid/);
assert.match(draft.text, /Accuracy: The calculation or final answer needs checking/);
assert.doesNotMatch(draft.text, /Explanation:/);
assert.match(draft.text, /Next practice: Recheck arithmetic/);
assert.doesNotMatch(draft.text, /M1|A1|B1|0\/1|1\/1/); // no fabricated component awards or duplicate score
assert.deepEqual(draft.warnings, []);
assert.equal(draft.assessedCount, 2);

const full = composePracticeFeedback({ mark: 1, observations: { method: 'demonstrated', accuracy: 'demonstrated', reasoning: 'demonstrated' }, nextStep: 'Try a harder example with different numbers.' });
assert.match(full.text, /Try a harder example/);
assert.equal(full.assessedCount, 3);
assert.deepEqual(full.warnings, []);

const none = composePracticeFeedback({ mark: 0, observations: { reasoning: 'demonstrated' } });
assert.doesNotMatch(none.text, /Method:|Accuracy:/); // unknown is not equivalent to failed
const tension = composePracticeFeedback({ mark: 0, observations: { accuracy: 'demonstrated' } });
assert.equal(tension.warnings.length, 1);
assert.equal(composePracticeFeedback({mark: 1, observations: {accuracy: 'needs_work'}}).warnings.length, 1);

for (const input of [
  { mark: '', observations: { method: 'demonstrated' } },
  { mark: undefined, observations: { method: 'demonstrated' } },
  { mark: 2, observations: { method: 'demonstrated' } },
  { mark: -1, observations: { method: 'demonstrated' } },
  { mark: 0.5, observations: { method: 'demonstrated' } },
  { mark: 1, maxMark: 3, observations: { method: 'demonstrated' } },
  { mark: 1, observations: {} },
  { mark: 1, observations: { accuracy: 'not_a_status' } },
  { mark: 1, observations: [], nextStep: 'Next' },
  { mark: 1, observations: { method: 'demonstrated' }, nextStep: 'x'.repeat(221) }
]) assert.throws(() => composePracticeFeedback(input));
console.log('PASS: 0/1 marks, evidenced-only observations, contradictory-score warnings and invalid input guards.');
