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
          punteggi_caratteristica: ['Intelligenza', 'Saggezza', 'Carisma'],
          equipaggiamento_alternativo: '50 mo',
        },
      ],
      species: [{ id: 'elfo', nome: 'Elfo', taglia: 'Media' }],
      feats: [{ id: 'iniziato_alla_magia', nome: 'Iniziato alla magia' }],
    },
    characterSheet: {
      name: 'Derivato',
      classId: 'mago',
      ancestry: 'elfo',
      background: 'Accolito',
      level: 3,
      hitDice: '1d6',
      initiativeBonus: 1,
      abilities: { str: 10, dex: 14, con: 10, int: 16, wis: 10, cha: 10 },
      skillProficiencies: {
        arcana: 1,
        history: 0,
        insight: 1,
        religion: 1,
      },
      maxHp: 8,
      armorClass: 12,
      equipmentItems: [
        { name: 'Pugnale', quantity: 2, weight: '0,5 kg' },
        { name: 'Armatura di cuoio', quantity: 1, weight: '5 kg', armorClass: '11 + Des', equipped: true },
        { name: 'Oggetto strano', quantity: 1, weight: 'variabile' },
      ],
      coins: { pp: 0, mo: 50, ma: 25, mr: 0 },
      magicItems: [],
      equipment: 'Importato equipaggiamento iniziale: Classe opzione A',
      references: [{}, {}, {}],
    },
  };
  const classEntry = {
    id: 'mago',
    nome: 'Classe: Mago',
    sezioni: [
      {
        titolo: 'Tratti di classe',
        righe: [
          { Voce: 'Equipaggiamento iniziale', Riepilogo: 'A: pugnale; oppure B: 55 mo.' },
        ],
      },
    ],
  };

  const derived = createCharacterSheetDerivedModel({
    appState,
    abilityModifier: (score) => Math.floor(((Number(score) || 10) - 10) / 2),
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
  assert.equal(derived.characterSkillChoiceState().required, 1);
  assert.equal(derived.characterSkillChoiceState().selected, 1);
  assert.deepEqual(derived.characterSkillChoiceState().missingBackgroundKeys, []);
  assert.equal(derived.characterSkillChoiceState().classOptions.find((option) => option.key === 'history').disabled, true);
  assert.ok(derived.characterBuilderIssues().some((issue) => issue.label === 'Punti ferita'));
  assert.equal(derived.characterBuilderChecklist().every((item) => item.complete), true);
  assert.equal(derived.characterInitiative(), 3);
  assert.equal(derived.characterSuggestedHitPoints(), 14);
  assert.equal(derived.characterSuggestedArmorClass(), 13);
  assert.deepEqual(derived.characterCarryingLoad(), {
    total: 6.75,
    itemWeight: 6,
    coinWeight: 0.75,
    capacity: 75,
    pushDragLift: 150,
    percent: 9,
    unknownItems: 1,
    state: 'ok',
    size: 'Media',
  });
  assert.equal(derived.armorClassFromEquipment({ armorClass: '14 + Des (max 2)' }), 16);
  assert.equal(derived.classStartingEquipmentText(), 'A: pugnale; oppure B: 55 mo');
  assert.deepEqual(derived.classStartingEquipmentOptions().map((option) => [option.key, option.imported]), [['class-a', true], ['class-b', false]]);
  assert.equal(derived.backgroundStartingCoinsText(), '50 mo');
  assert.equal(derived.backgroundStartingCoinsOption().imported, false);
  assert.equal(derived.startingEquipmentOptionText(derived.classStartingEquipmentText(), 'class-b'), '55 mo');
  assert.deepEqual(derived.characterAbilityGuidance().map((ability) => [ability.key, ability.sources]), [
    ['int', ['Classe', 'Background']],
    ['cha', ['Background']],
    ['wis', ['Background']],
  ]);
  assert.deepEqual(derived.selectedClassTraits(), { 'Dado Vita': 'D6', 'Caratteristica primaria': 'Intelligenza' });

  console.log('Modello derivato scheda personaggio OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
