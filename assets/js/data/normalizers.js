export function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizeMagicItem(item) {
  return {
    ...item,
    rarita: normalizeMagicItemRarity(item.rarita),
  };
}

export function normalizeMonster(monster) {
  const challenge = normalizeChallengeRating(monster.grado_sfida);

  return {
    ...monster,
    statistiche: {
      classe_armatura: formatArmorClass(monster.classe_armatura),
      punti_ferita: formatHitPoints(monster.punti_ferita),
      velocita: formatSpeed(monster.velocita),
      iniziativa: formatInitiative(monster.iniziativa),
    },
    caratteristiche: normalizeMonsterAbilities(monster.caratteristiche),
    abilita: formatBonusMap(monster.abilita),
    sensi: formatSenses(monster.sensi),
    lingue: formatList(monster.lingue),
    grado_sfida: challenge.value,
    grado_sfida_raw: challenge.raw,
    resistenze: formatList(monster.resistenze),
    immunita_danni: formatList(monster.immunita_danni),
    immunita_condizione: formatList(monster.immunita_condizione),
    vulnerabilita: formatList(monster.vulnerabilita),
    attrezzatura: formatList(monster.attrezzatura || monster.equipaggiamento),
  };
}

export function normalizeChallengeRating(value) {
  if (!value || typeof value !== 'object') {
    const text = String(value ?? '').trim();
    return { value: text, raw: text };
  }

  const rating = String(value.valore ?? '').trim();
  const raw = String(value.raw || '').trim();
  const xp = value.punti_esperienza ? `PE ${formatItalianNumber(value.punti_esperienza)}` : '';
  const lairXp = value.punti_esperienza_tana ? `PE ${formatItalianNumber(value.punti_esperienza_tana)} nella tana` : '';

  return {
    value: rating,
    raw: raw || [rating, [xp, lairXp].filter(Boolean).join(', ')].filter(Boolean).join(' (') + (xp || lairXp ? ')' : ''),
  };
}

export function normalizeMagicItemRarity(rarity) {
  const text = String(rarity || '').trim().toLowerCase();

  if (!text) return '';

  if (
    text.includes(',') ||
    text.includes(' o ') ||
    text.includes('variabile')
  ) {
    return 'rarità variabile';
  }

  const canonicalRarities = {
    raro: 'rara',
    rara: 'rara',
    'molto raro': 'molto rara',
    'molto rara': 'molto rara',
    leggendario: 'leggendaria',
    leggendaria: 'leggendaria',
  };

  return canonicalRarities[text] || text;
}

function normalizeMonsterAbilities(abilities) {
  if (!abilities || typeof abilities !== 'object') return {};

  return Object.fromEntries(Object.entries(abilities).map(([key, value]) => [
    key,
    {
      valore: value?.punteggio,
      modificatore: formatSignedBonus(value?.modificatore),
      tiro_salvezza: formatSignedBonus(value?.tiro_salvezza),
    },
  ]));
}

function formatArmorClass(value) {
  return formatPrimitive(value);
}

function formatHitPoints(value) {
  if (!value || typeof value !== 'object') return formatPrimitive(value);

  return [
    value.media,
    value.formula ? `(${value.formula})` : '',
  ].filter((part) => part !== '').join(' ');
}

function formatSpeed(value) {
  if (!value || typeof value !== 'object') return formatPrimitive(value);

  const labels = {
    camminata: '',
    volo: 'volo',
    nuoto: 'nuoto',
    scalata: 'scalata',
    scavo: 'scavo',
  };

  return Object.entries(value)
    .map(([key, speed]) => [labels[key] ?? key.replaceAll('_', ' '), speed].filter(Boolean).join(' '))
    .join(', ');
}

function formatInitiative(value) {
  if (!value || typeof value !== 'object') return formatPrimitive(value);

  return [
    formatSignedBonus(value.bonus),
    value.valore !== undefined ? `(${value.valore})` : '',
  ].filter(Boolean).join(' ');
}

function formatSenses(value) {
  if (!value || typeof value !== 'object') return formatPrimitive(value);

  const labels = {
    percezione_passiva: 'Percezione passiva',
    scurovisione: 'scurovisione',
    vista_cieca: 'vista cieca',
    vista_pura: 'vista pura',
    percezione_tellurica: 'percezione tellurica',
  };

  return Object.entries(value)
    .map(([key, sense]) => `${labels[key] ?? key.replaceAll('_', ' ')} ${sense}`)
    .join(', ');
}

function formatBonusMap(value) {
  if (!value || typeof value !== 'object') return formatPrimitive(value);

  return Object.entries(value)
    .map(([key, bonus]) => `${capitalizeFirst(key.replaceAll('_', ' '))} ${formatSignedBonus(bonus)}`)
    .join(', ');
}

function formatList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return formatPrimitive(value);
}

function formatPrimitive(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function formatSignedBonus(value) {
  if (value === null || value === undefined || value === '') return '';

  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);

  return number >= 0 ? `+${number}` : String(number);
}

function formatItalianNumber(value) {
  return new Intl.NumberFormat('it-IT').format(value);
}

function capitalizeFirst(value) {
  const text = String(value || '');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}
