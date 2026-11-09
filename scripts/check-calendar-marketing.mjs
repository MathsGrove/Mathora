import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const home=read('index.html'),js=read('experience-v4.js'),css=read('calendar-dialog-polish.css'),wf=read('.github/workflows/pages.yml');
for(const id of [
 'mg4-calendar-dialog','mg4-dialog-title','mg4-dialog-close','mg4-dialog-desc',
 'mg4-dialog-date-mark','mg4-event-status','mg4-event-kind','mg4-event-tags',
 'mg4-dialog-focus','mg4-dialog-focus-detail','mg4-view-practice',
 'mg4-start-trial','mg4-reasoning-cta','mg4-trial','mg4-trial-results'
])assert.ok(home.includes('id="'+id+'"'),'Calendar preview missing '+id);
assert.ok(home.includes('aria-labelledby="mg4-dialog-title"')&&
 home.includes('aria-describedby="mg4-dialog-desc"'),
 'Modal must have a programmatic name and description');
assert.ok(home.includes('LEARNING CALENDAR · FICTIONAL DEMONSTRATION')&&
 home.includes('not a real student assignment or deadline'),
 'Calendar must distinguish fictional dates from actual assignments');
assert.ok(!js.includes("b.setAttribute('aria-current','date')"),
 'Do not label an October 2026 fictional date as today in November or later');
assert.ok(js.includes("put('mg4-dialog-date-mark'")&&js.includes("put('mg4-event-status'"),
 'Modal date and status must be updated from the selected example');
assert.ok(js.includes("lastOpenedFrom.focus({preventScroll:true})"),
 'Closing a modal should restore keyboard focus to the chosen day');
assert.ok(js.includes("addEventListener('cancel'"),
 'Escape must stop a running specimen trial');
assert.ok(js.includes("!dialog.open"),'Avoid opening an already open native dialog');
assert.ok(css.includes('.mg4-dialog-refined .mg4-dialog-head')&&
 css.includes('.mg4-event-status-panel')&&css.includes('.mg4-session-steps'),
 'Modern popup must style summary, status and three learning steps');
assert.ok(css.includes('max-height:calc(100dvh - 18px)')&&
 css.includes('@media(max-width:720px)'),
 'Calendar should fit small-height mobile screens');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),
 'No forced transitions for reduced-motion visitors');
for(const id of ['student','parent','tutor']){
 assert.ok(home.includes('data-mg8-route="'+id+'"'),'Marketing demo role '+id+' missing');
}
for(const link of ['./portal.html','./family.html','./studio.html']){
 assert.ok(home.includes('href="'+link+'"'),'Role sign-in path '+link+' missing');
}
assert.ok(home.includes('Go straight to your private space.')&&
 home.includes('Live dashboards require a verified, individually authorised account.'),
 'Role entry must distinguish public demonstration from private account');
assert.ok(home.includes('href="./calendar-dialog-polish.css"'),'Homepage must load popup styles');
assert.ok(wf.includes('calendar-dialog-polish.css'),'Curated Pages must publish popup CSS');
assert.ok(wf.includes('node scripts/check-calendar-marketing.mjs'),'Deploy must check calendar interaction source');
assert.ok(!/animation-iteration-count:\s*infinite/.test(css),'No persistent modal animations');
console.log('MathsGrove calendar: accessible session preview, mobile/reduced motion, fictional dates, role entry, safe focus and deploy packaging passed.');
