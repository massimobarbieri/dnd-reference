const { pathToFileURL } = require('node:url');

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
    textContent: '',
    addEventListener() {},
    click() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };
}

function createAppTestContext() {
  const views = {
    '#home-view': createElement(),
    '#list-view': createElement(),
    '#detail-view': createElement(),
    '#loading-template': createElement('<div>Caricamento dati...</div>'),
    '#error-template': createElement('<div>Errore</div>'),
    '#site-title': createElement(),
    '#site-subtitle': createElement(),
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
    DndRollTray: {
      createRollTrayController: () => ({
        renderRollTray() {},
        handleRollCommand() {},
        handleRollSubmit() {},
      }),
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
      createElement: () => createElement(),
      querySelector: (selector) => views[selector] || createElement(),
    },
    localStorage: new MemoryStorage(),
    location: { hash: '#/character_sheet/overview' },
    window,
  };

  return { context, views, window };
}

async function loadAppModule(context) {
  Object.assign(globalThis, context);
  const appUrl = pathToFileURL(`${process.cwd()}/assets/js/app.js`).href;
  await import(`${appUrl}?test=${Date.now()}`);
  return context.window.DndReferenceTest;
}

module.exports = {
  MemoryStorage,
  createAppTestContext,
  loadAppModule,
};
