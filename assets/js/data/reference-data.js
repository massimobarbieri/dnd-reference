import {
  normalizeArray,
  normalizeMagicItem,
  normalizeMonster,
} from './normalizers.js?v=20260519-origins';

import {
  fetchJson,
  fetchText,
  parseMonsterImages,
} from './loaders.js?v=20260519-origins';

/*
 * Carica in parallelo tutte le sorgenti dati del reference.
 * Restituisce i dati grezzi per tenere separati fetch e applicazione allo stato.
 */
export async function loadReferenceSources(paths) {
  const [monsters, spells, classes, species, backgrounds, magicItems, rules, rulesGlossary, monsterImageYaml] = await Promise.all([
    fetchJson(paths.monsters),
    fetchJson(paths.spells),
    paths.classes ? fetchJson(paths.classes) : Promise.resolve([]),
    paths.species ? fetchJson(paths.species) : Promise.resolve([]),
    paths.backgrounds ? fetchJson(paths.backgrounds) : Promise.resolve([]),
    fetchJson(paths.magic_items),
    fetchJson(paths.rules),
    fetchJson(paths.rules_glossary),
    fetchText(paths.monster_images).catch(() => ''),
  ]);

  return { monsters, spells, classes, species, backgrounds, magicItems, rules, rulesGlossary, monsterImageYaml };
}

/*
 * Normalizza le sorgenti e le applica allo stato globale dell'app.
 */
export function applyReferenceSources(appState, sources) {
  const { monsters, spells, classes, species, backgrounds, magicItems, rules, rulesGlossary, monsterImageYaml } = sources;

  appState.data.monsters = normalizeArray(monsters).map(normalizeMonster);
  appState.data.spells = normalizeArray(spells);
  appState.data.magic_items = normalizeArray(magicItems).map(normalizeMagicItem);
  appState.data.classes = normalizeArray(classes);
  appState.data.species = normalizeArray(species);
  appState.data.backgrounds = normalizeArray(backgrounds);
  appState.data.rules = normalizeArray(rules);
  appState.data.rules_glossary = normalizeArray(rulesGlossary);
  appState.monsterImages = parseMonsterImages(monsterImageYaml);
}
