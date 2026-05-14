const assert = require('node:assert/strict');
const fs = require('node:fs');

const appSource = fs.readFileSync('assets/js/app.js', 'utf8');
const cssSource = fs.readFileSync('assets/css/styles.css', 'utf8');
const configSource = fs.readFileSync('config.yml', 'utf8');
const indexSource = fs.readFileSync('index.html', 'utf8');

[
  "character_sheet: []",
  "character_sheet: {",
  "type: 'tool'",
  "const CHARACTER_SHEET_STORAGE_KEY = 'dnd-reference:character-sheet';",
  'const CHARACTER_SHEET_SCHEMA_VERSION = 1;',
  'schemaVersion: CHARACTER_SHEET_SCHEMA_VERSION',
  'function migrateCharacterSheet(value)',
  'function normalizeLegacyMagicItems(items)',
  'function renderCharacterSheet(tab =',
  'function renderCharacterSheetSpells()',
  'function renderCharacterSheetMagicItems()',
  'function renderCharacterClassProgression()',
  'function classProgressionRow(classEntry, level)',
  'function exportCharacterSheet()',
  'function importCharacterSheet(event)',
  'function renderSheetActions(section, item)',
  'function addSpellToCharacterSheet(id)',
  'function addMagicItemToCharacterSheet(item)',
  'function classDefaultSpellcastingAbility(classId)',
  'magicItems: []',
  'data-sheet-use-class',
  'data-sheet-add-detail-spell',
  'data-sheet-add-magic-item',
  'data-sheet-remove-magic-item',
  'data-sheet-add-spell',
  'data-dice-roll="${escapeAttr(rollFormula(20, modifier))}"',
].forEach((token) => assert.ok(appSource.includes(token), `${token} deve essere presente in app.js`));

[
  '.character-sheet',
  '.sheet-tabs',
  '.sheet-actions',
  '.ability-grid',
  '.sheet-class-summary',
  '.sheet-chip-list',
  '.prepared-spell',
  '.sheet-item',
  'scroll-snap-type: x proximity',
  'font-size: 16px',
].forEach((token) => assert.ok(cssSource.includes(token), `${token} deve essere presente nel CSS`));

assert.match(configSource, /character_sheet: Scheda/);
assert.match(indexSource, /20260514-character-sheet-mobile/);
assert.doesNotMatch(appSource, /localStorage\.setItem\('dnd5'/);
assert.doesNotMatch(appSource, /localStorage\.setItem\('dnd-theme'/);

console.log('Scheda personaggio OK');
