const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

(async () => {
  const controllerUrl = pathToFileURL(`${process.cwd()}/assets/js/reference-view-controller.js`).href;
  const { renderReferenceSheetActions } = await import(controllerUrl);

  const html = renderReferenceSheetActions({
    section: 'rules',
    item: { id: 'cover', nome: 'Copertura' },
    escapeAttr,
  });

  assert.match(html, /data-sheet-add-reference="cover"/);
  assert.match(html, /href="#\/character_sheet\/notes"/);

  const monsterHtml = renderReferenceSheetActions({
    section: 'monsters',
    item: { id: 'aboleth', nome: 'Aboleth' },
    escapeAttr,
  });

  assert.match(monsterHtml, /Collega alla scheda/);

  console.log('Azioni scheda su riferimenti SRD OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function escapeAttr(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
