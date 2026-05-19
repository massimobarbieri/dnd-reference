const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

(async () => {
  const actionsUrl = pathToFileURL(`${process.cwd()}/assets/js/features/character-sheet/character-sheet-actions.js`).href;
  const { createCharacterSheetActionsController } = await import(actionsUrl);

  const appState = {
    characterSheet: {
      ancestry: '',
      background: '',
      speed: 9,
      skillProficiencies: {
        insight: 0,
        religion: 0,
      },
      proficiencies: {
        tools: '',
        languages: '',
      },
      equipment: '',
      equipmentItems: [],
      attacks: [],
      references: [],
      magicItems: [],
    },
  };
  let saveCount = 0;
  const actions = createCharacterSheetActionsController({
    appState,
    normalizeText: (value) => String(value || '').toLowerCase(),
    saveCharacterSheet: () => {
      saveCount += 1;
    },
  });

  const added = actions.addEquipmentToCharacterSheet(
    { id: 'armi', nome: 'Armi' },
    {
      Categoria: 'Mischia semplice',
      Nome: 'Pugnale',
      Danni: '1d4 perforanti',
      Proprietà: 'accurata, lancio 6/18, leggera',
      Padronanza: 'Graffio',
      Costo: '2 mo',
    },
    'Armi principali'
  );

  assert.equal(added, true);
  assert.equal(saveCount, 1);
  assert.equal(appState.characterSheet.equipmentItems.length, 1);
  assert.equal(appState.characterSheet.equipmentItems[0].name, 'Pugnale');
  assert.equal(appState.characterSheet.equipmentItems[0].cost, '2 mo');
  assert.match(appState.characterSheet.equipmentItems[0].notes, /Danni: 1d4 perforanti/);
  assert.equal(appState.characterSheet.attacks.length, 1);
  assert.equal(appState.characterSheet.attacks[0].name, 'Pugnale');
  assert.equal(appState.characterSheet.attacks[0].damage, '1d4');
  assert.equal(appState.characterSheet.attacks[0].damageType, 'perforanti');

  actions.addEquipmentToCharacterSheet({ id: 'armi', nome: 'Armi' }, { Nome: 'Pugnale', Danni: '1d4 perforanti' }, 'Armi principali');
  assert.equal(appState.characterSheet.equipmentItems.length, 1);
  assert.equal(appState.characterSheet.attacks.length, 1);

  actions.addEquipmentToCharacterSheet(
    { id: 'armature', nome: 'Armature' },
    {
      Armatura: 'Armatura di cuoio',
      'Classe Armatura': '11 + Des',
      Peso: '5 kg',
      Costo: '10 mo',
    },
    'Armature complete'
  );
  assert.equal(appState.characterSheet.equipmentItems.length, 2);
  assert.equal(appState.characterSheet.equipmentItems[1].armorClass, '11 + Des');
  assert.equal(appState.characterSheet.equipmentItems[1].weight, '5 kg');

  actions.applySpeciesToCharacterSheet({
    id: 'elfo',
    nome: 'Elfo',
    tipo_creatura: 'Umanoide',
    taglia: 'Media',
    velocita: '9 m',
  });
  assert.equal(appState.characterSheet.ancestry, 'Elfo');
  assert.equal(appState.characterSheet.speed, 9);
  assert.ok(appState.characterSheet.references.some((entry) => entry.section === 'species' && entry.id === 'elfo'));

  actions.applyBackgroundToCharacterSheet({
    id: 'accolito',
    nome: 'Accolito',
    punteggi_caratteristica: ['Intelligenza', 'Saggezza', 'Carisma'],
    talento_origine: 'Iniziato alla magia (chierico)',
    competenze: {
      abilita: ['Intuizione', 'Religione'],
      strumenti: 'scorte da calligrafo.',
    },
  });
  assert.equal(appState.characterSheet.background, 'Accolito');
  assert.equal(appState.characterSheet.skillProficiencies.insight, 1);
  assert.equal(appState.characterSheet.skillProficiencies.religion, 1);
  assert.equal(appState.characterSheet.proficiencies.tools, 'scorte da calligrafo.');
  assert.ok(appState.characterSheet.references.some((entry) => entry.section === 'backgrounds' && entry.id === 'accolito'));

  actions.addEquipmentItemToCharacterSheet({
    id: 'pugnale',
    nome: 'Pugnale',
    tipo: 'arma',
    categoria: 'Mischia semplice',
    danni: '1d4 perforanti',
    proprieta: ['accurata', 'leggera'],
    padronanza: 'Graffio',
    peso: '0,5 kg',
    costo: '2 mo',
    descrizione: 'Mischia semplice; danni 1d4 perforanti.',
  });
  assert.ok(appState.characterSheet.equipmentItems.some((entry) => entry.name === 'Pugnale'));
  assert.ok(appState.characterSheet.attacks.some((entry) => entry.name === 'Pugnale'));
  assert.ok(appState.characterSheet.references.some((entry) => entry.section === 'equipment' && entry.id === 'pugnale'));

  actions.applyLanguageToCharacterSheet({
    id: 'comune',
    nome: 'Comune',
    categoria: 'Standard',
  });
  assert.equal(appState.characterSheet.proficiencies.languages, 'Comune');
  assert.ok(appState.characterSheet.references.some((entry) => entry.section === 'languages' && entry.id === 'comune'));

  console.log('Azioni equipaggiamento scheda OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
