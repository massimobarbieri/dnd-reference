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
  'const CHARACTER_SHEET_SCHEMA_VERSION = 5;',
  'const SKILL_META = [',
  'schemaVersion: CHARACTER_SHEET_SCHEMA_VERSION',
  'function migrateCharacterSheet(value)',
  'function normalizeLegacyMagicItems(items)',
  'function normalizeLegacyAttacks(attacks)',
  'function normalizeIdList(value)',
  'function normalizeSkillProficiencies(value)',
  'function normalizeProficiencies(value)',
  'function renderCharacterSheet(tab =',
  'function renderSkillProficiencies()',
  'function renderClassSkillSuggestions()',
  'function renderSkillControl(key, label, ability)',
  'function renderOtherProficiencies()',
  'function sheetProficiencyTextArea(key, label, placeholder, value)',
  'function renderCharacterAttacks()',
  'function renderCharacterAttack(attack)',
  'function renderCharacterSheetSpells()',
  'function renderCharacterSpellSlots()',
  'function renderCharacterSheetMagicItems()',
  'function renderCharacterAttunementSummary()',
  'function renderCharacterClassProgression()',
  'function classProgressionRow(classEntry, level)',
  'function exportCharacterSheet()',
  'function importCharacterSheet(event)',
  'function renderSheetActions(section, item)',
  'function addSpellToCharacterSheet(id)',
  'function addMagicItemToCharacterSheet(item)',
  'function magicItemRequiresAttunement(entry, source)',
  'function applyClassToCharacterSheet(classEntry)',
  'function classTraitsMap(classEntry)',
  'function classHitDice(value)',
  'function classSavingThrows(value)',
  'function classSkillSuggestion(classEntry, value)',
  'function classSkillOptions(classEntry)',
  'function mergeSheetNote(current, note)',
  'function characterAttackBonus(attack)',
  'function characterSpellSlots()',
  'function skillProficiencyBonus(rank)',
  'function classDefaultSpellcastingAbility(classId)',
  'skillProficiencies: Object.fromEntries(SKILL_META.map(([key]) => [key, 0]))',
  'proficiencies: {',
  'attacks: []',
  'magicItems: []',
  'attunedMagicItems: []',
  'data-sheet-add-attack',
  'data-sheet-remove-attack',
  'data-sheet-skill',
  'data-sheet-suggest-skill',
  'data-sheet-proficiency',
  'data-sheet-use-class',
  'data-sheet-add-detail-spell',
  'data-sheet-add-magic-item',
  'data-sheet-remove-magic-item',
  'data-sheet-toggle-attunement',
  'data-sheet-add-spell',
  'data-dice-roll="${escapeAttr(rollFormula(20, modifier))}"',
].forEach((token) => assert.ok(appSource.includes(token), `${token} deve essere presente in app.js`));

[
  '.character-sheet',
  '.sheet-tabs',
  '.sheet-actions',
  '.skill-grid',
  '.skill-suggestions',
  '.skill-control',
  '.sheet-proficiency-grid',
  '.sheet-attack-form',
  '.sheet-attack',
  '.sheet-attunement',
  '.sheet-item-actions',
  '.sheet-slot-grid',
  '.sheet-slot',
  '.ability-grid',
  '.sheet-class-summary',
  '.sheet-chip-list',
  '.prepared-spell',
  '.sheet-item',
  'scroll-snap-type: x proximity',
  'font-size: 16px',
].forEach((token) => assert.ok(cssSource.includes(token), `${token} deve essere presente nel CSS`));

assert.match(configSource, /character_sheet: Scheda/);
assert.match(indexSource, /20260514-character-sheet-skill-suggestions/);
assert.doesNotMatch(appSource, /localStorage\.setItem\('dnd5'/);
assert.doesNotMatch(appSource, /localStorage\.setItem\('dnd-theme'/);

console.log('Scheda personaggio OK');
