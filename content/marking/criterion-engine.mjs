/* MathsGrove — standalone, PUBLIC-EXEMPLAR rubric validator.
 * No database, auth, scoring automation, publication or student-data access.
 * A human examiner must explicitly award every criterion from observed work.
 * R1 is permitted for IB-style reasoning only when a separate qualification
 * profile validator explicitly authorises that mark code.
 */
const OBJECT = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const ID = /^[a-z][a-z0-9-]{1,70}$/;
const CODE = /^[MABR]1$/;
const ensure = (ok, message) => { if (!ok) throw new Error(message); };
const text = x => typeof x === 'string' ? x.trim() : '';

export function validateRubric(rubric) {
  ensure(OBJECT(rubric), 'Rubric must be an object.');
  ensure(rubric.status === 'public_editorial_example', 'Only non-operational public exemplars are supported.');
  ensure(ID.test(rubric.id || ''), 'Invalid exemplar identifier.');
  ensure(OBJECT(rubric.route) && text(rubric.route.qualification) && text(rubric.route.level),
    'A qualification and academic level are required.');
  ensure(text(rubric.topic) && text(rubric.question) && text(rubric.solution),
    'Topic, original prompt, and independently checked solution are required.');
  ensure(Array.isArray(rubric.criteria) && rubric.criteria.length > 0 && rubric.criteria.length <= 30,
    'Use 1–30 explicitly specified criteria.');
  const byId = new Map();
  for (const item of rubric.criteria) {
    ensure(OBJECT(item) && ID.test(item.id || '') && !byId.has(item.id), 'Criterion IDs must be unique.');
    ensure(CODE.test(item.code || ''), 'Only explicit M1, A1, B1 or IB R1 single-point criteria are supported.');
    ensure(text(item.description) && text(item.missingFeedback) && text(item.skill),
      'Each criterion needs award conditions, misconception feedback and a skill.');
    ensure(Array.isArray(item.dependsOn) && item.dependsOn.every(x => typeof x === 'string'),
      'Criterion dependencies must be a list.');
    ensure(item.allowImpliedMethod === undefined || typeof item.allowImpliedMethod === 'boolean',
      'allowImpliedMethod must be boolean.');
    if (item.code !== 'A1') ensure(!item.allowImpliedMethod, 'Implied method is only valid for A1.');
    byId.set(item.id, item);
  }
  for (const criterion of rubric.criteria) {
    ensure(!criterion.dependsOn.includes(criterion.id), 'A criterion cannot depend on itself.');
    ensure(new Set(criterion.dependsOn).size === criterion.dependsOn.length,
      'Duplicate dependency in ' + criterion.id + '.');
    for (const ref of criterion.dependsOn) ensure(byId.has(ref), 'Unknown dependency ' + ref + '.');
    if (criterion.code === 'A1') ensure(
      criterion.dependsOn.some(x => byId.get(x).code === 'M1'),
      'A1 must name its associated method mark.'
    );
    if (criterion.allowImpliedMethod) ensure(
      criterion.dependsOn.every(x => byId.get(x).code === 'M1'),
      'A1 method implication cannot bypass non-method dependencies.'
    );
  }
  const visited = new Set();
  const visiting = new Set();
  const visit = id => {
    ensure(!visiting.has(id), 'Cyclic criterion dependency.');
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dep of byId.get(id).dependsOn) visit(dep);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of byId.keys()) visit(id);
  ensure(Number.isInteger(rubric.maxMarks) && rubric.maxMarks === rubric.criteria.length,
    'Declared marks must equal the sum of one-point criterion marks.');
  return { id: rubric.id, total: rubric.maxMarks, criteria: rubric.criteria.length };
}

