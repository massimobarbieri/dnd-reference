/*
 * D&D Reference
 * Applicazione statica per consultare mostri, incantesimi e oggetti magici.
 *
 * Caratteristiche principali:
 * - Non usa framework JavaScript.
 * - Carica i dati da file JSON/YAML.
 * - Gestisce navigazione tramite hash URL, esempio: #/monsters.
 * - Permette ricerca, filtri e preferiti.
 * - Salva i preferiti nel localStorage del browser.
 */
(() => {
  'use strict';

  /*
   * Stato globale dell’applicazione.
   * Contiene configurazione, dati caricati, filtri attivi,
   * preferiti e sezione corrente.
   */
  const appState = {
    config: null,

    // Dati principali caricati dai file JSON.
    data: {
      monsters: [],
      spells: [],
      magic_items: [],
    },

    // Mappa id mostro -> dati immagine.
    monsterImages: new Map(),

    // Preferiti letti dal localStorage.
    favorites: loadFavorites(),

    // Sezione attualmente visualizzata.
    currentSection: null,

    // Testo digitato nella barra di ricerca.
    searchTerm: '',

    // Filtro selezionato per ogni sezione.
    filters: {
      monsters: '',
      spells: '',
      magic_items: '',
    },

    // Se true mostra solo gli elementi preferiti.
    showOnlyFavorites: false,

    // Storico breve dei tiri effettuati durante la sessione.
    rollHistory: [],

    // Messaggio di validazione per il dice tray globale.
    rollError: '',

    // Stato espanso/collassato del dice roller, utile soprattutto su mobile.
    rollTrayOpen: false,
  };

  const {
    analyzeRollContext,
    DICE_LIMITS,
    findDiceFormulas,
    formatDiceFormula,
    isLikelyTableDie,
    parseDiceFormula,
    randomInt,
    rollDice,
  } = window.DndDiceRoller;

  /*
   * Metadati delle sezioni.
   * Servono per icone, etichette e gestione uniforme delle liste.
   */
  const SECTION_META = {
    monsters: {
      icon: '🐉',
      singular: 'mostro',
      titleKey: 'monsters',
    },
    spells: {
      icon: '✨',
      singular: 'incantesimo',
      titleKey: 'spells',
    },
    magic_items: {
      icon: '🗡️',
      singular: 'oggetto magico',
      titleKey: 'magic_items',
    },
  };

  /*
   * Riferimenti alle tre viste principali dell’interfaccia.
   * Ogni vista viene mostrata o nascosta in base alla rotta corrente.
   */
  const views = {
    home: document.querySelector('#home-view'),
    list: document.querySelector('#list-view'),
    detail: document.querySelector('#detail-view'),
  };

  /*
   * Quando il DOM è pronto, inizializza l’app.
   * Quando cambia l’hash dell’URL, aggiorna la vista.
   */
  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('hashchange', renderRoute);

  /*
   * Funzione principale di avvio.
   * Carica configurazione, dati, immagini e poi renderizza la rotta corrente.
   */
  async function init() {
    showLoading();
    renderRollTray();
    document.addEventListener('click', handleRollCommand);
    document.addEventListener('submit', handleRollSubmit);

    try {
      // Carica config.yml.
      appState.config = await loadConfig();

      // Aggiorna titolo, heading e sottotitolo della pagina.
      applyConfigToPage(appState.config);

      const paths = appState.config.paths;

      /*
       * Carica in parallelo tutti i dati.
       * Promise.all migliora i tempi perché non aspetta un file alla volta.
       */
      const [monsters, spells, magicItems, monsterImageYaml] = await Promise.all([
        fetchJson(paths.monsters),
        fetchJson(paths.spells),
        fetchJson(paths.magic_items),

        // Se il file immagini manca o fallisce, usa una stringa vuota.
        fetchText(paths.monster_images).catch(() => ''),
      ]);

      // Normalizza i dati per evitare errori se un file non contiene un array.
      appState.data.monsters = normalizeArray(monsters);
      appState.data.spells = normalizeArray(spells);

      // Gli oggetti magici vengono anche normalizzati nella rarità.
      appState.data.magic_items = normalizeArray(magicItems).map(normalizeMagicItem);

      // Converte il piccolo YAML delle immagini in una Map.
      appState.monsterImages = parseMonsterImages(monsterImageYaml);

      // Renderizza home, lista o dettaglio in base all’URL.
      renderRoute();
    } catch (error) {
      console.error(error);
      showError();
    }
  }

  /*
   * Scarica un file JSON e lo converte in oggetto JavaScript.
   */
  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Errore caricamento JSON: ${path}`);
    return response.json();
  }

  /*
   * Scarica un file testuale.
   * Usato per config.yml e monster-images.yml.
   */
  async function fetchText(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Errore caricamento testo: ${path}`);
    return response.text();
  }

  /*
   * Garantisce che il valore sia un array.
   * Se il file caricato è vuoto o malformato, evita crash nelle map/filter.
   */
  function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  /*
   * Normalizza un singolo oggetto magico.
   */
  function normalizeMagicItem(item) {
    return {
      ...item,
      rarita: normalizeMagicItemRarity(item.rarita),
    };
  }

  /*
   * Uniforma le rarità degli oggetti magici.
   * Esempio:
   * - "raro" diventa "rara"
   * - "molto raro" diventa "molto rara"
   * - rarità multiple diventano "rarità variabile"
   */
  function normalizeMagicItemRarity(rarity) {
    const text = String(rarity || '').trim().toLowerCase();

    if (!text) return '';

    if (text.includes(',') || text.includes(' o ') || text.includes('variabile')) {
      return 'rarità variabile';
    }

    const canonicalRarities = {
      raro: 'rara',
      rara: 'rara',
      'molto raro': 'molto rara',
      'molto rara': 'molto rara',
      leggendario: 'leggendaria',
      leggendaria: 'leggendaria',
    };

    return canonicalRarities[text] || text;
  }

  /*
   * Parser YAML minimale per config.yml.
   *
   * Supporta una struttura semplice a due livelli:
   *
   * site:
   *   title: Titolo
   * paths:
   *   monsters: data/monsters.json
   *
   * Non è un parser YAML completo, ma basta per configurazioni semplici.
   */
  async function loadConfig() {
    const text = await fetchText('config.yml');
    const config = {};
    let currentBlock = null;

    text.split(/\r?\n/).forEach((rawLine) => {
      // Rimuove commenti e spazi finali.
      const line = rawLine.replace(/#.*$/, '').trimEnd();

      // Ignora righe vuote.
      if (!line.trim()) return;

      // Riconosce blocchi principali: site:, paths:, labels:, ecc.
      if (!line.startsWith(' ') && line.endsWith(':')) {
        currentBlock = line.slice(0, -1).trim();
        config[currentBlock] = {};
        return;
      }

      // Riconosce proprietà indentate di due spazi.
      const match = line.match(/^\s{2}([\w_]+):\s*(.*)$/);

      if (match && currentBlock) {
        config[currentBlock][match[1]] = parseYamlScalar(match[2]);
      }
    });

    return config;
  }

  /*
   * Converte valori YAML semplici in tipi JavaScript.
   * Supporta:
   * - booleani
   * - null
   * - numeri
   * - stringhe con o senza virgolette
   */
  function parseYamlScalar(value) {
    const trimmed = value.trim();

    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;

    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }

    return trimmed.replace(/^['"]|['"]$/g, '');
  }

  /*
   * Parser dedicato a monster-images.yml.
   *
   * Formato previsto:
   *
   * - id: goblin
   *   nome: Goblin
   *   immagine: images/goblin.png
   *
   * Restituisce una Map:
   * id -> oggetto con id, nome, immagine.
   */
  function parseMonsterImages(yamlText) {
    const map = new Map();
    let current = null;

    yamlText.split(/\r?\n/).forEach((line) => {
      const itemMatch = line.match(/^\s*-\s+id:\s*(.+)$/);
      const propMatch = line.match(/^\s{2,}([\w_]+):\s*(.*)$/);

      if (itemMatch) {
        current = { id: itemMatch[1].trim() };
        map.set(current.id, current);
      } else if (current && propMatch) {
        current[propMatch[1]] = propMatch[2].trim();
      }
    });

    return map;
  }

  /*
   * Applica la configurazione generale alla pagina HTML.
   */
  function applyConfigToPage(config) {
    document.title = config.site?.title || 'D&D Reference';
    document.querySelector('#site-title').textContent = config.site?.title || 'D&D Reference';
    document.querySelector('#site-subtitle').textContent = config.site?.subtitle || '';
  }

  /*
   * Decide cosa mostrare in base all’hash dell’URL.
   *
   * Esempi:
   * #/                 -> home
   * #/monsters         -> lista mostri
   * #/monsters/goblin  -> dettaglio mostro
   */
  function renderRoute() {
    const route = parseHash();
    appState.currentSection = route.section || null;

    if (!route.section) {
      renderHome();
      return;
    }

    // Se la sezione non esiste, torna alla home.
    if (!SECTION_META[route.section]) {
      location.hash = '';
      return;
    }

    if (route.id) {
      renderDetail(route.section, route.id);
    } else {
      renderList(route.section);
    }
  }

  /*
   * Converte l’hash dell’URL in sezione e id.
   */
  function parseHash() {
    const clean = location.hash.replace(/^#\/?/, '');
    const [section, id] = clean.split('/');

    return {
      section,
      id: id ? decodeURIComponent(id) : null,
    };
  }

  /*
   * Mostra una sola vista alla volta e svuota le viste nascoste.
   */
  function setView(name) {
    Object.entries(views).forEach(([key, node]) => {
      node.hidden = key !== name;

      if (key !== name) {
        node.innerHTML = '';
      }
    });
  }

  /*
   * Renderizza la schermata iniziale con le tre card principali.
   */
  function renderHome() {
    setView('home');

    const labels = appState.config.labels;

    views.home.innerHTML = `
      <div class="home-grid">
        ${sectionHomeCard('monsters', labels.monsters, appState.data.monsters.length)}
        ${sectionHomeCard('spells', labels.spells, appState.data.spells.length)}
        ${sectionHomeCard('magic_items', labels.magic_items, appState.data.magic_items.length)}
      </div>
    `;
  }

  /*
   * Crea una card della home per una sezione.
   */
  function sectionHomeCard(section, label, count) {
    return `
      <a class="home-card" href="#/${section}">
        <strong>${SECTION_META[section].icon} ${escapeHtml(label)}</strong>
        <span>${count} elementi disponibili</span>
      </a>
    `;
  }

  /*
   * Renderizza la lista di una sezione:
   * - barra di ricerca
   * - filtro
   * - pulsante preferiti
   * - lista risultati
   */
  function renderList(section) {
    setView('list');

    const labels = appState.config.labels;
    const title = labels[section] || section;

    views.list.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-row">
          <a class="button button--ghost" href="#/">Home</a>

          <input
            id="search-input"
            class="search"
            type="search"
            value="${escapeAttr(appState.searchTerm)}"
            placeholder="${escapeAttr(labels.search_placeholder)}"
            aria-label="Cerca"
          >

          ${filterControl(section)}

          <button
            id="favorites-toggle"
            class="button"
            type="button"
            aria-pressed="${appState.showOnlyFavorites}"
          >
            ${labels.favorites}
          </button>
        </div>
      </div>

      <div class="section-title">
        <h2>${escapeHtml(title)}</h2>
        <span id="result-count" class="count"></span>
      </div>

      <div id="item-list" class="item-list"></div>
    `;

    /*
     * Aggiorna la ricerca in tempo reale.
     */
    views.list.querySelector('#search-input').addEventListener('input', (event) => {
      appState.searchTerm = event.target.value;
      renderListResults(section);
    });

    /*
     * Aggiorna il filtro della sezione corrente.
     */
    views.list.querySelector('#section-filter')?.addEventListener('change', (event) => {
      appState.filters[section] = event.target.value;
      renderListResults(section);
    });

    /*
     * Attiva/disattiva la visualizzazione dei soli preferiti.
     */
    views.list.querySelector('#favorites-toggle').addEventListener('click', (event) => {
      appState.showOnlyFavorites = !appState.showOnlyFavorites;
      event.currentTarget.setAttribute('aria-pressed', String(appState.showOnlyFavorites));
      renderListResults(section);
    });

    renderListResults(section);
  }

  /*
   * Renderizza solo i risultati della lista.
   * Viene richiamata quando cambiano ricerca, filtro o preferiti.
   */
  function renderListResults(section) {
    const labels = appState.config.labels;
    const allItems = appState.data[section];
    const items = getFilteredItems(section);

    const count = views.list.querySelector('#result-count');
    const list = views.list.querySelector('#item-list');

    count.textContent = `${items.length} / ${allItems.length}`;

    list.innerHTML = items.length
      ? items.map((item) => listItem(section, item)).join('')
      : `<div class="state-box">${escapeHtml(appState.showOnlyFavorites ? labels.empty_favorites : labels.empty_results)}</div>`;
  }

  /*
   * Restituisce gli elementi filtrati e ordinati alfabeticamente.
   */
  function getFilteredItems(section) {
    const term = normalizeText(appState.searchTerm);
    const filter = appState.filters[section];

    return appState.data[section]
      .filter((item) => !appState.showOnlyFavorites || isFavorite(section, item.id))
      .filter((item) => matchesSectionFilter(section, item, filter))
      .filter((item) => !term || normalizeText(searchableText(section, item)).includes(term))
      .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'it'));
  }

  /*
   * Crea il controllo filtro corretto per la sezione.
   * Mostri: grado sfida.
   * Incantesimi: livello.
   * Oggetti magici: rarità.
   */
  function filterControl(section) {
    const options = filterOptions(section);

    if (!options.length) return '';

    const labels = {
      monsters: 'Tutti i GS',
      spells: 'Tutti i livelli',
      magic_items: 'Tutte le rarità',
    };

    return `
      <select id="section-filter" class="filter-select" aria-label="${escapeAttr(labels[section])}">
        <option value="">${escapeHtml(labels[section])}</option>
        ${options
          .map((option) => `
            <option value="${escapeAttr(option.value)}"${option.value === appState.filters[section] ? ' selected' : ''}>
              ${escapeHtml(option.label)}
            </option>
          `)
          .join('')}
      </select>
    `;
  }

  /*
   * Genera le opzioni del filtro in base alla sezione.
   */
  function filterOptions(section) {
    if (section === 'monsters') {
      return uniqueValues(appState.data.monsters, 'grado_sfida')
        .sort((a, b) => challengeRatingValue(a) - challengeRatingValue(b))
        .map((value) => ({ value, label: `GS ${value}` }));
    }

    if (section === 'spells') {
      return uniqueValues(appState.data.spells, 'livello')
        .sort((a, b) => Number(a) - Number(b))
        .map((value) => ({
          value: String(value),
          label: spellLevel({ livello: Number(value) }),
        }));
    }

    return uniqueValues(appState.data.magic_items, 'rarita')
      .sort((a, b) => a.localeCompare(b, 'it'))
      .map((value) => ({
        value,
        label: capitalizeFirst(value),
      }));
  }

  /*
   * Verifica se un elemento passa il filtro selezionato.
   */
  function matchesSectionFilter(section, item, filter) {
    if (!filter) return true;

    if (section === 'monsters') {
      return String(item.grado_sfida || '') === filter;
    }

    if (section === 'spells') {
      return String(item.livello ?? '') === filter;
    }

    return String(item.rarita || '') === filter;
  }

  /*
   * Estrae valori unici da una lista di oggetti.
   */
  function uniqueValues(items, key) {
    return Array.from(
      new Set(
        items
          .map((item) => item[key])
          .filter((value) => value !== null && value !== undefined && value !== '')
      )
    ).map(String);
  }

  /*
   * Converte il grado sfida in numero per ordinarlo correttamente.
   * Esempio:
   * "1/2" -> 0.5
   * "2"   -> 2
   */
  function challengeRatingValue(value) {
    const text = String(value);

    if (text.includes('/')) {
      const [numerator, denominator] = text.split('/').map(Number);
      return numerator / denominator;
    }

    return Number(text);
  }

  /*
   * Mette in maiuscolo la prima lettera di una stringa.
   */
  function capitalizeFirst(value) {
    const text = String(value);
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
  }

  /*
   * Costruisce il testo usato dalla ricerca.
   * Include campi diversi in base alla sezione.
   */
  function searchableText(section, item) {
    if (section === 'monsters') {
      return [item.nome, item.tipo, item.dimensione, item.gruppo, item.grado_sfida].join(' ');
    }

    if (section === 'spells') {
      return [
        item.nome,
        item.scuola,
        item.classi?.join(' '),
        item.descrizione,
        item.livello,
      ].join(' ');
    }

    return [
      item.nome,
      item.tipo,
      item.tipo_base,
      item.rarita,
      item.descrizione,
    ].join(' ');
  }

  /*
   * Crea il markup di un elemento nella lista.
   */
  function listItem(section, item) {
    return `
      <a class="list-item" href="#/${section}/${encodeURIComponent(item.id)}">
        <strong>${escapeHtml(item.nome || 'Senza nome')}</strong>
        <small>${escapeHtml(summaryLine(section, item))}</small>
      </a>
    `;
  }

  /*
   * Crea una riga riassuntiva sotto al nome dell’elemento.
   */
  function summaryLine(section, item) {
    if (section === 'monsters') {
      return [
        item.tipo,
        item.dimensione,
        item.grado_sfida ? `GS ${item.grado_sfida}` : null,
      ].filter(Boolean).join(' · ');
    }

    if (section === 'spells') {
      return [
        spellLevel(item),
        item.scuola,
        item.tempo_lancio,
      ].filter(Boolean).join(' · ');
    }

    return [
      item.tipo_base || item.tipo,
      item.rarita,
      item.richiede_sintonia ? 'sintonia' : null,
    ].filter(Boolean).join(' · ');
  }

  /*
   * Renderizza la scheda di dettaglio di un elemento.
   */
  function renderDetail(section, id) {
    const item = appState.data[section].find((entry) => entry.id === id);

    // Se l’id non esiste, torna alla lista della sezione.
    if (!item) {
      location.hash = `#/${section}`;
      return;
    }

    setView('detail');

    const previousNext = getSiblingLinks(section, id);

    views.detail.innerHTML = `
      <nav class="detail-nav" aria-label="Navigazione scheda">
        <a class="button" href="#/${section}">← Elenco</a>

        <div class="toolbar-row">
          ${previousNext.prev ? `<a class="button" href="#/${section}/${encodeURIComponent(previousNext.prev.id)}">‹</a>` : ''}
          ${previousNext.next ? `<a class="button" href="#/${section}/${encodeURIComponent(previousNext.next.id)}">›</a>` : ''}
        </div>
      </nav>

      <article class="detail-card detail-card--flat">
        ${renderDetailContent(section, item)}
      </article>
    `;

    /*
     * Gestisce il click sulla stella dei preferiti nel dettaglio.
     * Dopo il cambio, la scheda viene ridisegnata per aggiornare l’icona.
     */
    document.querySelector('#favorite-detail').addEventListener('click', () => {
      toggleFavorite(section, item.id);
      renderDetail(section, id);
    });

  }

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

    const structuredDamageButton = event.target.closest('[data-structured-damage-roll]');

    if (structuredDamageButton) {
      const formula = structuredDamageButton.getAttribute('data-structured-damage-roll');
      const label = structuredDamageButton.getAttribute('data-structured-roll-label');
      const parsed = parseDiceFormula(formula);

      if (!parsed) return;

      showRollResult({
        ...rollDice(parsed),
        formula: label || parsed.formula,
        kind: 'structured',
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
   * Trova elemento precedente e successivo nella lista filtrata.
   * Così i pulsanti ‹ e › rispettano ricerca e filtri attivi.
   */
  function getSiblingLinks(section, id) {
    const items = getFilteredItems(section);
    const index = items.findIndex((item) => item.id === id);

    return {
      prev: items[index - 1] || null,
      next: items[index + 1] || null,
    };
  }

  /*
   * Smista il rendering del dettaglio in base alla sezione.
   */
  function renderDetailContent(section, item) {
    if (section === 'monsters') return renderMonster(item);
    if (section === 'spells') return renderSpell(item);
    return renderMagicItem(item);
  }

  /*
   * Header comune per tutte le schede di dettaglio.
   * Include titolo, sottotitolo e pulsante preferito.
   */
  function renderHeader(section, item, kicker) {
    const pressed = isFavorite(section, item.id);

    return `
      <header class="detail-header">
        <div>
          <h2 class="detail-title">${escapeHtml(item.nome)}</h2>
          <p class="detail-kicker">${escapeHtml(kicker || '')}</p>
        </div>

        <button
          id="favorite-detail"
          class="button favorite-btn"
          type="button"
          aria-pressed="${pressed}"
        >
          ${pressed ? '★' : '☆'}
        </button>
      </header>
    `;
  }

  /*
   * Renderizza la scheda di un mostro.
   */
  function renderMonster(monster) {
    const image = appState.monsterImages.get(monster.id)?.immagine;
    const showImages = appState.config.site?.show_monster_images !== false;

    return `
      <div class="monster-hero">
        <div>
          ${renderHeader(
            'monsters',
            monster,
            [monster.dimensione, monster.tipo, monster.allineamento].filter(Boolean).join(' · ')
          )}

          ${compactMeta([
            ['CA', monster.statistiche?.classe_armatura],
            ['PF', monster.statistiche?.punti_ferita],
            ['Vel.', monster.statistiche?.velocita],
            ['Iniz.', monster.statistiche?.iniziativa],
            ['GS', monster.grado_sfida_raw || monster.grado_sfida],
            ['BC', monster.bonus_competenza],
            ['Sensi', monster.sensi],
            ['Lingue', monster.lingue],
          ])}
        </div>

        ${showImages ? renderMonsterImage(image) : ''}
      </div>

      ${renderAbilityScores(monster.caratteristiche)}

      ${compactMeta([
        ['Abilità', monster.abilita],
        ['Resistenze', monster.resistenze],
        ['Immunità danni', monster.immunita_danni],
        ['Immunità condizioni', monster.immunita_condizione],
        ['Vulnerabilità', monster.vulnerabilita],
        ['Attrezzatura', monster.attrezzatura],
      ])}

      ${renderEntries('Tratti', monster.tratti)}
      ${renderEntries('Azioni', monster.azioni)}
      ${renderEntries('Azioni bonus', monster.azioni_bonus)}
      ${renderEntries('Reazioni', monster.reazioni)}
      ${renderLegendary(monster.azioni_leggendarie)}
    `;
  }

  /*
   * Renderizza immagine del mostro o fallback testuale.
   */
  function renderMonsterImage(src) {
    const fallback = escapeHtml(appState.config.site?.image_fallback_text || 'Immagine non disponibile');

    if (!src) {
      return `<div class="monster-image-fallback">${fallback}</div>`;
    }

    return `
      <img
        class="monster-image"
        src="${escapeAttr(src)}"
        alt="Immagine del mostro"
        loading="lazy"
        onerror="this.replaceWith(Object.assign(document.createElement('div'), {
          className: 'monster-image-fallback',
          textContent: '${escapeAttr(fallback)}'
        }))"
      >
    `;
  }

  /*
   * Renderizza la scheda di un incantesimo.
   */
  function renderSpell(spell) {
    return `
      ${renderHeader(
        'spells',
        spell,
        [spellLevel(spell), spell.scuola].filter(Boolean).join(' · ')
      )}

      ${compactMeta([
        ['Livello', spellLevel(spell)],
        ['Scuola', spell.scuola],
        ['Tempo', spell.tempo_lancio],
        ['Gittata', spell.gittata],
        ['Componenti', spell.componenti],
        ['Durata', spell.durata],
        ['Classi', spell.classi?.join(', ')],
      ])}

      <div class="description">${formatInline(spell.descrizione || '')}</div>
      ${renderRollContextNote(spell)}

      ${renderScalingEntries('Slot superiori', spell.scaling, spell)}
      ${renderSections('Sezioni', spell.sezioni)}
    `;
  }

  /*
   * Segnala incantesimi con danni ripetuti o multi-bersaglio senza automatizzare.
   */
  function renderRollContextNote(spell) {
    const context = analyzeRollContext(spellRollText(spell));

    if (!context.notes.length) return '';

    return `
      <p class="roll-context">
        <strong>Tiri situazionali.</strong>
        Ripeti il tiro ${escapeHtml(context.notes.join(' e '))}, secondo il testo dell'incantesimo.
      </p>
    `;
  }

  /*
   * Raccoglie il testo rilevante di un incantesimo per analisi non invasiva.
   */
  function spellRollText(spell) {
    const sections = Array.isArray(spell?.sezioni) ? spell.sezioni : [];
    const scaling = Array.isArray(spell?.scaling) ? spell.scaling : [];
    const parts = [
      spell?.descrizione || '',
      ...scaling.map((entry) => `${entry?.nome || ''} ${entry?.descrizione || ''}`),
      ...sections.flatMap((section) => [
        section?.titolo || '',
        section?.descrizione || '',
        ...(Array.isArray(section?.righe)
          ? section.righe.map((row) => `${row?.chiave || ''} ${row?.valore || ''}`)
          : []),
        ...(Array.isArray(section?.blocchi)
          ? section.blocchi.map((entry) => `${entry?.nome || ''} ${entry?.descrizione || ''}`)
          : []),
        ...(Array.isArray(section?.voci)
          ? section.voci.map((entry) => `${entry?.nome || ''} ${entry?.descrizione || ''}`)
          : []),
      ]),
    ];

    return parts.filter(Boolean).join('\n');
  }

  /*
   * Renderizza la scheda di un oggetto magico.
   */
  function renderMagicItem(item) {
    return `
      ${renderHeader(
        'magic_items',
        item,
        [item.tipo_base || item.tipo, item.rarita].filter(Boolean).join(' · ')
      )}

      ${compactMeta([
        ['Tipo', item.tipo],
        ['Rarità', item.rarita],
        ['Sintonia', item.richiede_sintonia ? 'Sì' : 'No'],
      ])}

      <div class="description">${formatInline(item.descrizione || '')}</div>

      ${renderEntries('Proprietà', item.proprieta)}
      ${renderSections('Tabelle e sezioni', item.sezioni)}
    `;
  }

  /*
   * Crea una lista compatta di metadati.
   * Scarta automaticamente righe vuote, null, undefined o array vuoti.
   */
  function compactMeta(rows) {
    const list = rows.filter(([, value]) => {
      return (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        !(Array.isArray(value) && !value.length)
      );
    });

    if (!list.length) return '';

    return `
      <ul class="meta-list">
        ${list
          .map(([label, value]) => `
            <li>
              <b>${escapeHtml(label)}:</b> ${escapeHtml(String(value))}
            </li>
          `)
          .join('')}
      </ul>
    `;
  }

  /*
   * Renderizza le sei caratteristiche di un mostro.
   */
  function renderAbilityScores(scores = {}) {
    const labels = {
      forza: 'FOR',
      destrezza: 'DES',
      costituzione: 'COS',
      intelligenza: 'INT',
      saggezza: 'SAG',
      carisma: 'CAR',
    };

    return `
      <div class="stats-row">
        ${Object.entries(labels)
          .map(([key, label]) => {
            const stat = scores[key] || {};

            return `
              <div class="stat">
                <b>${label}</b>
                ${escapeHtml(String(stat.valore ?? '-'))}
                <span>${escapeHtml(formatAbilityModifier(stat.modificatore))}</span>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }

  /*
   * Garantisce che il modificatore sia mostrato tra parentesi.
   */
  function formatAbilityModifier(modifier) {
    if (!modifier) return '';

    const text = String(modifier).trim();

    return text.startsWith('(') && text.endsWith(')')
      ? text
      : `(${text})`;
  }

  /*
   * Renderizza sezioni composte da voci nome + descrizione.
   * Usata per tratti, azioni, reazioni, sezioni di incantesimi, ecc.
   */
  function renderEntries(title, entries) {
    if (!Array.isArray(entries) || entries.length === 0) return '';

    const content = entries.map(renderEntry).filter(Boolean).join('');
    if (!content) return '';

    return `
      <section class="content-section">
        <h3>${escapeHtml(title)}</h3>

        ${content}
      </section>
    `;
  }

  /*
   * Renderizza gli scaling degli incantesimi con controlli extra-slot
   * solo quando il testo descrive un incremento lineare chiaro.
   */
  function renderScalingEntries(title, entries, spell) {
    if (!Array.isArray(entries) || entries.length === 0) return '';

    const content = entries.map((entry) => {
      const scaling = parsePerSlotScaling(entry.descrizione || '', spell);

      return `
        ${renderEntry(entry)}
        ${scaling ? renderScalingControls(scaling) : ''}
      `;
    }).filter(Boolean).join('');

    if (!content) return '';

    return `
      <section class="content-section">
        <h3>${escapeHtml(title)}</h3>
        ${content}
      </section>
    `;
  }

  /*
   * Crea i bottoni rapidi per gli incrementi da slot superiori.
   */
  function renderScalingControls(scaling) {
    const options = [1, 2, 3, 4];

    return `
      <div class="scaling-controls" aria-label="Tira danni a slot superiore">
        <span>Slot superiore</span>
        ${options.map((multiplier) => `
          <button
            type="button"
            data-scaling-roll="${escapeAttr(scalingFormulaForMultiplier(scaling, multiplier))}"
            aria-label="Tira ${escapeAttr(scalingFormulaForMultiplier(scaling, multiplier))} con slot +${multiplier}"
          >+${multiplier}</button>
        `).join('')}
      </div>
    `;
  }

  /*
   * Renderizza una singola voce testuale.
   */
  function renderEntry(entry) {
    if (!entry) return '';

    const name = entry.nome || entry.chiave || '';
    const description = entry.descrizione || entry.valore || '';
    const structuredControls = renderStructuredRollControls(entry);
    const inlineOptions = hasValidStructuredRollData(entry)
      ? { dice: false, attacks: false }
      : {};

    if (!name && !description) return '';

    return `
      <div class="entry">
        ${name ? `<span class="entry-title">${escapeHtml(name)}</span>` : ''}
        ${description ? `<p>${formatInline(description, inlineOptions)}</p>` : ''}
        ${structuredControls}
      </div>
    `;
  }

  /*
   * Mostra controlli basati su dati strutturati validi.
   * Se i dati sono assenti o incompleti, il renderer torna al parser inline.
   */
  function renderStructuredRollControls(entry) {
    const rolls = Array.isArray(entry?.tiri) ? entry.tiri : [];
    const controls = [];
    const recharge = validRecharge(entry?.ricarica);

    if (recharge) {
      controls.push(`
        <button
          class="structured-roll-button"
          type="button"
          data-dice-roll="${escapeAttr(recharge.formula)}"
          aria-label="Tira ${escapeAttr(recharge.formula)} per ${escapeAttr(recharge.testo)}"
        >${escapeHtml(recharge.testo)}</button>
      `);
    }

    rolls.forEach((roll) => {
      if (isValidStructuredAttack(roll)) {
        const damages = roll.danni.filter(isValidStructuredDamage);

        controls.push(`
          <span class="structured-roll-group">
            <span class="structured-roll-label">Colpire</span>
            ${attackRollControls(roll.bonus)}
            ${damages.map((damage) => structuredDamageButton(damage)).join('')}
          </span>
        `);
      }

      if (isValidStructuredSave(roll)) {
        const damages = roll.fallimento.danni.filter(isValidStructuredDamage);

        controls.push(`
          <span class="structured-roll-group">
            <span class="structured-roll-label">CD ${escapeHtml(String(roll.cd))} ${escapeHtml(roll.caratteristica)}</span>
            ${damages.map((damage) => structuredDamageButton(damage)).join('')}
          </span>
        `);
      }
    });

    if (!controls.length) return '';

    return `
      <div class="structured-rolls" aria-label="Tiri strutturati">
        ${controls.join('')}
      </div>
    `;
  }

  function hasValidStructuredRollData(entry) {
    const rolls = Array.isArray(entry?.tiri) ? entry.tiri : [];

    return rolls.some((roll) => isValidStructuredAttack(roll) || isValidStructuredSave(roll));
  }

  function structuredDamageButton(damage) {
    const label = [damage.formula, damage.tipo].filter(Boolean).join(' ');

    return `
      <button
        class="structured-roll-button"
        type="button"
        data-structured-damage-roll="${escapeAttr(damage.formula)}"
        data-structured-roll-label="${escapeAttr(label)}"
        aria-label="Tira danni ${escapeAttr(label)}"
      >${escapeHtml(label)}</button>
    `;
  }

  function isValidStructuredAttack(roll) {
    return (
      roll?.tipo === 'attacco' &&
      Number.isFinite(Number(roll.bonus)) &&
      Array.isArray(roll.danni) &&
      roll.danni.some(isValidStructuredDamage)
    );
  }

  function isValidStructuredSave(roll) {
    return (
      roll?.tipo === 'salvezza' &&
      Number.isFinite(Number(roll.cd)) &&
      Boolean(roll.caratteristica) &&
      Array.isArray(roll.fallimento?.danni) &&
      roll.fallimento.danni.some(isValidStructuredDamage)
    );
  }

  function isValidStructuredDamage(damage) {
    return Boolean(damage?.formula && parseDiceFormula(damage.formula));
  }

  function validRecharge(recharge) {
    if (
      !recharge ||
      recharge.formula !== '1d6' ||
      !Array.isArray(recharge.successo) ||
      !recharge.successo.every((value) => Number.isInteger(value) && value >= 1 && value <= 6)
    ) {
      return null;
    }

    return {
      formula: recharge.formula,
      testo: recharge.testo || `ricarica ${recharge.successo.join('-')}`,
    };
  }

  /*
   * Renderizza sezioni strutturate provenienti dai JSON.
   * Supporta sia blocchi nome/descrizione sia righe tabellari chiave/valore.
   */
  function renderSections(title, sections) {
    if (!Array.isArray(sections) || sections.length === 0) return '';

    const content = sections.map(renderSection).filter(Boolean).join('');
    if (!content) return '';

    return `
      <section class="content-section">
        <h3>${escapeHtml(title)}</h3>
        ${content}
      </section>
    `;
  }

  /*
   * Renderizza una sezione libera o tabellare.
   */
  function renderSection(section) {
    if (!section) return '';

    const rows = Array.isArray(section.righe) ? section.righe : [];
    const blocks = Array.isArray(section.blocchi) ? section.blocchi : [];
    const entries = Array.isArray(section.voci) ? section.voci : [];
    const body = [
      rows.length ? renderTableRows(rows) : '',
      blocks.length ? blocks.map(renderEntry).filter(Boolean).join('') : '',
      entries.length ? entries.map(renderEntry).filter(Boolean).join('') : '',
      section.descrizione ? `<div class="description">${formatInline(section.descrizione)}</div>` : '',
    ].filter(Boolean).join('');

    if (!body) return '';

    return `
      <div class="subsection">
        ${section.titolo ? `<h4>${escapeHtml(section.titolo)}</h4>` : ''}
        ${body}
      </div>
    `;
  }

  /*
   * Renderizza righe chiave/valore come tabella responsive.
   */
  function renderTableRows(rows) {
    const visibleRows = rows.filter((row) => row && (row.chiave || row.valore));
    if (!visibleRows.length) return '';

    return `
      <div class="table-wrap">
        <table class="data-table">
          <tbody>
            ${visibleRows
              .map((row) => `
                <tr>
                  <th scope="row">${formatInline(row.chiave || '', { dice: false })}</th>
                  <td>${formatInline(row.valore || '')}</td>
                </tr>
              `)
              .join('')}
          </tbody>
        </table>
      </div>
    `;
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
            <span class="roll-toggle-label">Dice roller</span>
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
              <button type="button" data-quick-roll="1d${faces}">d${faces}</button>
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
   * Renderizza le azioni leggendarie dei mostri.
   */
  function renderLegendary(legendary) {
    if (!legendary || !Array.isArray(legendary.azioni) || !legendary.azioni.length) {
      return '';
    }

    return `
      <section class="content-section">
        <h3>
          Azioni leggendarie
          ${legendary.utilizzi ? `(${escapeHtml(legendary.utilizzi)})` : ''}
        </h3>

        ${legendary.descrizione_utilizzi
          ? `<div class="description">${formatInline(legendary.descrizione_utilizzi)}</div>`
          : ''
        }

        ${legendary.azioni
          .map((entry) => `
            <div class="entry">
              <span class="entry-title">${escapeHtml(entry.nome || '')}</span>
              <p>${formatInline(entry.descrizione || '')}</p>
            </div>
          `)
          .join('')}
      </section>
    `;
  }

  /*
   * Restituisce l’etichetta leggibile del livello di un incantesimo.
   */
  function spellLevel(spell) {
    if (spell.livello === 0) return 'Trucchetto';
    if (spell.livello === null || spell.livello === undefined) return '';
    return `${spell.livello}° livello`;
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
   * Riconosce scaling lineari del tipo "1d8 per ogni slot".
   * Se trova un dado base compatibile nella descrizione, prepara il totale.
   */
  function parsePerSlotScaling(text, spell) {
    const value = String(text || '');

    if (!/per ogni slot/i.test(value)) return null;

    const dice = findDiceFormulas(value);

    if (dice.length !== 1) return null;

    const increment = dice[0];
    const baseDice = findDiceFormulas(spell?.descrizione || '')
      .filter((token) => token.faces === increment.faces && token.modifier === 0);

    if (baseDice.length !== 1) return null;

    return {
      baseCount: baseDice[0].count,
      incrementCount: increment.count,
      faces: increment.faces,
      modifier: 0,
    };
  }

  /*
   * Formula totale per uno slot lanciato N livelli sopra quello base.
   */
  function scalingFormulaForMultiplier(scaling, multiplier) {
    return formatDiceFormula(
      scaling.baseCount + (scaling.incrementCount * multiplier),
      scaling.faces,
      scaling.modifier
    );
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

  /*
   * Legge i preferiti dal localStorage.
   * Se il JSON è corrotto o assente, restituisce un oggetto vuoto.
   */
  function loadFavorites() {
    try {
      return JSON.parse(localStorage.getItem('dnd-reference:favorites') || '{}');
    } catch {
      return {};
    }
  }

  /*
   * Salva i preferiti nel localStorage.
   */
  function saveFavorites() {
    localStorage.setItem('dnd-reference:favorites', JSON.stringify(appState.favorites));
  }

  /*
   * Controlla se un elemento è nei preferiti.
   */
  function isFavorite(section, id) {
    return Boolean(appState.favorites[section]?.includes(id));
  }

  /*
   * Aggiunge o rimuove un elemento dai preferiti.
   */
  function toggleFavorite(section, id) {
    const current = new Set(appState.favorites[section] || []);

    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }

    appState.favorites[section] = Array.from(current);
    saveFavorites();
  }

  /*
   * Normalizza testo per la ricerca:
   * - minuscolo
   * - rimozione accenti
   */
  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /*
   * Formatta testo inline semplice e, quando richiesto, rende cliccabili
   * le formule di dado riconosciute dal parser leggero.
   *
   * Supporta:
   * **grassetto**
   * *corsivo*
   *
   * Prima esegue escapeHtml per evitare inserimento di HTML non sicuro.
   */
  function formatInline(text, options = {}) {
    const withDice = options.dice !== false;
    const withAttacks = options.attacks !== false;
    const value = String(text);
    const formatted = formatMarkdownInline(value);
    const withAttackRolls = withAttacks ? enrichAttackRolls(formatted) : formatted;

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

    return `<span class="attack-roll" aria-label="Tiro per colpire ${escapeAttr(normalized)}"><button class="attack-roll-main" type="button" data-attack-roll="${escapeAttr(String(modifier))}" data-attack-mode="normal" aria-label="Tira per colpire ${escapeAttr(normalized)}">${escapeHtml(normalized)}</button><button class="attack-roll-mode" type="button" data-attack-roll="${escapeAttr(String(modifier))}" data-attack-mode="advantage" aria-label="Tira per colpire ${escapeAttr(normalized)} con vantaggio">V</button><button class="attack-roll-mode" type="button" data-attack-roll="${escapeAttr(String(modifier))}" data-attack-mode="disadvantage" aria-label="Tira per colpire ${escapeAttr(normalized)} con svantaggio">S</button></span>`;
  }

  /*
   * Rende interattivi i bonus dopo "Tiro per colpire".
   */
  function enrichAttackRolls(html) {
    const pattern = /((?:<em>)?Tiro per colpire[\s\S]{0,90}?:?(?:<\/em>)?\s*)([+-]\d+)/gi;

    return String(html).replace(pattern, (match, prefix, modifier, offset, fullText) => {
      if (isInsideHtmlTag(fullText, offset)) return match;

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

  /*
   * Escapa caratteri HTML per prevenire injection nel markup.
   */
  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
    }[char]));
  }

  /*
   * Escapa valori destinati agli attributi HTML.
   * Include anche l’apostrofo.
   */
  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, '&#39;');
  }

  /*
   * Mostra il template di caricamento.
   */
  function showLoading() {
    setView('home');
    views.home.innerHTML = document.querySelector('#loading-template').innerHTML;
  }

  /*
   * Mostra il template di errore.
   */
  function showError() {
    setView('home');
    views.home.innerHTML = document.querySelector('#error-template').innerHTML;
  }
})();
