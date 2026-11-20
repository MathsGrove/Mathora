// Public editorial-only TMUA format regression fixture; not a production question bank.
// Run: node scripts/check-tmua-editorial-contract-20261120.mjs
import assert from 'node:assert/strict';

const specimens = [
  {
    id: 'editorial-tmua-minimum-20261120',
    route: 'TMUA',
    paper: 1,
    stem: 'For real x, what is the minimum value of x² − 6x + 10?',
    options: ['0', '1', '2', '3', '10'],
    correctIndex: 1,
    marks: 1,
    solution: 'Complete the square: x² − 6x + 10 = (x − 3)² + 1. Since a square is nonnegative, the minimum is 1, attained at x = 3.',
    rationale: 'The other options confuse the minimum with a root, constant term or non-minimal value.',
    verifiedBy: () => {
      const f = x => x*x - 6*x + 10;
      assert.equal(f(3), 1);
      for (let i=-100; i<=100; i++) assert.ok(f(i/10) >= 1 - 1e-10);
    }
  },
  {
    id: 'editorial-tmua-integer-20261120',
    route: 'TMUA',
    paper: 2,
    stem: 'Which statement is true for every integer n?',
    options: [
      'n² is even',
      'n² + n is even',
      'n² + 1 is even',
      'n² − n is odd',
      '2n + 1 is even'
    ],
    correctIndex: 1,
    marks: 1,
    solution: 'n² + n = n(n + 1), the product of consecutive integers. One is even, so the product is even. A is false for n=1; C is false for n=0; D is false for n=0; E is always odd.',
    rationale: 'Distractors test parity and the difference between universal and occasional truths.',
    verifiedBy: () => {
      const claims = [
        n => n*n%2===0,
        n => (n*n+n)%2===0,
        n => (n*n+1)%2===0,
        n => (n*n-n)%2!==0,
        n => (2*n+1)%2===0
      ];
      for (let n=-100; n<=100; n++) assert.equal(claims[1](n), true);
      for (const i of [0,2,3,4]) assert.ok([-1,0,1].some(n=>!claims[i](n)));
    }
  }
];

assert.equal(specimens.length, 2);
assert.equal(new Set(specimens.map(q=>q.id)).size, specimens.length);
for (const q of specimens) {
  assert.equal(q.route, 'TMUA');
  assert.ok([1,2].includes(q.paper));
  assert.equal(q.marks, 1, 'TMUA questions are single-mark MCQs, not multi-mark rubrics');
  assert.equal(q.options.length, 5, 'TMUA requires five answer options');
  assert.equal(new Set(q.options).size, 5, 'Options must be distinct');
  assert.ok(Number.isInteger(q.correctIndex) && q.correctIndex>=0 && q.correctIndex<5);
  assert.ok(q.stem.length>20 && q.solution.length>60 && q.rationale.length>20);
  q.verifiedBy();
}
console.log('PASS: two original editorial TMUA specimens; 5 distinct options, one correct index, 1 mark each, independent numeric/parity checks.');
