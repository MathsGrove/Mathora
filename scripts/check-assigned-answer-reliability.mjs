import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Exercise the actual assigned-practice module with an isolated in-memory
// Supabase transport. No production account or data is accessed.
class Node {
 constructor(tag='div'){this.tag=tag;this.children=[];this.events={};this.disabled=false;
  this.textContent='';this.className='';this.value='';this.hidden=false;this.isConnected=true;}
 append(...children){this.children.push(...children)}
 replaceChildren(...children){this.children=[...children]}
 addEventListener(name,cb){this.events[name]=cb}
 scrollIntoView(){}
 querySelectorAll(selector){
  const matches=[];
  function walk(node){
   if(selector==='input[name="mg-answer"]'&&node.tag==='input'&&node.name==='mg-answer')matches.push(node);
   for(const child of node.children||[])walk(child);
  }
  walk(this);return matches;
 }
}
const nodes=new Map();
const $=id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id)};
const pending=[];
const today=new Date().toISOString().slice(0,10);
const schedule={ready:true,programme:'daily',baseline_status:'submitted',unseen_questions:50,
 assignments:[{id:'task-one',mode:'daily',questions:4,status:'scheduled',due_date:today}]};
const task={task_id:'task-one',programme:'daily',status:'active',qualification:'GCSE',level:'higher',
 mode:'daily',question_count:4,
 questions:Array.from({length:4},(_,idx)=>({position:idx+1,topic:'Algebra',
  prompt:'Select the correct expression',selected:idx===0?'A':null,
  choices:[{id:'A',text:'Answer A'},{id:'B',text:'Answer B'},{id:'C',text:'Answer C'},{id:'D',text:'Answer D'}]}))};
const db={
 async rpc(name,args){
  if(name==='grove_my_calendar')return {data:schedule,error:null};
  if(name==='grove_task_start'||name==='grove_task_view')return {data:task,error:null};
  if(name==='grove_task_focus')return {data:{ok:true,seconds_visible:0},error:null};
  if(name==='grove_task_answer'){
   const p=new Promise(resolve=>pending.push({args,resolve}));
   return p;
  }
  throw Error('Unexpected RPC '+name);
 }
};
const state={
 document:{createElement:tag=>new Node(tag),getElementById:$,
  addEventListener(){},hidden:false},
 window:{addEventListener(){}},
 setInterval:()=>1,clearInterval(){},confirm:()=>true,
 fakeEvidence:()=>({refresh:async()=>{},switchQuestion(){},flush:async()=>{},totalSaved:()=>1}),
 fakeReleasedReport:()=>null, // report transformation is unit-tested separately; this VM tests answer-save transport only
};
let source=readFileSync(new URL('../assigned-practice.js',import.meta.url),'utf8');
source=source.replace(/^import \{createEvidenceWorkspace\} from '.\/evidence-workspace\.js';/m,
 'const createEvidenceWorkspace=globalThis.fakeEvidence;');
source=source.replace(/^import \{buildReleasedPracticeReport\} from '.\/released-practice-report\.mjs';/m,
 'const buildReleasedPracticeReport=globalThis.fakeReleasedReport;');
source=source.replace('export function initAssignedPractice(db){','function initAssignedPractice(db){');
runInNewContext(source+'\nglobalThis.initAssignedPractice=initAssignedPractice;',state);
const app=state.initAssignedPractice(db);
const drain=async()=>{for(let i=0;i<16;i++)await Promise.resolve()};
await app.refresh();
const button=$('mg-auto-list').children[0];
assert.equal(button.tag,'button');assert.equal(button.disabled,false);
button.events.click();
await drain();
assert.equal($('mg-practice-workspace').hidden,false);

let radio=$('mg-practice-options').querySelectorAll('input[name="mg-answer"]');
assert.equal(radio.length,4);
assert.equal(radio[0].checked,true);
radio[1].events.change();
assert.equal(pending.length,1);
radio=$('mg-practice-options').querySelectorAll('input[name="mg-answer"]');
assert.ok(radio.every(i=>i.disabled),'all answers locked while saving');
assert.equal($('mg-practice-next').disabled,true);
assert.equal($('mg-practice-finish').disabled,true);
assert.equal(task.questions[0].selected,'A','not-yet-saved selection must not replace confirmed answer');
pending[0].resolve({data:{ok:true},error:null});
await drain();
assert.equal(task.questions[0].selected,'B');
radio=$('mg-practice-options').querySelectorAll('input[name="mg-answer"]');
assert.equal(radio[1].checked,true);
assert.ok(radio.every(i=>!i.disabled),'controls unlocked after successful acknowledgement');
assert.equal($('mg-practice-next').disabled,false);

radio[2].events.change();
assert.equal(pending.length,2);
pending[1].resolve({data:null,error:new Error('Network disconnected')});
await drain();
radio=$('mg-practice-options').querySelectorAll('input[name="mg-answer"]');
assert.equal(radio[1].checked,true,'network failure must restore the last confirmed answer');
assert.equal(radio[2].checked,false,'failed choice must not masquerade as saved');
assert.ok($('mg-practice-save').textContent.startsWith('Not saved:'));
assert.ok(radio.every(i=>!i.disabled),'controls unlocked after a network failure');
console.log('Assigned-practice choice tests passed: pending locks, last-confirmed answer, failed-save rollback and navigation controls.');
