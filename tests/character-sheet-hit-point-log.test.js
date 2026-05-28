const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

(async () => {
  const normalizersUrl = pathToFileURL(`${process.cwd()}/assets/js/features/character-sheet/character-sheet-normalizers.js`).href;
  const { normalizeCharacterSheet } = await import(normalizersUrl);

  const sheet = normalizeCharacterSheet({
    id: 'hp-log',
    hitPointLog: [
      {
        id: 'latest',
        action: 'damage',
        amount: 7,
        before: { currentHp: 18, tempHp: 3, hitDiceUsed: 1 },
        after: { currentHp: 14, tempHp: 0, hitDiceUsed: 1 },
        at: '2026-05-28T10:00:00.000Z',
        note: 'Concentrazione: TS Costituzione CD 10.',
      },
      {
        id: 'rest',
        action: 'longRest',
        amount: 2,
        before: {
          currentHp: 8,
          tempHp: 0,
          hitDiceUsed: 4,
          resources: [{ id: 'resource-1', name: 'Azione Impetuosa', max: 1, used: 1, recovery: 'Riposo breve' }],
          spellSlotsUsed: { 1: 2 },
          status: { concentration: true, concentrationSpell: 'Benedizione', concentrationDc: 12, deathSaveSuccesses: 1, deathSaveFailures: 2 },
        },
        after: {
          currentHp: 20,
          tempHp: 0,
          hitDiceUsed: 2,
          resources: [{ id: 'resource-1', name: 'Azione Impetuosa', max: 1, used: 0, recovery: 'Riposo breve' }],
          spellSlotsUsed: {},
          status: { concentration: false, concentrationSpell: '', concentrationDc: 10, deathSaveSuccesses: 0, deathSaveFailures: 0 },
        },
      },
      {
        id: 'invalid-action',
        action: 'weird',
        amount: -10,
        before: { currentHp: -5, tempHp: 'x' },
        after: { currentHp: 12, tempHp: 0 },
      },
      null,
    ],
    sessionLog: [
      {
        id: 'session-1',
        type: 'spell',
        label: 'Incantesimo lanciato',
        detail: 'Dardo Incantato · Slot 1',
        at: '2026-05-28T12:00:00.000Z',
      },
      {
        type: 'status',
        label: 'Condizione aggiunta',
      },
      {
        label: '',
      },
      null,
    ],
    hitDiceUsed: 99,
  });

  assert.equal(sheet.schemaVersion, 15);
  assert.equal(sheet.hitDiceUsed, 20);
  assert.equal(sheet.hitPointLog.length, 3);
  assert.deepEqual(sheet.hitPointLog[0], {
    id: 'latest',
    action: 'damage',
    amount: 7,
    before: { currentHp: 18, tempHp: 3, hitDiceUsed: 1 },
    after: { currentHp: 14, tempHp: 0, hitDiceUsed: 1 },
    at: '2026-05-28T10:00:00.000Z',
    note: 'Concentrazione: TS Costituzione CD 10.',
  });
  assert.equal(sheet.hitPointLog[1].action, 'longRest');
  assert.deepEqual(sheet.hitPointLog[1].before, {
    currentHp: 8,
    tempHp: 0,
    hitDiceUsed: 4,
    resources: [{ id: 'resource-1', name: 'Azione Impetuosa', max: 1, used: 1, recovery: 'Riposo breve' }],
    spellSlotsUsed: { 1: 2 },
    status: { concentration: true, concentrationSpell: 'Benedizione', concentrationDc: 12, deathSaveSuccesses: 1, deathSaveFailures: 2 },
  });
  assert.deepEqual(sheet.hitPointLog[1].after, {
    currentHp: 20,
    tempHp: 0,
    hitDiceUsed: 2,
    resources: [{ id: 'resource-1', name: 'Azione Impetuosa', max: 1, used: 0, recovery: 'Riposo breve' }],
    spellSlotsUsed: {},
    status: { concentration: false, concentrationSpell: '', concentrationDc: 10, deathSaveSuccesses: 0, deathSaveFailures: 0 },
  });
  assert.equal(sheet.hitPointLog[2].action, 'manual');
  assert.equal(sheet.hitPointLog[2].amount, 0);
  assert.deepEqual(sheet.hitPointLog[2].before, { currentHp: 0, tempHp: 0, hitDiceUsed: 0 });
  assert.deepEqual(sheet.sessionLog, [
    {
      id: 'session-1',
      type: 'spell',
      label: 'Incantesimo lanciato',
      detail: 'Dardo Incantato · Slot 1',
      at: '2026-05-28T12:00:00.000Z',
    },
    {
      id: 'session-log-2',
      type: 'status',
      label: 'Condizione aggiunta',
      detail: '',
      at: '',
    },
  ]);

  const longLog = normalizeCharacterSheet({
    hitPointLog: Array.from({ length: 30 }, (_value, index) => ({
      id: `entry-${index}`,
      action: 'heal',
      amount: index,
      before: { currentHp: index, tempHp: 0 },
      after: { currentHp: index + 1, tempHp: 0 },
    })),
  });

  assert.equal(longLog.hitPointLog.length, 25);
  assert.equal(longLog.hitPointLog[0].id, 'entry-0');
  assert.equal(longLog.hitPointLog.at(-1).id, 'entry-24');

  const longSessionLog = normalizeCharacterSheet({
    sessionLog: Array.from({ length: 60 }, (_value, index) => ({
      id: `session-${index}`,
      type: 'resource',
      label: `Evento ${index}`,
    })),
  });

  assert.equal(longSessionLog.sessionLog.length, 50);
  assert.equal(longSessionLog.sessionLog[0].id, 'session-0');
  assert.equal(longSessionLog.sessionLog.at(-1).id, 'session-49');

  console.log('Cronologia PF e registro sessione scheda OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
