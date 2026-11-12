// Read-only contract check for documented MathsGrove service tiers.
// Run: node scripts/check-service-tier-contract.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const tiers = JSON.parse(readFileSync(new URL('../content/programmes/service-tiers.json', import.meta.url), 'utf8'));
assert.equal(tiers.version, 2);
assert.deepEqual(Object.keys(tiers.plans).sort(), ['daily', 'exam', 'weekly']);
assert.deepEqual(tiers.study_routes, ['GCSE', 'IGCSE', 'AS_A_LEVEL', 'Further Mathematics', 'IB', 'TMUA']);
const w = tiers.plans.weekly.question_design.ALL_ROUTES;
const d = tiers.plans.daily.question_design.ALL_ROUTES;
const e = tiers.plans.exam.question_design.ALL_ROUTES;
assert.equal(w.items, 8);
assert.equal(w.marks, 8);
assert.equal(d.items_per_day, 4);
assert.equal(d.marks_per_day, 4);
assert.equal(d.weekly_items, w.items);
assert.equal(e.daily_items, 6);
assert.equal(e.daily_marks, 6);
assert.equal(e.weekly_items, w.items);
assert.equal(e.monthly_mock_items, 20);
assert.equal(e.monthly_mock_marks, 20);
assert.equal(e.monthly_mock_time_limit_minutes, 90);
assert.match(tiers.engine_description, /multiple-choice/i);
assert.match(tiers.engine_description, /one marking point/i);
console.log('PASS: documented tier contracts and study routes are internally consistent');
