/*
 * Core leggero del dice roller.
 * Espone funzioni pure per browser e test Node senza dipendenze.
 */
(function exposeDiceRoller(root, factory) {
  const api = factory(root);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.DndDiceRoller = api;
}(typeof globalThis !== 'undefined' ? globalThis : window, function createDiceRoller(root) {
  'use strict';

  const DICE_LIMITS = {
    maxDice: 100,
    maxFaces: 1000,
    maxModifier: 10000,
    historySize: 6,
  };

  /*
   * Converte una formula testuale in parti strutturate.
   * Sintassi supportata: d20, 1d8, 2d6 + 3, 4d10-2, 2d20kh1, 2d20kl1, 4d6dl1.
   */
  function parseDiceFormula(formula) {
    const text = String(formula || '').trim();
    const match = text.match(/^(\d*)d(\d+)(?:(kh|kl|dl)(1))?(?:\s*([+-])\s*(\d+))?$/i);

    if (!match) return null;

    const count = match[1] ? Number(match[1]) : 1;
    const faces = Number(match[2]);
    const keepMode = match[3] ? match[3].toLowerCase() : null;
    const keepCount = match[4] ? Number(match[4]) : null;
    const modifierValue = match[6] ? Number(match[6]) : 0;
    const modifier = match[5] === '-' ? -modifierValue : modifierValue;

    if (
      count < 1 ||
      faces < 2 ||
      count > DICE_LIMITS.maxDice ||
      faces > DICE_LIMITS.maxFaces ||
      Math.abs(modifier) > DICE_LIMITS.maxModifier
    ) {
      return null;
    }

    if (keepMode && !isValidKeepMode(count, keepMode, keepCount)) return null;

    return {
      raw: text,
      count,
      faces,
      modifier,
      keepMode,
      keepCount,
      formula: formatDiceFormula(count, faces, modifier, keepMode, keepCount),
    };
  }

  /*
   * Interpreta una formula composta come somma di termini con segno.
   * Estende parseDiceFormula a piu gruppi di dadi, es. "1d20 + 5 + 1d4":
   * serve agli effetti che aggiungono un dado al tiro principale.
   * I formati a gruppo singolo restano gestiti da parseDiceFormula.
   */
  function parseRollExpression(formula) {
    const text = String(formula || '').trim();
    if (!text) return null;

    const termPattern = /([+-])?\s*(\d*d\d+(?:(?:kh|kl|dl)1)?|\d+)\s*/y;
    const terms = [];
    let index = 0;
    let totalDice = 0;

    while (index < text.length) {
      termPattern.lastIndex = index;
      const match = termPattern.exec(text);
      if (!match || match.index !== index) return null;

      const sign = match[1] === '-' ? -1 : 1;
      if (terms.length > 0 && !match[1]) return null;

      const token = match[2];

      if (/^\d+$/.test(token)) {
        const value = Number(token);
        if (Math.abs(value) > DICE_LIMITS.maxModifier) return null;
        terms.push({ kind: 'flat', value: sign * value });
      } else {
        const dice = parseDiceFormula(token);
        if (!dice) return null;
        totalDice += dice.count;
        if (totalDice > DICE_LIMITS.maxDice) return null;
        terms.push({
          kind: 'dice',
          sign,
          count: dice.count,
          faces: dice.faces,
          keepMode: dice.keepMode,
          keepCount: dice.keepCount,
        });
      }

      index = termPattern.lastIndex;
    }

    if (!terms.length) return null;
    if (!terms.some((term) => term.kind === 'dice')) return null;

    return { raw: text, terms, formula: formatRollExpression(terms) };
  }

  /*
   * Esegue una formula composta sommando ogni termine.
   * Con un solo gruppo di dadi positivo delega a rollDice per restare
   * identici al comportamento storico; altrimenti somma i gruppi.
   */
  function rollExpression(parsed, randomInteger = randomInt) {
    if (!parsed || !Array.isArray(parsed.terms)) return null;

    const flatModifier = parsed.terms
      .filter((term) => term.kind === 'flat')
      .reduce((sum, term) => sum + term.value, 0);
    const diceTerms = parsed.terms.filter((term) => term.kind === 'dice');

    if (diceTerms.length === 1 && diceTerms[0].sign > 0) {
      const term = diceTerms[0];
      const legacy = rollDice({
        raw: parsed.raw,
        count: term.count,
        faces: term.faces,
        keepMode: term.keepMode,
        keepCount: term.keepCount,
        modifier: flatModifier,
        formula: parsed.formula,
      }, randomInteger);
      return { ...legacy, formula: parsed.formula };
    }

    const allRolls = [];
    const d20Values = [];
    let diceTotal = 0;

    diceTerms.forEach((term) => {
      const rolls = Array.from({ length: term.count }, () => randomInteger(1, term.faces));
      const kept = selectKeptRolls(rolls, term.keepMode, term.keepCount);
      rolls.forEach((value) => allRolls.push(value));
      if (term.faces === 20 && term.count === 1 && term.sign > 0 && !term.keepMode) {
        d20Values.push(rolls[0]);
      }
      diceTotal += term.sign * kept.reduce((sum, value) => sum + value, 0);
    });

    const primaryD20 = d20Values.length === 1 ? d20Values[0] : null;

    return {
      formula: parsed.formula,
      faces: primaryD20 !== null ? 20 : null,
      rolls: allRolls,
      keptRolls: allRolls,
      kept: primaryD20,
      keepMode: null,
      keepCount: null,
      modifier: flatModifier,
      total: diceTotal + flatModifier,
    };
  }

  /*
   * Ricompone la stringa canonica di una formula composta.
   */
  function formatRollExpression(terms) {
    return terms
      .map((term, position) => {
        const negative = term.kind === 'flat' ? term.value < 0 : term.sign < 0;
        const body = term.kind === 'flat'
          ? String(Math.abs(term.value))
          : `${term.count}d${term.faces}${term.keepMode ? `${term.keepMode}${term.keepCount}` : ''}`;

        if (position === 0) return negative ? `-${body}` : body;
        return `${negative ? '-' : '+'} ${body}`;
      })
      .join(' ');
  }

  /*
   * Trova formule dado all'interno di un testo.
   */
  function findDiceFormulas(text) {
    const value = String(text || '');
    const pattern = /\b(\d*d\d+(?:(?:kh|kl|dl)1)?(?:\s*[+-]\s*\d+)?)\b/gi;
    const tokens = [];
    let match;

    while ((match = pattern.exec(value)) !== null) {
      const parsed = parseDiceFormula(match[1]);

      if (!parsed || isLikelyTableDie(value, match.index, match[1])) continue;

      tokens.push({
        ...parsed,
        start: match.index,
        end: match.index + match[1].length,
      });
    }

    return tokens;
  }

  /*
   * Evita di rendere cliccabili intestazioni come "1d100" a inizio riga.
   */
  function isLikelyTableDie(text, index, raw) {
    const before = text.slice(0, index);
    const lineStart = Math.max(before.lastIndexOf('\n') + 1, 0);
    const prefix = text.slice(lineStart, index).trim();
    const after = text.slice(index + raw.length);
    const suffix = after.slice(0, 24).trim();
    const nextLine = after.split('\n').find((line) => line.trim())?.trim() || '';

    return (
      !prefix &&
      /^1d100$/i.test(raw.trim()) &&
      (/^[A-ZÀ-Ü]/.test(suffix) || /^(?:0?\d|00)\s*[-–]\s*(?:\d{2}|100)\b/.test(nextLine))
    );
  }

  /*
   * Esegue un tiro a partire da una formula gia parsata.
   */
  function rollDice(parsed, randomInteger = randomInt) {
    const rolls = Array.from({ length: parsed.count }, () => randomInteger(1, parsed.faces));
    const keptRolls = selectKeptRolls(rolls, parsed.keepMode, parsed.keepCount);
    const subtotal = keptRolls.reduce((sum, value) => sum + value, 0);

    return {
      formula: parsed.formula,
      faces: parsed.faces,
      rolls,
      keptRolls,
      kept: keptRolls.length === 1 ? keptRolls[0] : null,
      keepMode: parsed.keepMode,
      keepCount: parsed.keepCount,
      modifier: parsed.modifier,
      total: subtotal + parsed.modifier,
    };
  }

  /*
   * Rileva quando i dadi sono legati a piu bersagli o a effetti ripetuti.
   * Non automatizza il moltiplicatore: restituisce solo contesto UI.
   */
  function analyzeRollContext(text) {
    const value = String(text || '');

    if (!findDiceFormulas(value).length) {
      return {
        hasDice: false,
        repeated: false,
        multipleTargets: false,
        notes: [],
      };
    }

    const repeated = /(?:ogni|ciascun)\s+(?:suo\s+|proprio\s+)?turno|all['’]inizio|alla fine|turni successivi|nuovamente|ripete|quando .{0,80}(?:entra|termina)/i.test(value);
    const multipleTargets = /(?:ogni|ciascuna?|tutte le|fino a [a-zà-ù0-9]+)\s+creatur|(?:ogni|ciascun)\s+bersaglio|\bbersagli\b|creature nell['’]area/i.test(value);
    const notes = [];

    if (multipleTargets) {
      notes.push('per ciascun bersaglio coinvolto');
    }

    if (repeated) {
      notes.push("quando l'effetto si ripete");
    }

    return {
      hasDice: true,
      repeated,
      multipleTargets,
      notes,
    };
  }

  /*
   * Genera un intero casuale inclusivo.
   */
  function randomInt(min, max) {
    const range = max - min + 1;

    if (root.crypto?.getRandomValues) {
      const maxUint = 0xffffffff;
      const limit = maxUint - (maxUint % range);
      const buffer = new Uint32Array(1);

      do {
        root.crypto.getRandomValues(buffer);
      } while (buffer[0] >= limit);

      return min + (buffer[0] % range);
    }

    return min + Math.floor(Math.random() * range);
  }

  /*
   * Normalizza la formula per mostrarla in modo coerente.
   */
  function formatDiceFormula(count, faces, modifier, keepMode = null, keepCount = null) {
    const dice = `${count}d${faces}${keepMode ? `${keepMode}${keepCount}` : ''}`;

    if (!modifier) return dice;

    return `${dice} ${modifier > 0 ? '+' : '-'} ${Math.abs(modifier)}`;
  }

  /*
   * Verifica che gli operatori avanzati restino nel perimetro supportato.
   */
  function isValidKeepMode(count, keepMode, keepCount) {
    if (!['kh', 'kl', 'dl'].includes(keepMode)) return false;
    if (keepCount !== 1) return false;
    if (count < 2) return false;

    return true;
  }

  /*
   * Seleziona i dadi da sommare dopo keep/drop.
   */
  function selectKeptRolls(rolls, keepMode, keepCount) {
    if (!keepMode) return rolls;

    const sorted = [...rolls].sort((a, b) => a - b);

    if (keepMode === 'kh') {
      return sorted.slice(-keepCount);
    }

    if (keepMode === 'kl') {
      return sorted.slice(0, keepCount);
    }

    if (keepMode === 'dl') {
      return sorted.slice(keepCount);
    }

    return rolls;
  }

  return {
    DICE_LIMITS,
    parseDiceFormula,
    parseRollExpression,
    rollExpression,
    formatRollExpression,
    findDiceFormulas,
    rollDice,
    analyzeRollContext,
    randomInt,
    formatDiceFormula,
    isLikelyTableDie,
    selectKeptRolls,
  };
}));
