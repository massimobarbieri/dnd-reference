import { createCharacterSheetCombatRenderer } from './character-sheet-combat-renderer.js?v=20260530-effects';
import { createCharacterSheetCombatShared } from './character-sheet-combat-shared.js?v=20260530-effects';
import { createCharacterSheetFields } from './character-sheet-fields.js?v=20260527-upstream-dev';
import { createCharacterSheetInventoryRenderer } from './character-sheet-inventory-renderer.js?v=20260527-upstream-dev';
import { createCharacterSheetOverviewRenderer } from './character-sheet-overview-renderer.js?v=20260530-effects';
import { createCharacterSheetSpellsRenderer } from './character-sheet-spells-renderer.js?v=20260530-effects';
import { createCharacterSheetTableRenderer } from './character-sheet-table-renderer.js?v=20260530-effects';

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
    characterSpellOptions,
    spellOptionLabel,
    characterSpellSlots,
    abilityOptions,
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

  const combatShared = createCharacterSheetCombatShared({
    appState,
    characterSheetDerived,
    escapeAttr,
    escapeHtml,
  });

  const { renderCharacterSheetTable } = createCharacterSheetTableRenderer({
    appState,
    escapeAttr,
    escapeHtml,
    ABILITY_META,
    SKILL_META,
    abilityModifier,
    rollFormula,
    formatSigned,
    characterProficiencyBonus,
    skillProficiencyBonus,
    characterAttackBonus,
    characterSpellSlots,
    spellLevel,
    characterSheetDerived,
    characterClassEntry,
    classProgressionSection,
    splitClassFeatures,
    classSubclassRows,
    ...combatShared,
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
    ...combatShared,
  });

  const { renderCharacterSheetBuilder, renderCharacterSheetOverview } = createCharacterSheetOverviewRenderer({
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

  function renderCharacterSheetNotice() {
    if (!appState.characterSheetNotice) return '';

    return `
      <section class="sheet-notice" role="status" aria-live="polite">
        <span>${escapeHtml(appState.characterSheetNotice)}</span>
        <button class="button button--ghost" type="button" data-sheet-notice-dismiss>Chiudi</button>
      </section>
    `;
  }

  /*
   * Renderizza la scheda personaggio nativa.
   */
  function renderCharacterSheet(tab = 'overview') {
    const validTab = tab === 'characters' || tab === 'builder' || CHARACTER_SHEET_TABS.some(([id]) => id === tab) ? tab : 'overview';
    appState.characterSheetTab = validTab;

    setView('detail');

    if (validTab === 'characters') {
      views.detail.innerHTML = renderCharacterRoster();
      bindCharacterSheetEvents();
      return;
    }

    views.detail.innerHTML = `
      <nav class="detail-nav sheet-topbar" aria-label="Navigazione scheda personaggio">
        <a class="button sheet-home-link" href="#/">Reference</a>
      </nav>

      <article class="detail-card detail-card--flat character-sheet">
        ${renderCharacterSheetNotice()}
        ${renderCharacterSheetArchiveImportPrompt()}
        ${renderAppBackupImportPrompt()}
        ${renderCharacterSheetHeader(validTab)}
        ${renderCharacterSheetTabs(validTab)}
        ${renderCharacterSheetTab(validTab)}
        ${renderCharacterSheetManager()}
      </article>
    `;

    bindCharacterSheetEvents();
  }

  function renderCharacterRoster() {
    return `
      <nav class="detail-nav sheet-topbar" aria-label="Navigazione personaggi">
        <a class="button sheet-home-link" href="#/">Home</a>
      </nav>

      <article class="detail-card character-roster">
        ${renderCharacterSheetNotice()}
        ${renderCharacterSheetArchiveImportPrompt()}
        ${renderAppBackupImportPrompt()}
        <header class="detail-header character-roster-header">
          <div>
            <p class="detail-kicker">Schede salvate</p>
            <h2 class="detail-title">Personaggi</h2>
            <p class="subtitle">Scegli un personaggio per aprire subito la scheda da usare al tavolo.</p>
          </div>
          <button class="button button--primary" type="button" data-sheet-create-builder>Nuovo personaggio</button>
        </header>

        <div class="character-roster-grid">
          ${appState.characterSheets.map((sheet) => renderCharacterRosterCard(sheet)).join('')}
        </div>

        <details class="sheet-manager" aria-label="Archivio schede">
          <summary>
            <span>Archivio</span>
            <strong>Import/export</strong>
          </summary>
          <div class="sheet-manager-body sheet-manager-body--archive">
            <div class="sheet-manager-actions">
              <button class="button button--ghost" type="button" data-sheet-export-archive>Esporta archivio</button>
              <button class="button button--ghost" type="button" data-sheet-import-archive>Importa archivio</button>
              <button class="button button--ghost" type="button" data-app-export-backup>Esporta backup app</button>
              <button class="button button--ghost" type="button" data-app-import-backup>Importa backup app</button>
            </div>
            <input id="character-sheet-import" class="visually-hidden" type="file" accept="application/json,.json">
            <input id="character-sheet-archive-import" class="visually-hidden" type="file" accept="application/json,.json">
            <input id="app-backup-import" class="visually-hidden" type="file" accept="application/json,.json">
          </div>
        </details>
      </article>
    `;
  }

  function renderCharacterRosterCard(sheet) {
    const active = sheet.id === appState.characterSheet.id;
    const className = appState.data.classes.find((entry) => entry.id === sheet.classId)?.nome?.replace(/^Classe:\s*/i, '') || '';
    const title = sheet.name || 'Nuovo personaggio';
    const subtitle = [className, sheet.level ? `livello ${sheet.level}` : null, sheet.ancestry, sheet.background].filter(Boolean).join(' · ');
    const checklist = characterSheetDerived.characterBuilderChecklistForSheet(sheet);
    const complete = checklist.filter((item) => item.complete).length;
    const total = checklist.length || 1;
    const ready = complete === total;
    const next = checklist.find((item) => !item.complete);

    return `
      <article class="character-roster-card${active ? ' is-active' : ''}">
        <div>
          <span>${escapeHtml(active ? 'Attivo' : ready ? 'Pronto' : 'Bozza')}</span>
          <strong>${escapeHtml(title)}</strong>
          <p>${escapeHtml(subtitle || 'Scheda in preparazione')}</p>
        </div>
        <div class="character-roster-progress" aria-label="Avanzamento creazione">
          <strong>${escapeHtml(`${complete}/${total}`)}</strong>
          <span>${escapeHtml(ready ? 'Pronta per il tavolo' : `Prossimo: ${next?.label || 'rifinitura'}`)}</span>
        </div>
        <div class="character-roster-stats">
          <span>CA ${escapeHtml(String(Number(sheet.armorClass) || 10))}</span>
          <span>PF ${escapeHtml(String(Number(sheet.currentHp) || 0))}/${escapeHtml(String(Number(sheet.maxHp) || 0))}</span>
        </div>
        <div class="character-roster-actions">
          <button class="button" type="button" data-sheet-open-character="${escapeAttr(sheet.id)}">Apri scheda</button>
          ${ready ? '' : `<button class="button button--ghost" type="button" data-sheet-continue-character="${escapeAttr(sheet.id)}">Continua creazione</button>`}
          <button class="button button--ghost" type="button" data-sheet-rename-character="${escapeAttr(sheet.id)}">Rinomina</button>
          <button class="button button--ghost" type="button" data-sheet-duplicate-character="${escapeAttr(sheet.id)}">Duplica</button>
          <button class="button button--ghost" type="button" data-sheet-export-character="${escapeAttr(sheet.id)}">Esporta</button>
          <button class="button button--ghost sheet-danger-action" type="button" data-sheet-delete-character="${escapeAttr(sheet.id)}"${appState.characterSheets.length <= 1 ? ' disabled' : ''}>Elimina</button>
        </div>
      </article>
    `;
  }

  /*
   * Controlli di archivio e gestione: restano disponibili, ma non devono
   * competere con le informazioni giocabili nel primo colpo d'occhio.
   */
  function renderCharacterSheetManager() {
    return `
      <details class="sheet-manager" aria-label="Gestione scheda">
        <summary>
          <span>Gestisci scheda</span>
          <strong>${escapeHtml(sheetManagerLabel())}</strong>
        </summary>
        <div class="sheet-manager-body">
          <label class="sheet-character-picker">
            <span>Scheda attiva</span>
            <select class="sheet-character-select" data-sheet-switch-character aria-label="Personaggio attivo">
              ${appState.characterSheets.map((sheet) => `
                <option value="${escapeAttr(sheet.id)}"${sheet.id === appState.characterSheet.id ? ' selected' : ''}>${escapeHtml(sheet.name || 'Scheda personaggio')}</option>
              `).join('')}
            </select>
          </label>
          <div class="sheet-manager-actions">
            <a class="button button--ghost" href="#/character_sheet">Personaggi</a>
            <button class="button button--ghost" type="button" data-sheet-duplicate>Duplica</button>
            <details class="sheet-more-actions">
              <summary>Archivio</summary>
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
      </details>
    `;
  }

  function sheetManagerLabel() {
    return appState.characterSheet.name || 'Nuovo personaggio';
  }

  /*
   * Header della scheda con riepilogo derivato.
   */
  function renderCharacterSheetHeader(activeTab = 'overview') {
    const sheet = appState.characterSheet;
    const className = characterSheetClassName();
    const level = characterLevel();
    const isTable = activeTab === 'table';

    return `
      <header class="detail-header character-sheet-header${isTable ? ' character-sheet-header--table' : ''}">
        <div>
          <span class="sheet-kicker">Scheda personaggio</span>
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
    if (tab === 'builder') return renderCharacterSheetBuilder();
    if (tab === 'table') return renderCharacterSheetTable();
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
