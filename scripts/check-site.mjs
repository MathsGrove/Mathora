import { readFileSync, existsSync } from 'node:fs';
const pages=['index.html','portal.html','baseline.html','studio.html','family.html','sample.html','journey.html','export.html','report.html','report-pages.html','reasoning-demo.html'];
const publicAssets=['mathsgrove.css','brand-refresh.css','marketing-services.css','portal.css','studio.css','admin-learner.css','content-bank.css','timed-mock.css','maths-notation.css','content-bank.js','private-refresh.css','student-features.css','sample.css','sample-extras.css','sample-extras.js','maths-render.js','evidence-theme.css','whiteboard.js','marketing.js','sample.js','portal.js','studio.js','auth-password.js','auth-password.css','mathsgrove-config.js','mathsgrove-icon.svg','baseline.css','baseline.js','baseline-calc.js','baseline-admin.js','assigned-practice.css','assigned-practice.js','assigned-admin.css','assigned-admin.js','editorial-review.js','student-offboarding.js','student-offboarding.css','export.css','student-export-download.js','showcase-v3.css','showcase-v3.js','experience-v4.css','experience-v4.js','calendar-dialog-polish.css','insights-upgrade.css','insights-upgrade.js','access-management.css','access-management.js','access-router.js','family-access.css','family-access.js','family-timing.css','family-timing.js','tier-role-experience.css','tier-role-experience.js','report-reader.css','report-reader.js','report-preview.css','reasoning-demo.css','reasoning-demo.js','reasoning-model.mjs','robots.txt','sitemap.xml','journey.css','journey.js','embed-bridge.js','unified-site.js'];
let errors=[];
for (const name of [...pages,...publicAssets]) if (!existsSync(name)) errors.push('Missing '+name);
for (const page of pages) {
  const html=readFileSync(page,'utf8');
  for (const ref of html.matchAll(/(?:src|href)=["'](\.\/[^"']+)["']/g)) {
    const target=ref[1].split('#')[0].split('?')[0].replace(/^\.\//,'');
    if (!existsSync(target)) errors.push(page+' references missing '+target);
  }
  const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(x=>x[1]);
  const duplicates=ids.filter((id,i)=>ids.indexOf(id)!==i);
  if (duplicates.length) errors.push(page+' duplicate ids: '+[...new Set(duplicates)].join(', '));
  if (/sb_secret_[a-zA-Z0-9_-]{10,}/.test(html)) errors.push(page+' contains private key');
}
const studioPage=readFileSync('studio.html','utf8');
const studioApp=readFileSync('studio.js','utf8');
for(const id of ['mg-student-offboarding','mg-offboarding-nav','mg-student-export-shortcut','mg-offboarding-roster','mg-offboarding-status'])
  if(!studioPage.includes('id="'+id+'"')) errors.push('Studio lacks visible student offboarding entry '+id);
if(studioPage.indexOf('id="mg-student-offboarding"')>studioPage.indexOf('id="invite-form"'))
  errors.push('Student offboarding must be placed at the top of the student management section');
if(!studioApp.includes("function openStudentRemoval()")||!studioApp.includes("state.membership?.member_role!=='admin'"))
  errors.push('Studio must provide guarded student removal navigation');
if(!studioApp.includes("location.hash==='#student-removal'"))
  errors.push('Admin offboarding direct link is missing');
const offboardingApp=readFileSync('student-offboarding.js','utf8');
if(!offboardingApp.includes("method==='manual_zip_pdf'")||!offboardingApp.includes("prepare_manual")||!offboardingApp.includes("sha256"))
  errors.push('Studio must require the manual PDF ZIP deployment and checksum before student removal');
const landing=readFileSync('index.html','utf8');
if (landing.includes('£')||/\bpricing\b/i.test(landing)) errors.push('Public homepage must not advertise prices');
if (/partner dashboard|demo-overlay|id="panel-partner"/i.test(landing)) errors.push('Old public partner dashboard found');
for (const needed of ['id="mobile-toggle"','id="primary-nav"','id="services"','id="learning-journey"','id="interactive-sample"','id="signature"']) {
  if (!landing.includes(needed)) errors.push('Missing preview/interaction element '+needed);
}
const config=readFileSync('mathsgrove-config.js','utf8');
if (/sb_secret_[a-zA-Z0-9_-]{10,}|service_role\s*[:=]\s*["']eyJ/.test(config)) errors.push('Private credential in browser configuration');
if (errors.length) { console.error('MathsGrove site checks failed:\n'+errors.map(s=>'  • '+s).join('\n'));process.exit(1) }
console.log('MathsGrove public assets, local references, IDs, prices and credentials: OK');
