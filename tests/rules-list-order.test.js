const assert = require('node:assert/strict');
const { readJavaScriptSources } = require('./helpers/source-utils');

const jsSource = readJavaScriptSources('assets/js');

assert.match(jsSource, /function sortItems\(section, a, b\)/);
assert.match(jsSource, /if \(section === 'rules'\)/);
assert.match(jsSource, /return sourcePageValue\(a\.pagine_sorgente\) - sourcePageValue\(b\.pagine_sorgente\);/);
assert.match(jsSource, /function sourcePageValue\(value\)/);

console.log('Ordinamento lista regole OK');
