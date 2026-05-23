const assert = require('node:assert/strict');
const fs = require('node:fs');
const classes = require('../data/srd/5.2.1/json/srd_5_2_1_classes.json');
const rules = require('../data/srd/5.2.1/json/srd_5_2_1_rules.json');

const appSource = fs.readFileSync('assets/js/app.js', 'utf8');
const configSource = fs.readFileSync('config.yml', 'utf8');
const indexSource = fs.readFileSync('index.html', 'utf8');

assert.equal(classes.length, 12);
assert.equal(rules.some((rule) => rule.id.startsWith('classe_')), false);

[
  'classes: []',
  'fetchJson(paths.classes)',
  'appState.data.classes = normalizeArray(classes);',
  'appState.data.rules = normalizeArray(rules);',
  "if (section === 'classes') return renderClass(item);",
  "function renderClass(rule)",
].forEach((token) => assert.ok(appSource.includes(token), `${token} deve essere presente in app.js`));

assert.match(configSource, /classes:\s+data\/srd\/5\.2\.1\/json\/srd_5_2_1_classes\.json/);
assert.match(configSource, /classes: Classi/);
assert.match(indexSource, /20260514-classes-section/);

console.log('Sezione classi OK');
