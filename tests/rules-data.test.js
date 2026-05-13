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
  const subclass = rule.sezioni.find((section) => section.titolo.startsWith('Sottoclasse '));

  assert.ok(
    rule.sezioni.some((section) => section.titolo.startsWith('Tratti del ') || section.titolo.startsWith('Tratti dello ')),
    `${rule.id} deve includere la tabella dei tratti`
  );
  assert.ok(progression, `${rule.id} deve includere la tabella di progressione`);
  assert.equal(progression.righe.length, 20, `${rule.id} deve avere 20 livelli`);
  assert.ok(Array.isArray(progression.colonne), `${rule.id} deve avere una progressione multi-colonna`);
  assert.ok(progression.colonne.includes('Livello'), `${rule.id} deve includere la colonna livello`);
  assert.ok(progression.colonne.includes('Bonus di competenza'), `${rule.id} deve includere il bonus di competenza`);
  assert.ok(progression.colonne.includes('Privilegi di classe'), `${rule.id} deve includere i privilegi di classe`);
  assert.ok(subclass, `${rule.id} deve includere la sottoclasse SRD`);
  assert.deepEqual(subclass.colonne, ['Livello', 'Privilegio', 'Riepilogo'], `${rule.id} deve strutturare i privilegi della sottoclasse`);
  assert.ok(subclass.righe.length >= 4, `${rule.id} deve includere i privilegi della sottoclasse`);
}

assert.ok(
  (() => {
    const section = rules
      .find((entry) => entry.id === 'classe_druido')
      .sezioni.find((entry) => entry.titolo === 'Forme bestiali');

    return (
      section &&
      section.righe.length === 3 &&
      section.colonne.includes('Forme conosciute') &&
      section.colonne.includes('GS max') &&
      section.colonne.includes('Velocità di volo')
    );
  })(),
  'classe_druido deve includere la tabella Forme bestiali'
);

[
  ['classe_bardo', 'Lista degli incantesimi da bardo'],
  ['classe_chierico', 'Lista degli incantesimi da chierico'],
  ['classe_druido', 'Lista degli incantesimi da druido'],
  ['classe_mago', 'Lista degli incantesimi da mago'],
  ['classe_paladino', 'Lista degli incantesimi da paladino'],
  ['classe_ranger', 'Lista degli incantesimi da ranger'],
  ['classe_stregone', 'Lista degli incantesimi da stregone'],
  ['classe_warlock', 'Lista degli incantesimi da warlock'],
].forEach(([ruleId, sectionTitle]) => {
  const section = rules.find((entry) => entry.id === ruleId)?.sezioni.find((entry) => entry.titolo === sectionTitle);

  assert.ok(section, `${ruleId} deve includere ${sectionTitle}`);
  assert.deepEqual(section.colonne, ['Livello', 'Incantesimo', 'Scuola', 'Speciale']);
  assert.ok(section.righe.length > 0, `${sectionTitle} deve avere righe`);
});

[
  ['azioni', 'Abilita', 18],
  ['esplorazione', 'Passo di viaggio', 3],
  ['caratteristiche_allineamento_personaggio', 'Costi in punti del punteggio di caratteristica', 8],
  ['caratteristiche_allineamento_personaggio', 'Serie standard per classe', 12],
  ['avanzamento_livelli_superiori', 'Avanzamento dei personaggi', 20],
  ['avanzamento_livelli_superiori', 'Equipaggiamento a livelli superiori', 4],
  ['multiclasse_e_monili', 'Incantatore multiclasse: slot incantesimo 1-9', 20],
  ['multiclasse_e_monili', 'Monili', 100],
  ['specie_origini_personaggio', 'Antenati draconici', 10],
  ['specie_origini_personaggio', 'Lignaggi elfici', 3],
  ['specie_origini_personaggio', 'Retaggi immondi', 3],
  ['armi', 'Armi principali', 38],
  ['armature', 'Armature complete', 13],
  ['equipaggiamento_avventura', "Equipaggiamento d'avventura: peso e costo", 82],
  ['cavalcature_e_veicoli', 'Finimenti e veicoli da tiro', 10],
  ['cavalcature_e_veicoli', 'Veicoli aerei e imbarcazioni', 7],
  ['spese_servizi_e_stile_di_vita', 'Vitto e alloggio', 17],
  ['spese_servizi_e_stile_di_vita', 'Gregari e servizi magici', 10],
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

console.log('Dati regole SRD OK');
