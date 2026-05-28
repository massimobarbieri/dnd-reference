export const CONDITION_ALIASES = {
    accecato: ['accecato', 'accecata', 'accecati', 'accecate'],
    affascinato: ['affascinato', 'affascinata', 'affascinati', 'affascinate'],
    afferrato: ['afferrato', 'afferrata', 'afferrati', 'afferrate'],
    assordato: ['assordato', 'assordata', 'assordati', 'assordate'],
    avvelenato: ['avvelenato', 'avvelenata', 'avvelenati', 'avvelenate'],
    incapacitato: ['incapacitato', 'incapacitata', 'incapacitati', 'incapacitate'],
    indebolimento: ['indebolimento'],
    invisibile: ['invisibile', 'invisibili'],
    paralizzato: ['paralizzato', 'paralizzata', 'paralizzati', 'paralizzate'],
    pietrificato: ['pietrificato', 'pietrificata', 'pietrificati', 'pietrificate'],
    privo_di_sensi: ['privo di sensi', 'priva di sensi', 'privi di sensi', 'prive di sensi'],
    prono: ['prono', 'prona', 'proni', 'prone'],
    spaventato: ['spaventato', 'spaventata', 'spaventati', 'spaventate'],
    stordito: ['stordito', 'stordita', 'storditi', 'stordite'],
    trattenuto: ['trattenuto', 'trattenuta', 'trattenuti', 'trattenute'],
};

export const ABILITY_META = [
    ['str', 'Forza', 'FOR'],
    ['dex', 'Destrezza', 'DES'],
    ['con', 'Costituzione', 'COS'],
    ['int', 'Intelligenza', 'INT'],
    ['wis', 'Saggezza', 'SAG'],
    ['cha', 'Carisma', 'CAR'],
];

export const SKILL_META = [
    ['acrobatics', 'Acrobazia', 'dex'],
    ['animalHandling', 'Addestrare Animali', 'wis'],
    ['arcana', 'Arcano', 'int'],
    ['athletics', 'Atletica', 'str'],
    ['deception', 'Inganno', 'cha'],
    ['history', 'Storia', 'int'],
    ['insight', 'Intuizione', 'wis'],
    ['intimidation', 'Intimidire', 'cha'],
    ['investigation', 'Indagare', 'int'],
    ['medicine', 'Medicina', 'wis'],
    ['nature', 'Natura', 'int'],
    ['perception', 'Percezione', 'wis'],
    ['performance', 'Intrattenere', 'cha'],
    ['persuasion', 'Persuasione', 'cha'],
    ['religion', 'Religione', 'int'],
    ['sleightOfHand', 'Rapidita di Mano', 'dex'],
    ['stealth', 'Furtivita', 'dex'],
    ['survival', 'Sopravvivenza', 'wis'],
];

export const CHARACTER_SHEET_TABS = [
    ['overview', 'Principale'],
    ['combat', 'Combattimento'],
    ['spells', 'Incantesimi'],
    ['inventory', 'Inventario'],
    ['notes', 'Note e SRD'],
];

/*
* Versione del formato salvato in localStorage/esportazione.
* Incrementare quando si aggiungono campi persistenti alla scheda.
*/
export const CHARACTER_SHEET_SCHEMA_VERSION = 15;

/*
* Modello canonico della scheda. Tutte le importazioni e i salvataggi
* parziali vengono riallineati a questa forma tramite normalizeCharacterSheet.
*/
export const DEFAULT_CHARACTER_SHEET = {
    id: '',
    schemaVersion: CHARACTER_SHEET_SCHEMA_VERSION,
    name: '',
    classId: '',
    level: 1,
    ancestry: '',
    background: '',
    alignment: '',
    xp: 0,
    abilities: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },
    savingThrows: {
      str: false,
      dex: false,
      con: false,
      int: false,
      wis: false,
      cha: false,
    },
    skillProficiencies: Object.fromEntries(SKILL_META.map(([key]) => [key, 0])),
    proficiencies: {
      weapons: '',
      armor: '',
      tools: '',
      languages: '',
    },
    armorClass: 10,
    currentHp: 0,
    maxHp: 0,
    tempHp: 0,
    hitPointLog: [],
    sessionLog: [],
    hitDice: '1d8',
    hitDiceUsed: 0,
    speed: 9,
    initiativeBonus: 0,
    combatState: {
      round: 1,
      actionUsed: false,
      bonusActionUsed: false,
      reactionUsed: false,
      movementUsed: 0,
    },
    status: {
      inspiration: false,
      concentration: false,
      concentrationSpell: '',
      concentrationDc: 10,
      exhaustion: 0,
      deathSaveSuccesses: 0,
      deathSaveFailures: 0,
      conditions: [],
      notes: '',
    },
    resources: [],
    attacks: [],
    spellcastingAbility: 'int',
    spellSlotsUsed: {},
    preparedSpells: [],
    magicItems: [],
    attunedMagicItems: [],
    references: [],
    equipmentItems: [],
    equipment: '',
    coins: {
      pp: 0,
      mo: 0,
      ma: 0,
      mr: 0,
    },
    notes: '',
};
