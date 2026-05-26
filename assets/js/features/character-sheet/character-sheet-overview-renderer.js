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
  classSkillChoiceCount,
  splitClassFeatures,
  classSubclassRows,
  nextLevelSummary,
  renderLevelAdvancementSummary,
  characterSheetDerived,
}) {
  function renderCharacterSheetOverview() {
    const sheet = appState.characterSheet;

    return `
      <section class="sheet-grid">
        ${renderOverviewSummary()}
        ${renderCharacterBuilderChecklist()}
        ${renderGuidedBuilder()}

        <div class="sheet-panel sheet-panel--identity">
          <h3>Identita</h3>
          <div class="sheet-form-grid">
            ${sheetField('name', 'Nome', sheet.name)}
            ${sheetSelect('classId', 'Classe', sheet.classId, characterClassOptions())}
            ${sheetNumberField('level', 'Livello', sheet.level, 1, 20)}
            ${originSelectOrField('ancestry', 'Specie', sheet.ancestry, appState.data.species, 'Nessuna specie')}
            ${originSelectOrField('background', 'Background', sheet.background, appState.data.backgrounds, 'Nessun background')}
            ${sheetField('alignment', 'Allineamento', sheet.alignment)}
            ${sheetNumberField('xp', 'PE', sheet.xp, 0)}
          </div>
        </div>

        <div class="sheet-panel">
          <h3>Caratteristiche</h3>
          ${renderAbilityGuidance()}
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

  function renderGuidedBuilder() {
    const next = nextGuidedStep();

    return `
      <div class="sheet-panel sheet-panel--wide sheet-guided-builder">
        <div class="sheet-guide-heading">
          <div>
            <h3>Percorso guidato</h3>
            <p>${escapeHtml(next.hint)}</p>
          </div>
          <a class="button button--ghost" href="${escapeAttr(next.href)}">${escapeHtml(next.action)}</a>
        </div>
        ${renderGuidedNextActions()}
        <div class="sheet-guide-grid">
          ${renderClassGuideCard()}
          ${renderSpeciesGuideCard()}
          ${renderBackgroundGuideCard()}
        </div>
      </div>
    `;
  }

  function renderGuidedNextActions() {
    const items = characterBuilderChecklist();
    const missing = items.filter((item) => !item.complete).slice(0, 3);

    if (!missing.length) {
      return `
        <div class="sheet-guide-next">
          <strong>Base pronta</strong>
          <p>La scheda ha identita, scelte principali, combattimento, equipaggiamento e riferimenti minimi.</p>
          <a class="button button--ghost" href="#/character_sheet/combat">Usa al tavolo</a>
        </div>
      `;
    }

    return `
      <div class="sheet-guide-next">
        <strong>Completa prima questi passaggi</strong>
        <ol>
          ${missing.map((item) => `
            <li>
              <span>${escapeHtml(item.label)}</span>
              <small>${escapeHtml(item.hint)}</small>
              <a href="${escapeAttr(item.href)}">Apri</a>
            </li>
          `).join('')}
        </ol>
      </div>
    `;
  }

  function renderClassGuideCard() {
    const classEntry = characterClassEntry();
    const traits = characterSheetDerived.selectedClassTraits();
    const skillProgress = characterSkillChoiceProgress();

    if (!classEntry) {
      return renderGuideCard({
        state: 'Da scegliere',
        title: 'Classe',
        body: 'Scegli la classe per importare dado vita, tiri salvezza, competenze, risorse e progressione.',
        items: [],
        href: '#/character_sheet/overview',
        action: 'Scegli classe',
      });
    }

    return renderGuideCard({
      state: 'Classe',
      title: classEntry.nome.replace(/^Classe:\s*/i, ''),
      body: [traits['Caratteristica primaria'], traits['Dado Vita']].filter(Boolean).join(' · '),
      items: [
        traits['Tiri salvezza'] ? `TS: ${traits['Tiri salvezza']}` : '',
        traits.Armi ? `Armi: ${traits.Armi}` : '',
        traits.Armature ? `Armature: ${traits.Armature}` : '',
        skillProgress.required ? `Abilita classe: ${skillProgress.classSelected}/${skillProgress.required}` : '',
      ].filter(Boolean),
      href: `#/classes/${encodeURIComponent(classEntry.id)}`,
      action: 'Dettaglio classe',
    });
  }

  function renderSpeciesGuideCard() {
    const species = characterSpeciesEntry();

    if (!species) {
      return renderGuideCard({
        state: 'Da scegliere',
        title: 'Specie',
        body: 'Scegli una specie per applicare velocita e collegare tratti, taglia e riferimenti SRD.',
        items: [],
        href: '#/character_sheet/overview',
        action: 'Scegli specie',
      });
    }

    return renderGuideCard({
      state: 'Specie',
      title: species.nome || species.id,
      body: [species.tipo_creatura, species.taglia, species.velocita].filter(Boolean).join(' · '),
      items: [species.tratti_sintesi || species.descrizione].filter(Boolean),
      href: `#/species/${encodeURIComponent(species.id)}`,
      action: 'Dettaglio specie',
    });
  }

  function renderBackgroundGuideCard() {
    const background = characterBackgroundEntry();
    const feat = characterOriginFeat();

    if (!background) {
      return renderGuideCard({
        state: 'Da scegliere',
        title: 'Background',
        body: 'Scegli un background per applicare abilita, strumenti, talento origine e monete alternative.',
        items: [],
        href: '#/character_sheet/overview',
        action: 'Scegli background',
      });
    }

    return renderGuideCard({
      state: 'Background',
      title: background.nome || background.id,
      body: [
        Array.isArray(background.punteggi_caratteristica) ? background.punteggi_caratteristica.join(', ') : '',
        feat ? `Talento: ${feat.nome}` : background.talento_origine,
      ].filter(Boolean).join(' · '),
      items: [
        background.competenze?.abilita?.length ? `Abilita: ${background.competenze.abilita.join(', ')}` : '',
        background.competenze?.strumenti ? `Strumenti: ${background.competenze.strumenti}` : '',
        background.equipaggiamento_alternativo ? `Alternativa: ${background.equipaggiamento_alternativo}` : '',
      ].filter(Boolean),
      href: `#/backgrounds/${encodeURIComponent(background.id)}`,
      action: 'Dettaglio background',
    });
  }

  function renderGuideCard({ state, title, body, items, href, action }) {
    return `
      <article class="sheet-guide-card">
        <div>
          <span>${escapeHtml(state)}</span>
          <strong>${escapeHtml(title)}</strong>
          <p>${escapeHtml(body)}</p>
        </div>
        ${items.length ? `
          <ul>
            ${items.slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        ` : ''}
        <a class="button button--ghost" href="${escapeAttr(href)}">${escapeHtml(action)}</a>
      </article>
    `;
  }

  function nextGuidedStep() {
    const checklist = characterBuilderChecklist();
    const next = checklist.find((item) => !item.complete);

    if (!next) {
      return {
        hint: 'La base del personaggio e pronta: puoi giocare o rifinire dettagli avanzati.',
        href: '#/character_sheet/combat',
        action: 'Vai al tavolo',
      };
    }

    return {
      hint: `${next.label}: ${next.hint}`,
      href: next.href,
      action: `Completa ${next.label.toLowerCase()}`,
    };
  }

  function renderCharacterBuilderChecklist() {
    const items = characterBuilderChecklist();
    const complete = items.filter((item) => item.complete).length;

    return `
      <div class="sheet-panel sheet-panel--wide sheet-builder-checklist">
        <div class="sheet-checklist-heading">
          <div>
            <h3>Checklist creazione</h3>
            <p>${escapeHtml(`${complete}/${items.length} passaggi pronti`)}</p>
          </div>
          <a class="button button--ghost" href="#/character_sheet/combat">Rifinisci combattimento</a>
        </div>
        <div class="sheet-checklist-grid">
          ${items.map((item) => `
            <a class="sheet-checklist-item${item.complete ? ' is-complete' : ''}" href="${escapeAttr(item.href)}">
              <span>${item.complete ? 'OK' : 'Da fare'}</span>
              <strong>${escapeHtml(item.label)}</strong>
              <small>${escapeHtml(item.hint)}</small>
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }

  function characterBuilderChecklist() {
    return characterSheetDerived.characterBuilderChecklist();
  }

  function characterSkillChoiceProgress() {
    return characterSheetDerived.characterSkillChoiceProgress();
  }

  function characterBackgroundEntry() {
    return characterSheetDerived.characterBackgroundEntry();
  }

  function characterSpeciesEntry() {
    return characterSheetDerived.characterSpeciesEntry();
  }

  function characterBackgroundSkills() {
    return characterSheetDerived.characterBackgroundSkills();
  }

  function characterOriginFeat() {
    return characterSheetDerived.characterOriginFeat();
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

  function renderAbilityGuidance() {
    const guidance = characterSheetDerived.characterAbilityGuidance();
    if (!guidance.length) {
      return '<p class="sheet-empty">Scegli classe e background per vedere priorita consigliate sui punteggi.</p>';
    }

    return `
      <div class="sheet-ability-guide">
        <span>Priorita consigliate</span>
        <div>
          ${guidance.map((ability) => `
            <article>
              <strong>${escapeHtml(ability.short || ability.label)}</strong>
              <small>${escapeHtml([ability.label, ...ability.sources].join(' · '))}</small>
              <em>${escapeHtml(formatSigned(ability.modifier))}</em>
            </article>
          `).join('')}
        </div>
      </div>
    `;
  }

  function originSelectOrField(key, label, value, entries, emptyLabel) {
    if (!Array.isArray(entries) || !entries.length) {
      return sheetField(key, label, value);
    }

    return sheetSelect(key, label, value, originOptions(entries, value, emptyLabel));
  }

  function originOptions(entries, value, emptyLabel) {
    const options = [
      { value: '', label: emptyLabel },
      ...entries
        .map((entry) => ({
          value: entry.id,
          label: entry.nome || entry.id,
          selected: value === entry.id || value === entry.nome,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'it')),
    ];

    if (value && !options.some((option) => option.value === value || option.label === value)) {
      options.splice(1, 0, { value, label: value });
    }

    return options;
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
      ${renderBackgroundSkillSummary()}
      ${renderClassSkillSuggestions()}
      <div class="skill-grid">
        ${SKILL_META.map(([key, label, ability]) => renderSkillControl(key, label, ability)).join('')}
      </div>
    `;
  }

  function renderBackgroundSkillSummary() {
    const background = characterBackgroundEntry();
    const skills = characterBackgroundSkills();
    const feat = characterOriginFeat();

    if (!background && !feat) return '';

    return `
      <div class="skill-suggestions skill-suggestions--background">
        <span>Origine applicata</span>
        <div>
          ${skills.map((key) => {
            const label = SKILL_META.find(([skillKey]) => skillKey === key)?.[1] || key;
            return `<button class="${appState.characterSheet.skillProficiencies[key] ? 'is-active' : ''}" type="button" data-sheet-suggest-skill="${escapeAttr(key)}">${escapeHtml(label)}</button>`;
          }).join('')}
          ${feat ? `<a class="button button--ghost" href="#/feats/${encodeURIComponent(feat.id)}">${escapeHtml(`Talento: ${feat.nome}`)}</a>` : ''}
        </div>
      </div>
    `;
  }

  function renderClassSkillSuggestions() {
    const suggestions = classSkillOptions(characterClassEntry());
    const progress = characterSkillChoiceProgress();

    if (!suggestions.length) return '';

    return `
      <div class="skill-suggestions">
        <span>${escapeHtml(progress.required ? `Abilita di classe: scegli ${progress.required} (${progress.classSelected}/${progress.required})` : 'Abilita suggerite dalla classe')}</span>
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
    const sources = skillSources(key);

    return `
      <div class="skill-control">
        <div>
          <strong>${escapeHtml(label)}</strong>
          <span>${escapeHtml([abilityShort, ...sources].join(' · '))}</span>
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

  function skillSources(key) {
    return characterSheetDerived.skillSources(key);
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
