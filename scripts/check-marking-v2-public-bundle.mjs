import assert from 'node:assert/strict';
import {existsSync,readdirSync,readFileSync,statSync} from 'node:fs';
import {dirname,join,normalize,relative,resolve,sep} from 'node:path';

// Called AFTER Pages curated assets are assembled. An explicit allowlist is
// safer than copying content/marking/*, which includes private exam answer keys.
const site=resolve('site'),folder=join(site,'content','marking');
assert.ok(existsSync(folder),'MathsGrove original-marking client directory must be published.');
const expected=[
 'constructed-practice-ui.mjs',
 'examiner-assist.mjs',
 'examiner-moderation-ui.mjs',
 'examiner-workbench-ui.mjs',
 'examiner-workbench.css',
 'linked-original-reports.mjs',
 'original-authoring-ui.mjs',
 'pilot-integration.css',
 'staging-rpc-client.mjs',
 'student-assignment-feed.mjs'
].sort();
const actual=readdirSync(folder).sort();
assert.deepEqual(actual,expected,'Never publish worked-solution examples, unmoderated rubrics or reviewer HTML.');
for(const name of expected)assert.ok(statSync(join(folder,name)).isFile());
const forbidden=[
 'original-rubric-examples.json','route-exam-style-examples.json',
 'criterion-feedback-bank.json','route-feedback-bank.json',
 'learner-lab.html','reviewer-lab.html','examiner-queue-lab.html',
 'marking-v2-disposable-postgres.sql','EXAMINER_REVIEW_RUNBOOK.md'
];
for(const bad of forbidden){
 const paths=[join(folder,bad),join(site,'docs','staging',bad)];
 for(const file of paths)assert.equal(existsSync(file),false,'Editorial/private file was copied into the published Pages folder: '+bad);
}
const rootEntry=['portal.js','studio.js','family-access.js'];
for(const p of rootEntry)assert.ok(existsSync(join(site,p)),'Missing existing app entrypoint: '+p);
const queue=rootEntry.map(x=>join(site,x)),seen=new Set();
while(queue.length){
 const file=queue.shift();
 if(seen.has(file))continue;
 seen.add(file);
 const content=readFileSync(file,'utf8');
 for(const match of content.matchAll(/(?:import\s*\(\s*|(?:import|export)[^;\n]*?\bfrom\s*)['"](\.[^'"]+)['"]/g)){
  const raw=match[1].split('?')[0];
  const dest=resolve(dirname(file),raw);
  assert.ok(dest.startsWith(site+sep),'Unexpected import escaping the public artifact: '+raw);
  // Only check the marking modules here. Existing app imports like CDN are
  // excluded; all published internal marking imports must resolve.
  if(dest.startsWith(folder+sep)){
   assert.ok(existsSync(dest),'Marking runtime imports a missing module: '+relative(site,dest));
   if(/\.(?:mjs|js)$/.test(dest))queue.push(dest);
  }
 }
}
assert.ok(seen.has(join(folder,'staging-rpc-client.mjs')));
assert.ok(seen.has(join(folder,'examiner-workbench-ui.mjs')));
assert.ok(seen.has(join(folder,'student-assignment-feed.mjs')));
assert.ok(seen.has(join(folder,'linked-original-reports.mjs')));
const config=readFileSync(join(site,'mathsgrove-config.js'),'utf8');
assert.match(config,/markingV2Enabled:\s*false/,
 'Publishing v2 code must not turn on student marking in production.');
const pages=readFileSync('.github/workflows/pages.yml','utf8');
assert.ok(!/cp\s+(?:-a\s+|-r\s+|--recursive\s+)?content\/marking\/(?:\*|\.|\.\.)(?:\s|\/)/.test(pages),
 'Publishing wildcard marking files can expose private original answer keys.');
console.log('PASS: curated Pages asset manifest, private keys/labs excluded, runtime module graph complete, live switch OFF.');
