const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

(async () => {
  const workflowUrl = pathToFileURL(`${process.cwd()}/assets/js/features/character-sheet/character-sheet-backup-workflow.js`).href;
  const {
    CHARACTER_SHEET_BACKUP_ACTIONS,
    createCharacterSheetBackupWorkflow,
  } = await import(workflowUrl);

  assert.deepEqual(CHARACTER_SHEET_BACKUP_ACTIONS, [
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
  ]);

  const appState = {
    characterSheet: { id: 'sheet-1', name: 'Test' },
    characterSheets: [],
    favorites: {},
  };

  const actions = createCharacterSheetBackupWorkflow({
    appState,
    renderCharacterSheet() {},
    renderRoute() {},
    saveCharacterSheet() {},
    normalizeCharacterSheet: (sheet) => sheet,
    createCharacterSheetId: () => 'sheet-new',
    normalizeCharacterSheetArchive: (archive) => archive,
    mergeCharacterSheetArchives: (localSheets, importedSheets) => [...localSheets, ...importedSheets],
    characterSheetSchemaVersion: 8,
    appStoragePrefix: 'dnd-reference:',
    loadFavorites: () => ({ monsters: ['goblin'] }),
    loadCharacterSheetArchive() {},
  });

  for (const actionName of CHARACTER_SHEET_BACKUP_ACTIONS) {
    assert.equal(typeof actions[actionName], 'function', `${actionName} deve essere una funzione`);
  }

  assert.deepEqual(
    actions.normalizeAppBackup({
      kind: 'dnd-reference:app-backup',
      storage: {
        'dnd-reference:favorites': '{"monsters":["goblin"]}',
        'external:key': 'ignored',
      },
    }),
    {
      storage: {
        'dnd-reference:favorites': '{"monsters":["goblin"]}',
      },
    }
  );

  assert.throws(
    () => actions.normalizeAppBackup({ kind: 'other', storage: {} }),
    /Backup app non valido/
  );

  console.log('Workflow backup scheda personaggio OK');
})();
