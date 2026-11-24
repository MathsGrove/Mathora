import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTierContract } from './check-tier-contract.mjs';
const make = () => ({study_routes:['GCSE','IGCSE','AS_A_LEVEL','Further Mathematics','IB','TMUA'],engine_description:'NOT full official exam papers',plans:{weekly:{entitlement:'weekly',question_design:{ALL_ROUTES:{items:8,marks:8}}},daily:{entitlement:'daily',question_design:{ALL_ROUTES:{items_per_day:4,marks_per_day:4,weekly_items:8,weekly_marks:8}}},exam:{entitlement:'exam',question_design:{ALL_ROUTES:{daily_items:6,daily_marks:6,weekly_items:8,weekly_marks:8,monthly_mock_items:20,monthly_mock_marks:20,monthly_mock_time_limit_minutes:90}}}}});
test('valid contract',()=>assert.deepEqual(validateTierContract(make()),[]));
test('detect changed daily allocation',()=>{const d=make();d.plans.daily.question_design.ALL_ROUTES.items_per_day=3;assert.match(validateTierContract(d).join(' '),/daily.items_per_day/)});
test('detect changed mock duration',()=>{const d=make();d.plans.exam.question_design.ALL_ROUTES.monthly_mock_time_limit_minutes=60;assert.match(validateTierContract(d).join(' '),/monthly_mock_time_limit_minutes/)});
test('detect missing academic route',()=>{const d=make();d.study_routes.pop();assert.match(validateTierContract(d).join(' '),/academic routes/)});
test('detect missing safety caveat',()=>{const d=make();d.engine_description='official board paper';assert.match(validateTierContract(d).join(' '),/non-official/)});
