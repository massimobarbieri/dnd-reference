import {
  ABILITY_META,
  SKILL_META,
  CHARACTER_SHEET_SCHEMA_VERSION,
  DEFAULT_CHARACTER_SHEET,
} from './character-sheet-view.js?v=20260531-1';

/*
* Normalizza una scheda parziale mantenendo compatibilita con campi nuovi.
* I sotto-oggetti vengono sempre ricostruiti per evitare riferimenti o shape
* vecchie provenienti da localStorage/import JSON.
*/
export function normalizeCharacterSheet(sheet) {
    const base = cloneJson(DEFAULT_CHARACTER_SHEET);
    const value = sheet && typeof sheet === 'object' ? sheet : {};
    const migrated = migrateCharacterSheet(value);

    return {
      ...base,
      ...migrated,
      id: migrated.id ? String(migrated.id) : createCharacterSheetId(),
      schemaVersion: CHARACTER_SHEET_SCHEMA_VERSION,
      abilities: {
        ...base.abilities,
        ...(migrated.abilities || {}),
      },
      savingThrows: {
        ...base.savingThrows,
        ...(migrated.savingThrows || {}),
      },
      skillProficiencies: normalizeSkillProficiencies(migrated.skillProficiencies),
      proficiencies: normalizeProficiencies(migrated.proficiencies),
      status: normalizeCharacterStatus(migrated.status),
      activeEffects: normalizeActiveEffects(migrated.activeEffects),
      resources: normalizeLegacyResources(migrated.resources),
      attacks: normalizeLegacyAttacks(migrated.attacks),
      hitPointLog: normalizeHitPointLog(migrated.hitPointLog),
      sessionLog: normalizeSessionLog(migrated.sessionLog),
      hitDiceUsed: normalizeHitDiceUsed(migrated.hitDiceUsed),
      combatState: normalizeCombatState(migrated.combatState),
      spellSlotsUsed: normalizeSpellSlotsUsed(migrated.spellSlotsUsed),
      preparedSpells: Array.isArray(migrated.preparedSpells) ? migrated.preparedSpells : [],
      magicItems: Array.isArray(migrated.magicItems) ? migrated.magicItems : [],
      attunedMagicItems: normalizeIdList(migrated.attunedMagicItems),
      references: normalizeSheetReferences(migrated.references),
      equipmentItems: normalizeEquipmentItems(migrated.equipmentItems),
      coins: {
        ...base.coins,
        ...(migrated.coins || {}),
      },
    };
  }

/*
* Migra schede esportate o salvate con versioni precedenti.
* Ogni blocco deve essere idempotente: puo essere richiamato anche su dati
* gia normalizzati senza duplicare o perdere informazioni.
*/
export function migrateCharacterSheet(value) {
    const sheet = { ...value };

    if (!Number.isFinite(Number(sheet.schemaVersion))) {
      sheet.schemaVersion = 0;
    }

    if (sheet.schemaVersion < 1) {
      sheet.magicItems = normalizeLegacyMagicItems(sheet.magicItems);
    }

    if (sheet.schemaVersion < 2) {
      sheet.attacks = normalizeLegacyAttacks(sheet.attacks);
    }

    if (sheet.schemaVersion < 3) {
      sheet.attunedMagicItems = normalizeIdList(sheet.attunedMagicItems);
    }

    if (sheet.schemaVersion < 4) {
      sheet.skillProficiencies = normalizeSkillProficiencies(sheet.skillProficiencies);
    }

    if (sheet.schemaVersion < 5) {
      sheet.proficiencies = normalizeProficiencies(sheet.proficiencies);
    }

    if (sheet.schemaVersion < 6) {
      sheet.resources = normalizeLegacyResources(sheet.resources);
    }

    if (sheet.schemaVersion < 7) {
      sheet.status = normalizeCharacterStatus(sheet.status);
    }

    if (sheet.schemaVersion < 8 && !sheet.id) {
      sheet.id = createCharacterSheetId();
    }

    if (sheet.schemaVersion < 9) {
      sheet.spellSlotsUsed = normalizeSpellSlotsUsed(sheet.spellSlotsUsed);
    }

    if (sheet.schemaVersion < 10) {
      sheet.references = normalizeSheetReferences(sheet.references);
    }

    if (sheet.schemaVersion < 11) {
      sheet.equipmentItems = normalizeEquipmentItems(sheet.equipmentItems);
    }

    if (sheet.schemaVersion < 12) {
      sheet.hitPointLog = normalizeHitPointLog(sheet.hitPointLog);
    }

    if (sheet.schemaVersion < 13) {
      sheet.hitDiceUsed = normalizeHitDiceUsed(sheet.hitDiceUsed);
    }

    if (sheet.schemaVersion < 14) {
      sheet.combatState = normalizeCombatState(sheet.combatState);
      sheet.status = normalizeCharacterStatus(sheet.status);
    }

    if (sheet.schemaVersion < 15) {
      sheet.sessionLog = normalizeSessionLog(sheet.sessionLog);
    }

    if (sheet.schemaVersion < 16) {
      sheet.activeEffects = normalizeActiveEffects(sheet.activeEffects);
    }

    return sheet;
  }

