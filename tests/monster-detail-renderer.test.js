const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

(async () => {
  const rendererUrl = pathToFileURL(`${process.cwd()}/assets/js/reference-detail-renderer.js`).href;
  const { createReferenceDetailRenderer } = await import(rendererUrl);

  const renderDetail = createReferenceDetailRenderer({
    appState: {
      config: {
        site: {
          show_monster_images: true,
          image_fallback_text: 'Nessuna immagine',
        },
      },
      monsterImages: new Map([
        ['aboleth', { immagine: 'https://example.test/aboleth.webp' }],
      ]),
      data: { spells: [] },
    },
    analyzeRollContext: () => ({ notes: [] }),
    escapeAttr,
    escapeHtml,
    findDiceFormulas: () => [],
    formatDiceFormula: (count, faces) => `${count}d${faces}`,
    formatInline: escapeHtml,
    isFavorite: () => false,
    normalizeText: (value) => String(value || '').toLowerCase(),
    renderSheetActions: () => '',
    spellLevel: () => '',
  });

  const html = renderDetail('monsters', {
    id: 'aboleth',
    nome: 'Aboleth',
    tipo: 'Aberrazione',
    dimensione: 'Grande',
    allineamento: 'legale malvagio',
    statistiche: {
      classe_armatura: '17',
      punti_ferita: '150 (20d10 + 40)',
      velocita: '3 m, nuoto 12 m',
      iniziativa: '+7 (17)',
    },
    caratteristiche: {
      forza: { valore: 21, modificatore: '+5' },
    },
    grado_sfida: '10',
    grado_sfida_raw: '10 (PE 5.900; BC +4)',
    bonus_competenza: 4,
    sensi: 'Percezione passiva 20, scurovisione 36 m',
    lingue: 'Gergo delle Profondità, telepatia 36 m',
    abilita: 'Percezione +10',
  });

  assert.match(html, /GS:<\/b> 10 \(PE 5\.900; BC \+4\)/);
  assert.match(html, /Sensi:<\/b> Percezione passiva 20, scurovisione 36 m/);
  assert.match(html, /Lingue:<\/b> Gergo delle Profondità, telepatia 36 m/);
  assert.match(html, /Abilità:<\/b> Percezione \+10/);
  assert.match(html, /class="monster-image-link"/);
  assert.match(html, /href="https:\/\/example\.test\/aboleth\.webp"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /alt="Immagine di Aboleth"/);
  assert.doesNotMatch(html, /\[object Object\]/);

  const rawHtml = renderDetail('monsters', {
    id: 'aboleth',
    nome: 'Aboleth',
    tipo: 'Aberrazione',
    dimensione: 'Grande',
    classe_armatura: 17,
    punti_ferita: { media: 150, formula: '20d10 + 40' },
    velocita: { camminata: '3 m', nuoto: '12 m' },
    iniziativa: { valore: 17, bonus: 7 },
    caratteristiche: {
      forza: { punteggio: 21, modificatore: 5 },
    },
    grado_sfida: {
      valore: 10,
      raw: '10 (PE 5.900; BC +4)',
    },
    sensi: {
      percezione_passiva: 20,
      scurovisione: '36 m',
    },
    lingue: ['Gergo delle Profondità', 'telepatia 36 m'],
  });

  assert.match(rawHtml, /GS:<\/b> 10 \(PE 5\.900; BC \+4\)/);
  assert.match(rawHtml, /Sensi:<\/b> Percezione passiva 20, scurovisione 36 m/);
  assert.match(rawHtml, /<b>FOR<\/b>\s+21\s+<span>\(5\)<\/span>/);
  assert.doesNotMatch(rawHtml, /\[object Object\]/);

  console.log('Renderer dettaglio mostro OK');
})();

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
