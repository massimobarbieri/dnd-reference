const assert = require('node:assert/strict');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const {
  analyzeRollContext,
  findDiceFormulas,
  formatDiceFormula,
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

function escapeAttr(value) {
  return escapeHtml(value);
}

(async () => {
  const [
    { applyReferenceSources },
    { createInlineFormatter },
    { createReferenceDetailRenderer },
  ] = await Promise.all([
    import(pathToFileURL(`${process.cwd()}/assets/js/data/reference-data.js`).href),
    import(pathToFileURL(`${process.cwd()}/assets/js/inline-formatting.js`).href),
    import(pathToFileURL(`${process.cwd()}/assets/js/reference-detail-renderer.js`).href),
  ]);

  const rawSources = {
    monsters: readJson('srd_5_2_1_monsters.json'),
    spells: readJson('srd_5_2_1_spells.json'),
    classes: readJson('srd_5_2_1_classes.json'),
    species: readJson('srd_5_2_1_species.json'),
    backgrounds: readJson('srd_5_2_1_backgrounds.json'),
    magicItems: readJson('srd_5_2_1_magic_items.json'),
    rules: readJson('srd_5_2_1_rules.json'),
    rulesGlossary: readJson('srd_5_2_1_rules_glossary.json'),
    monsterImageYaml: fs.readFileSync('monster-images.yml', 'utf8'),
  };

  const appState = {
    config: {
      site: {
        show_monster_images: true,
        image_fallback_text: 'Immagine non disponibile',
      },
    },
    data: {
      monsters: [],
      spells: [],
      classes: [],
      species: [],
      backgrounds: [],
      character_sheet: [],
      magic_items: [],
      rules: [],
      rules_glossary: [],
    },
    monsterImages: new Map(),
    favorites: {},
  };

  applyReferenceSources(appState, rawSources);

  const normalizeText = (value) => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const renderDetail = createRenderer(appState);

  for (const section of ['monsters', 'spells', 'classes', 'species', 'backgrounds', 'magic_items', 'rules', 'rules_glossary']) {
    for (const item of appState.data[section]) {
      const html = renderDetail(section, item);
      assert.doesNotMatch(html, /\[object Object\]/, `${section}/${item.id} renderizza [object Object] dopo normalizzazione`);
    }
  }

  const rawAppState = {
    ...appState,
    data: {
      monsters: rawSources.monsters,
      spells: rawSources.spells,
      classes: rawSources.classes,
      species: rawSources.species,
      backgrounds: rawSources.backgrounds,
      character_sheet: [],
      magic_items: rawSources.magicItems,
      rules: rawSources.rules,
      rules_glossary: rawSources.rulesGlossary,
    },
  };
  const renderRawDetail = createRenderer(rawAppState);

  for (const section of ['monsters', 'spells', 'classes', 'species', 'backgrounds', 'magic_items', 'rules', 'rules_glossary']) {
    for (const item of rawAppState.data[section]) {
      const html = renderRawDetail(section, item);
      assert.doesNotMatch(html, /\[object Object\]/, `${section}/${item.id} renderizza [object Object] da JSON raw`);
    }
  }

  console.log('Rendering reference senza [object Object] OK');

  function createRenderer(state) {
    const formatInline = createInlineFormatter({
      appState: state,
      conditionAliases: {},
      escapeAttr,
      escapeHtml,
      escapeRegExp: (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      isLikelyTableDie,
      normalizeText,
      parseDiceFormula,
    });

    return createReferenceDetailRenderer({
      appState: state,
      analyzeRollContext,
      escapeAttr,
      escapeHtml,
      findDiceFormulas,
      formatDiceFormula,
      formatInline,
      isFavorite: () => false,
      normalizeText,
      renderSheetActions: () => '',
      spellLevel: (spell) => {
        if (spell.livello === 0) return 'Trucchetto';
        if (spell.livello === null || spell.livello === undefined) return '';
        return `${spell.livello}° livello`;
      },
    });
  }
})();

function readJson(file) {
  return JSON.parse(fs.readFileSync(`data/srd/5.2.1/json/${file}`, 'utf8'));
}
