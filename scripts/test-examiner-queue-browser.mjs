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
  assert.equal(await page.locator('.mg2-queue-entry').count(),2);
  await page.locator('.mg2-queue-entry').first().click();
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
  await page.locator('.mg2-queue-entry').first().click();
  await page.locator('.mg2-criterion').first().waitFor();
  assert.equal(await page.locator('.mg2-criterion').nth(0).locator('select[data-award]').inputValue(),'earned');
  assert.equal(await page.locator('.mg2-criterion').nth(2).locator('select[data-award]').inputValue(),'missed');
  await page.getByRole('button',{name:'Prepare feedback suggestions'}).click();
  await page.locator('input[data-verified]').check();
  await page.getByRole('button',{name:'Release reviewed report'}).click();
  await page.locator('.mg2-status').getByText(/released and its score recalculated server-side/).waitFor();
  assert.equal(await page.locator('.mg2-queue-entry').count(),1);
  assert.ok((await page.locator('.mg2-queue-entry').first().innerText()).includes('stationary-ib-aa-hl'));
  await page.locator('.mg2-queue-entry').first().click();
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
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,
   'No horizontal overflow at '+viewport.width);
  assert.deepEqual(errors,[],'No JavaScript runtime errors');
  assert.deepEqual(external,[],'Preview must not use any hosted Supabase network');
  passed+=24;
  await page.close();
 }
 console.log('PASS — '+passed+' responsive examiner/reviewer checks, saved M/A/B evidence, editable reports, human release, independent moderation checks and no external requests.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
