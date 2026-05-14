/*
 * D&D Reference
 * Applicazione statica per consultare mostri, incantesimi, oggetti magici, regole e glossario.
 *
 * Caratteristiche principali:
 * - Non usa framework JavaScript.
 * - Carica i dati da file JSON/YAML.
 * - Gestisce navigazione tramite hash URL, esempio: #/monsters.
 * - Permette ricerca, filtri e preferiti.
 * - Salva i preferiti nel localStorage del browser.
 */
(() => {
  'use strict';

  /*
   * Stato globale dell’applicazione.
   * Contiene configurazione, dati caricati, filtri attivi,
   * preferiti e sezione corrente.
   */
  const appState = {
    config: null,

    // Dati principali caricati dai file JSON.
    data: {
      monsters: [],
      spells: [],
      classes: [],
      character_sheet: [],
      magic_items: [],
      rules: [],
      rules_glossary: [],
    },

    // Mappa id mostro -> dati immagine.
    monsterImages: new Map(),

    // Preferiti letti dal localStorage.
    favorites: loadFavorites(),

    // Sezione attualmente visualizzata.
    currentSection: null,

    // Testo digitato nella barra di ricerca.
    searchTerm: '',

    // Filtro selezionato per ogni sezione.
    filters: {
      monsters: '',
      spells: '',
      classes: '',
      character_sheet: '',
      magic_items: '',
      rules: '',
      rules_glossary: '',
    },

    // Scheda personaggio locale.
    characterSheet: null,
    characterSheetTab: 'overview',

    // Se true mostra solo gli elementi preferiti.
    showOnlyFavorites: false,

    // Storico breve dei tiri effettuati durante la sessione.
    rollHistory: [],

    // Messaggio di validazione per il dice tray globale.
    rollError: '',

    // Stato espanso/collassato del dice roller, utile soprattutto su mobile.
    rollTrayOpen: false,
  };

  const {
    analyzeRollContext,
    DICE_LIMITS,
    findDiceFormulas,
    formatDiceFormula,
    isLikelyTableDie,
    parseDiceFormula,
    randomInt,
    rollDice,
  } = window.DndDiceRoller;

  /*
   * Metadati delle sezioni.
   * Servono per icone, etichette e gestione uniforme delle liste.
   */
  const SECTION_META = {
    monsters: {
      icon: '🐉',
      singular: 'mostro',
      titleKey: 'monsters',
    },
    spells: {
      icon: '✨',
      singular: 'incantesimo',
      titleKey: 'spells',
    },
    classes: {
      icon: '🧙',
      singular: 'classe',
      titleKey: 'classes',
    },
    character_sheet: {
      icon: '🧾',
      singular: 'scheda',
      titleKey: 'character_sheet',
      type: 'tool',
    },
    magic_items: {
      icon: '🗡️',
      singular: 'oggetto magico',
      titleKey: 'magic_items',
    },
    rules: {
      icon: '📖',
      singular: 'regola',
      titleKey: 'rules',
    },
    rules_glossary: {
      icon: '🔎',
      singular: 'voce',
      titleKey: 'rules_glossary',
    },
  };

  const CONDITION_ALIASES = {
    accecato: ['accecato', 'accecata', 'accecati', 'accecate'],
    affascinato: ['affascinato', 'affascinata', 'affascinati', 'affascinate'],
    afferrato: ['afferrato', 'afferrata', 'afferrati', 'afferrate'],
    assordato: ['assordato', 'assordata', 'assordati', 'assordate'],
    avvelenato: ['avvelenato', 'avvelenata', 'avvelenati', 'avvelenate'],
    incapacitato: ['incapacitato', 'incapacitata', 'incapacitati', 'incapacitate'],
    indebolimento: ['indebolimento'],
    invisibile: ['invisibile', 'invisibili'],
    paralizzato: ['paralizzato', 'paralizzata', 'paralizzati', 'paralizzate'],
    pietrificato: ['pietrificato', 'pietrificata', 'pietrificati', 'pietrificate'],
    privo_di_sensi: ['privo di sensi', 'priva di sensi', 'privi di sensi', 'prive di sensi'],
    prono: ['prono', 'prona', 'proni', 'prone'],
    spaventato: ['spaventato', 'spaventata', 'spaventati', 'spaventate'],
    stordito: ['stordito', 'stordita', 'storditi', 'stordite'],
    trattenuto: ['trattenuto', 'trattenuta', 'trattenuti', 'trattenute'],
  };

  const CHARACTER_SHEET_STORAGE_KEY = 'dnd-reference:character-sheet';

  const ABILITY_META = [
    ['str', 'Forza', 'FOR'],
    ['dex', 'Destrezza', 'DES'],
    ['con', 'Costituzione', 'COS'],
    ['int', 'Intelligenza', 'INT'],
    ['wis', 'Saggezza', 'SAG'],
    ['cha', 'Carisma', 'CAR'],
  ];

  const CHARACTER_SHEET_TABS = [
    ['overview', 'Principale'],
    ['combat', 'Combattimento'],
    ['spells', 'Incantesimi'],
    ['inventory', 'Inventario'],
    ['notes', 'Note'],
  ];

  const CHARACTER_SHEET_SCHEMA_VERSION = 3;

  const DEFAULT_CHARACTER_SHEET = {
    schemaVersion: CHARACTER_SHEET_SCHEMA_VERSION,
    name: '',
    classId: '',
    level: 1,
    ancestry: '',
    background: '',
    alignment: '',
    xp: 0,
    abilities: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },
    savingThrows: {
      str: false,
      dex: false,
      con: false,
      int: false,
      wis: false,
      cha: false,
    },
    armorClass: 10,
    currentHp: 0,
    maxHp: 0,
    tempHp: 0,
    hitDice: '1d8',
    speed: 9,
    initiativeBonus: 0,
    attacks: [],
    spellcastingAbility: 'int',
    preparedSpells: [],
    magicItems: [],
    attunedMagicItems: [],
    equipment: '',
    coins: {
      pp: 0,
      mo: 0,
      ma: 0,
      mr: 0,
    },
    notes: '',
  };

  /*
   * Riferimenti alle tre viste principali dell’interfaccia.
   * Ogni vista viene mostrata o nascosta in base alla rotta corrente.
   */
  const views = {
    home: document.querySelector('#home-view'),
    list: document.querySelector('#list-view'),
    detail: document.querySelector('#detail-view'),
  };

  /*
   * Quando il DOM è pronto, inizializza l’app.
   * Quando cambia l’hash dell’URL, aggiorna la vista.
   */
  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('hashchange', renderRoute);

  /*
   * Funzione principale di avvio.
   * Carica configurazione, dati, immagini e poi renderizza la rotta corrente.
   */
  async function init() {
    showLoading();
    appState.characterSheet = loadCharacterSheet();
    renderRollTray();
    document.addEventListener('click', handleRollCommand);
    document.addEventListener('submit', handleRollSubmit);

    try {
      // Carica config.yml.
      appState.config = await loadConfig();

      // Aggiorna titolo, heading e sottotitolo della pagina.
      applyConfigToPage(appState.config);

      const paths = appState.config.paths;

      /*
       * Carica in parallelo tutti i dati.
       * Promise.all migliora i tempi perché non aspetta un file alla volta.
       */
      const [monsters, spells, magicItems, rules, rulesGlossary, monsterImageYaml] = await Promise.all([
        fetchJson(paths.monsters),
        fetchJson(paths.spells),
        fetchJson(paths.magic_items),
        fetchJson(paths.rules),
        fetchJson(paths.rules_glossary),

        // Se il file immagini manca o fallisce, usa una stringa vuota.
        fetchText(paths.monster_images).catch(() => ''),
      ]);

      // Normalizza i dati per evitare errori se un file non contiene un array.
      appState.data.monsters = normalizeArray(monsters);
      appState.data.spells = normalizeArray(spells);
      appState.data.character_sheet = [appState.characterSheet];

      // Gli oggetti magici vengono anche normalizzati nella rarità.
      appState.data.magic_items = normalizeArray(magicItems).map(normalizeMagicItem);
      appState.data.classes = normalizeArray(rules).filter(isClassRule);
      appState.data.rules = normalizeArray(rules).filter((rule) => !isClassRule(rule));
      appState.data.rules_glossary = normalizeArray(rulesGlossary);

      // Converte il piccolo YAML delle immagini in una Map.
      appState.monsterImages = parseMonsterImages(monsterImageYaml);

      // Renderizza home, lista o dettaglio in base all’URL.
      renderRoute();
    } catch (error) {
      console.error(error);
      showError();
    }
  }

  /*
   * Scarica un file JSON e lo converte in oggetto JavaScript.
   */
  async function fetchJson(path) {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Errore caricamento JSON: ${path}`);
    return response.json();
  }

  /*
   * Scarica un file testuale.
   * Usato per config.yml e monster-images.yml.
   */
  async function fetchText(path) {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Errore caricamento testo: ${path}`);
    return response.text();
  }

  /*
   * Garantisce che il valore sia un array.
   * Se il file caricato è vuoto o malformato, evita crash nelle map/filter.
   */
  function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  /*
   * Crea una copia profonda semplice per dati JSON-safe.
   */
  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /*
   * Legge la scheda personaggio locale e la riallinea al modello corrente.
   */
  function loadCharacterSheet() {
    try {
      return normalizeCharacterSheet(JSON.parse(localStorage.getItem(CHARACTER_SHEET_STORAGE_KEY) || '{}'));
    } catch {
      return normalizeCharacterSheet({});
    }
  }

  /*
   * Normalizza una scheda parziale mantenendo compatibilita con campi nuovi.
   */
  function normalizeCharacterSheet(sheet) {
    const base = cloneJson(DEFAULT_CHARACTER_SHEET);
    const value = sheet && typeof sheet === 'object' ? sheet : {};
    const migrated = migrateCharacterSheet(value);

    return {
      ...base,
      ...migrated,
      schemaVersion: CHARACTER_SHEET_SCHEMA_VERSION,
      abilities: {
        ...base.abilities,
        ...(migrated.abilities || {}),
      },
      savingThrows: {
        ...base.savingThrows,
        ...(migrated.savingThrows || {}),
      },
      attacks: normalizeLegacyAttacks(migrated.attacks),
      preparedSpells: Array.isArray(migrated.preparedSpells) ? migrated.preparedSpells : [],
      magicItems: Array.isArray(migrated.magicItems) ? migrated.magicItems : [],
      attunedMagicItems: normalizeIdList(migrated.attunedMagicItems),
      coins: {
        ...base.coins,
        ...(migrated.coins || {}),
      },
    };
  }

  /*
   * Migra schede esportate o salvate con versioni precedenti.
   */
  function migrateCharacterSheet(value) {
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

    return sheet;
  }

  /*
   * Riallinea vecchie liste di oggetti magici a una forma stabile.
   */
  function normalizeLegacyMagicItems(items) {
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
  function normalizeLegacyAttacks(attacks) {
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

  function normalizeIdList(value) {
    if (!Array.isArray(value)) return [];
    return Array.from(new Set(value.map((id) => String(id)).filter(Boolean)));
  }

  /*
   * Salva la scheda nel localStorage namespaced dell'app.
   */
  function saveCharacterSheet() {
    localStorage.setItem(CHARACTER_SHEET_STORAGE_KEY, JSON.stringify(appState.characterSheet));
    appState.data.character_sheet = [appState.characterSheet];
  }

  /*
   * Le classi sono mantenute nei dati regole SRD, ma nell'app hanno una
   * sezione principale dedicata.
   */
  function isClassRule(rule) {
    return String(rule?.id || '').startsWith('classe_');
  }

  /*
   * Normalizza un singolo oggetto magico.
   */
  function normalizeMagicItem(item) {
    return {
      ...item,
      rarita: normalizeMagicItemRarity(item.rarita),
    };
  }

  /*
   * Uniforma le rarità degli oggetti magici.
   * Esempio:
   * - "raro" diventa "rara"
   * - "molto raro" diventa "molto rara"
   * - rarità multiple diventano "rarità variabile"
   */
  function normalizeMagicItemRarity(rarity) {
    const text = String(rarity || '').trim().toLowerCase();

    if (!text) return '';

    if (text.includes(',') || text.includes(' o ') || text.includes('variabile')) {
      return 'rarità variabile';
    }

    const canonicalRarities = {
      raro: 'rara',
      rara: 'rara',
      'molto raro': 'molto rara',
      'molto rara': 'molto rara',
      leggendario: 'leggendaria',
      leggendaria: 'leggendaria',
    };

    return canonicalRarities[text] || text;
  }

  /*
   * Parser YAML minimale per config.yml.
   *
   * Supporta una struttura semplice a due livelli:
   *
   * site:
   *   title: Titolo
   * paths:
   *   monsters: data/monsters.json
   *
   * Non è un parser YAML completo, ma basta per configurazioni semplici.
   */
  async function loadConfig() {
    const text = await fetchText('config.yml');
    const config = {};
    let currentBlock = null;

    text.split(/\r?\n/).forEach((rawLine) => {
      // Rimuove commenti e spazi finali.
      const line = rawLine.replace(/#.*$/, '').trimEnd();

      // Ignora righe vuote.
      if (!line.trim()) return;

      // Riconosce blocchi principali: site:, paths:, labels:, ecc.
      if (!line.startsWith(' ') && line.endsWith(':')) {
        currentBlock = line.slice(0, -1).trim();
        config[currentBlock] = {};
        return;
      }

      // Riconosce proprietà indentate di due spazi.
      const match = line.match(/^\s{2}([\w_]+):\s*(.*)$/);

      if (match && currentBlock) {
        config[currentBlock][match[1]] = parseYamlScalar(match[2]);
      }
    });

    return config;
  }

  /*
   * Converte valori YAML semplici in tipi JavaScript.
   * Supporta:
   * - booleani
   * - null
   * - numeri
   * - stringhe con o senza virgolette
   */
  function parseYamlScalar(value) {
    const trimmed = value.trim();

    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;

    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }

    return trimmed.replace(/^['"]|['"]$/g, '');
  }

  /*
   * Parser dedicato a monster-images.yml.
   *
   * Formato previsto:
   *
   * - id: goblin
   *   nome: Goblin
   *   immagine: images/goblin.png
   *
   * Restituisce una Map:
   * id -> oggetto con id, nome, immagine.
   */
  function parseMonsterImages(yamlText) {
    const map = new Map();
    let current = null;

    yamlText.split(/\r?\n/).forEach((line) => {
      const itemMatch = line.match(/^\s*-\s+id:\s*(.+)$/);
      const propMatch = line.match(/^\s{2,}([\w_]+):\s*(.*)$/);

      if (itemMatch) {
        current = { id: itemMatch[1].trim() };
        map.set(current.id, current);
      } else if (current && propMatch) {
        current[propMatch[1]] = propMatch[2].trim();
      }
    });

    return map;
  }

  /*
   * Applica la configurazione generale alla pagina HTML.
   */
  function applyConfigToPage(config) {
    document.title = config.site?.title || 'D&D Reference';
    document.querySelector('#site-title').textContent = config.site?.title || 'D&D Reference';
    document.querySelector('#site-subtitle').textContent = config.site?.subtitle || '';
  }

  /*
   * Decide cosa mostrare in base all’hash dell’URL.
   *
   * Esempi:
   * #/                 -> home
   * #/monsters         -> lista mostri
   * #/monsters/goblin  -> dettaglio mostro
   */
  function renderRoute() {
    const route = parseHash();
    appState.currentSection = route.section || null;

    if (!route.section) {
      renderHome();
      return;
    }

    if (route.section === 'rules' && route.id && isClassRule({ id: route.id })) {
      location.hash = `#/classes/${encodeURIComponent(route.id)}`;
      return;
    }

    // Se la sezione non esiste, torna alla home.
    if (!SECTION_META[route.section]) {
      location.hash = '';
      return;
    }

    if (route.section === 'character_sheet') {
      renderCharacterSheet(route.id || appState.characterSheetTab);
      return;
    }

    if (route.id) {
      renderDetail(route.section, route.id);
    } else {
      renderList(route.section);
    }
  }

  /*
   * Converte l’hash dell’URL in sezione e id.
   */
  function parseHash() {
    const clean = location.hash.replace(/^#\/?/, '');
    const [section, id] = clean.split('/');

    return {
      section,
      id: id ? decodeURIComponent(id) : null,
    };
  }

  /*
   * Mostra una sola vista alla volta e svuota le viste nascoste.
   */
  function setView(name) {
    Object.entries(views).forEach(([key, node]) => {
      node.hidden = key !== name;

      if (key !== name) {
        node.innerHTML = '';
      }
    });
  }

  /*
   * Renderizza la schermata iniziale con le card principali.
   */
  function renderHome() {
    setView('home');

    const labels = appState.config.labels;

    views.home.innerHTML = `
      <div class="home-grid">
        ${Object.keys(SECTION_META)
          .map((section) => sectionHomeCard(section, labels[section], homeCardSubtitle(section)))
          .join('')}
      </div>
    `;
  }

  /*
   * Sottotitolo della card home: conteggio per liste, stato per strumenti.
   */
  function homeCardSubtitle(section) {
    if (SECTION_META[section]?.type === 'tool') {
      return appState.characterSheet.name || 'Strumento locale';
    }

    return `${appState.data[section].length} elementi disponibili`;
  }

  /*
   * Crea una card della home per una sezione.
   */
  function sectionHomeCard(section, label, subtitle) {
    return `
      <a class="home-card" href="#/${section}">
        <strong>${SECTION_META[section].icon} ${escapeHtml(label)}</strong>
        <span>${escapeHtml(subtitle)}</span>
      </a>
    `;
  }

  /*
   * Renderizza la lista di una sezione:
   * - barra di ricerca
   * - filtro
   * - pulsante preferiti
   * - lista risultati
   */
  function renderList(section) {
    setView('list');

    const labels = appState.config.labels;
    const title = labels[section] || section;

    views.list.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-row">
          <a class="button button--ghost" href="#/">Home</a>

          <input
            id="search-input"
            class="search"
            type="search"
            value="${escapeAttr(appState.searchTerm)}"
            placeholder="${escapeAttr(labels.search_placeholder)}"
            aria-label="Cerca"
          >

          ${filterControl(section)}

          <button
            id="favorites-toggle"
            class="button"
            type="button"
            aria-pressed="${appState.showOnlyFavorites}"
          >
            ${labels.favorites}
          </button>
        </div>
      </div>

      <div class="section-title">
        <h2>${escapeHtml(title)}</h2>
        <span id="result-count" class="count"></span>
      </div>

      <div id="item-list" class="item-list"></div>
    `;

    /*
     * Aggiorna la ricerca in tempo reale.
     */
    views.list.querySelector('#search-input').addEventListener('input', (event) => {
      appState.searchTerm = event.target.value;
      renderListResults(section);
    });

    /*
     * Aggiorna il filtro della sezione corrente.
     */
    views.list.querySelector('#section-filter')?.addEventListener('change', (event) => {
      appState.filters[section] = event.target.value;
      renderListResults(section);
    });

    /*
     * Attiva/disattiva la visualizzazione dei soli preferiti.
     */
    views.list.querySelector('#favorites-toggle').addEventListener('click', (event) => {
      appState.showOnlyFavorites = !appState.showOnlyFavorites;
      event.currentTarget.setAttribute('aria-pressed', String(appState.showOnlyFavorites));
      renderListResults(section);
    });

    renderListResults(section);
  }

  /*
   * Renderizza solo i risultati della lista.
   * Viene richiamata quando cambiano ricerca, filtro o preferiti.
   */
  function renderListResults(section) {
    const labels = appState.config.labels;
    const allItems = appState.data[section];
    const items = getFilteredItems(section);

    const count = views.list.querySelector('#result-count');
    const list = views.list.querySelector('#item-list');

    count.textContent = `${items.length} / ${allItems.length}`;

    list.innerHTML = items.length
      ? items.map((item) => listItem(section, item)).join('')
      : `<div class="state-box">${escapeHtml(appState.showOnlyFavorites ? labels.empty_favorites : labels.empty_results)}</div>`;
  }

  /*
   * Restituisce gli elementi filtrati e ordinati alfabeticamente.
   */
  function getFilteredItems(section) {
    const term = normalizeText(appState.searchTerm);
    const filter = appState.filters[section];

    return appState.data[section]
      .filter((item) => !appState.showOnlyFavorites || isFavorite(section, item.id))
      .filter((item) => matchesSectionFilter(section, item, filter))
      .filter((item) => !term || normalizeText(searchableText(section, item)).includes(term))
      .sort((a, b) => sortItems(section, a, b));
  }

  /*
   * Mantiene le regole nell'ordine del PDF; le altre sezioni restano alfabetiche.
   */
  function sortItems(section, a, b) {
    if (section === 'rules') {
      return sourcePageValue(a.pagine_sorgente) - sourcePageValue(b.pagine_sorgente);
    }

    return String(a.nome || '').localeCompare(String(b.nome || ''), 'it');
  }

  /*
   * Crea il controllo filtro corretto per la sezione.
   * Mostri: grado sfida.
   * Incantesimi: livello.
   * Oggetti magici: rarità.
   */
  function filterControl(section) {
    const options = filterOptions(section);

    if (!options.length) return '';

    const labels = {
      monsters: 'Tutti i GS',
      spells: 'Tutti i livelli',
      classes: 'Tutte le classi',
      magic_items: 'Tutte le rarità',
      rules: 'Tutte le categorie',
      rules_glossary: 'Tutti i descrittori',
    };

    return `
      <select id="section-filter" class="filter-select" aria-label="${escapeAttr(labels[section])}">
        <option value="">${escapeHtml(labels[section])}</option>
        ${options
          .map((option) => `
            <option value="${escapeAttr(option.value)}"${option.value === appState.filters[section] ? ' selected' : ''}>
              ${escapeHtml(option.label)}
            </option>
          `)
          .join('')}
      </select>
    `;
  }

  /*
   * Genera le opzioni del filtro in base alla sezione.
   */
  function filterOptions(section) {
    if (section === 'monsters') {
      return uniqueValues(appState.data.monsters, 'grado_sfida')
        .sort((a, b) => challengeRatingValue(a) - challengeRatingValue(b))
        .map((value) => ({ value, label: `GS ${value}` }));
    }

    if (section === 'spells') {
      return uniqueValues(appState.data.spells, 'livello')
        .sort((a, b) => Number(a) - Number(b))
        .map((value) => ({
          value: String(value),
          label: spellLevel({ livello: Number(value) }),
        }));
    }

    if (section === 'rules') {
      return uniqueValues(appState.data.rules, 'categoria')
        .map((value) => ({
          value,
          label: value,
        }));
    }

    if (section === 'classes') {
      return [];
    }

    if (section === 'rules_glossary') {
      return uniqueValues(appState.data.rules_glossary, 'descrittore')
        .sort((a, b) => a.localeCompare(b, 'it'))
        .map((value) => ({
          value,
          label: capitalizeFirst(value),
        }));
    }

    return uniqueValues(appState.data.magic_items, 'rarita')
      .sort((a, b) => a.localeCompare(b, 'it'))
      .map((value) => ({
        value,
        label: capitalizeFirst(value),
      }));
  }

  /*
   * Verifica se un elemento passa il filtro selezionato.
   */
  function matchesSectionFilter(section, item, filter) {
    if (!filter) return true;

    if (section === 'monsters') {
      return String(item.grado_sfida || '') === filter;
    }

    if (section === 'spells') {
      return String(item.livello ?? '') === filter;
    }

    if (section === 'rules') {
      return String(item.categoria || '') === filter;
    }

    if (section === 'classes') {
      return true;
    }

    if (section === 'rules_glossary') {
      return String(item.descrittore || '') === filter;
    }

    return String(item.rarita || '') === filter;
  }

  /*
   * Estrae valori unici da una lista di oggetti.
   */
  function uniqueValues(items, key) {
    return Array.from(
      new Set(
        items
          .map((item) => item[key])
          .filter((value) => value !== null && value !== undefined && value !== '')
      )
    ).map(String);
  }

  /*
   * Prima pagina sorgente di una voce, usata per ordinare le regole come nel PDF.
   */
  function sourcePageValue(value) {
    const [page] = String(value || '').match(/\d+/) || [];

    return page ? Number(page) : Number.POSITIVE_INFINITY;
  }

  /*
   * Converte il grado sfida in numero per ordinarlo correttamente.
   * Esempio:
   * "1/2" -> 0.5
   * "2"   -> 2
   */
  function challengeRatingValue(value) {
    const text = String(value);

    if (text.includes('/')) {
      const [numerator, denominator] = text.split('/').map(Number);
      return numerator / denominator;
    }

    return Number(text);
  }

  /*
   * Mette in maiuscolo la prima lettera di una stringa.
   */
  function capitalizeFirst(value) {
    const text = String(value);
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
  }

  /*
   * Costruisce il testo usato dalla ricerca.
   * Include campi diversi in base alla sezione.
   */
  function searchableText(section, item) {
    if (section === 'monsters') {
      return [item.nome, item.tipo, item.dimensione, item.gruppo, item.grado_sfida].join(' ');
    }

    if (section === 'spells') {
      return [
        item.nome,
        item.scuola,
        item.classi?.join(' '),
        item.descrizione,
        item.livello,
      ].join(' ');
    }

    if (section === 'rules' || section === 'classes') {
      return [
        item.nome,
        item.capitolo,
        item.categoria,
        item.descrizione,
        ...(Array.isArray(item.sezioni)
          ? item.sezioni.flatMap((sectionEntry) => [
            sectionEntry.titolo,
            sectionEntry.descrizione,
            ...(Array.isArray(sectionEntry.righe)
              ? sectionEntry.righe.map((row) => Object.values(row || {}).join(' '))
              : []),
            ...(Array.isArray(sectionEntry.blocchi)
              ? sectionEntry.blocchi.map((block) => `${block.nome || ''} ${block.descrizione || ''}`)
              : []),
          ])
          : []),
      ].join(' ');
    }

    if (section === 'rules_glossary') {
      return [
        item.nome,
        item.lettera,
        item.descrittore,
        item.descrizione,
        item.vedi_anche?.join(' '),
        ...(Array.isArray(item.sezioni)
          ? item.sezioni.flatMap((sectionEntry) => [
            sectionEntry.titolo,
            sectionEntry.descrizione,
            ...(Array.isArray(sectionEntry.righe)
              ? sectionEntry.righe.map((row) => Object.values(row || {}).join(' '))
              : []),
            ...(Array.isArray(sectionEntry.blocchi)
              ? sectionEntry.blocchi.map((block) => `${block.nome || ''} ${block.descrizione || ''}`)
              : []),
          ])
          : []),
      ].join(' ');
    }

    return [
      item.nome,
      item.tipo,
      item.tipo_base,
      item.rarita,
      item.descrizione,
    ].join(' ');
  }

  /*
   * Crea il markup di un elemento nella lista.
   */
  function listItem(section, item) {
    return `
      <a class="list-item" href="#/${section}/${encodeURIComponent(item.id)}">
        <strong>${escapeHtml(item.nome || 'Senza nome')}</strong>
        <small>${escapeHtml(summaryLine(section, item))}</small>
      </a>
    `;
  }

  /*
   * Crea una riga riassuntiva sotto al nome dell’elemento.
   */
  function summaryLine(section, item) {
    if (section === 'monsters') {
      return [
        item.tipo,
        item.dimensione,
        item.grado_sfida ? `GS ${item.grado_sfida}` : null,
      ].filter(Boolean).join(' · ');
    }

    if (section === 'spells') {
      return [
        spellLevel(item),
        item.scuola,
        item.tempo_lancio,
      ].filter(Boolean).join(' · ');
    }

    if (section === 'rules' || section === 'classes') {
      return [
        item.categoria,
        item.pagine_sorgente ? `pag. ${item.pagine_sorgente}` : null,
      ].filter(Boolean).join(' · ');
    }

    if (section === 'rules_glossary') {
      return [
        item.descrittore ? capitalizeFirst(item.descrittore) : `Lettera ${item.lettera}`,
        item.pagine_sorgente ? `pag. ${item.pagine_sorgente}` : null,
      ].filter(Boolean).join(' · ');
    }

    return [
      item.tipo_base || item.tipo,
      item.rarita,
      item.richiede_sintonia ? 'sintonia' : null,
    ].filter(Boolean).join(' · ');
  }

  /*
   * Renderizza la scheda di dettaglio di un elemento.
   */
  function renderDetail(section, id) {
    const item = appState.data[section].find((entry) => entry.id === id);

    // Se l’id non esiste, torna alla lista della sezione.
    if (!item) {
      location.hash = `#/${section}`;
      return;
    }

    setView('detail');

    const previousNext = getSiblingLinks(section, id);

    views.detail.innerHTML = `
      <nav class="detail-nav" aria-label="Navigazione scheda">
        <a class="button" href="#/${section}">← Elenco</a>

        <div class="toolbar-row">
          ${previousNext.prev ? `<a class="button" href="#/${section}/${encodeURIComponent(previousNext.prev.id)}">‹</a>` : ''}
          ${previousNext.next ? `<a class="button" href="#/${section}/${encodeURIComponent(previousNext.next.id)}">›</a>` : ''}
        </div>
      </nav>

      <article class="detail-card detail-card--flat">
        ${renderDetailContent(section, item)}
      </article>
    `;

    /*
     * Gestisce il click sulla stella dei preferiti nel dettaglio.
     * Dopo il cambio, la scheda viene ridisegnata per aggiornare l’icona.
     */
    document.querySelector('#favorite-detail').addEventListener('click', () => {
      toggleFavorite(section, item.id);
      renderDetail(section, id);
    });

    bindDetailSheetActions(section, item);
  }

  /*
   * Collega le azioni "usa nella scheda" presenti nelle pagine dettaglio.
   */
  function bindDetailSheetActions(section, item) {
    views.detail.querySelector('[data-sheet-use-class]')?.addEventListener('click', () => {
      appState.characterSheet.classId = item.id;
      appState.characterSheet.spellcastingAbility = classDefaultSpellcastingAbility(item.id);
      saveCharacterSheet();
      location.hash = '#/character_sheet/overview';
    });

    views.detail.querySelector('[data-sheet-add-detail-spell]')?.addEventListener('click', () => {
      addSpellToCharacterSheet(item.id);
      location.hash = '#/character_sheet/spells';
    });

    views.detail.querySelector('[data-sheet-add-magic-item]')?.addEventListener('click', () => {
      addMagicItemToCharacterSheet(item);
      location.hash = '#/character_sheet/inventory';
    });
  }

  /*
   * Azioni contestuali disponibili dalle schede del reference.
   */
  function renderSheetActions(section, item) {
    if (section === 'classes') {
      return `
        <div class="sheet-actions">
          <button class="button button--primary" type="button" data-sheet-use-class="${escapeAttr(item.id)}">Usa per scheda</button>
          <a class="button button--ghost" href="#/character_sheet">Apri scheda</a>
        </div>
      `;
    }

    if (section === 'spells') {
      return `
        <div class="sheet-actions">
          <button class="button button--primary" type="button" data-sheet-add-detail-spell="${escapeAttr(item.id)}">Aggiungi alla scheda</button>
          <a class="button button--ghost" href="#/character_sheet/spells">Incantesimi scheda</a>
        </div>
      `;
    }

    if (section === 'magic_items') {
      return `
        <div class="sheet-actions">
          <button class="button button--primary" type="button" data-sheet-add-magic-item="${escapeAttr(item.id)}">Aggiungi all'inventario</button>
          <a class="button button--ghost" href="#/character_sheet/inventory">Inventario scheda</a>
        </div>
      `;
    }

    return '';
  }

  /*
   * Renderizza la scheda personaggio nativa.
   */
  function renderCharacterSheet(tab = 'overview') {
    const validTab = CHARACTER_SHEET_TABS.some(([id]) => id === tab) ? tab : 'overview';
    appState.characterSheetTab = validTab;

    setView('detail');

    views.detail.innerHTML = `
      <nav class="detail-nav" aria-label="Navigazione scheda personaggio">
        <a class="button" href="#/">Home</a>
        <div class="toolbar-row">
          <button class="button button--ghost" type="button" data-sheet-export>Esporta</button>
          <button class="button button--ghost" type="button" data-sheet-import>Importa</button>
          <button class="button button--ghost" type="button" data-sheet-reset>Nuova</button>
          <input id="character-sheet-import" class="visually-hidden" type="file" accept="application/json,.json">
        </div>
      </nav>

      <article class="detail-card detail-card--flat character-sheet">
        ${renderCharacterSheetHeader()}
        ${renderCharacterSheetTabs(validTab)}
        ${renderCharacterSheetTab(validTab)}
      </article>
    `;

    bindCharacterSheetEvents();
  }

  /*
   * Header della scheda con riepilogo derivato.
   */
  function renderCharacterSheetHeader() {
    const sheet = appState.characterSheet;
    const className = characterSheetClassName();
    const level = characterLevel();

    return `
      <header class="detail-header character-sheet-header">
        <div>
          <h2 class="detail-title">${escapeHtml(sheet.name || 'Scheda personaggio')}</h2>
          <p class="detail-kicker">${escapeHtml([className, level ? `livello ${level}` : null, sheet.ancestry].filter(Boolean).join(' · '))}</p>
        </div>
        <div class="sheet-badges" aria-label="Riepilogo personaggio">
          <span>BC ${escapeHtml(String(characterProficiencyBonus()))}</span>
          <span>CA ${escapeHtml(String(Number(sheet.armorClass) || 10))}</span>
          <span>PF ${escapeHtml(String(Number(sheet.currentHp) || 0))}/${escapeHtml(String(Number(sheet.maxHp) || 0))}</span>
        </div>
      </header>
    `;
  }

  /*
   * Navigazione interna della scheda.
   */
  function renderCharacterSheetTabs(activeTab) {
    return `
      <div class="sheet-tabs" role="tablist" aria-label="Sezioni scheda">
        ${CHARACTER_SHEET_TABS.map(([id, label]) => `
          <a
            class="sheet-tab${id === activeTab ? ' is-active' : ''}"
            href="#/character_sheet/${id}"
            role="tab"
            aria-selected="${id === activeTab}"
          >${escapeHtml(label)}</a>
        `).join('')}
      </div>
    `;
  }

  /*
   * Contenuto della tab attiva.
   */
  function renderCharacterSheetTab(tab) {
    if (tab === 'combat') return renderCharacterSheetCombat();
    if (tab === 'spells') return renderCharacterSheetSpells();
    if (tab === 'inventory') return renderCharacterSheetInventory();
    if (tab === 'notes') return renderCharacterSheetNotes();
    return renderCharacterSheetOverview();
  }

  /*
   * Tab principale: identita e caratteristiche.
   */
  function renderCharacterSheetOverview() {
    const sheet = appState.characterSheet;

    return `
      <section class="sheet-grid">
        <div class="sheet-panel">
          <h3>Identita</h3>
          <div class="sheet-form-grid">
            ${sheetField('name', 'Nome', sheet.name)}
            ${sheetSelect('classId', 'Classe', sheet.classId, characterClassOptions())}
            ${sheetNumberField('level', 'Livello', sheet.level, 1, 20)}
            ${sheetField('ancestry', 'Specie', sheet.ancestry)}
            ${sheetField('background', 'Background', sheet.background)}
            ${sheetField('alignment', 'Allineamento', sheet.alignment)}
            ${sheetNumberField('xp', 'PE', sheet.xp, 0)}
          </div>
        </div>

        <div class="sheet-panel">
          <h3>Caratteristiche</h3>
          <div class="ability-grid">
            ${ABILITY_META.map(([key, label, short]) => renderAbilityCard(key, label, short)).join('')}
          </div>
        </div>

        <div class="sheet-panel sheet-panel--wide">
          <h3>Progressione classe</h3>
          ${renderCharacterClassProgression()}
        </div>
      </section>
    `;
  }

  /*
   * Tab combattimento.
   */
  function renderCharacterSheetCombat() {
    const sheet = appState.characterSheet;
    const initiative = abilityModifier(sheet.abilities.dex) + (Number(sheet.initiativeBonus) || 0);

    return `
      <section class="sheet-grid">
        <div class="sheet-panel">
          <h3>Difesa e punti ferita</h3>
          <div class="sheet-form-grid sheet-form-grid--compact">
            ${sheetNumberField('armorClass', 'Classe Armatura', sheet.armorClass, 0)}
            ${sheetNumberField('currentHp', 'PF attuali', sheet.currentHp, 0)}
            ${sheetNumberField('maxHp', 'PF massimi', sheet.maxHp, 0)}
            ${sheetNumberField('tempHp', 'PF temporanei', sheet.tempHp, 0)}
            ${sheetField('hitDice', 'Dadi Vita', sheet.hitDice)}
            ${sheetNumberField('speed', 'Velocita (m)', sheet.speed, 0)}
            ${sheetNumberField('initiativeBonus', 'Bonus iniziativa extra', sheet.initiativeBonus)}
          </div>
        </div>

        <div class="sheet-panel">
          <h3>Tiri rapidi</h3>
          <div class="quick-dice sheet-rolls">
            <button type="button" data-dice-roll="${escapeAttr(rollFormula(20, initiative))}">Iniziativa ${escapeHtml(formatSigned(initiative))}</button>
            ${ABILITY_META.map(([key, label]) => {
              const modifier = abilityModifier(sheet.abilities[key]);
              return `<button type="button" data-dice-roll="${escapeAttr(rollFormula(20, modifier))}">${escapeHtml(label)} ${escapeHtml(formatSigned(modifier))}</button>`;
            }).join('')}
          </div>
        </div>

        <div class="sheet-panel sheet-panel--wide">
          <h3>Tiri salvezza</h3>
          <div class="save-grid">
            ${ABILITY_META.map(([key, label]) => renderSavingThrowControl(key, label)).join('')}
          </div>
        </div>

        <div class="sheet-panel sheet-panel--wide">
          <h3>Attacchi</h3>
          ${renderCharacterAttacks()}
        </div>
      </section>
    `;
  }

  /*
   * Tab incantesimi con catalogo SRD.
   */
  function renderCharacterSheetSpells() {
    const sheet = appState.characterSheet;
    const spellOptions = characterSpellOptions();
    const dc = 8 + characterProficiencyBonus() + abilityModifier(sheet.abilities[sheet.spellcastingAbility]);
    const attack = characterProficiencyBonus() + abilityModifier(sheet.abilities[sheet.spellcastingAbility]);

    return `
      <section class="sheet-grid">
        <div class="sheet-panel">
          <h3>Incantatore</h3>
          <div class="sheet-form-grid sheet-form-grid--compact">
            ${sheetSelect('spellcastingAbility', 'Caratteristica', sheet.spellcastingAbility, abilityOptions())}
            <div class="sheet-derived"><span>CD incantesimi</span><strong>${escapeHtml(String(dc))}</strong></div>
            <div class="sheet-derived"><span>Attacco incantesimo</span><strong>${escapeHtml(formatSigned(attack))}</strong></div>
          </div>
        </div>

        <div class="sheet-panel">
          <h3>Slot disponibili</h3>
          ${renderCharacterSpellSlots()}
        </div>

        <div class="sheet-panel">
          <h3>Aggiungi incantesimo</h3>
          <div class="sheet-inline-form">
            <label class="sheet-field">
              <span>Catalogo SRD</span>
              <select data-sheet-add-spell>
                <option value="">Scegli incantesimo</option>
                ${spellOptions.map((spell) => `<option value="${escapeAttr(spell.id)}">${escapeHtml(spellOptionLabel(spell))}</option>`).join('')}
              </select>
            </label>
          </div>
        </div>

        <div class="sheet-panel sheet-panel--wide">
          <h3>Incantesimi preparati</h3>
          ${renderPreparedSpells()}
        </div>
      </section>
    `;
  }

  /*
   * Tab inventario.
   */
  function renderCharacterSheetInventory() {
    const sheet = appState.characterSheet;

    return `
      <section class="sheet-grid">
        <div class="sheet-panel">
          <h3>Monete</h3>
          <div class="coin-grid">
            ${Object.entries({ pp: 'PP', mo: 'MO', ma: 'MA', mr: 'MR' }).map(([key, label]) => `
              <label class="sheet-field">
                <span>${label}</span>
                <input type="number" min="0" value="${escapeAttr(String(sheet.coins[key] ?? 0))}" data-sheet-coin="${escapeAttr(key)}">
              </label>
            `).join('')}
          </div>
        </div>

        <div class="sheet-panel sheet-panel--wide">
          <h3>Oggetti magici</h3>
          ${renderCharacterAttunementSummary()}
          ${renderCharacterSheetMagicItems()}
        </div>

        <div class="sheet-panel sheet-panel--wide">
          <h3>Equipaggiamento libero</h3>
          ${sheetTextArea('equipment', 'Armi, armature, oggetti, tesori...', sheet.equipment)}
        </div>
      </section>
    `;
  }

  /*
   * Tab note.
   */
  function renderCharacterSheetNotes() {
    const sheet = appState.characterSheet;

    return `
      <section class="sheet-grid">
        <div class="sheet-panel sheet-panel--wide">
          <h3>Diario e note</h3>
          ${sheetTextArea('notes', 'Appunti di sessione, PNG, luoghi, obiettivi...', sheet.notes)}
        </div>
      </section>
    `;
  }

  function renderAbilityCard(key, label, short) {
    const value = Number(appState.characterSheet.abilities[key]) || 10;
    const modifier = abilityModifier(value);

    return `
      <div class="ability-card">
        <label>
          <span>${escapeHtml(label)}</span>
          <input type="number" min="1" max="30" value="${escapeAttr(String(value))}" data-sheet-ability="${escapeAttr(key)}">
        </label>
        <strong>${escapeHtml(short)}</strong>
        <button type="button" data-dice-roll="${escapeAttr(rollFormula(20, modifier))}">${escapeHtml(formatSigned(modifier))}</button>
      </div>
    `;
  }

  function renderSavingThrowControl(key, label) {
    const sheet = appState.characterSheet;
    const modifier = abilityModifier(sheet.abilities[key]) + (sheet.savingThrows[key] ? characterProficiencyBonus() : 0);

    return `
      <label class="save-control">
        <input type="checkbox" ${sheet.savingThrows[key] ? 'checked' : ''} data-sheet-save="${escapeAttr(key)}">
        <span>${escapeHtml(label)}</span>
        <button type="button" data-dice-roll="${escapeAttr(rollFormula(20, modifier))}">${escapeHtml(formatSigned(modifier))}</button>
      </label>
    `;
  }

  function renderCharacterAttacks() {
    const attacks = appState.characterSheet.attacks;

    return `
      <form class="sheet-attack-form" data-sheet-add-attack>
        <label class="sheet-field">
          <span>Nome</span>
          <input type="text" name="name" placeholder="Spada lunga">
        </label>
        <label class="sheet-field">
          <span>Caratteristica</span>
          <select name="ability">
            ${abilityOptions().map((option) => `
              <option value="${escapeAttr(option.value)}">${escapeHtml(option.label)}</option>
            `).join('')}
          </select>
        </label>
        <label class="sheet-field">
          <span>Danni</span>
          <input type="text" name="damage" placeholder="1d8+3">
        </label>
        <label class="sheet-field">
          <span>Tipo</span>
          <input type="text" name="damageType" placeholder="taglienti">
        </label>
        <label class="sheet-check">
          <input type="checkbox" name="proficient" checked>
          <span>Competente</span>
        </label>
        <button class="button button--primary" type="submit">Aggiungi</button>
      </form>

      ${attacks.length ? `
        <div class="sheet-attack-list">
          ${attacks.map((attack) => renderCharacterAttack(attack)).join('')}
        </div>
      ` : '<p class="sheet-empty">Nessun attacco salvato.</p>'}
    `;
  }

  function renderCharacterAttack(attack) {
    const ability = ABILITY_META.find(([key]) => key === attack.ability)?.[2] || 'CAR';
    const attackBonus = characterAttackBonus(attack);
    const damage = String(attack.damage || '').trim();

    return `
      <article class="sheet-attack">
        <div class="sheet-attack-main">
          <strong>${escapeHtml(attack.name || 'Attacco')}</strong>
          <span>${escapeHtml([ability, attack.proficient ? 'competente' : null, attack.damageType].filter(Boolean).join(' · '))}</span>
          ${attack.notes ? `<p>${escapeHtml(attack.notes)}</p>` : ''}
        </div>
        <div class="sheet-attack-actions">
          <button type="button" data-dice-roll="${escapeAttr(rollFormula(20, attackBonus))}">Colpire ${escapeHtml(formatSigned(attackBonus))}</button>
          ${damage ? `<button type="button" data-dice-roll="${escapeAttr(damage)}">Danni ${escapeHtml(damage)}</button>` : ''}
          <button class="button button--ghost" type="button" data-sheet-remove-attack="${escapeAttr(attack.id)}">Rimuovi</button>
        </div>
      </article>
    `;
  }

  function renderCharacterSpellSlots() {
    const slots = characterSpellSlots();

    if (!slots.length) {
      return '<p class="sheet-empty">Nessuno slot indicato per classe e livello correnti.</p>';
    }

    return `
      <div class="sheet-slot-grid">
        ${slots.map(([label, value]) => `
          <div class="sheet-slot">
            <span>${escapeHtml(label.replace(/^Slot\s+/i, 'Liv. '))}</span>
            <strong>${escapeHtml(value)}</strong>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderPreparedSpells() {
    const spells = appState.characterSheet.preparedSpells
      .map((id) => appState.data.spells.find((spell) => spell.id === id))
      .filter(Boolean)
      .sort((a, b) => Number(a.livello) - Number(b.livello) || String(a.nome).localeCompare(String(b.nome), 'it'));

    if (!spells.length) {
      return '<p class="sheet-empty">Nessun incantesimo preparato.</p>';
    }

    return `
      <div class="prepared-spell-list">
        ${spells.map((spell) => `
          <article class="prepared-spell">
            <div>
              <a href="#/spells/${encodeURIComponent(spell.id)}">${escapeHtml(spell.nome)}</a>
              <span>${escapeHtml([spellLevel(spell), spell.scuola].filter(Boolean).join(' · '))}</span>
            </div>
            <button class="button button--ghost" type="button" data-sheet-remove-spell="${escapeAttr(spell.id)}">Rimuovi</button>
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderCharacterSheetMagicItems() {
    const items = appState.characterSheet.magicItems
      .map((entry) => {
        const source = appState.data.magic_items.find((item) => item.id === entry.id);
        return {
          id: entry.id,
          name: source?.nome || entry.name || entry.id,
          summary: entry.summary || [source?.tipo_base || source?.tipo, source?.rarita, source?.richiede_sintonia ? 'richiede sintonia' : null]
            .filter(Boolean)
            .join(' · '),
          requiresAttunement: magicItemRequiresAttunement(entry, source),
        };
      })
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'it'));

    if (!items.length) {
      return '<p class="sheet-empty">Nessun oggetto magico collegato.</p>';
    }

    return `
      <div class="sheet-item-list">
        ${items.map((item) => `
          <article class="sheet-item">
            <div>
              <a href="#/magic_items/${encodeURIComponent(item.id)}">${escapeHtml(item.name)}</a>
              ${item.summary ? `<span>${escapeHtml(item.summary)}</span>` : ''}
            </div>
            <div class="sheet-item-actions">
              ${item.requiresAttunement ? `
                <label class="sheet-check sheet-check--compact">
                  <input type="checkbox" ${appState.characterSheet.attunedMagicItems.includes(item.id) ? 'checked' : ''} data-sheet-toggle-attunement="${escapeAttr(item.id)}">
                  <span>Sintonia</span>
                </label>
              ` : ''}
              <button class="button button--ghost" type="button" data-sheet-remove-magic-item="${escapeAttr(item.id)}">Rimuovi</button>
            </div>
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderCharacterAttunementSummary() {
    const attunedItems = appState.characterSheet.attunedMagicItems
      .map((id) => appState.data.magic_items.find((item) => item.id === id))
      .filter(Boolean);
    const count = attunedItems.length;

    return `
      <div class="sheet-attunement">
        <div class="sheet-attunement-meter">
          <span>Sintonia</span>
          <strong>${escapeHtml(String(count))}/3</strong>
        </div>
        <p>${escapeHtml(count ? attunedItems.map((item) => item.nome).join(', ') : 'Nessun oggetto in sintonia.')}</p>
      </div>
    `;
  }

  function renderCharacterClassProgression() {
    const classEntry = characterClassEntry();

    if (!classEntry) {
      return '<p class="sheet-empty">Scegli una classe per vedere progressione e privilegi disponibili.</p>';
    }

    const level = characterLevel();
    const progression = classProgressionSection(classEntry);
    const currentRow = classProgressionRow(classEntry, level);
    const nextRow = level < 20 ? classProgressionRow(classEntry, level + 1) : null;
    const featureNames = splitClassFeatures(currentRow?.['Privilegi di classe']);
    const resourceRows = classProgressionResources(currentRow);
    const subclassRows = classSubclassRows(classEntry, level);

    return `
      <div class="sheet-class-summary">
        <div class="sheet-class-heading">
          <div>
            <strong>${escapeHtml(classEntry.nome.replace(/^Classe:\s*/i, ''))}</strong>
            <span>${escapeHtml(`Livello ${level}`)}</span>
          </div>
          <a class="button button--ghost" href="#/classes/${encodeURIComponent(classEntry.id)}">Apri classe</a>
        </div>

        ${currentRow ? `
          <div class="sheet-class-stats">
            <div class="sheet-derived">
              <span>Bonus competenza</span>
              <strong>${escapeHtml(currentRow['Bonus di competenza'] || formatSigned(characterProficiencyBonus()))}</strong>
            </div>
            ${resourceRows.map(([label, value]) => `
              <div class="sheet-derived">
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(value)}</strong>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="sheet-class-block">
          <h4>Privilegi del livello</h4>
          ${featureNames.length ? `
            <ul class="sheet-chip-list">
              ${featureNames.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}
            </ul>
          ` : '<p class="sheet-empty">Nessun nuovo privilegio indicato per questo livello.</p>'}
        </div>

        ${subclassRows.length ? `
          <div class="sheet-class-block">
            <h4>Sottoclasse SRD sbloccata</h4>
            <div class="sheet-item-list">
              ${subclassRows.map((row) => `
                <article class="sheet-item">
                  <div>
                    <strong>${escapeHtml(row.Privilegio || 'Privilegio')}</strong>
                    <span>${escapeHtml(`Livello ${row.Livello}${row.Riepilogo ? ` · ${row.Riepilogo}` : ''}`)}</span>
                  </div>
                </article>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${nextRow ? `
          <div class="sheet-class-block">
            <h4>Prossimo livello</h4>
            <p>${escapeHtml(nextLevelSummary(nextRow))}</p>
          </div>
        ` : ''}

        ${!progression ? '<p class="sheet-empty">Progressione non disponibile nei dati locali.</p>' : ''}
      </div>
    `;
  }

  function sheetField(key, label, value) {
    return `
      <label class="sheet-field">
        <span>${escapeHtml(label)}</span>
        <input type="text" value="${escapeAttr(value || '')}" data-sheet-field="${escapeAttr(key)}">
      </label>
    `;
  }

  function sheetNumberField(key, label, value, min, max) {
    return `
      <label class="sheet-field">
        <span>${escapeHtml(label)}</span>
        <input
          type="number"
          value="${escapeAttr(String(value ?? 0))}"
          ${min !== undefined ? `min="${escapeAttr(String(min))}"` : ''}
          ${max !== undefined ? `max="${escapeAttr(String(max))}"` : ''}
          data-sheet-number="${escapeAttr(key)}"
        >
      </label>
    `;
  }

  function sheetSelect(key, label, value, options) {
    return `
      <label class="sheet-field">
        <span>${escapeHtml(label)}</span>
        <select data-sheet-field="${escapeAttr(key)}">
          ${options.map((option) => `
            <option value="${escapeAttr(option.value)}"${option.value === value ? ' selected' : ''}>${escapeHtml(option.label)}</option>
          `).join('')}
        </select>
      </label>
    `;
  }

  function sheetTextArea(key, placeholder, value) {
    return `
      <label class="sheet-field sheet-field--wide">
        <span class="visually-hidden">${escapeHtml(placeholder)}</span>
        <textarea data-sheet-field="${escapeAttr(key)}" placeholder="${escapeAttr(placeholder)}">${escapeHtml(value || '')}</textarea>
      </label>
    `;
  }

  function bindCharacterSheetEvents() {
    views.detail.querySelectorAll('[data-sheet-field]').forEach((node) => {
      node.addEventListener('input', (event) => {
        appState.characterSheet[event.currentTarget.dataset.sheetField] = event.currentTarget.value;
        saveCharacterSheet();
      });

      node.addEventListener('change', () => renderCharacterSheet(appState.characterSheetTab));
    });

    views.detail.querySelectorAll('[data-sheet-number]').forEach((node) => {
      node.addEventListener('input', (event) => {
        appState.characterSheet[event.currentTarget.dataset.sheetNumber] = Number(event.currentTarget.value) || 0;
        saveCharacterSheet();
      });

      node.addEventListener('change', () => renderCharacterSheet(appState.characterSheetTab));
    });

    views.detail.querySelectorAll('[data-sheet-ability]').forEach((node) => {
      node.addEventListener('input', (event) => {
        appState.characterSheet.abilities[event.currentTarget.dataset.sheetAbility] = Number(event.currentTarget.value) || 0;
        saveCharacterSheet();
      });

      node.addEventListener('change', () => renderCharacterSheet(appState.characterSheetTab));
    });

    views.detail.querySelectorAll('[data-sheet-save]').forEach((node) => {
      node.addEventListener('change', (event) => {
        appState.characterSheet.savingThrows[event.currentTarget.dataset.sheetSave] = event.currentTarget.checked;
        saveCharacterSheet();
        renderCharacterSheet(appState.characterSheetTab);
      });
    });

    views.detail.querySelector('[data-sheet-add-attack]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();

      if (!name) return;

      appState.characterSheet.attacks.push({
        id: `attack-${Date.now().toString(36)}`,
        name,
        ability: String(data.get('ability') || 'str'),
        proficient: data.get('proficient') === 'on',
        bonus: 0,
        damage: String(data.get('damage') || '').trim(),
        damageType: String(data.get('damageType') || '').trim(),
        notes: '',
      });
      saveCharacterSheet();
      renderCharacterSheet('combat');
    });

    views.detail.querySelectorAll('[data-sheet-remove-attack]').forEach((node) => {
      node.addEventListener('click', (event) => {
        const id = event.currentTarget.dataset.sheetRemoveAttack;
        appState.characterSheet.attacks = appState.characterSheet.attacks.filter((attack) => attack.id !== id);
        saveCharacterSheet();
        renderCharacterSheet('combat');
      });
    });

    views.detail.querySelectorAll('[data-sheet-coin]').forEach((node) => {
      node.addEventListener('input', (event) => {
        appState.characterSheet.coins[event.currentTarget.dataset.sheetCoin] = Number(event.currentTarget.value) || 0;
        saveCharacterSheet();
      });
    });

    views.detail.querySelector('[data-sheet-add-spell]')?.addEventListener('change', (event) => {
      const id = event.currentTarget.value;
      if (id) {
        addSpellToCharacterSheet(id);
        renderCharacterSheet('spells');
      }
    });

    views.detail.querySelectorAll('[data-sheet-remove-spell]').forEach((node) => {
      node.addEventListener('click', (event) => {
        const id = event.currentTarget.dataset.sheetRemoveSpell;
        appState.characterSheet.preparedSpells = appState.characterSheet.preparedSpells.filter((spellId) => spellId !== id);
        saveCharacterSheet();
        renderCharacterSheet('spells');
      });
    });

    views.detail.querySelectorAll('[data-sheet-remove-magic-item]').forEach((node) => {
      node.addEventListener('click', (event) => {
        const id = event.currentTarget.dataset.sheetRemoveMagicItem;
        appState.characterSheet.magicItems = appState.characterSheet.magicItems.filter((item) => item.id !== id);
        appState.characterSheet.attunedMagicItems = appState.characterSheet.attunedMagicItems.filter((itemId) => itemId !== id);
        saveCharacterSheet();
        renderCharacterSheet('inventory');
      });
    });

    views.detail.querySelectorAll('[data-sheet-toggle-attunement]').forEach((node) => {
      node.addEventListener('change', (event) => {
        const id = event.currentTarget.dataset.sheetToggleAttunement;
        if (event.currentTarget.checked) {
          appState.characterSheet.attunedMagicItems = normalizeIdList([...appState.characterSheet.attunedMagicItems, id]);
        } else {
          appState.characterSheet.attunedMagicItems = appState.characterSheet.attunedMagicItems.filter((itemId) => itemId !== id);
        }
        saveCharacterSheet();
        renderCharacterSheet('inventory');
      });
    });

    views.detail.querySelector('[data-sheet-export]')?.addEventListener('click', exportCharacterSheet);
    views.detail.querySelector('[data-sheet-import]')?.addEventListener('click', () => {
      views.detail.querySelector('#character-sheet-import')?.click();
    });
    views.detail.querySelector('#character-sheet-import')?.addEventListener('change', importCharacterSheet);
    views.detail.querySelector('[data-sheet-reset]')?.addEventListener('click', () => {
      if (!confirm('Creare una nuova scheda vuota?')) return;
      appState.characterSheet = normalizeCharacterSheet({});
      saveCharacterSheet();
      renderCharacterSheet('overview');
    });
  }

  function exportCharacterSheet() {
    const blob = new Blob([JSON.stringify(appState.characterSheet, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileSafeName(appState.characterSheet.name || 'personaggio')}-dnd-reference.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importCharacterSheet(event) {
    const [file] = event.currentTarget.files || [];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      try {
        appState.characterSheet = normalizeCharacterSheet(JSON.parse(reader.result));
        saveCharacterSheet();
        renderCharacterSheet('overview');
      } catch {
        alert('File scheda non valido.');
      }
    });
    reader.readAsText(file);
    event.currentTarget.value = '';
  }

  function characterClassOptions() {
    return [
      { value: '', label: 'Nessuna classe' },
      ...appState.data.classes.map((entry) => ({ value: entry.id, label: entry.nome.replace(/^Classe:\s*/i, '') })),
    ];
  }

  function characterClassEntry() {
    return appState.data.classes.find((entry) => entry.id === appState.characterSheet.classId);
  }

  function classProgressionSection(classEntry) {
    return classEntry?.sezioni?.find((section) => section.titolo === 'Progressione di classe') || null;
  }

  function classProgressionRow(classEntry, level) {
    const progression = classProgressionSection(classEntry);
    return progression?.righe?.find((row) => Number(row.Livello) === Number(level)) || null;
  }

  function classProgressionResources(row) {
    if (!row) return [];

    return Object.entries(row)
      .filter(([label, value]) => {
        const text = String(value || '').trim();
        return (
          !['Livello', 'Bonus di competenza', 'Privilegi di classe'].includes(label) &&
          text !== '' &&
          text !== '-'
        );
      })
      .slice(0, 10);
  }

  function characterSpellSlots() {
    const row = classProgressionRow(characterClassEntry(), characterLevel());

    if (!row) return [];

    return Object.entries(row)
      .filter(([label, value]) => {
        const text = String(value || '').trim();
        return /^Slot\s+/i.test(label) && text !== '' && text !== '-';
      });
  }

  function splitClassFeatures(value) {
    const text = String(value || '').trim();
    if (!text || text === '-') return [];

    return text
      .split(',')
      .map((feature) => feature.trim())
      .filter(Boolean);
  }

  function classSubclassRows(classEntry, level) {
    const subclass = classEntry?.sezioni?.find((section) => String(section.titolo || '').startsWith('Sottoclasse '));

    return (subclass?.righe || [])
      .filter((row) => Number(row.Livello) <= Number(level))
      .sort((a, b) => Number(a.Livello) - Number(b.Livello));
  }

  function nextLevelSummary(row) {
    const features = splitClassFeatures(row?.['Privilegi di classe']);
    const prefix = `Livello ${row?.Livello || ''}`;

    if (!features.length) return `${prefix}: nessun nuovo privilegio indicato.`;
    return `${prefix}: ${features.join(', ')}.`;
  }

  function characterAttackBonus(attack) {
    const ability = ABILITY_META.some(([key]) => key === attack.ability) ? attack.ability : 'str';
    const proficiency = attack.proficient ? characterProficiencyBonus() : 0;

    return abilityModifier(appState.characterSheet.abilities[ability]) + proficiency + (Number(attack.bonus) || 0);
  }

  /*
   * Aggiunge un incantesimo alla scheda evitando duplicati.
   */
  function addSpellToCharacterSheet(id) {
    if (!id || appState.characterSheet.preparedSpells.includes(id)) return false;

    appState.characterSheet.preparedSpells.push(id);
    saveCharacterSheet();
    return true;
  }

  /*
   * Collega un oggetto magico alla scheda evitando duplicati.
   */
  function addMagicItemToCharacterSheet(item) {
    if (!item?.id || appState.characterSheet.magicItems.some((entry) => entry.id === item.id)) return false;

    const summary = [item.tipo_base || item.tipo, item.rarita, item.richiede_sintonia ? 'richiede sintonia' : null]
      .filter(Boolean)
      .join(' · ');

    appState.characterSheet.magicItems.push({
      id: item.id,
      name: item.nome,
      summary,
    });
    saveCharacterSheet();
    return true;
  }

  function magicItemRequiresAttunement(entry, source) {
    if (source?.richiede_sintonia) return true;
    return String(entry?.summary || '').toLowerCase().includes('richiede sintonia');
  }

  /*
   * Caratteristica da incantatore predefinita per classe, quando nota.
   */
  function classDefaultSpellcastingAbility(classId) {
    const defaults = {
      classe_bardo: 'cha',
      classe_chierico: 'wis',
      classe_druido: 'wis',
      classe_mago: 'int',
      classe_paladino: 'cha',
      classe_ranger: 'wis',
      classe_stregone: 'cha',
      classe_warlock: 'cha',
    };

    return defaults[classId] || appState.characterSheet.spellcastingAbility || 'int';
  }

  function abilityOptions() {
    return ABILITY_META.map(([value, label]) => ({ value, label }));
  }

  function characterSpellOptions() {
    const className = characterSheetClassName().toLowerCase();

    return appState.data.spells
      .filter((spell) => !className || spell.classi?.includes(className))
      .sort((a, b) => Number(a.livello) - Number(b.livello) || String(a.nome).localeCompare(String(b.nome), 'it'));
  }

  function spellOptionLabel(spell) {
    return [spell.nome, spellLevel(spell), spell.scuola].filter(Boolean).join(' · ');
  }

  function characterSheetClassName() {
    const classEntry = appState.data.classes.find((entry) => entry.id === appState.characterSheet.classId);
    return classEntry ? classEntry.nome.replace(/^Classe:\s*/i, '') : '';
  }

  function characterLevel() {
    return Math.min(20, Math.max(1, Number(appState.characterSheet.level) || 1));
  }

  function characterProficiencyBonus() {
    const level = characterLevel();
    if (level >= 17) return 6;
    if (level >= 13) return 5;
    if (level >= 9) return 4;
    if (level >= 5) return 3;
    return 2;
  }

  function abilityModifier(score) {
    return Math.floor(((Number(score) || 10) - 10) / 2);
  }

  function formatSigned(value) {
    const number = Number(value) || 0;
    return number >= 0 ? `+${number}` : String(number);
  }

  function rollFormula(faces, modifier) {
    const value = Number(modifier) || 0;
    if (!value) return `1d${faces}`;
    return `1d${faces} ${value > 0 ? '+' : '-'} ${Math.abs(value)}`;
  }

  function fileSafeName(value) {
    return normalizeText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'personaggio';
  }

  /*
   * Gestisce tutti i comandi del dice roller, inclusi quelli inline.
   */
  function handleRollCommand(event) {
    const toggleButton = event.target.closest('[data-roll-toggle]');

    if (toggleButton) {
      appState.rollTrayOpen = !appState.rollTrayOpen;
      renderRollTray();
      return;
    }

    const attackButton = event.target.closest('[data-attack-roll]');

    if (attackButton) {
      const modifier = Number(attackButton.getAttribute('data-attack-roll'));
      const mode = attackButton.getAttribute('data-attack-mode') || 'normal';

      if (!Number.isFinite(modifier)) return;

      showRollResult(rollAttack(modifier, mode));
      return;
    }

    const scalingButton = event.target.closest('[data-scaling-roll]');

    if (scalingButton) {
      const formula = scalingButton.getAttribute('data-scaling-roll');
      const parsed = parseDiceFormula(formula);

      if (!parsed) return;

      showRollResult({
        ...rollDice(parsed),
        kind: 'scaling',
      });
      return;
    }

    const rollButton = event.target.closest('[data-dice-roll]');

    if (rollButton) {
      const formula = rollButton.getAttribute('data-dice-roll');
      const parsed = parseDiceFormula(formula);

      if (!parsed) return;

      showRollResult(rollDice(parsed));
      return;
    }

    if (event.target.closest('[data-roll-clear]')) {
      appState.rollHistory = [];
      appState.rollError = '';
      appState.rollTrayOpen = false;
      renderRollTray();
      return;
    }

    const quickButton = event.target.closest('[data-quick-roll]');

    if (quickButton) {
      const parsed = parseDiceFormula(quickButton.getAttribute('data-quick-roll'));

      if (!parsed) return;

      appState.rollError = '';
      showRollResult(rollDice(parsed));
    }
  }

  /*
   * Gestisce l'input libero del dice tray globale.
   */
  function handleRollSubmit(event) {
    const form = event.target.closest('#roll-tray-form');
    if (!form) return;

    event.preventDefault();

    const input = form.querySelector('#roll-tray-input');
    const parsed = parseDiceFormula(input?.value || '');

    if (!parsed) {
      appState.rollError = 'Formula non valida. Usa esempi come 1d20 + 5 o 2d6.';
      appState.rollTrayOpen = true;
      renderRollTray();
      return;
    }

    appState.rollError = '';
    showRollResult(rollDice(parsed));
  }

  /*
   * Trova elemento precedente e successivo nella lista filtrata.
   * Così i pulsanti ‹ e › rispettano ricerca e filtri attivi.
   */
  function getSiblingLinks(section, id) {
    const items = getFilteredItems(section);
    const index = items.findIndex((item) => item.id === id);

    return {
      prev: items[index - 1] || null,
      next: items[index + 1] || null,
    };
  }

  /*
   * Smista il rendering del dettaglio in base alla sezione.
   */
  function renderDetailContent(section, item) {
    if (section === 'monsters') return renderMonster(item);
    if (section === 'spells') return renderSpell(item);
    if (section === 'classes') return renderClass(item);
    if (section === 'rules') return renderRule(item);
    if (section === 'rules_glossary') return renderGlossaryEntry(item);
    return renderMagicItem(item);
  }

  /*
   * Header comune per tutte le schede di dettaglio.
   * Include titolo, sottotitolo e pulsante preferito.
   */
  function renderHeader(section, item, kicker) {
    const pressed = isFavorite(section, item.id);

    return `
      <header class="detail-header">
        <div>
          <h2 class="detail-title">${escapeHtml(item.nome)}</h2>
          <p class="detail-kicker">${escapeHtml(kicker || '')}</p>
        </div>

        <button
          id="favorite-detail"
          class="button favorite-btn"
          type="button"
          aria-pressed="${pressed}"
        >
          ${pressed ? '★' : '☆'}
        </button>
      </header>
    `;
  }

  /*
   * Renderizza la scheda di un mostro.
   */
  function renderMonster(monster) {
    const image = appState.monsterImages.get(monster.id)?.immagine;
    const showImages = appState.config.site?.show_monster_images !== false;

    return `
      <div class="monster-hero">
        <div>
          ${renderHeader(
            'monsters',
            monster,
            [monster.dimensione, monster.tipo, monster.allineamento].filter(Boolean).join(' · ')
          )}

          ${compactMeta([
            ['CA', monster.statistiche?.classe_armatura],
            ['PF', monster.statistiche?.punti_ferita],
            ['Vel.', monster.statistiche?.velocita],
            ['Iniz.', monster.statistiche?.iniziativa],
            ['GS', monster.grado_sfida_raw || monster.grado_sfida],
            ['BC', monster.bonus_competenza],
            ['Sensi', monster.sensi],
            ['Lingue', monster.lingue],
          ])}
        </div>

        ${showImages ? renderMonsterImage(image) : ''}
      </div>

      ${renderAbilityScores(monster.caratteristiche)}

      ${compactMeta([
        ['Abilità', monster.abilita],
        ['Resistenze', monster.resistenze],
        ['Immunità danni', monster.immunita_danni],
        ['Immunità condizioni', monster.immunita_condizione],
        ['Vulnerabilità', monster.vulnerabilita],
        ['Attrezzatura', monster.attrezzatura],
      ])}

      ${renderEntries('Tratti', monster.tratti)}
      ${renderEntries('Azioni', monster.azioni)}
      ${renderEntries('Azioni bonus', monster.azioni_bonus)}
      ${renderEntries('Reazioni', monster.reazioni)}
      ${renderLegendary(monster.azioni_leggendarie)}
    `;
  }

  /*
   * Renderizza immagine del mostro o fallback testuale.
   */
  function renderMonsterImage(src) {
    const fallback = escapeHtml(appState.config.site?.image_fallback_text || 'Immagine non disponibile');

    if (!src) {
      return `<div class="monster-image-fallback">${fallback}</div>`;
    }

    return `
      <img
        class="monster-image"
        src="${escapeAttr(src)}"
        alt="Immagine del mostro"
        loading="lazy"
        onerror="this.replaceWith(Object.assign(document.createElement('div'), {
          className: 'monster-image-fallback',
          textContent: '${escapeAttr(fallback)}'
        }))"
      >
    `;
  }

  /*
   * Renderizza la scheda di un incantesimo.
   */
  function renderSpell(spell) {
    return `
      ${renderHeader(
        'spells',
        spell,
        [spellLevel(spell), spell.scuola].filter(Boolean).join(' · ')
      )}
      ${renderSheetActions('spells', spell)}

      ${compactMeta([
        ['Livello', spellLevel(spell)],
        ['Scuola', spell.scuola],
        ['Tempo', spell.tempo_lancio],
        ['Gittata', spell.gittata],
        ['Componenti', spell.componenti],
        ['Durata', spell.durata],
        ['Classi', spell.classi?.join(', ')],
      ])}

      <div class="description">${formatInline(spell.descrizione || '')}</div>
      ${renderRollContextNote(spell)}

      ${renderScalingEntries('Slot superiori', spell.scaling, spell)}
      ${renderSections('Sezioni', spell.sezioni)}
    `;
  }

  /*
   * Segnala incantesimi con danni ripetuti o multi-bersaglio senza automatizzare.
   */
  function renderRollContextNote(spell) {
    const context = analyzeRollContext(spellRollText(spell));

    if (!context.notes.length) return '';

    return `
      <p class="roll-context">
        <strong>Tiri situazionali.</strong>
        Ripeti il tiro ${escapeHtml(context.notes.join(' e '))}, secondo il testo dell'incantesimo.
      </p>
    `;
  }

  /*
   * Raccoglie il testo rilevante di un incantesimo per analisi non invasiva.
   */
  function spellRollText(spell) {
    const sections = Array.isArray(spell?.sezioni) ? spell.sezioni : [];
    const scaling = Array.isArray(spell?.scaling) ? spell.scaling : [];
    const parts = [
      spell?.descrizione || '',
      ...scaling.map((entry) => `${entry?.nome || ''} ${entry?.descrizione || ''}`),
      ...sections.flatMap((section) => [
        section?.titolo || '',
        section?.descrizione || '',
        ...(Array.isArray(section?.righe)
          ? section.righe.map((row) => `${row?.chiave || ''} ${row?.valore || ''}`)
          : []),
        ...(Array.isArray(section?.blocchi)
          ? section.blocchi.map((entry) => `${entry?.nome || ''} ${entry?.descrizione || ''}`)
          : []),
        ...(Array.isArray(section?.voci)
          ? section.voci.map((entry) => `${entry?.nome || ''} ${entry?.descrizione || ''}`)
          : []),
      ]),
    ];

    return parts.filter(Boolean).join('\n');
  }

  /*
   * Renderizza la scheda di un oggetto magico.
   */
  function renderMagicItem(item) {
    return `
      ${renderHeader(
        'magic_items',
        item,
        [item.tipo_base || item.tipo, item.rarita].filter(Boolean).join(' · ')
      )}
      ${renderSheetActions('magic_items', item)}

      ${compactMeta([
        ['Tipo', item.tipo],
        ['Rarità', item.rarita],
        ['Sintonia', item.richiede_sintonia ? 'Sì' : 'No'],
      ])}

      <div class="description">${formatInline(item.descrizione || '')}</div>

      ${renderEntries('Proprietà', item.proprieta)}
      ${renderSections('Tabelle e sezioni', item.sezioni)}
    `;
  }

  /*
   * Renderizza una voce delle regole SRD.
   */
  function renderRule(rule) {
    return `
      ${renderHeader(
        'rules',
        rule,
        [rule.categoria, rule.pagine_sorgente ? `pag. ${rule.pagine_sorgente}` : null].filter(Boolean).join(' · ')
      )}

      ${compactMeta([
        ['Capitolo', rule.capitolo],
        ['Categoria', rule.categoria],
        ['Pagine SRD', rule.pagine_sorgente],
      ])}

      <div class="description">${formatInline(rule.descrizione || '')}</div>

      ${renderSections('Dettagli', rule.sezioni)}
    `;
  }

  /*
   * Renderizza una classe come scheda autonoma.
   */
  function renderClass(rule) {
    return `
      ${renderHeader(
        'classes',
        rule,
        [rule.categoria, rule.pagine_sorgente ? `pag. ${rule.pagine_sorgente}` : null].filter(Boolean).join(' · ')
      )}
      ${renderSheetActions('classes', rule)}

      ${compactMeta([
        ['Capitolo', rule.capitolo],
        ['Pagine SRD', rule.pagine_sorgente],
      ])}

      <div class="description">${formatInline(rule.descrizione || '')}</div>

      ${renderSections('Dettagli', rule.sezioni)}
    `;
  }

  /*
   * Renderizza una voce del glossario delle regole.
   */
  function renderGlossaryEntry(entry) {
    return `
      ${renderHeader(
        'rules_glossary',
        entry,
        [entry.descrittore ? capitalizeFirst(entry.descrittore) : null, entry.pagine_sorgente ? `pag. ${entry.pagine_sorgente}` : null].filter(Boolean).join(' · ')
      )}

      ${compactMeta([
        ['Lettera', entry.lettera],
        ['Descrittore', entry.descrittore ? capitalizeFirst(entry.descrittore) : null],
        ['Pagine SRD', entry.pagine_sorgente],
        ['Vedi anche', Array.isArray(entry.vedi_anche) ? entry.vedi_anche.join(', ') : null],
      ])}

      <div class="description">${formatInline(entry.descrizione || '')}</div>

      ${renderSections('Dettagli', entry.sezioni)}
    `;
  }

  /*
   * Crea una lista compatta di metadati.
   * Scarta automaticamente righe vuote, null, undefined o array vuoti.
   */
  function compactMeta(rows) {
    const list = rows.filter(([, value]) => {
      return (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        !(Array.isArray(value) && !value.length)
      );
    });

    if (!list.length) return '';

    return `
      <ul class="meta-list">
        ${list
          .map(([label, value]) => `
            <li>
              <b>${escapeHtml(label)}:</b> ${escapeHtml(String(value))}
            </li>
          `)
          .join('')}
      </ul>
    `;
  }

  /*
   * Renderizza le sei caratteristiche di un mostro.
   */
  function renderAbilityScores(scores = {}) {
    const labels = {
      forza: 'FOR',
      destrezza: 'DES',
      costituzione: 'COS',
      intelligenza: 'INT',
      saggezza: 'SAG',
      carisma: 'CAR',
    };

    return `
      <div class="stats-row">
        ${Object.entries(labels)
          .map(([key, label]) => {
            const stat = scores[key] || {};

            return `
              <div class="stat">
                <b>${label}</b>
                ${escapeHtml(String(stat.valore ?? '-'))}
                <span>${escapeHtml(formatAbilityModifier(stat.modificatore))}</span>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }

  /*
   * Garantisce che il modificatore sia mostrato tra parentesi.
   */
  function formatAbilityModifier(modifier) {
    if (!modifier) return '';

    const text = String(modifier).trim();

    return text.startsWith('(') && text.endsWith(')')
      ? text
      : `(${text})`;
  }

  /*
   * Renderizza sezioni composte da voci nome + descrizione.
   * Usata per tratti, azioni, reazioni, sezioni di incantesimi, ecc.
   */
  function renderEntries(title, entries) {
    if (!Array.isArray(entries) || entries.length === 0) return '';

    const content = entries.map(renderEntry).filter(Boolean).join('');
    if (!content) return '';

    return `
      <section class="content-section">
        <h3>${escapeHtml(title)}</h3>

        ${content}
      </section>
    `;
  }

  /*
   * Renderizza gli scaling degli incantesimi con controlli extra-slot
   * solo quando il testo descrive un incremento lineare chiaro.
   */
  function renderScalingEntries(title, entries, spell) {
    if (!Array.isArray(entries) || entries.length === 0) return '';

    const content = entries.map((entry) => {
      const scaling = parsePerSlotScaling(entry.descrizione || '', spell);

      return `
        ${renderEntry(entry)}
        ${scaling ? renderScalingControls(scaling) : ''}
      `;
    }).filter(Boolean).join('');

    if (!content) return '';

    return `
      <section class="content-section">
        <h3>${escapeHtml(title)}</h3>
        ${content}
      </section>
    `;
  }

  /*
   * Crea i bottoni rapidi per gli incrementi da slot superiori.
   */
  function renderScalingControls(scaling) {
    const options = [1, 2, 3, 4];

    return `
      <div class="scaling-controls" aria-label="Tira danni a slot superiore">
        <span>Slot superiore</span>
        ${options.map((multiplier) => `
          <button
            type="button"
            data-scaling-roll="${escapeAttr(scalingFormulaForMultiplier(scaling, multiplier))}"
            aria-label="Tira ${escapeAttr(scalingFormulaForMultiplier(scaling, multiplier))} con slot +${multiplier}"
          >+${multiplier}</button>
        `).join('')}
      </div>
    `;
  }

  /*
   * Renderizza una singola voce testuale.
   */
  function renderEntry(entry) {
    if (!entry) return '';

    const name = entry.nome || entry.chiave || '';
    const description = entry.descrizione || entry.valore || '';

    if (!name && !description) return '';

    return `
      <div class="entry">
        ${name ? `<span class="entry-title">${escapeHtml(name)}</span>` : ''}
        ${description ? `<p>${formatInline(description)}</p>` : ''}
      </div>
    `;
  }

  /*
   * Renderizza sezioni strutturate provenienti dai JSON.
   * Supporta sia blocchi nome/descrizione sia righe tabellari chiave/valore.
   */
  function renderSections(title, sections) {
    if (!Array.isArray(sections) || sections.length === 0) return '';

    const content = sections.map(renderSection).filter(Boolean).join('');
    if (!content) return '';

    return `
      <section class="content-section">
        <h3>${escapeHtml(title)}</h3>
        ${content}
      </section>
    `;
  }

  /*
   * Renderizza una sezione libera o tabellare.
   */
  function renderSection(section) {
    if (!section) return '';

    const rows = Array.isArray(section.righe) ? section.righe : [];
    const blocks = Array.isArray(section.blocchi) ? section.blocchi : [];
    const entries = Array.isArray(section.voci) ? section.voci : [];
    const columns = Array.isArray(section.colonne) ? section.colonne : [];
    const body = [
      rows.length ? renderSectionRows(section, rows, columns) : '',
      blocks.length ? blocks.map(renderEntry).filter(Boolean).join('') : '',
      entries.length ? entries.map(renderEntry).filter(Boolean).join('') : '',
      section.descrizione ? `<div class="description">${formatInline(section.descrizione)}</div>` : '',
    ].filter(Boolean).join('');

    if (!body) return '';

    return `
      <div class="subsection">
        ${section.titolo ? `<h4>${escapeHtml(section.titolo)}</h4>` : ''}
        ${body}
      </div>
    `;
  }

  /*
   * Alcune sezioni tabellari hanno un rendering specifico, ad esempio le
   * liste incantesimi delle classi raggruppate per livello.
   */
  function renderSectionRows(section, rows, columns) {
    if (isClassSpellListSection(section)) {
      return renderClassSpellListTables(rows, columns);
    }

    return renderTableRows(rows, columns);
  }

  /*
   * Riconosce le liste incantesimi delle classi SRD.
   */
  function isClassSpellListSection(section) {
    return (
      String(section?.titolo || '').startsWith('Lista degli incantesimi da ') &&
      Array.isArray(section?.colonne) &&
      section.colonne.includes('Livello') &&
      section.colonne.includes('Incantesimo')
    );
  }

  /*
   * Divide una lista incantesimi di classe in tabelle piu piccole, una per
   * ciascun livello di incantesimo.
   */
  function renderClassSpellListTables(rows, columns) {
    const visibleRows = rows.filter((row) => row && Object.keys(row).length);
    const tableColumns = columns.filter((column) => column !== 'Livello');
    const groups = groupRowsBySpellLevel(visibleRows);

    if (!groups.length) return '';

    return `
      <div class="spell-level-groups">
        ${groups.map((group) => `
          <section class="spell-level-group">
            <h5>${escapeHtml(spellLevelTableHeading(group.level))}</h5>
            ${renderMatrixRows(group.rows, tableColumns, 'data-table-spell-list')}
          </section>
        `).join('')}
      </div>
    `;
  }

  /*
   * Mantiene l'ordine originale dei livelli cosi come arriva dai dati SRD.
   */
  function groupRowsBySpellLevel(rows) {
    const groups = [];
    const byLevel = new Map();

    rows.forEach((row) => {
      const level = String(row.Livello || '').trim();

      if (!byLevel.has(level)) {
        const group = { level, rows: [] };
        byLevel.set(level, group);
        groups.push(group);
      }

      byLevel.get(level).rows.push(row);
    });

    return groups;
  }

  /*
   * Titolo leggibile per il gruppo di livello nella lista incantesimi.
   */
  function spellLevelTableHeading(level) {
    const text = String(level || '').trim();
    if (normalizeText(text) === 'trucchetto') return 'Trucchetti';

    const number = Number(text);
    if (Number.isFinite(number)) return `${number}° livello`;

    return text || 'Livello non indicato';
  }

  /*
   * Renderizza righe chiave/valore come tabella responsive.
   */
  function renderTableRows(rows, columns = []) {
    const visibleRows = rows.filter((row) => row && Object.keys(row).length);
    if (!visibleRows.length) return '';

    const matrixColumns = normalizeTableColumns(visibleRows, columns);
    if (matrixColumns.length) {
      return renderMatrixRows(visibleRows, matrixColumns);
    }

    return `
      <div class="table-wrap" tabindex="0" aria-label="Tabella scorrevole">
        <table class="data-table data-table-key-value">
          <tbody>
            ${visibleRows
              .map((row) => `
                <tr>
                  <th scope="row">${formatInline(row.chiave || '', { dice: false })}</th>
                  <td>${formatInline(row.valore || '')}</td>
                </tr>
              `)
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /*
   * Le tabelle SRD estratte dal PDF possono arrivare con colonne esplicite
   * oppure come oggetti gia multi-chiave. Mantiene l'ordine dichiarato e
   * preserva comunque tutte le celle presenti nei dati.
   */
  function normalizeTableColumns(rows, columns) {
    const explicitColumns = Array.isArray(columns)
      ? columns.map((column) => String(column || '').trim()).filter(Boolean)
      : [];

    if (explicitColumns.length) return explicitColumns;

    const inferredColumns = [];
    rows.forEach((row) => {
      Object.keys(row || {}).forEach((key) => {
        if (key !== 'chiave' && key !== 'valore' && !inferredColumns.includes(key)) {
          inferredColumns.push(key);
        }
      });
    });

    return inferredColumns.length > 1 ? inferredColumns : [];
  }

  /*
   * Renderizza tabelle multi-colonna, usate per progressioni di classe
   * e altre matrici che nel PDF hanno intestazioni proprie.
   */
  function renderMatrixRows(rows, columns, tableClass = '') {
    const className = ['data-table', 'data-table-matrix', tableClass].filter(Boolean).join(' ');

    return `
      <div class="table-wrap table-wrap-wide" tabindex="0" aria-label="Tabella scorrevole">
        <table class="${escapeAttr(className)}" data-column-count="${columns.length}">
          <thead>
            <tr>
              ${columns.map((column) => `<th scope="col">${formatInline(displayTableColumn(column), { dice: false })}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map((row) => `
                <tr>
                  ${columns
                    .map((column, index) => {
                      const tag = index === 0 ? 'th scope="row"' : 'td';
                      const closeTag = index === 0 ? 'th' : 'td';
                      return `<${tag}>${renderTableCell(row[column] ?? '', column)}</${closeTag}>`;
                    })
                    .join('')}
                </tr>
              `)
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /*
   * Le tabelle di classe contengono liste incantesimi: la cella Incantesimo
   * diventa un link diretto alla scheda quando il nome esiste nel catalogo.
   */
  function renderTableCell(value, column) {
    if (normalizeText(column) !== 'incantesimo') {
      return formatInline(value, { dice: false });
    }

    const spell = spellByName(value);

    if (!spell) {
      return formatInline(value, { dice: false });
    }

    return `<a class="table-spell-link" href="#/spells/${encodeURIComponent(spell.id)}">${escapeHtml(value)}</a>`;
  }

  /*
   * Lookup tollerante ad accenti e maiuscole per i nomi incantesimo presenti
   * nelle tabelle SRD.
   */
  function spellByName(name) {
    const normalizedName = normalizeText(name).trim();

    if (!normalizedName) return null;

    return appState.data.spells.find((spell) => normalizeText(spell.nome).trim() === normalizedName) || null;
  }

  function displayTableColumn(column) {
    return String(column || '').replace(/\s+2$/, '');
  }

  /*
   * Renderizza o aggiorna il pannello dei risultati dei tiri.
   */
  function renderRollTray() {
    const markup = rollTrayMarkup();
    const existing = document.querySelector('#roll-tray');

    if (existing) {
      existing.outerHTML = markup;
      return document.querySelector('#roll-tray');
    }

    document.body.insertAdjacentHTML('beforeend', markup);
    return document.querySelector('#roll-tray');
  }

  /*
   * Crea il markup del pannello dice roller.
   */
  function rollTrayMarkup() {
    const lastRoll = appState.rollHistory[0];
    const isOpen = appState.rollTrayOpen || Boolean(appState.rollError);

    return `
      <aside id="roll-tray" class="roll-tray${isOpen ? ' is-open' : ''}${lastRoll ? ' has-result' : ''}" aria-live="polite">
        <div class="roll-tray-header">
          <button
            class="roll-toggle"
            type="button"
            data-roll-toggle
            aria-expanded="${isOpen}"
            aria-controls="roll-tray-body"
          >
            <span class="roll-toggle-label">
              <span class="roll-toggle-label-full">Dice roller</span>
              <span class="roll-toggle-label-short">Dadi</span>
            </span>
            ${lastRoll
              ? `
                <span class="roll-toggle-result" aria-label="Ultimo tiro: ${escapeAttr(lastRoll.formula)}, totale ${escapeAttr(String(lastRoll.total))}">
                  <span>${escapeHtml(lastRoll.formula)}</span>
                  <strong>${escapeHtml(String(lastRoll.total))}</strong>
                </span>
              `
              : ''
            }
          </button>

          <div class="roll-header-actions">
            ${appState.rollHistory.length
              ? '<button class="button button--ghost roll-clear" type="button" data-roll-clear>Svuota</button>'
              : ''
            }
          </div>
        </div>

        <div id="roll-tray-body" class="roll-tray-body">
          ${lastRoll
            ? `
              <div class="roll-result ${escapeAttr(rollResultClass(lastRoll))}" role="status" aria-live="polite">
                <span class="roll-formula">${escapeHtml(lastRoll.formula)}</span>
                <strong class="roll-total">${escapeHtml(String(lastRoll.total))}</strong>
                <span class="roll-breakdown">${escapeHtml(formatRollBreakdown(lastRoll))}</span>
                ${rollResultNote(lastRoll)
                  ? `<span class="roll-note">${escapeHtml(rollResultNote(lastRoll))}</span>`
                  : ''
                }
              </div>

              ${appState.rollHistory.length > 1
                ? `
                  <ol class="roll-history">
                    ${appState.rollHistory.slice(1).map((roll) => `
                      <li>
                        <span>${escapeHtml(roll.formula)}</span>
                        <strong>${escapeHtml(String(roll.total))}</strong>
                      </li>
                    `).join('')}
                  </ol>
                `
                : ''
              }
            `
            : '<p class="roll-empty">Clicca una formula di dado nella scheda.</p>'
          }

          <form id="roll-tray-form" class="roll-form">
            <label class="visually-hidden" for="roll-tray-input">Formula di dado</label>
            <input
              id="roll-tray-input"
              class="roll-input"
              type="text"
              inputmode="text"
              autocomplete="off"
              placeholder="1d20 + 5"
              aria-describedby="roll-tray-help"
            >
            <button class="button button--primary roll-submit" type="submit">Tira</button>
          </form>

          <div class="quick-dice" aria-label="Dadi rapidi">
            ${[4, 6, 8, 10, 12, 20, 100].map((faces) => `
              <button type="button" data-quick-roll="1d${faces}" aria-label="Tira 1d${faces}">d${faces}</button>
            `).join('')}
          </div>

          <p id="roll-tray-help" class="${appState.rollError ? 'roll-error' : 'roll-help'}">
            ${escapeHtml(appState.rollError || 'Formula libera: d20, 2d6 + 3, 2d20kh1, 4d6dl1.')}
          </p>
        </div>
      </aside>
    `;
  }

  /*
   * Aggiunge un tiro allo storico breve.
   */
  function addRollResult(result) {
    appState.rollHistory = [
      result,
      ...appState.rollHistory,
    ].slice(0, DICE_LIMITS.historySize);
  }

  /*
   * Registra il tiro e mantiene il risultato subito visibile anche su mobile.
   */
  function showRollResult(result) {
    appState.rollError = '';
    addRollResult(result);
    appState.rollTrayOpen = true;

    const tray = renderRollTray();
    const body = tray?.querySelector('.roll-tray-body');

    if (body) body.scrollTop = 0;
  }

  /*
   * Formatta il dettaglio dei dadi tirati.
   */
  function formatRollBreakdown(result) {
    if (result.kind === 'attack') {
      const rolls = result.rolls.join(', ');
      const kept = result.mode === 'normal' ? '' : `; tenuto ${result.kept}`;
      const modifier = result.modifier
        ? ` ${result.modifier > 0 ? '+' : '-'} ${Math.abs(result.modifier)}`
        : '';

      return `${rolls}${kept}${modifier}`;
    }

    const dice = result.rolls.join(' + ');
    const kept = result.keepMode
      ? `; usati ${result.keptRolls.join(' + ')}`
      : '';
    const modifier = result.modifier
      ? ` ${result.modifier > 0 ? '+' : '-'} ${Math.abs(result.modifier)}`
      : '';

    return `${dice}${kept}${modifier}`;
  }

  /*
   * Evidenzia 20 e 1 naturali quando il tiro usa un d20.
   */
  function rollResultClass(result) {
    if (!isD20Roll(result)) return '';
    if (result.kept === 20) return 'roll-result--crit';
    if (result.kept === 1) return 'roll-result--fumble';
    return '';
  }

  /*
   * Nota breve per critico/fallimento critico.
   */
  function rollResultNote(result) {
    if (!isD20Roll(result)) return '';
    if (result.kept === 20) return '20 naturale';
    if (result.kept === 1) return '1 naturale';
    return '';
  }

  /*
   * Riconosce i risultati basati su d20.
   */
  function isD20Roll(result) {
    return result.kind === 'attack' || result.faces === 20 || (result.rolls?.length === 1 && result.formula?.startsWith('1d20'));
  }

  /*
   * Renderizza le azioni leggendarie dei mostri.
   */
  function renderLegendary(legendary) {
    if (!legendary || !Array.isArray(legendary.azioni) || !legendary.azioni.length) {
      return '';
    }

    return `
      <section class="content-section">
        <h3>
          Azioni leggendarie
          ${legendary.utilizzi ? `(${escapeHtml(legendary.utilizzi)})` : ''}
        </h3>

        ${legendary.descrizione_utilizzi
          ? `<div class="description">${formatInline(legendary.descrizione_utilizzi)}</div>`
          : ''
        }

        ${legendary.azioni
          .map((entry) => `
            <div class="entry">
              <span class="entry-title">${escapeHtml(entry.nome || '')}</span>
              <p>${formatInline(entry.descrizione || '')}</p>
            </div>
          `)
          .join('')}
      </section>
    `;
  }

  /*
   * Restituisce l’etichetta leggibile del livello di un incantesimo.
   */
  function spellLevel(spell) {
    if (spell.livello === 0) return 'Trucchetto';
    if (spell.livello === null || spell.livello === undefined) return '';
    return `${spell.livello}° livello`;
  }

  /*
   * Esegue un tiro per colpire con eventuale vantaggio o svantaggio.
   */
  function rollAttack(modifier, mode = 'normal') {
    const normalizedMode = ['advantage', 'disadvantage'].includes(mode) ? mode : 'normal';
    const rolls = normalizedMode === 'normal'
      ? [randomInt(1, 20)]
      : [randomInt(1, 20), randomInt(1, 20)];
    const kept = normalizedMode === 'disadvantage'
      ? Math.min(...rolls)
      : Math.max(...rolls);
    const total = kept + modifier;

    return {
      kind: 'attack',
      mode: normalizedMode,
      formula: attackFormulaLabel(modifier, normalizedMode),
      rolls,
      kept,
      modifier,
      total,
    };
  }

  /*
   * Riconosce scaling lineari del tipo "1d8 per ogni slot".
   * Se trova un dado base compatibile nella descrizione, prepara il totale.
   */
  function parsePerSlotScaling(text, spell) {
    const value = String(text || '');

    if (!/per ogni slot/i.test(value)) return null;

    const dice = findDiceFormulas(value);

    if (dice.length !== 1) return null;

    const increment = dice[0];
    const baseDice = findDiceFormulas(spell?.descrizione || '')
      .filter((token) => token.faces === increment.faces && token.modifier === 0);

    if (baseDice.length !== 1) return null;

    return {
      baseCount: baseDice[0].count,
      incrementCount: increment.count,
      faces: increment.faces,
      modifier: 0,
    };
  }

  /*
   * Formula totale per uno slot lanciato N livelli sopra quello base.
   */
  function scalingFormulaForMultiplier(scaling, multiplier) {
    return formatDiceFormula(
      scaling.baseCount + (scaling.incrementCount * multiplier),
      scaling.faces,
      scaling.modifier
    );
  }

  /*
   * Etichetta leggibile per il pannello risultati.
   */
  function attackFormulaLabel(modifier, mode) {
    const suffix = mode === 'advantage'
      ? ' con vantaggio'
      : mode === 'disadvantage'
        ? ' con svantaggio'
        : '';
    const sign = modifier >= 0 ? '+' : '-';

    return `Colpire ${sign}${Math.abs(modifier)}${suffix}`;
  }

  /*
   * Legge i preferiti dal localStorage.
   * Se il JSON è corrotto o assente, restituisce un oggetto vuoto.
   */
  function loadFavorites() {
    try {
      return JSON.parse(localStorage.getItem('dnd-reference:favorites') || '{}');
    } catch {
      return {};
    }
  }

  /*
   * Salva i preferiti nel localStorage.
   */
  function saveFavorites() {
    localStorage.setItem('dnd-reference:favorites', JSON.stringify(appState.favorites));
  }

  /*
   * Controlla se un elemento è nei preferiti.
   */
  function isFavorite(section, id) {
    return Boolean(appState.favorites[section]?.includes(id));
  }

  /*
   * Aggiunge o rimuove un elemento dai preferiti.
   */
  function toggleFavorite(section, id) {
    const current = new Set(appState.favorites[section] || []);

    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }

    appState.favorites[section] = Array.from(current);
    saveFavorites();
  }

  /*
   * Normalizza testo per la ricerca:
   * - minuscolo
   * - rimozione accenti
   */
  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /*
   * Formatta testo inline semplice e, quando richiesto, rende cliccabili
   * le formule di dado riconosciute dal parser leggero.
   *
   * Supporta:
   * **grassetto**
   * *corsivo*
   *
   * Prima esegue escapeHtml per evitare inserimento di HTML non sicuro.
   */
  function formatInline(text, options = {}) {
    const withDice = options.dice !== false;
    const withAttacks = options.attacks !== false;
    const withGlossary = options.glossary !== false;
    const value = String(text);
    const formatted = formatMarkdownInline(value);
    const withGlossaryLinks = withGlossary ? enrichGlossaryLinks(formatted) : formatted;
    const withAttackRolls = withAttacks ? enrichAttackRolls(withGlossaryLinks) : withGlossaryLinks;

    return withDice ? enrichDiceFormulas(withAttackRolls) : withAttackRolls;
  }

  /*
   * Applica il piccolo sottoinsieme Markdown supportato.
   */
  function formatMarkdownInline(text) {
    return escapeHtml(String(text))
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  /*
   * Collega le condizioni citate nel testo alla relativa voce di glossario.
   */
  function enrichGlossaryLinks(html) {
    const terms = glossaryConditionTerms();

    if (!terms.length) return String(html);

    const pattern = new RegExp(`\\b(${terms.map((term) => escapeRegExp(term.label)).join('|')})\\b`, 'gi');

    return String(html).replace(pattern, (match, _term, offset, fullText) => {
      if (isInsideHtmlTag(fullText, offset)) return match;

      const condition = terms.find((term) => normalizeText(term.label) === normalizeText(match));
      if (!condition) return match;

      return glossaryLink(match, condition.id);
    });
  }

  /*
   * Crea la lista di alias delle condizioni presenti davvero nel glossario.
   */
  function glossaryConditionTerms() {
    const conditionIds = new Set(
      appState.data.rules_glossary
        .filter((entry) => entry.descrittore === 'condizione')
        .map((entry) => entry.id)
    );

    return Object.entries(CONDITION_ALIASES)
      .filter(([id]) => conditionIds.has(id))
      .flatMap(([id, aliases]) => aliases.map((label) => ({ id, label })))
      .sort((a, b) => b.label.length - a.label.length);
  }

  /*
   * Link interno a una voce del glossario.
   */
  function glossaryLink(label, id) {
    return `<a class="glossary-link" href="#/rules_glossary/${encodeURIComponent(id)}" title="Apri definizione: ${escapeAttr(label)}">${escapeHtml(label)}</a>`;
  }

  /*
   * Crea un bottone inline per una formula di dado.
   */
  function diceButton(token) {
    return `<button class="dice-inline" type="button" data-dice-roll="${escapeAttr(token.formula)}" aria-label="Tira ${escapeAttr(token.formula)}">${escapeHtml(token.raw)}</button>`;
  }

  /*
   * Crea il gruppo inline per un tiro per colpire.
   */
  function attackRollControls(rawModifier) {
    const modifier = Number(rawModifier);
    const normalized = modifier >= 0 ? `+${modifier}` : String(modifier);

    return `<span class="attack-roll" aria-label="Tiro per colpire ${escapeAttr(normalized)}"><button class="attack-roll-main" type="button" data-attack-roll="${escapeAttr(String(modifier))}" data-attack-mode="normal" aria-label="Tira per colpire ${escapeAttr(normalized)}">${escapeHtml(normalized)}</button><button class="attack-roll-mode" type="button" data-attack-roll="${escapeAttr(String(modifier))}" data-attack-mode="advantage" aria-label="Tira per colpire ${escapeAttr(normalized)} con vantaggio" title="Vantaggio">V</button><button class="attack-roll-mode" type="button" data-attack-roll="${escapeAttr(String(modifier))}" data-attack-mode="disadvantage" aria-label="Tira per colpire ${escapeAttr(normalized)} con svantaggio" title="Svantaggio">S</button></span>`;
  }

  /*
   * Rende interattivi i bonus dopo "Tiro per colpire".
   */
  function enrichAttackRolls(html) {
    const pattern = /((?:<em>)?Tiro per colpire[\s\S]{0,90}?:?(?:<\/em>)?\s*)([+-]\d+)/gi;

    return String(html).replace(pattern, (match, prefix, modifier, offset, fullText) => {
      if (isInsideHtmlTag(fullText, offset + prefix.length)) return match;

      return `${prefix}${attackRollControls(modifier)}`;
    });
  }

  /*
   * Inserisce bottoni dado nel testo gia escapato/formattato.
   * In questa fase l'HTML contiene solo tag generati localmente.
   */
  function enrichDiceFormulas(html) {
    const pattern = /\b(\d*d\d+(?:(?:kh|kl|dl)1)?(?:\s*[+-]\s*\d+)?)\b/gi;

    return String(html).replace(pattern, (raw, formula, offset, fullText) => {
      const parsed = parseDiceFormula(formula);

      if (!parsed || isLikelyTableDie(fullText, offset, raw) || isInsideHtmlTag(fullText, offset)) {
        return raw;
      }

      return diceButton({ ...parsed, raw });
    });
  }

  /*
   * Evita sostituzioni accidentali dentro tag HTML generati.
   */
  function isInsideHtmlTag(text, index) {
    const lastOpen = text.lastIndexOf('<', index);
    const lastClose = text.lastIndexOf('>', index);

    return lastOpen > lastClose;
  }

  /*
   * Escapa caratteri HTML per prevenire injection nel markup.
   */
  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
    }[char]));
  }

  /*
   * Escapa valori destinati agli attributi HTML.
   * Include anche l’apostrofo.
   */
  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, '&#39;');
  }

  /*
   * Escapa una stringa da usare in una RegExp dinamica.
   */
  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /*
   * Mostra il template di caricamento.
   */
  function showLoading() {
    setView('home');
    views.home.innerHTML = document.querySelector('#loading-template').innerHTML;
  }

  /*
   * Mostra il template di errore.
   */
  function showError() {
    setView('home');
    views.home.innerHTML = document.querySelector('#error-template').innerHTML;
  }
})();
