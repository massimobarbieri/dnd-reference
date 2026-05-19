const assert = require('node:assert/strict');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

(async () => {
  const { parseMonsterImages } = await import(pathToFileURL(`${process.cwd()}/assets/js/data/loaders.js`).href);
  const images = parseMonsterImages(fs.readFileSync('monster-images.yml', 'utf8'));

  assert.equal(images.size, 334);
  assert.deepEqual(images.get('aboleth'), {
    nome: 'Aboleth',
    immagine: 'https://5e.tools/img/bestiary/tokens/XMM/Aboleth.webp',
  });
  assert.match(images.get('vespa_gigante').immagine, /Giant%20Wasp\.webp$/);

  console.log('Loader immagini mostri OK');
})();
