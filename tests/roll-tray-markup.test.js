const assert = require('node:assert/strict');

let markup = '';
let bodyNode = { scrollTop: 99 };

global.document = {
  body: {
    insertAdjacentHTML(_position, html) {
      markup = html;
    },
  },
  querySelector(selector) {
    if (selector !== '#roll-tray' || !markup) return null;

    return {
      get outerHTML() {
        return markup;
      },
      set outerHTML(value) {
        markup = value;
      },
      querySelector(innerSelector) {
        return innerSelector === '.roll-tray-body' ? bodyNode : null;
      },
    };
  },
};

require('../assets/js/roll-tray.js');

const appState = {
  rollHistory: [{
    formula: '1d20 + 5',
    total: 18,
    rolls: [13],
    keptRolls: [13],
    modifier: 5,
  }],
  rollError: '',
  rollTrayOpen: true,
};

const controller = global.DndRollTray.createRollTrayController({
  appState,
  DICE_LIMITS: { historySize: 10 },
  parseDiceFormula: () => ({ formula: '1d20' }),
  rollDice: () => appState.rollHistory[0],
  randomInt: () => 1,
  escapeHtml: escapeText,
  escapeAttr: escapeText,
});

controller.renderRollTray();

const resultIndex = markup.indexOf('<div class="roll-result');
const formIndex = markup.indexOf('<form id="roll-tray-form"');

assert.notEqual(resultIndex, -1);
assert.notEqual(formIndex, -1);
assert.ok(resultIndex < formIndex, 'Il risultato del tiro deve precedere i controlli del tray.');
assert.match(markup, /class="roll-result[^"]*" role="status" aria-live="polite"/);
assert.match(markup, /class="roll-toggle-result" aria-label="Ultimo tiro: 1d20 \+ 5, totale 18"/);
assert.match(markup, /data-quick-roll="1d20" aria-label="Tira 1d20"/);

controller.handleRollCommand({
  target: {
    closest(selector) {
      return selector === '[data-dice-roll]' ? { getAttribute: () => '1d20' } : null;
    },
  },
});

assert.equal(bodyNode.scrollTop, 0);

console.log('Markup dice tray OK');

function escapeText(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
