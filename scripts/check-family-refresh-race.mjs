import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Extract the deployed access/leave implementations, not an independent rewrite.
const source=readFileSync(new URL('../family-access.js',import.meta.url),'utf8');
const start=source.indexOf('let accessGeneration=0;');
const end=source.indexOf("$('fa-retry').addEventListener(",start);
assert.ok(start>0&&end>start,'Family access response guards missing');
const implementation=source.slice(start,end);
const deferred=()=>{
 let resolve;const promise=new Promise(res=>{resolve=res});return{promise,resolve};
};
const pendingSessions=[];
const nodes=new Map();
const $=id=>{
 if(!nodes.has(id))nodes.set(id,{hidden:false,events:{},addEventListener(name,fn){this.events[name]=fn}});
 return nodes.get(id);
};
const writes=[],redirects=[],rpccalls=[];
let activeUser='parent-one',signOutCalls=0;
const sb={
 auth:{
  getSession(){const pending=deferred();pendingSessions.push(pending);return pending.promise},
  getUser(){return Promise.resolve({data:{user:{id:activeUser,email_confirmed_at:'2026-11-07'}},error:null})},
  async signOut(){signOutCalls++;return{error:null}}
 },
 async rpc(name){
  rpccalls.push(name);
  if(name==='claim_my_learner_views')return{data:{awaiting_student:0},error:null};
  if(name==='get_my_learner_views')return{data:{learners:[]},error:null};
  throw Error('Unexpected RPC '+name);
 }
};
const ctx={sb,records:[{student_name:'Old learner'}],user:{id:'parent-one'},selectedLearnerKey:'old-id::parent',$,
 clearTierRoleExperience:what=>writes.push(['clear-tier-role',what]),
 view:v=>writes.push(['view',v]),
 set:(id,v)=>writes.push([id,v]),
 err:(...args)=>writes.push(['error',...args]),
 render:()=>{throw Error('Stale or unauthorised learner must never render')},
 location:{replace:path=>redirects.push(path)},
};
runInNewContext(implementation+
 '\nglobalThis.__access=access;globalThis.__leave=leaveFamilyDashboard;'+
 'globalThis.__snapshot=()=>({records,user,accessGeneration});',ctx);
const flush=async()=>{for(let n=0;n<12;n++)await Promise.resolve()};

// Pending response must not resurrect old learner data after sign-out.
const original=ctx.__access();
assert.equal(pendingSessions.length,1);
await ctx.__leave();
assert.equal(signOutCalls,1);
assert.deepEqual(Array.from(ctx.__snapshot().records),[]);
assert.equal(ctx.__snapshot().user,null);
assert.ok(writes.some(x=>x[0]==='clear-tier-role'&&x[1]==='family'),'New role summary must clear on sign-out');
pendingSessions[0].resolve({data:{session:{user:{id:'parent-one'}}},error:null});
await original;await flush();
assert.equal(rpccalls.length,0);
assert.deepEqual(Array.from(ctx.__snapshot().records),[]);
assert.equal(ctx.__snapshot().user,null);
assert.ok(redirects.includes('./portal.html'));

// A slow earlier refresh cannot override a newer permissions check.
const slow=ctx.__access();
const fresh=ctx.__access();
assert.equal(pendingSessions.length,3);
pendingSessions[2].resolve({data:{session:{user:{id:'parent-one'}}},error:null});
await fresh;
assert.equal(ctx.__snapshot().user.id,'parent-one');
const count=rpccalls.length;
pendingSessions[1].resolve({data:{session:{user:{id:'parent-one'}}},error:null});
await slow;
assert.equal(rpccalls.length,count,'superseded refresh must not run further RPCs');
assert.ok(writes.some(x=>x[0]==='fa-pending-copy'),'newest permission check should show a result');

// The validated Supabase user must match the session user.
activeUser='different-user';
const mismatch=ctx.__access();
pendingSessions[3].resolve({data:{session:{user:{id:'parent-one'}}},error:null});
await mismatch;
assert.equal(rpccalls.length,count,'session/user mismatch must not load private learner data');
assert.ok(redirects.length>=2);
console.log('Family access race tests passed: sign-out clears data, old requests are discarded, and mismatched sessions are rejected.');
