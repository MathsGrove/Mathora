import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
class Node {
 constructor(){
  this.handlers={};this.attrs={};this.textContent='';this.focused=false;this.children=[];
  this.classList={set:new Set(),toggle:(s,on)=>on?this.classList.set.add(s):this.classList.set.delete(s),remove:s=>this.classList.set.delete(s)};
 }
 addEventListener(k,fn){(this.handlers[k]??=[]).push(fn)}
 emit(k,e={}){for(const fn of this.handlers[k]??[])fn(e)}
 getAttribute(k){return this.attrs[k]??null}
 setAttribute(k,v){this.attrs[k]=v}
 contains(n){return n===this||this.children.includes(n)}
 querySelectorAll(){return this.children}
 focus(){this.focused=true}
}
const button=new Node(),nav=new Node(),link=new Node(),outside=new Node(),document=new Node(),window=new Node();
nav.children=[link];
document.getElementById=id=>id==='mobile-toggle'?button:id==='primary-nav'?nav:null;
document.activeElement=link;
let desktop=false;
window.matchMedia=()=>({matches:desktop});
vm.runInNewContext(readFileSync(new URL('../marketing.js',import.meta.url),'utf8'),{document,window});
const open=()=>button.getAttribute('aria-expanded')==='true';
assert.equal(open(),false);
assert.equal(button.getAttribute('aria-label'),'Open navigation');
button.emit('click');
assert.equal(open(),true);
assert.equal(button.getAttribute('aria-label'),'Close navigation');
document.emit('keydown',{key:'Escape'});
assert.equal(open(),false);
assert.equal(button.focused,true);
button.emit('click');link.emit('click');assert.equal(open(),false);
button.emit('click');document.emit('pointerdown',{target:outside});assert.equal(open(),false);
button.emit('click');document.emit('pointerdown',{target:link});assert.equal(open(),true);
desktop=true;window.emit('resize');assert.equal(open(),false);
console.log('PASS: initial state, labels, toggle, Escape/focus return, link close, outside click, inside click, desktop resize');
