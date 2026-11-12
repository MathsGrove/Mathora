/* MathsGrove: examiner-assisted narrative for CURRENT 0/1-mark practice only.
 * Pure, no network/storage, no automatic scoring. A mark and each observation
 * must be supplied by the examiner after inspecting submitted evidence.
 */
export const EVIDENCE_FIELDS = Object.freeze([
  { key: 'method', label: 'Method', good: 'The approach used was mathematically valid.', gap: 'The approach needs correction before a new example.' },
  { key: 'accuracy', label: 'Accuracy', good: 'The calculation or final answer was accurate.', gap: 'The calculation or final answer needs checking.' },
  { key: 'reasoning', label: 'Explanation', good: 'The reasoning was explained clearly.', gap: 'The reasoning needs a clearer written explanation.' }
]);
const VALID = new Set(['not_assessed', 'demonstrated', 'needs_work']);
const NEXT = {
  method: 'Set out the method first, then compare each step with a worked example.',
  accuracy: 'Recheck arithmetic, signs and units; substitute the result where possible.',
  reasoning: 'Write a sentence explaining why each major step is justified.'
};

export function composePracticeFeedback({ mark, maxMark = 1, observations = {}, nextStep = '' } = {}) {
  // A supplied 0 is valid; blank/unmarked is NOT a zero.
  if (mark === '' || mark === null || mark === undefined) throw new Error('Choose an examiner mark before drafting feedback.');
  if (maxMark !== 1 || !Number.isInteger(Number(mark)) || Number(mark) < 0 || Number(mark) > maxMark) {
    throw new Error('This assistant only supports the current 0/1-point practice format.');
  }
  if (typeof observations !== 'object' || observations === null || Array.isArray(observations)) {
    throw new Error('Examiner observations must be a keyed object.');
  }
  const lines = [];
  const missed = [];
  let assessed = 0;
  for (const field of EVIDENCE_FIELDS) {
    const status = observations[field.key] ?? 'not_assessed';
    if (!VALID.has(status)) throw new Error('Unknown examiner observation for ' + field.key + '.');
    if (status === 'not_assessed') continue; // never invent a finding from the mark / MCQ option
    assessed++;
    if (status === 'needs_work') missed.push(field.key);
    lines.push(field.label + ': ' + (status === 'demonstrated' ? field.good : field.gap));
  }
  if (!assessed) throw new Error('Review at least one evidence checkpoint before drafting.');
  const next = typeof nextStep === 'string' ? nextStep.trim() : '';
  if (next.length > 220) throw new Error('Keep the next-practice instruction under 220 characters.');
  const nextPractice = next || (missed.length ? NEXT[missed[0]] : 'Try a different question and explain how the method applies.');
  const warnings = [];
  if (observations.accuracy === 'demonstrated' && Number(mark) === 0) {
    warnings.push('Accuracy was confirmed, but the examiner score is 0/1. Check the score and evidence before inserting.');
  }
  if (observations.accuracy === 'needs_work' && Number(mark) === 1) {
    warnings.push('Accuracy needs correction, but the examiner score is 1/1. Check whether the mark was for a different criterion.');
  }
  // The awarded mark is deliberately NOT reproduced inside the generated comment:
  // it already exists in the score record, and we must not imply separate M/A/B awards.
  return {
    text: ['Examiner observations:', ...lines, 'Next practice: ' + nextPractice].join('\n'),
    warnings,
    assessedCount: assessed
  };
}