export function assessExaminerAwards(rubric, awards, { completeReview = false } = {}) {
  validateRubric(rubric);
  ensure(Array.isArray(awards), 'Examiner awards must be an array.');
  ensure(typeof completeReview === 'boolean', 'completeReview must be boolean.');
  const byId = new Map();
  for (const a of awards) {
    ensure(OBJECT(a) && typeof a.id === 'string' && !byId.has(a.id), 'Awards require unique criterion IDs.');
    ensure(rubric.criteria.some(c => c.id === a.id), 'Award refers to an unknown criterion.');
    ensure(a.awarded === true || a.awarded === false,
      'Each supplied criterion award must be explicitly true or false, never inferred.');
    ensure(a.note === undefined || typeof a.note === 'string', 'Examiner evidence note must be text.');
    ensure(a.methodImplied === undefined || typeof a.methodImplied === 'boolean',
      'Implied method flag must be boolean.');
    if (a.awarded) ensure(text(a.note).length >= 8,
      'Awarding credit requires an examiner evidence note of at least eight characters.');
    if (a.methodImplied) ensure(a.awarded, 'Implied method applies only to awarded credit.');
    byId.set(a.id, a);
  }
  const missing = rubric.criteria.filter(c => !byId.has(c.id)).map(c => c.id);
  if (completeReview) ensure(missing.length === 0, 'Complete every criterion before confirming review.');
  const criteria = rubric.criteria.map(c => {
    const a = byId.get(c.id);
    return {
      id: c.id, code: c.code, skill: c.skill, condition: c.description,
      status: !a ? 'unassessed' : a.awarded ? 'awarded' : 'not_awarded',
      points: a?.awarded === true ? 1 : a?.awarded === false ? 0 : null,
      evidence: a ? text(a.note) : '',
      missingFeedback: c.missingFeedback,
      dependsOn: [...c.dependsOn]
    };
  });
  for (const c of rubric.criteria) {
    const a = byId.get(c.id);
    if (!a?.awarded) continue;
    const unearned = c.dependsOn.filter(id => !byId.get(id)?.awarded);
    if (!unearned.length) {
      ensure(!a.methodImplied, 'Do not claim method implied when all dependencies are earned.');
      continue;
    }
    ensure(c.code === 'A1' && c.allowImpliedMethod === true && a.methodImplied === true,
      'Dependent mark ' + c.id + ' requires earlier credit or an approved implied-method exception.');
    ensure(unearned.every(id => rubric.criteria.find(x => x.id === id).code === 'M1'),
      'Implied-method exception cannot override a non-method prerequisite.');
    ensure(text(a.impliedReason).length >= 15,
      'Explain the specific observed reason why method is implied.');
  }
  return {
    rubricId: rubric.id, source: 'fictional_editorial_only', reviewed: completeReview,
    earned: criteria.reduce((n, c) => n + (c.points ?? 0), 0),
    possible: rubric.maxMarks, missing, criteria,
    // No release method, no student identity, and no grades in this API.
    publishable: false
  };
}

export function buildFictionalRoleReport(rubric, evaluated, role) {
  validateRubric(rubric);
  ensure(['student', 'parent', 'tutor'].includes(role), 'Unknown audience.');
  ensure(OBJECT(evaluated) && evaluated.rubricId === rubric.id &&
    evaluated.reviewed === true && evaluated.source === 'fictional_editorial_only' &&
    evaluated.publishable === false && evaluated.missing?.length === 0,
    'Only fully examiner-reviewed fictional results can produce a preview.');
  ensure(evaluated.criteria.length === rubric.criteria.length, 'Rubric/result mismatch.');
  const earned = evaluated.criteria.filter(c => c.status === 'awarded');
  const missed = evaluated.criteria.filter(c => c.status === 'not_awarded');
  const strength = earned.length ? earned[0].skill : 'A strength has not yet been observed in this example';
  const focus = missed.length ? missed[0].skill : 'Apply the method to a fresh independent question';
  const feedback = missed.length ? missed[0].missingFeedback :
    'Try an unfamiliar example, showing all steps for an independent recheck.';
  const common = {
    fictional: true, role, title: rubric.topic,
    score: { earned: evaluated.earned, possible: evaluated.possible },
    evidenceScope: 'One fictional reviewed question, not a grade or mastery measure',
    strength, focus, nextPractice: feedback
  };
  if (role === 'parent') return {
    ...common,
    coachingPrompt: 'Can you explain the step you found most difficult, and how you would check it?',
    // Never provide the full criterion scheme, examiner-only evidence notes or tutor interventions to guardians.
  };
  if (role === 'student') return {
    ...common,
    checkpoints: evaluated.criteria.map(c => ({
      label: c.skill, credit: c.points, max: 1,
      note: c.status === 'awarded' ? 'Credit awarded for the reviewed working.' : c.missingFeedback
    }))
  };
  return {
    ...common,
    intervention: 'Teach the first missed skill with a contrasting example, then reassess independently.',
    checkpoints: evaluated.criteria.map(c => ({
      code: c.code, label: c.skill, credit: c.points, evidence: c.evidence,
      nextAction: c.missingFeedback
    }))
  };
}
