const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('assets/js/roll-tray.js', 'utf8');
const bodyStart = source.indexOf('<div id="roll-tray-body" class="roll-tray-body">');
const resultIndex = source.indexOf('<div class="roll-result', bodyStart);
const formIndex = source.indexOf('<form id="roll-tray-form"', bodyStart);
const toggleSummaryIndex = source.indexOf('class="roll-toggle-result"');
const showRollResultIndex = source.indexOf('function showRollResult');
const scrollResetIndex = source.indexOf('body.scrollTop = 0', showRollResultIndex);

assert.notEqual(bodyStart, -1);
assert.notEqual(resultIndex, -1);
assert.notEqual(formIndex, -1);
assert.notEqual(toggleSummaryIndex, -1);
assert.notEqual(showRollResultIndex, -1);
assert.notEqual(scrollResetIndex, -1);
assert.ok(
  resultIndex < formIndex,
  'Il risultato del tiro deve precedere i controlli del tray.'
);
assert.match(source, /class="roll-result \$\{escapeAttr\(rollResultClass\(lastRoll\)\)\}" role="status" aria-live="polite"/);

console.log('Markup dice tray OK');
