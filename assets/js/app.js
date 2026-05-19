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
import { SECTION_META } from './config/sections.js';

import { loadConfig } from './data/loaders.js';
import {
  applyReferenceSources,
  loadReferenceSources,
} from './data/reference-data.js';
import {
  escapeAttr,
  escapeHtml,
  escapeRegExp,
  hasFavorite,
  legacyClassId,
  loadFavorites,
  normalizeText,
  parseHash,
  saveFavorites,
  toggleFavorite as toggleFavoriteState,
} from './app-core.js';
import {
  createFilterOptions,
  filterCatalogItems,
  sectionSummaryLine,
} from './catalog.js';
import { createInlineFormatter } from './inline-formatting.js';
import { createReferenceDetailRenderer } from './reference-detail-renderer.js';

import {
  normalizeCharacterSheet,
  normalizeSpellSlotsUsed,
  normalizeLegacyMagicItems,
  normalizeLegacyAttacks,
  normalizeLegacyResources,
  normalizeCharacterStatus,
  normalizeIdList,
  normalizeSkillProficiencies,
  normalizeProficiencies,
  uniqueCharacterSheets,
  createCharacterSheetId,
  cloneJson,
} from './features/character-sheet/character-sheet-normalizers.js';

import {
  readJsonStorage,
  setCharacterSheetStorageState,
  saveCharacterSheet,
  loadCharacterSheetArchive,
  switchCharacterSheet,
  createNewCharacterSheet,
  duplicateCharacterSheet,
  deleteActiveCharacterSheet,
  normalizeCharacterSheetArchive,
  mergeCharacterSheetArchives,
  CHARACTER_SHEET_STORAGE_KEY,
  CHARACTER_SHEETS_STORAGE_KEY,
  ACTIVE_CHARACTER_SHEET_STORAGE_KEY,
  APP_STORAGE_PREFIX,
} from './features/character-sheet/character-sheet-storage.js';

import { createCharacterSheetBackupController } from './features/character-sheet/character-sheet-backup.js';
import { createCharacterSheetClassController } from './features/character-sheet/character-sheet-classes.js';
import { createCharacterSheetActionsController } from './features/character-sheet/character-sheet-actions.js';
import { createCharacterSheetEventsController } from './features/character-sheet/character-sheet-events.js';
import { createCharacterSheetRenderer } from './features/character-sheet/character-sheet-renderers.js';

