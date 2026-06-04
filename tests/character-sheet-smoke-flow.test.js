const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

(async () => {
  const actionsUrl = pathToFileURL(`${process.cwd()}/assets/js/features/character-sheet/character-sheet-actions.js`).href;
  const classesUrl = pathToFileURL(`${process.cwd()}/assets/js/features/character-sheet/character-sheet-classes.js`).href;
  const derivedUrl = pathToFileURL(`${process.cwd()}/assets/js/features/character-sheet/character-sheet-derived.js`).href;
  const normalizersUrl = pathToFileURL(`${process.cwd()}/assets/js/features/character-sheet/character-sheet-normalizers.js`).href;
  const selectorsUrl = pathToFileURL(`${process.cwd()}/assets/js/features/character-sheet/character-sheet-selectors.js`).href;
  const viewUrl = pathToFileURL(`${process.cwd()}/assets/js/features/character-sheet/character-sheet-view.js`).href;

  const { createCharacterSheetActionsController } = await import(actionsUrl);
  const { createCharacterSheetClassController } = await import(classesUrl);
  const { createCharacterSheetDerivedModel } = await import(derivedUrl);
  const { normalizeCharacterSheet, normalizeLegacyResources } = await import(normalizersUrl);
  const { abilityModifier } = await import(selectorsUrl);
  const { ABILITY_META, SKILL_META } = await import(viewUrl);

  let saveCount = 0;
  const wizard = {
    id: 'mago',
    nome: 'Classe: Mago',
    sezioni: [
      {
        titolo: 'Tratti di classe',
        righe: [
          { Voce: 'Caratteristica primaria', Riepilogo: 'Intelligenza.' },
          { Voce: 'Dado Vita', Riepilogo: 'D6 per ogni livello da mago.' },
          { Voce: 'Tiri salvezza', Riepilogo: 'Intelligenza e Saggezza.' },
          { Voce: 'Abilita', Riepilogo: 'Due a scelta tra Arcano, Indagare, Natura, Religione o Storia.' },
          { Voce: 'Equipaggiamento iniziale', Riepilogo: 'A: pugnale e dotazione da studioso; oppure B: 55 mo.' },
        ],
      },
      {
        titolo: 'Progressione di classe',
        righe: [
          { Livello: 3, 'Bonus di competenza': '+2', 'Privilegi di classe': 'Tradizione Arcana' },
        ],
      },
    ],
  };
  const appState = {
    data: {
      classes: [wizard],
      species: [{ id: 'elfo', nome: 'Elfo', velocita: '9 m', tipo_creatura: 'Umanoide', taglia: 'Media' }],
      backgrounds: [
        {
          id: 'accolito',
          nome: 'Accolito',
          talento_origine: 'Iniziato alla magia',
          punteggi_caratteristica: ['Intelligenza', 'Saggezza', 'Carisma'],
          competenze: { abilita: ['Intuizione', 'Religione'], strumenti: 'scorte da calligrafo.' },
          equipaggiamento_alternativo: '50 mo',
        },
      ],
      feats: [{ id: 'iniziato_alla_magia', nome: 'Iniziato alla magia', categoria: 'Origini' }],
      equipment: [
        { id: 'pugnale', nome: 'Pugnale', tipo: 'arma', categoria: 'Mischia semplice', danni: '1d4 perforanti' },
        { id: 'cuoio', nome: 'Armatura di cuoio', tipo: 'armatura', categoria: 'Armature leggere', classe_armatura: '11 + Des' },
        { id: 'scudo', nome: 'Scudo', tipo: 'scudo', categoria: 'Scudo', classe_armatura: '+2' },
      ],
    },
    characterSheet: normalizeCharacterSheet({
      id: 'smoke',
      name: 'Mago Smoke',
      level: 3,
      abilities: { str: 8, dex: 14, con: 12, int: 16, wis: 13, cha: 10 },
    }),
  };

  const classController = createCharacterSheetClassController({
    appState,
    abilityMeta: ABILITY_META,
    skillMeta: SKILL_META,
    escapeHtml: (value) => String(value),
    normalizeLegacyResources,
    normalizeText,
    characterLevel: () => appState.characterSheet.level,
  });
  const actions = createCharacterSheetActionsController({
    appState,
    normalizeText,
    saveCharacterSheet: () => { saveCount += 1; },
  });
  const derived = createCharacterSheetDerivedModel({
    appState,
    abilityModifier,
    abilityMeta: ABILITY_META,
    skillMeta: SKILL_META,
    classSkillOptions: classController.classSkillOptions,
    classSkillChoiceCount: classController.classSkillChoiceCount,
    characterClassEntry: () => appState.data.classes.find((entry) => entry.id === appState.characterSheet.classId),
    classTraitsMap: classController.classTraitsMap,
  });

  classController.applyClassToCharacterSheet(wizard);
  actions.applySpeciesToCharacterSheet(appState.data.species[0]);
  actions.applyBackgroundToCharacterSheet(appState.data.backgrounds[0]);
  appState.characterSheet.skillProficiencies.arcana = 1;
  appState.characterSheet.skillProficiencies.history = 1;
  actions.addEquipmentItemToCharacterSheet(appState.data.equipment[0]);
  actions.addEquipmentItemToCharacterSheet(appState.data.equipment[1]);
  actions.addEquipmentItemToCharacterSheet(appState.data.equipment[2]);
  appState.characterSheet.equipmentItems = appState.characterSheet.equipmentItems.map((item) => ({
    ...item,
    equipped: item.name === 'Armatura di cuoio' || item.name === 'Scudo',
  }));

  assert.ok(saveCount > 0);
  assert.equal(appState.characterSheet.classId, 'mago');
  assert.equal(appState.characterSheet.ancestry, 'Elfo');
  assert.equal(appState.characterSheet.background, 'Accolito');
  assert.equal(appState.characterSheet.speed, 9);
  assert.equal(appState.characterSheet.hitDice, '1d6');
  assert.equal(appState.characterSheet.spellcastingAbility, 'int');
  assert.equal(appState.characterSheet.skillProficiencies.insight, 1);
  assert.equal(appState.characterSheet.skillProficiencies.religion, 1);
  assert.equal(derived.characterSkillChoiceState().complete, true);
  assert.equal(derived.characterSuggestedHitPoints(), 17);
  assert.equal(derived.characterSuggestedArmorClass(), 15);
  assert.equal(derived.characterArmorLoadout().shieldBonus, 2);
  assert.ok(appState.characterSheet.attacks.some((attack) => attack.name === 'Pugnale'));
  assert.ok(appState.characterSheet.references.some((entry) => entry.section === 'classes' && entry.id === 'mago'));
  assert.ok(appState.characterSheet.references.some((entry) => entry.section === 'species' && entry.id === 'elfo'));
  assert.ok(appState.characterSheet.references.some((entry) => entry.section === 'backgrounds' && entry.id === 'accolito'));
  assert.ok(appState.characterSheet.references.some((entry) => entry.section === 'feats' && entry.id === 'iniziato_alla_magia'));
  assert.equal(derived.characterBuilderChecklist().find((item) => item.label === 'Competenze').complete, true);
  assert.equal(derived.characterBuilderChecklist().find((item) => item.label === 'Equipaggiamento').complete, true);

  console.log('Smoke flow scheda personaggio OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
