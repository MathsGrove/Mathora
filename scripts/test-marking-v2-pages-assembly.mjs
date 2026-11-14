import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

// Rehearse the EXACT Pages asset-copy shell from the live deployment workflow
// on the pull-request runner. No deployment credentials are used.
const workflow=readFileSync('.github/workflows/pages.yml','utf8');
const start=workflow.indexOf('      - name: Assemble only MathsGrove public assets\n');
const end=workflow.indexOf('      - name: Verify private marking keys never enter Pages artifact\n',start);
assert.ok(start>=0&&end>start,'Expected curated Pages copy step plus privacy gate');
const step=workflow.slice(start,end);
assert.ok(step.includes('        run: |\n'),'Pages copy must be a literal shell block');
const body=step.slice(step.indexOf('        run: |\n')+'        run: |\n'.length)
 .split('\n').filter(Boolean).map(line=>{
  assert.ok(line.startsWith('          '),'Unexpected YAML indentation inside copy step');
  return line.slice(10);
 }).join('\n');
assert.ok(body.includes('cp content/marking/staging-rpc-client.mjs'),'Original runtime must be part of real Pages manifest');
assert.ok(!/\brm\s+-rf\b/.test(body),'Pages rehearsal must not destroy a repository folder.');
execFileSync('bash',['-e','-c',body],{stdio:'inherit'});
execFileSync('node',['scripts/check-marking-v2-public-bundle.mjs'],{stdio:'inherit'});
console.log('PASS: exact MathsGrove curated Pages asset list assembled successfully on a PR runner; no publish/deploy took place.');
