/* MathsGrove: static public HTML accessibility regression checks.
 * No browser, student data, network, or external dependencies.
 * This is a narrow syntax-level guard, NOT WCAG conformance testing.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

export function auditMarkup(html, filename='document') {
  const findings=[];
  const report=(rule,detail)=>findings.push({file:filename,rule,detail});
  const tags=[...html.matchAll(/<([a-z][\w:-]*)\b([^<>]*?)>/gi)]
    .map(m=>({name:m[1].toLowerCase(),attrs:m[2],position:m.index}));
  const get=(attrs,name)=>{
    const m=attrs.match(new RegExp('(?:^|\\s)'+name+'\\s*=\\s*(?:"([^"]*)"|\\x27([^\\x27]*)\\x27)','i'));
    return m?m[1]??m[2]:null;
  };
  const ids=new Set();
  for(const tag of tags){
    const id=get(tag.attrs,'id');
    if(id!==null){
      if(!id.trim())report('empty-id','An empty ID was found');
      if(ids.has(id))report('duplicate-id','Duplicate id '+id);
      ids.add(id);
    }
    if(tag.name==='html'&&!get(tag.attrs,'lang'))report('html-language','The html element needs a language');
    if(tag.name==='img'&&get(tag.attrs,'alt')===null)
      report('image-alt','Image missing alt at character '+tag.position);
    if(tag.name==='button'&&get(tag.attrs,'type')===null)
      report('button-type','Button missing explicit type at character '+tag.position);
    if(tag.name==='input'){
      const type=(get(tag.attrs,'type')||'text').toLowerCase();
      if(type!=='hidden'&&!id&&!get(tag.attrs,'aria-label')&&!get(tag.attrs,'aria-labelledby'))
        report('input-label','Input lacks an id or accessible label at character '+tag.position);
    }
    const role=get(tag.attrs,'role');
    if(role==='status'&&get(tag.attrs,'aria-live')==='off')
      report('status-off','Status region must not disable announcements');
    if(role==='alert'&&get(tag.attrs,'aria-live')==='off')
      report('alert-off','Alert region must not disable announcements');
  }
  if(!tags.some(t=>t.name==='html'))report('html-root','Missing html root');
  if(!tags.some(t=>t.name==='main'))report('main-landmark','Missing main landmark');
  if(!tags.some(t=>t.name==='title'))report('page-title','Missing title element');
  return findings;
}

export function auditPublicPages(paths) {
  return paths.flatMap(path=>auditMarkup(readFileSync(path,'utf8'),path));
}

if(process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll('\\','/'))){
  const pages=['index.html','portal.html','family.html'];
  const problems=auditPublicPages(pages);
  for(const issue of problems)console.error(issue.file+': '+issue.rule+': '+issue.detail);
  assert.equal(problems.length,0,'Public HTML static accessibility regression(s) detected');
  // Guard the guard: regressions in fictional markup must be detected.
  const fixture='<!doctype html><html lang="en"><head><title>Example</title></head><body><main><img src="x"><button>Go</button><p id="same"></p><p id="same"></p></main></body></html>';
  assert.deepEqual(auditMarkup(fixture).map(x=>x.rule),['image-alt','button-type','duplicate-id']);
  const accessible='<!doctype html><html lang="en"><head><title>Example</title></head><body><main><img src="x" alt=""><button type="button">Go</button><p id="one" role="status" aria-live="polite"></p></main></body></html>';
  assert.deepEqual(auditMarkup(accessible),[]);
  const disabledStatus=accessible.replace('aria-live="polite"','aria-live="off"');
  assert.deepEqual(auditMarkup(disabledStatus).map(x=>x.rule),['status-off']);
  console.log('PASS: public HTML static guard — 3 pages and fictional positive/negative fixtures.');
}
