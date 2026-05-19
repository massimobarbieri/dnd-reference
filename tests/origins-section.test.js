const assert = require('node:assert/strict');
const fs = require('node:fs');

const species = require('../data/srd/5.2.1/json/srd_5_2_1_species.json');
const backgrounds = require('../data/srd/5.2.1/json/srd_5_2_1_backgrounds.json');

const configSource = fs.readFileSync('config.yml', 'utf8');
const sectionSource = fs.readFileSync('assets/js/config/sections.js', 'utf8');

assert.equal(species.length, 9);
assert.equal(backgrounds.length, 4);

for (const entry of species) {
  assert.equal(typeof entry.id, 'string');
  assert.equal(typeof entry.nome, 'string');
  assert.equal(entry.tipo, 'specie');
  assert.equal(typeof entry.tipo_creatura, 'string');
  assert.equal(typeof entry.taglia, 'string');
  assert.equal(typeof entry.velocita, 'string');
  assert.equal(typeof entry.descrizione, 'string');
  assert.ok(Array.isArray(entry.sezioni));
}

for (const entry of backgrounds) {
  assert.equal(typeof entry.id, 'string');
  assert.equal(typeof entry.nome, 'string');
  assert.equal(entry.tipo, 'background');
  assert.ok(Array.isArray(entry.punteggi_caratteristica));
  assert.equal(typeof entry.talento_origine, 'string');
  assert.equal(typeof entry.descrizione, 'string');
  assert.ok(Array.isArray(entry.sezioni));
}

const dragonborn = species.find((entry) => entry.id === 'dragonide');
assert.ok(dragonborn.sezioni.some((section) => section.titolo === 'Antenati draconici' && section.righe.length === 10));

const elf = species.find((entry) => entry.id === 'elfo');
assert.ok(elf.sezioni.some((section) => section.titolo === 'Lignaggi elfici' && section.righe.length === 3));

const tiefling = species.find((entry) => entry.id === 'tiefling');
assert.ok(tiefling.sezioni.some((section) => section.titolo === 'Retaggi immondi' && section.righe.length === 3));

assert.match(configSource, /species: Specie/);
assert.match(configSource, /backgrounds: Background/);
assert.match(configSource, /species: data\/srd\/5\.2\.1\/json\/srd_5_2_1_species\.json/);
assert.match(configSource, /backgrounds: data\/srd\/5\.2\.1\/json\/srd_5_2_1_backgrounds\.json/);
assert.match(sectionSource, /species:/);
assert.match(sectionSource, /backgrounds:/);

console.log('Sezioni specie e background OK');
