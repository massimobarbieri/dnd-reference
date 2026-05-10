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
  };

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

      ${renderEntries('Slot superiori', spell.scaling)}
      ${renderSections('Sezioni', spell.sezioni)}
    `;
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
   * Renderizza una singola voce testuale.
   */
  function renderEntry(entry) {
    if (!entry) return '';

    const name = entry.nome || entry.chiave || '';
    const description = entry.descrizione || entry.valore || '';

    if (!name && !description) return '';

    return `
      <div class="entry">
        ${name ? `<span class="entry-title">${escapeHtml(name)}</span>` : ''}
        ${description ? `<p>${formatInline(description)}</p>` : ''}
      </div>
    `;
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
                  <th scope="row">${formatInline(row.chiave || '')}</th>
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
   * Formatta testo inline semplice.
   *
   * Supporta:
   * **grassetto**
   * *corsivo*
   *
   * Prima esegue escapeHtml per evitare inserimento di HTML non sicuro.
   */
  function formatInline(text) {
    return escapeHtml(String(text))
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
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
