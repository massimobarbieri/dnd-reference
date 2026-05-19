const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

(async () => {
  const catalogUrl = pathToFileURL(`${process.cwd()}/assets/js/catalog.js`).href;
  const {
    challengeRatingValue,
    createFilterOptions,
    filterCatalogItems,
    searchableText,
    sectionSummaryLine,
    sortItems,
    sourcePageValue,
  } = await import(catalogUrl);

  assert.equal(challengeRatingValue('1/2'), 0.5);
  assert.equal(challengeRatingValue('12'), 12);
  assert.equal(sourcePageValue('pag. 18-19'), 18);
  assert.equal(sourcePageValue(''), Number.POSITIVE_INFINITY);

  assert.deepEqual(
    [
      { nome: 'B', pagine_sorgente: '9' },
      { nome: 'A', pagine_sorgente: '2' },
    ].sort((a, b) => sortItems('rules', a, b)).map((item) => item.nome),
    ['A', 'B']
  );

  const data = {
    monsters: [
      { id: 'drago', nome: 'Drago', tipo: 'drago', dimensione: 'Grande', grado_sfida: { valore: '1/2', raw: '1/2 (PE 100)' } },
      { id: 'zombi', nome: 'Zombi', tipo: 'non morto', dimensione: 'Media', grado_sfida: '2' },
    ],
    spells: [
      { id: 'luce', nome: 'Luce', livello: 0, scuola: 'Invocazione', classi: ['mago'] },
      { id: 'cura', nome: 'Cura Ferite', livello: 1, scuola: 'Abiurazione', classi: ['chierico'] },
    ],
    rules: [
      { id: 'azione', nome: 'Azione', categoria: 'Combattimento' },
    ],
    rules_glossary: [
      { id: 'prono', nome: 'Prono', descrittore: 'condizione' },
    ],
    magic_items: [
      { id: 'anello', nome: 'Anello', rarita: 'raro' },
    ],
  };

  assert.deepEqual(
    createFilterOptions('monsters', data, () => '').map((option) => option.value),
    ['1/2', '2']
  );

  assert.deepEqual(
    createFilterOptions('spells', data, (spell) => spell.livello === 0 ? 'Trucchetto' : `${spell.livello}° livello`),
    [
      { value: '0', label: 'Trucchetto' },
      { value: '1', label: '1° livello' },
    ]
  );

  assert.deepEqual(
    filterCatalogItems({
      section: 'monsters',
      items: data.monsters,
      searchTerm: 'non morto',
      filter: '2',
      showOnlyFavorites: false,
      isFavorite: () => false,
    }).map((item) => item.id),
    ['zombi']
  );

  assert.deepEqual(
    filterCatalogItems({
      section: 'monsters',
      items: data.monsters,
      searchTerm: '',
      filter: '1/2',
      showOnlyFavorites: true,
      isFavorite: (_section, id) => id === 'drago',
    }).map((item) => item.id),
    ['drago']
  );

  assert.match(
    searchableText('rules_glossary', {
      nome: 'Afferrato',
      descrittore: 'condizione',
      vedi_anche: ['Velocita'],
      sezioni: [{ titolo: 'Effetti', righe: [{ chiave: 'Movimento', valore: '0' }] }],
    }),
    /Movimento 0/
  );

  assert.equal(
    sectionSummaryLine('magic_items', {
      tipo_base: 'Anello',
      rarita: 'raro',
      richiede_sintonia: true,
    }, () => ''),
    'Anello · raro · sintonia'
  );

  console.log('Catalogo reference OK');
})();
