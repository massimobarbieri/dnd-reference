import { createCharacterSheetCombatRenderer } from './character-sheet-combat-renderer.js?v=20260520-guided';
import { createCharacterSheetFields } from './character-sheet-fields.js?v=20260520-guided';
import { createCharacterSheetInventoryRenderer } from './character-sheet-inventory-renderer.js?v=20260520-guided';
import { createCharacterSheetOverviewRenderer } from './character-sheet-overview-renderer.js?v=20260520-guided';
import { createCharacterSheetSpellsRenderer } from './character-sheet-spells-renderer.js?v=20260520-guided';

export function createCharacterSheetRenderer({
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
}) {
  /*
   * Renderer della scheda personaggio.
   * Il modulo genera solo markup e delega eventi/mutazioni ad app.js.
   */
  const {
    sheetField,
    sheetNumberField,
    sheetProficiencyTextArea,
    sheetSelect,
    sheetStatusTextArea,
    sheetTextArea,
  } = createCharacterSheetFields({ escapeAttr, escapeHtml });

  const { renderCharacterSheetInventory } = createCharacterSheetInventoryRenderer({
    appState,
    escapeAttr,
    escapeHtml,
    sheetTextArea,
    magicItemRequiresAttunement,
    characterClassEntry,
    characterSheetDerived,
  });

  const { renderCharacterSheetSpells } = createCharacterSheetSpellsRenderer({
    appState,
    escapeAttr,
    escapeHtml,
    sheetSelect,
    abilityOptions,
    abilityModifier,
    characterProficiencyBonus,
    formatSigned,
    characterSpellOptions,
    spellOptionLabel,
    characterSpellSlots,
    spellLevel,
  });

  const { renderCharacterSheetCombat } = createCharacterSheetCombatRenderer({
    appState,
    escapeAttr,
    escapeHtml,
    ABILITY_META,
    sheetField,
    sheetNumberField,
    sheetStatusTextArea,
    abilityModifier,
    rollFormula,
    formatSigned,
    abilityOptions,
    characterConditionOptions,
    characterProficiencyBonus,
    characterAttackBonus,
    characterSpellSlots,
    characterSpellOptions,
    spellLevel,
    characterSheetDerived,
  });

  const { renderCharacterSheetOverview } = createCharacterSheetOverviewRenderer({
    appState,
    escapeAttr,
    escapeHtml,
    ABILITY_META,
    SKILL_META,
    sheetField,
    sheetNumberField,
    sheetSelect,
    sheetProficiencyTextArea,
    characterClassOptions,
    abilityModifier,
    rollFormula,
    formatSigned,
    classSkillOptions,
    characterClassEntry,
    skillProficiencyBonus,
    characterLevel,
    characterProficiencyBonus,
    classProgressionSection,
    classProgressionRow,
    classProgressionResources,
    classSkillChoiceCount,
    splitClassFeatures,
    classSubclassRows,
    nextLevelSummary,
    renderLevelAdvancementSummary,
    characterSheetDerived,
  });

  function renderCharacterSheetArchiveImportPrompt() {
    const archive = appState.pendingCharacterSheetArchive;
    if (!archive) return '';

    const names = archive.sheets
      .slice(0, 4)
      .map((sheet) => sheet.name || 'Scheda personaggio')
      .join(', ');
    const extra = archive.sheets.length > 4 ? ` e altre ${archive.sheets.length - 4}` : '';

    return `
      <section class="sheet-archive-confirm" role="status" aria-live="polite">
        <div>
          <strong>Import archivio schede</strong>
          <p>
            File con ${escapeHtml(String(archive.sheets.length))} schede:
            ${escapeHtml(names || 'nessun nome')}${escapeHtml(extra)}.
            Schede locali attuali: ${escapeHtml(String(appState.characterSheets.length))}.
          </p>
        </div>
        <div class="sheet-archive-actions">
          <button class="button" type="button" data-sheet-import-archive-mode="unisci">Unisci</button>
          <button class="button button--ghost" type="button" data-sheet-import-archive-mode="sostituisci">Sostituisci</button>
          <button class="button button--ghost" type="button" data-sheet-import-archive-cancel>Annulla</button>
        </div>
      </section>
    `;
  }

  function renderAppBackupImportPrompt() {
    const backup = appState.pendingAppBackup;
    if (!backup) return '';

    const keys = Object.keys(backup.storage);
    const names = keys.slice(0, 4).map((key) => key.replace(APP_STORAGE_PREFIX, '')).join(', ');
    const extra = keys.length > 4 ? ` e altre ${keys.length - 4}` : '';

    return `
      <section class="sheet-archive-confirm" role="status" aria-live="polite">
        <div>
          <strong>Import backup app</strong>
          <p>
            Il backup contiene ${escapeHtml(String(keys.length))} voci locali:
            ${escapeHtml(names || 'nessuna voce')}${escapeHtml(extra)}.
            Il ripristino sostituira i dati locali D&D Reference.
          </p>
        </div>
        <div class="sheet-archive-actions">
          <button class="button" type="button" data-app-import-backup-apply>Ripristina backup</button>
          <button class="button button--ghost" type="button" data-app-import-backup-cancel>Annulla</button>
        </div>
      </section>
    `;
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
        <div class="sheet-manager">
          <label class="sheet-character-picker">
            <span>Personaggio</span>
            <select class="sheet-character-select" data-sheet-switch-character aria-label="Personaggio attivo">
              ${appState.characterSheets.map((sheet) => `
                <option value="${escapeAttr(sheet.id)}"${sheet.id === appState.characterSheet.id ? ' selected' : ''}>${escapeHtml(sheet.name || 'Scheda personaggio')}</option>
              `).join('')}
            </select>
          </label>
          <div class="sheet-manager-actions">
            <button class="button button--ghost" type="button" data-sheet-reset>Nuova</button>
            <button class="button button--ghost" type="button" data-sheet-duplicate>Duplica</button>
            <details class="sheet-more-actions">
              <summary>Altro</summary>
              <div>
                <button class="button button--ghost" type="button" data-sheet-export>Esporta</button>
                <button class="button button--ghost" type="button" data-sheet-import>Importa</button>
                <button class="button button--ghost" type="button" data-sheet-export-archive>Esporta archivio</button>
                <button class="button button--ghost" type="button" data-sheet-import-archive>Importa archivio</button>
                <button class="button button--ghost" type="button" data-app-export-backup>Esporta backup app</button>
                <button class="button button--ghost" type="button" data-app-import-backup>Importa backup app</button>
                <button class="button button--ghost sheet-danger-action" type="button" data-sheet-delete>Elimina</button>
              </div>
            </details>
            <input id="character-sheet-import" class="visually-hidden" type="file" accept="application/json,.json">
            <input id="character-sheet-archive-import" class="visually-hidden" type="file" accept="application/json,.json">
            <input id="app-backup-import" class="visually-hidden" type="file" accept="application/json,.json">
          </div>
        </div>
      </nav>

      <article class="detail-card detail-card--flat character-sheet">
        ${renderCharacterSheetArchiveImportPrompt()}
        ${renderAppBackupImportPrompt()}
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
   * Tab note.
   */
  function renderCharacterSheetNotes() {
    const sheet = appState.characterSheet;

    return `
      <section class="sheet-grid">
        <div class="sheet-panel sheet-panel--wide sheet-dashboard sheet-dashboard--notes">
          <div class="sheet-dashboard-heading">
            <div>
              <span>Note e SRD</span>
              <strong>${escapeHtml(`${sheet.references.length} riferimenti`)}</strong>
              <p>${escapeHtml(sheet.references.length ? 'Voci SRD collegate alla scheda locale.' : 'Spazio libero per sessioni, PNG, luoghi, obiettivi e riferimenti SRD.')}</p>
            </div>
          </div>
        </div>

        <div class="sheet-panel sheet-panel--wide">
          <h3>Riferimenti SRD</h3>
          ${renderCharacterSheetReferences()}
        </div>

        <div class="sheet-panel sheet-panel--wide sheet-panel--control">
          <h3>Diario e note</h3>
          ${sheetTextArea('notes', 'Appunti di sessione, PNG, luoghi, obiettivi...', sheet.notes)}
        </div>
      </section>
    `;
  }

  function renderCharacterSheetReferences() {
    const references = appState.characterSheet.references
      .map((entry) => {
        const source = appState.data[entry.section]?.find((item) => item.id === entry.id);

        return {
          section: entry.section,
          id: entry.id,
          name: source?.nome || entry.name || entry.id,
          summary: entry.summary,
        };
      })
      .sort((a, b) => sectionLabel(a.section).localeCompare(sectionLabel(b.section), 'it') || String(a.name).localeCompare(String(b.name), 'it'));

    if (!references.length) {
      return '<p class="sheet-empty">Nessun riferimento SRD collegato.</p>';
    }

    return `
      <div class="sheet-item-list">
        ${references.map((entry) => `
          <article class="sheet-item">
            <div>
              <a href="#/${entry.section}/${encodeURIComponent(entry.id)}">${escapeHtml(entry.name)}</a>
              <span>${escapeHtml([sectionLabel(entry.section), entry.summary].filter(Boolean).join(' · '))}</span>
            </div>
            <button
              class="button button--ghost"
              type="button"
              data-sheet-remove-reference="${escapeAttr(entry.id)}"
              data-sheet-reference-section="${escapeAttr(entry.section)}"
            >Rimuovi</button>
          </article>
        `).join('')}
      </div>
    `;
  }

  function sectionLabel(section) {
    return {
      monsters: 'Mostro',
      rules: 'Regola',
      rules_glossary: 'Glossario',
      classes: 'Classe',
      species: 'Specie',
      backgrounds: 'Background',
      equipment: 'Equipaggiamento',
      feats: 'Talento',
      languages: 'Lingua',
      spells: 'Incantesimo',
      magic_items: 'Oggetto magico',
    }[section] || section;
  }

  /*
   * Collega gli eventi dopo ogni render della scheda. La vista viene spesso
   * ridisegnata interamente, quindi i listener non devono essere conservati.
   */


  return {
    renderCharacterSheet,
  };
}
