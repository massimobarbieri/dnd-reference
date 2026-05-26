const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

(async () => {
  const derivedUrl = pathToFileURL(`${process.cwd()}/assets/js/features/character-sheet/character-sheet-derived.js`).href;
  const { createCharacterSheetDerivedModel } = await import(derivedUrl);

  const appState = {
    data: {
      backgrounds: [
        {
          id: 'accolito',
          nome: 'Accolito',
          talento_origine: 'Iniziato alla magia (chierico)',
          competenze: { abilita: ['Intuizione', 'Religione'] },
        },
      ],
      species: [{ id: 'elfo', nome: 'Elfo' }],
      feats: [{ id: 'iniziato_alla_magia', nome: 'Iniziato alla magia' }],
    },
    characterSheet: {
      name: 'Derivato',
      classId: 'mago',
      ancestry: 'elfo',
      background: 'Accolito',
      abilities: { str: 10, dex: 14, con: 10, int: 16, wis: 10, cha: 10 },
      skillProficiencies: {
        arcana: 1,
        history: 0,
        insight: 1,
        religion: 1,
      },
      maxHp: 8,
      armorClass: 12,
      equipmentItems: [{ name: 'Pugnale' }],
      magicItems: [],
      equipment: '',
      references: [{}, {}, {}],
    },
  };
  const classEntry = { id: 'mago', nome: 'Classe: Mago' };

  const derived = createCharacterSheetDerivedModel({
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
      ['arcana', 'Arcano'],
      ['history', 'Storia'],
      ['insight', 'Intuizione'],
      ['religion', 'Religione'],
    ],
    classSkillOptions: () => [['arcana', 'Arcano'], ['history', 'Storia'], ['religion', 'Religione']],
    classSkillChoiceCount: () => 1,
    characterClassEntry: () => classEntry,
    classTraitsMap: () => ({ 'Dado Vita': 'D6', 'Caratteristica primaria': 'Intelligenza' }),
  });

  assert.equal(derived.characterBackgroundEntry().id, 'accolito');
  assert.equal(derived.characterSpeciesEntry().id, 'elfo');
  assert.equal(derived.characterOriginFeat().id, 'iniziato_alla_magia');
  assert.deepEqual(derived.characterBackgroundSkills(), ['insight', 'religion']);
  assert.deepEqual(derived.skillSources('religion'), ['Background', 'Classe']);
  assert.equal(derived.characterSkillChoiceProgress().complete, true);
  assert.equal(derived.characterBuilderChecklist().every((item) => item.complete), true);
  assert.deepEqual(derived.selectedClassTraits(), { 'Dado Vita': 'D6', 'Caratteristica primaria': 'Intelligenza' });

  console.log('Modello derivato scheda personaggio OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
