const assert = require('node:assert/strict');
const fs = require('node:fs');
const { parseDiceFormula } = require('../assets/js/dice-roller.js');

const monsters = JSON.parse(
  fs.readFileSync('data/srd/5.2.1/json/srd_5_2_1_monsters.json', 'utf8')
);

let enrichedActions = 0;

for (const monster of monsters) {
  for (const action of monster.azioni || []) {
    if (action.tiri || action.ricarica) enrichedActions += 1;

    for (const roll of action.tiri || []) {
      assert.ok(['attacco', 'salvezza', 'multiattacco'].includes(roll.tipo));

      if (roll.tipo === 'attacco') {
        assert.equal(typeof roll.bonus, 'number');
        assert.ok(Array.isArray(roll.danni));
        roll.danni.forEach(validateDamage);
      }

      if (roll.tipo === 'salvezza') {
        assert.equal(typeof roll.cd, 'number');
        assert.equal(typeof roll.caratteristica, 'string');
        (roll.fallimento?.danni || []).forEach(validateDamage);
      }
    }

    if (action.ricarica) {
      assert.equal(action.ricarica.formula, '1d6');
      assert.ok(action.ricarica.successo.every((value) => value >= 1 && value <= 6));
    }
  }
}

assert.equal(enrichedActions, 494);

const ankheg = monsters.find((monster) => monster.nome === 'Ankheg');
const ankhegBite = ankheg.azioni.find((action) => action.nome === 'Morso');
assert.equal(ankhegBite.tiri[0].portata, '1,5 m');
assert.deepEqual(
  ankhegBite.tiri[0].danni.map((damage) => damage.formula),
  ['2d6 + 3', '1d6']
);

const behir = monsters.find((monster) => monster.nome === 'Behir');
const lightningBreath = behir.azioni.find((action) => action.nome === 'Soffio di fulmini (ricarica 5-6)');
assert.deepEqual(lightningBreath.ricarica.successo, [5, 6]);
assert.equal(lightningBreath.tiri[0].successo.danni, 'meta');

function validateDamage(damage) {
  assert.ok(parseDiceFormula(damage.formula), `Formula non valida: ${damage.formula}`);
  assert.equal(typeof damage.media, 'number');
  assert.equal(typeof damage.tipo, 'string');
}

console.log('Dati mostri arricchiti OK');
