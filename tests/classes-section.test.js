const assert = require('node:assert/strict');
const fs = require('node:fs');
const rules = require('../data/srd/5.2.1/json/srd_5_2_1_rules.json');

const appSource = fs.readFileSync('assets/js/app.js', 'utf8');
const configSource = fs.readFileSync('config.yml', 'utf8');
const indexSource = fs.readFileSync('index.html', 'utf8');

const classRules = rules.filter((rule) => rule.id.startsWith('classe_'));

assert.equal(classRules.length, 12);

[
  'classes: []',
  "classes: ''",
  "classes: {",
  "appState.data.classes = normalizeArray(rules).filter(isClassRule);",
  "appState.data.rules = normalizeArray(rules).filter((rule) => !isClassRule(rule));",
  "if (section === 'classes') return renderClass(item);",
  "function renderClass(rule)",
  "location.hash = `#/classes/${encodeURIComponent(route.id)}`;",
].forEach((token) => assert.ok(appSource.includes(token), `${token} deve essere presente in app.js`));

assert.match(configSource, /classes: Classi/);
assert.match(indexSource, /20260514-character-sheet-resources/);

console.log('Sezione classi OK');
