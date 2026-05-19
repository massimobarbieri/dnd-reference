import { normalizeText } from './app-core.js';

/*
 * Restituisce gli elementi filtrati e ordinati alfabeticamente.
 */
export function filterCatalogItems({
  section,
  items,
  searchTerm,
  filter,
  showOnlyFavorites,
  isFavorite,
}) {
  const term = normalizeText(searchTerm);

  return items
    .filter((item) => !showOnlyFavorites || isFavorite(section, item.id))
    .filter((item) => matchesSectionFilter(section, item, filter))
    .filter((item) => !term || normalizeText(searchableText(section, item)).includes(term))
    .sort((a, b) => sortItems(section, a, b));
}

/*
 * Mantiene le regole nell'ordine del PDF; le altre sezioni restano alfabetiche.
 */
export function sortItems(section, a, b) {
  if (section === 'rules') {
    return sourcePageValue(a.pagine_sorgente) - sourcePageValue(b.pagine_sorgente);
  }

  return String(a.nome || '').localeCompare(String(b.nome || ''), 'it');
}

/*
 * Genera le opzioni del filtro in base alla sezione.
 */
export function createFilterOptions(section, data, spellLevel) {
  if (section === 'monsters') {
    return uniqueValues(data.monsters, 'grado_sfida')
      .sort((a, b) => challengeRatingValue(a) - challengeRatingValue(b))
      .map((value) => ({ value, label: `GS ${value}` }));
  }

  if (section === 'spells') {
    return uniqueValues(data.spells, 'livello')
      .sort((a, b) => Number(a) - Number(b))
      .map((value) => ({
        value: String(value),
        label: spellLevel({ livello: Number(value) }),
      }));
  }

  if (section === 'rules') {
    return uniqueValues(data.rules, 'categoria')
      .map((value) => ({
        value,
        label: value,
      }));
  }

  if (section === 'classes') {
    return [];
  }

  if (section === 'rules_glossary') {
    return uniqueValues(data.rules_glossary, 'descrittore')
      .sort((a, b) => a.localeCompare(b, 'it'))
      .map((value) => ({
        value,
        label: capitalizeFirst(value),
      }));
  }

  return uniqueValues(data.magic_items, 'rarita')
    .sort((a, b) => a.localeCompare(b, 'it'))
    .map((value) => ({
      value,
      label: capitalizeFirst(value),
    }));
}

/*
 * Verifica se un elemento passa il filtro selezionato.
 */
export function matchesSectionFilter(section, item, filter) {
  if (!filter) return true;

  if (section === 'monsters') {
    return String(item.grado_sfida || '') === filter;
  }

  if (section === 'spells') {
    return String(item.livello ?? '') === filter;
  }

  if (section === 'rules') {
    return String(item.categoria || '') === filter;
  }

  if (section === 'classes') {
    return true;
  }

  if (section === 'rules_glossary') {
    return String(item.descrittore || '') === filter;
  }

  return String(item.rarita || '') === filter;
}

/*
 * Estrae valori unici da una lista di oggetti.
 */
export function uniqueValues(items, key) {
  return Array.from(
    new Set(
      items
        .map((item) => item[key])
        .filter((value) => value !== null && value !== undefined && value !== '')
    )
  ).map(String);
}

/*
 * Prima pagina sorgente di una voce, usata per ordinare le regole come nel PDF.
 */
export function sourcePageValue(value) {
  const [page] = String(value || '').match(/\d+/) || [];

  return page ? Number(page) : Number.POSITIVE_INFINITY;
}

/*
 * Converte il grado sfida in numero per ordinarlo correttamente.
 * Esempio:
 * "1/2" -> 0.5
 * "2"   -> 2
 */
export function challengeRatingValue(value) {
  const text = String(value);

  if (text.includes('/')) {
    const [numerator, denominator] = text.split('/').map(Number);
    return numerator / denominator;
  }

  return Number(text);
}

/*
 * Mette in maiuscolo la prima lettera di una stringa.
 */
export function capitalizeFirst(value) {
  const text = String(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

/*
 * Costruisce il testo usato dalla ricerca.
 * Include campi diversi in base alla sezione.
 */
export function searchableText(section, item) {
  if (section === 'monsters') {
    return [item.nome, item.tipo, item.dimensione, item.gruppo, item.grado_sfida].join(' ');
  }

  if (section === 'spells') {
    return [
      item.nome,
      item.scuola,
      item.classi?.join(' '),
      item.descrizione,
      item.livello,
    ].join(' ');
  }

  if (section === 'rules' || section === 'classes') {
    return [
      item.nome,
      item.capitolo,
      item.categoria,
      item.descrizione,
      ...searchableSectionText(item.sezioni),
    ].join(' ');
  }

  if (section === 'rules_glossary') {
    return [
      item.nome,
      item.lettera,
      item.descrittore,
      item.descrizione,
      item.vedi_anche?.join(' '),
      ...searchableSectionText(item.sezioni),
    ].join(' ');
  }

  return [
    item.nome,
    item.tipo,
    item.tipo_base,
    item.rarita,
    item.descrizione,
  ].join(' ');
}

/*
 * Crea la riga descrittiva usata sotto il nome nelle liste del catalogo.
 */
export function sectionSummaryLine(section, item, spellLevel) {
  if (section === 'monsters') {
    return [
      item.tipo,
      item.dimensione,
      item.grado_sfida ? `GS ${item.grado_sfida}` : null,
    ].filter(Boolean).join(' · ');
  }

  if (section === 'spells') {
    return [
      spellLevel(item),
      item.scuola,
      item.tempo_lancio,
    ].filter(Boolean).join(' · ');
  }

  if (section === 'rules' || section === 'classes') {
    return [
      item.categoria,
      item.pagine_sorgente ? `pag. ${item.pagine_sorgente}` : null,
    ].filter(Boolean).join(' · ');
  }

  if (section === 'rules_glossary') {
    return [
      item.descrittore ? capitalizeFirst(item.descrittore) : `Lettera ${item.lettera}`,
      item.pagine_sorgente ? `pag. ${item.pagine_sorgente}` : null,
    ].filter(Boolean).join(' · ');
  }

  return [
    item.tipo_base || item.tipo,
    item.rarita,
    item.richiede_sintonia ? 'sintonia' : null,
  ].filter(Boolean).join(' · ');
}

/*
 * Estrae testo ricercabile dalle sezioni strutturate delle voci SRD.
 */
function searchableSectionText(sections) {
  if (!Array.isArray(sections)) return [];

  return sections.flatMap((sectionEntry) => [
    sectionEntry.titolo,
    sectionEntry.descrizione,
    ...(Array.isArray(sectionEntry.righe)
      ? sectionEntry.righe.map((row) => Object.values(row || {}).join(' '))
      : []),
    ...(Array.isArray(sectionEntry.blocchi)
      ? sectionEntry.blocchi.map((block) => `${block.nome || ''} ${block.descrizione || ''}`)
      : []),
  ]);
}
