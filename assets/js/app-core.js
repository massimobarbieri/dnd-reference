const FAVORITES_STORAGE_KEY = 'dnd-reference:favorites';

/*
 * Utility condivise dal bootstrap e dai renderer.
 * Restano qui per evitare micro-moduli separati per escaping, routing e preferiti.
 */

/*
 * Escapa caratteri HTML per prevenire injection nel markup generato.
 */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  }[char]));
}

/*
 * Escapa valori destinati agli attributi HTML.
 */
export function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

/*
 * Escapa una stringa da usare in una RegExp dinamica.
 */
export function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/*
 * Normalizza testo per ricerca e confronti tolleranti ad accenti/maiuscole.
 */
export function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/*
 * Mantiene compatibili i vecchi link alle classi quando erano incluse
 * nelle regole con id classe_*.
 */
export function legacyClassId(id) {
  const value = String(id || '');
  return value.startsWith('classe_') ? value.slice('classe_'.length) : '';
}

/*
 * Converte l'hash dell'URL in una rotta interna minimale.
 */
export function parseHash(hash) {
  const clean = String(hash || '').replace(/^#\/?/, '');
  const [section, id] = clean.split('/');

  return {
    section,
    id: id ? decodeURIComponent(id) : null,
  };
}

/*
 * Legge i preferiti dal localStorage. Se il JSON e corrotto, riparte vuoto.
 */
export function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

/*
 * Salva i preferiti nel localStorage.
 */
export function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
}

/*
 * Verifica se una voce appartiene ai preferiti della sezione.
 */
export function hasFavorite(favorites, section, id) {
  return Boolean(favorites[section]?.includes(id));
}

/*
 * Restituisce una nuova struttura preferiti con la voce aggiunta o rimossa.
 */
export function toggleFavorite(favorites, section, id) {
  const current = new Set(favorites[section] || []);

  if (current.has(id)) {
    current.delete(id);
  } else {
    current.add(id);
  }

  return {
    ...favorites,
    [section]: Array.from(current),
  };
}