export function normalizeSpellSlotsUsed(value) {
    const source = value && typeof value === 'object' ? value : {};

    return Object.fromEntries(Object.entries(source)
      .map(([key, used]) => [String(key), Math.max(0, Number(used) || 0)]));
    }

/*
* Riallinea vecchie liste di oggetti magici a una forma stabile.
*/
export function normalizeLegacyMagicItems(items) {
    if (!Array.isArray(items)) return [];

    return items
      .map((item) => {
        if (typeof item === 'string') {
          return { id: item, name: item, summary: '' };
        }

        if (!item || typeof item !== 'object' || !item.id) return null;

        return {
          id: String(item.id),
          name: item.name ? String(item.name) : String(item.id),
          summary: item.summary ? String(item.summary) : '',
        };
      })
      .filter(Boolean);
  }

/*
* Riallinea vecchi attacchi a una forma calcolabile.
*/
export function normalizeLegacyAttacks(attacks) {
    if (!Array.isArray(attacks)) return [];

    return attacks
      .map((attack, index) => {
        if (!attack || typeof attack !== 'object') return null;

        return {
          id: attack.id ? String(attack.id) : `attack-${index + 1}`,
          name: attack.name ? String(attack.name) : 'Attacco',
          ability: ABILITY_META.some(([key]) => key === attack.ability) ? attack.ability : 'str',
          proficient: attack.proficient !== false,
          bonus: Number(attack.bonus) || 0,
          damage: attack.damage ? String(attack.damage) : '',
          damageType: attack.damageType ? String(attack.damageType) : '',
          notes: attack.notes ? String(attack.notes) : '',
        };
      })
      .filter(Boolean);
  }

/*
* Le risorse sono contatori manuali: usiamo `used` invece di `remaining`
* cosi il valore massimo puo cambiare senza perdere lo storico consumato.
*/
export function normalizeLegacyResources(resources) {
    if (!Array.isArray(resources)) return [];

    return resources
      .map((resource, index) => {
        if (!resource || typeof resource !== 'object') return null;
        const max = Math.max(0, Number(resource.max) || 0);
        const used = Math.min(max, Math.max(0, Number(resource.used) || 0));

        return {
          id: resource.id ? String(resource.id) : `resource-${index + 1}`,
          name: resource.name ? String(resource.name) : 'Risorsa',
          max,
          used,
          recovery: resource.recovery ? String(resource.recovery) : '',
        };
      })
      .filter(Boolean);
  }

/*
* Stato operativo del personaggio durante la sessione.
* I limiti numerici rispecchiano SRD: indebolimento 0-6, TS morte 0-3.
*/
export function normalizeCharacterStatus(status) {
    const source = status && typeof status === 'object' ? status : {};

    return {
      inspiration: Boolean(source.inspiration),
      concentration: Boolean(source.concentration),
      concentrationSpell: source.concentrationSpell ? String(source.concentrationSpell) : '',
      concentrationDc: Math.max(10, Number(source.concentrationDc) || 10),
      exhaustion: Math.min(6, Math.max(0, Number(source.exhaustion) || 0)),
      deathSaveSuccesses: Math.min(3, Math.max(0, Number(source.deathSaveSuccesses) || 0)),
      deathSaveFailures: Math.min(3, Math.max(0, Number(source.deathSaveFailures) || 0)),
      conditions: normalizeIdList(source.conditions),
      notes: source.notes ? String(source.notes) : '',
    };
  }

export const ACTIVE_EFFECT_DURATIONS = ['turns', 'rounds', 'shortRest', 'longRest', 'concentration', 'scene', 'manual'];
export const ACTIVE_EFFECT_TARGETS = ['', 'armorClass', 'speed', 'initiative', 'attack', 'damage', 'savingThrows', 'spellDc', 'skillChecks'];

