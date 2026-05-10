const assert = require('node:assert/strict');
const {
  findDiceFormulas,
  parseDiceFormula,
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

console.log('Fixture dice roller OK');
