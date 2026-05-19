const assert = require('node:assert/strict');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { parseDiceFormula } = require('../assets/js/dice-roller.js');

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
    appState: {
      data: {
        rules_glossary: [
          { id: 'afferrato', descrittore: 'condizione' },
          { id: 'privo_di_sensi', descrittore: 'condizione' },
        ],
      },
    },
    conditionAliases: {
      afferrato: ['afferrato', 'afferrata'],
      privo_di_sensi: ['privo di sensi', 'priva di sensi'],
    },
    escapeAttr: escapeHtml,
    escapeHtml,
    escapeRegExp: (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    isLikelyTableDie: () => false,
    normalizeText: (value) => String(value || '').toLowerCase(),
    parseDiceFormula,
  });

  const html = formatInline('Il bersaglio è afferrato e poi privo di sensi.', { dice: false });

  assert.match(html, /href="#\/rules_glossary\/afferrato"/);
  assert.match(html, /href="#\/rules_glossary\/privo_di_sensi"/);
  assert.match(html, /class="glossary-link"/);
  assert.ok(cssSource.includes('.glossary-link'), 'I link glossario devono avere stile dedicato');
  assert.ok(cssSource.includes('.glossary-link:focus-visible'), 'I link glossario devono avere focus visibile');

  console.log('Link glossario condizioni OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
