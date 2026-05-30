import { activeEffectModifier } from './character-sheet-normalizers.js?v=20260530-effects';

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
    const slots = characterSpellSlots();
    const hasClass = Boolean(sheet.classId);
    const isCaster = Boolean(spellOptions.length || slots.length);

    if (!isCaster) return renderSpellEmptyState(hasClass);

    const dc = 8 + characterProficiencyBonus() + abilityModifier(sheet.abilities[sheet.spellcastingAbility]) +
      activeEffectModifier(sheet.activeEffects, 'spellDc');
    const attack = characterProficiencyBonus() + abilityModifier(sheet.abilities[sheet.spellcastingAbility]) +
      activeEffectModifier(sheet.activeEffects, 'attack');
    const prepared = preparedSpellList();

    return `
      <section class="sheet-grid sheet-spell-grid">
        <div class="sheet-panel sheet-panel--wide sheet-dashboard sheet-dashboard--spells">
          <div class="sheet-dashboard-heading">
            <div>
              <span>Magia</span>
              <strong>${escapeHtml(`${prepared.length} pronti`)}</strong>
              <p>${escapeHtml(spellOptions.length ? 'Preparati, slot e catalogo SRD sono separati per uso al tavolo.' : 'Scegli una classe per filtrare il catalogo incantesimi.')}</p>
            </div>
          </div>
          <div class="sheet-stat-strip">
            ${renderSpellStat('CD', dc, 'Incantesimi')}
            ${renderSpellStat('Attacco', formatSigned(attack), 'Incantesimo')}
            ${renderSpellStat('Car.', abilityOptions().find((option) => option.value === sheet.spellcastingAbility)?.label || sheet.spellcastingAbility, 'Lancio')}
            ${renderSpellStat('Trucchetti', prepared.filter((spell) => Number(spell.livello) === 0).length, 'Pronti')}
            ${renderSpellStat('Incantesimi', prepared.filter((spell) => Number(spell.livello) > 0).length, 'Pronti')}
            ${renderSpellStat('Slot', spellSlotSummary(), 'Residui')}
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

        <div class="sheet-panel sheet-panel--wide">
          <h3>Trucchetti</h3>
          ${renderPreparedSpells({ cantrips: true })}
        </div>

        <div class="sheet-panel sheet-panel--wide">
          <h3>Preparati / conosciuti</h3>
          ${renderPreparedSpells({ cantrips: false })}
        </div>

        <div class="sheet-panel sheet-panel--wide sheet-spell-picker">
          <h3>Catalogo classe</h3>
          ${renderSpellCatalog()}
        </div>
      </section>
    `;
  }

  function renderSpellEmptyState(hasClass) {
    return `
      <section class="sheet-grid sheet-spell-grid">
        <div class="sheet-panel sheet-panel--wide sheet-dashboard sheet-dashboard--spells sheet-spell-empty-state">
          <div class="sheet-dashboard-heading">
            <div>
              <span>Magia</span>
              <strong>${escapeHtml(hasClass ? 'Nessun lancio incantesimi' : 'Classe da scegliere')}</strong>
              <p>${escapeHtml(hasClass
                ? 'Questa classe non ha incantesimi nel catalogo SRD collegato. La scheda resta pronta per combattimento, inventario e note.'
                : 'Scegli una classe nel builder per capire se il personaggio usa incantesimi.')}</p>
            </div>
            <a class="button button--ghost" href="${escapeAttr(hasClass ? '#/character_sheet/combat' : '#/character_sheet/builder')}">
              ${escapeHtml(hasClass ? 'Vai al combattimento' : 'Completa creazione')}
            </a>
          </div>
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

  function preparedSpellList() {
    return appState.characterSheet.preparedSpells
      .map((id) => appState.data.spells.find((spell) => spell.id === id))
      .filter(Boolean)
      .sort((a, b) => Number(a.livello) - Number(b.livello) || String(a.nome).localeCompare(String(b.nome), 'it'));
  }

  function renderPreparedSpells({ cantrips }) {
    const spells = preparedSpellList().filter((spell) => cantrips ? Number(spell.livello) === 0 : Number(spell.livello) > 0);

    if (!spells.length) {
      return `<p class="sheet-empty">${escapeHtml(cantrips ? 'Nessun trucchetto pronto.' : 'Nessun incantesimo preparato o conosciuto.')}</p>`;
    }

    return `
      <div class="prepared-spell-list prepared-spell-list--cards">
        ${spells.map((spell) => renderPreparedSpellCard(spell)).join('')}
      </div>
    `;
  }

  function renderPreparedSpellCard(spell) {
    const level = Number(spell.livello) || 0;
    const slot = level > 0 ? firstAvailableSlot(level) : null;
    const unavailable = level > 0 && !slot;

    return `
      <article class="prepared-spell prepared-spell--card">
        <div class="prepared-spell-main">
          <a href="#/spells/${encodeURIComponent(spell.id)}">${escapeHtml(spell.nome)}</a>
          <span>${escapeHtml([spellLevel(spell), spell.scuola, spell.tempo_lancio].filter(Boolean).join(' · '))}</span>
          <p>${escapeHtml(spellMetaLine(spell))}</p>
        </div>
        <div class="prepared-spell-actions">
          <button
            class="button button--ghost"
            type="button"
            data-sheet-cast-spell="${escapeAttr(spell.id)}"
            ${unavailable ? 'disabled' : ''}
          >${escapeHtml(level === 0 ? 'Lancia' : slot ? `Lancia ${slot.replace(/^Slot\\s+/i, 'liv. ')}` : 'Slot finiti')}</button>
          <button class="button button--ghost" type="button" data-sheet-remove-spell="${escapeAttr(spell.id)}">Rimuovi</button>
        </div>
      </article>
    `;
  }

  function renderSpellCatalog() {
    const filters = spellFilters();
    const levels = catalogLevels();
    const schools = catalogSchools();
    const spells = filteredCatalog();

    return `
      <div class="sheet-spell-catalog-controls">
        <label class="sheet-field">
          <span>Livello</span>
          <select data-sheet-spell-filter="level">
            <option value="">Tutti</option>
            ${levels.map((level) => `<option value="${escapeAttr(String(level))}"${String(level) === filters.level ? ' selected' : ''}>${escapeHtml(level === 0 ? 'Trucchetti' : `${level}° livello`)}</option>`).join('')}
          </select>
        </label>
        <label class="sheet-field">
          <span>Scuola</span>
          <select data-sheet-spell-filter="school">
            <option value="">Tutte</option>
            ${schools.map((school) => `<option value="${escapeAttr(school)}"${school === filters.school ? ' selected' : ''}>${escapeHtml(school)}</option>`).join('')}
          </select>
        </label>
        <label class="sheet-field">
          <span>Aggiungi rapido</span>
          <select data-sheet-add-spell>
            <option value="">Scegli incantesimo</option>
            ${spells.map((spell) => `<option value="${escapeAttr(spell.id)}">${escapeHtml(spellOptionLabel(spell))}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="sheet-spell-catalog">
        ${spells.slice(0, 18).map((spell) => renderCatalogSpell(spell)).join('')}
      </div>
    `;
  }

  function renderCatalogSpell(spell) {
    const added = appState.characterSheet.preparedSpells.includes(spell.id);

    return `
      <article class="sheet-spell-catalog-card">
        <div>
          <span>${escapeHtml([spellLevel(spell), spell.scuola].filter(Boolean).join(' · '))}</span>
          <strong>${escapeHtml(spell.nome || spell.id)}</strong>
          <p>${escapeHtml(spellMetaLine(spell))}</p>
        </div>
        <div>
          <button class="button button--ghost" type="button" data-sheet-add-spell-button="${escapeAttr(spell.id)}"${added ? ' disabled' : ''}>
            ${escapeHtml(added ? 'Gia pronto' : 'Prepara')}
          </button>
          <a class="button button--ghost" href="#/spells/${encodeURIComponent(spell.id)}">Dettaglio</a>
        </div>
      </article>
    `;
  }

  function filteredCatalog() {
    const filters = spellFilters();
    return characterSpellOptions()
      .filter((spell) => !filters.level || String(spell.livello) === filters.level)
      .filter((spell) => !filters.school || spell.scuola === filters.school);
  }

  function catalogLevels() {
    return [...new Set(characterSpellOptions().map((spell) => Number(spell.livello)).filter((level) => Number.isFinite(level)))]
      .sort((a, b) => a - b);
  }

  function catalogSchools() {
    return [...new Set(characterSpellOptions().map((spell) => spell.scuola).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'it'));
  }

  function spellFilters() {
    return appState.characterSpellFilters || { level: '', school: '' };
  }

  function spellMetaLine(spell) {
    return [
      spell.tempo_lancio ? `Tempo ${spell.tempo_lancio}` : '',
      spell.gittata ? `Gittata ${spell.gittata}` : '',
      spell.componenti ? `Comp. ${spell.componenti}` : '',
      spell.durata,
      String(spell.durata || '').toLowerCase().includes('concentrazione') ? 'Concentrazione' : '',
    ].filter(Boolean).join(' · ');
  }

  function firstAvailableSlot(level) {
    const slots = characterSpellSlots()
      .map(([label, value]) => ({
        label,
        level: Number(String(label).match(/\d+/)?.[0]) || 0,
        max: Math.max(0, Number(value) || 0),
      }))
      .filter((slot) => slot.level >= level && slot.max > 0)
      .sort((a, b) => a.level - b.level);

    return slots.find((slot) => (Number(appState.characterSheet.spellSlotsUsed[slot.label]) || 0) < slot.max)?.label || '';
  }

  function spellSlotSummary() {
    const slots = characterSpellSlots();
    if (!slots.length) return '0';

    return slots
      .map(([label, value]) => {
        const max = Math.max(0, Number(value) || 0);
        const used = Math.min(max, Math.max(0, Number(appState.characterSheet.spellSlotsUsed[label]) || 0));
        return `${label.replace(/^Slot\\s+/i, '')}:${Math.max(0, max - used)}`;
      })
      .join(' ');
  }

  return { renderCharacterSheetSpells };
}
