#!/usr/bin/env node
/*
 * Cache-busting senza build: riscrive TUTTI i ?v=... a un'unica versione
 * in index.html e in ogni modulo JS sotto assets/js. Cosi un bump e un solo
 * comando, senza la cascata manuale file -> renderers -> app.js -> index.html.
 *
 * Uso:
 *   node scripts/bump-version.js              # versione = data+ora (YYYYMMDDHHMM)
 *   node scripts/bump-version.js 20260531-x   # versione esplicita
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function defaultVersion() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
  ].join('');
}

const version = (process.argv[2] || defaultVersion()).replace(/[^0-9A-Za-z._-]/g, '');
if (!version) {
  console.error('Versione non valida.');
  process.exit(1);
}

const targets = [path.join(root, 'index.html')];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) targets.push(full);
  }
})(path.join(root, 'assets', 'js'));

const pattern = /\?v=[0-9A-Za-z._-]+/g;
let filesChanged = 0;
let refsChanged = 0;

for (const file of targets) {
  const src = fs.readFileSync(file, 'utf8');
  let count = 0;
  const out = src.replace(pattern, () => {
    count += 1;
    return `?v=${version}`;
  });
  if (out !== src) {
    fs.writeFileSync(file, out);
    filesChanged += 1;
    refsChanged += count;
  }
}

console.log(`Versione asset -> ${version}`);
console.log(`File aggiornati: ${filesChanged} · riferimenti riscritti: ${refsChanged}`);
