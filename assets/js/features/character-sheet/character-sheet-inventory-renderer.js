export function createCharacterSheetInventoryRenderer({
  appState,
  escapeAttr,
  escapeHtml,
  sheetTextArea,
  magicItemRequiresAttunement,
  characterClassEntry,
  characterSheetDerived,
}) {
  function renderCharacterSheetInventory() {
    const sheet = appState.characterSheet;

    return `
      <section class="sheet-grid">
        ${renderInventorySummary()}
        ${renderStartingEquipmentPanel()}

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
          <h3>Equipaggiamento</h3>
          ${renderCharacterSheetEquipment()}
        </div>

        <div class="sheet-panel sheet-panel--wide">
          <h3>Oggetti magici</h3>
          ${renderCharacterAttunementSummary()}
          ${renderCharacterSheetMagicItems()}
        </div>

        <div class="sheet-panel sheet-panel--wide">
          <h3>Note inventario</h3>
          ${sheetTextArea('equipment', 'Dettagli liberi, tesori, contenitori, promemoria...', sheet.equipment)}
        </div>
      </section>
    `;
  }

  function renderStartingEquipmentPanel() {
    const classText = characterSheetDerived.classStartingEquipmentText();
    const classOptions = characterSheetDerived.classStartingEquipmentOptions(classText);
    const background = characterSheetDerived.characterBackgroundEntry();
    const backgroundCoins = characterSheetDerived.backgroundStartingCoinsText();
    const backgroundOption = characterSheetDerived.backgroundStartingCoinsOption();

    if (!classText && !backgroundCoins) return '';

    return `
      <div class="sheet-panel sheet-panel--wide sheet-starting-equipment">
        <h3>Equipaggiamento iniziale</h3>
        <div class="sheet-starting-grid">
          ${classText ? `
            <article class="sheet-starting-card">
              <div>
                <span>Classe</span>
                <strong>${escapeHtml(characterClassEntry()?.nome?.replace(/^Classe:\s*/i, '') || 'Classe')}</strong>
                <p>${escapeHtml(classText)}</p>
              </div>
              <div class="sheet-starting-actions">
                ${classOptions.map((option) => `
                  <button class="button button--ghost" type="button" data-sheet-apply-starting-equipment="${escapeAttr(option.key)}"${option.imported ? ' disabled' : ''}>
                    ${escapeHtml(option.imported ? 'Gia importato' : option.label)}
                  </button>
                `).join('')}
              </div>
            </article>
          ` : ''}
          ${backgroundCoins ? `
            <article class="sheet-starting-card">
              <div>
                <span>Background</span>
                <strong>${escapeHtml(background?.nome || 'Background')}</strong>
                <p>${escapeHtml(`Alternativa: ${backgroundCoins}`)}</p>
              </div>
              <div class="sheet-starting-actions">
                <button class="button button--ghost" type="button" data-sheet-apply-starting-equipment="background-coins"${backgroundOption?.imported ? ' disabled' : ''}>
                  ${escapeHtml(backgroundOption?.imported ? 'Gia importate' : 'Applica monete')}
                </button>
              </div>
            </article>
          ` : ''}
        </div>
      </div>
    `;
  }

  function renderInventorySummary() {
    const sheet = appState.characterSheet;
    const coinEntries = Object.entries({ pp: 'PP', mo: 'MO', ma: 'MA', mr: 'MR' });
    const equipmentCount = sheet.equipmentItems.length;
    const magicCount = sheet.magicItems.length;
    const attunedCount = sheet.attunedMagicItems.length;

    return `
      <div class="sheet-panel sheet-panel--wide sheet-dashboard sheet-dashboard--inventory">
        <div class="sheet-dashboard-heading">
          <div>
            <span>Inventario</span>
            <strong>${escapeHtml(`${equipmentCount + magicCount} oggetti`)}</strong>
            <p>${escapeHtml(attunedCount ? `${attunedCount}/3 oggetti in sintonia.` : 'Equipaggiamento e oggetti magici tracciati nella scheda.')}</p>
          </div>
        </div>
        <div class="sheet-stat-strip">
          ${coinEntries.map(([key, label]) => renderInventoryStat(label, sheet.coins[key] ?? 0, 'Monete')).join('')}
          ${renderInventoryStat('Equip.', equipmentCount, 'Oggetti')}
          ${renderInventoryStat('Magici', magicCount, 'Oggetti')}
          ${renderInventoryStat('Sintonia', `${attunedCount}/3`, 'Limite')}
        </div>
      </div>
    `;
  }

  function renderCharacterSheetEquipment() {
    return `
      <form class="sheet-equipment-form" data-sheet-add-equipment>
        <label class="sheet-field">
          <span>Nome</span>
          <input type="text" name="name" placeholder="Corda di canapa">
        </label>
        <label class="sheet-field">
          <span>Qta</span>
          <input type="number" name="quantity" min="1" value="1">
        </label>
        <label class="sheet-field">
          <span>Peso</span>
          <input type="text" name="weight" placeholder="5 kg">
        </label>
        <label class="sheet-field">
          <span>Costo</span>
          <input type="text" name="cost" placeholder="1 mo">
        </label>
        <button class="button button--primary" type="submit">Aggiungi</button>
      </form>

      ${appState.characterSheet.equipmentItems.length ? `
        <div class="sheet-equipment-list">
          ${appState.characterSheet.equipmentItems.map((item) => renderEquipmentItem(item)).join('')}
        </div>
      ` : '<p class="sheet-empty">Nessun equipaggiamento strutturato. Puoi aggiungerlo qui o importarlo dalle regole SRD di equipaggiamento.</p>'}
    `;
  }

  function renderEquipmentItem(item) {
    return `
      <article class="sheet-equipment-item">
        <div class="sheet-equipment-main">
          <strong>${escapeHtml(item.name || 'Oggetto')}</strong>
          <span>${escapeHtml([
            `qta ${Number(item.quantity) || 1}`,
            item.weight ? `peso ${item.weight}` : null,
            item.cost ? `costo ${item.cost}` : null,
            item.armorClass ? `CA ${item.armorClass}` : null,
            item.equipped ? 'equipaggiato' : null,
          ].filter(Boolean).join(' · '))}</span>
          ${item.source ? `<small>${escapeHtml(item.source)}</small>` : ''}
          ${item.notes ? `<p>${escapeHtml(item.notes)}</p>` : ''}
        </div>
        <div class="sheet-equipment-edit">
          <label>
            <span>Nome</span>
            <input type="text" value="${escapeAttr(item.name || '')}" data-sheet-equipment-field="name" data-sheet-equipment-id="${escapeAttr(item.id)}">
          </label>
          <label>
            <span>Qta</span>
            <input type="number" min="1" value="${escapeAttr(String(Number(item.quantity) || 1))}" data-sheet-equipment-field="quantity" data-sheet-equipment-id="${escapeAttr(item.id)}">
          </label>
          <label>
            <span>Peso</span>
            <input type="text" value="${escapeAttr(item.weight || '')}" data-sheet-equipment-field="weight" data-sheet-equipment-id="${escapeAttr(item.id)}">
          </label>
          <label>
            <span>Costo</span>
            <input type="text" value="${escapeAttr(item.cost || '')}" data-sheet-equipment-field="cost" data-sheet-equipment-id="${escapeAttr(item.id)}">
          </label>
          <label class="sheet-equipment-notes">
            <span>Note</span>
            <input type="text" value="${escapeAttr(item.notes || '')}" data-sheet-equipment-field="notes" data-sheet-equipment-id="${escapeAttr(item.id)}">
          </label>
        </div>
        <div class="sheet-equipment-actions">
          ${item.armorClass ? `<button type="button" data-sheet-apply-armor="${escapeAttr(item.id)}">Imposta CA ${escapeHtml(item.armorClass)}</button>` : ''}
          <button class="button button--ghost" type="button" data-sheet-remove-equipment="${escapeAttr(item.id)}">Rimuovi</button>
        </div>
      </article>
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
