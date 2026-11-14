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
  res.setHeader('Content-Type',mime[extname(file)]||'text/plain');res.end(readFileSync(file));
 }catch{res.writeHead(404).end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
const browser=await chromium.launch({headless:true});
let checks=0;
try{
 for(const viewport of [{width:1440,height:900},{width:375,height:812}]){
  const page=await browser.newPage({viewport,reducedMotion:viewport.width===375?'reduce':'no-preference'});
  const errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',req=>{if(!req.url().startsWith('http://127.0.0.1:'+port))external.push(req.url())});
  page.on('dialog',dlg=>dlg.accept());
  await page.goto('http://127.0.0.1:'+port+'/content/marking/learner-lab.html',
   {waitUntil:'networkidle'});
  const input=page.locator('#mgcw-working');
  await page.waitForFunction(()=>!!document.querySelector('#mgcw-working') &&
    !document.querySelector('#mgcw-working').disabled);
  assert.match(await page.locator('.mgcw-question').innerText(),/96 kits/);
  assert.ok(!(await page.locator('main').innerText()).includes('red=60'),
   'Private worked solution must not appear in the student page');
  await input.fill('5+3=8 parts');
  await page.getByRole('button',{name:'Submit for examiner review'}).click();
  await page.locator('.mgcw-status').getByText(/at least 30 characters/).waitFor();
  assert.equal(await input.inputValue(),'5+3=8 parts','Insufficient working is preserved');
  await input.fill('Five plus three means eight equal parts, so 96 divided by 8 is 12.');
  await page.getByRole('button',{name:'Save draft'}).click();
  await page.locator('.mgcw-status').getByText(/revision 1/).waitFor();
  await input.fill('This answer is still being edited with a new check and new signs.');
  await page.evaluate(()=>window.__fictionalBrowserTab.emulateNewerSave());
  await page.getByRole('button',{name:'Save draft'}).click();
  await page.locator('.mgcw-status').getByText(/Stale answer revision/).waitFor();
  assert.equal(await input.inputValue(),
   'This answer is still being edited with a new check and new signs.',
   'Stale revision may not erase local unsaved work');
  await page.getByRole('button',{name:'Load latest saved draft'}).click();
  await page.waitForFunction(()=>
   document.querySelector('#mgcw-working').value.includes('fictional second tab'));
  await input.fill('There are 5 + 3 = 8 equal parts. Each part is 96/8 = 12. Red gets 5×12 = 60.');
  await page.getByRole('button',{name:'Submit for examiner review'}).click();
  await page.locator('.mgcw-status').getByText(/submitted and locked/).waitFor();
  assert.equal(await input.isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:'Save draft'}).isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:'Submit for examiner review'}).isDisabled(),true);
  assert.ok((await page.locator('.mgcw-title').innerText()).includes('Submitted'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,
   'No horizontal scrolling on '+viewport.width+'px device');
  assert.deepEqual(errors,[],'No script runtime exceptions');
  assert.deepEqual(external,[],'No external web/auth/storage calls in fictional demo');
  checks+=14;
  await page.close();
 }
 console.log('PASS — '+checks+' mobile/desktop fictional learner tests: accepted drafts, rejected short work, optimistic stale-save protection, final submit locks, no keys or external calls.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
