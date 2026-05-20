import { createCharacterSheetBackupController } from './character-sheet-backup.js?v=20260520-guided';

export const CHARACTER_SHEET_BACKUP_ACTIONS = [
  'applyAppBackupImport',
  'applyCharacterSheetArchiveImport',
  'exportAppBackup',
  'exportCharacterSheet',
  'exportCharacterSheetArchive',
  'importAppBackup',
  'importCharacterSheet',
  'importCharacterSheetArchive',
  'normalizeAppBackup',
  'restoreAppBackup',
];

export function createCharacterSheetBackupWorkflow({
  appState,
  renderCharacterSheet,
  renderRoute,
  saveCharacterSheet,
  normalizeCharacterSheet,
  createCharacterSheetId,
  normalizeCharacterSheetArchive,
  mergeCharacterSheetArchives,
  characterSheetSchemaVersion,
  appStoragePrefix,
  loadFavorites,
  loadCharacterSheetArchive,
}) {
  return createCharacterSheetBackupController({
    appState,
    renderCharacterSheet,
    renderRoute,
    saveCharacterSheet,
    normalizeCharacterSheet,
    createCharacterSheetId,
    normalizeCharacterSheetArchive,
    mergeCharacterSheetArchives,
    CHARACTER_SHEET_SCHEMA_VERSION: characterSheetSchemaVersion,
    APP_STORAGE_PREFIX: appStoragePrefix,
    loadFavorites,
    loadCharacterSheetArchive,
  });
}
