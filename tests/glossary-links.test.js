const assert = require('node:assert/strict');
const fs = require('node:fs');

const appSource = fs.readFileSync('assets/js/app.js', 'utf8');
const cssSource = fs.readFileSync('assets/css/styles.css', 'utf8');

assert.match(appSource, /function enrichGlossaryLinks\(html\)/);
assert.match(appSource, /href="#\/rules_glossary\/\$\{encodeURIComponent\(id\)\}"/);
assert.match(appSource, /class="glossary-link"/);

[
  'afferrato',
  'prona',
  'trattenuta',
  'stordito',
  'privo di sensi',
].forEach((term) => {
  assert.ok(appSource.includes(`'${term}'`), `${term} deve essere tra gli alias delle condizioni`);
});

assert.ok(cssSource.includes('.glossary-link'), 'I link glossario devono avere stile dedicato');
assert.ok(cssSource.includes('.glossary-link:focus-visible'), 'I link glossario devono avere focus visibile');

console.log('Link glossario condizioni OK');
