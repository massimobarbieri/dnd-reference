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
    abilities: { con: 14, int: 16 },
    currentHp: 12,
    maxHp: 20,
    hitDice: '1d6',
    hitDiceUsed: 1,
    combatState: {
      round: 2,
      actionUsed: true,
      bonusActionUsed: false,
      reactionUsed: true,
      movementUsed: 3,
    },
    savingThrows: { con: true },
    status: {
      concentration: true,
      concentrationSpell: 'Benedizione',
      concentrationDc: 12,
      conditions: ['prone'],
    },
    activeEffects: [
      { id: 'effect-speed', name: 'Velocita', source: 'Incantesimo', duration: 'turns', remaining: 2, modifierTarget: 'armorClass', modifierValue: 2, notes: 'Azione extra limitata.' },
      { id: 'effect-bless', name: 'Benedizione', source: 'Incantesimo', duration: 'concentration', remaining: 0, modifierTarget: 'savingThrows', modifierValue: 1, modifierDice: '1d4', notes: '1d4 ai TS.' },
    ],
    spellcastingAbility: 'int',
    preparedSpells: ['magic-missile', 'fire-bolt'],
    magicItems: [{ id: 'wand', name: 'Bacchetta', summary: 'rara · richiede sintonia' }],
    references: [{ section: 'rules', id: 'cover', name: 'Copertura', summary: 'Combattimento' }],
    equipmentItems: [
      { id: 'eq-armor', name: 'Armatura di cuoio', quantity: 1, weight: '5 kg', armorClass: '11 + Des', source: 'Armature', equipped: true },
      { id: 'eq-shield', name: 'Scudo', quantity: 1, weight: '3 kg', armorClass: '+2', source: 'Armature', equipped: true },
    ],
    coins: { pp: 0, mo: 25, ma: 25, mr: 0 },
    hitPointLog: [{
      id: 'hp-1',
      action: 'damage',
      amount: 5,
      before: { currentHp: 20, tempHp: 2 },
      after: { currentHp: 17, tempHp: 0 },
      at: '2026-05-28T10:00:00.000Z',
      note: 'Concentrazione: TS Costituzione CD 10.',
    }, {
      id: 'hp-rest',
      action: 'longRest',
      amount: 1,
      before: { currentHp: 17, tempHp: 0, hitDiceUsed: 1 },
      after: { currentHp: 20, tempHp: 0, hitDiceUsed: 0 },
      at: '2026-05-28T11:00:00.000Z',
      note: 'Recuperato 1 dado vita.',
    }],
    sessionLog: [{
      id: 'session-spell',
      type: 'spell',
      label: 'Incantesimo lanciato',
      detail: 'Dardo Incantato · Slot 1',
      at: '2026-05-28T12:00:00.000Z',
    }, {
      id: 'session-resource',
      type: 'resource',
      label: 'Risorsa usata',
      detail: 'Azione Impetuosa: 0/1 disponibili',
      at: '2026-05-28T12:05:00.000Z',
    }],
  });

  api.appState.characterSheet = sheet;
  api.appState.characterSheets = [sheet];
  api.appState.activeCharacterSheetId = sheet.id;
  api.appState.data.spells = [
    { id: 'magic-missile', nome: 'Dardo Incantato', livello: 1, scuola: 'Invocazione', classi: ['mago'], tempo_lancio: 'azione', gittata: '36 m', componenti: 'V, S', durata: 'istantanea' },
    { id: 'fire-bolt', nome: 'Dardo di Fuoco', livello: 0, scuola: 'Invocazione', classi: ['mago'], tempo_lancio: 'azione', gittata: '36 m', componenti: 'V, S', durata: 'istantanea' },
    { id: 'shield', nome: 'Scudo', livello: 1, scuola: 'Abiurazione', classi: ['mago'], tempo_lancio: 'reazione', gittata: 'incantatore', componenti: 'V, S', durata: '1 round' },
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
    {
      id: 'fighter',
      nome: 'Classe: Guerriero',
      sezioni: [],
    },
  ];

  sheet.resources = [{ id: 'res-1', name: 'Azione Impetuosa', max: 1, used: 0, recovery: 'Riposo breve' }];
  sheet.attacks = [{ id: 'atk-1', name: 'Spada lunga', ability: 'str', proficient: true, bonus: 0, damage: '1d8', damageType: 'taglienti', notes: '' }];

  context.location.hash = '#/character_sheet';
  api.renderRoute();
  assert.equal(context.location.hash, '#/character_sheet');
  assert.match(views['#detail-view'].innerHTML, /Personaggi/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-create-builder/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-open-character="sheet-render"/);

  api.renderCharacterSheet('overview');
  assert.match(views['#detail-view'].innerHTML, /data-sheet-field="name"/);
  assert.match(views['#detail-view'].innerHTML, /<option value="elfo" selected>Elfo<\/option>/);
  assert.match(views['#detail-view'].innerHTML, /<option value="accolito" selected>Accolito<\/option>/);
  assert.match(views['#detail-view'].innerHTML, /Talento: Iniziato alla magia/);
  assert.match(views['#detail-view'].innerHTML, /sheet-guided-entry/); // link al wizard dall'header (non e il wizard stesso)
  assert.doesNotMatch(views['#detail-view'].innerHTML, /sheet-wizard-steps/);
  assert.doesNotMatch(views['#detail-view'].innerHTML, /Continua a caratteristiche/);
  assert.match(views['#detail-view'].innerHTML, /id="sheet-builder-skills"/);
  assert.match(views['#detail-view'].innerHTML, /Priorita consigliate/);
  assert.match(views['#detail-view'].innerHTML, /Intelligenza · Classe · Background/);
  assert.match(views['#detail-view'].innerHTML, /Mancano 2 scelte abilita dalla classe/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-apply-background-skills/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-ability="str"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-skill="arcana"/);
  assert.match(views['#detail-view'].innerHTML, /Tradizione Arcana/);
  assert.match(views['#detail-view'].innerHTML, /Apri classe/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-level-up/);
  assert.match(views['#detail-view'].innerHTML, /Level up/);
  assert.match(views['#detail-view'].innerHTML, /Livello 3 -&gt; 4/);
  assert.match(views['#detail-view'].innerHTML, /Scelte da completare/);
  assert.match(views['#detail-view'].innerHTML, /Personaggi/);
  assert.doesNotMatch(views['#detail-view'].innerHTML, />Creazione<\/a>/);

  api.renderCharacterSheet('builder');
  assert.match(views['#detail-view'].innerHTML, /Percorso guidato/);
  assert.match(views['#detail-view'].innerHTML, /sheet-builder-progress/);
  assert.match(views['#detail-view'].innerHTML, /sheet-wizard-steps/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-builder-step="identity"/);
  assert.match(views['#detail-view'].innerHTML, /sheet-builder-step/);
  assert.doesNotMatch(views['#detail-view'].innerHTML, /Checklist creazione/);
  assert.doesNotMatch(views['#detail-view'].innerHTML, />Creazione<\/a>/);

  // Passo Identita: scelte a carte invece dei menu a tendina.
  api.appState.characterSheetBuilderStep = 'identity';
  api.renderCharacterSheet('builder');
  assert.match(views['#detail-view'].innerHTML, /sheet-identity-picker/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-pick="classId"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-pick="ancestry"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-pick="background"/);

  api.appState.characterSheetBuilderStep = 'abilities';
  api.renderCharacterSheet('builder');
  assert.match(views['#detail-view'].innerHTML, /Serie standard/);
  assert.match(views['#detail-view'].innerHTML, /Acquisto punti/);
  assert.match(views['#detail-view'].innerHTML, /Generazione casuale/);
  // Caratteristiche interattive: stepper +/- per l'acquisto punti.
  assert.match(views['#detail-view'].innerHTML, /ability-step/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-ability-delta="1"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-ability-delta="-1"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-builder-action="apply-standard-array"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-builder-action="apply-point-buy-base"/);
  assert.match(views['#detail-view'].innerHTML, /data-dice-roll="4d6dl1"/);

  api.renderCharacterSheet('combat');
  assert.match(views['#detail-view'].innerHTML, /data-sheet-add-resource/);
  assert.match(views['#detail-view'].innerHTML, /<span>Round<\/span>/);
  assert.match(views['#detail-view'].innerHTML, /<strong>2<\/strong>/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-combat-new-turn/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-combat-toggle="actionUsed"/);
  assert.match(views['#detail-view'].innerHTML, /Azione/);
  assert.match(views['#detail-view'].innerHTML, /Usata/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-combat-movement-delta="3"/);
  assert.match(views['#detail-view'].innerHTML, /3\/9 m/);
  assert.match(views['#detail-view'].innerHTML, /Registro sessione/);
  assert.match(views['#detail-view'].innerHTML, /Incantesimo lanciato/);
  assert.match(views['#detail-view'].innerHTML, /Dardo Incantato · Slot 1/);
  assert.match(views['#detail-view'].innerHTML, /Risorsa usata/);
  assert.match(views['#detail-view'].innerHTML, /Benedizione/);
  assert.match(views['#detail-view'].innerHTML, /CD 12/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-concentration-drop/);
  assert.match(views['#detail-view'].innerHTML, /data-dice-roll="1d20 \+ 4 \+ 1d4"/); // TS INT +4 fuso con Benedizione 1d4
  assert.match(views['#detail-view'].innerHTML, /data-sheet-hp-form/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-hp-action="damage"/);
  assert.match(views['#detail-view'].innerHTML, /Dadi vita/);
  assert.match(views['#detail-view'].innerHTML, /2\/3/);
  assert.match(views['#detail-view'].innerHTML, /1 spesi/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-spend-hit-die/);
  assert.match(views['#detail-view'].innerHTML, /Spendi DV medio \+6/);
  assert.match(views['#detail-view'].innerHTML, /data-dice-roll="1d6 \+ 2"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-hit-die-delta="-1"/);
  assert.match(views['#detail-view'].innerHTML, /Cronologia PF/);
  assert.match(views['#detail-view'].innerHTML, /Danno 5/);
  assert.match(views['#detail-view'].innerHTML, /PF 20 -&gt; 17/);
  assert.match(views['#detail-view'].innerHTML, /Riposo lungo/);
  assert.doesNotMatch(views['#detail-view'].innerHTML, /Riposo lungo 1/);
  assert.match(views['#detail-view'].innerHTML, /Recuperato 1 dado vita/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-undo-hp="hp-1"/);
  assert.match(views['#detail-view'].innerHTML, /Azione Impetuosa/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-add-attack/);
  assert.match(views['#detail-view'].innerHTML, /Spada lunga/);
  assert.match(views['#detail-view'].innerHTML, /Prono/);
  // Gli effetti attivi si propagano alla tab Combattimento, non solo al Tavolo.
  assert.match(views['#detail-view'].innerHTML, /effetti \+2/); // CA: armorClass +2 dall'effetto
  assert.match(views['#detail-view'].innerHTML, /TS COS \+5/); // TS concentrazione: +2 COS +2 comp +1 effetto savingThrows
  // Il dado dell'effetto (Benedizione 1d4) si fonde nella formula del tiro salvezza.
  assert.match(views['#detail-view'].innerHTML, /1d20 \+ 5 \+ 1d4/);

  api.renderCharacterSheet('table');
  assert.match(views['#detail-view'].innerHTML, /sheet-table-layout/);
  assert.match(views['#detail-view'].innerHTML, /sheet-table-command/);
  assert.match(views['#detail-view'].innerHTML, /sheet-table-panel--actions/);
  assert.match(views['#detail-view'].innerHTML, /Tavolo/);
  assert.match(views['#detail-view'].innerHTML, /sheet-dashboard--table/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-hp-form/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-concentration-drop/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-combat-new-turn/);
  assert.match(views['#detail-view'].innerHTML, /Azioni del turno/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-table-use-action="Hide"/);
  assert.match(views['#detail-view'].innerHTML, /Furtivita \+0/);
  assert.match(views['#detail-view'].innerHTML, /Influence/);
  assert.match(views['#detail-view'].innerHTML, /Search/);
  assert.match(views['#detail-view'].innerHTML, /Study/);
  assert.match(views['#detail-view'].innerHTML, /Opportunity Attack/);
  assert.match(views['#detail-view'].innerHTML, /Opzioni pronte/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-table-use-action="Spada lunga"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-table-cast-spell="fire-bolt"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-table-cast-spell="magic-missile"/);
  assert.match(views['#detail-view'].innerHTML, /Slot finiti/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-resource-id="res-1"/);
  assert.match(views['#detail-view'].innerHTML, /Effetti attivi/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-add-effect/);
  assert.match(views['#detail-view'].innerHTML, /Velocita/);
  assert.match(views['#detail-view'].innerHTML, /2 turni/);
  assert.match(views['#detail-view'].innerHTML, /CA \+2/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-effect-tick="effect-speed"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-remove-effect="effect-bless"/);
  assert.match(views['#detail-view'].innerHTML, /Tratti rapidi/);
  assert.match(views['#detail-view'].innerHTML, /Classe L3/);
  assert.match(views['#detail-view'].innerHTML, /Tradizione Arcana/);
  assert.match(views['#detail-view'].innerHTML, /Talento origine/);
  assert.match(views['#detail-view'].innerHTML, /Iniziato alla magia/);
  assert.match(views['#detail-view'].innerHTML, /Scurovisione/);
  assert.match(views['#detail-view'].innerHTML, /Bacchetta/);
  assert.match(views['#detail-view'].innerHTML, /Copertura/);
  assert.match(views['#detail-view'].innerHTML, /Stato critico/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-status-check-button="inspiration"/);
  assert.match(views['#detail-view'].innerHTML, /Registro recente/);

  api.renderCharacterSheet('spells');
  assert.match(views['#detail-view'].innerHTML, /data-sheet-add-spell/);
  assert.match(views['#detail-view'].innerHTML, /Dardo Incantato/);
  assert.match(views['#detail-view'].innerHTML, /Dardo di Fuoco/);
  assert.match(views['#detail-view'].innerHTML, /sheet-spell-slots/);
  assert.match(views['#detail-view'].innerHTML, /Catalogo classe/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-spell-filter="level"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-cast-spell="magic-missile"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-add-spell-button="shield"/);

  api.appState.characterSheet.classId = 'fighter';
  api.renderCharacterSheet('spells');
  assert.match(views['#detail-view'].innerHTML, /Nessun lancio incantesimi/);
  assert.doesNotMatch(views['#detail-view'].innerHTML, /sheet-spell-summary/);
  api.appState.characterSheet.classId = 'wizard';

  api.renderCharacterSheet('inventory');
  assert.match(views['#detail-view'].innerHTML, /Equipaggiamento iniziale/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-apply-starting-equipment="class-a"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-apply-starting-equipment="background-coins"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-coin="mo"/);
  assert.match(views['#detail-view'].innerHTML, /role="meter"/);
  assert.match(views['#detail-view'].innerHTML, /8,5 kg \/ 75 kg/);
  assert.match(views['#detail-view'].innerHTML, /Oggetti 8 kg · monete 0,5 kg/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-add-equipment/);
  assert.match(views['#detail-view'].innerHTML, /Armatura di cuoio/);
  assert.match(views['#detail-view'].innerHTML, /indossata/);
  assert.match(views['#detail-view'].innerHTML, /Togli armatura/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-apply-armor="eq-armor"/);
  assert.match(views['#detail-view'].innerHTML, /Scudo/);
  assert.match(views['#detail-view'].innerHTML, /scudo equipaggiato/);
  assert.match(views['#detail-view'].innerHTML, /Togli scudo \+2/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-apply-armor="eq-shield"/);
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
