const assert = require('node:assert/strict');
const fs = require('node:fs');
const spells = require('../data/srd/5.2.1/json/srd_5_2_1_spells.json');
const monsters = require('../data/srd/5.2.1/json/srd_5_2_1_monsters.json');

const appSource = fs.readFileSync('assets/js/app.js', 'utf8');

const monsterIds = new Set(monsters.map((monster) => monster.id));
const expectedSpells = new Map([
  ['Animare oggetti', 'oggetto_animato'],
  ['Insetto gigante', 'insetto_gigante'],
  ['Richiama drago', 'spirito_draconico'],
  ['Trova cavalcatura', 'cavalcatura_ultraterrena'],
]);

expectedSpells.forEach((monsterId, spellName) => {
  const spell = spells.find((entry) => entry.nome === spellName);

  assert.ok(spell, `Incantesimo non trovato: ${spellName}`);
  assert.equal(
    spell.creatura_evocata?.id,
    monsterId,
    `${spellName} deve puntare al mostro ${monsterId}`
  );
  assert.ok(monsterIds.has(monsterId), `Mostro non trovato: ${monsterId}`);
});

assert.match(appSource, /function renderSummonedCreatureLink\(spell\)/);
assert.match(appSource, /spell\?\.(creatura_evocata|creatura_evocata\?\.id)/);
assert.match(appSource, /spell\?\.creatura_evocata\?\.fonte !== 'mostri'/);
assert.match(appSource, /appState\.data\.monsters\.find\(\(entry\) => entry\.id === summonedCreatureId\)/);
assert.match(appSource, /Creatura evocata:/);
assert.match(appSource, /href="#\/monsters\/\$\{encodeURIComponent\(monster\.id\)\}"/);
assert.match(appSource, /\$\{renderSummonedCreatureLink\(spell\)\}/);

console.log('Link creature evocate negli incantesimi OK');
