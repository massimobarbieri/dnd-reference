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
  characterSpellSlots,
  characterSpellOptions,
  spellLevel,
  characterSheetDerived,
  combatRound,
  movementUsed,
  combatState,
  turnReadinessSummary,
  hitDiceAvailableSummary,
  formatMeters,
  renderTurnSlot,
  renderHitPointQuickControls,
  renderHpVital,
  renderAcVital,
}) {
  function renderCharacterSheetCombat() {
    const sheet = appState.characterSheet;
    const initiative = characterSheetDerived.characterInitiative();
    const suggestedArmorClass = characterSheetDerived.characterSuggestedArmorClass();
    const suggestedHitPoints = characterSheetDerived.characterSuggestedHitPoints();

    return `
      <section class="sheet-grid">
        ${renderCombatSummary(initiative)}
        ${renderTurnEconomyPanel()}
        ${renderSessionLog()}

        <div class="sheet-panel sheet-panel--control">
          <h3>Difesa e punti ferita</h3>
          ${renderHitPointQuickControls()}
          ${renderHitDiceControls()}
          ${renderHitPointLog()}
          <div class="sheet-form-grid sheet-form-grid--compact">
            ${sheetNumberField('armorClass', 'Classe Armatura', sheet.armorClass, 0)}
            ${sheetNumberField('currentHp', 'PF attuali', sheet.currentHp, 0)}
            ${sheetNumberField('maxHp', 'PF massimi', sheet.maxHp, 0)}
            ${sheetNumberField('tempHp', 'PF temporanei', sheet.tempHp, 0)}
            ${sheetField('hitDice', 'Dadi Vita', sheet.hitDice)}
            ${sheetNumberField('speed', 'Velocita (m)', sheet.speed, 0)}
            ${sheetNumberField('initiativeBonus', 'Bonus iniziativa extra', sheet.initiativeBonus)}
          </div>
          <div class="sheet-derived-actions">
            <div class="sheet-derived"><span>CA suggerita</span><strong>${escapeHtml(String(suggestedArmorClass))}</strong></div>
            <div class="sheet-derived"><span>PF suggeriti</span><strong>${escapeHtml(String(suggestedHitPoints))}</strong></div>
            <button class="button button--ghost" type="button" data-sheet-apply-derived-ac>Applica CA</button>
            <button class="button button--ghost" type="button" data-sheet-apply-derived-hp>Applica PF</button>
          </div>
        </div>

        <div class="sheet-panel sheet-panel--control">
          <h3>Tiri rapidi</h3>
          <div class="quick-dice sheet-rolls">
            <button type="button" data-dice-roll="${escapeAttr(rollWithEffects(20, initiative, 'initiative'))}">Iniziativa ${escapeHtml(formatSigned(initiative))}</button>
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
          <h3>Azioni rapide</h3>
          ${renderQuickActions()}
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
            <button type="button" data-dice-roll="${escapeAttr(rollWithEffects(20, initiative, 'initiative'))}">Iniziativa ${escapeHtml(formatSigned(initiative))}</button>
          </div>
        </div>
        <div class="sheet-vitals">
          ${renderHpVital()}
          ${renderAcVital()}
        </div>
        <div class="sheet-stat-strip">
          ${renderCombatStat('Temp', Number(sheet.tempHp) || 0, 'Punti ferita')}
          ${renderCombatStat('Vel', characterSheetDerived.characterEffectiveSpeed(), effectStatHint('metri', 'speed'))}
          ${renderCombatStat('DV', hitDiceAvailableSummary(), sheet.hitDice || 'Dadi vita')}
          ${renderCombatStat('Turno', turnReadinessSummary(), `Round ${combatRound()}`)}
          ${renderCombatStat('Iniz.', formatSigned(initiative), 'Totale')}
        </div>
      </div>
    `;
  }

  function renderTurnEconomyPanel() {
    const state = combatState();
    const speed = characterSheetDerived.characterEffectiveSpeed();
    const usedMovement = movementUsed();
    const remainingMovement = Math.max(0, speed - usedMovement);

    return `
      <div class="sheet-panel sheet-panel--wide sheet-turn-panel">
        <div class="sheet-turn-header">
          <div>
            <span>Round</span>
            <strong>${escapeHtml(String(state.round))}</strong>
          </div>
          <div class="sheet-turn-header-actions">
            <button type="button" data-sheet-combat-round-delta="-1">-</button>
            <button type="button" data-sheet-combat-new-turn>Nuovo turno</button>
            <button type="button" data-sheet-combat-round-delta="1">+</button>
          </div>
        </div>

        <div class="sheet-turn-console" aria-label="Economia del turno">
          <div class="sheet-turn-slots">
            ${renderTurnSlot('actionUsed', 'Azione', state.actionUsed)}
            ${renderTurnSlot('bonusActionUsed', 'Bonus', state.bonusActionUsed)}
            ${renderTurnSlot('reactionUsed', 'Reazione', state.reactionUsed)}
          </div>

          <div class="sheet-movement-console">
            <div class="sheet-movement-meter">
              <span>Movimento</span>
              <strong>${escapeHtml(`${formatMeters(usedMovement)}/${formatMeters(speed)} m`)}</strong>
              <small>${escapeHtml(`${formatMeters(remainingMovement)} m restanti`)}</small>
            </div>
            <div class="sheet-movement-actions">
              <button type="button" data-sheet-combat-movement-delta="1.5">+1,5 m</button>
              <button type="button" data-sheet-combat-movement-delta="3">+3 m</button>
              <button type="button" data-sheet-combat-reset-movement>Reset</button>
            </div>
          </div>

          ${renderConcentrationConsole()}
        </div>
      </div>
    `;
  }

  function renderConcentrationConsole() {
    const sheet = appState.characterSheet;
    const status = sheet.status;
    const active = Boolean(status.concentration);
    const spellName = String(status.concentrationSpell || '').trim();
    const dc = concentrationDc();
    const saveModifier = concentrationSaveModifier();

    return `
      <div class="sheet-concentration-console ${active ? 'is-active' : ''}">
        <div class="sheet-concentration-state">
          <span>Concentrazione</span>
          <strong>${escapeHtml(active ? (spellName || 'Attiva') : 'Non attiva')}</strong>
          <small>${escapeHtml(active ? `CD ${dc}` : 'Nessun effetto')}</small>
        </div>
        <label>
          <span>Effetto</span>
          <input type="text" value="${escapeAttr(spellName)}" data-sheet-concentration-field="concentrationSpell" placeholder="Benedizione">
        </label>
        <label>
          <span>CD</span>
          <input type="number" min="10" value="${escapeAttr(String(dc))}" data-sheet-concentration-number="concentrationDc">
        </label>
        <div class="sheet-concentration-actions">
          <button type="button" data-dice-roll="${escapeAttr(rollWithEffects(20, saveModifier, 'savingThrows'))}">${escapeHtml(`TS COS ${formatSigned(saveModifier)}`)}</button>
          ${active
            ? '<button type="button" data-sheet-concentration-clear-dc>CD ok</button><button type="button" data-sheet-concentration-drop>Persa</button>'
            : '<button type="button" data-sheet-concentration-start>Avvia</button>'}
        </div>
      </div>
    `;
  }


  function renderHitDiceControls() {
    const sheet = appState.characterSheet;
    const max = hitDiceMaximum();
    const used = hitDiceUsed();
    const available = Math.max(0, max - used);
    const faces = hitDieFaces();
    const con = abilityModifier(sheet.abilities.con);
    const averageHeal = hitDieAverageHealing();
    const currentHp = Math.max(0, Number(sheet.currentHp) || 0);
    const maxHp = Math.max(0, Number(sheet.maxHp) || 0);
    const spendDisabled = available <= 0 || (maxHp > 0 && currentHp >= maxHp);

    return `
      <div class="sheet-hit-dice-console" aria-label="Dadi vita">
        <div class="sheet-hit-dice-meter">
          <span>Dadi vita</span>
          <strong>${escapeHtml(`${available}/${max}`)}</strong>
          <small>${escapeHtml(`${used} spesi`)}</small>
        </div>
        <div class="sheet-hit-dice-actions">
          <button
            type="button"
            data-sheet-spend-hit-die
            ${spendDisabled ? 'disabled' : ''}
          >${escapeHtml(`Spendi DV medio +${averageHeal}`)}</button>
          <button type="button" data-dice-roll="${escapeAttr(rollFormula(faces, con))}">
            ${escapeHtml(`Tira d${faces} ${formatSigned(con)}`)}
          </button>
          <button
            type="button"
            data-sheet-hit-die-delta="-1"
            ${used <= 0 ? 'disabled' : ''}
          >Recupera DV</button>
        </div>
      </div>
    `;
  }

  function renderSessionLog() {
    const entries = Array.isArray(appState.characterSheet.sessionLog)
      ? appState.characterSheet.sessionLog.slice(0, 8)
      : [];

    return `
      <div class="sheet-panel sheet-panel--wide sheet-session-log-panel">
        <div class="sheet-session-log-heading">
          <div>
            <h3>Registro sessione</h3>
            <p>${escapeHtml(entries.length ? `${appState.characterSheet.sessionLog.length} eventi tracciati` : 'Eventi chiave di combattimento, risorse e inventario.')}</p>
          </div>
        </div>
        ${entries.length ? `
          <div class="sheet-session-log-list">
            ${entries.map((entry) => renderSessionLogEntry(entry)).join('')}
          </div>
        ` : '<p class="sheet-empty">Nessun evento di sessione registrato.</p>'}
      </div>
    `;
  }

  function renderSessionLogEntry(entry) {
    return `
      <article class="sheet-session-log-entry is-${escapeAttr(entry.type || 'manual')}">
        <span>${escapeHtml(sessionLogTypeLabel(entry.type))}</span>
        <div>
          <strong>${escapeHtml(entry.label || 'Evento')}</strong>
          ${entry.detail ? `<p>${escapeHtml(entry.detail)}</p>` : ''}
        </div>
        ${entry.at ? `<time>${escapeHtml(formatHitPointLogTime(entry.at))}</time>` : ''}
      </article>
    `;
  }

  function sessionLogTypeLabel(type) {
    return {
      attack: 'Attacco',
      equipment: 'Inventario',
      hp: 'PF',
      level: 'Livello',
      resource: 'Risorsa',
      rest: 'Riposo',
      spell: 'Magia',
      status: 'Stato',
      turn: 'Turno',
      undo: 'Undo',
    }[type] || 'Evento';
  }

  function renderHitPointLog() {
    const entries = Array.isArray(appState.characterSheet.hitPointLog)
      ? appState.characterSheet.hitPointLog.slice(0, 5)
      : [];

    if (!entries.length) {
      return '<p class="sheet-empty sheet-hp-log-empty">Nessuna modifica PF registrata.</p>';
    }

    return `
      <div class="sheet-hp-log" aria-label="Cronologia punti ferita">
        <div class="sheet-hp-log-heading">
          <span>Cronologia PF</span>
          <strong>${escapeHtml(String(appState.characterSheet.hitPointLog.length))}</strong>
        </div>
        <div class="sheet-hp-log-list">
          ${entries.map((entry, index) => renderHitPointLogEntry(entry, index === 0)).join('')}
        </div>
      </div>
    `;
  }

  function renderHitPointLogEntry(entry, latest) {
    const summary = hitPointActionSummary(entry.action, Number(entry.amount) || 0);
    const before = entry.before || {};
    const after = entry.after || {};
    const change = [
      `PF ${Number(before.currentHp) || 0} -> ${Number(after.currentHp) || 0}`,
      `Temp ${Number(before.tempHp) || 0} -> ${Number(after.tempHp) || 0}`,
    ].join(' · ');

    return `
      <article class="sheet-hp-log-entry">
        <div>
          <strong>${escapeHtml(summary)}</strong>
          <span>${escapeHtml(change)}</span>
          ${entry.note ? `<small>${escapeHtml(entry.note)}</small>` : ''}
          ${entry.at ? `<small>${escapeHtml(formatHitPointLogTime(entry.at))}</small>` : ''}
        </div>
        ${latest ? `<button class="button button--ghost" type="button" data-sheet-undo-hp="${escapeAttr(entry.id)}">Annulla</button>` : ''}
      </article>
    `;
  }

  function hitPointActionSummary(action, amount) {
    const label = hitPointActionLabel(action);
    if (action === 'longRest') return label;
    if (action === 'manual' && !amount) return label;
    return `${label} ${amount}`;
  }

  function hitPointActionLabel(action) {
    return {
      damage: 'Danno',
      heal: 'Cura',
      temp: 'Temp',
      hitDie: 'Dado vita',
      longRest: 'Riposo lungo',
      undo: 'Undo',
      manual: 'Manuale',
    }[action] || 'PF';
  }

  function formatHitPointLogTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  function effectStatHint(baseLabel, target) {
    const modifier = characterSheetDerived.characterActiveEffectModifier(target);
    return modifier ? `${baseLabel} · effetti ${formatSigned(modifier)}` : baseLabel;
  }

  function damageWithEffects(damage) {
    if (!damage) return damage;
    const modifier = characterSheetDerived.characterActiveEffectModifier('damage');
    const dice = characterSheetDerived.characterActiveEffectDice('damage');
    return `${damage}${modifier ? ` ${formatSigned(modifier)}` : ''}${dice ? ` + ${dice}` : ''}`;
  }

  /*
   * Formula di tiro che fonde i dadi da effetto sul bersaglio (es. Benedizione).
   */
  function rollWithEffects(faces, modifier, target) {
    const base = rollFormula(faces, modifier);
    const dice = characterSheetDerived.characterActiveEffectDice(target);
    return dice ? `${base} + ${dice}` : base;
  }

  function concentrationDc() {
    return Math.max(10, Number(appState.characterSheet.status?.concentrationDc) || 10);
  }

  function concentrationSaveModifier() {
    return abilityModifier(appState.characterSheet.abilities.con) +
      (appState.characterSheet.savingThrows.con ? characterProficiencyBonus() : 0) +
      characterSheetDerived.characterActiveEffectModifier('savingThrows');
  }

  function hitDiceMaximum() {
    return Math.min(20, Math.max(1, Number(appState.characterSheet.level) || 1));
  }

  function hitDiceUsed() {
    return Math.min(hitDiceMaximum(), Math.max(0, Number(appState.characterSheet.hitDiceUsed) || 0));
  }

  function hitDieFaces() {
    return Number(String(appState.characterSheet.hitDice || '').match(/d(\d+)/i)?.[1]) || 8;
  }

  function hitDieAverageHealing() {
    return Math.max(1, Math.floor(hitDieFaces() / 2) + 1 + abilityModifier(appState.characterSheet.abilities.con));
  }

  function renderSavingThrowControl(key, label) {
    const sheet = appState.characterSheet;
    const modifier = abilityModifier(sheet.abilities[key]) +
      (sheet.savingThrows[key] ? characterProficiencyBonus() : 0) +
      characterSheetDerived.characterActiveEffectModifier('savingThrows');

    const proficient = Boolean(sheet.savingThrows[key]);

    return `
      <div class="save-control">
        <span>${escapeHtml(label)}</span>
        <button
          type="button"
          class="save-pill${proficient ? ' is-active' : ''}"
          data-sheet-save-toggle="${escapeAttr(key)}"
          aria-pressed="${proficient}"
          title="Competenza nel tiro salvezza"
        >C</button>
        <button type="button" data-dice-roll="${escapeAttr(rollWithEffects(20, modifier, 'savingThrows'))}">${escapeHtml(formatSigned(modifier))}</button>
      </div>
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
          <button type="button" data-dice-roll="${escapeAttr(rollWithEffects(20, attackBonus, 'attack'))}">Colpire ${escapeHtml(formatSigned(attackBonus))}</button>
          ${damage ? `<button type="button" data-dice-roll="${escapeAttr(damageWithEffects(damage))}">Danni ${escapeHtml(damageWithEffects(damage))}</button>` : ''}
          <button class="button button--ghost" type="button" data-sheet-remove-attack="${escapeAttr(attack.id)}">Rimuovi</button>
        </div>
      </article>
    `;
  }

  function renderQuickActions() {
    const actions = [
      ...appState.characterSheet.attacks.map((attack) => quickAttackAction(attack)),
      ...appState.characterSheet.resources
        .filter((resource) => Math.max(0, Number(resource.max) || 0) > 0)
        .map(quickResourceAction),
      ...preparedSpellActions(),
    ].filter(Boolean);

    if (!actions.length) {
      return '<p class="sheet-empty">Aggiungi attacchi, risorse o incantesimi preparati per avere pulsanti operativi qui.</p>';
    }

    return `
      <div class="sheet-action-card-grid">
        ${actions.map((action) => `
          <article class="sheet-action-card">
            <div>
              <span>${escapeHtml(action.type)}</span>
              <strong>${escapeHtml(action.name)}</strong>
              <p>${escapeHtml(action.detail || '')}</p>
            </div>
            <div class="sheet-action-card-buttons">
              ${action.roll ? `<button type="button" data-dice-roll="${escapeAttr(action.roll)}">${escapeHtml(action.rollLabel)}</button>` : ''}
              ${action.damage ? `<button type="button" data-dice-roll="${escapeAttr(action.damage)}">Danni</button>` : ''}
              ${action.resourceId ? `<button type="button" data-sheet-resource-delta="1" data-sheet-resource-id="${escapeAttr(action.resourceId)}">Usa</button>` : ''}
              ${action.spellId ? `<button type="button" data-sheet-cast-spell="${escapeAttr(action.spellId)}">Lancia</button>` : ''}
              ${action.href ? `<a class="button button--ghost" href="${escapeAttr(action.href)}">Apri</a>` : ''}
            </div>
          </article>
        `).join('')}
      </div>
    `;
  }

  function quickAttackAction(attack) {
    const attackBonus = characterAttackBonus(attack);
    return {
      type: 'Azione',
      name: attack.name || 'Attacco',
      detail: [attack.damage ? `Danni ${attack.damage}` : null, attack.damageType].filter(Boolean).join(' · '),
      roll: rollWithEffects(20, attackBonus, 'attack'),
      rollLabel: `Colpire ${formatSigned(attackBonus)}`,
      damage: damageWithEffects(String(attack.damage || '').trim()),
    };
  }

  function quickResourceAction(resource) {
    const max = Math.max(0, Number(resource.max) || 0);
    const used = Math.min(max, Math.max(0, Number(resource.used) || 0));
    return {
      type: 'Risorsa',
      name: resource.name || 'Risorsa',
      detail: [`${Math.max(0, max - used)}/${max} disponibili`, resource.recovery].filter(Boolean).join(' · '),
      resourceId: resource.id,
    };
  }

  function preparedSpellActions() {
    const slotLabels = new Set(characterSpellSlots().map(([label]) => label.replace(/^Slot\s+/i, '')));

    return appState.characterSheet.preparedSpells
      .map((id) => appState.data.spells.find((spell) => spell.id === id))
      .filter(Boolean)
      .slice(0, 8)
      .map((spell) => ({
        type: spell.livello === 0 ? 'Trucchetto' : 'Incantesimo',
        name: spell.nome || spell.id,
        detail: [spellLevel(spell), spell.scuola, slotLabels.has(String(spell.livello)) ? 'slot disponibile' : null].filter(Boolean).join(' · '),
        spellId: spell.id,
        href: `#/spells/${encodeURIComponent(spell.id)}`,
      }));
  }

  return { renderCharacterSheetCombat };
}
