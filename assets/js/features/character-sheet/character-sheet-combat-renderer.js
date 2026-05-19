export function createCharacterSheetCombatRenderer({
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
}) {
  function renderCharacterSheetCombat() {
    const sheet = appState.characterSheet;
    const initiative = abilityModifier(sheet.abilities.dex) + (Number(sheet.initiativeBonus) || 0);

    return `
      <section class="sheet-grid">
        ${renderCombatSummary(initiative)}

        <div class="sheet-panel sheet-panel--control">
          <h3>Difesa e punti ferita</h3>
          <div class="sheet-form-grid sheet-form-grid--compact">
            ${sheetNumberField('armorClass', 'Classe Armatura', sheet.armorClass, 0)}
            ${sheetNumberField('currentHp', 'PF attuali', sheet.currentHp, 0)}
            ${sheetNumberField('maxHp', 'PF massimi', sheet.maxHp, 0)}
            ${sheetNumberField('tempHp', 'PF temporanei', sheet.tempHp, 0)}
            ${sheetField('hitDice', 'Dadi Vita', sheet.hitDice)}
            ${sheetNumberField('speed', 'Velocita (m)', sheet.speed, 0)}
            ${sheetNumberField('initiativeBonus', 'Bonus iniziativa extra', sheet.initiativeBonus)}
          </div>
        </div>

        <div class="sheet-panel sheet-panel--control">
          <h3>Tiri rapidi</h3>
          <div class="quick-dice sheet-rolls">
            <button type="button" data-dice-roll="${escapeAttr(rollFormula(20, initiative))}">Iniziativa ${escapeHtml(formatSigned(initiative))}</button>
            ${ABILITY_META.map(([key, label]) => {
              const modifier = abilityModifier(sheet.abilities[key]);
              return `<button type="button" data-dice-roll="${escapeAttr(rollFormula(20, modifier))}">${escapeHtml(label)} ${escapeHtml(formatSigned(modifier))}</button>`;
            }).join('')}
          </div>
        </div>

        <div class="sheet-panel sheet-panel--wide">
          <h3>Stato</h3>
          ${renderCharacterStatus()}
        </div>

        <div class="sheet-panel sheet-panel--wide">
          <h3>Tiri salvezza</h3>
          <div class="save-grid">
            ${ABILITY_META.map(([key, label]) => renderSavingThrowControl(key, label)).join('')}
          </div>
        </div>

        <div class="sheet-panel sheet-panel--wide">
          <h3>Risorse</h3>
          ${renderCharacterResources()}
        </div>

        <div class="sheet-panel sheet-panel--wide">
          <h3>Attacchi</h3>
          ${renderCharacterAttacks()}
        </div>
      </section>
    `;
  }

  function renderCombatSummary(initiative) {
    const sheet = appState.characterSheet;
    const status = sheet.status;
    const activeStates = [
      status.inspiration ? 'Ispirazione' : null,
      status.concentration ? 'Concentrazione' : null,
      status.exhaustion ? `Indebolimento ${status.exhaustion}` : null,
      status.conditions.length ? `${status.conditions.length} condizioni` : null,
    ].filter(Boolean);

    return `
      <div class="sheet-panel sheet-panel--wide sheet-dashboard sheet-dashboard--combat">
        <div class="sheet-dashboard-heading">
          <div>
            <span>Combattimento</span>
            <strong>${escapeHtml(sheet.name || 'Personaggio')}</strong>
            <p>${escapeHtml(activeStates.length ? activeStates.join(' · ') : 'Nessuno stato critico attivo.')}</p>
          </div>
          <div class="sheet-action-row">
            <button type="button" data-dice-roll="${escapeAttr(rollFormula(20, initiative))}">Iniziativa ${escapeHtml(formatSigned(initiative))}</button>
          </div>
        </div>
        <div class="sheet-stat-strip">
          ${renderCombatStat('CA', Number(sheet.armorClass) || 10, 'Classe armatura')}
          ${renderCombatStat('PF', `${Number(sheet.currentHp) || 0}/${Number(sheet.maxHp) || 0}`, 'Attuali / massimi')}
          ${renderCombatStat('Temp', Number(sheet.tempHp) || 0, 'Punti ferita')}
          ${renderCombatStat('Vel', Number(sheet.speed) || 0, 'metri')}
          ${renderCombatStat('DV', sheet.hitDice || '-', 'Dadi vita')}
          ${renderCombatStat('Iniz.', formatSigned(initiative), 'Totale')}
        </div>
      </div>
    `;
  }

  function renderCombatStat(label, value, hint) {
    return `
      <div class="sheet-summary-stat">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(String(value))}</strong>
        <small>${escapeHtml(hint)}</small>
      </div>
    `;
  }

  function renderSavingThrowControl(key, label) {
    const sheet = appState.characterSheet;
    const modifier = abilityModifier(sheet.abilities[key]) + (sheet.savingThrows[key] ? characterProficiencyBonus() : 0);

    return `
      <label class="save-control">
        <input type="checkbox" ${sheet.savingThrows[key] ? 'checked' : ''} data-sheet-save="${escapeAttr(key)}">
        <span>${escapeHtml(label)}</span>
        <button type="button" data-dice-roll="${escapeAttr(rollFormula(20, modifier))}">${escapeHtml(formatSigned(modifier))}</button>
      </label>
    `;
  }

  function renderCharacterResources() {
    const resources = appState.characterSheet.resources;

    return `
      <form class="sheet-resource-form" data-sheet-add-resource>
        <label class="sheet-field">
          <span>Nome</span>
          <input type="text" name="name" placeholder="Azione Impetuosa">
        </label>
        <label class="sheet-field">
          <span>Massimo</span>
          <input type="number" name="max" min="0" value="1">
        </label>
        <label class="sheet-field">
          <span>Recupero</span>
          <input type="text" name="recovery" placeholder="Riposo breve">
        </label>
        <button class="button button--primary" type="submit">Aggiungi</button>
      </form>

      <div class="sheet-resource-toolbar" aria-label="Riposo e recupero risorse">
        <button class="button button--ghost" type="button" data-sheet-reset-resources="short">Riposo breve</button>
        <button class="button button--ghost" type="button" data-sheet-reset-resources="long">Riposo lungo</button>
      </div>

      ${resources.length ? `
        <div class="sheet-resource-list">
          ${resources.map((resource) => renderCharacterResource(resource)).join('')}
        </div>
      ` : '<p class="sheet-empty">Nessuna risorsa tracciata.</p>'}
    `;
  }

  function renderCharacterResource(resource) {
    const max = Math.max(0, Number(resource.max) || 0);
    const used = Math.min(max, Math.max(0, Number(resource.used) || 0));
    const remaining = Math.max(0, max - used);

    return `
      <article class="sheet-resource">
        <div class="sheet-resource-main">
          <strong>${escapeHtml(resource.name || 'Risorsa')}</strong>
          <span>${escapeHtml([`${remaining}/${max} disponibili`, resource.recovery].filter(Boolean).join(' · '))}</span>
        </div>
        <div class="sheet-resource-edit">
          <label>
            <span>Nome</span>
            <input type="text" value="${escapeAttr(resource.name || '')}" data-sheet-resource-field="name" data-sheet-resource-id="${escapeAttr(resource.id)}">
          </label>
          <label>
            <span>Max</span>
            <input type="number" min="0" value="${escapeAttr(String(max))}" data-sheet-resource-field="max" data-sheet-resource-id="${escapeAttr(resource.id)}">
          </label>
          <label>
            <span>Recupero</span>
            <input type="text" value="${escapeAttr(resource.recovery || '')}" data-sheet-resource-field="recovery" data-sheet-resource-id="${escapeAttr(resource.id)}">
          </label>
        </div>
        <div class="sheet-resource-actions">
          <button type="button" data-sheet-resource-delta="-1" data-sheet-resource-id="${escapeAttr(resource.id)}">Recupera</button>
          <button type="button" data-sheet-resource-delta="1" data-sheet-resource-id="${escapeAttr(resource.id)}">Usa</button>
          <button class="button button--ghost" type="button" data-sheet-remove-resource="${escapeAttr(resource.id)}">Rimuovi</button>
        </div>
      </article>
    `;
  }

  function renderCharacterStatus() {
    const status = appState.characterSheet.status;
    const conditions = characterConditionOptions();

    return `
      <div class="sheet-status">
        <label class="sheet-check">
          <input type="checkbox" ${status.inspiration ? 'checked' : ''} data-sheet-status-check="inspiration">
          <span>Ispirazione</span>
        </label>
        <label class="sheet-check">
          <input type="checkbox" ${status.concentration ? 'checked' : ''} data-sheet-status-check="concentration">
          <span>Concentrazione</span>
        </label>
        <label class="sheet-field">
          <span>Indebolimento</span>
          <input type="number" min="0" max="6" value="${escapeAttr(String(status.exhaustion))}" data-sheet-status-number="exhaustion">
        </label>
        <label class="sheet-field">
          <span>TS morte riusciti</span>
          <input type="number" min="0" max="3" value="${escapeAttr(String(status.deathSaveSuccesses))}" data-sheet-status-number="deathSaveSuccesses">
        </label>
        <label class="sheet-field">
          <span>TS morte falliti</span>
          <input type="number" min="0" max="3" value="${escapeAttr(String(status.deathSaveFailures))}" data-sheet-status-number="deathSaveFailures">
        </label>
        <label class="sheet-field">
          <span>Aggiungi condizione</span>
          <select data-sheet-add-condition>
            <option value="">Scegli condizione</option>
            ${conditions
              .filter((condition) => !status.conditions.includes(condition.id))
              .map((condition) => `<option value="${escapeAttr(condition.id)}">${escapeHtml(condition.nome)}</option>`)
              .join('')}
          </select>
        </label>
      </div>

      ${renderCharacterConditions()}
      ${sheetStatusTextArea('notes', 'Note di stato rapide...', status.notes)}
    `;
  }

  function renderCharacterConditions() {
    const conditions = appState.characterSheet.status.conditions
      .map((id) => appState.data.rules_glossary.find((entry) => entry.id === id))
      .filter(Boolean)
      .sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'it'));

    if (!conditions.length) {
      return '<p class="sheet-empty">Nessuna condizione attiva.</p>';
    }

    return `
      <div class="sheet-condition-list">
        ${conditions.map((condition) => `
          <article class="sheet-condition">
            <a href="#/rules_glossary/${encodeURIComponent(condition.id)}">${escapeHtml(condition.nome)}</a>
            <button class="button button--ghost" type="button" data-sheet-remove-condition="${escapeAttr(condition.id)}">Rimuovi</button>
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderCharacterAttacks() {
    const attacks = appState.characterSheet.attacks;

    return `
      <form class="sheet-attack-form" data-sheet-add-attack>
        <label class="sheet-field">
          <span>Nome</span>
          <input type="text" name="name" placeholder="Spada lunga">
        </label>
        <label class="sheet-field">
          <span>Caratteristica</span>
          <select name="ability">
            ${abilityOptions().map((option) => `
              <option value="${escapeAttr(option.value)}">${escapeHtml(option.label)}</option>
            `).join('')}
          </select>
        </label>
        <label class="sheet-field">
          <span>Danni</span>
          <input type="text" name="damage" placeholder="1d8+3">
        </label>
        <label class="sheet-field">
          <span>Tipo</span>
          <input type="text" name="damageType" placeholder="taglienti">
        </label>
        <label class="sheet-check">
          <input type="checkbox" name="proficient" checked>
          <span>Competente</span>
        </label>
        <button class="button button--primary" type="submit">Aggiungi</button>
      </form>

      ${attacks.length ? `
        <div class="sheet-attack-list">
          ${attacks.map((attack) => renderCharacterAttack(attack)).join('')}
        </div>
      ` : '<p class="sheet-empty">Nessun attacco salvato.</p>'}
    `;
  }

  function renderCharacterAttack(attack) {
    const ability = ABILITY_META.find(([key]) => key === attack.ability)?.[2] || 'CAR';
    const attackBonus = characterAttackBonus(attack);
    const damage = String(attack.damage || '').trim();

    return `
      <article class="sheet-attack">
        <div class="sheet-attack-main">
          <strong>${escapeHtml(attack.name || 'Attacco')}</strong>
          <span>${escapeHtml([ability, attack.proficient ? 'competente' : null, attack.damageType].filter(Boolean).join(' · '))}</span>
          ${attack.notes ? `<p>${escapeHtml(attack.notes)}</p>` : ''}
        </div>
        <div class="sheet-attack-edit">
          <label>
            <span>Nome</span>
            <input type="text" value="${escapeAttr(attack.name || '')}" data-sheet-attack-field="name" data-sheet-attack-id="${escapeAttr(attack.id)}">
          </label>
          <label>
            <span>Car.</span>
            <select data-sheet-attack-field="ability" data-sheet-attack-id="${escapeAttr(attack.id)}">
              ${abilityOptions().map((option) => `
                <option value="${escapeAttr(option.value)}"${option.value === attack.ability ? ' selected' : ''}>${escapeHtml(option.label)}</option>
              `).join('')}
            </select>
          </label>
          <label>
            <span>Bonus</span>
            <input type="number" value="${escapeAttr(String(Number(attack.bonus) || 0))}" data-sheet-attack-field="bonus" data-sheet-attack-id="${escapeAttr(attack.id)}">
          </label>
          <label>
            <span>Danni</span>
            <input type="text" value="${escapeAttr(attack.damage || '')}" data-sheet-attack-field="damage" data-sheet-attack-id="${escapeAttr(attack.id)}">
          </label>
          <label>
            <span>Tipo</span>
            <input type="text" value="${escapeAttr(attack.damageType || '')}" data-sheet-attack-field="damageType" data-sheet-attack-id="${escapeAttr(attack.id)}">
          </label>
          <label class="sheet-check sheet-check--compact">
            <input type="checkbox" ${attack.proficient ? 'checked' : ''} data-sheet-attack-field="proficient" data-sheet-attack-id="${escapeAttr(attack.id)}">
            <span>Comp.</span>
          </label>
          <label class="sheet-attack-notes">
            <span>Note</span>
            <input type="text" value="${escapeAttr(attack.notes || '')}" data-sheet-attack-field="notes" data-sheet-attack-id="${escapeAttr(attack.id)}">
          </label>
        </div>
        <div class="sheet-attack-actions">
          <button type="button" data-dice-roll="${escapeAttr(rollFormula(20, attackBonus))}">Colpire ${escapeHtml(formatSigned(attackBonus))}</button>
          ${damage ? `<button type="button" data-dice-roll="${escapeAttr(damage)}">Danni ${escapeHtml(damage)}</button>` : ''}
          <button class="button button--ghost" type="button" data-sheet-remove-attack="${escapeAttr(attack.id)}">Rimuovi</button>
        </div>
      </article>
    `;
  }

  return { renderCharacterSheetCombat };
}
