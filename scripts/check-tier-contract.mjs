import { readFileSync } from 'node:fs';

export function validateTierContract(data) {
  const errors = [];
  const plans = data?.plans ?? {};
  const expected = {
    weekly: { items: 8, marks: 8 },
    daily: { items_per_day: 4, marks_per_day: 4, weekly_items: 8, weekly_marks: 8 },
    exam: { daily_items: 6, daily_marks: 6, weekly_items: 8, weekly_marks: 8, monthly_mock_items: 20, monthly_mock_marks: 20, monthly_mock_time_limit_minutes: 90 }
  };
  for (const [tier, fields] of Object.entries(expected)) {
    const plan = plans[tier];
    if (!plan) { errors.push('Missing ' + tier + ' plan'); continue; }
    if (plan.entitlement !== tier) errors.push(tier + ': entitlement mismatch');
    const design = plan.question_design?.ALL_ROUTES;
    if (!design) { errors.push(tier + ': missing ALL_ROUTES design'); continue; }
    for (const [field, value] of Object.entries(fields)) {
      if (design[field] !== value) errors.push(tier + '.' + field + ': expected ' + value + ', got ' + String(design[field]));
    }
  }
  if (!Array.isArray(data?.study_routes) || !['GCSE','IGCSE','AS_A_LEVEL','Further Mathematics','IB','TMUA'].every(route => data.study_routes.includes(route))) errors.push('Missing supported academic routes');
  if (!/NOT.*official|NOT.*full official/i.test(data?.engine_description ?? '')) errors.push('Missing explicit non-official-paper qualification');
  return errors;
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  const path = process.argv[2] ?? 'content/programmes/service-tiers.json';
  const errors = validateTierContract(JSON.parse(readFileSync(path, 'utf8')));
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('Tier contract: three programmes and academic routes verified');
}
