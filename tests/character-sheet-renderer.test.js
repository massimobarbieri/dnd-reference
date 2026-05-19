const assert = require('node:assert/strict');
const { createAppTestContext, loadAppModule } = require('./helpers/app-module');

(async () => {
  const { views, context } = createAppTestContext();
  const api = await loadAppModule(context);
  const sheet = api.normalizeCharacterSheet({
    id: 'sheet-render',
    name: 'Renderer',
    level: 3,
    classId: 'wizard',
    spellcastingAbility: 'int',
    preparedSpells: ['magic-missile'],
    magicItems: [{ id: 'wand', name: 'Bacchetta', summary: 'rara · richiede sintonia' }],
  });

  api.appState.characterSheet = sheet;
  api.appState.characterSheets = [sheet];
  api.appState.activeCharacterSheetId = sheet.id;
  api.appState.data.spells = [
    { id: 'magic-missile', nome: 'Dardo Incantato', livello: 1, scuola: 'Invocazione', classi: ['mago'] },
  ];
  api.appState.data.magic_items = [
    { id: 'wand', nome: 'Bacchetta', rarita: 'rara', richiede_sintonia: true },
  ];
  api.appState.data.rules_glossary = [
    { id: 'prone', nome: 'Prono' },
  ];
  api.appState.data.classes = [
    {
      id: 'wizard',
      nome: 'Classe: Mago',
      sezioni: [
        {
          titolo: 'Progressione di classe',
          colonne: ['Livello', 'Bonus di competenza', 'Privilegi di classe'],
          righe: [
            { Livello: 3, 'Bonus di competenza': '+2', 'Privilegi di classe': 'Tradizione Arcana' },
            { Livello: 4, 'Bonus di competenza': '+2', 'Privilegi di classe': 'Miglioramento dei punteggi di caratteristica' },
          ],
        },
      ],
    },
  ];

  sheet.status.conditions = ['prone'];
  sheet.resources = [{ id: 'res-1', name: 'Azione Impetuosa', max: 1, used: 0, recovery: 'Riposo breve' }];
  sheet.attacks = [{ id: 'atk-1', name: 'Spada lunga', ability: 'str', proficient: true, bonus: 0, damage: '1d8', damageType: 'taglienti', notes: '' }];

  api.renderCharacterSheet('overview');
  assert.match(views['#detail-view'].innerHTML, /data-sheet-field="name"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-ability="str"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-skill="arcana"/);
  assert.match(views['#detail-view'].innerHTML, /Tradizione Arcana/);
  assert.match(views['#detail-view'].innerHTML, /Apri classe/);

  api.renderCharacterSheet('combat');
  assert.match(views['#detail-view'].innerHTML, /data-sheet-add-resource/);
  assert.match(views['#detail-view'].innerHTML, /Azione Impetuosa/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-add-attack/);
  assert.match(views['#detail-view'].innerHTML, /Spada lunga/);
  assert.match(views['#detail-view'].innerHTML, /Prono/);

  api.renderCharacterSheet('spells');
  assert.match(views['#detail-view'].innerHTML, /data-sheet-add-spell/);
  assert.match(views['#detail-view'].innerHTML, /Dardo Incantato/);
  assert.match(views['#detail-view'].innerHTML, /sheet-spell-slots/);

  api.renderCharacterSheet('inventory');
  assert.match(views['#detail-view'].innerHTML, /data-sheet-coin="mo"/);
  assert.match(views['#detail-view'].innerHTML, /Bacchetta/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-toggle-attunement="wand"/);

  console.log('Renderer scheda personaggio OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
