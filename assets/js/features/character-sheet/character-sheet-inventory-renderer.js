export function createCharacterSheetInventoryRenderer({
  appState,
  escapeAttr,
  escapeHtml,
  sheetTextArea,
  magicItemRequiresAttunement,
}) {
  function renderCharacterSheetInventory() {
    const sheet = appState.characterSheet;

    return `
      <section class="sheet-grid">
        ${renderInventorySummary()}

        <div class="sheet-panel sheet-panel--control">
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

  function renderInventorySummary() {
    const sheet = appState.characterSheet;
    const coinEntries = Object.entries({ pp: 'PP', mo: 'MO', ma: 'MA', mr: 'MR' });
    const magicCount = sheet.magicItems.length;
    const attunedCount = sheet.attunedMagicItems.length;

    return `
      <div class="sheet-panel sheet-panel--wide sheet-dashboard sheet-dashboard--inventory">
        <div class="sheet-dashboard-heading">
          <div>
            <span>Inventario</span>
            <strong>${escapeHtml(`${magicCount} oggetti magici`)}</strong>
            <p>${escapeHtml(attunedCount ? `${attunedCount}/3 oggetti in sintonia.` : 'Nessun oggetto in sintonia.')}</p>
          </div>
        </div>
        <div class="sheet-stat-strip">
          ${coinEntries.map(([key, label]) => renderInventoryStat(label, sheet.coins[key] ?? 0, 'Monete')).join('')}
          ${renderInventoryStat('Magici', magicCount, 'Oggetti')}
          ${renderInventoryStat('Sintonia', `${attunedCount}/3`, 'Limite')}
        </div>
      </div>
    `;
  }

  function renderInventoryStat(label, value, hint) {
    return `
      <div class="sheet-summary-stat">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(String(value))}</strong>
        <small>${escapeHtml(hint)}</small>
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

  return { renderCharacterSheetInventory };
}
