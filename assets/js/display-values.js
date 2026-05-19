export function formatDisplayValue(value) {
  if (value === null || value === undefined || value === '') return '';

  if (Array.isArray(value)) {
    return value.map(formatDisplayValue).filter(Boolean).join(', ');
  }

  if (typeof value !== 'object') {
    return String(value);
  }

  if (value.raw) return String(value.raw);

  if (value.media !== undefined || value.formula) {
    return [
      value.media,
      value.formula ? `(${value.formula})` : '',
    ].filter((part) => part !== undefined && part !== '').join(' ');
  }

  if (value.punteggio !== undefined || value.modificatore !== undefined) {
    return [
      value.punteggio,
      value.modificatore !== undefined ? `(${formatSigned(value.modificatore)})` : '',
    ].filter((part) => part !== undefined && part !== '').join(' ');
  }

  if (value.valore !== undefined) {
    return formatObjectWithPrimaryValue(value);
  }

  return Object.entries(value)
    .map(([key, entryValue]) => [humanizeKey(key), formatDisplayValue(entryValue)].filter(Boolean).join(' '))
    .filter(Boolean)
    .join(', ');
}

function formatObjectWithPrimaryValue(value) {
  const primary = String(value.valore);
  const details = Object.entries(value)
    .filter(([key, entryValue]) => key !== 'valore' && entryValue !== null && entryValue !== undefined && entryValue !== '')
    .map(([key, entryValue]) => `${humanizeKey(key)} ${formatDisplayValue(entryValue)}`);

  return details.length ? `${primary} (${details.join(', ')})` : primary;
}

function humanizeKey(key) {
  const labels = {
    percezione_passiva: 'Percezione passiva',
    scurovisione: 'scurovisione',
    vista_cieca: 'vista cieca',
    vista_pura: 'vista pura',
    percezione_tellurica: 'percezione tellurica',
    punti_esperienza: 'PE',
    punti_esperienza_tana: 'PE tana',
    tiro_salvezza: 'TS',
    camminata: '',
    volo: 'volo',
    nuoto: 'nuoto',
    scalata: 'scalata',
    scavo: 'scavo',
  };

  if (labels[key]) return labels[key];

  const text = String(key || '').replaceAll('_', ' ');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

function formatSigned(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);

  return number >= 0 ? `+${number}` : String(number);
}
