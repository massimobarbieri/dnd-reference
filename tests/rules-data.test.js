const assert = require('node:assert/strict');
const rules = require('../data/srd/5.2.1/json/srd_5_2_1_rules.json');

assert.equal(rules.length, 61);

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
assert.ok(ids.has('background_origini_personaggio'));
assert.ok(ids.has('specie_origini_personaggio'));
assert.ok(ids.has('talenti_origini_generali'));
assert.ok(ids.has('talenti_stile_doni_epici'));
assert.ok(ids.has('classe_barbaro'));
assert.ok(ids.has('classe_bardo'));
assert.ok(ids.has('classe_chierico'));
assert.ok(ids.has('classe_druido'));
assert.ok(ids.has('classe_guerriero'));
assert.ok(ids.has('classe_ladro'));
assert.ok(ids.has('classe_mago'));
assert.ok(ids.has('classe_monaco'));
assert.ok(ids.has('classe_paladino'));
assert.ok(ids.has('classe_ranger'));
assert.ok(ids.has('classe_stregone'));
assert.ok(ids.has('classe_warlock'));

console.log('Dati regole SRD OK');
