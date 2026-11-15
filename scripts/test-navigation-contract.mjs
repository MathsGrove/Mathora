import assert from 'node:assert/strict';
import {auditNavigation} from './check-navigation-contract.mjs';
assert.deepEqual(auditNavigation('<main id="part"></main><a href="#part">Go</a>'),[]);
assert.match(auditNavigation('<a href="#missing">Go</a>').join('\n'),/broken in-page link/);
assert.deepEqual(auditNavigation('<a href="https://example.org" target="_blank" rel="noopener noreferrer">Go</a>'),[]);
assert.match(auditNavigation('<a href="https://example.org" target="_blank">Go</a>').join('\n'),/noopener/);
assert.match(auditNavigation('<a href="#%ZZ">Go</a>').join('\n'),/malformed/);
console.log('Navigation contract fixture tests: 5 passed');
