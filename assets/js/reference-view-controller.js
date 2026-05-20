import { SECTION_META } from './config/sections.js';
import {
  createFilterOptions,
  filterCatalogItems,
  sectionSummaryLine,
} from './catalog.js?v=20260520-starting2';

export function createReferenceViewController({
  appState,
  views,
  escapeAttr,
  escapeHtml,
  legacyClassId,
  parseHash,
  isFavorite,
  toggleFavorite,
  spellLevel,
  renderDetailContent,
  renderCharacterSheet,
  applyClassToCharacterSheet,
  saveCharacterSheet,
  addEquipmentToCharacterSheet,
  addEquipmentItemToCharacterSheet,
  addSpellToCharacterSheet,
  addMagicItemToCharacterSheet,
  addReferenceToCharacterSheet,
  applySpeciesToCharacterSheet,
  applyBackgroundToCharacterSheet,
  applyLanguageToCharacterSheet,
}) {
  function renderRoute() {
    const route = parseHash(location.hash);
    appState.currentSection = route.section || null;

    if (!route.section) {
      renderHome();
      return;
    }

    const classId = route.section === 'rules' ? legacyClassId(route.id) : '';
    if (classId) {
      location.hash = `#/classes/${encodeURIComponent(classId)}`;
      return;
    }

    if (!SECTION_META[route.section]) {
      location.hash = '';
      return;
    }

    if (route.section === 'character_sheet') {
      if (!route.id) {
        location.hash = '#/character_sheet/overview';
        return;
      }

      renderCharacterSheet(route.id || appState.characterSheetTab);
      return;
    }

    if (route.id) {
      renderDetail(route.section, route.id);
    } else {
      renderList(route.section);
    }
  }

  function setView(name) {
    Object.entries(views).forEach(([key, node]) => {
      node.hidden = key !== name;

      if (key !== name) {
        node.innerHTML = '';
      }
    });
  }

  function renderHome() {
    setView('home');

    const labels = appState.config.labels;

    views.home.innerHTML = `
      <div class="home-grid">
        ${Object.keys(SECTION_META)
          .map((section) => sectionHomeCard(section, labels[section], homeCardSubtitle(section)))
          .join('')}
      </div>
    `;
  }

  function homeCardSubtitle(section) {
    if (SECTION_META[section]?.type === 'tool') {
      return appState.characterSheet.name || 'Strumento locale';
    }

    return `${appState.data[section].length} elementi disponibili`;
  }

  function sectionHomeCard(section, label, subtitle) {
    return `
      <a class="home-card" href="#/${section}">
        <strong>${SECTION_META[section].icon} ${escapeHtml(label)}</strong>
        <span>${escapeHtml(subtitle)}</span>
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
    return filterCatalogItems({
      section,
      items: appState.data[section],
      searchTerm: appState.searchTerm,
      filter: appState.filters[section],
      showOnlyFavorites: appState.showOnlyFavorites,
      isFavorite,
    });
  }

  function filterControl(section) {
    const options = createFilterOptions(section, appState.data, spellLevel);

    if (!options.length) return '';

    const labels = {
      monsters: 'Tutti i GS',
      spells: 'Tutti i livelli',
      classes: 'Tutte le classi',
      species: 'Tutte le specie',
      backgrounds: 'Tutte le caratteristiche',
      equipment: 'Tutte le categorie',
      feats: 'Tutte le categorie',
      languages: 'Tutte le categorie',
      magic_items: 'Tutte le rarità',
      rules: 'Tutte le categorie',
      rules_glossary: 'Tutti i descrittori',
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

  function listItem(section, item) {
    return `
      <a class="list-item" href="#/${section}/${encodeURIComponent(item.id)}">
        <strong>${escapeHtml(item.nome || 'Senza nome')}</strong>
        <small>${escapeHtml(sectionSummaryLine(section, item, spellLevel))}</small>
      </a>
    `;
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

    bindDetailSheetActions(section, item);
  }

  function bindDetailSheetActions(section, item) {
    views.detail.querySelector('[data-sheet-use-class]')?.addEventListener('click', () => {
      applyClassToCharacterSheet(item);
      saveCharacterSheet();
      location.hash = '#/character_sheet/overview';
    });

    views.detail.querySelector('[data-sheet-add-detail-spell]')?.addEventListener('click', () => {
      addSpellToCharacterSheet(item.id);
      location.hash = '#/character_sheet/spells';
    });

    views.detail.querySelector('[data-sheet-add-magic-item]')?.addEventListener('click', () => {
      addMagicItemToCharacterSheet(item);
      location.hash = '#/character_sheet/inventory';
    });

    views.detail.querySelector('[data-sheet-add-equipment-item]')?.addEventListener('click', () => {
      addEquipmentItemToCharacterSheet(item);
      location.hash = '#/character_sheet/inventory';
    });

    views.detail.querySelector('[data-sheet-use-species]')?.addEventListener('click', () => {
      applySpeciesToCharacterSheet(item);
      location.hash = '#/character_sheet/overview';
    });

    views.detail.querySelector('[data-sheet-use-background]')?.addEventListener('click', () => {
      applyBackgroundToCharacterSheet(item);
      location.hash = '#/character_sheet/overview';
    });

    views.detail.querySelector('[data-sheet-use-language]')?.addEventListener('click', () => {
      applyLanguageToCharacterSheet(item);
      location.hash = '#/character_sheet/overview';
    });

    views.detail.querySelector('[data-sheet-add-reference]')?.addEventListener('click', () => {
      addReferenceToCharacterSheet(section, item);
      location.hash = '#/character_sheet/notes';
    });

    views.detail.querySelectorAll('[data-sheet-add-equipment-row]').forEach((node) => {
      node.addEventListener('click', (event) => {
        const sectionIndex = Number(event.currentTarget.dataset.sheetSectionIndex);
        const rowIndex = Number(event.currentTarget.dataset.sheetRowIndex);
        const sourceSection = item.sezioni?.[sectionIndex];
        const row = sourceSection?.righe?.[rowIndex];

        addEquipmentToCharacterSheet(item, row, sourceSection?.titolo || '');
        location.hash = '#/character_sheet/inventory';
      });
    });
  }

  function getSiblingLinks(section, id) {
    const items = getFilteredItems(section);
    const index = items.findIndex((item) => item.id === id);

    return {
      prev: items[index - 1] || null,
      next: items[index + 1] || null,
    };
  }

  return {
    renderRoute,
    setView,
    renderHome,
    renderList,
    renderListResults,
    renderDetail,
    getFilteredItems,
  };
}

export function renderReferenceSheetActions({ section, item, escapeAttr }) {
  if (section === 'classes') {
    return `
      <div class="sheet-actions">
        <button class="button button--primary" type="button" data-sheet-use-class="${escapeAttr(item.id)}">Usa per scheda</button>
        <a class="button button--ghost" href="#/character_sheet">Apri scheda</a>
      </div>
    `;
  }

  if (section === 'spells') {
    return `
      <div class="sheet-actions">
        <button class="button button--primary" type="button" data-sheet-add-detail-spell="${escapeAttr(item.id)}">Aggiungi alla scheda</button>
        <a class="button button--ghost" href="#/character_sheet/spells">Incantesimi scheda</a>
      </div>
    `;
  }

  if (section === 'magic_items') {
    return `
      <div class="sheet-actions">
        <button class="button button--primary" type="button" data-sheet-add-magic-item="${escapeAttr(item.id)}">Aggiungi all'inventario</button>
        <a class="button button--ghost" href="#/character_sheet/inventory">Inventario scheda</a>
      </div>
    `;
  }

  if (section === 'equipment') {
    return `
      <div class="sheet-actions">
        <button class="button button--primary" type="button" data-sheet-add-equipment-item="${escapeAttr(item.id)}">Aggiungi all'inventario</button>
        <a class="button button--ghost" href="#/character_sheet/inventory">Inventario scheda</a>
      </div>
    `;
  }

  if (section === 'species') {
    return `
      <div class="sheet-actions">
        <button class="button button--primary" type="button" data-sheet-use-species="${escapeAttr(item.id)}">Usa per scheda</button>
        <a class="button button--ghost" href="#/character_sheet/overview">Apri scheda</a>
      </div>
    `;
  }

  if (section === 'backgrounds') {
    return `
      <div class="sheet-actions">
        <button class="button button--primary" type="button" data-sheet-use-background="${escapeAttr(item.id)}">Usa per scheda</button>
        <a class="button button--ghost" href="#/character_sheet/overview">Apri scheda</a>
      </div>
    `;
  }

  if (section === 'languages') {
    return `
      <div class="sheet-actions">
        <button class="button button--primary" type="button" data-sheet-use-language="${escapeAttr(item.id)}">Aggiungi alla scheda</button>
        <a class="button button--ghost" href="#/character_sheet/overview">Apri scheda</a>
      </div>
    `;
  }

  if (['monsters', 'feats', 'rules', 'rules_glossary'].includes(section)) {
    return `
      <div class="sheet-actions">
        <button class="button button--primary" type="button" data-sheet-add-reference="${escapeAttr(item.id)}">Collega alla scheda</button>
        <a class="button button--ghost" href="#/character_sheet/notes">Riferimenti scheda</a>
      </div>
    `;
  }

  return '';
}
