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
import { loadConfig } from './data/loaders.js?v=20260526-level-plan';
import {
  applyReferenceSources,
  loadReferenceSources,
} from './data/reference-data.js?v=20260526-level-plan';
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
  createReferenceViewController,
  renderReferenceSheetActions,
} from './reference-view-controller.js?v=20260526-level-plan';
import { createInlineFormatter } from './inline-formatting.js';
import { createReferenceDetailRenderer } from './reference-detail-renderer.js?v=20260526-level-plan';

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
} from './features/character-sheet/character-sheet-normalizers.js?v=20260526-level-plan';

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
} from './features/character-sheet/character-sheet-storage.js?v=20260526-level-plan';

import { createCharacterSheetClassController } from './features/character-sheet/character-sheet-classes.js?v=20260526-level-plan';
import { createCharacterSheetActionsController } from './features/character-sheet/character-sheet-actions.js?v=20260526-level-plan';
import { createCharacterSheetEventsController } from './features/character-sheet/character-sheet-events.js?v=20260526-level-plan';
import { createCharacterSheetRenderer } from './features/character-sheet/character-sheet-renderers.js?v=20260526-level-plan';
import { createCharacterSheetSelectors } from './features/character-sheet/character-sheet-selectors.js?v=20260526-level-plan';
import { createCharacterSheetDerivedModel } from './features/character-sheet/character-sheet-derived.js?v=20260526-level-plan';
import { createCharacterSheetBackupWorkflow } from './features/character-sheet/character-sheet-backup-workflow.js?v=20260526-level-plan';

import {
  CONDITION_ALIASES,
  ABILITY_META,
  SKILL_META,
  CHARACTER_SHEET_TABS,
  CHARACTER_SHEET_SCHEMA_VERSION,
  DEFAULT_CHARACTER_SHEET,
} from './features/character-sheet/character-sheet-view.js?v=20260526-level-plan';

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
      species: [],
      backgrounds: [],
      equipment: [],
      feats: [],
      languages: [],
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
      species: '',
      backgrounds: '',
      equipment: '',
      feats: '',
      languages: '',
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
    characterSpellFilters: {
      level: '',
      school: '',
    },
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

  const backupActions = createCharacterSheetBackupWorkflow({
    appState,
    renderCharacterSheet,
    renderRoute,
    saveCharacterSheet,
    normalizeCharacterSheet,
    createCharacterSheetId,
    normalizeCharacterSheetArchive,
    mergeCharacterSheetArchives,
    characterSheetSchemaVersion: CHARACTER_SHEET_SCHEMA_VERSION,
    appStoragePrefix: APP_STORAGE_PREFIX,
    loadFavorites,
    loadCharacterSheetArchive,
  });

  const {
    characterClassOptions,
    characterClassEntry,
    characterConditionOptions,
    characterSpellSlots,
    characterAttackBonus,
    abilityOptions,
    characterSpellOptions,
    spellOptionLabel,
    characterSheetClassName,
    characterLevel,
    characterProficiencyBonus,
    skillProficiencyBonus,
    abilityModifier,
    formatSigned,
    rollFormula,
    spellLevel,
  } = createCharacterSheetSelectors({
    appState,
    abilityMeta: ABILITY_META,
    normalizeText,
    classProgressionRow: (...args) => classProgressionRow(...args),
  });

  const {
    applyClassToCharacterSheet,
    classProgressionResources,
    classSkillChoiceCount,
    classProgressionRow,
    classProgressionSection,
    classSkillOptions,
    classSubclassRows,
    classTraitsMap,
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
    addEquipmentToCharacterSheet,
    addEquipmentItemToCharacterSheet,
    addMagicItemToCharacterSheet,
    addReferenceToCharacterSheet,
    addSpellToCharacterSheet,
    applyBackgroundToCharacterSheet,
    applyLanguageToCharacterSheet,
    applySpeciesToCharacterSheet,
    magicItemRequiresAttunement,
    resetCharacterResources,
  } = createCharacterSheetActionsController({
    appState,
    normalizeText,
    saveCharacterSheet,
  });

  const characterSheetDerived = createCharacterSheetDerivedModel({
    appState,
    abilityModifier,
    abilityMeta: ABILITY_META,
    skillMeta: SKILL_META,
    classSkillOptions,
    classSkillChoiceCount,
    characterClassEntry,
    classTraitsMap,
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
    renderSheetActions: (section, item) => renderReferenceSheetActions({
      section,
      item,
      escapeAttr,
    }),
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

  let referenceViews = null;

  function renderRoute() {
    return referenceViews.renderRoute();
  }

  function setView(name) {
    return referenceViews.setView(name);
  }

  referenceViews = createReferenceViewController({
    appState,
    views,
    escapeAttr,
    escapeHtml,
    legacyClassId,
    parseHash,
    isFavorite,
    toggleFavorite,
    spellLevel,
    renderDetailContent,
    renderCharacterSheet,
    applyClassToCharacterSheet,
    saveCharacterSheet,
    addEquipmentToCharacterSheet,
    addEquipmentItemToCharacterSheet,
    addSpellToCharacterSheet,
    addMagicItemToCharacterSheet,
    addReferenceToCharacterSheet,
    applySpeciesToCharacterSheet,
    applyBackgroundToCharacterSheet,
    applyLanguageToCharacterSheet,
  });

  const characterSheetEvents = createCharacterSheetEventsController({
    appState,
    views,
    saveCharacterSheet,
    renderCharacterSheet,
    characterClassEntry,
    applyClassToCharacterSheet,
    applySpeciesToCharacterSheet,
    applyBackgroundToCharacterSheet,
    syncCharacterSheetClassResources,
    classProgressionRow,
    nextLevelSummary,
    normalizeIdList,
    resetCharacterResources,
    addSpellToCharacterSheet,
    addEquipmentItemToCharacterSheet,
    characterSpellSlots,
    ...backupActions,
    switchCharacterSheet,
    createNewCharacterSheet,
    duplicateCharacterSheet,
    deleteActiveCharacterSheet,
    characterSheetDerived,
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
    characterSheetDerived,
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
    classSkillChoiceCount,
    classTraitsMap,
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

  function renderCharacterSheet(tab = 'overview') {
    return characterSheetRenderer.renderCharacterSheet(tab);
  }

  function bindCharacterSheetEvents() {
    characterSheetEvents.bindCharacterSheetEvents();
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
      applyAppBackupImport: backupActions.applyAppBackupImport,
      applyCharacterSheetArchiveImport: backupActions.applyCharacterSheetArchiveImport,
      loadCharacterSheetArchive,
      mergeCharacterSheetArchives,
      normalizeAppBackup: backupActions.normalizeAppBackup,
      normalizeCharacterSheet,
      normalizeCharacterSheetArchive,
      renderCharacterSheet,
      renderRoute,
      resetCharacterResources,
      restoreAppBackup: backupActions.restoreAppBackup,
      saveCharacterSheet,
    };
  }
})();
