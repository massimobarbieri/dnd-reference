const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

(async () => {
  const rendererUrl = pathToFileURL(`${process.cwd()}/assets/js/reference-detail-renderer.js`).href;
  const { createReferenceDetailRenderer } = await import(rendererUrl);

  const renderDetail = createReferenceDetailRenderer({
    appState: {
      config: { site: {} },
      monsterImages: new Map(),
      data: { spells: [], rules_glossary: [] },
    },
    analyzeRollContext: () => ({ notes: [] }),
    escapeAttr,
    escapeHtml,
    findDiceFormulas: () => [],
    formatDiceFormula: (value) => value,
    formatInline: escapeHtml,
    isFavorite: () => false,
    normalizeText: (value) => String(value || '').toLowerCase(),
    renderSheetActions: () => '',
    spellLevel: () => '',
  });

  const html = renderDetail('rules', {
    id: 'armi',
    nome: 'Armi',
    capitolo: 'Equipaggiamento',
    categoria: 'Equipaggiamento',
    sezioni: [
      {
        titolo: 'Armi principali',
        righe: [
          {
            Categoria: 'Mischia semplice',
            Nome: 'Pugnale',
            Danni: '1d4 perforanti',
            Costo: '2 mo',
          },
        ],
      },
    ],
  });

  assert.match(html, /Aggiungi alla scheda/);
  assert.match(html, /data-sheet-add-equipment-row/);
  assert.match(html, /data-sheet-section-index="0"/);
  assert.match(html, /data-sheet-row-index="0"/);
  assert.match(html, /Pugnale/);

  console.log('Picker equipaggiamento scheda OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}
