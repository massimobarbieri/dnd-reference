import { formatDisplayValue } from './display-values.js?v=20260520-starting2';

export function createReferenceSectionRenderer({
  appState,
  escapeAttr,
  escapeHtml,
  findDiceFormulas,
  formatDiceFormula,
  formatInline,
  normalizeText,
}) {
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

  function renderEntry(entry) {
    if (!entry) return '';

    const name = formatDisplayValue(entry.nome || entry.chiave || '');
    const description = formatDisplayValue(entry.descrizione || entry.valore || '');

    if (!name && !description) return '';

    return `
      <div class="entry">
        ${name ? `<span class="entry-title">${escapeHtml(name)}</span>` : ''}
        ${description ? `<p>${formatInline(description)}</p>` : ''}
      </div>
    `;
  }

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

  function renderSection(section) {
    if (!section) return '';

    const rows = Array.isArray(section.righe) ? section.righe : [];
    const blocks = Array.isArray(section.blocchi) ? section.blocchi : [];
    const entries = Array.isArray(section.voci) ? section.voci : [];
    const columns = Array.isArray(section.colonne) ? section.colonne : [];
    const body = [
      rows.length ? renderSectionRows(section, rows, columns) : '',
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

  function renderSectionRows(section, rows, columns) {
    if (isClassSpellListSection(section)) {
      return renderClassSpellListTables(rows, columns);
    }

    return renderTableRows(rows, columns);
  }

  function isClassSpellListSection(section) {
    return (
      String(section?.titolo || '').startsWith('Lista degli incantesimi da ') &&
      Array.isArray(section?.righe) &&
      section.righe.some((row) => Object.hasOwn(row || {}, 'Livello') && Object.hasOwn(row || {}, 'Incantesimo'))
    );
  }

  function renderClassSpellListTables(rows, columns) {
    const visibleRows = rows.filter((row) => row && Object.keys(row).length);
    const tableColumns = normalizeTableColumns(visibleRows, columns).filter((column) => column !== 'Livello');
    const groups = groupRowsBySpellLevel(visibleRows);

    if (!groups.length) return '';

    return `
      <div class="spell-level-groups">
        ${groups.map((group) => `
          <section class="spell-level-group">
            <h5>${escapeHtml(spellLevelTableHeading(group.level))}</h5>
            ${renderMatrixRows(group.rows, tableColumns, 'data-table-spell-list')}
          </section>
        `).join('')}
      </div>
    `;
  }

  function groupRowsBySpellLevel(rows) {
    const groups = [];
    const byLevel = new Map();

    rows.forEach((row) => {
      const level = String(row.Livello || '').trim();

      if (!byLevel.has(level)) {
        const group = { level, rows: [] };
        byLevel.set(level, group);
        groups.push(group);
      }

      byLevel.get(level).rows.push(row);
    });

    return groups;
  }

  function spellLevelTableHeading(level) {
    const text = String(level || '').trim();
    if (normalizeText(text) === 'trucchetto') return 'Trucchetti';

    const number = Number(text);
    if (Number.isFinite(number)) return `${number}° livello`;

    return text || 'Livello non indicato';
  }

  function renderTableRows(rows, columns = []) {
    const visibleRows = rows.filter((row) => row && Object.keys(row).length);
    if (!visibleRows.length) return '';

    const matrixColumns = normalizeTableColumns(visibleRows, columns);
    if (matrixColumns.length) {
      return renderMatrixRows(visibleRows, matrixColumns);
    }

    const keyColumnClass = tableColumnWrapClass(shouldWrapTableColumn(visibleRows, 'chiave'));
    const valueColumnClass = tableColumnWrapClass(shouldWrapTableColumn(visibleRows, 'valore'));

    return `
      <div class="table-wrap" tabindex="0" aria-label="Tabella scorrevole">
        <table class="data-table data-table-key-value">
          <tbody>
            ${visibleRows
              .map((row) => `
                <tr>
                  <th scope="row"${keyColumnClass}>${formatInline(formatDisplayValue(row.chiave || ''), { dice: false })}</th>
                  <td${valueColumnClass}>${formatInline(formatDisplayValue(row.valore || ''))}</td>
                </tr>
              `)
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function normalizeTableColumns(rows, columns) {
    const explicitColumns = Array.isArray(columns)
      ? columns.map((column) => String(column || '').trim()).filter(Boolean)
      : [];

    if (explicitColumns.length) return explicitColumns;

    const inferredColumns = [];
    rows.forEach((row) => {
      Object.keys(row || {}).forEach((key) => {
        if (key !== 'chiave' && key !== 'valore' && !inferredColumns.includes(key)) {
          inferredColumns.push(key);
        }
      });
    });

    return inferredColumns.length > 1 ? inferredColumns : [];
  }

  function renderMatrixRows(rows, columns, tableClass = '') {
    const className = ['data-table', 'data-table-matrix', tableClass].filter(Boolean).join(' ');
    const wrapColumns = columns.map((column) => shouldWrapTableColumn(rows, column));

    return `
      <div class="table-wrap table-wrap-wide" tabindex="0" aria-label="Tabella scorrevole">
        <table class="${escapeAttr(className)}" data-column-count="${columns.length}">
          <thead>
            <tr>
              ${columns.map((column, index) => `<th scope="col"${tableColumnWrapClass(wrapColumns[index])}>${formatInline(displayTableColumn(column), { dice: false })}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map((row) => `
                <tr>
                  ${columns
                    .map((column, index) => {
                      const className = tableColumnWrapClass(wrapColumns[index]);
                      const tag = index === 0 ? `th scope="row"${className}` : `td${className}`;
                      const closeTag = index === 0 ? 'th' : 'td';
                      return `<${tag}>${renderTableCell(row[column] ?? '', column)}</${closeTag}>`;
                    })
                    .join('')}
                </tr>
              `)
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function shouldWrapTableColumn(rows, column, threshold = 20) {
    return rows.some((row) => tableCellTextLength(row?.[column]) > threshold);
  }

  function tableColumnWrapClass(shouldWrap) {
    return shouldWrap ? ' class="data-table-cell-wrap"' : '';
  }

  function tableCellTextLength(value) {
    if (Array.isArray(value)) {
      return value.map(tableCellTextLength).join(' ').length;
    }

    if (value && typeof value === 'object') {
      return Object.values(value).map(tableCellTextLength).join(' ').length;
    }

    return String(value ?? '').trim().length;
  }

  function renderTableCell(value, column) {
    if (normalizeText(column) !== 'incantesimo') {
      return formatInline(formatDisplayValue(value), { dice: false });
    }

    const spell = spellByName(value);

    if (!spell) {
      return formatInline(formatDisplayValue(value), { dice: false });
    }

    return `<a class="table-spell-link" href="#/spells/${encodeURIComponent(spell.id)}">${escapeHtml(formatDisplayValue(value))}</a>`;
  }

  function spellByName(name) {
    const normalizedName = normalizeText(formatDisplayValue(name)).trim();

    if (!normalizedName) return null;

    return appState.data.spells.find((spell) => normalizeText(spell.nome).trim() === normalizedName) || null;
  }

  function displayTableColumn(column) {
    return String(column || '').replace(/\s+2$/, '');
  }

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

  function scalingFormulaForMultiplier(scaling, multiplier) {
    return formatDiceFormula(
      scaling.baseCount + (scaling.incrementCount * multiplier),
      scaling.faces,
      scaling.modifier
    );
  }

  return {
    renderEntries,
    renderSections,
    renderScalingEntries,
  };
}
