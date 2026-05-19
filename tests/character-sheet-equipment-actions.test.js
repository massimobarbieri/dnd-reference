const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

(async () => {
  const actionsUrl = pathToFileURL(`${process.cwd()}/assets/js/features/character-sheet/character-sheet-actions.js`).href;
  const { createCharacterSheetActionsController } = await import(actionsUrl);

  const appState = {
    characterSheet: {
      equipment: '',
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
  assert.match(appState.characterSheet.equipment, /\[SRD\] Pugnale/);
  assert.match(appState.characterSheet.equipment, /Costo: 2 mo/);
  assert.equal(appState.characterSheet.attacks.length, 1);
  assert.equal(appState.characterSheet.attacks[0].name, 'Pugnale');
  assert.equal(appState.characterSheet.attacks[0].damage, '1d4');
  assert.equal(appState.characterSheet.attacks[0].damageType, 'perforanti');

  actions.addEquipmentToCharacterSheet({ id: 'armi', nome: 'Armi' }, { Nome: 'Pugnale', Danni: '1d4 perforanti' }, 'Armi principali');
  assert.equal(appState.characterSheet.attacks.length, 1);

  console.log('Azioni equipaggiamento scheda OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