import {
  CONDITION_ALIASES,
  ABILITY_META,
  SKILL_META,
  CHARACTER_SHEET_TABS,
  CHARACTER_SHEET_SCHEMA_VERSION,
  DEFAULT_CHARACTER_SHEET,
} from './features/character-sheet/character-sheet-view.js';

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

    // Archivio locale delle schede personaggio.
    characterSheets: [],
    activeCharacterSheetId: '',
    characterSheet: null,
    characterSheetTab: 'overview',
    pendingCharacterSheetArchive: null,
    pendingAppBackup: null,

    // Se true mostra solo gli elementi preferiti.
    showOnlyFavorites: false,

    // Storico breve dei tiri effettuati durante la sessione.
    rollHistory: [],

    // Messaggio di validazione per il dice tray globale.
    rollError: '',

    // Stato espanso/collassato del dice roller, utile soprattutto su mobile.
    rollTrayOpen: false,
  };

  setCharacterSheetStorageState(appState);

  const {
    applyAppBackupImport,
    applyCharacterSheetArchiveImport,
    exportAppBackup,
    exportCharacterSheet,
    exportCharacterSheetArchive,
    importAppBackup,
    importCharacterSheet,
    importCharacterSheetArchive,
    normalizeAppBackup,
    restoreAppBackup,
  } = createCharacterSheetBackupController({
    appState,
    renderCharacterSheet,
    renderRoute,
    saveCharacterSheet,
    normalizeCharacterSheet,
    createCharacterSheetId,
    normalizeCharacterSheetArchive,
    mergeCharacterSheetArchives,
    CHARACTER_SHEET_SCHEMA_VERSION,
    APP_STORAGE_PREFIX,
    loadFavorites,
    loadCharacterSheetArchive,
  });

  const {
    applyClassToCharacterSheet,
    classProgressionResources,
    classProgressionRow,
    classProgressionSection,
    classSkillOptions,
    classSubclassRows,
    renderLevelAdvancementSummary,
    splitClassFeatures,
    syncCharacterSheetClassResources,
    nextLevelSummary,
  } = createCharacterSheetClassController({
    appState,
    abilityMeta: ABILITY_META,
    skillMeta: SKILL_META,
    escapeHtml,
    normalizeLegacyResources,
    normalizeText,
    characterLevel,
  });

  const {
    addMagicItemToCharacterSheet,
    addSpellToCharacterSheet,
    magicItemRequiresAttunement,
    resetCharacterResources,
  } = createCharacterSheetActionsController({
    appState,
    normalizeText,
    saveCharacterSheet,
  });

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

  const formatInline = createInlineFormatter({
    appState,
    conditionAliases: CONDITION_ALIASES,
    escapeAttr,
    escapeHtml,
    escapeRegExp,
    isLikelyTableDie,
    normalizeText,
    parseDiceFormula,
  });

  const renderDetailContent = createReferenceDetailRenderer({
    appState,
    analyzeRollContext,
    escapeAttr,
    escapeHtml,
    findDiceFormulas,
    formatDiceFormula,
    formatInline,
    isFavorite,
    normalizeText,
    renderSheetActions,
    spellLevel,
  });

  const {
    renderRollTray,
    handleRollCommand,
    handleRollSubmit,
  } = window.DndRollTray.createRollTrayController({
    appState,
    DICE_LIMITS,
    parseDiceFormula,
    rollDice,
    randomInt,
    escapeHtml,
    escapeAttr,
  });

  /*
   * Riferimenti alle tre viste principali dell’interfaccia.
   * Ogni vista viene mostrata o nascosta in base alla rotta corrente.
   */
  const views = {
    home: document.querySelector('#home-view'),
    list: document.querySelector('#list-view'),
    detail: document.querySelector('#detail-view'),
  };

  const characterSheetEvents = createCharacterSheetEventsController({
    appState,
    views,
    saveCharacterSheet,
    renderCharacterSheet,
    characterClassEntry,
    applyClassToCharacterSheet,
    syncCharacterSheetClassResources,
    normalizeIdList,
    resetCharacterResources,
    addSpellToCharacterSheet,
    characterSpellSlots,
    exportCharacterSheet,
    importCharacterSheet,
    exportCharacterSheetArchive,
    importCharacterSheetArchive,
    exportAppBackup,
    importAppBackup,
    applyAppBackupImport,
    applyCharacterSheetArchiveImport,
    switchCharacterSheet,
    createNewCharacterSheet,
    duplicateCharacterSheet,
    deleteActiveCharacterSheet,
  });

  const characterSheetRenderer = createCharacterSheetRenderer({
    appState,
    views,
    setView,
    bindCharacterSheetEvents,
    escapeAttr,
    escapeHtml,
    APP_STORAGE_PREFIX,
    CHARACTER_SHEET_TABS,
    ABILITY_META,
    SKILL_META,
    characterSheetClassName,
    characterLevel,
    characterProficiencyBonus,
    characterClassOptions,
    abilityModifier,
    rollFormula,
    formatSigned,
    abilityOptions,
    characterSpellOptions,
    spellOptionLabel,
    characterSpellSlots,
    characterConditionOptions,
    classSkillOptions,
    characterClassEntry,
    skillProficiencyBonus,
    characterAttackBonus,
    spellLevel,
    magicItemRequiresAttunement,
    classProgressionSection,
    classProgressionRow,
    classProgressionResources,
    splitClassFeatures,
    classSubclassRows,
    nextLevelSummary,
    renderLevelAdvancementSummary,
  });

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
    loadCharacterSheetArchive();
    renderRollTray();
    document.addEventListener('click', handleRollCommand);
    document.addEventListener('submit', handleRollSubmit);

    try {
      // Carica config.yml.
      appState.config = await loadConfig();

      // Aggiorna titolo, heading e sottotitolo della pagina.
      applyConfigToPage(appState.config);

      const referenceSources = await loadReferenceSources(appState.config.paths);

      applyReferenceSources(appState, referenceSources);
      appState.data.character_sheet = [appState.characterSheet];

      // Renderizza home, lista o dettaglio in base all’URL.
      renderRoute();
    } catch (error) {
      console.error(error);
      showError();
    }
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
    const route = parseHash(location.hash);
    appState.currentSection = route.section || null;

    if (!route.section) {
      renderHome();
      return;
    }

    const classId = route.section === 'rules' ? legacyClassId(route.id) : '';
    if (classId) {
      location.hash = `#/classes/${encodeURIComponent(classId)}`;
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
    return filterCatalogItems({
      section,
      items: appState.data[section],
      searchTerm: appState.searchTerm,
      filter: appState.filters[section],
      showOnlyFavorites: appState.showOnlyFavorites,
      isFavorite,
    });
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
    return createFilterOptions(section, appState.data, spellLevel);
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
    return sectionSummaryLine(section, item, spellLevel);
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
      applyClassToCharacterSheet(item);
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

  function renderCharacterSheet(tab = 'overview') {
    return characterSheetRenderer.renderCharacterSheet(tab);
  }

  function bindCharacterSheetEvents() {
    characterSheetEvents.bindCharacterSheetEvents();
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

  function characterConditionOptions() {
    return appState.data.rules_glossary
      .filter((entry) => normalizeText(entry.descrittore) === 'condizione')
      .sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'it'));
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

  function characterAttackBonus(attack) {
    const ability = ABILITY_META.some(([key]) => key === attack.ability) ? attack.ability : 'str';
    const proficiency = attack.proficient ? characterProficiencyBonus() : 0;

    return abilityModifier(appState.characterSheet.abilities[ability]) + proficiency + (Number(attack.bonus) || 0);
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

  function skillProficiencyBonus(rank) {
    return characterProficiencyBonus() * Math.min(2, Math.max(0, Number(rank) || 0));
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
   * Restituisce l’etichetta leggibile del livello di un incantesimo.
   */
  function spellLevel(spell) {
    if (spell.livello === 0) return 'Trucchetto';
    if (spell.livello === null || spell.livello === undefined) return '';
    return `${spell.livello}° livello`;
  }

  /*
   * Controlla se un elemento è nei preferiti.
   */
  function isFavorite(section, id) {
    return hasFavorite(appState.favorites, section, id);
  }

  /*
   * Aggiunge o rimuove un elemento dai preferiti.
   */
  function toggleFavorite(section, id) {
    appState.favorites = toggleFavoriteState(appState.favorites, section, id);
    saveFavorites(appState.favorites);
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

  if (window.__DND_REFERENCE_TEST__) {
    window.DndReferenceTest = {
      appState,
      applyAppBackupImport,
      applyCharacterSheetArchiveImport,
      loadCharacterSheetArchive,
      mergeCharacterSheetArchives,
      normalizeAppBackup,
      normalizeCharacterSheet,
      normalizeCharacterSheetArchive,
      renderCharacterSheet,
      resetCharacterResources,
      restoreAppBackup,
      saveCharacterSheet,
    };
  }
})();
