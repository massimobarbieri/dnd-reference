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

  const speciesHtml = renderReferenceSheetActions({
    section: 'species',
    item: { id: 'elfo', nome: 'Elfo' },
    escapeAttr,
  });

  assert.match(speciesHtml, /data-sheet-use-species="elfo"/);
  assert.match(speciesHtml, /Usa per scheda/);

  const backgroundHtml = renderReferenceSheetActions({
    section: 'backgrounds',
    item: { id: 'accolito', nome: 'Accolito' },
    escapeAttr,
  });

  assert.match(backgroundHtml, /data-sheet-use-background="accolito"/);

  const equipmentHtml = renderReferenceSheetActions({
    section: 'equipment',
    item: { id: 'pugnale', nome: 'Pugnale' },
    escapeAttr,
  });

  assert.match(equipmentHtml, /data-sheet-add-equipment-item="pugnale"/);

  const languageHtml = renderReferenceSheetActions({
    section: 'languages',
    item: { id: 'comune', nome: 'Comune' },
    escapeAttr,
  });

  assert.match(languageHtml, /data-sheet-use-language="comune"/);

  const featHtml = renderReferenceSheetActions({
    section: 'feats',
    item: { id: 'abile', nome: 'Abile' },
    escapeAttr,
  });

  assert.match(featHtml, /data-sheet-add-reference="abile"/);

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
