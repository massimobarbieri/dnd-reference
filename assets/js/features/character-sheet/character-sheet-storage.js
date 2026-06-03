import {
  normalizeCharacterSheet,
  uniqueCharacterSheets,
  createCharacterSheetId,
  cloneJson,
} from './character-sheet-normalizers.js?v=20260531-1';

let appState = null;

export function setCharacterSheetStorageState(state) {
  appState = state;
}

export function readJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/*
 * Salva archivio e scheda attiva. La vecchia chiave singola resta aggiornata
 * per compatibilita con esportazioni/manual debug precedenti.
 */
export function saveCharacterSheet() {
  const index = appState.characterSheets.findIndex((sheet) => sheet.id === appState.characterSheet.id);
  if (index >= 0) {
    appState.characterSheets[index] = appState.characterSheet;
  } else {
    appState.characterSheets.push(appState.characterSheet);
  }

  appState.activeCharacterSheetId = appState.characterSheet.id;
  localStorage.setItem(CHARACTER_SHEETS_STORAGE_KEY, JSON.stringify(appState.characterSheets));
  localStorage.setItem(ACTIVE_CHARACTER_SHEET_STORAGE_KEY, appState.activeCharacterSheetId);
  localStorage.setItem(CHARACTER_SHEET_STORAGE_KEY, JSON.stringify(appState.characterSheet));
  appState.data.character_sheet = [appState.characterSheet];
}

/*
 * Carica l'archivio multi-personaggio. Se esiste solo la vecchia chiave
 * singola, la migra come prima scheda senza richiedere azioni all'utente.
 */
export function loadCharacterSheetArchive() {
  const storedSheets = readJsonStorage(CHARACTER_SHEETS_STORAGE_KEY, null);
  const legacySheet = readJsonStorage(CHARACTER_SHEET_STORAGE_KEY, null);
  const rawSheets = Array.isArray(storedSheets) && storedSheets.length
    ? storedSheets
    : [legacySheet && typeof legacySheet === 'object' ? legacySheet : {}];

  appState.characterSheets = uniqueCharacterSheets(rawSheets.map(normalizeCharacterSheet));
  appState.activeCharacterSheetId = localStorage.getItem(ACTIVE_CHARACTER_SHEET_STORAGE_KEY) || appState.characterSheets[0]?.id || '';
  appState.characterSheet = appState.characterSheets.find((sheet) => sheet.id === appState.activeCharacterSheetId) || appState.characterSheets[0];
  appState.activeCharacterSheetId = appState.characterSheet.id;
  saveCharacterSheet();
}

export function switchCharacterSheet(id) {
  const next = appState.characterSheets.find((sheet) => sheet.id === id);
  if (!next) return false;

  saveCharacterSheet();
  appState.characterSheet = next;
  appState.activeCharacterSheetId = next.id;
  saveCharacterSheet();
  return true;
}

export function createNewCharacterSheet() {
  saveCharacterSheet();
  appState.characterSheet = normalizeCharacterSheet({ name: 'Nuovo personaggio' });
  appState.characterSheets.push(appState.characterSheet);
  saveCharacterSheet();
}

export function duplicateCharacterSheet() {
  const copy = normalizeCharacterSheet({
    ...cloneJson(appState.characterSheet),
    id: createCharacterSheetId(),
    name: `${appState.characterSheet.name || 'Personaggio'} copia`,
  });

  saveCharacterSheet();
  appState.characterSheet = copy;
  appState.characterSheets.push(copy);
  saveCharacterSheet();
}

export function deleteActiveCharacterSheet() {
  if (appState.characterSheets.length <= 1) return false;

  const currentId = appState.characterSheet.id;
  appState.characterSheets = appState.characterSheets.filter((sheet) => sheet.id !== currentId);
  appState.characterSheet = appState.characterSheets[0];
  saveCharacterSheet();
  return true;
}

export function mergeCharacterSheetArchives(currentSheets, importedSheets) {
  const byId = new Map();

  currentSheets.forEach((sheet) => {
    if (sheet?.id) byId.set(sheet.id, sheet);
  });

  importedSheets.forEach((sheet) => {
    if (!sheet?.id || byId.has(sheet.id)) return;
    byId.set(sheet.id, sheet);
  });

  return uniqueCharacterSheets([...byId.values()].map(normalizeCharacterSheet));
}

/*
 * Normalizza un archivio esportato con piu schede. L'import sostituisce
 * l'archivio locale, quindi qui garantiamo almeno una scheda valida.
 */
export function normalizeCharacterSheetArchive(value) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.sheets)) {
    throw new Error('Archivio schede non valido');
  }

  const sheets = uniqueCharacterSheets(value.sheets.map(normalizeCharacterSheet));
  if (!sheets.length) throw new Error('Archivio schede vuoto');

  const activeCharacterSheetId = String(value.activeCharacterSheetId || '');

  return {
    activeCharacterSheetId,
    sheets,
  };
}

export const CHARACTER_SHEET_STORAGE_KEY = 'dnd-reference:character-sheet';
export const CHARACTER_SHEETS_STORAGE_KEY = 'dnd-reference:character-sheets';
export const ACTIVE_CHARACTER_SHEET_STORAGE_KEY = 'dnd-reference:active-character-sheet';
export const APP_STORAGE_PREFIX = 'dnd-reference:';
