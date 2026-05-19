const assert = require('node:assert/strict');
const fs = require('node:fs');
const { readJavaScriptSources } = require('./helpers/source-utils');

const jsSource = readJavaScriptSources('assets/js');
const rollTraySource = fs.readFileSync('assets/js/roll-tray.js', 'utf8');
const cssSource = fs.readFileSync('assets/css/styles.css', 'utf8');

assert.match(jsSource, /class="dice-inline" type="button"[^>]+aria-label="Tira/);
assert.match(rollTraySource, /data-quick-roll="1d\$\{faces\}" aria-label="Tira 1d\$\{faces\}"/);
assert.match(jsSource, /data-attack-mode="advantage"[^>]+aria-label="Tira per colpire[^"]+con vantaggio" title="Vantaggio"/);
assert.match(jsSource, /data-attack-mode="disadvantage"[^>]+aria-label="Tira per colpire[^"]+con svantaggio" title="Svantaggio"/);
assert.match(jsSource, /isInsideHtmlTag\(fullText,\s*offset \+ prefix\.length\)/);
assert.doesNotMatch(jsSource, /class="structured-roll-button"/);
assert.doesNotMatch(jsSource, /data-structured-damage-roll/);
assert.doesNotMatch(jsSource, /tabindex="(?:[1-9]|[1-9]\d+)"/);

[
  '.dice-inline:focus-visible',
  '.attack-roll button:focus-visible',
  '.scaling-controls button:focus-visible',
  '.quick-dice button:focus-visible',
].forEach((selector) => assert.ok(cssSource.includes(selector), `${selector} deve avere focus visibile`));

assert.match(cssSource, /outline:\s*2px solid/);
assert.match(cssSource, /outline-offset:\s*2px/);

console.log('Accessibilita dice roller OK');
