import { normalizeText } from './app-core.js';
import { formatDisplayValue } from './display-values.js?v=20260519-origins';

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

  if (section === 'classes' || section === 'species') {
    return [];
  }

  if (section === 'backgrounds') {
    return uniqueArrayValues(data.backgrounds, 'punteggi_caratteristica')
      .sort((a, b) => a.localeCompare(b, 'it'))
      .map((value) => ({
        value,
        label: value,
      }));
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
    return catalogValue(item.grado_sfida) === filter;
  }

  if (section === 'spells') {
    return String(item.livello ?? '') === filter;
  }

  if (section === 'rules') {
    return String(item.categoria || '') === filter;
  }

  if (section === 'classes' || section === 'species') {
    return true;
  }

  if (section === 'backgrounds') {
    return normalizeList(item.punteggi_caratteristica).includes(filter);
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
        .map((item) => catalogValue(item[key]))
        .filter((value) => value !== null && value !== undefined && value !== '')
    )
  ).map(String);
}

export function uniqueArrayValues(items, key) {
  return Array.from(
    new Set(
      items
        .flatMap((item) => normalizeList(item[key]))
        .filter((value) => value !== '')
    )
  );
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
  const text = catalogValue(value);

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
    return displayText([item.nome, item.tipo, item.dimensione, item.gruppo, item.grado_sfida]);
  }

  if (section === 'spells') {
    return displayText([
      item.nome,
      item.scuola,
      item.classi,
      item.descrizione,
      item.livello,
    ]);
  }

  if (section === 'rules' || section === 'classes' || section === 'species') {
    return displayText([
      item.nome,
      item.capitolo,
      item.categoria,
      item.tipo_creatura,
      item.taglia,
      item.velocita,
      item.tratti_sintesi,
      item.descrizione,
      ...searchableSectionText(item.sezioni),
    ]);
  }

  if (section === 'backgrounds') {
    return displayText([
      item.nome,
      item.capitolo,
      item.talento_origine,
      item.punteggi_caratteristica,
      item.competenze,
      item.equipaggiamento_alternativo,
      item.descrizione,
      ...searchableSectionText(item.sezioni),
    ]);
  }

  if (section === 'rules_glossary') {
    return displayText([
      item.nome,
      item.lettera,
      item.descrittore,
      item.descrizione,
      item.vedi_anche,
      ...searchableSectionText(item.sezioni),
    ]);
  }

  return displayText([
    item.nome,
    item.tipo,
    item.tipo_base,
    item.rarita,
    item.descrizione,
  ]);
}

/*
 * Crea la riga descrittiva usata sotto il nome nelle liste del catalogo.
 */
export function sectionSummaryLine(section, item, spellLevel) {
  if (section === 'monsters') {
    return [
      item.tipo,
      item.dimensione,
      item.grado_sfida ? `GS ${catalogValue(item.grado_sfida)}` : null,
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

  if (section === 'species') {
    return [
      item.tipo_creatura,
      item.taglia,
      item.velocita,
      item.pagine_sorgente ? `pag. ${item.pagine_sorgente}` : null,
    ].filter(Boolean).join(' · ');
  }

  if (section === 'backgrounds') {
    return [
      normalizeList(item.punteggi_caratteristica).join(', '),
      item.talento_origine,
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
      ? sectionEntry.righe.map((row) => displayText(Object.values(row || {})))
      : []),
    ...(Array.isArray(sectionEntry.blocchi)
      ? sectionEntry.blocchi.map((block) => displayText([block.nome, block.descrizione]))
      : []),
  ]);
}

function displayText(values) {
  return values.map(formatDisplayValue).filter(Boolean).join(' ');
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map((entry) => formatDisplayValue(entry)).filter(Boolean);
  const text = formatDisplayValue(value);
  return text ? [text] : [];
}

function catalogValue(value) {
  if (value && typeof value === 'object' && !Array.isArray(value) && value.valore !== undefined) {
    return String(value.valore);
  }

  return formatDisplayValue(value);
}
