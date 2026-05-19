export function createInlineFormatter({
  appState,
  conditionAliases,
  escapeAttr,
  escapeHtml,
  escapeRegExp,
  isLikelyTableDie,
  normalizeText,
  parseDiceFormula,
}) {
  /*
   * Formatta testo inline semplice e, quando richiesto, rende cliccabili
   * le formule di dado riconosciute dal parser leggero.
   */
  function formatInline(text, options = {}) {
    const withDice = options.dice !== false;
    const withAttacks = options.attacks !== false;
    const withGlossary = options.glossary !== false;
    const value = String(text);
    const formatted = formatMarkdownInline(value);
    const withGlossaryLinks = withGlossary ? enrichGlossaryLinks(formatted) : formatted;
    const withAttackRolls = withAttacks ? enrichAttackRolls(withGlossaryLinks) : withGlossaryLinks;

    return withDice ? enrichDiceFormulas(withAttackRolls) : withAttackRolls;
  }

  /*
   * Applica il piccolo sottoinsieme Markdown supportato.
   */
  function formatMarkdownInline(text) {
    return escapeHtml(String(text))
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  /*
   * Collega le condizioni citate nel testo alla relativa voce di glossario.
   */
  function enrichGlossaryLinks(html) {
    const terms = glossaryConditionTerms();

    if (!terms.length) return String(html);

    const pattern = new RegExp(`\\b(${terms.map((term) => escapeRegExp(term.label)).join('|')})\\b`, 'gi');

    return String(html).replace(pattern, (match, _term, offset, fullText) => {
      if (isInsideHtmlTag(fullText, offset)) return match;

      const condition = terms.find((term) => normalizeText(term.label) === normalizeText(match));
      if (!condition) return match;

      return glossaryLink(match, condition.id);
    });
  }

  /*
   * Crea la lista di alias delle condizioni presenti davvero nel glossario.
   */
  function glossaryConditionTerms() {
    const conditionIds = new Set(
      appState.data.rules_glossary
        .filter((entry) => entry.descrittore === 'condizione')
        .map((entry) => entry.id)
    );

    return Object.entries(conditionAliases)
      .filter(([id]) => conditionIds.has(id))
      .flatMap(([id, aliases]) => aliases.map((label) => ({ id, label })))
      .sort((a, b) => b.label.length - a.label.length);
  }

  /*
   * Link interno a una voce del glossario.
   */
  function glossaryLink(label, id) {
    return `<a class="glossary-link" href="#/rules_glossary/${encodeURIComponent(id)}" title="Apri definizione: ${escapeAttr(label)}">${escapeHtml(label)}</a>`;
  }

  /*
   * Crea un bottone inline per una formula di dado.
   */
  function diceButton(token) {
    return `<button class="dice-inline" type="button" data-dice-roll="${escapeAttr(token.formula)}" aria-label="Tira ${escapeAttr(token.formula)}">${escapeHtml(token.raw)}</button>`;
  }

  /*
   * Crea il gruppo inline per un tiro per colpire.
   */
  function attackRollControls(rawModifier) {
    const modifier = Number(rawModifier);
    const normalized = modifier >= 0 ? `+${modifier}` : String(modifier);

    return `<span class="attack-roll" aria-label="Tiro per colpire ${escapeAttr(normalized)}"><button class="attack-roll-main" type="button" data-attack-roll="${escapeAttr(String(modifier))}" data-attack-mode="normal" aria-label="Tira per colpire ${escapeAttr(normalized)}">${escapeHtml(normalized)}</button><button class="attack-roll-mode" type="button" data-attack-roll="${escapeAttr(String(modifier))}" data-attack-mode="advantage" aria-label="Tira per colpire ${escapeAttr(normalized)} con vantaggio" title="Vantaggio">V</button><button class="attack-roll-mode" type="button" data-attack-roll="${escapeAttr(String(modifier))}" data-attack-mode="disadvantage" aria-label="Tira per colpire ${escapeAttr(normalized)} con svantaggio" title="Svantaggio">S</button></span>`;
  }

  /*
   * Rende interattivi i bonus dopo "Tiro per colpire".
   */
  function enrichAttackRolls(html) {
    const pattern = /((?:<em>)?Tiro per colpire[\s\S]{0,90}?:?(?:<\/em>)?\s*)([+-]\d+)/gi;

    return String(html).replace(pattern, (match, prefix, modifier, offset, fullText) => {
      if (isInsideHtmlTag(fullText, offset + prefix.length)) return match;

      return `${prefix}${attackRollControls(modifier)}`;
    });
  }

  /*
   * Inserisce bottoni dado nel testo gia escapato/formattato.
   * In questa fase l'HTML contiene solo tag generati localmente.
   */
  function enrichDiceFormulas(html) {
    const pattern = /\b(\d*d\d+(?:(?:kh|kl|dl)1)?(?:\s*[+-]\s*\d+)?)\b/gi;

    return String(html).replace(pattern, (raw, formula, offset, fullText) => {
      const parsed = parseDiceFormula(formula);

      if (!parsed || isLikelyTableDie(fullText, offset, raw) || isInsideHtmlTag(fullText, offset)) {
        return raw;
      }

      return diceButton({ ...parsed, raw });
    });
  }

  /*
   * Evita sostituzioni accidentali dentro tag HTML generati.
   */
  function isInsideHtmlTag(text, index) {
    const lastOpen = text.lastIndexOf('<', index);
    const lastClose = text.lastIndexOf('>', index);

    return lastOpen > lastClose;
  }

  return formatInline;
}
