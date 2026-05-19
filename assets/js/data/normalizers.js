export function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizeMagicItem(item) {
  return {
    ...item,
    rarita: normalizeMagicItemRarity(item.rarita),
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