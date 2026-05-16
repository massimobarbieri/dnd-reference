/*
* Normalizza un archivio esportato con piu schede. L'import sostituisce
* l'archivio locale, quindi qui garantiamo almeno una scheda valida.
*/
export async function normalizeCharacterSheetArchive(value) {
    if (!value || typeof value !== 'object' || !Array.isArray(value.sheets)) {
        throw new Error('Archivio schede non valido');
    }

    const sheets = uniqueCharacterSheets(value.sheets.map(normalizeCharacterSheet));
    if (!sheets.length) throw new Error('Archivio schede vuoto');

    const activeCharacterSheetId = String(value.activeCharacterSheetId || '');

    return {
      activeCharacterSheetId,
      sheets,
    };
  }

/*
* Migra schede esportate o salvate con versioni precedenti.
* Ogni blocco deve essere idempotente: puo essere richiamato anche su dati
* gia normalizzati senza duplicare o perdere informazioni.
*/
export async function migrateCharacterSheet(value) {
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

    return sheet;
  }

export async function normalizeSpellSlotsUsed(value) {
    const source = value && typeof value === 'object' ? value : {};

    return Object.fromEntries(Object.entries(source)
      .map(([key, used]) => [String(key), Math.max(0, Number(used) || 0)]));
    }

/*
* Riallinea vecchie liste di oggetti magici a una forma stabile.
*/
export async function normalizeLegacyMagicItems(items) {
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
export async function normalizeLegacyAttacks(attacks) {
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
export async function normalizeLegacyResources(resources) {
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
export async function normalizeCharacterStatus(status) {
    const source = status && typeof status === 'object' ? status : {};

    return {
      inspiration: Boolean(source.inspiration),
      concentration: Boolean(source.concentration),
      exhaustion: Math.min(6, Math.max(0, Number(source.exhaustion) || 0)),
      deathSaveSuccesses: Math.min(3, Math.max(0, Number(source.deathSaveSuccesses) || 0)),
      deathSaveFailures: Math.min(3, Math.max(0, Number(source.deathSaveFailures) || 0)),
      conditions: normalizeIdList(source.conditions),
      notes: source.notes ? String(source.notes) : '',
    };
  }

export async function normalizeIdList(value) {
    if (!Array.isArray(value)) return [];
    return Array.from(new Set(value.map((id) => String(id)).filter(Boolean)));
  }

export async function normalizeSkillProficiencies(value) {
    const source = value && typeof value === 'object' ? value : {};

    return Object.fromEntries(SKILL_META.map(([key]) => {
      const rank = Math.min(2, Math.max(0, Number(source[key]) || 0));
      return [key, rank];
    }));
  }

export async function normalizeProficiencies(value) {
    const source = value && typeof value === 'object' ? value : {};

    return {
      weapons: source.weapons ? String(source.weapons) : '',
      armor: source.armor ? String(source.armor) : '',
      tools: source.tools ? String(source.tools) : '',
      languages: source.languages ? String(source.languages) : '',
    };
  }

export async function uniqueCharacterSheets(sheets) {
    const seen = new Set();

    return sheets.map((sheet) => {
      let id = sheet.id || createCharacterSheetId();
      while (seen.has(id)) id = createCharacterSheetId();
      seen.add(id);
      return { ...sheet, id };
    });
  }

export async function createCharacterSheetId() {
    return `sheet-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

/*
* Crea una copia profonda semplice per dati JSON-safe.
*/
export async function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }