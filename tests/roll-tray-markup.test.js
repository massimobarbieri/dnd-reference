const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('assets/js/app.js', 'utf8');
const bodyStart = source.indexOf('<div id="roll-tray-body" class="roll-tray-body">');
const resultIndex = source.indexOf('<div class="roll-result', bodyStart);
const formIndex = source.indexOf('<form id="roll-tray-form"', bodyStart);

assert.notEqual(bodyStart, -1);
assert.notEqual(resultIndex, -1);
assert.notEqual(formIndex, -1);
assert.ok(
  resultIndex < formIndex,
  'Il risultato del tiro deve precedere i controlli del tray.'
);

console.log('Markup dice tray OK');
