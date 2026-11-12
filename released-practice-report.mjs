/* MathsGrove: display model for ONE signed-in student's already-released
 * assigned practice. This does not call Supabase, apply permissions, mark
 * answers or reveal unseen answer keys. Caller MUST retain learner-scoped RPCs.
 */
const words = value => typeof value === 'string' ? value.trim() : '';
const finite = value => value !== '' && value !== null && value !== undefined &&
  Number.isFinite(Number(value));
const natural = value => finite(value) && Number.isInteger(Number(value)) && Number(value) >= 0;
const MODES = Object.freeze({
  daily:'Grove Daily · focus practice',
  weekly:'Grove Weekly · structured practice',
  exam_daily:'Grove Exam · daily practice',
  mock:'Grove Exam · timed practice'
});
export function splitExaminerComment(comment) {
  const source = words(comment);
  if (!source) return { observation:'', nextPractice:'' };
  // A structured "Next practice:" is ONLY present when a human actually wrote it.
  const match = /(?:^|\n)\s*Next practice:\s*/i.exec(source);
  if (!match) return { observation:source, nextPractice:'' };
  const observation = source.slice(0,match.index).trim()
    .replace(/^Examiner observations:\s*/i,'');
  const nextPractice = source.slice(match.index+match[0].length).trim();
  return {observation,nextPractice};
}
export function buildReleasedPracticeReport(task) {
  if (!task || task.review_status !== 'released') return null;
  const questions = [];
  const encountered = new Set();
  for (const q of Array.isArray(task.review)?task.review:[]) {
    if (!q || !natural(q.position) || Number(q.position) < 1 || encountered.has(Number(q.position))) continue;
    encountered.add(Number(q.position));
    const mark = q.mark === 0 || q.mark === 1 || q.mark === '0' || q.mark === '1' ? Number(q.mark) : null;
    const comments = splitExaminerComment(q.comment);
    questions.push({
      position:Number(q.position), topic:words(q.topic)||'Mathematics',
      mark, possible:mark === null?null:1,
      observation:comments.observation,
      nextPractice:comments.nextPractice,
      visibleSeconds:natural(q.seconds)?Number(q.seconds):null
    });
  }
  questions.sort((a,b)=>a.position-b.position);
  const focus = (Array.isArray(task.topics)?task.topics:[])
    .filter(t=>t && natural(t.correct) && natural(t.total) &&
      Number(t.total)>0 && Number(t.correct)<Number(t.total))
    .sort((a,b)=>Number(a.correct)/Number(a.total)-Number(b.correct)/Number(b.total))
    .slice(0,3)
    .map(t=>({topic:words(t.topic)||'Mathematics',earned:Number(t.correct),possible:Number(t.total)}));
  const validTotal = natural(task.score) && natural(task.question_count) &&
    Number(task.score)<=Number(task.question_count) && Number(task.question_count)>0;
  return {
    provenance:'released-assigned-practice-only',
    mode:MODES[task.mode]||'Examiner-reviewed practice',
    score:validTotal?{earned:Number(task.score),possible:Number(task.question_count)}:null,
    reportNote:words(task.report_note),
    questionCount:questions.length,
    commentedCount:questions.filter(q=>q.observation||q.nextPractice).length,
    nextStepCount:questions.filter(q=>q.nextPractice).length,
    questions,focus,
    caveat:'Scores describe this reviewed practice set, not an official grade or demonstrated long-term mastery.'
  };
}
