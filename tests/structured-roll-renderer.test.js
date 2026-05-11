const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('assets/js/app.js', 'utf8');

assert.match(source, /function renderStructuredRollControls/);
assert.match(source, /function hasValidStructuredRollData/);
assert.match(source, /isValidStructuredAttack/);
assert.match(source, /isValidStructuredSave/);
assert.match(source, /hasValidStructuredRollData\(entry\)\s*\?\s*\{\s*dice:\s*false,\s*attacks:\s*false\s*\}/);
assert.match(source, /return withDice \? enrichDiceFormulas\(withAttackRolls\) : withAttackRolls;/);

console.log('Renderer tiri strutturati OK');
