const assert = require('node:assert/strict');
const fs = require('node:fs');
const classes = require('../data/srd/5.2.1/json/srd_5_2_1_classes.json');
const rules = require('../data/srd/5.2.1/json/srd_5_2_1_rules.json');

const configSource = fs.readFileSync('config.yml', 'utf8');
const indexSource = fs.readFileSync('index.html', 'utf8');

assert.equal(classes.length, 12);
assert.equal(rules.some((rule) => rule.id.startsWith('classe_')), false);

for (const classEntry of classes) {
  const progression = classEntry.sezioni.find((section) => section.titolo === 'Progressione di classe');
  const subclass = classEntry.sezioni.find((section) => section.titolo.startsWith('Sottoclasse '));

  assert.ok(
    classEntry.sezioni.some((section) => section.titolo === 'Tratti di classe'),
    `${classEntry.id} deve includere la tabella dei tratti`
  );
  assert.ok(progression, `${classEntry.id} deve includere la tabella di progressione`);
  assert.equal(progression.righe.length, 20, `${classEntry.id} deve avere 20 livelli`);
  assert.ok(Object.hasOwn(progression.righe[0], 'Livello'), `${classEntry.id} deve includere la colonna livello`);
  assert.ok(Object.hasOwn(progression.righe[0], 'Bonus di competenza'), `${classEntry.id} deve includere il bonus di competenza`);
  assert.ok(Object.hasOwn(progression.righe[0], 'Privilegi di classe'), `${classEntry.id} deve includere i privilegi di classe`);
  assert.ok(subclass, `${classEntry.id} deve includere la sottoclasse SRD`);
  assert.deepEqual(Object.keys(subclass.righe[0]), ['Livello', 'Privilegio', 'Riepilogo'], `${classEntry.id} deve strutturare i privilegi della sottoclasse`);
  assert.ok(subclass.righe.length >= 4, `${classEntry.id} deve includere i privilegi della sottoclasse`);
}

assert.ok(
  (() => {
    const section = classes
      .find((entry) => entry.id === 'druido')
      .sezioni.find((entry) => entry.titolo === 'Forme bestiali');

    return (
      section &&
      section.righe.length === 3 &&
      Object.hasOwn(section.righe[0], 'Forme conosciute') &&
      Object.hasOwn(section.righe[0], 'GS max') &&
      Object.hasOwn(section.righe[0], 'Velocità di volo')
    );
  })(),
  'druido deve includere la tabella Forme bestiali'
);

assert.match(configSource, /classes:\s+data\/srd\/5\.2\.1\/json\/srd_5_2_1_classes\.json/);
assert.match(configSource, /classes: Classi/);
assert.match(configSource, /classes: data\/srd\/5\.2\.1\/json\/srd_5_2_1_classes\.json/);
assert.match(configSource, /species: Specie/);
assert.match(configSource, /backgrounds: Background/);
assert.match(indexSource, /app\.js\?v=20260530-ui2/);

console.log('Sezione classi OK');
