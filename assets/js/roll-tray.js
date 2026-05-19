(function exposeRollTray(root, factory) {
  root.DndRollTray = factory();
}(typeof globalThis !== 'undefined' ? globalThis : window, function createRollTray() {
  'use strict';

  function createRollTrayController(deps) {
    const {
      appState,
      DICE_LIMITS,
      parseDiceFormula,
      rollDice,
      randomInt,
      escapeHtml,
      escapeAttr,
    } = deps;

    /*
     * Gestisce tutti i comandi del dice roller, inclusi quelli inline.
     */
    function handleRollCommand(event) {
      const toggleButton = event.target.closest('[data-roll-toggle]');

      if (toggleButton) {
        appState.rollTrayOpen = !appState.rollTrayOpen;
        renderRollTray();
        return;
      }

      const attackButton = event.target.closest('[data-attack-roll]');

      if (attackButton) {
        const modifier = Number(attackButton.getAttribute('data-attack-roll'));
        const mode = attackButton.getAttribute('data-attack-mode') || 'normal';

        if (!Number.isFinite(modifier)) return;

        showRollResult(rollAttack(modifier, mode));
        return;
      }

      const scalingButton = event.target.closest('[data-scaling-roll]');

      if (scalingButton) {
        const formula = scalingButton.getAttribute('data-scaling-roll');
        const parsed = parseDiceFormula(formula);

        if (!parsed) return;

        showRollResult({
          ...rollDice(parsed),
          kind: 'scaling',
        });
        return;
      }

      const rollButton = event.target.closest('[data-dice-roll]');

      if (rollButton) {
        const formula = rollButton.getAttribute('data-dice-roll');
        const parsed = parseDiceFormula(formula);

        if (!parsed) return;

        showRollResult(rollDice(parsed));
        return;
      }

      if (event.target.closest('[data-roll-clear]')) {
        appState.rollHistory = [];
        appState.rollError = '';
        appState.rollTrayOpen = false;
        renderRollTray();
        return;
      }

      const quickButton = event.target.closest('[data-quick-roll]');

      if (quickButton) {
        const parsed = parseDiceFormula(quickButton.getAttribute('data-quick-roll'));

        if (!parsed) return;

        appState.rollError = '';
        showRollResult(rollDice(parsed));
      }
    }

    /*
     * Gestisce l'input libero del dice tray globale.
     */
    function handleRollSubmit(event) {
      const form = event.target.closest('#roll-tray-form');
      if (!form) return;

      event.preventDefault();

      const input = form.querySelector('#roll-tray-input');
      const parsed = parseDiceFormula(input?.value || '');

      if (!parsed) {
        appState.rollError = 'Formula non valida. Usa esempi come 1d20 + 5 o 2d6.';
        appState.rollTrayOpen = true;
        renderRollTray();
        return;
      }

      appState.rollError = '';
      showRollResult(rollDice(parsed));
    }

    /*
     * Renderizza o aggiorna il pannello dei risultati dei tiri.
     */
    function renderRollTray() {
      const markup = rollTrayMarkup();
      const existing = document.querySelector('#roll-tray');

      if (existing) {
        existing.outerHTML = markup;
        return document.querySelector('#roll-tray');
      }

      document.body.insertAdjacentHTML('beforeend', markup);
      return document.querySelector('#roll-tray');
    }

    /*
     * Crea il markup del pannello dice roller.
     */
    function rollTrayMarkup() {
      const lastRoll = appState.rollHistory[0];
      const isOpen = appState.rollTrayOpen || Boolean(appState.rollError);

      return `
        <aside id="roll-tray" class="roll-tray${isOpen ? ' is-open' : ''}${lastRoll ? ' has-result' : ''}" aria-live="polite">
          <div class="roll-tray-header">
            <button
              class="roll-toggle"
              type="button"
              data-roll-toggle
              aria-expanded="${isOpen}"
              aria-controls="roll-tray-body"
            >
              <span class="roll-toggle-label">
                <span class="roll-toggle-label-full">Dice roller</span>
                <span class="roll-toggle-label-short">Dadi</span>
              </span>
              ${lastRoll
                ? `
                  <span class="roll-toggle-result" aria-label="Ultimo tiro: ${escapeAttr(lastRoll.formula)}, totale ${escapeAttr(String(lastRoll.total))}">
                    <span>${escapeHtml(lastRoll.formula)}</span>
                    <strong>${escapeHtml(String(lastRoll.total))}</strong>
                  </span>
                `
                : ''
              }
            </button>

            <div class="roll-header-actions">
              ${appState.rollHistory.length
                ? '<button class="button button--ghost roll-clear" type="button" data-roll-clear>Svuota</button>'
                : ''
              }
            </div>
          </div>

          <div id="roll-tray-body" class="roll-tray-body">
            ${lastRoll
              ? `
                <div class="roll-result ${escapeAttr(rollResultClass(lastRoll))}" role="status" aria-live="polite">
                  <span class="roll-formula">${escapeHtml(lastRoll.formula)}</span>
                  <strong class="roll-total">${escapeHtml(String(lastRoll.total))}</strong>
                  <span class="roll-breakdown">${escapeHtml(formatRollBreakdown(lastRoll))}</span>
                  ${rollResultNote(lastRoll)
                    ? `<span class="roll-note">${escapeHtml(rollResultNote(lastRoll))}</span>`
                    : ''
                  }
                </div>

                ${appState.rollHistory.length > 1
                  ? `
                    <ol class="roll-history">
                      ${appState.rollHistory.slice(1).map((roll) => `
                        <li>
                          <span>${escapeHtml(roll.formula)}</span>
                          <strong>${escapeHtml(String(roll.total))}</strong>
                        </li>
                      `).join('')}
                    </ol>
                  `
                  : ''
                }
              `
              : '<p class="roll-empty">Clicca una formula di dado nella scheda.</p>'
            }

            <form id="roll-tray-form" class="roll-form">
              <label class="visually-hidden" for="roll-tray-input">Formula di dado</label>
              <input
                id="roll-tray-input"
                class="roll-input"
                type="text"
                inputmode="text"
                autocomplete="off"
                placeholder="1d20 + 5"
                aria-describedby="roll-tray-help"
              >
              <button class="button button--primary roll-submit" type="submit">Tira</button>
            </form>

            <div class="quick-dice" aria-label="Dadi rapidi">
              ${[4, 6, 8, 10, 12, 20, 100].map((faces) => `
                <button type="button" data-quick-roll="1d${faces}" aria-label="Tira 1d${faces}">d${faces}</button>
              `).join('')}
            </div>

            <p id="roll-tray-help" class="${appState.rollError ? 'roll-error' : 'roll-help'}">
              ${escapeHtml(appState.rollError || 'Formula libera: d20, 2d6 + 3, 2d20kh1, 4d6dl1.')}
            </p>
          </div>
        </aside>
      `;
    }

    /*
     * Aggiunge un tiro allo storico breve.
     */
    function addRollResult(result) {
      appState.rollHistory = [
        result,
        ...appState.rollHistory,
      ].slice(0, DICE_LIMITS.historySize);
    }

    /*
     * Registra il tiro e mantiene il risultato subito visibile anche su mobile.
     */
    function showRollResult(result) {
      appState.rollError = '';
      addRollResult(result);
      appState.rollTrayOpen = true;

      const tray = renderRollTray();
      const body = tray?.querySelector('.roll-tray-body');

      if (body) body.scrollTop = 0;
    }

    /*
     * Formatta il dettaglio dei dadi tirati.
     */
    function formatRollBreakdown(result) {
      if (result.kind === 'attack') {
        const rolls = result.rolls.join(', ');
        const kept = result.mode === 'normal' ? '' : `; tenuto ${result.kept}`;
        const modifier = result.modifier
          ? ` ${result.modifier > 0 ? '+' : '-'} ${Math.abs(result.modifier)}`
          : '';

        return `${rolls}${kept}${modifier}`;
      }

      const dice = result.rolls.join(' + ');
      const kept = result.keepMode
        ? `; usati ${result.keptRolls.join(' + ')}`
        : '';
      const modifier = result.modifier
        ? ` ${result.modifier > 0 ? '+' : '-'} ${Math.abs(result.modifier)}`
        : '';

      return `${dice}${kept}${modifier}`;
    }

    /*
     * Evidenzia 20 e 1 naturali quando il tiro usa un d20.
     */
    function rollResultClass(result) {
      if (!isD20Roll(result)) return '';
      if (result.kept === 20) return 'roll-result--crit';
      if (result.kept === 1) return 'roll-result--fumble';
      return '';
    }

    /*
     * Nota breve per critico/fallimento critico.
     */
    function rollResultNote(result) {
      if (!isD20Roll(result)) return '';
      if (result.kept === 20) return '20 naturale';
      if (result.kept === 1) return '1 naturale';
      return '';
    }

    /*
     * Riconosce i risultati basati su d20.
     */
    function isD20Roll(result) {
      return result.kind === 'attack' || result.faces === 20 || (result.rolls?.length === 1 && result.formula?.startsWith('1d20'));
    }

    /*
     * Esegue un tiro per colpire con eventuale vantaggio o svantaggio.
     */
    function rollAttack(modifier, mode = 'normal') {
      const normalizedMode = ['advantage', 'disadvantage'].includes(mode) ? mode : 'normal';
      const rolls = normalizedMode === 'normal'
        ? [randomInt(1, 20)]
        : [randomInt(1, 20), randomInt(1, 20)];
      const kept = normalizedMode === 'disadvantage'
        ? Math.min(...rolls)
        : Math.max(...rolls);
      const total = kept + modifier;

      return {
        kind: 'attack',
        mode: normalizedMode,
        formula: attackFormulaLabel(modifier, normalizedMode),
        rolls,
        kept,
        modifier,
        total,
      };
    }

    /*
     * Etichetta leggibile per il pannello risultati.
     */
    function attackFormulaLabel(modifier, mode) {
      const suffix = mode === 'advantage'
        ? ' con vantaggio'
        : mode === 'disadvantage'
          ? ' con svantaggio'
          : '';
      const sign = modifier >= 0 ? '+' : '-';

      return `Colpire ${sign}${Math.abs(modifier)}${suffix}`;
    }

    return {
      renderRollTray,
      handleRollCommand,
      handleRollSubmit,
      showRollResult,
    };
  }

  return { createRollTrayController };
}));