const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

(async () => {
  const classesUrl = pathToFileURL(`${process.cwd()}/assets/js/features/character-sheet/character-sheet-classes.js`).href;
  const normalizersUrl = pathToFileURL(`${process.cwd()}/assets/js/features/character-sheet/character-sheet-normalizers.js`).href;
  const { createCharacterSheetClassController } = await import(classesUrl);
  const { normalizeLegacyResources } = await import(normalizersUrl);

  const appState = {
    data: { classes: [] },
    characterSheet: {
      classId: '',
      level: 1,
      hitDice: '1d8',
      spellcastingAbility: 'int',
      savingThrows: {
        str: false,
        dex: false,
        con: false,
        int: false,
        wis: false,
        cha: false,
      },
      proficiencies: {
        weapons: '',
        armor: '',
        tools: '',
        languages: '',
      },
      resources: [],
      references: [],
      notes: '',
    },
  };

  const barbarian = {
    id: 'barbaro',
    nome: 'Barbaro',
    sezioni: [
      {
        titolo: 'Tratti di classe',
        righe: [
          { Voce: 'Caratteristica primaria', Riepilogo: 'Forza.' },
          { Voce: 'Dado Vita', Riepilogo: 'D12 per ogni livello da barbaro.' },
          { Voce: 'Tiri salvezza', Riepilogo: 'Forza e Costituzione.' },
          { Voce: 'Abilita', Riepilogo: 'Due a scelta tra Atletica o Percezione.' },
          { Voce: 'Armi', Riepilogo: 'Armi semplici e da guerra.' },
          { Voce: 'Armature', Riepilogo: 'Armature leggere e medie; scudi.' },
        ],
      },
      {
        titolo: 'Progressione di classe',
        righe: [
          { Livello: 1, 'Bonus di competenza': '+2', 'Privilegi di classe': 'Ira', Ire: '2' },
        ],
      },
    ],
  };

  appState.data.classes = [barbarian];

  const controller = createCharacterSheetClassController({
    appState,
    abilityMeta: [
      ['str', 'Forza'],
      ['dex', 'Destrezza'],
      ['con', 'Costituzione'],
      ['int', 'Intelligenza'],
      ['wis', 'Saggezza'],
      ['cha', 'Carisma'],
    ],
    skillMeta: [
      ['athletics', 'Atletica'],
      ['perception', 'Percezione'],
      ['arcana', 'Arcano'],
    ],
    escapeHtml: (value) => String(value),
    normalizeLegacyResources,
    normalizeText,
    characterLevel: () => appState.characterSheet.level,
  });

  controller.applyClassToCharacterSheet(barbarian);

  assert.equal(appState.characterSheet.classId, 'barbaro');
  assert.equal(appState.characterSheet.hitDice, '1d12');
  assert.equal(appState.characterSheet.savingThrows.str, true);
  assert.equal(appState.characterSheet.savingThrows.con, true);
  assert.equal(appState.characterSheet.savingThrows.dex, false);
  assert.equal(appState.characterSheet.proficiencies.weapons, 'Armi semplici e da guerra');
  assert.equal(appState.characterSheet.proficiencies.armor, 'Armature leggere e medie; scudi');
  assert.ok(appState.characterSheet.resources.some((resource) => resource.name === 'Ira' && resource.max === 2));
  assert.ok(appState.characterSheet.references.some((entry) => entry.section === 'classes' && entry.id === 'barbaro'));
  assert.deepEqual(controller.classSkillOptions(barbarian), [
    ['athletics', 'Atletica'],
    ['perception', 'Percezione'],
  ]);
  assert.equal(controller.classSkillChoiceCount(barbarian), 2);

  controller.applyClassToCharacterSheet(barbarian);
  assert.equal(appState.characterSheet.references.filter((entry) => entry.section === 'classes' && entry.id === 'barbaro').length, 1);

  console.log('Azioni classe scheda OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
