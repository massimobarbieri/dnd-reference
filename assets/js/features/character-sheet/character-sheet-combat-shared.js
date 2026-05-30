/*
* Helper di combattimento condivisi tra la tab "Combattimento" e la tab "Tavolo".
* Entrambe le viste leggono la stessa economia del turno, lo stesso movimento e
* gli stessi controlli PF: tenerli qui evita che le due plance divergano.
*/
export function createCharacterSheetCombatShared({
  appState,
  characterSheetDerived,
  escapeAttr,
  escapeHtml,
}) {
  function combatRound() {
    return Math.min(999, Math.max(1, Number(appState.characterSheet.combatState?.round) || 1));
  }

  function movementUsed() {
    const speed = characterSheetDerived.characterEffectiveSpeed();
    const used = Math.max(0, Number(appState.characterSheet.combatState?.movementUsed) || 0);
    return speed ? Math.min(speed, used) : used;
  }

  function combatState() {
    const source = appState.characterSheet.combatState || {};
    return {
      round: combatRound(),
      actionUsed: Boolean(source.actionUsed),
      bonusActionUsed: Boolean(source.bonusActionUsed),
      reactionUsed: Boolean(source.reactionUsed),
      movementUsed: movementUsed(),
    };
  }

  function turnReadinessSummary() {
    const state = combatState();
    const ready = [state.actionUsed, state.bonusActionUsed, state.reactionUsed].filter((used) => !used).length;
    return `${ready}/3`;
  }

  function hitDiceAvailableSummary() {
    const max = Math.min(20, Math.max(1, Number(appState.characterSheet.level) || 1));
    const used = Math.min(max, Math.max(0, Number(appState.characterSheet.hitDiceUsed) || 0));
    return `${Math.max(0, max - used)}/${max}`;
  }

  function formatMeters(value) {
    const number = Number(value) || 0;
    return Number.isInteger(number) ? String(number) : String(number).replace('.', ',');
  }

  function renderTurnSlot(field, label, used) {
    return `
      <button
        class="sheet-turn-slot ${used ? 'is-used' : ''}"
        type="button"
        data-sheet-combat-toggle="${escapeAttr(field)}"
        aria-pressed="${used ? 'true' : 'false'}"
      >
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(used ? 'Usata' : 'Pronta')}</strong>
      </button>
    `;
  }

  function renderHitPointQuickControls() {
    const sheet = appState.characterSheet;
    const current = Math.max(0, Number(sheet.currentHp) || 0);
    const max = Math.max(0, Number(sheet.maxHp) || 0);
    const temp = Math.max(0, Number(sheet.tempHp) || 0);
    const percent = max ? Math.round((current / max) * 100) : 0;

    return `
      <div class="sheet-hp-console" aria-label="Punti ferita rapidi">
        <div class="sheet-hp-meter">
          <span>PF</span>
          <strong>${escapeHtml(`${current}/${max}`)}</strong>
          <small>${escapeHtml(temp ? `Temp ${temp}` : `${percent}%`)}</small>
        </div>
        <form class="sheet-hp-actions" data-sheet-hp-form>
          <label>
            <span>Valore</span>
            <input type="number" name="amount" min="0" value="1" inputmode="numeric">
          </label>
          <button type="submit" data-sheet-hp-action="damage">Danno</button>
          <button type="submit" data-sheet-hp-action="heal">Cura</button>
          <button type="submit" data-sheet-hp-action="temp">Temp</button>
        </form>
      </div>
    `;
  }

  /*
   * Vitali visuali (anello PF colorato per percentuale, scudo CA):
   * danno alla scheda un colpo d'occhio da cruscotto invece di soli numeri.
   */
  function renderHpVital() {
    const sheet = appState.characterSheet;
    const current = Math.max(0, Number(sheet.currentHp) || 0);
    const max = Math.max(0, Number(sheet.maxHp) || 0);
    const temp = Math.max(0, Number(sheet.tempHp) || 0);
    const percent = max ? Math.min(100, Math.round((current / max) * 100)) : 0;
    const tone = percent > 50 ? 'ok' : percent > 25 ? 'warn' : 'low';
    const radius = 26;
    const circumference = 2 * Math.PI * radius;
    const filled = (circumference * percent) / 100;

    return `
      <div class="sheet-vital sheet-vital--hp is-${tone}" role="img" aria-label="Punti ferita ${current} su ${max}">
        <svg class="hp-ring" viewBox="0 0 64 64" aria-hidden="true">
          <circle class="hp-ring-track" cx="32" cy="32" r="${radius}"></circle>
          <circle class="hp-ring-fill" cx="32" cy="32" r="${radius}" stroke-dasharray="${filled.toFixed(1)} ${circumference.toFixed(1)}" transform="rotate(-90 32 32)"></circle>
        </svg>
        <div class="sheet-vital-body">
          <strong>${current}<span>/${max}</span></strong>
          <small>${temp ? `PF · +${temp} temp` : 'PF'}</small>
        </div>
      </div>
    `;
  }

  function renderAcVital() {
    const value = characterSheetDerived.characterEffectiveArmorClass();

    return `
      <div class="sheet-vital sheet-vital--ac" role="img" aria-label="Classe armatura ${value}">
        <div class="ac-shield-wrap">
          <svg class="ac-shield" viewBox="0 0 48 54" aria-hidden="true">
            <path d="M24 2 44 9v17c0 13-9 22-20 26C13 48 4 39 4 26V9z"></path>
          </svg>
          <strong class="ac-value">${value}</strong>
        </div>
        <small>CA</small>
      </div>
    `;
  }

  return {
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
  };
}
