export function createCharacterSheetBackupController({
  appState,
  renderCharacterSheet,
  renderRoute,
  saveCharacterSheet,
  normalizeCharacterSheet,
  createCharacterSheetId,
  normalizeCharacterSheetArchive,
  mergeCharacterSheetArchives,
  CHARACTER_SHEET_SCHEMA_VERSION,
  APP_STORAGE_PREFIX,
  loadFavorites,
  loadCharacterSheetArchive,
}) {
  /*
   * Gestisce export/import della scheda e backup completo dell'app.
   * Riceve dipendenze esplicite per non accoppiare questo modulo al bootstrap.
   */

  /*
   * Esporta solo la scheda attiva.
   */
  function exportCharacterSheet() {
    const filename = characterSheetFilename(appState.characterSheet);
    downloadJson(
      appState.characterSheet,
      filename
    );
    setNotice(`Esportato ${appState.characterSheet.name || 'personaggio'} in ${filename}.`);
  }

  /*
   * Importa una scheda singola come nuovo personaggio con id rigenerato.
   */
  function importCharacterSheet(event) {
    readUploadedJson(event, (value) => {
      try {
        appState.characterSheet = normalizeCharacterSheet({
          ...value,
          id: createCharacterSheetId(),
        });
        appState.characterSheets.push(appState.characterSheet);
        saveCharacterSheet();
        setNotice(`Importato ${appState.characterSheet.name || 'personaggio'} come nuova scheda.`);
        renderCharacterSheet('overview');
      } catch {
        alert('File scheda non valido.');
      }
    });
  }

  /*
   * Esporta l'archivio completo delle schede personaggio.
   */
  function exportCharacterSheetArchive() {
    saveCharacterSheet();
    const filename = `dnd-reference-schede-${dateStamp()}.json`;
    downloadJson({
      kind: 'dnd-reference:character-sheets',
      schemaVersion: CHARACTER_SHEET_SCHEMA_VERSION,
      activeCharacterSheetId: appState.activeCharacterSheetId,
      sheets: appState.characterSheets,
    }, filename);
    setNotice(`Archivio esportato: ${appState.characterSheets.length} schede in ${filename}.`);
  }

  /*
   * Carica un archivio schede e lo mette in attesa di conferma UI.
   */
  function importCharacterSheetArchive(event) {
    readUploadedJson(event, (value) => {
      try {
        appState.pendingCharacterSheetArchive = normalizeCharacterSheetArchive(value);
        setNotice('Archivio caricato: scegli se unire o sostituire le schede locali.');
        renderCharacterSheet(appState.characterSheetTab);
      } catch {
        alert('Archivio schede non valido.');
      }
    });
  }

  /*
   * Applica l'archivio importato: merge con quello locale o sostituzione.
   */
  function applyCharacterSheetArchiveImport(mode) {
    const archive = appState.pendingCharacterSheetArchive;
    if (!archive || !['unisci', 'sostituisci'].includes(mode)) return;

    saveCharacterSheet();
    appState.characterSheets = mode === 'unisci'
      ? mergeCharacterSheetArchives(appState.characterSheets, archive.sheets)
      : archive.sheets;
    appState.pendingCharacterSheetArchive = null;
    appState.activeCharacterSheetId = archive.activeCharacterSheetId;
    appState.characterSheet = appState.characterSheets.find((sheet) => sheet.id === appState.activeCharacterSheetId) || appState.characterSheets[0];
    appState.activeCharacterSheetId = appState.characterSheet.id;
    saveCharacterSheet();
    setNotice(mode === 'unisci'
      ? `Archivio unito: ora hai ${appState.characterSheets.length} schede.`
      : `Archivio sostituito: ora hai ${appState.characterSheets.length} schede.`);
    renderCharacterSheet('overview');
  }

  /*
   * Esporta tutte le chiavi localStorage dell'app, non solo le schede.
   */
  function exportAppBackup() {
    saveCharacterSheet();
    const storage = {};

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(APP_STORAGE_PREFIX)) {
        storage[key] = localStorage.getItem(key);
      }
    }

    downloadJson({
      kind: 'dnd-reference:app-backup',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      storage,
    }, `dnd-reference-backup-${new Date().toISOString().slice(0, 10)}.json`);
    setNotice('Backup app esportato.');
  }

  /*
   * Carica un backup app e lo mette in attesa di conferma UI.
   */
  function importAppBackup(event) {
    readUploadedJson(event, (value) => {
      try {
        appState.pendingAppBackup = normalizeAppBackup(value);
        setNotice('Backup app caricato: controlla il riepilogo prima di ripristinare.');
        renderCharacterSheet(appState.characterSheetTab);
      } catch {
        alert('Backup app non valido.');
      }
    });
  }

  /*
   * Ripristina il backup completo e ricarica lo stato derivato.
   */
  function applyAppBackupImport() {
    if (!appState.pendingAppBackup) return;

    restoreAppBackup(appState.pendingAppBackup);
    appState.pendingAppBackup = null;
    setNotice('Backup app ripristinato.');
    renderRoute();
  }

  /*
   * Valida il formato del backup e scarta chiavi esterne al namespace app.
   */
  function normalizeAppBackup(value) {
    if (!value || typeof value !== 'object' || value.kind !== 'dnd-reference:app-backup') {
      throw new Error('Backup app non valido');
    }

    const rawStorage = value.storage && typeof value.storage === 'object' ? value.storage : null;
    if (!rawStorage) throw new Error('Backup app senza storage');

    const storage = Object.fromEntries(Object.entries(rawStorage)
      .filter(([key, storedValue]) => key.startsWith(APP_STORAGE_PREFIX) && typeof storedValue === 'string'));

    if (!Object.keys(storage).length) throw new Error('Backup app vuoto');

    return { storage };
  }

  /*
   * Sostituisce le chiavi localStorage dell'app con quelle del backup.
   */
  function restoreAppBackup(backup) {
    const keys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(APP_STORAGE_PREFIX)) keys.push(key);
    }

    keys.forEach((key) => localStorage.removeItem(key));
    Object.entries(backup.storage).forEach(([key, value]) => localStorage.setItem(key, value));
    appState.favorites = loadFavorites();
    loadCharacterSheetArchive();
  }

  function setNotice(message) {
    appState.characterSheetNotice = message;
  }

  return {
    applyAppBackupImport,
    applyCharacterSheetArchiveImport,
    exportAppBackup,
    exportCharacterSheet,
    exportCharacterSheetArchive,
    importAppBackup,
    importCharacterSheet,
    importCharacterSheetArchive,
    normalizeAppBackup,
    restoreAppBackup,
  };
}

/*
 * Legge un file JSON da input file e passa il contenuto parsato al callback.
 */
function readUploadedJson(event, onValue) {
  const [file] = event.currentTarget.files || [];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener('load', () => onValue(JSON.parse(reader.result)));
  reader.readAsText(file);
  event.currentTarget.value = '';
}

/*
 * Scarica un oggetto come file JSON.
 */
function downloadJson(value, filename) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function characterSheetFilename(sheet) {
  return `dnd-reference-personaggio-${fileSafeName(sheet?.name || 'personaggio')}-${dateStamp()}.json`;
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

/*
 * Converte un nome personaggio in un filename portabile.
 */
function fileSafeName(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'personaggio';
}
