const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

(async () => {
  const normalizersUrl = pathToFileURL(`${process.cwd()}/assets/js/features/character-sheet/character-sheet-normalizers.js`).href;
  const { normalizeCharacterSheet, activeEffectModifier } = await import(normalizersUrl);

  const sheet = normalizeCharacterSheet({
    id: 'combat-state',
    schemaVersion: 13,
    combatState: {
      round: 1000,
      actionUsed: 1,
      bonusActionUsed: '',
      reactionUsed: true,
      movementUsed: -4,
    },
    status: {
      concentration: true,
      concentrationSpell: 'Benedizione',
      concentrationDc: 4,
      deathSaveSuccesses: 5,
      deathSaveFailures: 2,
    },
    activeEffects: [
      { id: 'effect-1', name: 'Velocita', source: 10, duration: 'turns', remaining: 1000, modifierTarget: 'armorClass', modifierValue: 120, notes: 7 },
      { name: '', duration: 'weird' },
    ],
  });

  assert.equal(sheet.schemaVersion, 16);
  assert.deepEqual(sheet.combatState, {
    round: 999,
    actionUsed: true,
    bonusActionUsed: false,
    reactionUsed: true,
    movementUsed: 0,
  });
  assert.equal(sheet.status.concentration, true);
  assert.equal(sheet.status.concentrationSpell, 'Benedizione');
  assert.equal(sheet.status.concentrationDc, 10);
  assert.equal(sheet.status.deathSaveSuccesses, 3);
  assert.equal(sheet.status.deathSaveFailures, 2);
  assert.deepEqual(sheet.activeEffects, [{
    id: 'effect-1',
    name: 'Velocita',
    source: '10',
    duration: 'turns',
    remaining: 999,
    modifierTarget: 'armorClass',
    modifierValue: 99,
    modifierDice: '',
    notes: '7',
  }]);

  // L'helper condiviso somma i modificatori per bersaglio (fonte unica per derived/selettori/renderer).
  assert.equal(activeEffectModifier(sheet.activeEffects, 'armorClass'), 99);
  assert.equal(activeEffectModifier(sheet.activeEffects, 'savingThrows'), 0);
  assert.equal(activeEffectModifier(sheet.activeEffects, ''), 0);
  assert.equal(activeEffectModifier(null, 'armorClass'), 0);
  assert.equal(
    activeEffectModifier([
      { modifierTarget: 'attack', modifierValue: 2 },
      { modifierTarget: 'attack', modifierValue: -1 },
      { modifierTarget: 'speed', modifierValue: 3 },
    ], 'attack'),
    1,
  );

  console.log('Stato combattimento scheda OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