/*
* Somma i modificatori degli effetti attivi per un bersaglio.
* Fonte unica usata da modello derivato, selettori e renderer cosi che
* CA, iniziativa, tiri e CD restino coerenti in tutte le schede.
*/
export function activeEffectModifier(effects, target) {
    if (!Array.isArray(effects) || !target) return 0;

    return effects.reduce((total, effect) => {
      if (!effect || effect.modifierTarget !== target) return total;
      return total + (Number(effect.modifierValue) || 0);
    }, 0);
  }

/*
* Concatena i dadi degli effetti attivi per un bersaglio di tipo tiro.
* Es. due effetti "1d4" su savingThrows -> "1d4 + 1d4", pronto da
* accodare alla formula del tiro principale.
*/
export function activeEffectDice(effects, target) {
    if (!Array.isArray(effects) || !target) return '';

    return effects
      .filter((effect) => effect && effect.modifierTarget === target && effect.modifierDice)
      .map((effect) => effect.modifierDice)
      .join(' + ');
  }

/*
* Sanifica una formula di dado da effetto (es. "1d4", "2d6 + 1").
* Validazione leggera: la verifica completa avviene al momento del tiro.
*/
export function normalizeEffectDice(value) {
    const text = String(value || '').trim().toLowerCase();
    if (!text || text.length > 40) return '';
    if (!/d\d/.test(text)) return '';
    if (!/^[0-9dkhl+\-\s]+$/.test(text)) return '';

    return text.replace(/\s+/g, ' ');
  }

export function normalizeActiveEffects(effects) {
    if (!Array.isArray(effects)) return [];

    const durations = new Set(ACTIVE_EFFECT_DURATIONS);
    const targets = new Set(ACTIVE_EFFECT_TARGETS);

    return effects
      .map((effect, index) => {
        if (!effect || typeof effect !== 'object') return null;
        const name = effect.name ? String(effect.name).trim() : '';
        if (!name) return null;

        const duration = durations.has(effect.duration) ? effect.duration : 'manual';
        const modifierTarget = targets.has(effect.modifierTarget) ? effect.modifierTarget : '';
        const remaining = Math.min(999, Math.max(0, Number(effect.remaining) || 0));
        const modifierValue = Math.min(99, Math.max(-99, Number(effect.modifierValue) || 0));

        return {
          id: effect.id ? String(effect.id) : `effect-${index + 1}`,
          name,
          source: effect.source ? String(effect.source) : '',
          duration,
          remaining,
          modifierTarget,
          modifierValue,
          modifierDice: normalizeEffectDice(effect.modifierDice),
          notes: effect.notes ? String(effect.notes) : '',
        };
      })
      .filter(Boolean)
      .slice(0, 30);
  }

export function normalizeCombatState(value) {
    const source = value && typeof value === 'object' ? value : {};

    return {
      round: Math.min(999, Math.max(1, Number(source.round) || 1)),
      actionUsed: Boolean(source.actionUsed),
      bonusActionUsed: Boolean(source.bonusActionUsed),
      reactionUsed: Boolean(source.reactionUsed),
      movementUsed: Math.min(999, Math.max(0, Number(source.movementUsed) || 0)),
    };
  }

export function normalizeIdList(value) {
    if (!Array.isArray(value)) return [];
    return Array.from(new Set(value.map((id) => String(id)).filter(Boolean)));
  }

export function normalizeSheetReferences(value) {
    if (!Array.isArray(value)) return [];

    const seen = new Set();

    return value
      .map((entry) => {
        if (!entry || typeof entry !== 'object' || !entry.section || !entry.id) return null;

        const section = String(entry.section);
        const id = String(entry.id);
        const key = `${section}:${id}`;

        if (seen.has(key)) return null;
        seen.add(key);

        return {
          section,
          id,
          name: entry.name ? String(entry.name) : id,
          summary: entry.summary ? String(entry.summary) : '',
        };
      })
      .filter(Boolean);
  }

export function normalizeEquipmentItems(value) {
    if (!Array.isArray(value)) return [];

    return value
      .map((item, index) => {
        if (!item || typeof item !== 'object') return null;
        const name = item.name ? String(item.name).trim() : '';
        if (!name) return null;

        return {
          id: item.id ? String(item.id) : `equipment-${index + 1}`,
          name,
          quantity: Math.max(1, Number(item.quantity) || 1),
          weight: item.weight ? String(item.weight) : '',
          cost: item.cost ? String(item.cost) : '',
          source: item.source ? String(item.source) : '',
          notes: item.notes ? String(item.notes) : '',
          armorClass: item.armorClass ? String(item.armorClass) : '',
          equipped: Boolean(item.equipped),
        };
      })
      .filter(Boolean);
  }

