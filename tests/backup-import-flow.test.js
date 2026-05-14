const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class MemoryStorage {
  constructor() {
    this.store = new Map();
  }

  get length() {
    return this.store.size;
  }

  key(index) {
    return [...this.store.keys()][index] || null;
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    this.store.set(String(key), String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }
}

function createElement(html = '') {
  return {
    hidden: false,
    innerHTML: html,
    addEventListener() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };
}

function createContext() {
  const views = {
    '#home-view': createElement(),
    '#list-view': createElement(),
    '#detail-view': createElement(),
    '#loading-template': createElement('<div>Caricamento dati...</div>'),
    '#error-template': createElement('<div>Errore</div>'),
  };
  const window = {
    __DND_REFERENCE_TEST__: true,
    addEventListener() {},
    DndDiceRoller: {
      analyzeRollContext: () => ({ notes: [] }),
      DICE_LIMITS: {},
      findDiceFormulas: () => [],
      formatDiceFormula: (value) => value,
      isLikelyTableDie: () => false,
      parseDiceFormula: () => null,
      randomInt: () => 1,
      rollDice: () => ({ total: 1, rolls: [] }),
    },
  };
  const context = {
    Blob: class Blob {
      constructor(parts, options) {
        this.parts = parts;
        this.options = options;
      }
    },
    FormData: class FormData {},
    URL: {
      createObjectURL: () => 'blob:test',
      revokeObjectURL() {},
    },
    alert(message) {
      context.lastAlert = message;
    },
    confirm: () => true,
    console,
    document: {
      addEventListener() {},
      createElement: () => ({ click() {} }),
      querySelector: (selector) => views[selector] || createElement(),
    },
    localStorage: new MemoryStorage(),
    location: { hash: '#/character_sheet/overview' },
    window,
  };
  context.globalThis = context;

  return { context, views, window };
}

const source = fs.readFileSync('assets/js/app.js', 'utf8');
const { context, views, window } = createContext();
vm.runInNewContext(source, context, { filename: 'assets/js/app.js' });

const api = window.DndReferenceTest;
assert.ok(api, 'gli internals di test devono essere esposti solo in ambiente test');

const localSheet = api.normalizeCharacterSheet({ id: 'sheet-local', name: 'Locale', level: 1 });
api.appState.characterSheet = localSheet;
api.appState.characterSheets = [localSheet];
api.appState.activeCharacterSheetId = localSheet.id;
api.saveCharacterSheet();

api.appState.pendingCharacterSheetArchive = api.normalizeCharacterSheetArchive({
  activeCharacterSheetId: 'sheet-imported',
  sheets: [{ id: 'sheet-imported', schemaVersion: 8, name: 'Importata', level: 2 }],
});
api.renderCharacterSheet('overview');
assert.match(views['#detail-view'].innerHTML, /Import archivio schede/);
assert.match(views['#detail-view'].innerHTML, /data-sheet-import-archive-mode="unisci"/);
assert.match(views['#detail-view'].innerHTML, /data-sheet-import-archive-mode="sostituisci"/);

api.applyCharacterSheetArchiveImport('unisci');
assert.equal(api.appState.characterSheets.length, 2);
assert.equal(api.appState.characterSheet.id, 'sheet-imported');
assert.equal(JSON.parse(context.localStorage.getItem('dnd-reference:character-sheets')).length, 2);

api.appState.pendingCharacterSheetArchive = api.normalizeCharacterSheetArchive({
  activeCharacterSheetId: 'sheet-replacement',
  sheets: [{ id: 'sheet-replacement', schemaVersion: 8, name: 'Sostituita', level: 3 }],
});
api.applyCharacterSheetArchiveImport('sostituisci');
assert.deepEqual(api.appState.characterSheets.map((sheet) => sheet.id), ['sheet-replacement']);
assert.equal(api.appState.characterSheet.name, 'Sostituita');

context.localStorage.setItem('external:key', 'preserve');
context.localStorage.setItem('dnd-reference:old', 'remove');
api.appState.pendingAppBackup = api.normalizeAppBackup({
  kind: 'dnd-reference:app-backup',
  schemaVersion: 1,
  storage: {
    'dnd-reference:favorites': '{"monsters":["goblin"]}',
    'dnd-reference:active-character-sheet': 'sheet-backup',
    'dnd-reference:character-sheets': JSON.stringify([
      { id: 'sheet-backup', schemaVersion: 8, name: 'Backup', level: 4 },
    ]),
    'external:key': 'ignored',
  },
});
api.renderCharacterSheet('overview');
assert.match(views['#detail-view'].innerHTML, /Import backup app/);
assert.match(views['#detail-view'].innerHTML, /data-app-import-backup-apply/);
assert.match(views['#detail-view'].innerHTML, /data-app-import-backup-cancel/);

api.applyAppBackupImport();
assert.equal(context.localStorage.getItem('external:key'), 'preserve');
assert.equal(context.localStorage.getItem('dnd-reference:old'), null);
assert.equal(JSON.stringify(api.appState.favorites), '{"monsters":["goblin"]}');
assert.equal(api.appState.characterSheet.id, 'sheet-backup');
assert.equal(api.appState.characterSheet.name, 'Backup');

console.log('Flussi import archivio e backup OK');
