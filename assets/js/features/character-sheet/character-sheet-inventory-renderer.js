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
