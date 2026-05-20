export function createCharacterSheetFields({ escapeAttr, escapeHtml }) {
  function sheetField(key, label, value) {
    return `
      <label class="sheet-field">
        <span>${escapeHtml(label)}</span>
        <input type="text" value="${escapeAttr(value || '')}" data-sheet-field="${escapeAttr(key)}">
      </label>
    `;
  }

  function sheetNumberField(key, label, value, min, max) {
    return `
      <label class="sheet-field">
        <span>${escapeHtml(label)}</span>
        <input
          type="number"
          value="${escapeAttr(String(value ?? 0))}"
          ${min !== undefined ? `min="${escapeAttr(String(min))}"` : ''}
          ${max !== undefined ? `max="${escapeAttr(String(max))}"` : ''}
          data-sheet-number="${escapeAttr(key)}"
        >
      </label>
    `;
  }

  function sheetSelect(key, label, value, options) {
    return `
      <label class="sheet-field">
        <span>${escapeHtml(label)}</span>
        <select data-sheet-field="${escapeAttr(key)}">
          ${options.map((option) => `
            <option value="${escapeAttr(option.value)}"${option.selected || option.value === value ? ' selected' : ''}>${escapeHtml(option.label)}</option>
          `).join('')}
        </select>
      </label>
    `;
  }

  function sheetTextArea(key, placeholder, value) {
    return `
      <label class="sheet-field sheet-field--wide">
        <span class="visually-hidden">${escapeHtml(placeholder)}</span>
        <textarea data-sheet-field="${escapeAttr(key)}" placeholder="${escapeAttr(placeholder)}">${escapeHtml(value || '')}</textarea>
      </label>
    `;
  }

  function sheetProficiencyTextArea(key, label, placeholder, value) {
    return `
      <label class="sheet-field sheet-field--wide">
        <span>${escapeHtml(label)}</span>
        <textarea data-sheet-proficiency="${escapeAttr(key)}" placeholder="${escapeAttr(placeholder)}">${escapeHtml(value || '')}</textarea>
      </label>
    `;
  }

  function sheetStatusTextArea(key, placeholder, value) {
    return `
      <label class="sheet-field sheet-field--wide sheet-status-notes">
        <span class="visually-hidden">${escapeHtml(placeholder)}</span>
        <textarea data-sheet-status-field="${escapeAttr(key)}" placeholder="${escapeAttr(placeholder)}">${escapeHtml(value || '')}</textarea>
      </label>
    `;
  }

  return {
    sheetField,
    sheetNumberField,
    sheetProficiencyTextArea,
    sheetSelect,
    sheetStatusTextArea,
    sheetTextArea,
  };
}
