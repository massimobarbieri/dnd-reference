const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

(async () => {
  const normalizersUrl = pathToFileURL(`${process.cwd()}/assets/js/data/normalizers.js`).href;
  const {
    normalizeChallengeRating,
    normalizeMonster,
  } = await import(normalizersUrl);

  assert.deepEqual(
    normalizeChallengeRating({
      valore: 10,
      punti_esperienza: 5900,
      raw: '10 (PE 5.900; BC +4)',
    }),
    {
      value: '10',
      raw: '10 (PE 5.900; BC +4)',
    }
  );

  const monster = normalizeMonster({
    id: 'aboleth',
    nome: 'Aboleth',
    classe_armatura: 17,
    iniziativa: { valore: 17, bonus: 7 },
    punti_ferita: { media: 150, formula: '20d10 + 40' },
    velocita: { camminata: '3 m', nuoto: '12 m' },
    caratteristiche: {
      forza: { punteggio: 21, modificatore: 5, tiro_salvezza: 5 },
      destrezza: { punteggio: 9, modificatore: -1, tiro_salvezza: 3 },
    },
    abilita: { percezione: 10, storia: 12 },
    sensi: { percezione_passiva: 20, scurovisione: '36 m' },
    lingue: ['Gergo delle Profondità', 'telepatia 36 m'],
    grado_sfida: {
      valore: 10,
      punti_esperienza: 5900,
      punti_esperienza_tana: 7200,
      raw: '10 (PE 5.900, o 7.200 nella tana; BC +4)',
    },
    bonus_competenza: 4,
    immunita_condizione: ['affascinato', 'privo di sensi'],
  });

  assert.equal(monster.statistiche.classe_armatura, '17');
  assert.equal(monster.statistiche.punti_ferita, '150 (20d10 + 40)');
  assert.equal(monster.statistiche.velocita, '3 m, nuoto 12 m');
  assert.equal(monster.statistiche.iniziativa, '+7 (17)');
  assert.equal(monster.caratteristiche.forza.valore, 21);
  assert.equal(monster.caratteristiche.forza.modificatore, '+5');
  assert.equal(monster.caratteristiche.destrezza.modificatore, '-1');
  assert.equal(monster.abilita, 'Percezione +10, Storia +12');
  assert.equal(monster.sensi, 'Percezione passiva 20, scurovisione 36 m');
  assert.equal(monster.lingue, 'Gergo delle Profondità, telepatia 36 m');
  assert.equal(monster.grado_sfida, '10');
  assert.equal(monster.grado_sfida_raw, '10 (PE 5.900, o 7.200 nella tana; BC +4)');
  assert.equal(monster.immunita_condizione, 'affascinato, privo di sensi');

  Object.values(monster.statistiche).forEach((value) => {
    assert.notEqual(value, '[object Object]');
  });

  console.log('Normalizzazione mostri OK');
})();
