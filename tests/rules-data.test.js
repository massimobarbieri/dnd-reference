const assert = require('node:assert/strict');
const rules = require('../data/srd/5.2.1/json/srd_5_2_1_rules.json');

assert.equal(rules.length, 8);

const ids = new Set();

for (const rule of rules) {
  assert.equal(typeof rule.id, 'string');
  assert.equal(typeof rule.nome, 'string');
  assert.equal(typeof rule.capitolo, 'string');
  assert.equal(typeof rule.categoria, 'string');
  assert.equal(typeof rule.pagine_sorgente, 'string');
  assert.equal(typeof rule.descrizione, 'string');
  assert.ok(Array.isArray(rule.sezioni));
  assert.ok(!ids.has(rule.id), `ID duplicato: ${rule.id}`);
  ids.add(rule.id);

  for (const section of rule.sezioni) {
    assert.equal(typeof section.titolo, 'string');
    assert.ok(Array.isArray(section.righe));
    assert.ok(Array.isArray(section.blocchi));
  }
}

assert.ok(ids.has('prove_con_d20'));
assert.ok(ids.has('combattimento'));
assert.ok(ids.has('danni_e_guarigione'));

console.log('Dati regole SRD OK');
