const assert = require('node:assert/strict');
const fs = require('node:fs');

const appSource = fs.readFileSync('assets/js/app.js', 'utf8');

assert.match(appSource, /function sortItems\(section, a, b\)/);
assert.match(appSource, /if \(section === 'rules'\)/);
assert.match(appSource, /return sourcePageValue\(a\.pagine_sorgente\) - sourcePageValue\(b\.pagine_sorgente\);/);
assert.match(appSource, /function sourcePageValue\(value\)/);

console.log('Ordinamento lista regole OK');
