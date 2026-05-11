const assert = require('node:assert/strict');
const fs = require('node:fs');

const appSource = fs.readFileSync('assets/js/app.js', 'utf8');
const cssSource = fs.readFileSync('assets/css/styles.css', 'utf8');

assert.match(appSource, /class="dice-inline" type="button"[^>]+aria-label="Tira/);
assert.match(appSource, /data-quick-roll="1d\$\{faces\}" aria-label="Tira 1d\$\{faces\}"/);
assert.match(appSource, /data-attack-mode="advantage"[^>]+aria-label="Tira per colpire[^"]+con vantaggio" title="Vantaggio"/);
assert.match(appSource, /data-attack-mode="disadvantage"[^>]+aria-label="Tira per colpire[^"]+con svantaggio" title="Svantaggio"/);
assert.match(appSource, /isInsideHtmlTag\(fullText,\s*offset \+ prefix\.length\)/);
assert.doesNotMatch(appSource, /class="structured-roll-button"/);
assert.doesNotMatch(appSource, /data-structured-damage-roll/);
assert.doesNotMatch(appSource, /tabindex="(?:[1-9]|[1-9]\d+)"/);

[
  '.dice-inline:focus-visible',
  '.attack-roll button:focus-visible',
  '.scaling-controls button:focus-visible',
  '.quick-dice button:focus-visible',
].forEach((selector) => assert.ok(cssSource.includes(selector), `${selector} deve avere focus visibile`));

assert.match(cssSource, /outline:\s*2px solid/);
assert.match(cssSource, /outline-offset:\s*2px/);

console.log('Accessibilita dice roller OK');
