/* MathsGrove public/unauthenticated browser smoke checks.
   Runs a local static preview: no real accounts, tokens or student data. */
import assert from 'node:assert/strict';
import {readFile, mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve, dirname, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const screenshotDir=resolve(root,'audits','browser-smoke');
await mkdir(screenshotDir,{recursive:true});
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
 '.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
 '.json':'application/json; charset=utf-8','.svg':'image/svg+xml',
 '.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const parsed=new URL(req.url||'/', 'http://127.0.0.1');
  const uri=decodeURIComponent(parsed.pathname)==='/'?'/index.html':decodeURIComponent(parsed.pathname);
  const path=resolve(root,'.'+uri);
  if(!path.startsWith(root+sep))throw Error('Untrusted file request');
  const bytes=await readFile(path);
  res.writeHead(200,{'Content-Type':MIME[extname(path)]||'application/octet-stream',
   'Cache-Control':'no-store'});
  res.end(bytes);
 }catch{
  res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');
 }
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port,base='http://127.0.0.1:'+port;
const pages=['/','/reasoning-demo.html','/portal.html','/studio.html','/family.html','/baseline.html','/sample.html','/report.html'];
const viewports=[{label:'phone',width:390,height:844},{label:'desktop',width:1440,height:900}];
const failures=[],reports=[];
const browser=await chromium.launch({headless:true});
try{
 for(const viewport of viewports){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},
   deviceScaleFactor:1,reducedMotion:'reduce'});
  for(const path of pages){
   const page=await context.newPage();
   const pageErrors=[],brokenAssets=[];
   page.on('pageerror',err=>pageErrors.push(String(err.message).slice(0,200)));
   page.on('response',response=>{
    if(response.url().startsWith(base)&&response.status()>=400&&
       !response.url().includes('favicon.ico'))brokenAssets.push(response.url());
   });
   try{
    const response=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:20000});
    await page.waitForTimeout(750);
    if(path==='/report.html'){
     await page.waitForSelector('#mgr-pages .mg7-page',{timeout:6000});
     assert.equal(await page.locator('#mgr-pages .mg7-page').count(),7,'Seven full report pages must render');
     assert.equal(await page.locator('#mgr-pages .mg7-page[hidden]').count(),0,'All report pages must scroll');
     assert.equal(await page.locator('#mgr-select option').count(),7,'Page navigator must include all seven');
     await page.selectOption('#mgr-select','3');
     assert.equal((await page.locator('#mgr-select').inputValue()),'3');
    }
    if(path==='/reasoning-demo.html'){
     await page.locator('#rg-answer-first').fill('x = 5');
     await page.locator('#rg-form-first input[name="method"][value="b"]').check();
     await page.locator('#rg-form-first button[type="submit"]').click();
     assert.match(await page.locator('#rg-result-first').textContent(),/Correct answer/);
     await page.locator('#rg-go-second').click();
     assert.equal(await page.locator('#rg-second').isVisible(),true);
     await page.locator('#rg-answer-second').fill('4');
     await page.locator('#rg-form-second input[name="method"][value="a"]').check();
     await page.locator('#rg-form-second button[type="submit"]').click();
     await page.locator('#rg-go-summary').click();
     assert.equal(await page.locator('#rg-summary').isVisible(),true);
     assert.equal((await page.locator('#rg-signals').textContent()).trim(),'3 / 4');
     await page.locator('.rg-perspectives [data-role="parent"]').click();
     assert.match(await page.locator('#rg-role-desc').textContent(),/why do you divide|outside the brackets/i);
     if(pageErrors.length)failures.push('Reasoning demo '+viewport.label+' JavaScript errors: '+pageErrors.join(' | '));
    }
    const stats=await page.evaluate(()=>{
     const doc=document.documentElement;
     const images=[...document.querySelectorAll('img')];
     const unlabeledButtons=[...document.querySelectorAll('button')].filter(x=>
      !x.textContent.trim()&&!x.getAttribute('aria-label')&&!x.getAttribute('title')).length;
     const brokenHashAnchors=[...document.querySelectorAll('a[href^="#"]')].filter(a=>{
      const target=a.getAttribute('href');return target.length>1&&!document.getElementById(target.slice(1));
     }).length;
     return {
      title:document.title,
      overflow:Math.max(doc.scrollWidth,document.body?.scrollWidth||0)-doc.clientWidth,
      imageMissingAlt:images.filter(x=>!x.hasAttribute('alt')).length,
      unlabeledButtons,brokenHashAnchors,
      bodyCharacters:document.body?.innerText?.trim().length||0,
      overflowElements:[...document.querySelectorAll('body *')].map(el=>{
       const r=el.getBoundingClientRect();
       return {tag:el.tagName.toLowerCase(),id:el.id,cls:String(el.className||'').slice(0,100),
        left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)}
      }).filter(r=>r.right>doc.clientWidth+8&&r.width>0).sort((a,b)=>b.right-a.right).slice(0,10)
     };
    });
    const status=response?.status()||0;
    const key=(path==='/'?'home':path.replace(/\W+/g,'-'))+'-'+viewport.label;
    await page.screenshot({path:resolve(screenshotDir,key+'.png'),fullPage:false});
    reports.push({path,viewport:viewport.label,status,...stats,
     brokenAssets:brokenAssets.length,scriptErrors:pageErrors.length});
    if(status!==200)failures.push(key+' returned HTTP '+status);
    if(stats.bodyCharacters<80)failures.push(key+' rendered an empty or tiny document');
    if(stats.overflow>12)failures.push(key+' horizontal overflow '+stats.overflow+' px');
    if(brokenAssets.length)failures.push(key+' missing local asset(s): '+brokenAssets.slice(0,3).join('; '));
    // Record JavaScript faults for investigation; external auth/CDN failures are treated separately.
    if(pageErrors.length)console.log('Browser script warnings ('+key+'): '+pageErrors.slice(0,4).join(' | '));
   }catch(error){
    failures.push(path+' ('+viewport.label+'): '+String(error.message||error).slice(0,230));
   }finally{await page.close()}
  }
  await context.close();
 }

 // Render the real authenticated dashboard components with fictional local data.
 // Do not sign in or access production learner records.
 for(const viewport of viewports){
  const context=await browser.newContext({
   viewport:{width:viewport.width,height:viewport.height},
   deviceScaleFactor:1,reducedMotion:'reduce'
  });
  for(const kind of ['examiner','learner']){
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message)));
   // Suppress actual authentication boot; render real dashboard modules with fake records.
   await page.route('**/studio.js',route=>route.fulfill({status:200,contentType:'text/javascript',body:''}));
   await page.route('**/portal.js',route=>route.fulfill({status:200,contentType:'text/javascript',body:''}));
   try{
    await page.goto(base+(kind==='examiner'?'/studio.html':'/portal.html'),
     {waitUntil:'domcontentloaded',timeout:20000});
    if(kind==='examiner'){
     await page.evaluate(async()=>{
      const app=document.getElementById('application');app.hidden=false;app.style.setProperty('display','block','important');
      document.getElementById('status-screen').hidden=true;
      const m=await import('./examiner-workspace.js');
      const state={
       students:[
        {id:'s1',name:'Student One',pref:{qualification:'GCSE',exam_board:'AQA'}},
        {id:'s2',name:'Student Two',pref:{qualification:'IGCSE',exam_board:'Cambridge'}}
       ],
       attempts:[{id:'paper1',student_id:'s2',qualification:'IGCSE',paper_mode:'weekly',
        status:'submitted',started_at:'2026-11-05T10:00:00Z',
        submitted_at:'2026-11-05T18:00:00Z'}],
       assignedAllRows:[{task_id:'task1',student_id:'s1',mode:'exam_daily',
        status:'completed',review_status:'awaiting_review',due_date:'2026-11-01',
        submitted_at:'2026-11-03T15:00:00Z',qualification:'GCSE'}]
      };
      const ui=m.initExaminerWorkspace(state,{
       openPaper:()=>{},openPractice:()=>{},onRefresh:async()=>{},onStudentFocus:()=>{}
      });
      ui.render();
     });
     assert.equal(await page.locator('#mgex-students .mgex-student-card').count(),2);
     assert.equal((await page.locator('#mgex-inbox .mgex-inbox-name').first().textContent()).trim(),'Student One');
     assert.equal((await page.locator('#mgex-after').textContent()).trim(),'1');
     await page.evaluate(()=>{const app=document.getElementById('application');app.hidden=false;app.style.setProperty('display','block','important')});
     const diagnostic=await page.locator('#mgex-search').evaluate(el=>{
      const style=getComputedStyle(el),box=el.getBoundingClientRect();
      let hiddenAncestor=null;
      for(let p=el.parentElement;p;p=p.parentElement){
       const st=getComputedStyle(p);
       if(st.display==='none'||st.visibility==='hidden'){hiddenAncestor=p.id||p.className||p.tagName;break}
      }
      return {display:style.display,visibility:style.visibility,rect:{x:box.x,y:box.y,width:box.width,height:box.height},
       hiddenAncestor,disabled:el.disabled};
     });
     console.log('Examiner input '+viewport.label+': '+JSON.stringify(diagnostic));
     await page.screenshot({path:resolve(screenshotDir,'examiner-before-'+viewport.label+'.png'),fullPage:false});
     await page.locator('#mgex-search').fill('Student Two',{timeout:5000});
     assert.equal(await page.locator('#mgex-students .mgex-student-card').count(),1);
     await page.locator('#mgex-search').fill('');
     await page.locator('#mgex-students .mgex-student-action').first().click();
     assert.equal(await page.locator('#mgex-selected').isVisible(),true);
     await page.locator('#mg-examiner-workspace').scrollIntoViewIfNeeded();
    }else{
     await page.evaluate(async()=>{
      const dash=document.getElementById('dashboard-view');dash.hidden=false;
      document.getElementById('loading-view').hidden=true;
      const m=await import('./student-release-feed.js');
      const ui=m.initStudentReleaseFeed({onRefresh:async()=>{},onOpenPaper:()=>{}});
      await ui.update({
       submitted:2,reviewed:1,reviewed_accuracy:75,
       history:[{task_id:'t1',mode:'daily',date:'2026-11-06',score:3,total:4,
        feedback:'Strong algebra reasoning. Practise fractions next.',
        feedback_updated_at:'2026-11-07T10:00:00Z'}]
      },[{id:'p1',status:'marked',qualification:'GCSE',paper_mode:'weekly',
        started_at:'2026-11-05T12:00:00Z'}],
      {from:()=>({select:()=>({in:async()=>({data:[{
       attempt_id:'p1',released_at:'2026-11-08T09:00:00Z',
       next_steps:'Check each substitution carefully.'
      }],error:null})})})},'fictional-student');
     });
     await page.evaluate(async()=>{
      const {renderStudentProof}=await import('./progress-evidence.js');
      renderStudentProof({baseline:{status:'submitted',score:14,total:20},
       reviewed:1,topics:[{topic:'Algebra',correct:2,total:3}],
       history:[{task_id:'t1',score:3,total:4,mode:'daily',feedback_updated_at:'2026-11-07T10:00:00Z'}]});
     });
     assert.equal(await page.locator('#mgpe-student-steps .mgpe-step').count(),4);
     assert.match(await page.locator('#mgpe-student-status').textContent(),/released questions/);
     assert.equal((await page.locator('#mgpe-student-steps .mgpe-step-state').last().textContent()).trim(),'NEXT CHECK');
     assert.equal(await page.locator('#mgsf-feed .mgsf-item').count(),2);
     assert.equal((await page.locator('#mgsf-released').textContent()).trim(),'2');
     await page.locator('#mg-student-releases').scrollIntoViewIfNeeded();
    }
    const overflow=await page.evaluate(()=>Math.max(
     document.documentElement.scrollWidth,document.body.scrollWidth)-document.documentElement.clientWidth);
    if(overflow>12){
     const offenders=await page.evaluate(()=>{
      const w=document.documentElement.clientWidth;
      return [...document.querySelectorAll('body *')].map(el=>{
       const b=el.getBoundingClientRect();return {tag:el.tagName,cls:String(el.className).slice(0,60),id:el.id,
        left:Math.round(b.left),right:Math.round(b.right),width:Math.round(b.width)};
      }).filter(v=>v.right>w+12&&v.width>0).sort((a,b)=>b.right-a.right).slice(0,8);
     });
     console.log('Dashboard overflow details '+kind+' '+viewport.label+': '+JSON.stringify(offenders));
     failures.push(kind+' '+viewport.label+' authenticated dashboard mock overflow '+overflow+'px');
    }
    if(errors.length)failures.push(kind+' '+viewport.label+' dashboard script errors: '+errors.slice(0,2).join(' | '));
    await page.screenshot({path:resolve(screenshotDir,kind+'-dashboard-'+viewport.label+'.png'),fullPage:false});
    console.log('Authenticated dashboard mock '+kind+' '+viewport.label+': overflow='+overflow+'px, JavaScript errors='+errors.length);
   }catch(err){failures.push(kind+' '+viewport.label+' dashboard test error: '+String(err.message||err).slice(0,400))}
   finally{await page.close()}
  }
  await context.close();
 }
 // Parent dashboard: render the actual linked-learner timing component with
 // fictional data; do not send credentials or read real student records.
 for(const viewport of viewports){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},
   deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e.message)));
  await page.route('**/family-access.js',route=>route.fulfill({status:200,contentType:'text/javascript',body:''}));
  try{
   await page.goto(base+'/family.html',{waitUntil:'domcontentloaded'});
   await page.evaluate(async()=>{
    document.getElementById('fa-loading').hidden=true;
    document.getElementById('fa-dashboard').hidden=false;
    const {renderFamilyTiming}=await import('./family-timing.js');
    renderFamilyTiming({practice_timing:{
     window_days:28,scheduled_sessions:9,submitted_sessions:5,
     unstarted_past_schedule:2,submitted_after_day:1,recorded_visible_minutes:142.5
    },practice_activity:[
     {mode:'exam_daily',scheduled_date:'2026-11-05',submitted_at:'2026-11-07T15:00:00Z',
      days_after_scheduled:2,status:'completed',visible_minutes:45},
     {mode:'weekly',scheduled_date:'2026-11-07',submitted_at:null,
      days_after_scheduled:null,status:'scheduled',visible_minutes:0}
    ]});
   });
   await page.evaluate(async()=>{
    const {renderFamilyProof}=await import('./progress-evidence.js');
    renderFamilyProof({view_role:'parent',papers_reviewed:2,
     topics:[{topic:'Algebra',earned:3,available:8,questions:3},
      {topic:'Geometry',earned:7,available:9,questions:2}],
     recent_results:[{topic:'Algebra',score:3,maximum:8,date:'2026-11-07T10:00:00Z'}]});
   });
   assert.match(await page.locator('#mgpe-family-focus').textContent(),/3 \/ 8/);
   assert.match(await page.locator('#mgpe-family-question').textContent(),/algebraic step/i);
   assert.equal(await page.locator('.fat-stat').count(),4);
   assert.equal(await page.locator('.fat-event').count(),2);
   assert.equal((await page.locator('.fat-stat strong').first().textContent()).trim(),'2 hr 23 min');
   const over=await page.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-
     document.documentElement.clientWidth);
   if(over>12)failures.push('family mock '+viewport.label+' overflow '+over+'px');
   if(errors.length)failures.push('family mock '+viewport.label+' errors '+errors.slice(0,2).join('; '));
   await page.locator('#fa-timing-dashboard').scrollIntoViewIfNeeded();
   await page.screenshot({path:resolve(screenshotDir,'family-timing-'+viewport.label+'.png'),fullPage:false});
   console.log('Family timing mock '+viewport.label+': overflow='+over+'px, scriptErrors='+errors.length);
  }catch(error){failures.push('Family mock '+viewport.label+': '+String(error.message||error).slice(0,300))}
  finally{await page.close();await context.close()}
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
for(const r of reports)console.log(JSON.stringify(r));
if(failures.length){console.error('MathsGrove browser smoke findings:\n'+failures.join('\n'));process.exitCode=1}
else console.log('MathsGrove public-page browser smoke passed at desktop and phone widths.');
