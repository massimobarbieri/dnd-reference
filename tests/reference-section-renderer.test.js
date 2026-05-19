const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const {
  findDiceFormulas,
  formatDiceFormula,
} = require('../assets/js/dice-roller.js');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

(async () => {
  const rendererUrl = pathToFileURL(`${process.cwd()}/assets/js/reference-section-renderer.js`).href;
  const { createReferenceSectionRenderer } = await import(rendererUrl);

  const renderer = createReferenceSectionRenderer({
    appState: {
      data: {
        spells: [
          { id: 'luce', nome: 'Luce' },
          { id: 'cura-ferite', nome: 'Cura Ferite' },
        ],
      },
    },
    escapeAttr: escapeHtml,
    escapeHtml,
    findDiceFormulas,
    formatDiceFormula,
    formatInline: (value) => escapeHtml(value),
    normalizeText,
  });

  const spellListHtml = renderer.renderSections('Incantesimi', [{
    titolo: 'Lista degli incantesimi da Chierico',
    righe: [
      { Livello: 'Trucchetto', Incantesimo: 'Luce', Scuola: 'Invocazione' },
      { Livello: '1', Incantesimo: 'Cura Ferite', Scuola: 'Evocazione' },
    ],
    colonne: ['Livello', 'Incantesimo', 'Scuola'],
  }]);

  assert.match(spellListHtml, /<h5>Trucchetti<\/h5>/);
  assert.match(spellListHtml, /<h5>1° livello<\/h5>/);
  assert.match(spellListHtml, /class="data-table data-table-matrix data-table-spell-list"/);
  assert.match(spellListHtml, /href="#\/spells\/luce"/);
  assert.doesNotMatch(spellListHtml, /scope="col">Livello<\/th>/);

  const tableHtml = renderer.renderSections('Tabella', [{
    titolo: 'Effetti',
    righe: [
      { chiave: '1', valore: 'Un effetto testuale molto lungo che deve andare a capo' },
      { chiave: '2', valore: { percezione_passiva: 20, scurovisione: '36 m' } },
    ],
  }]);

  assert.match(tableHtml, /data-table-key-value/);
  assert.match(tableHtml, /class="data-table-cell-wrap"/);
  assert.match(tableHtml, /Percezione passiva 20, scurovisione 36 m/);
  assert.doesNotMatch(tableHtml, /\[object Object\]/);

  const scalingHtml = renderer.renderScalingEntries('A livelli superiori', [{
    descrizione: 'Il danno aumenta di 1d6 per ogni slot oltre il 1°.',
  }], {
    descrizione: 'Una creatura subisce 2d6 danni.',
  });

  assert.match(scalingHtml, /data-scaling-roll="3d6"/);
  assert.match(scalingHtml, /data-scaling-roll="6d6"/);
  assert.match(scalingHtml, /aria-label="Tira 3d6 con slot \+1"/);

  console.log('Renderer sezioni reference OK');
})();
