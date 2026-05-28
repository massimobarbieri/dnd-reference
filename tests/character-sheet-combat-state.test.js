const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

(async () => {
  const normalizersUrl = pathToFileURL(`${process.cwd()}/assets/js/features/character-sheet/character-sheet-normalizers.js`).href;
  const { normalizeCharacterSheet } = await import(normalizersUrl);

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
  });

  assert.equal(sheet.schemaVersion, 15);
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

  console.log('Stato combattimento scheda OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
