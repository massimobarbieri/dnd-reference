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
    ancestry: 'Elfo',
    background: 'Accolito',
    spellcastingAbility: 'int',
    preparedSpells: ['magic-missile'],
    magicItems: [{ id: 'wand', name: 'Bacchetta', summary: 'rara · richiede sintonia' }],
    references: [{ section: 'rules', id: 'cover', name: 'Copertura', summary: 'Combattimento' }],
    equipmentItems: [{ id: 'eq-armor', name: 'Armatura di cuoio', quantity: 1, armorClass: '11 + Des', source: 'Armature' }],
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
  api.appState.data.rules = [
    { id: 'cover', nome: 'Copertura', categoria: 'Combattimento' },
  ];
  api.appState.data.species = [
    { id: 'elfo', nome: 'Elfo', tipo_creatura: 'Umanoide', taglia: 'Media', velocita: '9 m', tratti_sintesi: 'scurovisione e retaggio fatato' },
  ];
  api.appState.data.backgrounds = [
    {
      id: 'accolito',
      nome: 'Accolito',
      punteggi_caratteristica: ['Intelligenza', 'Saggezza', 'Carisma'],
      talento_origine: 'Iniziato alla magia',
      competenze: {
        abilita: ['Intuizione', 'Religione'],
        strumenti: 'scorte da calligrafo.',
      },
      equipaggiamento_alternativo: '50 mo',
    },
  ];
  api.appState.data.feats = [
    { id: 'iniziato_alla_magia', nome: 'Iniziato alla magia', categoria: 'Origini' },
  ];
  api.appState.data.classes = [
    {
      id: 'wizard',
      nome: 'Classe: Mago',
      sezioni: [
        {
          titolo: 'Tratti di classe',
          righe: [
            { Voce: 'Caratteristica primaria', Riepilogo: 'Intelligenza.' },
            { Voce: 'Dado Vita', Riepilogo: 'D6 per ogni livello da mago.' },
            { Voce: 'Tiri salvezza', Riepilogo: 'Intelligenza e Saggezza.' },
            { Voce: 'Abilita', Riepilogo: 'Due a scelta tra Arcano, Indagare, Medicina, Natura, Religione o Storia.' },
            { Voce: 'Equipaggiamento iniziale', Riepilogo: 'A: pugnale e dotazione da studioso; oppure B: 55 mo.' },
          ],
        },
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

  context.location.hash = '#/character_sheet';
  api.renderRoute();
  assert.equal(context.location.hash, '#/character_sheet/overview');

  api.renderCharacterSheet('overview');
  assert.match(views['#detail-view'].innerHTML, /data-sheet-field="name"/);
  assert.match(views['#detail-view'].innerHTML, /<option value="elfo" selected>Elfo<\/option>/);
  assert.match(views['#detail-view'].innerHTML, /<option value="accolito" selected>Accolito<\/option>/);
  assert.match(views['#detail-view'].innerHTML, /Talento origine/);
  assert.match(views['#detail-view'].innerHTML, /Talento: Iniziato alla magia/);
  assert.match(views['#detail-view'].innerHTML, /Percorso guidato/);
  assert.match(views['#detail-view'].innerHTML, /D6 per ogni livello da mago/);
  assert.match(views['#detail-view'].innerHTML, /scurovisione e retaggio fatato/);
  assert.match(views['#detail-view'].innerHTML, /Intelligenza, Saggezza, Carisma/);
  assert.match(views['#detail-view'].innerHTML, /Priorita consigliate/);
  assert.match(views['#detail-view'].innerHTML, /Intelligenza · Classe · Background/);
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
  assert.match(views['#detail-view'].innerHTML, /Equipaggiamento iniziale/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-apply-starting-equipment="class-a"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-apply-starting-equipment="background-coins"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-coin="mo"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-add-equipment/);
  assert.match(views['#detail-view'].innerHTML, /Armatura di cuoio/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-apply-armor="eq-armor"/);
  assert.match(views['#detail-view'].innerHTML, /Bacchetta/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-toggle-attunement="wand"/);

  api.renderCharacterSheet('notes');
  assert.match(views['#detail-view'].innerHTML, /Riferimenti SRD/);
  assert.match(views['#detail-view'].innerHTML, /href="#\/rules\/cover"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-remove-reference="cover"/);

  console.log('Renderer scheda personaggio OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
