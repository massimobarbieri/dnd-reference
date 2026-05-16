/*
* Renderizza la scheda personaggio nativa.
*/
export async function renderCharacterSheet(tab = 'overview') {
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

export async function sheetField(key, label, value) {
    return `
      <label class="sheet-field">
        <span>${escapeHtml(label)}</span>
        <input type="text" value="${escapeAttr(value || '')}" data-sheet-field="${escapeAttr(key)}">
      </label>
    `;
}

export async function sheetNumberField(key, label, value, min, max) {
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

export async function sheetSelect(key, label, value, options) {
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

export async function sheetTextArea(key, placeholder, value) {
    return `
      <label class="sheet-field sheet-field--wide">
        <span class="visually-hidden">${escapeHtml(placeholder)}</span>
        <textarea data-sheet-field="${escapeAttr(key)}" placeholder="${escapeAttr(placeholder)}">${escapeHtml(value || '')}</textarea>
      </label>
    `;
}

export async function sheetProficiencyTextArea(key, label, placeholder, value) {
    return `
      <label class="sheet-field sheet-field--wide">
        <span>${escapeHtml(label)}</span>
        <textarea data-sheet-proficiency="${escapeAttr(key)}" placeholder="${escapeAttr(placeholder)}">${escapeHtml(value || '')}</textarea>
      </label>
    `;
}

export async function sheetStatusTextArea(key, placeholder, value) {
    return `
      <label class="sheet-field sheet-field--wide sheet-status-notes">
        <span class="visually-hidden">${escapeHtml(placeholder)}</span>
        <textarea data-sheet-status-field="${escapeAttr(key)}" placeholder="${escapeAttr(placeholder)}">${escapeHtml(value || '')}</textarea>
      </label>
    `;
}