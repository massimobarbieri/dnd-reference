const assert = require('node:assert/strict');
const glossary = require('../data/srd/5.2.1/json/srd_5_2_1_rules_glossary.json');

assert.equal(glossary.length, 128);

const ids = new Set();

for (const entry of glossary) {
  assert.equal(typeof entry.id, 'string');
  assert.equal(typeof entry.nome, 'string');
  assert.equal(typeof entry.lettera, 'string');
  assert.ok(entry.descrittore === null || typeof entry.descrittore === 'string');
  assert.equal(typeof entry.pagine_sorgente, 'string');
  assert.equal(typeof entry.descrizione, 'string');
  assert.ok(Array.isArray(entry.sezioni));
  assert.ok(Array.isArray(entry.vedi_anche));
  assert.ok(!ids.has(entry.id), `ID duplicato: ${entry.id}`);
  ids.add(entry.id);

  for (const section of entry.sezioni) {
    assert.equal(typeof section.titolo, 'string');
    assert.ok(Array.isArray(section.righe));
    assert.ok(Array.isArray(section.blocchi));
  }
}

assert.ok(ids.has('accecato'));
assert.ok(ids.has('azione'));
assert.ok(ids.has('copertura'));
assert.ok(ids.has('cubo'));
assert.ok(ids.has('disidratazione'));
assert.ok(ids.has('influenza'));
assert.ok(ids.has('ispirazione_eroica'));
assert.ok(ids.has('morte'));
assert.ok(ids.has('riposo_lungo'));
assert.ok(ids.has('studio'));

console.log('Dati glossario regole OK');
