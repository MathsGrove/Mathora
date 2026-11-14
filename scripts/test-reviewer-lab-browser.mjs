import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createServer} from 'node:http';
import {resolve,extname,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(process.cwd());
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};
const server=createServer((req,res)=>{
 let file;
 try{file=resolve(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/,''));}
 catch{res.writeHead(400).end();return;}
 if(!file.startsWith(root+sep)||!file.includes(sep+'content'+sep+'marking'+sep)){res.writeHead(403).end();return;}
 try{
  if(!statSync(file).isFile())throw Error('Not file');
  res.setHeader('Content-Type',mime[extname(file)]||'text/plain');
  res.end(readFileSync(file));
 }catch{res.writeHead(404).end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port,url='http://127.0.0.1:'+port+'/content/marking/reviewer-lab.html';
const browser=await chromium.launch({headless:true});
let checks=0;
try{
 for(const viewport of [{width:1440,height:960},{width:375,height:812}]){
  const page=await browser.newPage({viewport,reducedMotion:viewport.width===375?'reduce':'no-preference'});
  const errors=[],external=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(!request.url().startsWith('http://127.0.0.1:'+port))external.push(request.url())});
  await page.goto(url,{waitUntil:'networkidle'});
  await page.locator('#question option').first().waitFor({state:'attached'});
  assert.equal(await page.locator('#question option').count(),8,'Eight original public examples in browser lab');
  assert.equal(await page.locator('.criterion').count(),3,'GCSE example has three mark criteria');
  await page.locator('#preview').click();
  await page.getByText(/Complete the M1 decision/).first().waitFor();
  const criteria=page.locator('.criterion');
  for(let i=0;i<await criteria.count();i++){
   const row=criteria.nth(i);
   await row.locator('select[data-award]').selectOption('earned');
   await row.locator('textarea[data-evidence]').fill('Synthetic example work shows the relevant valid reasoning step.');
  }
  await page.locator('#preview').click();
  await page.locator('.score').getByText('3 / 3 marks').waitFor();
  await page.locator('[data-role=parent]').click();
  assert.equal(await page.locator('#report').getByText('Examiner note:',{exact:false}).count(),0);
  assert.equal(await page.locator('[data-role=parent]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-role=tutor]').click();
  assert.ok((await page.locator('#report').innerText()).includes('Examiner note:'));
  await page.locator('[data-role=student]').click();
  assert.ok(!(await page.locator('#report').innerText()).includes('Examiner note:'));
  // Withheld A1 credit generates relevant student, guardian and tutor advice.
  await page.locator('[data-criterion="a-roots"] select[data-award]').selectOption('missed');
  await page.locator('#preview').click();
  await page.locator('.score').getByText('2 / 3 marks').waitFor();
  const studentText=await page.locator('#report').innerText();
  assert.ok(studentText.includes('Correction · Give both roots'));
  assert.ok(studentText.includes('Try independently next'));
  assert.ok(studentText.includes('Solve x²−x−12=0'));
  await page.locator('[data-role=parent]').click();
  const guardianText=await page.locator('#report').innerText();
  assert.ok(guardianText.includes('How to support'));
  assert.ok(!guardianText.includes('Examiner note:'));
  await page.locator('[data-role=tutor]').click();
  assert.ok((await page.locator('#report').innerText()).includes('Teaching intervention'));
  await page.locator('#question').selectOption('stationary-ib-aa-hl');
  assert.equal(await page.locator('.criterion .code').filter({hasText:'R1'}).count(),1,
    'IB uses an explicit reasoning mark');
  await page.locator('#question').selectOption('tmua-p1-reciprocal-roots');
  assert.equal(await page.locator('.criterion').count(),0,'MCQ must not award method marks');
  await page.locator('#preview').click();
  await page.getByText(/Select a fictional response/).waitFor();
  await page.locator('input[name=mcq-answer][value=C]').check();
  await page.locator('#preview').click();
  await page.locator('.score').getByText('1 / 1 marks').waitFor();
  assert.ok((await page.locator('#report').innerText()).includes('one mark'));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  assert.equal(overflow,false,'Unexpected horizontal overflow at '+viewport.width+'px');
  assert.deepEqual(errors,[]);
  assert.deepEqual(external,[],'Lab must never call an external service');
  checks+=12;
  await page.close();
 }
 console.log('PASS — '+checks+' Chromium desktop/mobile checks: complete examiner decisions, UK vs IB vs TMUA style, parent/tutor redaction, no external network, reduced-motion viewport and no horizontal overflow.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
