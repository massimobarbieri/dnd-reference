const assert = require('node:assert/strict');
const rules = require('../data/srd/5.2.1/json/srd_5_2_1_rules.json');

assert.equal(rules.length, 61);

const ids = new Set();
let previousSourcePage = 0;

function firstSourcePage(value) {
  const [page] = String(value || '').match(/\d+/) || [];
  return page ? Number(page) : Number.POSITIVE_INFINITY;
}

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

  const sourcePage = firstSourcePage(rule.pagine_sorgente);
  assert.ok(
    sourcePage >= previousSourcePage,
    `Ordine pagine non coerente: ${rule.id} a pag. ${rule.pagine_sorgente}`
  );
  previousSourcePage = sourcePage;

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

for (const rule of rules.filter((entry) => entry.id.startsWith('classe_'))) {
  const progression = rule.sezioni.find((section) => section.titolo === 'Progressione di classe');
  const subclass = rule.sezioni.find((section) => section.titolo === 'Sottoclasse SRD');

  assert.ok(
    rule.sezioni.some((section) => section.titolo.startsWith('Tratti del ') || section.titolo.startsWith('Tratti dello ')),
    `${rule.id} deve includere la tabella dei tratti`
  );
  assert.ok(progression, `${rule.id} deve includere la tabella di progressione`);
  assert.equal(progression.righe.length, 20, `${rule.id} deve avere 20 livelli`);
  assert.ok(subclass, `${rule.id} deve includere la sottoclasse SRD`);
}

assert.ok(
  rules
    .find((entry) => entry.id === 'classe_druido')
    .sezioni.some((section) => section.titolo === 'Forme bestiali'),
  'classe_druido deve includere la tabella Forme bestiali'
);

[
  ['azioni', 'Abilita', 18],
  ['esplorazione', 'Passo di viaggio', 3],
  ['caratteristiche_allineamento_personaggio', 'Costi in punti del punteggio di caratteristica', 8],
  ['caratteristiche_allineamento_personaggio', 'Serie standard per classe', 12],
  ['avanzamento_livelli_superiori', 'Avanzamento dei personaggi', 20],
  ['multiclasse_e_monili', 'Incantatore multiclasse: slot incantesimo 1-9', 20],
  ['specie_origini_personaggio', 'Antenati draconici', 10],
  ['specie_origini_personaggio', 'Lignaggi elfici', 3],
  ['specie_origini_personaggio', 'Retaggi immondi', 3],
  ['armi', 'Armi principali', 38],
  ['armature', 'Armature complete', 13],
  ['equipaggiamento_avventura', "Equipaggiamento d'avventura: peso e costo", 82],
  ['cavalcature_e_veicoli', 'Finimenti e veicoli da tiro', 10],
  ['cavalcature_e_veicoli', 'Veicoli aerei e imbarcazioni', 7],
  ['spese_servizi_e_stile_di_vita', 'Vitto e alloggio', 6],
  ['spese_servizi_e_stile_di_vita', 'Gregari e servizi magici', 10],
  ['combattimenti', 'Budget di PE per personaggio', 20],
].forEach(([ruleId, sectionTitle, rowCount]) => {
  const rule = rules.find((entry) => entry.id === ruleId);
  const section = rule?.sezioni.find((entry) => entry.titolo === sectionTitle);

  assert.ok(section, `${ruleId} deve includere la tabella ${sectionTitle}`);
  assert.equal(section.righe.length, rowCount, `${sectionTitle} deve avere ${rowCount} righe`);
});

console.log('Dati regole SRD OK');
