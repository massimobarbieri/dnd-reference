const assert = require('node:assert/strict');
const rules = require('../data/srd/5.2.1/json/srd_5_2_1_rules.json');

assert.equal(rules.length, 47);

const ids = new Set();

for (const rule of rules) {
  assert.equal(typeof rule.id, 'string');
  assert.equal(typeof rule.nome, 'string');
  assert.equal(typeof rule.capitolo, 'string');
  assert.equal(typeof rule.categoria, 'string');
  assert.ok(['number', 'string'].includes(typeof rule.pagine_sorgente));
  assert.equal(typeof rule.descrizione, 'string');
  assert.ok(Array.isArray(rule.sezioni));
  assert.ok(!ids.has(rule.id), `ID duplicato: ${rule.id}`);
  ids.add(rule.id);

  for (const section of rule.sezioni) {
    assert.equal(typeof section.titolo, 'string');
    if (section.righe) {
      assert.ok(Array.isArray(section.righe));
    }
    if (section.blocchi) {
      assert.ok(Array.isArray(section.blocchi));
    }
    if (section.colonne) {
      assert.ok(Array.isArray(section.colonne), `${rule.id}/${section.titolo} deve avere colonne in array`);
      assert.ok(section.colonne.length > 1, `${rule.id}/${section.titolo} deve avere piu colonne`);
      section.righe.forEach((row) => {
        section.colonne.forEach((column) => {
          assert.ok(Object.hasOwn(row, column), `${rule.id}/${section.titolo} riga senza colonna ${column}`);
        });
      });
    }
  }
}

assert.ok(ids.has('prove_con_d20'));
assert.ok(ids.has('combattimento'));
assert.ok(ids.has('danni_e_guarigione'));
assert.ok(ids.has('monete_e_commercio'));
assert.ok(ids.has('armi'));
assert.ok(ids.has('armature'));
assert.ok(ids.has('strumenti'));
assert.ok(ids.has('equipaggiamento_avventura'));
assert.ok(ids.has('cavalcature_e_veicoli'));
assert.ok(ids.has('spese_servizi_e_stile_di_vita'));
assert.ok(ids.has('oggetti_magici_e_creazione'));
assert.ok(ids.has('ottenere_incantesimi'));
assert.ok(ids.has('slot_e_lancio_incantesimi'));
assert.ok(ids.has('scuole_tempo_gittata_incantesimi'));
assert.ok(ids.has('componenti_durata_incantesimi'));
assert.ok(ids.has('bersagli_tiri_effetti_incantesimi'));
assert.ok(ids.has('categorie_oggetti_magici'));
assert.ok(ids.has('rarita_e_valore_oggetti_magici'));
assert.ok(ids.has('attivare_oggetti_magici'));
assert.ok(ids.has('pozioni_maledizioni_resilienza'));
assert.ok(ids.has('creare_oggetti_magici'));
assert.ok(ids.has('oggetti_magici_senzienti'));
assert.ok(ids.has('scheda_statistiche_mostro'));
assert.ok(ids.has('componenti_statistiche_mostri'));
assert.ok(ids.has('gestire_azioni_mostri'));
assert.ok(ids.has('azioni_leggendarie_uso_limitato'));
assert.ok(ids.has('passo_di_viaggio'));
assert.ok(ids.has('creare_background'));
assert.ok(ids.has('maledizioni_e_contagi_magici'));
assert.ok(ids.has('effetti_ambientali'));
assert.ok(ids.has('paura_e_stress_mentale'));
assert.ok(ids.has('veleno'));
assert.ok(ids.has('trappole'));
assert.ok(ids.has('combattimenti'));
assert.ok(ids.has('creare_personaggio'));
assert.ok(ids.has('origini_lingue_personaggio'));
assert.ok(ids.has('caratteristiche_allineamento_personaggio'));
assert.ok(ids.has('compilare_scheda_personaggio'));
assert.ok(ids.has('avanzamento_livelli_superiori'));
assert.ok(ids.has('multiclasse_e_monili'));
assert.ok(ids.has('talenti_origini_generali'));
assert.ok(ids.has('talenti_stile_doni_epici'));
assert.ok(![...ids].some((id) => id.startsWith('classe_')), 'le classi devono stare nel JSON dedicato');
assert.ok(!ids.has('background_origini_personaggio'), 'i background devono stare nel JSON dedicato');
assert.ok(!ids.has('specie_origini_personaggio'), 'le specie devono stare nel JSON dedicato');

[
  ['azioni', 'Abilita', 18],
  ['esplorazione', 'Passo di viaggio', 3],
  ['caratteristiche_allineamento_personaggio', 'Costi in punti del punteggio di caratteristica', 8],
  ['caratteristiche_allineamento_personaggio', 'Serie standard per classe', 12],
  ['avanzamento_livelli_superiori', 'Avanzamento dei personaggi', 20],
  ['avanzamento_livelli_superiori', 'Equipaggiamento a livelli superiori', 4],
  ['multiclasse_e_monili', 'Incantatore multiclasse: slot incantesimo 1-9', 20],
  ['multiclasse_e_monili', 'Monili', 100],
  ['pozioni_maledizioni_resilienza', 'Miscibilita delle pozioni', 8],
  ['creare_oggetti_magici', 'Strumenti per categoria', 9],
  ['creare_oggetti_magici', 'Tempi e costi', 5],
  ['componenti_statistiche_mostri', 'Punti esperienza per grado di sfida', 17],
  ['componenti_statistiche_mostri', 'Bonus di competenza per grado di sfida', 4],
  ['combattimenti', 'Budget di PE per personaggio', 20],
].forEach(([ruleId, sectionTitle, rowCount]) => {
  const rule = rules.find((entry) => entry.id === ruleId);
  const section = rule?.sezioni.find((entry) => entry.titolo === sectionTitle);

  assert.ok(section, `${ruleId} deve includere la tabella ${sectionTitle}`);
  assert.equal(section.righe.length, rowCount, `${sectionTitle} deve avere ${rowCount} righe`);
});

[
  ['armi', 'Armi principali'],
  ['armature', 'Armature complete'],
  ['equipaggiamento_avventura', "Equipaggiamento d'avventura: peso e costo"],
  ['cavalcature_e_veicoli', 'Finimenti e veicoli da tiro'],
  ['cavalcature_e_veicoli', 'Veicoli aerei e imbarcazioni'],
  ['spese_servizi_e_stile_di_vita', 'Vitto e alloggio'],
  ['spese_servizi_e_stile_di_vita', 'Gregari e servizi magici'],
].forEach(([ruleId, sectionTitle]) => {
  const rule = rules.find((entry) => entry.id === ruleId);
  assert.ok(!rule?.sezioni.some((entry) => entry.titolo === sectionTitle), `${sectionTitle} deve stare nel JSON dedicato`);
});

console.log('Dati regole SRD OK');
