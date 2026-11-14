import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createServer} from 'node:http';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';

const root=resolve(process.cwd());
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};
const server=createServer((req,res)=>{
 let file;
 try{file=resolve(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/,''));}
 catch{res.writeHead(400).end();return;}
 if(!file.startsWith(root+sep)||!file.includes(sep+'content'+sep+'marking'+sep)){res.writeHead(403).end();return;}
 try{if(!statSync(file).isFile())throw Error('Not file');
  res.setHeader('Content-Type',mime[extname(file)]||'text/plain');
  res.end(readFileSync(file));
 }catch{res.writeHead(404).end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
const browser=await chromium.launch({headless:true});
let passed=0;
try{
 for(const viewport of [{width:1440,height:900},{width:375,height:812}]){
  const page=await browser.newPage({viewport,reducedMotion:viewport.width===375?'reduce':'no-preference'});
  const errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',req=>{if(!req.url().startsWith('http://127.0.0.1:'+port))external.push(req.url())});
  page.on('dialog',dialog=>dialog.accept());
  await page.goto('http://127.0.0.1:'+port+'/content/marking/examiner-queue-lab.html',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:/quadratic-roots-gcse-higher/}).waitFor();
  assert.equal(await page.locator('.mg2-queue-list .mg2-queue-entry').count(),2);
  await page.locator('.mg2-queue-list .mg2-queue-entry').first().click();
  await page.locator('.mg2-criterion').first().waitFor();
  assert.equal(await page.locator('.mg2-criterion').count(),3);
  assert.match(await page.locator('.mg2-student-work').innerText(),/I factor x squared/);
  await page.getByRole('button',{name:'Release reviewed report'}).click();
  await page.locator('.mg2-status').getByText(/Review is incomplete/).waitFor();
  const criteria=page.locator('.mg2-criterion');
  for(let i=0;i<await criteria.count();i++){
   const row=criteria.nth(i);
   await row.locator('select[data-award]').selectOption(i===2?'missed':'earned');
   if(i!==2)await row.locator('textarea[data-evidence]')
    .fill('Fictional examiner independently verified the written mathematical step.');
  }
  await page.getByRole('button',{name:'Prepare feedback suggestions'}).click();
  await page.locator('textarea[data-summary=studentSummary]').waitFor();
  const studentText=await page.locator('textarea[data-summary=studentSummary]').inputValue();
  const parentText=await page.locator('textarea[data-summary=parentSummary]').inputValue();
  const tutorText=await page.locator('textarea[data-summary=tutorPlan]').inputValue();
  assert.match(studentText,/credit was not awarded/);
  assert.match(parentText,/encourage/);
  assert.match(tutorText,/Inspect the submitted working/);
  assert.ok(!parentText.includes('Fictional examiner independently verified'));
  assert.ok(!studentText.includes('Fictional examiner independently verified'));
  await page.getByRole('button',{name:'Release reviewed report'}).click();
  await page.locator('.mg2-status').getByText(/Confirm that you personally reviewed/).waitFor();
  await page.getByRole('button',{name:'Save completed marking draft'}).click();
  await page.locator('.mg2-status').getByText(/Mark decisions saved/).waitFor();
  await page.locator('.mg2-queue-list .mg2-queue-entry').first().click();
  await page.locator('.mg2-criterion').first().waitFor();
  assert.equal(await page.locator('.mg2-criterion').nth(0).locator('select[data-award]').inputValue(),'earned');
  assert.equal(await page.locator('.mg2-criterion').nth(2).locator('select[data-award]').inputValue(),'missed');
  await page.getByRole('button',{name:'Prepare feedback suggestions'}).click();
  await page.locator('input[data-verified]').check();
  await page.getByRole('button',{name:'Release reviewed report'}).click();
  await page.locator('.mg2-status').getByText(/released and its score recalculated server-side/).waitFor();
  assert.equal(await page.locator('.mg2-queue-list .mg2-queue-entry').count(),1);
  assert.ok((await page.locator('.mg2-queue-list .mg2-queue-entry').first().innerText()).includes('stationary-ib-aa-hl'));
  await page.locator('.mg2-queue-list .mg2-queue-entry').first().click();
  await page.locator('.mg2-criterion').first().waitFor();
  assert.equal(await page.locator('.mg2-criterion').count(),5);
  assert.equal(await page.locator('.mg2-criterion-head').filter({hasText:'R1'}).count(),1);
  // Separate examiner verification of the question itself (not student marks).
  await page.locator('.mg2-moderation-list button').first().waitFor();
  await page.locator('.mg2-moderation-list button').first().click();
  await page.locator('.mg2-mod-checks').waitFor();
  assert.equal(await page.locator('.mg2-moderation-detail .mg2-criterion').count(),3);
  await page.getByRole('button',{name:'Sign off this exact question'}).click();
  await page.locator('.mg2-moderation .mg2-status').getByText(/Complete all three/).waitFor();
  for(const input of await page.locator('input[data-review-check]').all())await input.check();
  await page.locator('.mg2-moderation-detail textarea').fill(
    'I have independently verified the original quadratic solution, syllabus level, method dependencies and final answers.'
  );
  await page.getByRole('button',{name:'Sign off this exact question'}).click();
  await page.locator('.mg2-moderation .mg2-status').getByText(/Another independent reviewer must approve/).waitFor();
  assert.equal(await page.locator('.mg2-moderation-list button').count(),0);
  // A staff user can author an original complete, unmoderated M/A/B scheme.
  await page.getByLabel('Original question key').fill('original-fraction-2026-test');
  await page.getByLabel('Awarding body').fill('AQA');
  await page.getByLabel('Specific curriculum objective').fill(
   'Recognise and calculate a fraction of a whole number.');
  await page.getByLabel('Originality and content-rights declaration').fill(
   'This is a wholly original fictional mathematics question and solution, authored for local independent reviewer testing.');
  await page.getByLabel('Question text').fill(
   'A fictional school has 240 pencils. Exactly two fifths are red. Calculate how many are red and explain every mathematical step.');
  await page.getByLabel('Independently checkable worked solution').fill(
   '240 divided by five is 48, so two fifths are two groups of 48, giving 96 pencils. Check 96 / 240 = 2/5.');
  const fillCriterion=async(index,code,skill,award,missed)=>{
   const row=page.locator('.mg2-author-mark').nth(index);
   await row.locator('select').selectOption(code);
   await row.locator('input[type=text]').last().fill(skill);
   await row.locator('textarea').nth(0).fill(award);
   await row.locator('textarea').nth(1).fill(missed);
  };
  await fillCriterion(0,'M1','Divide to find one fifth',
   'Compute exactly 240 divided by five to get 48.',
   'Divide the full number by the denominator first.');
  await page.getByRole('button',{name:'Add 1-mark criterion'}).click();
  await fillCriterion(1,'A1','Multiply numerator to find answer',
   'Multiply 48 by two and state 96 pencils.',
   'Multiply the unit fraction by two to find the count.');
  await page.getByRole('button',{name:'Add 1-mark criterion'}).click();
  await fillCriterion(2,'B1','Check the final answer',
   'Verify that 96 divided by 240 equals two fifths.',
   'Check the part over the total against the given fraction.');
  await page.getByRole('button',{name:'Save private draft for independent review'}).click();
  await page.locator('.mg2-authoring-form .mg2-status').getByText(/Saved version 1 as a private original/).waitFor();
  assert.equal(await page.evaluate(()=>window.__fictionalAuthoring.created.criteria.length),3);
  assert.equal(await page.evaluate(()=>window.__fictionalAuthoring.created.criteria[1].dependsOn[0]),'m-step-1');
  await page.getByRole('button',{name:'Assign approved original'}).click();
  await page.locator('.mg2-inventory .mg2-status').getByText(/Original assigned to the selected learner/).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,
   'No horizontal overflow at '+viewport.width);
  assert.deepEqual(errors,[],'No JavaScript runtime errors');
  assert.deepEqual(external,[],'Preview must not use any hosted Supabase network');
  passed+=32;
  await page.close();
 }
 console.log('PASS — '+passed+' responsive examiner/reviewer checks, saved M/A/B evidence, editable reports, human release, independent moderation, original authoring, approved assignment and no external requests.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
