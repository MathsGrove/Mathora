/* Original GCSE Foundation-style reasoning demonstration.
 * These are deterministic specimen questions, not live human marking.
 * No input or learner information is collected, transmitted or persisted. */
export const DEMO_STAGES=Object.freeze([
 {symbol:'x',equation:'3(x + 4) = 27',answer:5,
  methods:Object.freeze([
   {id:'a',text:'Divide both sides by 3, then subtract 4.',correct:true},
   {id:'b',text:'Subtract 4 from 27, then divide by 3.',correct:false},
   {id:'c',text:'Multiply 27 by 3, then subtract 4.',correct:false}
  ]),
  expansion:'Divide 27 by 3 to get x + 4 = 9, then subtract 4 to get x = 5. Check: 3(5 + 4) = 27.',
  misconception:'When a number multiplies a whole bracket, reverse the outside multiplication before changing the terms inside.'},
 {symbol:'y',equation:'4(2y − 3) = 20',answer:4,
  methods:Object.freeze([
   {id:'a',text:'Divide by 4, add 3, then divide by 2.',correct:true},
   {id:'b',text:'Divide by 4, divide by 2, then add 3.',correct:false},
   {id:'c',text:'Expand as 8y − 3 = 20.',correct:false}
  ]),
  expansion:'Divide 20 by 4 to get 2y − 3 = 5. Add 3, then divide by 2: y = 4. Check: 4(8 − 3) = 20.',
  misconception:'Undo operations from the outside in, and always check the final value in the original equation.'}
]);
export function assessDemoReasoning(stageIndex,rawAnswer,methodId){
 const question=DEMO_STAGES[stageIndex];
 if(!question)return {valid:false,message:'Unknown specimen question'};
 const cleaned=String(rawAnswer??'').trim().replace(new RegExp('^'+question.symbol+'\\s*=\\s*','i'),'').trim();
 if(!/^[+-]?\d+(?:\.\d+)?$/.test(cleaned)){
  return {valid:false,message:'Enter a numerical value such as 5 or x = 5.'};
 }
 const method=question.methods.find(m=>m.id===methodId);
 if(!method)return{valid:false,message:'Choose the reasoning you used.'};
 const answer=Number(cleaned),numberCorrect=Math.abs(answer-question.answer)<1e-10;
 const methodCorrect=method.correct;
 const label=numberCorrect&&methodCorrect?'Both signals correct':
  numberCorrect?'Correct answer; the selected method needs checking':
  methodCorrect?'Useful method; the numerical result needs checking':
  'Review both the answer and the selected method';
 return {valid:true,numberCorrect,methodCorrect,
  checksPassed:Number(numberCorrect)+Number(methodCorrect),
  label,answer,expected:question.answer,feedback:question.expansion,
  misconception:question.misconception};
}
export function evidenceSummary(first,recheck){
 const submitted=Number(Boolean(first?.valid))+Number(Boolean(recheck?.valid));
 const signals=[first,recheck].filter(x=>x?.valid);
 const correctSignals=signals.reduce((n,r)=>n+r.checksPassed,0);
 const description=submitted===0?'No reasoning submitted yet':
  submitted===1?'One example reviewed; an independent practice question is next':
  first.numberCorrect&&first.methodCorrect&&recheck.numberCorrect&&recheck.methodCorrect
    ?'Both examples were answered with sound selected reasoning. Recheck on another day before claiming mastery.'
    :first.numberCorrect===false&&recheck.numberCorrect&&recheck.methodCorrect
      ?'A correction appeared on a new question; another later check is needed to confirm retention.'
      :'The next learning step is to revisit inverse operations and try a new question.';
 return {submitted,correctSignals,possibleSignals:submitted*2,description,
  readyToClaimMastery:false};
}
