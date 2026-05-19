const assert = require('node:assert/strict');
const fs = require('node:fs');

const equipment = require('../data/srd/5.2.1/json/srd_5_2_1_equipment.json');
const feats = require('../data/srd/5.2.1/json/srd_5_2_1_feats.json');
const languages = require('../data/srd/5.2.1/json/srd_5_2_1_languages.json');

const configSource = fs.readFileSync('config.yml', 'utf8');
const sectionSource = fs.readFileSync('assets/js/config/sections.js', 'utf8');

assert.equal(equipment.length, 197);
assert.equal(feats.length, 17);
assert.equal(languages.length, 19);

for (const entry of equipment) {
  assert.equal(typeof entry.id, 'string');
  assert.equal(typeof entry.nome, 'string');
  assert.equal(typeof entry.tipo, 'string');
  assert.equal(typeof entry.categoria, 'string');
  assert.equal(typeof entry.descrizione, 'string');
  assert.ok(Array.isArray(entry.sezioni));
}

for (const entry of feats) {
  assert.equal(typeof entry.id, 'string');
  assert.equal(typeof entry.nome, 'string');
  assert.equal(entry.tipo, 'talento');
  assert.equal(typeof entry.categoria, 'string');
  assert.equal(typeof entry.descrizione, 'string');
  assert.ok(Array.isArray(entry.sezioni));
}

for (const entry of languages) {
  assert.equal(typeof entry.id, 'string');
  assert.equal(typeof entry.nome, 'string');
  assert.equal(entry.tipo, 'lingua');
  assert.equal(typeof entry.categoria, 'string');
  assert.equal(typeof entry.descrizione, 'string');
  assert.ok(Array.isArray(entry.sezioni));
}

assert.ok(equipment.find((entry) => entry.id === 'pugnale' && entry.danni === '1d4 perforanti'));
assert.ok(equipment.find((entry) => entry.id === 'armatura_di_cuoio' && entry.classe_armatura === '11 + Des'));
assert.ok(feats.find((entry) => entry.id === 'abile' && entry.categoria === 'Origini'));
assert.ok(languages.find((entry) => entry.id === 'comune' && entry.categoria === 'Standard'));

assert.match(configSource, /equipment: Equipaggiamento/);
assert.match(configSource, /feats: Talenti/);
assert.match(configSource, /languages: Lingue/);
assert.match(configSource, /equipment: data\/srd\/5\.2\.1\/json\/srd_5_2_1_equipment\.json/);
assert.match(configSource, /feats: data\/srd\/5\.2\.1\/json\/srd_5_2_1_feats\.json/);
assert.match(configSource, /languages: data\/srd\/5\.2\.1\/json\/srd_5_2_1_languages\.json/);
assert.match(sectionSource, /equipment:/);
assert.match(sectionSource, /feats:/);
assert.match(sectionSource, /languages:/);

console.log('Sezioni equipaggiamento, talenti e lingue OK');
