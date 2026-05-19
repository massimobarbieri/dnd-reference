const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

(async () => {
  const selectorsUrl = pathToFileURL(`${process.cwd()}/assets/js/features/character-sheet/character-sheet-selectors.js`).href;
  const {
    abilityModifier,
    cleanClassName,
    createCharacterSheetSelectors,
    formatSigned,
    proficiencyBonusForLevel,
    rollFormula,
    spellLevel,
  } = await import(selectorsUrl);

  assert.equal(cleanClassName('Classe: Mago'), 'Mago');
  assert.equal(cleanClassName('Ranger'), 'Ranger');
  assert.equal(abilityModifier(8), -1);
  assert.equal(abilityModifier(18), 4);
  assert.equal(formatSigned(3), '+3');
  assert.equal(formatSigned(-2), '-2');
  assert.equal(rollFormula(20, 0), '1d20');
  assert.equal(rollFormula(20, -1), '1d20 - 1');
  assert.equal(proficiencyBonusForLevel(1), 2);
  assert.equal(proficiencyBonusForLevel(9), 4);
  assert.equal(proficiencyBonusForLevel(20), 6);
  assert.equal(spellLevel({ livello: 0 }), 'Trucchetto');
  assert.equal(spellLevel({ livello: 3 }), '3° livello');
  assert.equal(spellLevel({ livello: null }), '');

  const appState = {
    data: {
      classes: [
        { id: 'mago', nome: 'Classe: Mago' },
        { id: 'chierico', nome: 'Classe: Chierico' },
      ],
      spells: [
        { id: 'dardo', nome: 'Dardo Incantato', livello: 1, scuola: 'Invocazione', classi: ['mago'] },
        { id: 'luce', nome: 'Luce', livello: 0, scuola: 'Invocazione', classi: ['mago', 'chierico'] },
        { id: 'cura', nome: 'Cura Ferite', livello: 1, scuola: 'Evocazione', classi: ['chierico'] },
      ],
      rules_glossary: [
        { id: 'prono', nome: 'Prono', descrittore: 'condizione' },
        { id: 'azione', nome: 'Azione', descrittore: 'regola' },
        { id: 'afferrato', nome: 'Afferrato', descrittore: 'condizione' },
      ],
    },
    characterSheet: {
      classId: 'mago',
      level: 9,
      abilities: {
        str: 10,
        dex: 14,
        int: 18,
      },
    },
  };

  const selectors = createCharacterSheetSelectors({
    appState,
    abilityMeta: [
      ['str', 'Forza'],
      ['dex', 'Destrezza'],
      ['int', 'Intelligenza'],
    ],
    normalizeText,
    classProgressionRow: () => ({
      Livello: '9',
      'Slot 1': '4',
      'Slot 2': '3',
      'Slot 3': '-',
      Privilegi: 'Test',
    }),
  });

  assert.deepEqual(selectors.characterClassOptions(), [
    { value: '', label: 'Nessuna classe' },
    { value: 'mago', label: 'Mago' },
    { value: 'chierico', label: 'Chierico' },
  ]);
  assert.equal(selectors.characterClassEntry().id, 'mago');
  assert.equal(selectors.characterSheetClassName(), 'Mago');
  assert.equal(selectors.characterLevel(), 9);
  assert.equal(selectors.characterProficiencyBonus(), 4);
  assert.equal(selectors.skillProficiencyBonus(2), 8);
  assert.deepEqual(selectors.abilityOptions(), [
    { value: 'str', label: 'Forza' },
    { value: 'dex', label: 'Destrezza' },
    { value: 'int', label: 'Intelligenza' },
  ]);
  assert.deepEqual(
    selectors.characterConditionOptions().map((entry) => entry.id),
    ['afferrato', 'prono']
  );
  assert.deepEqual(selectors.characterSpellSlots(), [
    ['Slot 1', '4'],
    ['Slot 2', '3'],
  ]);
  assert.deepEqual(
    selectors.characterSpellOptions().map((spell) => spell.id),
    ['luce', 'dardo']
  );
  assert.equal(selectors.spellOptionLabel(appState.data.spells[0]), 'Dardo Incantato · 1° livello · Invocazione');
  assert.equal(selectors.characterAttackBonus({ ability: 'int', proficient: true, bonus: 1 }), 9);
  assert.equal(selectors.characterAttackBonus({ ability: 'cha', proficient: false, bonus: 2 }), 2);

  console.log('Selector scheda personaggio OK');
})();
