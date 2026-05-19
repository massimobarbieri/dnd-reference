export function createCharacterSheetSpellsRenderer({
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
}) {
  function renderCharacterSheetSpells() {
    const sheet = appState.characterSheet;
    const spellOptions = characterSpellOptions();
    const dc = 8 + characterProficiencyBonus() + abilityModifier(sheet.abilities[sheet.spellcastingAbility]);
    const attack = characterProficiencyBonus() + abilityModifier(sheet.abilities[sheet.spellcastingAbility]);

    return `
      <section class="sheet-grid sheet-spell-grid">
        <div class="sheet-panel sheet-panel--wide sheet-dashboard sheet-dashboard--spells">
          <div class="sheet-dashboard-heading">
            <div>
              <span>Magia</span>
              <strong>${escapeHtml(`${appState.characterSheet.preparedSpells.length} preparati`)}</strong>
              <p>${escapeHtml(spellOptions.length ? "Catalogo filtrato per classe pronto all'uso." : 'Scegli una classe per filtrare il catalogo incantesimi.')}</p>
            </div>
          </div>
          <div class="sheet-stat-strip">
            ${renderSpellStat('CD', dc, 'Incantesimi')}
            ${renderSpellStat('Attacco', formatSigned(attack), 'Incantesimo')}
            ${renderSpellStat('Car.', abilityOptions().find((option) => option.value === sheet.spellcastingAbility)?.label || sheet.spellcastingAbility, 'Lancio')}
            ${renderSpellStat('Preparati', appState.characterSheet.preparedSpells.length, 'Lista')}
          </div>
        </div>

        <div class="sheet-panel sheet-panel--control sheet-spell-summary">
          <h3>Incantatore</h3>
          <div class="sheet-form-grid sheet-form-grid--compact">
            ${sheetSelect('spellcastingAbility', 'Caratteristica', sheet.spellcastingAbility, abilityOptions())}
            <div class="sheet-derived"><span>CD incantesimi</span><strong>${escapeHtml(String(dc))}</strong></div>
            <div class="sheet-derived"><span>Attacco incantesimo</span><strong>${escapeHtml(formatSigned(attack))}</strong></div>
          </div>
        </div>

        <div class="sheet-panel sheet-panel--control sheet-spell-slots">
          <h3>Slot disponibili</h3>
          ${renderCharacterSpellSlots()}
        </div>

        <div class="sheet-panel sheet-panel--control sheet-spell-picker">
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

  function renderSpellStat(label, value, hint) {
    return `
      <div class="sheet-summary-stat">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(String(value))}</strong>
        <small>${escapeHtml(hint)}</small>
      </div>
    `;
  }

  function renderCharacterSpellSlots() {
    const slots = characterSpellSlots();

    if (!slots.length) {
      return '<p class="sheet-empty">Nessuno slot indicato per classe e livello correnti.</p>';
    }

    return `
      <div class="sheet-slot-toolbar">
        <button class="button button--ghost" type="button" data-sheet-reset-spell-slots>Riposo lungo</button>
      </div>
      <div class="sheet-slot-grid">
        ${slots.map(([label, value]) => `
          ${renderCharacterSpellSlot(label, value)}
        `).join('')}
      </div>
    `;
  }

  function renderCharacterSpellSlot(label, value) {
    const max = Math.max(0, Number(value) || 0);
    const used = Math.min(max, Math.max(0, Number(appState.characterSheet.spellSlotsUsed[label]) || 0));
    const remaining = Math.max(0, max - used);

    return `
          <div class="sheet-slot">
            <span>${escapeHtml(label.replace(/^Slot\s+/i, 'Liv. '))}</span>
            <strong>${escapeHtml(`${remaining}/${max}`)}</strong>
            <div class="sheet-slot-actions">
              <button type="button" data-sheet-slot-delta="-1" data-sheet-slot-label="${escapeAttr(label)}">Recupera</button>
              <button type="button" data-sheet-slot-delta="1" data-sheet-slot-label="${escapeAttr(label)}">Usa</button>
            </div>
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

  return { renderCharacterSheetSpells };
}
