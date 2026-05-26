const assert = require('node:assert/strict');
const { createAppTestContext, loadAppModule } = require('./helpers/app-module');

(async () => {
  const { context, views } = createAppTestContext();
  const api = await loadAppModule(context);
  assert.ok(api, 'gli internals di test devono essere esposti solo in ambiente test');

  const localSheet = api.normalizeCharacterSheet({ id: 'sheet-local', name: 'Locale', level: 1 });
  api.appState.characterSheet = localSheet;
  api.appState.characterSheets = [localSheet];
  api.appState.activeCharacterSheetId = localSheet.id;
  api.saveCharacterSheet();

  api.exportCharacterSheet();
  const exportedLink = context.createdElements.at(-1);
  assert.match(exportedLink.download, /^dnd-reference-personaggio-locale-\d{4}-\d{2}-\d{2}\.json$/);
  assert.match(api.appState.characterSheetNotice, /Esportato Locale/);

  api.appState.pendingCharacterSheetArchive = api.normalizeCharacterSheetArchive({
    activeCharacterSheetId: 'sheet-imported',
    sheets: [{ id: 'sheet-imported', schemaVersion: 8, name: 'Importata', level: 2 }],
  });
  api.renderCharacterSheet('overview');
  assert.match(views['#detail-view'].innerHTML, /Import archivio schede/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-import-archive-mode="unisci"/);
  assert.match(views['#detail-view'].innerHTML, /data-sheet-import-archive-mode="sostituisci"/);

  api.applyCharacterSheetArchiveImport('unisci');
  assert.equal(api.appState.characterSheets.length, 2);
  assert.equal(api.appState.characterSheet.id, 'sheet-imported');
  assert.match(api.appState.characterSheetNotice, /Archivio unito/);
  assert.equal(JSON.parse(context.localStorage.getItem('dnd-reference:character-sheets')).length, 2);

  api.appState.pendingCharacterSheetArchive = api.normalizeCharacterSheetArchive({
    activeCharacterSheetId: 'sheet-replacement',
    sheets: [{ id: 'sheet-replacement', schemaVersion: 8, name: 'Sostituita', level: 3 }],
  });
  api.applyCharacterSheetArchiveImport('sostituisci');
  assert.deepEqual(api.appState.characterSheets.map((sheet) => sheet.id), ['sheet-replacement']);
  assert.equal(api.appState.characterSheet.name, 'Sostituita');
  assert.match(api.appState.characterSheetNotice, /Archivio sostituito/);

  context.localStorage.setItem('external:key', 'preserve');
  context.localStorage.setItem('dnd-reference:old', 'remove');
  api.appState.pendingAppBackup = api.normalizeAppBackup({
    kind: 'dnd-reference:app-backup',
    schemaVersion: 1,
    storage: {
      'dnd-reference:favorites': '{"monsters":["goblin"]}',
      'dnd-reference:active-character-sheet': 'sheet-backup',
      'dnd-reference:character-sheets': JSON.stringify([
        { id: 'sheet-backup', schemaVersion: 8, name: 'Backup', level: 4 },
      ]),
      'external:key': 'ignored',
    },
  });
  api.appState.characterSheetNotice = 'Backup app caricato: controlla il riepilogo prima di ripristinare.';
  api.renderCharacterSheet('overview');
  assert.match(views['#detail-view'].innerHTML, /Import backup app/);
  assert.match(views['#detail-view'].innerHTML, /Backup app caricato/);
  assert.match(views['#detail-view'].innerHTML, /data-app-import-backup-apply/);
  assert.match(views['#detail-view'].innerHTML, /data-app-import-backup-cancel/);

  api.applyAppBackupImport();
  assert.equal(context.localStorage.getItem('external:key'), 'preserve');
  assert.equal(context.localStorage.getItem('dnd-reference:old'), null);
  assert.equal(JSON.stringify(api.appState.favorites), '{"monsters":["goblin"]}');
  assert.equal(api.appState.characterSheet.id, 'sheet-backup');
  assert.equal(api.appState.characterSheet.name, 'Backup');

  console.log('Flussi import archivio e backup OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
