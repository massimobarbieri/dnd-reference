const assert = require('node:assert/strict');
const fs = require('node:fs');
const classes = require('../data/srd/5.2.1/json/srd_5_2_1_classes.json');
const spells = require('../data/srd/5.2.1/json/srd_5_2_1_spells.json');

const appSource = fs.readFileSync('assets/js/app.js', 'utf8');
const cssSource = fs.readFileSync('assets/css/styles.css', 'utf8');

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const spellNames = new Set(spells.map((spell) => normalizeText(spell.nome).trim()));

classes
  .flatMap((rule) => rule.sezioni)
  .filter((section) => section.titolo.startsWith('Lista degli incantesimi da '))
  .forEach((section) => {
    assert.ok(section.righe.some((row) => Object.hasOwn(row, 'Incantesimo')), `${section.titolo} deve avere la colonna Incantesimo`);

    section.righe.forEach((row) => {
      assert.ok(
        spellNames.has(normalizeText(row.Incantesimo).trim()),
        `${section.titolo}: incantesimo non trovato nel catalogo: ${row.Incantesimo}`
      );
    });
  });

assert.match(appSource, /function renderTableCell\(value, column\)/);
assert.match(appSource, /function renderClassSpellListTables\(rows, columns\)/);
assert.match(appSource, /function groupRowsBySpellLevel\(rows\)/);
assert.match(appSource, /normalizeTableColumns\(visibleRows, columns\)\.filter\(\(column\) => column !== 'Livello'\)/);
assert.match(appSource, /href="#\/spells\/\$\{encodeURIComponent\(spell\.id\)\}"/);
assert.match(appSource, /class="table-spell-link"/);
assert.match(appSource, /tabindex="0" aria-label="Tabella scorrevole"/);

[
  '.table-wrap:focus-visible',
  '.table-spell-link:focus-visible',
  '.spell-level-groups',
  '.data-table-spell-list',
  '.data-table-matrix thead th:first-child',
  'position: sticky',
].forEach((token) => assert.ok(cssSource.includes(token), `${token} deve essere presente nel CSS`));

console.log('Link incantesimi e tabelle responsive OK');
