import assert from 'node:assert/strict';
const near=(x,y)=>assert.ok(Math.abs(x-y)<1e-12);
const samples=[0,0,1,1,1,2,2,2,2,2];
near(samples.reduce((a,b)=>a+b,0)/samples.length,1.3);
near(samples.filter(x=>x>0).length/samples.length,.8);
let one=0,any=0,sum=0;
for(let mask=0;mask<16;mask++){let k=mask.toString(2).split('1').length-1;let p=.25**k*.75**(4-k);sum+=p;if(k===1)one+=p;if(k>0)any+=p;}
near(sum,1);near(one,.421875);near(any,.68359375);
near(240/(240+70),24/31);
assert.equal(4+5+5,14);
console.log('Original specimen arithmetic and total marks passed');
