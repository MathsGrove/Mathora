import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {basename} from 'node:path';

// Only schema and RPC changes. Never include synthetic auth users, bank seed
// data, production records, or existing MathsGrove table/policy replacements.
const sources=[
 'docs/staging/marking-v2-disposable-postgres.sql',
 'docs/staging/marking-v2-learner-workflow.sql',
 'docs/staging/marking-v2-examiner-queue.sql',
 'docs/staging/marking-v2-moderation-queue.sql',
 'docs/staging/marking-v2-operational-interfaces.sql',
 'docs/staging/marking-v2-private-evidence-policy.sql'
];

export function composeMigration(read=readFileSync){
 const parts=sources.map(path=>{
  let src=read(path,'utf8');
  const begin=[...src.matchAll(/^BEGIN;[ \t]*$/gm)],end=[...src.matchAll(/^COMMIT;[ \t]*$/gm)];
  assert.equal(begin.length,1,'Expect one outer BEGIN in '+path);
  assert.equal(end.length,1,'Expect one outer COMMIT in '+path);
  assert.ok(src.indexOf('BEGIN;')<src.lastIndexOf('COMMIT;'),'Invalid transaction order in '+path);
  // Remove only the exact outer transaction lines, never the PL/pgSQL
  // function-body BEGIN/END blocks.
  src=src.replace(/^BEGIN;[ \t]*$/m,'').replace(/^COMMIT;[ \t]*$/m,'');
  return '-- BEGIN SOURCE: '+path+'\n'+src.trim()+'\n-- END SOURCE: '+path;
 });
 return [
  '-- MathsGrove constructed-response v2: additive, atomic, empty initial bank.',
  '-- Requires a verified current-project recovery point and two independent',
  '-- qualified examiners to sign each approved original before assignment.',
  '-- Generated from six audited staging SQL sources; no production data seeded.',
  '-- Versioned by the Supabase CLI migration new command.',
  'BEGIN;',
  "SET LOCAL lock_timeout = '5s';",
  "SET LOCAL statement_timeout = '90s';",
  "-- Abort if a previous manual trial has already created v2 tables;",
  "-- never write over a partially installed or undocumented live schema.",
  "DO $$ BEGIN",
  " IF to_regclass('private.mg2_rubrics') IS NOT NULL THEN",
  "  RAISE EXCEPTION 'Existing v2 rubric table found; investigate schema state before applying';",
  " END IF;",
  " IF to_regclass('public.memberships') IS NULL OR",
  "    to_regclass('public.student_entitlements') IS NULL OR",
  "    to_regclass('public.learner_view_links') IS NULL THEN",
  "  RAISE EXCEPTION 'Current organisation membership, entitlement or linked-viewer schema is missing';",
  " END IF;",
  "END $$;",
  ...parts,
  'COMMIT;',
  ''
 ].join('\n\n');
}

const args=process.argv.slice(2);
if(args.length){
 const verify=args[0]==='--verify',path=verify?args[1]:args[0];
 assert.ok(path&&basename(path).match(/^\d{14}_marking_v2_constructed\.sql$/),
  'Generate the timestamped filename with supabase migration new marking_v2_constructed first.');
 const content=composeMigration();
 if(verify){
  assert.equal(readFileSync(path,'utf8'),content,
   'Versioned migration must exactly match independently tested SQL sources.');
  console.log('PASS: migration is exactly the current reviewed six-script schema bundle.');
 }else{
  writeFileSync(path,content,'utf8');
  console.log('PASS: atomic additive migration filled in CLI-generated file '+basename(path));
 }
}
