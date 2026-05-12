const fs = require('node:fs');
const path = require('node:path');
const { parseDiceFormula } = require('../assets/js/dice-roller.js');

const MONSTERS_PATH = path.join(
  __dirname,
  '..',
  'data',
  'srd',
  '5.2.1',
  'json',
  'srd_5_2_1_monsters.json'
);

const ABILITIES = ['Forza', 'Destrezza', 'Costituzione', 'Intelligenza', 'Saggezza', 'Carisma'];

function main() {
  const monsters = JSON.parse(fs.readFileSync(MONSTERS_PATH, 'utf8'));
  const stats = {
    monsters: monsters.length,
    actions: 0,
    enrichedActions: 0,
    attacks: 0,
    saves: 0,
    recharge: 0,
  };

  const enriched = monsters.map((monster) => ({
    ...monster,
    azioni: enrichEntries(monster.azioni, stats),
  }));

  fs.writeFileSync(MONSTERS_PATH, `${JSON.stringify(enriched, null, 2)}\n`);
  console.log(JSON.stringify(stats, null, 2));
}

function enrichEntries(entries, stats) {
  if (!Array.isArray(entries)) return entries;

  return entries.map((entry) => {
    stats.actions += 1;

    const rolls = [
      parseAttackRoll(entry),
      parseSaveRoll(entry),
    ].filter(Boolean);
    const recharge = parseRecharge(entry?.nome || '');

    if (!rolls.length && !recharge) return stripRollFields(entry);

    stats.enrichedActions += 1;
    stats.attacks += rolls.filter((roll) => roll.tipo === 'attacco').length;
    stats.saves += rolls.filter((roll) => roll.tipo === 'salvezza').length;
    if (recharge) stats.recharge += 1;

    return {
      ...stripRollFields(entry),
      ...(recharge ? { ricarica: recharge } : {}),
      ...(rolls.length ? { tiri: rolls } : {}),
    };
  });
}

function stripRollFields(entry) {
  if (!entry || typeof entry !== 'object') return entry;

  const { tiri, ricarica, ...rest } = entry;
  return rest;
}

function parseRecharge(name) {
  const match = String(name).match(/\(ricarica\s+(\d)(?:\s*[-–]\s*(\d))?\)/i);
  if (!match) return null;

  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : start;
  if (start < 1 || end > 6 || start > end) return null;

  return {
    formula: '1d6',
    successo: range(start, end),
    testo: match[0].slice(1, -1),
  };
}

function parseAttackRoll(entry) {
  const description = normalizeDescription(entry?.descrizione || '');
  if (!/tiro per colpire/i.test(description) || !/colpito:/i.test(description)) return null;
  if (/\boppure\b|,\s*o\s+\d+\s*\(/i.test(description)) return null;

  const attackMatch = description.match(/Tiro per colpire\s+(.+?):\s*([+-]\d+)(?:\s*\(([^)]*)\))?,\s*([^.]*)\.?\s*Colpito:\s*([\s\S]*)/i);
  if (!attackMatch) return null;

  const modeText = attackMatch[1].trim();
  const bonus = Number(attackMatch[2]);
  const hitText = firstSentence(attackMatch[5]);
  const damages = parseDamageList(hitText, 'colpito');
  if (!Number.isFinite(bonus) || !damages.length) return null;

  return {
    tipo: 'attacco',
    modalita: attackMode(modeText),
    bonus,
    ...attackReach(attackMatch[4]),
    ...(attackMatch[3] ? { vantaggio_condizionale: attackMatch[3].trim() } : {}),
    danni: damages,
    confidenza: 'alta',
  };
}

function parseSaveRoll(entry) {
  const description = normalizeDescription(entry?.descrizione || '');
  if (!/tiro salvezza/i.test(description) || !/fallimento:/i.test(description)) return null;

  const saveMatch = description.match(/Tiro salvezza su\s+([A-Za-zÀ-Üà-ü]+):\s*CD\s+(\d+),\s*([\s\S]*?)\.\s*Fallimento:\s*([\s\S]*)/i);
  if (!saveMatch) return null;

  const ability = canonicalAbility(saveMatch[1]);
  const cd = Number(saveMatch[2]);
  const failureText = firstSentence(saveMatch[4]);
  const damages = parseDamageList(failureText, 'fallimento');
  if (!ability || !Number.isFinite(cd) || !damages.length) return null;

  return {
    tipo: 'salvezza',
    caratteristica: ability,
    cd,
    bersaglio: saveMatch[3].trim(),
    fallimento: {
      danni: damages,
      effetti: [],
    },
    ...(hasHalfDamageOnSuccess(description) ? { successo: { danni: 'meta', effetti: [] } } : {}),
    confidenza: 'alta',
  };
}

function parseDamageList(text, context) {
  const matches = [...String(text).matchAll(/(\d+)\s*\((\d*d\d+(?:\s*[+-]\s*\d+)?)\)\s*danni(?:\s+da)?\s+([A-Za-zÀ-Üà-ü ]+?)(?=\.|,|\s+piu\s+|\s+più\s+|\s+e\s+|$)/gi)];

  return matches
    .map((match) => {
      const formula = parseDiceFormula(match[2]);
      if (!formula) return null;

      return {
        formula: formula.formula,
        media: Number(match[1]),
        tipo: match[3].trim(),
        contesto: context,
      };
    })
    .filter(Boolean);
}

function normalizeDescription(text) {
  return String(text)
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstSentence(text) {
  return String(text).split(/\.\s+/)[0] || '';
}

function attackMode(text) {
  const value = String(text).toLowerCase();
  if (value.includes('mischia') && value.includes('distanza')) return 'mischia_o_distanza';
  if (value.includes('incantesimo') && value.includes('mischia')) return 'incantesimo_mischia';
  if (value.includes('incantesimo') && value.includes('distanza')) return 'incantesimo_distanza';
  if (value.includes('distanza')) return 'distanza';
  return 'mischia';
}

function attackReach(text) {
  const value = String(text);
  const data = {};
  const reach = value.match(/portata\s+(.+?m)(?=\s+o\s+gittata|\s*$|,)/i);
  const rangeText = value.match(/gittata\s+(.+?m)(?=\s*$|,)/i);

  if (reach) data.portata = reach[1].trim();
  if (rangeText) data.gittata = rangeText[1].trim();

  return data;
}

function canonicalAbility(value) {
  const normalized = String(value).toLowerCase();
  return ABILITIES.find((ability) => ability.toLowerCase() === normalized) || null;
}

function hasHalfDamageOnSuccess(text) {
  return /successo:\s*danni dimezzati|successo:\s*la meta|successo:\s*met[aà]/i.test(text);
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

main();
