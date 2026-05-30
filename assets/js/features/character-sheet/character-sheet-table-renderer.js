export function createCharacterSheetTableRenderer({
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
  function renderCharacterSheetTable() {
    return `
      <section class="sheet-table-layout">
        <div class="sheet-table-command">
          ${renderTableDashboard()}
          ${renderTableTurnPanel()}
        </div>

        <div class="sheet-table-columns">
          <div class="sheet-table-column sheet-table-column--main">
            ${renderTablePanel('Azioni del turno', renderTurnActionPalette(), 'actions')}
            ${renderTablePanel('Opzioni pronte', renderReadyOptions(), 'ready')}
            ${renderTablePanel('Effetti attivi', renderActiveEffects(), 'effects')}
          </div>

          <aside class="sheet-table-column sheet-table-column--side" aria-label="Supporto al tavolo">
            ${renderTablePanel('Stato critico', renderStatusFocus(), 'status')}
            ${renderTablePanel('Tratti rapidi', renderTacticalTraits(), 'traits')}
            ${renderTablePanel('Registro recente', renderCompactSessionLog(), 'log')}
          </aside>
        </div>
      </section>
    `;
  }

  function renderTablePanel(title, body, kind) {
    return `
      <section class="sheet-table-panel sheet-table-panel--${escapeAttr(kind)}">
        <h3>${escapeHtml(title)}</h3>
        ${body}
      </section>
    `;
  }

  function renderTableDashboard() {
    const sheet = appState.characterSheet;
    const initiative = characterSheetDerived.characterInitiative();
    const armorClass = characterSheetDerived.characterEffectiveArmorClass();
    const speed = characterSheetDerived.characterEffectiveSpeed();
    const statusLine = tableStatusLine();

    return `
      <div class="sheet-dashboard sheet-dashboard--table">
        <div class="sheet-dashboard-heading">
          <div>
            <span>Tavolo</span>
            <strong>${escapeHtml(sheet.name || 'Personaggio')}</strong>
            <p>${escapeHtml(statusLine || 'Pronto per la scena corrente.')}</p>
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
          ${renderTableStat('Temp', Number(sheet.tempHp) || 0, 'PF temp')}
          ${renderTableStat('Vel', `${formatMeters(speed)} m`, statEffectHint('Movimento', 'speed'))}
          ${renderTableStat('DV', hitDiceAvailableSummary(), sheet.hitDice || 'Dadi vita')}
          ${renderTableStat('Turno', turnReadinessSummary(), `Round ${combatRound()}`)}
          ${renderTableStat('BC', formatSigned(characterProficiencyBonus()), 'Competenza')}
        </div>
        <div class="sheet-table-primary">
          ${renderHitPointQuickControls()}
          ${renderConcentrationCard()}
        </div>
      </div>
    `;
  }

  function renderTableTurnPanel() {
    const state = combatState();
    const speed = Math.max(0, Number(appState.characterSheet.speed) || 0);
    const usedMovement = movementUsed();
    const remainingMovement = Math.max(0, speed - usedMovement);

    return `
      <div class="sheet-turn-panel sheet-table-turn">
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
        </div>
      </div>
    `;
  }

  function renderTurnActionPalette() {
    const actions = tableActions();

    return `
      <div class="sheet-table-action-grid">
        ${actions.map((action) => renderTableAction(action)).join('')}
      </div>
    `;
  }

  function renderTableAction(action) {
    const used = Boolean(combatState()[action.slot]);
    const hasRoll = Number.isFinite(Number(action.roll));
    const roll = hasRoll ? rollWithEffects(20, action.roll, 'skillChecks') : '';

    return `
      <article class="sheet-table-action is-${escapeAttr(action.slot)}${used ? ' is-used' : ''}">
        <div>
          <span>${escapeHtml(action.kind)}</span>
          <strong>${escapeHtml(action.name)}</strong>
          <p>${escapeHtml(action.summary)}</p>
        </div>
        <div class="sheet-table-action-buttons">
          ${roll ? `<button type="button" data-dice-roll="${escapeAttr(roll)}">${escapeHtml(action.rollLabel || 'Tira')}</button>` : ''}
          <button
            type="button"
            data-sheet-table-use-action="${escapeAttr(action.name)}"
            data-sheet-table-slot="${escapeAttr(action.slot)}"
            ${used ? 'disabled' : ''}
          >${escapeHtml(used ? 'Usata' : 'Segna')}</button>
        </div>
      </article>
    `;
  }

  function renderReadyOptions() {
    const cards = [
      ...appState.characterSheet.attacks.map(readyAttackCard),
      ...preparedSpellCards(),
      ...appState.characterSheet.resources
        .filter((resource) => Math.max(0, Number(resource.max) || 0) > 0)
        .map(readyResourceCard),
    ].filter(Boolean);

    if (!cards.length) {
      return '<p class="sheet-empty">Aggiungi attacchi, risorse o incantesimi preparati per popolare la plancia.</p>';
    }

    return `
      <div class="sheet-table-ready-grid">
        ${cards.map((card) => renderReadyCard(card)).join('')}
      </div>
    `;
  }

  function renderReadyCard(card) {
    return `
      <article class="sheet-action-card sheet-table-ready-card">
        <div>
          <span>${escapeHtml(card.type)}</span>
          <strong>${escapeHtml(card.name)}</strong>
          <p>${escapeHtml(card.detail || '')}</p>
        </div>
        <div class="sheet-action-card-buttons">
          ${card.attackRoll ? `
            <button
              type="button"
              data-dice-roll="${escapeAttr(card.attackRoll)}"
              data-sheet-table-use-action="${escapeAttr(card.name)}"
              data-sheet-table-slot="actionUsed"
            >${escapeHtml(card.attackLabel)}</button>
          ` : ''}
          ${card.damage ? `<button type="button" data-dice-roll="${escapeAttr(card.damage)}">Danni</button>` : ''}
          ${card.resourceId ? `
            <button
              type="button"
              data-sheet-resource-delta="1"
              data-sheet-resource-id="${escapeAttr(card.resourceId)}"
              ${card.resourceEmpty ? 'disabled' : ''}
            >${escapeHtml(card.resourceEmpty ? 'Esaurita' : 'Usa')}</button>
          ` : ''}
          ${card.spellId ? `
            <button
              type="button"
              data-sheet-table-cast-spell="${escapeAttr(card.spellId)}"
              data-sheet-table-slot="${escapeAttr(card.slot || 'actionUsed')}"
              ${card.unavailable ? 'disabled' : ''}
            >${escapeHtml(card.unavailable ? 'Slot finiti' : 'Lancia')}</button>
          ` : ''}
          ${card.href ? `<a class="button button--ghost" href="${escapeAttr(card.href)}">Apri</a>` : ''}
        </div>
      </article>
    `;
  }

  function renderActiveEffects() {
    const effects = activeEffects();

    return `
      <form class="sheet-effect-form" data-sheet-add-effect>
        <label class="sheet-field">
          <span>Nome</span>
          <input type="text" name="name" placeholder="Benedizione">
        </label>
        <label class="sheet-field">
          <span>Durata</span>
          <select name="duration">
            ${effectDurationOptions().map(([value, label]) => `<option value="${escapeAttr(value)}">${escapeHtml(label)}</option>`).join('')}
          </select>
        </label>
        <label class="sheet-field">
          <span>Restano</span>
          <input type="number" name="remaining" min="0" max="999" value="1" inputmode="numeric">
        </label>
        <label class="sheet-field">
          <span>Bonus</span>
          <select name="modifierTarget">
            ${effectTargetOptions().map(([value, label]) => `<option value="${escapeAttr(value)}">${escapeHtml(label)}</option>`).join('')}
          </select>
        </label>
        <label class="sheet-field">
          <span>Valore</span>
          <input type="number" name="modifierValue" min="-99" max="99" value="0" inputmode="numeric">
        </label>
        <label class="sheet-field">
          <span>Dado</span>
          <input type="text" name="modifierDice" placeholder="1d4" pattern="[0-9dkhlKHL+\- ]*">
        </label>
        <label class="sheet-field sheet-effect-notes-field">
          <span>Note</span>
          <input type="text" name="notes" placeholder="1d4 ai TS, termina se perdi concentrazione">
        </label>
        <button class="button button--primary" type="submit">Aggiungi</button>
      </form>

      ${effects.length ? `
        <div class="sheet-effect-grid">
          ${effects.map((effect) => renderActiveEffect(effect)).join('')}
        </div>
      ` : '<p class="sheet-empty">Nessun effetto attivo. Aggiungi buff, debuff, incantesimi o scadenze tattiche.</p>'}
    `;
  }

  function renderActiveEffect(effect) {
    const durationText = effectDurationText(effect);
    const modifierText = effectModifierText(effect);
    const expiring = effectIsExpiring(effect);

    return `
      <article class="sheet-effect-card ${expiring ? 'is-expiring' : ''}">
        <div class="sheet-effect-main">
          <span>${escapeHtml(effect.source || 'Effetto')}</span>
          <strong>${escapeHtml(effect.name)}</strong>
          <p>${escapeHtml([durationText, modifierText, effect.notes].filter(Boolean).join(' · '))}</p>
          <div class="sheet-table-trait-tags">
            ${[durationText, modifierText].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
        <div class="sheet-action-card-buttons">
          ${effectCanTick(effect) ? `<button type="button" data-sheet-effect-tick="${escapeAttr(effect.id)}">${escapeHtml(effect.remaining <= 1 ? 'Scade' : 'Avanza')}</button>` : ''}
          <button class="button button--ghost" type="button" data-sheet-remove-effect="${escapeAttr(effect.id)}">Rimuovi</button>
        </div>
      </article>
    `;
  }

  function renderTacticalTraits() {
    const cues = tacticalTraitCues().slice(0, 12);

    if (!cues.length) {
      return '<p class="sheet-empty">Collega classe, specie, talenti o oggetti magici per avere promemoria rapidi al tavolo.</p>';
    }

    return `
      <div class="sheet-table-trait-grid">
        ${cues.map((cue) => renderTacticalTrait(cue)).join('')}
      </div>
    `;
  }

  function renderTacticalTrait(cue) {
    const resource = cue.resource || null;
    const resourceMax = Math.max(0, Number(resource?.max) || 0);
    const resourceUsed = Math.min(resourceMax, Math.max(0, Number(resource?.used) || 0));
    const resourceRemaining = Math.max(0, resourceMax - resourceUsed);
    const actionUsed = cue.slot ? Boolean(combatState()[cue.slot]) : false;

    return `
      <article class="sheet-table-trait-card ${cue.priority <= 1 ? 'is-priority' : ''}">
        <div class="sheet-table-trait-main">
          <span>${escapeHtml(cue.source)}</span>
          <strong>${escapeHtml(cue.name)}</strong>
          <p>${escapeHtml(cue.detail || 'Promemoria collegato alla scheda.')}</p>
          <div class="sheet-table-trait-tags">
            ${traitTags(cue).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
        <div class="sheet-action-card-buttons">
          ${resource ? `
            <button
              type="button"
              data-sheet-resource-delta="1"
              data-sheet-resource-id="${escapeAttr(resource.id)}"
              ${resourceRemaining <= 0 ? 'disabled' : ''}
            >${escapeHtml(resourceRemaining <= 0 ? 'Esaurita' : 'Usa')}</button>
          ` : ''}
          ${cue.slot ? `
            <button
              class="button button--ghost"
              type="button"
              data-sheet-table-use-action="${escapeAttr(cue.name)}"
              data-sheet-table-slot="${escapeAttr(cue.slot)}"
              ${actionUsed ? 'disabled' : ''}
            >${escapeHtml(actionUsed ? 'Slot usato' : 'Segna turno')}</button>
          ` : ''}
          ${cue.href ? `<a class="button button--ghost" href="${escapeAttr(cue.href)}">Apri</a>` : ''}
        </div>
      </article>
    `;
  }

  function renderStatusFocus() {
    const sheet = appState.characterSheet;
    const status = sheet.status || {};
    const conditions = activeConditionEntries();

    return `
      <div class="sheet-table-status-grid">
        <article class="sheet-table-status-card ${status.inspiration ? 'is-active' : ''}">
          <span>Ispirazione</span>
          <strong>${escapeHtml(status.inspiration ? 'Disponibile' : 'No')}</strong>
          <button type="button" data-sheet-status-check-button="inspiration">${escapeHtml(status.inspiration ? 'Consuma' : 'Segna')}</button>
        </article>
        <article class="sheet-table-status-card ${status.exhaustion ? 'is-warning' : ''}">
          <span>Indebolimento</span>
          <strong>${escapeHtml(String(Number(status.exhaustion) || 0))}</strong>
          <small>Livello 0-6</small>
        </article>
        <article class="sheet-table-status-card ${deathSaveWarning() ? 'is-danger' : ''}">
          <span>TS morte</span>
          <strong>${escapeHtml(`${Number(status.deathSaveSuccesses) || 0} / ${Number(status.deathSaveFailures) || 0}`)}</strong>
          <small>Successi / fallimenti</small>
        </article>
        <article class="sheet-table-status-card ${conditions.length ? 'is-warning' : ''}">
          <span>Condizioni</span>
          <strong>${escapeHtml(conditions.length ? String(conditions.length) : 'Nessuna')}</strong>
          <small>${escapeHtml(conditions.map((condition) => condition.nome || condition.id).join(', ') || 'Stato pulito')}</small>
        </article>
      </div>
      ${conditions.length ? `
        <div class="sheet-condition-list sheet-table-condition-list">
          ${conditions.map((condition) => `
            <article class="sheet-condition">
              <a href="#/rules_glossary/${encodeURIComponent(condition.id)}">${escapeHtml(condition.nome || condition.id)}</a>
              <button class="button button--ghost" type="button" data-sheet-remove-condition="${escapeAttr(condition.id)}">Rimuovi</button>
            </article>
          `).join('')}
        </div>
      ` : ''}
    `;
  }

  function renderCompactSessionLog() {
    const entries = Array.isArray(appState.characterSheet.sessionLog)
      ? appState.characterSheet.sessionLog.slice(0, 6)
      : [];

    if (!entries.length) {
      return '<p class="sheet-empty">Nessun evento registrato in questa scheda.</p>';
    }

    return `
      <div class="sheet-session-log-list sheet-table-log-list">
        ${entries.map((entry) => `
          <article class="sheet-session-log-entry is-${escapeAttr(entry.type || 'manual')}">
            <span>${escapeHtml(sessionLogTypeLabel(entry.type))}</span>
            <div>
              <strong>${escapeHtml(entry.label || 'Evento')}</strong>
              ${entry.detail ? `<p>${escapeHtml(entry.detail)}</p>` : ''}
            </div>
            ${entry.at ? `<time>${escapeHtml(formatLogTime(entry.at))}</time>` : ''}
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderConcentrationCard() {
    const sheet = appState.characterSheet;
    const status = sheet.status || {};
    const active = Boolean(status.concentration);
    const spellName = String(status.concentrationSpell || '').trim();
    const dc = Math.max(10, Number(status.concentrationDc) || 10);
    const saveModifier = abilityModifier(sheet.abilities.con) +
      (sheet.savingThrows.con ? characterProficiencyBonus() : 0) +
      effectModifier('savingThrows');

    return `
      <div class="sheet-concentration-console ${active ? 'is-active' : ''}">
        <div class="sheet-concentration-state">
          <span>Concentrazione</span>
          <strong>${escapeHtml(active ? (spellName || 'Attiva') : 'Non attiva')}</strong>
          <small>${escapeHtml(active ? `CD ${dc}` : 'Nessun effetto')}</small>
        </div>
        <div class="sheet-concentration-actions">
          <button type="button" data-dice-roll="${escapeAttr(rollWithEffects(20, saveModifier, 'savingThrows'))}">${escapeHtml(`TS COS ${formatSigned(saveModifier)}`)}</button>
          ${active
            ? '<button type="button" data-sheet-concentration-clear-dc>CD ok</button><button type="button" data-sheet-concentration-drop>Persa</button>'
            : '<button type="button" data-sheet-concentration-start>Avvia</button>'}
        </div>
        <details class="sheet-concentration-edit">
          <summary>Modifica</summary>
          <label>
            <span>Effetto</span>
            <input type="text" value="${escapeAttr(spellName)}" data-sheet-concentration-field="concentrationSpell" placeholder="Benedizione">
          </label>
          <label>
            <span>CD</span>
            <input type="number" min="10" value="${escapeAttr(String(dc))}" data-sheet-concentration-number="concentrationDc">
          </label>
        </details>
      </div>
    `;
  }

  function readyAttackCard(attack) {
    const attackBonus = characterAttackBonus(attack);
    const damage = String(attack.damage || '').trim();
    const damageBonus = effectModifier('damage');
    const damageDice = characterSheetDerived.characterActiveEffectDice('damage');
    const fullDamage = damage
      ? `${damage}${damageBonus ? ` ${formatSigned(damageBonus)}` : ''}${damageDice ? ` + ${damageDice}` : ''}`
      : damage;

    return {
      type: 'Attacco',
      name: attack.name || 'Attacco',
      detail: [
        `Colpire ${formatSigned(attackBonus)}`,
        damage ? `danni ${fullDamage}` : '',
        attack.damageType,
        attack.notes,
      ].filter(Boolean).join(' · '),
      attackRoll: rollWithEffects(20, attackBonus, 'attack'),
      attackLabel: `Colpire ${formatSigned(attackBonus)}`,
      damage: fullDamage,
    };
  }

  /*
   * Formula di tiro che fonde i dadi da effetto sul bersaglio (es. Benedizione).
   */
  function rollWithEffects(faces, modifier, target) {
    const base = rollFormula(faces, modifier);
    const dice = characterSheetDerived.characterActiveEffectDice(target);
    return dice ? `${base} + ${dice}` : base;
  }

  function readyResourceCard(resource) {
    const max = Math.max(0, Number(resource.max) || 0);
    const used = Math.min(max, Math.max(0, Number(resource.used) || 0));
    const remaining = Math.max(0, max - used);

    return {
      type: 'Risorsa',
      name: resource.name || 'Risorsa',
      detail: [`${remaining}/${max} disponibili`, resource.recovery].filter(Boolean).join(' · '),
      resourceId: resource.id,
      resourceEmpty: remaining <= 0,
    };
  }

  function preparedSpellCards() {
    return appState.characterSheet.preparedSpells
      .map((id) => appState.data.spells.find((spell) => spell.id === id))
      .filter(Boolean)
      .slice(0, 10)
      .map((spell) => {
        const slot = spellSlotForSpell(spell);
        const level = Number(spell.livello) || 0;
        const actionSlot = spellActionSlot(spell);
        return {
          type: level === 0 ? 'Trucchetto' : 'Incantesimo',
          name: spell.nome || spell.id,
          detail: [
            spellLevel(spell),
            spell.tempo_lancio,
            spell.gittata ? `gittata ${spell.gittata}` : '',
            spellRequiresConcentration(spell) ? 'concentrazione' : '',
            level > 0 && slot ? slot.replace(/^Slot\s+/i, 'slot ') : '',
          ].filter(Boolean).join(' · '),
          spellId: spell.id,
          slot: actionSlot,
          unavailable: level > 0 && !slot,
          href: `#/spells/${encodeURIComponent(spell.id)}`,
        };
      });
  }

  function activeEffects() {
    return Array.isArray(appState.characterSheet.activeEffects)
      ? appState.characterSheet.activeEffects
        .filter((effect) => effect?.name)
        .slice()
        .sort((a, b) => effectSortScore(a) - effectSortScore(b) || String(a.name).localeCompare(String(b.name), 'it'))
      : [];
  }

  function effectSortScore(effect) {
    if (effect.duration === 'concentration') return 0;
    if (effectCanTick(effect)) return Math.max(0, Number(effect.remaining) || 0);
    if (effect.modifierTarget) return 20;
    return 40;
  }

  function effectModifier(target) {
    return activeEffects()
      .filter((effect) => effect.modifierTarget === target)
      .reduce((total, effect) => total + (Number(effect.modifierValue) || 0), 0);
  }

  function statEffectHint(label, target) {
    const modifier = effectModifier(target);
    return modifier ? `${label} · effetti ${formatSigned(modifier)}` : label;
  }

  function effectDurationOptions() {
    return [
      ['turns', 'Turni'],
      ['rounds', 'Round'],
      ['shortRest', 'Fino a riposo breve'],
      ['longRest', 'Fino a riposo lungo'],
      ['concentration', 'Concentrazione'],
      ['scene', 'Scena'],
      ['manual', 'Manuale'],
    ];
  }

  function effectTargetOptions() {
    return [
      ['', 'Nessuno'],
      ['armorClass', 'CA'],
      ['speed', 'Velocita'],
      ['initiative', 'Iniziativa'],
      ['attack', 'Tiri per colpire'],
      ['damage', 'Danni'],
      ['savingThrows', 'Tiri salvezza'],
      ['spellDc', 'CD incantesimi'],
      ['skillChecks', 'Prove abilita'],
    ];
  }

  function effectDurationText(effect) {
    if (effect.duration === 'turns') return `${Number(effect.remaining) || 0} turni`;
    if (effect.duration === 'rounds') return `${Number(effect.remaining) || 0} round`;
    if (effect.duration === 'scene') return `${Number(effect.remaining) || 0} scene`;
    if (effect.duration === 'shortRest') return 'fino a riposo breve';
    if (effect.duration === 'longRest') return 'fino a riposo lungo';
    if (effect.duration === 'concentration') return 'concentrazione';
    return 'manuale';
  }

  function effectModifierText(effect) {
    if (!effect.modifierTarget) return '';

    const parts = [];
    if (Number(effect.modifierValue)) parts.push(formatSigned(Number(effect.modifierValue) || 0));
    if (effect.modifierDice) parts.push(`+ ${effect.modifierDice}`);
    if (!parts.length) return '';

    return `${effectTargetLabel(effect.modifierTarget)} ${parts.join(' ')}`;
  }

  function effectTargetLabel(target) {
    return Object.fromEntries(effectTargetOptions())[target] || 'Bonus';
  }

  function effectCanTick(effect) {
    return ['turns', 'rounds', 'scene'].includes(effect.duration) && Number(effect.remaining) > 0;
  }

  function effectIsExpiring(effect) {
    return effectCanTick(effect) && Number(effect.remaining) <= 1;
  }

  function tacticalTraitCues() {
    return [
      ...classTraitCues(),
      ...subclassTraitCues(),
      ...speciesTraitCues(),
      ...originFeatCues(),
      ...magicItemTraitCues(),
      ...referenceTraitCues(),
    ]
      .filter(Boolean)
      .map((cue, index) => ({
        ...cue,
        index,
        resource: cue.resource || resourceForTrait(cue.name),
        slot: cue.slot || inferTraitSlot(`${cue.name} ${cue.detail || ''}`),
      }))
      .sort((a, b) => traitPriority(a) - traitPriority(b) || b.level - a.level || a.index - b.index);
  }

  function classTraitCues() {
    const classEntry = characterClassEntry?.();
    const level = Math.min(20, Math.max(1, Number(appState.characterSheet.level) || 1));
    const rows = classProgressionSection?.(classEntry)?.righe || [];

    return rows
      .filter((row) => Number(row.Livello) <= level)
      .flatMap((row) => splitFeatureList(String(row['Privilegi di classe'] || row['Privilegi di Classe'] || ''))
        .map((feature) => ({
          source: `Classe L${Number(row.Livello) || '?'}`,
          name: feature,
          detail: classFeatureDetail(feature, row),
          href: classEntry?.id ? `#/classes/${encodeURIComponent(classEntry.id)}` : '',
          level: Number(row.Livello) || 0,
        })));
  }

  function subclassTraitCues() {
    const classEntry = characterClassEntry?.();
    const level = Math.min(20, Math.max(1, Number(appState.characterSheet.level) || 1));

    return (classSubclassRows?.(classEntry, level) || []).map((row) => ({
      source: `Sottoclasse L${Number(row.Livello) || '?'}`,
      name: row.Privilegio || row.nome || 'Privilegio di sottoclasse',
      detail: row.Riepilogo || row.descrizione || '',
      href: classEntry?.id ? `#/classes/${encodeURIComponent(classEntry.id)}` : '',
      level: Number(row.Livello) || 0,
    }));
  }

  function speciesTraitCues() {
    const species = characterSheetDerived.characterSpeciesEntry();
    if (!species) return [];

    return splitSummaryTraits(species.tratti_sintesi || species.descrizione)
      .slice(0, 4)
      .map((trait) => ({
        source: 'Specie',
        name: titleCaseTrait(trait),
        detail: species.nome || '',
        href: `#/species/${encodeURIComponent(species.id)}`,
        level: 0,
      }));
  }

  function originFeatCues() {
    const feat = characterSheetDerived.characterOriginFeat();
    if (!feat) return [];

    return [{
      source: 'Talento origine',
      name: feat.nome || 'Talento',
      detail: feat.beneficio || feat.descrizione || feat.summary || '',
      href: `#/feats/${encodeURIComponent(feat.id)}`,
      level: 0,
    }];
  }

  function magicItemTraitCues() {
    const magicItemData = Array.isArray(appState.data.magic_items) ? appState.data.magic_items : [];
    const magicItems = Array.isArray(appState.characterSheet.magicItems) ? appState.characterSheet.magicItems : [];

    return magicItems
      .map((item) => {
        const source = magicItemData.find((entry) => entry.id === item.id);
        return {
          source: 'Oggetto magico',
          name: item.name || source?.nome || item.id,
          detail: source?.descrizione || item.summary || [source?.tipo_base || source?.tipo, source?.rarita].filter(Boolean).join(' · '),
          href: item.id ? `#/magic_items/${encodeURIComponent(item.id)}` : '',
          level: 0,
        };
      });
  }

  function referenceTraitCues() {
    const references = Array.isArray(appState.characterSheet.references) ? appState.characterSheet.references : [];
    const magicItems = Array.isArray(appState.characterSheet.magicItems) ? appState.characterSheet.magicItems : [];
    const seen = new Set([
      characterClassEntry?.()?.id ? `classes:${characterClassEntry().id}` : '',
      characterSheetDerived.characterSpeciesEntry()?.id ? `species:${characterSheetDerived.characterSpeciesEntry().id}` : '',
      characterSheetDerived.characterOriginFeat()?.id ? `feats:${characterSheetDerived.characterOriginFeat().id}` : '',
      ...magicItems.map((item) => `magic_items:${item.id}`),
    ]);

    return references
      .filter((reference) => !seen.has(`${reference.section}:${reference.id}`))
      .filter((reference) => ['feats', 'rules_glossary', 'rules', 'magic_items'].includes(reference.section))
      .slice(0, 5)
      .map((reference) => ({
        source: referenceSectionLabel(reference.section),
        name: reference.name || reference.id,
        detail: reference.summary || '',
        href: `#/${reference.section}/${encodeURIComponent(reference.id)}`,
        level: 0,
      }));
  }

  function splitFeatureList(value) {
    if (typeof splitClassFeatures === 'function') return splitClassFeatures(value);

    return String(value || '')
      .split(',')
      .map((feature) => feature.trim())
      .filter(Boolean);
  }

  function tableActions() {
    return [
      {
        name: 'Attack',
        kind: 'Azione',
        summary: 'Attacca con arma o colpo senz\'armi.',
        slot: 'actionUsed',
      },
      {
        name: 'Magic',
        kind: 'Azione',
        summary: 'Lancia un incantesimo, usa oggetto magico o feature magica.',
        slot: 'actionUsed',
      },
      {
        name: 'Dash',
        kind: 'Azione',
        summary: 'Ottieni movimento extra pari alla Velocita.',
        slot: 'actionUsed',
      },
      {
        name: 'Disengage',
        kind: 'Azione',
        summary: 'Il movimento non provoca attacchi di opportunita.',
        slot: 'actionUsed',
      },
      {
        name: 'Dodge',
        kind: 'Azione',
        summary: 'Attacchi contro di te con svantaggio, TS DES con vantaggio.',
        slot: 'actionUsed',
      },
      {
        name: 'Help',
        kind: 'Azione',
        summary: 'Aiuta una prova, un attacco o stabilizza con Medicina CD 10.',
        slot: 'actionUsed',
        roll: skillModifier('medicine'),
        rollLabel: `Medicina ${formatSigned(skillModifier('medicine'))}`,
      },
      {
        name: 'Hide',
        kind: 'Azione',
        summary: 'Prova Destrezza (Furtivita).',
        slot: 'actionUsed',
        roll: skillModifier('stealth'),
        rollLabel: `Furtivita ${formatSigned(skillModifier('stealth'))}`,
      },
      {
        name: 'Influence',
        kind: 'Azione',
        summary: 'Altera atteggiamento con socialita o Addestrare Animali.',
        slot: 'actionUsed',
        roll: bestSkillModifier(['persuasion', 'deception', 'intimidation', 'performance', 'animalHandling']),
        rollLabel: 'Migliore prova',
      },
      {
        name: 'Ready',
        kind: 'Azione',
        summary: 'Prepara una risposta a un trigger definito.',
        slot: 'actionUsed',
      },
      {
        name: 'Search',
        kind: 'Azione',
        summary: 'Cerca con Intuizione, Medicina, Percezione o Sopravvivenza.',
        slot: 'actionUsed',
        roll: bestSkillModifier(['perception', 'insight', 'survival', 'medicine']),
        rollLabel: 'Migliore ricerca',
      },
      {
        name: 'Study',
        kind: 'Azione',
        summary: 'Studia con Arcano, Storia, Indagare, Natura o Religione.',
        slot: 'actionUsed',
        roll: bestSkillModifier(['arcana', 'history', 'investigation', 'nature', 'religion']),
        rollLabel: 'Migliore studio',
      },
      {
        name: 'Utilize',
        kind: 'Azione',
        summary: 'Usa un oggetto non magico o interagisci con cura.',
        slot: 'actionUsed',
      },
      {
        name: 'Opportunity Attack',
        kind: 'Reazione',
        summary: 'Attacco in mischia quando un nemico lascia la tua portata.',
        slot: 'reactionUsed',
      },
    ];
  }

  function classFeatureDetail(feature, row) {
    const resource = resourceForTrait(feature);
    if (resource) {
      const max = Math.max(0, Number(resource.max) || 0);
      const used = Math.min(max, Math.max(0, Number(resource.used) || 0));
      return [`${Math.max(0, max - used)}/${max} disponibili`, resource.recovery].filter(Boolean).join(' · ');
    }

    return `Sbloccato al livello ${Number(row?.Livello) || '?'}.`;
  }

  function traitTags(cue) {
    const tags = [];
    const resource = cue.resource || null;
    const text = normalizeTableText(`${cue.name} ${cue.detail || ''}`);

    if (cue.slot) tags.push(turnSlotLabel(cue.slot));
    if (resource) {
      const max = Math.max(0, Number(resource.max) || 0);
      const used = Math.min(max, Math.max(0, Number(resource.used) || 0));
      tags.push(`${Math.max(0, max - used)}/${max}`);
      if (resource.recovery) tags.push(resource.recovery);
    }
    if (text.includes('concentrazione')) tags.push('Concentrazione');
    if (text.includes('riposo breve') && !tags.some((tag) => normalizeTableText(tag).includes('riposo breve'))) tags.push('Riposo breve');
    if (text.includes('riposo lungo') && !tags.some((tag) => normalizeTableText(tag).includes('riposo lungo'))) tags.push('Riposo lungo');

    return tags.slice(0, 4);
  }

  function traitPriority(cue) {
    if (cue.resource) return 0;
    if (cue.slot) return 1;
    if (cue.source.startsWith('Classe') || cue.source.startsWith('Sottoclasse')) return 2;
    if (cue.source === 'Talento origine' || cue.source === 'Specie') return 3;
    return 4;
  }

  function inferTraitSlot(value) {
    const text = normalizeTableText(value);
    if (text.includes('reazione')) return 'reactionUsed';
    if (text.includes('azione bonus') || text.includes('bonus action')) return 'bonusActionUsed';
    if (
      text.includes('come azione') ||
      text.includes('con un azione') ||
      text.includes('usando un azione') ||
      text.includes("usando un'azione")
    ) {
      return 'actionUsed';
    }
    return '';
  }

  function turnSlotLabel(slot) {
    return {
      actionUsed: 'Azione',
      bonusActionUsed: 'Azione bonus',
      reactionUsed: 'Reazione',
    }[slot] || 'Turno';
  }

  function resourceForTrait(name) {
    const key = traitLookupKey(name);
    if (!key) return null;

    return appState.characterSheet.resources.find((resource) => {
      const resourceKey = traitLookupKey(resource.name);
      return resourceKey && (resourceKey === key || key.includes(resourceKey) || resourceKey.includes(key));
    }) || null;
  }

  function traitLookupKey(value) {
    return normalizeTableText(value)
      .replace(/\([^)]*\)/g, ' ')
      .replace(/\b(un|una|due|tre|utilizzi?|uso|usi)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function splitSummaryTraits(value) {
    return String(value || '')
      .replace(/\.$/, '')
      .split(/,|;|\se\s(?=[a-z])/i)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function titleCaseTrait(value) {
    const text = String(value || '').trim();
    if (!text) return 'Tratto';

    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function referenceSectionLabel(section) {
    return {
      feats: 'Talento',
      magic_items: 'Oggetto magico',
      rules: 'Regola',
      rules_glossary: 'Glossario',
    }[section] || 'Riferimento';
  }

  function normalizeTableText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tableStatusLine() {
    const status = appState.characterSheet.status || {};
    return [
      status.inspiration ? 'Ispirazione' : '',
      status.concentration ? `Concentrazione: ${status.concentrationSpell || 'attiva'}` : '',
      activeEffects().length ? `${activeEffects().length} effetti` : '',
      status.exhaustion ? `Indebolimento ${status.exhaustion}` : '',
      status.conditions?.length ? `${status.conditions.length} condizioni` : '',
      Number(appState.characterSheet.currentHp) <= 0 ? 'A 0 PF' : '',
    ].filter(Boolean).join(' · ');
  }

  function renderTableStat(label, value, hint) {
    return `
      <div class="sheet-summary-stat">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(String(value))}</strong>
        <small>${escapeHtml(hint)}</small>
      </div>
    `;
  }

  function activeConditionEntries() {
    const ids = appState.characterSheet.status?.conditions || [];
    return ids
      .map((id) => appState.data.rules_glossary.find((entry) => entry.id === id) || { id, nome: id })
      .sort((a, b) => String(a.nome || a.id).localeCompare(String(b.nome || b.id), 'it'));
  }

  function deathSaveWarning() {
    const status = appState.characterSheet.status || {};
    return Number(status.deathSaveFailures) > 0 || Number(appState.characterSheet.currentHp) <= 0;
  }

  function skillModifier(key) {
    const skill = SKILL_META.find(([skillKey]) => skillKey === key);
    if (!skill) return 0;
    const [, , ability] = skill;
    return abilityModifier(appState.characterSheet.abilities[ability]) +
      skillProficiencyBonus(appState.characterSheet.skillProficiencies[key]) +
      effectModifier('skillChecks');
  }

  function bestSkillModifier(keys) {
    return Math.max(...keys.map(skillModifier));
  }

  function spellActionSlot(spell) {
    const text = String(spell?.tempo_lancio || '').toLowerCase();
    if (text.includes('reazione')) return 'reactionUsed';
    if (text.includes('bonus')) return 'bonusActionUsed';
    return 'actionUsed';
  }

  function spellSlotForSpell(spell) {
    const level = Number(spell?.livello) || 0;
    if (level <= 0) return '';

    return characterSpellSlots()
      .map(([label, value]) => ({
        label,
        level: Number(String(label).match(/\d+/)?.[0]) || 0,
        max: Math.max(0, Number(value) || 0),
      }))
      .filter((slot) => slot.level >= level && slot.max > 0)
      .sort((a, b) => a.level - b.level)
      .find((slot) => (Number(appState.characterSheet.spellSlotsUsed[slot.label]) || 0) < slot.max)?.label || '';
  }

  function spellRequiresConcentration(spell) {
    return String(spell?.durata || '').toLowerCase().includes('concentrazione');
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

  function formatLogTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return { renderCharacterSheetTable };
}
