/*
 * D&D Reference - applicazione statica per consultare mostri, incantesimi e oggetti magici.
 * Il codice non usa framework: questo rende il progetto facile da modificare e pubblicare
 * su qualunque hosting statico. I preferiti sono salvati nel localStorage del browser.
 */
(() => {
  'use strict';

  const appState = {
    config: null,
    data: { monsters: [], spells: [], magic_items: [] },
    monsterImages: new Map(),
    favorites: loadFavorites(),
    currentSection: null,
    searchTerm: '',
    filters: { monsters: '', spells: '', magic_items: '' },
    showOnlyFavorites: false,
  };

  const SECTION_META = {
    monsters: { icon: '🐉', singular: 'mostro', titleKey: 'monsters' },
    spells: { icon: '✨', singular: 'incantesimo', titleKey: 'spells' },
    magic_items: { icon: '🗡️', singular: 'oggetto magico', titleKey: 'magic_items' },
  };

  const views = {
    home: document.querySelector('#home-view'),
    list: document.querySelector('#list-view'),
    detail: document.querySelector('#detail-view'),
  };

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('hashchange', renderRoute);

  async function init() {
    showLoading();
    try {
      appState.config = await loadConfig();
      applyConfigToPage(appState.config);

      const paths = appState.config.paths;
      const [monsters, spells, magicItems, monsterImageYaml] = await Promise.all([
        fetchJson(paths.monsters),
        fetchJson(paths.spells),
        fetchJson(paths.magic_items),
        fetchText(paths.monster_images).catch(() => ''),
      ]);

      appState.data.monsters = normalizeArray(monsters);
      appState.data.spells = normalizeArray(spells);
      appState.data.magic_items = normalizeArray(magicItems);
      appState.monsterImages = parseMonsterImages(monsterImageYaml);
      renderRoute();
    } catch (error) {
      console.error(error);
      showError();
    }
  }

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Errore caricamento JSON: ${path}`);
    return response.json();
  }

  async function fetchText(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Errore caricamento testo: ${path}`);
    return response.text();
  }

  function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  /* Parser YAML minimale per config.yml: supporta blocchi a due livelli con valori scalari. */
  async function loadConfig() {
    const text = await fetchText('config.yml');
    const config = {};
    let currentBlock = null;

    text.split(/\r?\n/).forEach((rawLine) => {
      const line = rawLine.replace(/#.*$/, '').trimEnd();
      if (!line.trim()) return;

      if (!line.startsWith(' ') && line.endsWith(':')) {
        currentBlock = line.slice(0, -1).trim();
        config[currentBlock] = {};
        return;
      }

      const match = line.match(/^\s{2}([\w_]+):\s*(.*)$/);
      if (match && currentBlock) {
        config[currentBlock][match[1]] = parseYamlScalar(match[2]);
      }
    });

    return config;
  }

  function parseYamlScalar(value) {
    const trimmed = value.trim();
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
    return trimmed.replace(/^['"]|['"]$/g, '');
  }

  /* Parser dedicato a monster-images.yml, strutturato come lista di id/nome/immagine. */
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

  function applyConfigToPage(config) {
    document.title = config.site?.title || 'D&D Reference';
    document.querySelector('#site-title').textContent = config.site?.title || 'D&D Reference';
    document.querySelector('#site-subtitle').textContent = config.site?.subtitle || '';
  }

  function renderRoute() {
    const route = parseHash();
    appState.currentSection = route.section || null;

    if (!route.section) {
      renderHome();
      return;
    }

    if (!SECTION_META[route.section]) {
      location.hash = '';
      return;
    }

    if (route.id) renderDetail(route.section, route.id);
    else renderList(route.section);
  }

  function parseHash() {
    const clean = location.hash.replace(/^#\/?/, '');
    const [section, id] = clean.split('/');
    return { section, id: id ? decodeURIComponent(id) : null };
  }

  function setView(name) {
    Object.entries(views).forEach(([key, node]) => {
      node.hidden = key !== name;
      if (key !== name) node.innerHTML = '';
    });
  }

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

  function sectionHomeCard(section, label, count) {
    return `
      <a class="home-card" href="#/${section}">
        <strong>${SECTION_META[section].icon} ${escapeHtml(label)}</strong>
        <span>${count} elementi disponibili</span>
      </a>
    `;
  }

  function renderList(section) {
    setView('list');
    const labels = appState.config.labels;
    const title = labels[section] || section;

    views.list.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-row">
          <a class="button button--ghost" href="#/">Home</a>
          <input id="search-input" class="search" type="search" value="${escapeAttr(appState.searchTerm)}" placeholder="${escapeAttr(labels.search_placeholder)}" aria-label="Cerca">
          ${filterControl(section)}
          <button id="favorites-toggle" class="button" type="button" aria-pressed="${appState.showOnlyFavorites}">${labels.favorites}</button>
        </div>
      </div>
      <div class="section-title">
        <h2>${escapeHtml(title)}</h2>
        <span id="result-count" class="count"></span>
      </div>
      <div id="item-list" class="item-list"></div>
    `;

    views.list.querySelector('#search-input').addEventListener('input', (event) => {
      appState.searchTerm = event.target.value;
      renderListResults(section);
    });

    views.list.querySelector('#section-filter')?.addEventListener('change', (event) => {
      appState.filters[section] = event.target.value;
      renderListResults(section);
    });

    views.list.querySelector('#favorites-toggle').addEventListener('click', (event) => {
      appState.showOnlyFavorites = !appState.showOnlyFavorites;
      event.currentTarget.setAttribute('aria-pressed', String(appState.showOnlyFavorites));
      renderListResults(section);
    });

    renderListResults(section);
  }

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

  function getFilteredItems(section) {
    const term = normalizeText(appState.searchTerm);
    const filter = appState.filters[section];
    return appState.data[section]
      .filter((item) => !appState.showOnlyFavorites || isFavorite(section, item.id))
      .filter((item) => matchesSectionFilter(section, item, filter))
      .filter((item) => !term || normalizeText(searchableText(section, item)).includes(term))
      .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'it'));
  }

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
        ${options.map((option) => `<option value="${escapeAttr(option.value)}"${option.value === appState.filters[section] ? ' selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}
      </select>
    `;
  }

  function filterOptions(section) {
    if (section === 'monsters') {
      return uniqueValues(appState.data.monsters, 'grado_sfida')
        .sort((a, b) => challengeRatingValue(a) - challengeRatingValue(b))
        .map((value) => ({ value, label: `GS ${value}` }));
    }

    if (section === 'spells') {
      return uniqueValues(appState.data.spells, 'livello')
        .sort((a, b) => Number(a) - Number(b))
        .map((value) => ({ value: String(value), label: spellLevel({ livello: Number(value) }) }));
    }

    return uniqueValues(appState.data.magic_items, 'rarita')
      .sort((a, b) => a.localeCompare(b, 'it'))
      .map((value) => ({ value, label: capitalizeFirst(value) }));
  }

  function matchesSectionFilter(section, item, filter) {
    if (!filter) return true;
    if (section === 'monsters') return String(item.grado_sfida || '') === filter;
    if (section === 'spells') return String(item.livello ?? '') === filter;
    return String(item.rarita || '') === filter;
  }

  function uniqueValues(items, key) {
    return Array.from(new Set(items.map((item) => item[key]).filter((value) => value !== null && value !== undefined && value !== '')))
      .map(String);
  }

  function challengeRatingValue(value) {
    const text = String(value);
    if (text.includes('/')) {
      const [numerator, denominator] = text.split('/').map(Number);
      return numerator / denominator;
    }
    return Number(text);
  }

  function capitalizeFirst(value) {
    const text = String(value);
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
  }

  function searchableText(section, item) {
    if (section === 'monsters') return [item.nome, item.tipo, item.dimensione, item.gruppo, item.grado_sfida].join(' ');
    if (section === 'spells') return [item.nome, item.scuola, item.classi?.join(' '), item.descrizione, item.livello].join(' ');
    return [item.nome, item.tipo, item.tipo_base, item.rarita, item.descrizione].join(' ');
  }

  function listItem(section, item) {
    return `
      <a class="list-item" href="#/${section}/${encodeURIComponent(item.id)}">
        <strong>${escapeHtml(item.nome || 'Senza nome')}</strong>
        <small>${escapeHtml(summaryLine(section, item))}</small>
      </a>
    `;
  }

  function summaryLine(section, item) {
    if (section === 'monsters') return [item.tipo, item.dimensione, item.grado_sfida ? `GS ${item.grado_sfida}` : null].filter(Boolean).join(' · ');
    if (section === 'spells') return [spellLevel(item), item.scuola, item.tempo_lancio].filter(Boolean).join(' · ');
    return [item.tipo_base || item.tipo, item.rarita, item.richiede_sintonia ? 'sintonia' : null].filter(Boolean).join(' · ');
  }

  function renderDetail(section, id) {
    const item = appState.data[section].find((entry) => entry.id === id);
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

    document.querySelector('#favorite-detail').addEventListener('click', () => {
      toggleFavorite(section, item.id);
      renderDetail(section, id);
    });
  }

  function getSiblingLinks(section, id) {
    const items = getFilteredItems(section);
    const index = items.findIndex((item) => item.id === id);
    return { prev: items[index - 1] || null, next: items[index + 1] || null };
  }

  function renderDetailContent(section, item) {
    if (section === 'monsters') return renderMonster(item);
    if (section === 'spells') return renderSpell(item);
    return renderMagicItem(item);
  }

  function renderHeader(section, item, kicker) {
    const pressed = isFavorite(section, item.id);
    return `
      <header class="detail-header">
        <div>
          <h2 class="detail-title">${escapeHtml(item.nome)}</h2>
          <p class="detail-kicker">${escapeHtml(kicker || '')}</p>
        </div>
        <button id="favorite-detail" class="button favorite-btn" type="button" aria-pressed="${pressed}">${pressed ? '★' : '☆'}</button>
      </header>
    `;
  }

  function renderMonster(monster) {
    const image = appState.monsterImages.get(monster.id)?.immagine;
    const showImages = appState.config.site?.show_monster_images !== false;
    return `
      <div class="monster-hero">
        <div>
          ${renderHeader('monsters', monster, [monster.dimensione, monster.tipo, monster.allineamento].filter(Boolean).join(' · '))}
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
        ['Abilità', monster.abilita], ['Resistenze', monster.resistenze], ['Immunità danni', monster.immunita_danni],
        ['Immunità condizioni', monster.immunita_condizione], ['Vulnerabilità', monster.vulnerabilita], ['Attrezzatura', monster.attrezzatura],
      ])}
      ${renderEntries('Tratti', monster.tratti)}
      ${renderEntries('Azioni', monster.azioni)}
      ${renderEntries('Azioni bonus', monster.azioni_bonus)}
      ${renderEntries('Reazioni', monster.reazioni)}
      ${renderLegendary(monster.azioni_leggendarie)}
    `;
  }

  function renderMonsterImage(src) {
    const fallback = escapeHtml(appState.config.site?.image_fallback_text || 'Immagine non disponibile');
    if (!src) return `<div class="monster-image-fallback">${fallback}</div>`;
    return `<img class="monster-image" src="${escapeAttr(src)}" alt="Immagine del mostro" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'), {className: 'monster-image-fallback', textContent: '${escapeAttr(fallback)}'}))">`;
  }

  function renderSpell(spell) {
    return `
      ${renderHeader('spells', spell, [spellLevel(spell), spell.scuola].filter(Boolean).join(' · '))}
      ${compactMeta([
        ['Livello', spellLevel(spell)], ['Scuola', spell.scuola], ['Tempo', spell.tempo_lancio], ['Gittata', spell.gittata],
        ['Componenti', spell.componenti], ['Durata', spell.durata], ['Classi', spell.classi?.join(', ')],
      ])}
      <div class="description">${formatInline(spell.descrizione || '')}</div>
      ${renderEntries('Slot superiori', spell.scaling)}
      ${renderEntries('Sezioni', spell.sezioni)}
    `;
  }

  function renderMagicItem(item) {
    return `
      ${renderHeader('magic_items', item, [item.tipo_base || item.tipo, item.rarita].filter(Boolean).join(' · '))}
      ${compactMeta([
        ['Tipo', item.tipo], ['Rarità', item.rarita], ['Sintonia', item.richiede_sintonia ? 'Sì' : 'No'],
        ['Proprietà', Array.isArray(item.proprieta) ? item.proprieta.join(', ') : item.proprieta],
      ])}
      <div class="description">${formatInline(item.descrizione || '')}</div>
      ${renderEntries('Sezioni', item.sezioni)}
    `;
  }

  function compactMeta(rows) {
    const list = rows.filter(([, value]) => value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && !value.length));
    if (!list.length) return '';
    return `<ul class="meta-list">${list.map(([label, value]) => `<li><b>${escapeHtml(label)}:</b> ${escapeHtml(String(value))}</li>`).join('')}</ul>`;
  }

  function renderAbilityScores(scores = {}) {
    const labels = { forza: 'FOR', destrezza: 'DES', costituzione: 'COS', intelligenza: 'INT', saggezza: 'SAG', carisma: 'CAR' };
    return `<div class="stats-row">${Object.entries(labels).map(([key, label]) => {
      const stat = scores[key] || {};
      return `<div class="stat"><b>${label}</b>${escapeHtml(String(stat.valore ?? '-'))} <span>${escapeHtml(stat.modificatore || '')}</span></div>`;
    }).join('')}</div>`;
  }

  function renderEntries(title, entries) {
    if (!Array.isArray(entries) || entries.length === 0) return '';
    return `
      <section class="content-section">
        <h3>${escapeHtml(title)}</h3>
        ${entries.map((entry) => `<div class="entry"><span class="entry-title">${escapeHtml(entry.nome || '')}</span>${entry.descrizione ? `<p>${formatInline(entry.descrizione)}</p>` : ''}</div>`).join('')}
      </section>
    `;
  }

  function renderLegendary(legendary) {
    if (!legendary || !Array.isArray(legendary.azioni) || !legendary.azioni.length) return '';
    return `
      <section class="content-section">
        <h3>Azioni leggendarie ${legendary.utilizzi ? `(${escapeHtml(legendary.utilizzi)})` : ''}</h3>
        ${legendary.descrizione_utilizzi ? `<div class="description">${formatInline(legendary.descrizione_utilizzi)}</div>` : ''}
        ${legendary.azioni.map((entry) => `<div class="entry"><span class="entry-title">${escapeHtml(entry.nome || '')}</span><p>${formatInline(entry.descrizione || '')}</p></div>`).join('')}
      </section>
    `;
  }

  function spellLevel(spell) {
    if (spell.livello === 0) return 'Trucchetto';
    if (spell.livello === null || spell.livello === undefined) return '';
    return `${spell.livello}° livello`;
  }

  function loadFavorites() {
    try { return JSON.parse(localStorage.getItem('dnd-reference:favorites') || '{}'); }
    catch { return {}; }
  }

  function saveFavorites() {
    localStorage.setItem('dnd-reference:favorites', JSON.stringify(appState.favorites));
  }

  function isFavorite(section, id) {
    return Boolean(appState.favorites[section]?.includes(id));
  }

  function toggleFavorite(section, id) {
    const current = new Set(appState.favorites[section] || []);
    current.has(id) ? current.delete(id) : current.add(id);
    appState.favorites[section] = Array.from(current);
    saveFavorites();
  }

  function normalizeText(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function formatInline(text) {
    return escapeHtml(String(text)).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, '&#39;');
  }

  function showLoading() {
    setView('home');
    views.home.innerHTML = document.querySelector('#loading-template').innerHTML;
  }

  function showError() {
    setView('home');
    views.home.innerHTML = document.querySelector('#error-template').innerHTML;
  }
})();
