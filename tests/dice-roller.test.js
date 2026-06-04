const assert = require('node:assert/strict');
const {
  analyzeRollContext,
  findDiceFormulas,
  parseDiceFormula,
  parseRollExpression,
  rollExpression,
  rollDice,
} = require('../assets/js/dice-roller.js');

function sequence(values) {
  const rolls = [...values];

  return () => {
    if (!rolls.length) throw new Error('Sequenza dadi esaurita');
    return rolls.shift();
  };
}

assert.deepEqual(
  parseDiceFormula('2d6 + 3'),
  {
    raw: '2d6 + 3',
    count: 2,
    faces: 6,
    modifier: 3,
    keepMode: null,
    keepCount: null,
    formula: '2d6 + 3',
  }
);

assert.equal(parseDiceFormula('1d20kh1'), null);
assert.equal(parseDiceFormula('4d6dl2'), null);
assert.equal(parseDiceFormula('101d6'), null);
assert.equal(parseDiceFormula('1d1001'), null);

assert.deepEqual(
  findDiceFormulas('Colpisce con 1d20 + 7 e infligge 2d8 + 4 danni.').map((token) => token.formula),
  ['1d20 + 7', '2d8 + 4']
);

assert.deepEqual(
  findDiceFormulas('1d100\n01-20 Evento\n2d6 danni.').map((token) => token.formula),
  ['2d6']
);

assert.deepEqual(
  findDiceFormulas('1d100 Destinazione\n01-60 Piano nominato\n61-70 Piano Interno').map((token) => token.formula),
  []
);

assert.deepEqual(
  findDiceFormulas('61-70 Luogo casuale determinato dal tiro di un 1d6.').map((token) => token.formula),
  ['1d6']
);

assert.deepEqual(
  findDiceFormulas('Strato rosso: 12d6 danni da fuoco.').map((token) => token.formula),
  ['12d6']
);

assert.deepEqual(
  analyzeRollContext("Ogni creatura nell'area subisce 3d6 danni.").notes,
  ['per ciascun bersaglio coinvolto']
);

assert.deepEqual(
  analyzeRollContext('Alla fine di ogni suo turno, il bersaglio subisce nuovamente 4d10 danni.').notes,
  ["quando l'effetto si ripete"]
);

assert.deepEqual(
  analyzeRollContext("Ogni creatura subisce 2d6 danni all'inizio di ogni turno.").notes,
  ['per ciascun bersaglio coinvolto', "quando l'effetto si ripete"]
);

assert.deepEqual(
  analyzeRollContext('Ogni creatura vede una luce intensa.').notes,
  []
);

const advantage = rollDice(parseDiceFormula('2d20kh1 + 3'), sequence([7, 19]));
assert.deepEqual(advantage.rolls, [7, 19]);
assert.deepEqual(advantage.keptRolls, [19]);
assert.equal(advantage.total, 22);

const lowest = rollDice(parseDiceFormula('2d20kl1'), sequence([7, 19]));
assert.deepEqual(lowest.keptRolls, [7]);
assert.equal(lowest.total, 7);

const dropLowest = rollDice(parseDiceFormula('4d6dl1'), sequence([1, 6, 3, 4]));
assert.deepEqual(dropLowest.rolls, [1, 6, 3, 4]);
assert.deepEqual(dropLowest.keptRolls, [3, 4, 6]);
assert.equal(dropLowest.total, 13);

const realRoll = rollDice(parseDiceFormula('1d20'));
assert.equal(realRoll.rolls.length, 1);
assert.ok(realRoll.total >= 1 && realRoll.total <= 20);

// Formule composte (effetti che aggiungono un dado al tiro principale).
const expr = parseRollExpression('1d20 + 5 + 1d4');
assert.deepEqual(expr.terms, [
  { kind: 'dice', sign: 1, count: 1, faces: 20, keepMode: null, keepCount: null },
  { kind: 'flat', value: 5 },
  { kind: 'dice', sign: 1, count: 1, faces: 4, keepMode: null, keepCount: null },
]);
assert.equal(expr.formula, '1d20 + 5 + 1d4');

const blessed = rollExpression(expr, sequence([14, 3]));
assert.deepEqual(blessed.rolls, [14, 3]);
assert.equal(blessed.modifier, 5);
assert.equal(blessed.total, 22); // 14 + 5 + 3
assert.equal(blessed.faces, 20); // il singolo d20 resta riconoscibile per critico/fallimento
assert.equal(blessed.kept, 14);

// Gruppo singolo: deve restare identico al roller storico (delega a rollDice).
const single = rollExpression(parseRollExpression('2d6 + 3'), sequence([2, 5]));
assert.deepEqual(single.rolls, [2, 5]);
assert.equal(single.total, 10);

// Due gruppi di danno senza d20: nessun critico.
const damage = rollExpression(parseRollExpression('2d6 + 1d4'), sequence([4, 1, 2]));
assert.equal(damage.total, 7); // 4 + 1 + 2
assert.equal(damage.faces, null);
assert.equal(damage.kept, null);

// Sottrazione di un dado (debuff).
const penalty = rollExpression(parseRollExpression('1d20 - 1d4'), sequence([18, 3]));
assert.equal(penalty.total, 15);

// Formule non valide.
assert.equal(parseRollExpression('1d20 1d4'), null); // manca l'operatore
assert.equal(parseRollExpression('7'), null); // nessun dado
assert.equal(parseRollExpression('abc'), null);

console.log('Fixture dice roller OK');
