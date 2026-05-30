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
  characterSpellOptions,
  spellOptionLabel,
  characterSpellSlots,
  abilityOptions,
}) {
  function renderCharacterSheetOverview() {
    const sheet = appState.characterSheet;

    return `
      <section class="sheet-grid">
        ${renderOverviewSummary()}

        <div id="sheet-builder-identity" class="sheet-panel sheet-panel--identity">
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

        <div id="sheet-builder-abilities" class="sheet-panel">
          <h3>Caratteristiche</h3>
          ${renderAbilityGuidance()}
          <div class="ability-grid">
            ${ABILITY_META.map(([key, label, short]) => renderAbilityCard(key, label, short)).join('')}
          </div>
        </div>

        <div id="sheet-builder-skills" class="sheet-panel sheet-panel--wide">
          <h3>Competenze abilita</h3>
          ${renderSkillProficiencies()}
        </div>

        <div id="sheet-builder-proficiencies" class="sheet-panel sheet-panel--wide">
          <h3>Altre competenze</h3>
          ${renderOtherProficiencies()}
        </div>

        <div id="sheet-builder-progression" class="sheet-panel sheet-panel--wide">
          <h3>Progressione classe</h3>
          ${renderCharacterClassProgression()}
        </div>
      </section>
    `;
  }

  /*
   * Wizard separato dalla scheda giocabile: qui l'utente viene guidato nelle
   * scelte di creazione senza sporcare la vista principale al tavolo.
   */
  function renderCharacterSheetBuilder() {
    const activeStep = characterBuilderActiveStep();
    const active = builderSteps().find((step) => step.id === activeStep) || builderSteps()[0];

    return `
      <section class="sheet-wizard">
        <div class="sheet-wizard-main">
          <div class="sheet-wizard-head">
            <div>
              <span class="sheet-kicker">Percorso guidato</span>
              <p>${escapeHtml(active.summary)}</p>
            </div>
            <a class="button button--ghost" href="#/character_sheet/overview">Torna alla scheda</a>
          </div>
          ${renderWizardProgress(activeStep)}
          ${renderBuilderStepPanel(activeStep)}
        </div>
        <aside class="sheet-wizard-preview" aria-label="Anteprima personaggio">
          ${renderWizardPreview()}
        </aside>
      </section>
    `;
  }

  function renderWizardProgress(activeStep) {
    const checklist = characterBuilderChecklist();
    const steps = builderSteps();
    const activeIndex = steps.findIndex((step) => step.id === activeStep);

    return `
      <nav class="sheet-wizard-progress" aria-label="Passaggi creazione personaggio">
        ${steps.map((step, index) => {
          const related = checklist.filter((item) => step.checks.includes(item.label));
          const done = related.length > 0 && related.every((item) => item.complete);
          const state = index === activeIndex ? 'active' : done ? 'done' : 'pending';
          return `
            <button
              class="wizard-step is-${state}"
              type="button"
              data-sheet-builder-step="${escapeAttr(step.id)}"
              ${index === activeIndex ? 'aria-current="step"' : ''}
            >
              <span class="wizard-step-dot">${done && index !== activeIndex ? '✓' : index + 1}</span>
              <span class="wizard-step-label">${escapeHtml(step.label)}</span>
            </button>
          `;
        }).join('')}
      </nav>
    `;
  }

  function renderWizardPreview() {
    const sheet = appState.characterSheet;
    const checklist = characterBuilderChecklist();
    const complete = checklist.filter((item) => item.complete).length;
    const classEntry = characterClassEntry();
    const className = classEntry ? classEntry.nome.replace(/^Classe:\s*/i, '') : '';

    const stat = (label, value) => `
      <div class="wizard-preview-stat">
        <strong>${escapeHtml(String(value))}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    `;
    const choice = (label, value) => `
      <div class="wizard-preview-row">
        <span>${escapeHtml(label)}</span>
        <strong class="${value ? '' : 'is-empty'}">${escapeHtml(value || 'Da scegliere')}</strong>
      </div>
    `;

    return `
      <div class="wizard-preview-card">
        <span class="sheet-kicker">Anteprima</span>
        <strong class="wizard-preview-name">${escapeHtml(sheet.name || 'Nuovo personaggio')}</strong>
        <p class="wizard-preview-sub">${escapeHtml([className, `Livello ${characterLevel()}`].filter(Boolean).join(' · '))}</p>
        <div class="wizard-preview-stats">
          ${stat('CA', characterSheetDerived.characterEffectiveArmorClass())}
          ${stat('PF', characterSheetDerived.characterSuggestedHitPoints())}
          ${stat('Iniz', formatSigned(characterSheetDerived.characterInitiative()))}
          ${stat('BC', formatSigned(characterProficiencyBonus()))}
        </div>
        <div class="wizard-preview-choices">
          ${choice('Classe', className)}
          ${choice('Specie', sheet.ancestry)}
          ${choice('Background', sheet.background)}
        </div>
        <div class="wizard-preview-progress">
          <small>${escapeHtml(`${complete}/${checklist.length} completato`)} · ${escapeHtml(nextGuidedStep().hint)}</small>
        </div>
      </div>
    `;
  }

  function renderStepActions(actions) {
    return `
      <div class="sheet-step-actions">
        ${actions.map((action, index) => {
          const cls = index === actions.length - 1 ? 'button button--primary' : 'button button--ghost';
          return action.href
            ? `<a class="${cls}" href="${escapeAttr(action.href)}">${escapeHtml(action.label)}</a>`
            : `<button class="${cls}" type="button" data-sheet-builder-step="${escapeAttr(action.target)}">${escapeHtml(action.label)}</button>`;
        }).join('')}
      </div>
    `;
  }

  function renderBuilderStepPanel(activeStep) {
    const sheet = appState.characterSheet;

    if (activeStep === 'abilities') {
      return `
        <div class="sheet-panel sheet-panel--wide sheet-builder-step" id="sheet-builder-abilities">
          <div class="sheet-builder-step-heading">
            <span>Step 2</span>
            <h3>Caratteristiche</h3>
            <p>Scegli un metodo, applica una base ufficiale e poi rifinisci i punteggi con i bonus del background.</p>
          </div>
          ${renderAbilityMethodGuide()}
          ${renderAbilityGuidance()}
          <div class="ability-grid">
            ${ABILITY_META.map(([key, label, short]) => renderAbilityCard(key, label, short)).join('')}
          </div>
          ${renderStepActions([
            { label: 'Indietro', target: 'identity' },
            { label: 'Continua', target: 'skills' },
          ])}
        </div>
      `;
    }

    if (activeStep === 'skills') {
      return `
        <div class="sheet-panel sheet-panel--wide sheet-builder-step" id="sheet-builder-skills">
          <div class="sheet-builder-step-heading">
            <span>Step 3</span>
            <h3>Competenze abilita</h3>
            <p>Usa i suggerimenti SRD della classe e applica le abilita del background quando disponibili.</p>
          </div>
          ${renderSkillProficiencies()}
          ${renderStepActions([
            { label: 'Indietro', target: 'abilities' },
            { label: 'Continua', target: 'kit' },
          ])}
        </div>
      `;
    }

    if (activeStep === 'kit') {
      return `
        <div class="sheet-panel sheet-panel--wide sheet-builder-step" id="sheet-builder-kit">
          <div class="sheet-builder-step-heading">
            <span>Step 4</span>
            <h3>Equipaggiamento iniziale</h3>
            <p>Scegli il pacchetto della classe o le monete del background, poi applica PF e CA suggeriti.</p>
          </div>
          ${renderBuilderIssues()}
          ${renderBuilderStartingEquipment()}
          ${renderBuilderCombatSetup()}
          ${renderStepActions([
            { label: 'Indietro', target: 'skills' },
            { label: 'Continua', target: 'spells' },
          ])}
        </div>
      `;
    }

    if (activeStep === 'spells') {
      return `
        <div class="sheet-panel sheet-panel--wide sheet-builder-step" id="sheet-builder-spells">
          <div class="sheet-builder-step-heading">
            <span>Step 5</span>
            <h3>Magia</h3>
            <p>${escapeHtml(characterSpellOptions().length || characterSpellSlots().length
              ? 'Scegli i primi incantesimi dal catalogo filtrato per classe e controlla gli slot disponibili.'
              : 'Questa classe non richiede scelte da incantatore nel catalogo SRD collegato.')}</p>
          </div>
          ${renderBuilderSpellSetup()}
          ${renderStepActions([
            { label: 'Indietro', target: 'kit' },
            { label: 'Continua', target: 'finish' },
          ])}
        </div>
      `;
    }

    if (activeStep === 'finish') {
      return `
        <div class="sheet-panel sheet-panel--wide sheet-builder-step" id="sheet-builder-finish">
          <div class="sheet-builder-step-heading">
            <span>Step 6</span>
            <h3>Pronto al tavolo</h3>
            <p>Controlla solo gli avvisi rimasti e apri la scheda giocabile quando la base e pronta.</p>
          </div>
          ${renderBuilderFinish()}
          ${renderOtherProficiencies()}
          ${renderCharacterClassProgression()}
          ${renderStepActions([
            { label: 'Indietro', target: 'spells' },
            { label: 'Apri scheda', href: '#/character_sheet/overview' },
            { label: 'Usa al tavolo', href: '#/character_sheet/combat' },
          ])}
        </div>
      `;
    }

    return `
      <div class="sheet-panel sheet-panel--wide sheet-builder-step" id="sheet-builder-identity">
        <div class="sheet-builder-step-heading">
          <span>Step 1</span>
          <h3>Identita</h3>
          <p>Parti dalle scelte che sbloccano suggerimenti SRD: classe, specie e background guidano il resto della scheda.</p>
        </div>
        <div class="sheet-form-grid sheet-form-grid--compact">
          ${sheetField('name', 'Nome', sheet.name)}
          ${sheetNumberField('level', 'Livello', sheet.level, 1, 20)}
          ${sheetField('alignment', 'Allineamento', sheet.alignment)}
          ${sheetNumberField('xp', 'PE', sheet.xp, 0)}
        </div>
        ${renderIdentityClassPicker()}
        ${renderIdentitySpeciesPicker()}
        ${renderIdentityBackgroundPicker()}
        ${renderStepActions([
          { label: 'Continua', target: 'abilities' },
        ])}
      </div>
    `;
  }

  function renderIdentityClassPicker() {
    const selected = appState.characterSheet.classId;
    const cards = (appState.data.classes || []).map((entry) => ({
      value: entry.id,
      name: String(entry.nome || entry.id).replace(/^Classe:\s*/i, ''),
      meta: [classTraitValue(entry, 'Caratteristica primaria'), classTraitValue(entry, 'Dado Vita')].filter(Boolean).join(' · '),
      summary: '',
      selected: entry.id === selected,
    }));
    return renderIdentityPicker('classId', 'Classe', cards, 'Importa dado vita, tiri salvezza, competenze e progressione.');
  }

  function renderIdentitySpeciesPicker() {
    const selected = appState.characterSheet.ancestry;
    const cards = [
      { value: '', name: 'Nessuna specie', meta: '', summary: '', selected: !selected },
      ...(appState.data.species || []).map((entry) => ({
        value: entry.id,
        name: entry.nome || entry.id,
        meta: [entry.taglia, entry.velocita].filter(Boolean).join(' · '),
        summary: truncateGuide(entry.tratti_sintesi || entry.descrizione),
        selected: entry.id === selected || entry.nome === selected,
      })),
    ];
    return renderIdentityPicker('ancestry', 'Specie', cards, 'Applica velocita e collega tratti e taglia.');
  }

  function renderIdentityBackgroundPicker() {
    const selected = appState.characterSheet.background;
    const cards = [
      { value: '', name: 'Nessun background', meta: '', summary: '', selected: !selected },
      ...(appState.data.backgrounds || []).map((entry) => ({
        value: entry.id,
        name: entry.nome || entry.id,
        meta: entry.talento_origine ? `Talento: ${entry.talento_origine}` : '',
        summary: truncateGuide(Array.isArray(entry.competenze?.abilita) ? `Abilita: ${entry.competenze.abilita.join(', ')}` : ''),
        selected: entry.id === selected || entry.nome === selected,
      })),
    ];
    return renderIdentityPicker('background', 'Background', cards, 'Applica abilita, talento origine e monete alternative.');
  }

  function renderIdentityPicker(field, title, cards, hint) {
    return `
      <div class="sheet-identity-picker" role="group" aria-label="${escapeAttr(title)}">
        <div class="sheet-identity-picker-head">
          <strong>${escapeHtml(title)}</strong>
          ${hint ? `<span>${escapeHtml(hint)}</span>` : ''}
        </div>
        <div class="sheet-identity-grid">
          ${cards.map((card) => `
            <button
              type="button"
              class="sheet-identity-card${card.selected ? ' is-selected' : ''}"
              data-sheet-pick="${escapeAttr(field)}"
              data-sheet-pick-value="${escapeAttr(card.value)}"
              aria-pressed="${card.selected ? 'true' : 'false'}"
            >
              <strong>${escapeHtml(card.name)}</strong>
              ${card.meta ? `<span>${escapeHtml(card.meta)}</span>` : ''}
              ${card.summary ? `<small>${escapeHtml(card.summary)}</small>` : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  function classTraitValue(entry, voce) {
    const section = entry?.sezioni?.find((part) => String(part.titolo || '').startsWith('Tratti '));
    const row = section?.righe?.find((item) => (item.Voce || item.chiave) === voce);
    return String(row?.Riepilogo || row?.valore || '').replace(/\.$/, '').trim();
  }

  function truncateGuide(value, max = 90) {
    const text = String(value || '').trim();
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1).trimEnd()}…`;
  }

  function builderSteps() {
    return [
      {
        id: 'identity',
        label: 'Identita',
        hint: 'Nome, classe, specie e background',
        summary: 'Le scelte di identita attivano suggerimenti da classi, specie e background SRD.',
        checks: ['Identita', 'Talento origine'],
      },
      {
        id: 'abilities',
        label: 'Caratteristiche',
        hint: 'Punteggi e priorita',
        summary: 'Mostra solo i sei punteggi e le priorita utili, senza liste di controllo invasive.',
        checks: ['Caratteristiche'],
      },
      {
        id: 'skills',
        label: 'Competenze',
        hint: 'Abilita di classe e background',
        summary: "Qui l'utente sceglie le competenze con pulsanti suggeriti dai dati SRD gia caricati.",
        checks: ['Competenze'],
      },
      {
        id: 'kit',
        label: 'Kit',
        hint: 'Equipaggiamento e difese',
        summary: 'Equipaggiamento iniziale, PF e CA vengono trattati prima di passare alla scheda giocabile.',
        checks: ['Combattimento', 'Equipaggiamento'],
      },
      {
        id: 'spells',
        label: 'Magia',
        hint: 'Incantesimi se servono',
        summary: 'Il wizard mostra le scelte magiche solo quando la classe usa incantesimi.',
        checks: ['Incantesimi'],
      },
      {
        id: 'finish',
        label: 'Pronto',
        hint: 'Riepilogo finale',
        summary: 'Chiusura compatta con gli ultimi avvisi e accesso alla scheda pronta.',
        checks: ['Riferimenti'],
      },
    ];
  }

  function characterBuilderActiveStep() {
    const steps = builderSteps();
    const selected = appState.characterSheetBuilderStep;
    if (steps.some((step) => step.id === selected)) return selected;

    const checklist = characterBuilderChecklist();
    const next = steps.find((step) => step.checks.some((label) => !checklist.find((item) => item.label === label)?.complete));
    return next?.id || 'kit';
  }

  function renderBuilderIssues() {
    const issues = characterSheetDerived.characterBuilderIssues();
    if (!issues.length) return '';

    return `
      <div class="sheet-builder-issues">
        <strong>Azioni consigliate</strong>
        <div>
          ${issues.map((issue) => `
            <article class="sheet-builder-issue is-${escapeAttr(issue.severity)}">
              <a href="${escapeAttr(builderHref(issue.href))}">
                <span>${escapeHtml(issue.label)}</span>
                <small>${escapeHtml(issue.hint)}</small>
              </a>
              ${issue.action ? `
                <button
                  class="button button--ghost"
                  type="button"
                  data-sheet-builder-action="${escapeAttr(issue.action.id)}"
                  ${issue.action.value ? `data-sheet-builder-action-value="${escapeAttr(issue.action.value)}"` : ''}
                >${escapeHtml(issue.action.label)}</button>
              ` : ''}
            </article>
          `).join('')}
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
              <a href="${escapeAttr(builderHref(item.href))}">Apri</a>
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
            <a class="sheet-checklist-item${item.complete ? ' is-complete' : ''}" href="${escapeAttr(builderHref(item.href))}">
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

  function builderHref(href) {
    return href === '#/character_sheet/overview' ? '#/character_sheet/builder' : href;
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

  function renderBuilderStartingEquipment() {
    const classText = characterSheetDerived.classStartingEquipmentText();
    const classOptions = characterSheetDerived.classStartingEquipmentOptions(classText);
    const backgroundText = characterSheetDerived.backgroundStartingCoinsText();
    const backgroundOption = characterSheetDerived.backgroundStartingCoinsOption();

    if (!classText && !backgroundText) {
      return '<p class="sheet-empty">Scegli classe e background per vedere equipaggiamento iniziale e monete alternative.</p>';
    }

    return `
      <div class="sheet-builder-choice-grid">
        ${classText ? `
          <article class="sheet-builder-choice">
            <span>Classe</span>
            <strong>${escapeHtml(characterClassEntry()?.nome?.replace(/^Classe:\s*/i, '') || 'Equipaggiamento')}</strong>
            <p>${escapeHtml(classText)}</p>
            <div>
              ${classOptions.map((option) => `
                <button
                  class="button button--ghost"
                  type="button"
                  data-sheet-builder-action="apply-starting-equipment"
                  data-sheet-builder-action-value="${escapeAttr(option.key)}"
                  ${option.imported ? 'disabled' : ''}
                >${escapeHtml(option.imported ? 'Gia importato' : option.label)}</button>
              `).join('')}
            </div>
          </article>
        ` : ''}
        ${backgroundText ? `
          <article class="sheet-builder-choice">
            <span>Background</span>
            <strong>${escapeHtml(characterBackgroundEntry()?.nome || 'Monete')}</strong>
            <p>${escapeHtml(backgroundText)}</p>
            <div>
              <button
                class="button button--ghost"
                type="button"
                data-sheet-builder-action="apply-starting-equipment"
                data-sheet-builder-action-value="background-coins"
                ${backgroundOption?.imported ? 'disabled' : ''}
              >${escapeHtml(backgroundOption?.imported ? 'Gia applicate' : 'Applica monete')}</button>
            </div>
          </article>
        ` : ''}
      </div>
    `;
  }

  function renderBuilderCombatSetup() {
    const suggestedHp = characterSheetDerived.characterSuggestedHitPoints();
    const suggestedAc = characterSheetDerived.characterSuggestedArmorClass();

    return `
      <div class="sheet-builder-choice-grid">
        <article class="sheet-builder-choice">
          <span>Punti ferita</span>
          <strong>${escapeHtml(String(Number(appState.characterSheet.maxHp) || 0))}/${escapeHtml(String(suggestedHp))}</strong>
          <p>Il valore suggerito usa dado vita, livello e modificatore di Costituzione.</p>
          <div>
            <button class="button button--ghost" type="button" data-sheet-builder-action="apply-derived-hp">Applica PF</button>
          </div>
        </article>
        <article class="sheet-builder-choice">
          <span>Classe Armatura</span>
          <strong>${escapeHtml(String(Number(appState.characterSheet.armorClass) || 10))}/${escapeHtml(String(suggestedAc))}</strong>
          <p>La CA usa armatura equipaggiata quando presente, altrimenti 10 + Destrezza.</p>
          <div>
            <button class="button button--ghost" type="button" data-sheet-builder-action="apply-derived-ac">Applica CA</button>
          </div>
        </article>
      </div>
    `;
  }

  function renderBuilderSpellSetup() {
    const spells = characterSpellOptions();
    const slots = characterSpellSlots();
    const ability = abilityOptions().find((option) => option.value === appState.characterSheet.spellcastingAbility)?.label || appState.characterSheet.spellcastingAbility;

    if (!spells.length && !slots.length) {
      return `
        <div class="sheet-builder-choice">
          <span>Non caster</span>
          <strong>Nessuna scelta richiesta</strong>
          <p>La scheda incantesimi mostrera uno stato vuoto utile invece di controlli tecnici.</p>
        </div>
      `;
    }

    return `
      <div class="sheet-builder-spell-panel">
        <div class="sheet-stat-strip">
          ${renderSummaryStat('Car.', ability, 'Lancio')}
          ${renderSummaryStat('Lista', spells.length, 'SRD filtrati')}
          ${renderSummaryStat('Preparati', appState.characterSheet.preparedSpells.length, 'Scheda')}
          ${renderSummaryStat('Slot', slots.length ? slots.map(([, value]) => value).join('/') : '0', 'Livelli')}
        </div>
        <label class="sheet-field">
          <span>Aggiungi incantesimo</span>
          <select data-sheet-add-spell>
            <option value="">Scegli dal catalogo SRD</option>
            ${spells.slice(0, 80).map((spell) => `<option value="${escapeAttr(spell.id)}">${escapeHtml(spellOptionLabel(spell))}</option>`).join('')}
          </select>
        </label>
        ${appState.characterSheet.preparedSpells.length ? `
          <div class="sheet-pill-list">
            ${appState.characterSheet.preparedSpells.slice(0, 12).map((id) => {
              const spell = (Array.isArray(appState.data.spells) ? appState.data.spells : []).find((entry) => entry.id === id);
              return spell ? `<a href="#/spells/${encodeURIComponent(spell.id)}">${escapeHtml(spell.nome)}</a>` : '';
            }).join('')}
          </div>
        ` : '<p class="sheet-empty">Aggiungi almeno un trucchetto o incantesimo per avere una dashboard pronta.</p>'}
      </div>
    `;
  }

  function renderBuilderFinish() {
    const checklist = characterBuilderChecklist();
    const missing = checklist.filter((item) => !item.complete);

    if (!missing.length) {
      return `
        <div class="sheet-builder-finish is-ready">
          <strong>Base completa</strong>
          <p>Il personaggio ha identita, punteggi, competenze, kit e riferimenti minimi per essere usato.</p>
          <a class="button button--primary" href="#/character_sheet/overview">Apri scheda pronta</a>
        </div>
      `;
    }

    return `
      <div class="sheet-builder-finish">
        <strong>${escapeHtml(`${missing.length} cose da rifinire`)}</strong>
        <div class="sheet-checklist-grid">
          ${missing.map((item) => `
            <a class="sheet-checklist-item" href="${escapeAttr(builderHref(item.href))}">
              <span>Da fare</span>
              <strong>${escapeHtml(item.label)}</strong>
              <small>${escapeHtml(item.hint)}</small>
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }

  /*
   * Formula di tiro che fonde i dadi da effetto sul bersaglio (es. Guida +1d4).
   */
  function rollWithEffects(faces, modifier, target) {
    const base = rollFormula(faces, modifier);
    const dice = characterSheetDerived.characterActiveEffectDice(target);
    return dice ? `${base} + ${dice}` : base;
  }

  function renderOverviewSummary() {
    const sheet = appState.characterSheet;
    const initiative = characterSheetDerived.characterInitiative();
    const passivePerception = 10 + skillModifier('perception', { includeEffects: false });
    const skillEffect = characterSheetDerived.characterActiveEffectModifier('skillChecks');
    const activeSkills = SKILL_META
      .map(([key, label, ability]) => ({
        key,
        label,
        rank: Number(sheet.skillProficiencies[key]) || 0,
        modifier: abilityModifier(sheet.abilities[ability]) + skillProficiencyBonus(sheet.skillProficiencies[key]) + skillEffect,
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
            ${renderOverviewCreationCta()}
            <button type="button" data-dice-roll="${escapeAttr(rollWithEffects(20, initiative, 'initiative'))}">
              Tira iniziativa ${escapeHtml(formatSigned(initiative))}
            </button>
            <button type="button" data-dice-roll="${escapeAttr(rollWithEffects(20, skillModifier('perception'), 'skillChecks'))}">
              Tira percezione ${escapeHtml(formatSigned(skillModifier('perception')))}
            </button>
          </div>
        </div>

        <div class="sheet-stat-strip" aria-label="Statistiche principali">
          ${renderSummaryStat('CA', characterSheetDerived.characterEffectiveArmorClass(), 'Difesa')}
          ${renderSummaryStat('PF', `${Number(sheet.currentHp) || 0}/${Number(sheet.maxHp) || 0}`, 'Attuali / massimi')}
          ${renderSummaryStat('Temp', Number(sheet.tempHp) || 0, 'Punti ferita')}
          ${renderSummaryStat('Vel', characterSheetDerived.characterEffectiveSpeed(), 'metri')}
          ${renderSummaryStat('BC', formatSigned(characterProficiencyBonus()), 'Competenza')}
          ${renderSummaryStat('Passiva', passivePerception, 'Percezione')}
        </div>

        <div class="sheet-skill-strip" aria-label="Competenze attive">
          <span>Competenze attive</span>
          ${activeSkills.length ? `
            <div>
              ${activeSkills.map((skill) => `
                <button type="button" data-dice-roll="${escapeAttr(rollWithEffects(20, skill.modifier, 'skillChecks'))}">
                  ${escapeHtml(skill.label)} ${escapeHtml(formatSigned(skill.modifier))}
                </button>
              `).join('')}
            </div>
          ` : '<p>Nessuna competenza selezionata.</p>'}
        </div>
      </div>
    `;
  }

  function renderOverviewCreationCta() {
    const missing = characterBuilderChecklist().filter((item) => !item.complete);
    if (!missing.length) {
      return `<a class="button button--ghost sheet-creation-cta" href="#/character_sheet">Personaggi</a>`;
    }

    return `<a class="button button--ghost sheet-creation-cta" href="#/character_sheet/builder">${escapeHtml(appState.characterSheet.name ? 'Rifinisci personaggio' : 'Completa creazione')}</a>`;
  }

  function renderAbilityMethodGuide() {
    const pointBuy = pointBuyState();
    const preset = classStandardArrayPreset();
    const rule = appState.data.rules.find((entry) => entry.id === 'caratteristiche_allineamento_personaggio');

    return `
      <div class="sheet-ability-methods">
        <article class="sheet-ability-method is-primary">
          <div>
            <span>Serie standard</span>
            <strong>${escapeHtml(preset ? 'Consigliata per classe' : '15, 14, 13, 12, 10, 8')}</strong>
            <p>${escapeHtml(preset ? `Applica la distribuzione SRD per ${preset.className}.` : 'Assegna i valori standard alle priorita suggerite.')}</p>
          </div>
          <button class="button button--ghost" type="button" data-sheet-builder-action="apply-standard-array">Applica</button>
        </article>

        <article class="sheet-ability-method${pointBuy.valid ? '' : ' is-warning'}">
          <div>
            <span>Acquisto punti</span>
            <strong>${escapeHtml(`${pointBuy.spent}/27 punti`)}</strong>
            <p>${escapeHtml(pointBuy.valid ? `${27 - pointBuy.spent} punti restanti, valori da 8 a 15.` : 'Porta i valori tra 8 e 15 per usare il costo in punti.')}</p>
          </div>
          <button class="button button--ghost" type="button" data-sheet-builder-action="apply-point-buy-base">Base 8</button>
        </article>

        <article class="sheet-ability-method">
          <div>
            <span>Generazione casuale</span>
            <strong>4d6, tieni 3</strong>
            <p>Tira sei risultati, poi inseriscili manualmente dove servono.</p>
          </div>
          <button type="button" data-dice-roll="4d6dl1">Tira</button>
        </article>

        ${rule ? `
          <a class="sheet-rule-link" href="#/rules/${encodeURIComponent(rule.id)}">Apri regola SRD: ${escapeHtml(rule.nome)}</a>
        ` : ''}
      </div>
    `;
  }

  function pointBuyCosts() {
    return { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  }

  function pointBuyState() {
    const costs = pointBuyCosts();
    const values = ABILITY_META.map(([key]) => Number(appState.characterSheet.abilities[key]) || 10);
    const valid = values.every((value) => Object.hasOwn(costs, value));
    const spent = valid ? values.reduce((total, value) => total + costs[value], 0) : 0;

    return { valid, spent, remaining: valid ? 27 - spent : 27 };
  }

  function classStandardArrayPreset() {
    const classEntry = characterClassEntry();
    const className = String(classEntry?.nome || '').replace(/^Classe:\s*/i, '');
    const key = normalizeAbilityMethodLabel(className);
    const presets = {
      barbaro: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
      bardo: { str: 8, dex: 14, con: 12, int: 13, wis: 10, cha: 15 },
      chierico: { str: 14, dex: 8, con: 13, int: 10, wis: 15, cha: 12 },
      druido: { str: 8, dex: 12, con: 14, int: 13, wis: 15, cha: 10 },
      guerriero: { str: 15, dex: 14, con: 13, int: 8, wis: 10, cha: 12 },
      ladro: { str: 12, dex: 15, con: 13, int: 14, wis: 10, cha: 8 },
      mago: { str: 8, dex: 12, con: 13, int: 15, wis: 14, cha: 10 },
      monaco: { str: 12, dex: 15, con: 13, int: 10, wis: 14, cha: 8 },
      paladino: { str: 15, dex: 10, con: 13, int: 8, wis: 12, cha: 14 },
      ranger: { str: 12, dex: 15, con: 13, int: 8, wis: 14, cha: 10 },
      stregone: { str: 10, dex: 13, con: 14, int: 8, wis: 12, cha: 15 },
      warlock: { str: 8, dex: 14, con: 13, int: 12, wis: 10, cha: 15 },
    };

    return presets[key] ? { className, abilities: presets[key] } : null;
  }

  function normalizeAbilityMethodLabel(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’']/g, '')
      .trim();
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

  function skillModifier(key, { includeEffects = true } = {}) {
    const skill = SKILL_META.find(([skillKey]) => skillKey === key);
    if (!skill) return 0;
    return abilityModifier(appState.characterSheet.abilities[skill[2]]) +
      skillProficiencyBonus(appState.characterSheet.skillProficiencies[key]) +
      (includeEffects ? characterSheetDerived.characterActiveEffectModifier('skillChecks') : 0);
  }

  function renderAbilityCard(key, label, short) {
    const value = Number(appState.characterSheet.abilities[key]) || 10;
    const modifier = abilityModifier(value);
    const costs = pointBuyCosts();
    const pointBuy = pointBuyState();
    const canDecrease = value > 8;
    const marginalCost = Object.hasOwn(costs, value + 1) && Object.hasOwn(costs, value)
      ? costs[value + 1] - costs[value]
      : Infinity;
    const canIncrease = value < 15 && (!pointBuy.valid || marginalCost <= pointBuy.remaining);

    return `
      <div class="ability-card">
        <span class="ability-name" title="${escapeAttr(label)}">${escapeHtml(short || label)}</span>
        <div class="ability-value-row">
          <button type="button" class="ability-step" data-sheet-ability-delta="-1" data-sheet-ability-key="${escapeAttr(key)}" ${canDecrease ? '' : 'disabled'} aria-label="Riduci ${escapeAttr(label)}">−</button>
          <input type="number" min="1" max="30" value="${escapeAttr(String(value))}" data-sheet-ability="${escapeAttr(key)}" aria-label="${escapeAttr(label)}">
          <button type="button" class="ability-step" data-sheet-ability-delta="1" data-sheet-ability-key="${escapeAttr(key)}" ${canIncrease ? '' : 'disabled'} aria-label="Aumenta ${escapeAttr(label)}">+</button>
        </div>
        <button type="button" class="ability-mod" data-dice-roll="${escapeAttr(rollFormula(20, modifier))}">${escapeHtml(formatSigned(modifier))}</button>
      </div>
    `;
  }

  function renderSkillProficiencies() {
    return `
      ${renderSkillChoiceState()}
      ${renderBackgroundSkillSummary()}
      ${renderClassSkillSuggestions()}
      <div class="skill-grid">
        ${SKILL_META.map(([key, label, ability]) => renderSkillControl(key, label, ability)).join('')}
      </div>
    `;
  }

  function renderSkillChoiceState() {
    const state = characterSheetDerived.characterSkillChoiceState();
    const messages = [];

    if (state.required) {
      if (state.remaining > 0) messages.push(`Mancano ${state.remaining} scelte abilita dalla classe.`);
      if (state.complete && !state.overLimit) messages.push(`Scelte classe complete: ${state.selected}/${state.required}.`);
      if (state.overLimit) messages.push(`Troppe abilita di classe: ${state.selected}/${state.required}.`);
    }
    if (state.missingBackgroundKeys.length) {
      messages.push(`Background da applicare: ${state.missingBackgroundKeys.map(skillLabel).join(', ')}.`);
    }
    if (state.selectedOtherKeys.length) {
      messages.push(`Fuori da classe/background: ${state.selectedOtherKeys.map(skillLabel).join(', ')}.`);
    }

    if (!messages.length) return '';

    return `
      <div class="skill-validation${state.overLimit ? ' is-warning' : ''}">
        ${messages.map((message) => `<p>${escapeHtml(message)}</p>`).join('')}
        ${state.missingBackgroundKeys.length ? `
          <div class="skill-validation-actions">
            <button class="button button--ghost" type="button" data-sheet-apply-background-skills>
              Applica abilita background
            </button>
          </div>
        ` : ''}
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
    const state = characterSheetDerived.characterSkillChoiceState();
    const suggestions = state.classOptions;

    if (!suggestions.length) return '';

    return `
      <div class="skill-suggestions">
        <span>${escapeHtml(state.required ? `Abilita di classe: scegli ${state.required} (${state.selected}/${state.required})` : 'Abilita suggerite dalla classe')}</span>
        <div>
          ${suggestions.map((option) => `
            <button
              class="${option.selected ? 'is-active' : ''}"
              type="button"
              data-sheet-suggest-skill="${escapeAttr(option.key)}"
              ${option.disabled ? 'disabled' : ''}
            >${escapeHtml(option.label)}</button>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderSkillControl(key, label, ability) {
    const rank = Number(appState.characterSheet.skillProficiencies[key]) || 0;
    const modifier = abilityModifier(appState.characterSheet.abilities[ability]) +
      skillProficiencyBonus(rank) +
      characterSheetDerived.characterActiveEffectModifier('skillChecks');
    const abilityShort = ABILITY_META.find(([abilityKey]) => abilityKey === ability)?.[2] || '';
    const sources = skillSources(key);

    return `
      <div class="skill-control">
        <div>
          <strong>${escapeHtml(label)}</strong>
          <span>${escapeHtml([abilityShort, ...sources].join(' · '))}</span>
        </div>
        <div class="rank-pills" role="group" aria-label="Competenza ${escapeAttr(label)}">
          ${[['0', '–', 'Non competente'], ['1', 'C', 'Competente'], ['2', 'M', 'Maestria']].map(([value, text, title]) => `
            <button
              type="button"
              class="rank-pill${rank === Number(value) ? ' is-active' : ''}"
              data-sheet-skill="${escapeAttr(key)}"
              data-sheet-skill-rank="${value}"
              aria-pressed="${rank === Number(value)}"
              title="${escapeAttr(title)}"
            >${escapeHtml(text)}</button>
          `).join('')}
        </div>
        <button type="button" data-dice-roll="${escapeAttr(rollWithEffects(20, modifier, 'skillChecks'))}">${escapeHtml(formatSigned(modifier))}</button>
      </div>
    `;
  }

  function skillSources(key) {
    return characterSheetDerived.skillSources(key);
  }

  function skillLabel(key) {
    return SKILL_META.find(([skillKey]) => skillKey === key)?.[1] || key;
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
          <div class="sheet-class-actions">
            <a class="button button--ghost" href="#/classes/${encodeURIComponent(classEntry.id)}">Apri classe</a>
          </div>
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

        ${renderLevelUpPlanner(currentRow, nextRow)}
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

  function renderLevelUpPlanner(currentRow, nextRow) {
    if (!nextRow) return '';

    const nextLevel = Number(nextRow.Livello) || characterLevel() + 1;
    const hpGain = suggestedHitPointsForLevel(nextLevel) - suggestedHitPointsForLevel(characterLevel());
    const features = splitClassFeatures(nextRow['Privilegi di classe']);
    const currentResources = new Map(classProgressionResources(currentRow));
    const nextResources = classProgressionResources(nextRow)
      .map(([label, value]) => ({
        label,
        current: currentResources.get(label) || '-',
        next: value,
      }));
    const choices = levelUpChoices(features);

    return `
      <div class="sheet-level-planner">
        <div class="sheet-level-planner-heading">
          <div>
            <span>Level up</span>
            <strong>${escapeHtml(`Livello ${characterLevel()} -> ${nextLevel}`)}</strong>
            <p>${escapeHtml(nextLevelSummary(nextRow))}</p>
          </div>
          <button class="button button--primary" type="button" data-sheet-level-up>
            ${escapeHtml(`Applica livello ${nextLevel}`)}
          </button>
        </div>

        <div class="sheet-level-planner-grid">
          <div class="sheet-derived">
            <span>PF stimati</span>
            <strong>${escapeHtml(`+${Math.max(1, hpGain)}`)}</strong>
          </div>
          <div class="sheet-derived">
            <span>Bonus competenza</span>
            <strong>${escapeHtml(nextRow['Bonus di competenza'] || formatSigned(characterProficiencyBonus()))}</strong>
          </div>
          ${nextResources.slice(0, 4).map((entry) => `
            <div class="sheet-derived">
              <span>${escapeHtml(entry.label)}</span>
              <strong>${escapeHtml(`${entry.current} -> ${entry.next}`)}</strong>
            </div>
          `).join('')}
        </div>

        ${features.length ? `
          <div class="sheet-class-block">
            <h4>Nuovi privilegi</h4>
            <ul class="sheet-chip-list">
              ${features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${choices.length ? `
          <div class="sheet-level-choices">
            <strong>Scelte da completare</strong>
            ${choices.map((choice) => `<p>${escapeHtml(choice)}</p>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  function suggestedHitPointsForLevel(level) {
    const safeLevel = Math.min(20, Math.max(1, Number(level) || 1));
    const hitDie = Number(String(appState.characterSheet.hitDice || '').match(/d(\d+)/i)?.[1]) || 8;
    const con = abilityModifier(appState.characterSheet.abilities.con);
    const firstLevel = Math.max(1, hitDie + con);
    const laterLevel = Math.max(1, Math.floor(hitDie / 2) + 1 + con);

    return firstLevel + Math.max(0, safeLevel - 1) * laterLevel;
  }

  function levelUpChoices(features) {
    const text = features.join(' ').toLowerCase();
    const choices = [];

    if (/miglioramento|punteggi|talento/.test(text)) {
      choices.push('Scegli aumento caratteristiche o talento, poi aggiorna manualmente la scheda.');
    }
    if (/sottoclasse|tradizione|collegio|circolo|patrono|dominio|giuramento|archetipo/.test(text)) {
      choices.push('Controlla la scelta di sottoclasse e collega il riferimento SRD se disponibile.');
    }
    if (/incantesim|trucchett/.test(text)) {
      choices.push('Rivedi incantesimi preparati/conosciuti e nuovi slot nella tab Incantesimi.');
    }

    return choices;
  }

  return { renderCharacterSheetBuilder, renderCharacterSheetOverview };
}
