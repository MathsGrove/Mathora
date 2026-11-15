import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

// Conservative static check: literal in-page links, not JS-driven navigation.
export function auditNavigation(html, filename='page.html') {
  const errors=[];
  const ids=new Set([...html.matchAll(/\bid\s*=\s*(["'])(.*?)\1/g)].map(m=>m[2]));
  for(const match of html.matchAll(/<a\b[^>]*>/gi)) {
    const tag=match[0];
    const href=tag.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2];
    if(!href)continue;
    if(href.startsWith('#') && href.length>1) {
      let fragment;
      try { fragment=decodeURIComponent(href.slice(1)); }
      catch { errors.push(filename+': malformed fragment '+href);continue; }
      if(!ids.has(fragment)) errors.push(filename+': broken in-page link '+href);
    }
    if(/\btarget\s*=\s*(["'])_blank\1/i.test(tag)) {
      const rel=tag.match(/\brel\s*=\s*(["'])(.*?)\1/i)?.[2]??'';
      if(!rel.split(/\s+/).includes('noopener')) errors.push(filename+': target=_blank link missing rel=noopener ('+href+')');
    }
  }
  return errors;
}

export function run(files=['index.html']) {
  const errors=[];
  for(const file of files)errors.push(...auditNavigation(readFileSync(file,'utf8'),file));
  return errors;
}

if(process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1]) {
  const errors=run(process.argv.slice(2).length?process.argv.slice(2):undefined);
  if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
  else console.log('MathsGrove literal fragment navigation and external-tab safeguards: OK');
}
