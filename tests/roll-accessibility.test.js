const assert = require('node:assert/strict');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const {
  isLikelyTableDie,
  parseDiceFormula,
} = require('../assets/js/dice-roller.js');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

(async () => {
  const { createInlineFormatter } = await import(pathToFileURL(`${process.cwd()}/assets/js/inline-formatting.js`).href);
  const cssSource = fs.readFileSync('assets/css/styles.css', 'utf8');
  const formatInline = createInlineFormatter({
    appState: { data: { rules_glossary: [] } },
    conditionAliases: {},
    escapeAttr: escapeHtml,
    escapeHtml,
    escapeRegExp: (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    isLikelyTableDie,
    normalizeText: (value) => String(value || '').toLowerCase(),
    parseDiceFormula,
  });

  const html = formatInline('*Tiro per colpire:* +7, portata 1,5 m. Colpito: 2d8 + 4 danni.');

  assert.match(html, /class="dice-inline" type="button"[^>]+aria-label="Tira 2d8 \+ 4"/);
  assert.match(html, /data-attack-mode="advantage"[^>]+aria-label="Tira per colpire \+7 con vantaggio" title="Vantaggio"/);
  assert.match(html, /data-attack-mode="disadvantage"[^>]+aria-label="Tira per colpire \+7 con svantaggio" title="Svantaggio"/);
  assert.doesNotMatch(html, /class="structured-roll-button"/);
  assert.doesNotMatch(html, /data-structured-damage-roll/);
  assert.doesNotMatch(html, /tabindex="(?:[1-9]|[1-9]\d+)"/);

  [
    '.dice-inline:focus-visible',
    '.attack-roll button:focus-visible',
    '.scaling-controls button:focus-visible',
    '.quick-dice button:focus-visible',
  ].forEach((selector) => assert.ok(cssSource.includes(selector), `${selector} deve avere focus visibile`));

  assert.match(cssSource, /outline:\s*2px solid/);
  assert.match(cssSource, /outline-offset:\s*2px/);

  console.log('Accessibilita dice roller OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
