import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const landing=read('index.html');
const portal=read('portal.html');
const studio=read('studio.html');
const family=read('family-access.js');
const css=read('family-access.css');

const copy=[
 ['Marketing role headline', landing.includes('One learner.<br><em>Three useful perspectives.</em>')],
 ['Marketing programme headline', landing.includes('Three programmes.<br><em>One careful approach.</em>')],
 ['Marketing next-action headline', landing.includes('Start with the working.<br><em>See the next step.</em>')],
 ['Student reviewed evidence',portal.includes('What your reviewed work shows.')],
 ['Student examiner updates',portal.includes('Your latest <em>examiner updates.</em>')],
 ['Student next practice',portal.includes('What to practise next.')],
 ['Staff marking headline',studio.includes('Make every mark meaningful.')],
 ['Parent role title',family.includes('See the progress. Know how to help.')],
 ['Tutor role title',family.includes('Turn evidence into the next lesson.')],
 ['Strict parent/tutor role',family.includes("const parent=p.view_role==='parent'")],
 ['Parent tutor notes remain separated',family.includes("$('fa-tutor-only').hidden=parent")],
 ['Fictional public marketing only',!landing.includes('£')&&!/\bpricing\b/i.test(landing)],
 ['Reduced motion retained',css.includes('@media(prefers-reduced-motion:reduce)')],
 ['Hover-only motion guarded',css.includes('@media(hover:hover)')],
 ['Existing scoped family RPC',family.includes('get_my_learner_views')]
];
for(const [name,passed] of copy)assert.ok(passed,'Failed: '+name);
assert.ok(!family.includes('service_role'),'Never expose privileged key in family UI');
console.log('PASS: '+copy.length+' scoped-copy, role-isolation and reduced-motion assertions.');