export function normalizeHitPointLog(value) {
    if (!Array.isArray(value)) return [];

    return value
      .map((entry, index) => {
        if (!entry || typeof entry !== 'object') return null;

        return {
          id: entry.id ? String(entry.id) : `hp-log-${index + 1}`,
          action: ['damage', 'heal', 'temp', 'hitDie', 'longRest', 'undo', 'manual'].includes(entry.action) ? entry.action : 'manual',
          amount: Math.max(0, Number(entry.amount) || 0),
          before: normalizeHitPointSnapshot(entry.before),
          after: normalizeHitPointSnapshot(entry.after),
          at: entry.at ? String(entry.at) : '',
          note: entry.note ? String(entry.note) : '',
        };
      })
      .filter(Boolean)
      .slice(0, 25);
  }

export function normalizeSessionLog(value) {
    if (!Array.isArray(value)) return [];

    return value
      .map((entry, index) => {
        if (!entry || typeof entry !== 'object') return null;
        const label = entry.label ? String(entry.label).trim() : '';
        if (!label) return null;

        return {
          id: entry.id ? String(entry.id) : `session-log-${index + 1}`,
          type: entry.type ? String(entry.type) : 'manual',
          label,
          detail: entry.detail ? String(entry.detail) : '',
          at: entry.at ? String(entry.at) : '',
        };
      })
      .filter(Boolean)
      .slice(0, 50);
  }

function normalizeHitPointSnapshot(value) {
    const source = value && typeof value === 'object' ? value : {};
    const snapshot = {
      currentHp: Math.max(0, Number(source.currentHp) || 0),
      tempHp: Math.max(0, Number(source.tempHp) || 0),
      hitDiceUsed: normalizeHitDiceUsed(source.hitDiceUsed),
    };

    if (Array.isArray(source.resources)) {
      snapshot.resources = normalizeLegacyResources(source.resources);
    }

    if (source.spellSlotsUsed && typeof source.spellSlotsUsed === 'object') {
      snapshot.spellSlotsUsed = normalizeSpellSlotsUsed(source.spellSlotsUsed);
    }

    if (source.status && typeof source.status === 'object') {
      snapshot.status = normalizeHitPointStatusSnapshot(source.status);
    }

    if (Array.isArray(source.activeEffects)) {
      snapshot.activeEffects = normalizeActiveEffects(source.activeEffects);
    }

    return snapshot;
  }

function normalizeHitPointStatusSnapshot(value) {
    const source = value && typeof value === 'object' ? value : {};

    return {
      concentration: Boolean(source.concentration),
      concentrationSpell: source.concentrationSpell ? String(source.concentrationSpell) : '',
      concentrationDc: Math.max(10, Number(source.concentrationDc) || 10),
      deathSaveSuccesses: Math.min(3, Math.max(0, Number(source.deathSaveSuccesses) || 0)),
      deathSaveFailures: Math.min(3, Math.max(0, Number(source.deathSaveFailures) || 0)),
    };
  }

export function normalizeHitDiceUsed(value) {
    return Math.min(20, Math.max(0, Number(value) || 0));
  }

export function normalizeSkillProficiencies(value) {
    const source = value && typeof value === 'object' ? value : {};

    return Object.fromEntries(SKILL_META.map(([key]) => {
      const rank = Math.min(2, Math.max(0, Number(source[key]) || 0));
      return [key, rank];
    }));
  }

export function normalizeProficiencies(value) {
    const source = value && typeof value === 'object' ? value : {};

    return {
      weapons: source.weapons ? String(source.weapons) : '',
      armor: source.armor ? String(source.armor) : '',
      tools: source.tools ? String(source.tools) : '',
      languages: source.languages ? String(source.languages) : '',
    };
  }

export function uniqueCharacterSheets(sheets) {
    const seen = new Set();

    return sheets.map((sheet) => {
      let id = sheet.id || createCharacterSheetId();
      while (seen.has(id)) id = createCharacterSheetId();
      seen.add(id);
      return { ...sheet, id };
    });
  }

export function createCharacterSheetId() {
    return `sheet-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

/*
* Crea una copia profonda semplice per dati JSON-safe.
*/
export function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }
