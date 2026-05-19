export function createCharacterSheetOverviewRenderer({
  appState,
  escapeAttr,
  escapeHtml,
  ABILITY_META,
  SKILL_META,
  sheetField,
  sheetNumberField,
  sheetSelect,
  sheetProficiencyTextArea,
  characterClassOptions,
  abilityModifier,
  rollFormula,
  formatSigned,
  classSkillOptions,
  characterClassEntry,
  skillProficiencyBonus,
  characterLevel,
  characterProficiencyBonus,
  classProgressionSection,
  classProgressionRow,
  classProgressionResources,
  splitClassFeatures,
  classSubclassRows,
  nextLevelSummary,
  renderLevelAdvancementSummary,
}) {
  function renderCharacterSheetOverview() {
    const sheet = appState.characterSheet;

    return `
      <section class="sheet-grid">
        ${renderOverviewSummary()}

        <div class="sheet-panel sheet-panel--identity">
          <h3>Identita</h3>
          <div class="sheet-form-grid">
            ${sheetField('name', 'Nome', sheet.name)}
            ${sheetSelect('classId', 'Classe', sheet.classId, characterClassOptions())}
            ${sheetNumberField('level', 'Livello', sheet.level, 1, 20)}
            ${sheetField('ancestry', 'Specie', sheet.ancestry)}
            ${sheetField('background', 'Background', sheet.background)}
            ${sheetField('alignment', 'Allineamento', sheet.alignment)}
            ${sheetNumberField('xp', 'PE', sheet.xp, 0)}
          </div>
        </div>

        <div class="sheet-panel">
          <h3>Caratteristiche</h3>
          <div class="ability-grid">
            ${ABILITY_META.map(([key, label, short]) => renderAbilityCard(key, label, short)).join('')}
          </div>
        </div>

        <div class="sheet-panel sheet-panel--wide">
          <h3>Competenze abilita</h3>
          ${renderSkillProficiencies()}
        </div>

        <div class="sheet-panel sheet-panel--wide">
          <h3>Altre competenze</h3>
          ${renderOtherProficiencies()}
        </div>

        <div class="sheet-panel sheet-panel--wide">
          <h3>Progressione classe</h3>
          ${renderCharacterClassProgression()}
        </div>
      </section>
    `;
  }

  function renderOverviewSummary() {
    const sheet = appState.characterSheet;
    const initiative = abilityModifier(sheet.abilities.dex) + (Number(sheet.initiativeBonus) || 0);
    const passivePerception = 10 + skillModifier('perception');
    const activeSkills = SKILL_META
      .map(([key, label, ability]) => ({
        key,
        label,
        rank: Number(sheet.skillProficiencies[key]) || 0,
        modifier: abilityModifier(sheet.abilities[ability]) + skillProficiencyBonus(sheet.skillProficiencies[key]),
      }))
      .filter((skill) => skill.rank > 0)
      .sort((a, b) => b.modifier - a.modifier || a.label.localeCompare(b.label, 'it'))
      .slice(0, 6);

    return `
      <div class="sheet-panel sheet-panel--wide sheet-hero">
        <div class="sheet-hero-main">
          <div>
            <span>Profilo</span>
            <strong>${escapeHtml(sheet.name || 'Nuovo personaggio')}</strong>
            <p>${escapeHtml([
              characterClassEntry()?.nome.replace(/^Classe:\s*/i, ''),
              `Livello ${characterLevel()}`,
              sheet.ancestry,
              sheet.background,
            ].filter(Boolean).join(' · '))}</p>
          </div>
          <div class="sheet-hero-rolls">
            <button type="button" data-dice-roll="${escapeAttr(rollFormula(20, initiative))}">
              Iniziativa ${escapeHtml(formatSigned(initiative))}
            </button>
            <button type="button" data-dice-roll="${escapeAttr(rollFormula(20, skillModifier('perception')))}">
              Percezione ${escapeHtml(formatSigned(skillModifier('perception')))}
            </button>
          </div>
        </div>

        <div class="sheet-stat-strip" aria-label="Statistiche principali">
          ${renderSummaryStat('CA', Number(sheet.armorClass) || 10, 'Difesa')}
          ${renderSummaryStat('PF', `${Number(sheet.currentHp) || 0}/${Number(sheet.maxHp) || 0}`, 'Attuali / massimi')}
          ${renderSummaryStat('Temp', Number(sheet.tempHp) || 0, 'Punti ferita')}
          ${renderSummaryStat('Vel', Number(sheet.speed) || 0, 'metri')}
          ${renderSummaryStat('BC', formatSigned(characterProficiencyBonus()), 'Competenza')}
          ${renderSummaryStat('Passiva', passivePerception, 'Percezione')}
        </div>

        <div class="sheet-skill-strip" aria-label="Competenze attive">
          <span>Competenze attive</span>
          ${activeSkills.length ? `
            <div>
              ${activeSkills.map((skill) => `
                <button type="button" data-dice-roll="${escapeAttr(rollFormula(20, skill.modifier))}">
                  ${escapeHtml(skill.label)} ${escapeHtml(formatSigned(skill.modifier))}
                </button>
              `).join('')}
            </div>
          ` : '<p>Nessuna competenza selezionata.</p>'}
        </div>
      </div>
    `;
  }

  function renderSummaryStat(label, value, hint) {
    return `
      <div class="sheet-summary-stat">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(String(value))}</strong>
        <small>${escapeHtml(hint)}</small>
      </div>
    `;
  }

  function skillModifier(key) {
    const skill = SKILL_META.find(([skillKey]) => skillKey === key);
    if (!skill) return 0;
    return abilityModifier(appState.characterSheet.abilities[skill[2]]) + skillProficiencyBonus(appState.characterSheet.skillProficiencies[key]);
  }

  function renderAbilityCard(key, label, short) {
    const value = Number(appState.characterSheet.abilities[key]) || 10;
    const modifier = abilityModifier(value);

    return `
      <div class="ability-card">
        <label>
          <span>${escapeHtml(label)}</span>
          <input type="number" min="1" max="30" value="${escapeAttr(String(value))}" data-sheet-ability="${escapeAttr(key)}">
        </label>
        <strong>${escapeHtml(short)}</strong>
        <button type="button" data-dice-roll="${escapeAttr(rollFormula(20, modifier))}">${escapeHtml(formatSigned(modifier))}</button>
      </div>
    `;
  }

  function renderSkillProficiencies() {
    return `
      ${renderClassSkillSuggestions()}
      <div class="skill-grid">
        ${SKILL_META.map(([key, label, ability]) => renderSkillControl(key, label, ability)).join('')}
      </div>
    `;
  }

  function renderClassSkillSuggestions() {
    const suggestions = classSkillOptions(characterClassEntry());

    if (!suggestions.length) return '';

    return `
      <div class="skill-suggestions">
        <span>Abilita suggerite dalla classe</span>
        <div>
          ${suggestions.map(([key, label]) => `
            <button
              class="${appState.characterSheet.skillProficiencies[key] ? 'is-active' : ''}"
              type="button"
              data-sheet-suggest-skill="${escapeAttr(key)}"
            >${escapeHtml(label)}</button>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderSkillControl(key, label, ability) {
    const rank = Number(appState.characterSheet.skillProficiencies[key]) || 0;
    const modifier = abilityModifier(appState.characterSheet.abilities[ability]) + skillProficiencyBonus(rank);
    const abilityShort = ABILITY_META.find(([abilityKey]) => abilityKey === ability)?.[2] || '';

    return `
      <div class="skill-control">
        <div>
          <strong>${escapeHtml(label)}</strong>
          <span>${escapeHtml(abilityShort)}</span>
        </div>
        <select data-sheet-skill="${escapeAttr(key)}" aria-label="Competenza ${escapeAttr(label)}">
          <option value="0"${rank === 0 ? ' selected' : ''}>-</option>
          <option value="1"${rank === 1 ? ' selected' : ''}>C</option>
          <option value="2"${rank === 2 ? ' selected' : ''}>M</option>
        </select>
        <button type="button" data-dice-roll="${escapeAttr(rollFormula(20, modifier))}">${escapeHtml(formatSigned(modifier))}</button>
      </div>
    `;
  }

  function renderOtherProficiencies() {
    const proficiencies = appState.characterSheet.proficiencies;

    return `
      <div class="sheet-proficiency-grid">
        ${sheetProficiencyTextArea('weapons', 'Armi', 'Armi semplici, armi da guerra...', proficiencies.weapons)}
        ${sheetProficiencyTextArea('armor', 'Armature', 'Armature leggere, scudi...', proficiencies.armor)}
        ${sheetProficiencyTextArea('tools', 'Strumenti', 'Strumenti da artigiano, strumenti musicali...', proficiencies.tools)}
        ${sheetProficiencyTextArea('languages', 'Lingue', 'Comune, Elfico...', proficiencies.languages)}
      </div>
    `;
  }

  function renderCharacterClassProgression() {
    const classEntry = characterClassEntry();

    if (!classEntry) {
      return '<p class="sheet-empty">Scegli una classe per vedere progressione e privilegi disponibili.</p>';
    }

    const level = characterLevel();
    const progression = classProgressionSection(classEntry);
    const currentRow = classProgressionRow(classEntry, level);
    const nextRow = level < 20 ? classProgressionRow(classEntry, level + 1) : null;
    const featureNames = splitClassFeatures(currentRow?.['Privilegi di classe']);
    const resourceRows = classProgressionResources(currentRow);
    const subclassRows = classSubclassRows(classEntry, level);

    return `
      <div class="sheet-class-summary">
        <div class="sheet-class-heading">
          <div>
            <strong>${escapeHtml(classEntry.nome.replace(/^Classe:\s*/i, ''))}</strong>
            <span>${escapeHtml(`Livello ${level}`)}</span>
          </div>
          <a class="button button--ghost" href="#/classes/${encodeURIComponent(classEntry.id)}">Apri classe</a>
        </div>

        ${currentRow ? `
          <div class="sheet-class-stats">
            <div class="sheet-derived">
              <span>Bonus competenza</span>
              <strong>${escapeHtml(currentRow['Bonus di competenza'] || formatSigned(characterProficiencyBonus()))}</strong>
            </div>
            ${resourceRows.map(([label, value]) => `
              <div class="sheet-derived">
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(value)}</strong>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="sheet-class-block">
          <h4>Privilegi del livello</h4>
          ${featureNames.length ? `
            <ul class="sheet-chip-list">
              ${featureNames.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}
            </ul>
          ` : '<p class="sheet-empty">Nessun nuovo privilegio indicato per questo livello.</p>'}
        </div>

        ${renderLevelAdvancementSummary(classEntry, currentRow, nextRow)}

        ${subclassRows.length ? `
          <div class="sheet-class-block">
            <h4>Sottoclasse SRD sbloccata</h4>
            <div class="sheet-item-list">
              ${subclassRows.map((row) => `
                <article class="sheet-item">
                  <div>
                    <strong>${escapeHtml(row.Privilegio || 'Privilegio')}</strong>
                    <span>${escapeHtml(`Livello ${row.Livello}${row.Riepilogo ? ` · ${row.Riepilogo}` : ''}`)}</span>
                  </div>
                </article>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${nextRow ? `
          <div class="sheet-class-block">
            <h4>Prossimo livello</h4>
            <p>${escapeHtml(nextLevelSummary(nextRow))}</p>
          </div>
        ` : ''}

        ${!progression ? '<p class="sheet-empty">Progressione non disponibile nei dati locali.</p>' : ''}
      </div>
    `;
  }

  return { renderCharacterSheetOverview };
}
