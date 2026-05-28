export function createCharacterSheetDerivedModel({
  appState,
  abilityModifier,
  abilityMeta,
  skillMeta,
  classSkillOptions,
  classSkillChoiceCount,
  characterClassEntry,
  classTraitsMap,
}) {
  /*
   * Modello derivato della scheda.
   * Qui vivono calcoli e lookup che devono restare coerenti tra renderer,
   * eventi e futuri wizard: la UI legge risultati, non ricostruisce regole.
   */
  function selectedClassTraits() {
    return classTraitsMap(characterClassEntry());
  }

  function characterBackgroundEntry() {
    const value = appState.characterSheet.background;
    return appState.data.backgrounds.find((entry) => entry.id === value || entry.nome === value) || null;
  }

  function characterSpeciesEntry() {
    const value = appState.characterSheet.ancestry;
    return appState.data.species.find((entry) => entry.id === value || entry.nome === value) || null;
  }

  function characterOriginFeat() {
    const background = characterBackgroundEntry();
    const featName = String(background?.talento_origine || '').replace(/\s*\([^)]*\)\s*/g, ' ').trim();
    const key = normalizeSheetLabel(featName);
    if (!key) return null;

    return appState.data.feats.find((feat) => normalizeSheetLabel(feat.nome) === key) || null;
  }

  function characterBackgroundSkills() {
    const background = characterBackgroundEntry();
    const skills = Array.isArray(background?.competenze?.abilita) ? background.competenze.abilita : [];

    return skills
      .map((label) => {
        const normalized = normalizeSheetLabel(label);
        return skillMeta.find(([, skillLabel]) => normalizeSheetLabel(skillLabel) === normalized)?.[0] || '';
      })
      .filter(Boolean);
  }

  function characterSkillChoiceProgress() {
    const classEntry = characterClassEntry();
    const classOptions = new Set(classSkillOptions(classEntry).map(([key]) => key));
    const backgroundSkills = new Set(characterBackgroundSkills());
    const required = classSkillChoiceCount(classEntry);
    const classSelected = [...classOptions]
      .filter((key) => !backgroundSkills.has(key) && Number(appState.characterSheet.skillProficiencies[key]) > 0)
      .length;
    const backgroundSelected = [...backgroundSkills]
      .filter((key) => Number(appState.characterSheet.skillProficiencies[key]) > 0)
      .length;
    const anySelected = Object.values(appState.characterSheet.skillProficiencies).some((rank) => Number(rank) > 0);

    return {
      required,
      classSelected,
      backgroundSelected,
      complete: required ? classSelected >= required : anySelected,
    };
  }

  function characterSkillChoiceState() {
    /*
     * Stato leggibile del picker abilita.
     * Serve al renderer per guidare l'utente senza imporre blocchi rigidi:
     * la select resta libera, mentre i pulsanti suggeriti rispettano il limite.
     */
    const classOptions = classSkillOptions(characterClassEntry());
    const classOptionKeys = new Set(classOptions.map(([key]) => key));
    const backgroundKeys = new Set(characterBackgroundSkills());
    const required = classSkillChoiceCount(characterClassEntry());
    const selectedClassKeys = classOptions
      .map(([key]) => key)
      .filter((key) => !backgroundKeys.has(key) && Number(appState.characterSheet.skillProficiencies[key]) > 0);
    const selectedBackgroundKeys = [...backgroundKeys]
      .filter((key) => Number(appState.characterSheet.skillProficiencies[key]) > 0);
    const missingBackgroundKeys = [...backgroundKeys]
      .filter((key) => !Number(appState.characterSheet.skillProficiencies[key]));
    const selectedOtherKeys = skillMeta
      .map(([key]) => key)
      .filter((key) => Number(appState.characterSheet.skillProficiencies[key]) > 0)
      .filter((key) => !classOptionKeys.has(key) && !backgroundKeys.has(key));
    const selected = selectedClassKeys.length;
    const remaining = Math.max(0, required - selected);
    const overLimit = Boolean(required && selected > required);

    return {
      required,
      selected,
      remaining,
      complete: required ? selected >= required : selectedClassKeys.length + selectedBackgroundKeys.length + selectedOtherKeys.length > 0,
      overLimit,
      selectedClassKeys,
      selectedBackgroundKeys,
      missingBackgroundKeys,
      selectedOtherKeys,
      classOptions: classOptions.map(([key, label]) => ({
        key,
        label,
        selected: Number(appState.characterSheet.skillProficiencies[key]) > 0,
        disabled: Boolean(required && selected >= required && !Number(appState.characterSheet.skillProficiencies[key])),
      })),
    };
  }

  function skillSources(key) {
    const sources = [];
    if (characterBackgroundSkills().includes(key)) sources.push('Background');
    if (classSkillOptions(characterClassEntry()).some(([skillKey]) => skillKey === key)) sources.push('Classe');
    return sources;
  }

  function characterBuilderChecklist() {
    const sheet = appState.characterSheet;
    const hasAbilitySpread = abilityMeta.some(([key]) => Number(sheet.abilities[key]) !== 10);
    const skillProgress = characterSkillChoiceProgress();
    const originFeat = characterOriginFeat();
    const hasCombatReady = Number(sheet.maxHp) > 0 && Number(sheet.armorClass) > 0;
    const hasClass = Boolean(characterClassEntry());
    const caster = characterSpellCatalog().length > 0;

    return [
      {
        label: 'Identita',
        complete: Boolean(sheet.name && hasClass && sheet.ancestry && sheet.background),
        hint: 'Nome, classe, specie e background',
        href: '#/character_sheet/overview',
      },
      {
        label: 'Caratteristiche',
        complete: hasAbilitySpread,
        hint: hasAbilitySpread ? 'Punteggi modificati' : 'Imposta i sei punteggi',
        href: '#/character_sheet/overview',
      },
      {
        label: 'Competenze',
        complete: skillProgress.complete,
        hint: skillProgress.required ? `${skillProgress.classSelected}/${skillProgress.required} scelte classe · ${skillProgress.backgroundSelected} background` : 'Scegli abilita da classe/background',
        href: '#/character_sheet/overview',
      },
      {
        label: 'Talento origine',
        complete: Boolean(originFeat),
        hint: originFeat ? originFeat.nome : 'Scegli un background con talento',
        href: originFeat ? `#/feats/${encodeURIComponent(originFeat.id)}` : '#/character_sheet/overview',
      },
      {
        label: 'Combattimento',
        complete: hasCombatReady,
        hint: hasCombatReady ? 'CA e PF presenti' : 'Applica PF e CA suggeriti',
        href: '#/character_sheet/combat',
      },
      {
        label: 'Equipaggiamento',
        complete: sheet.equipmentItems.length > 0 || sheet.magicItems.length > 0 || String(sheet.equipment || '').trim(),
        hint: 'Armi, armature, strumenti o note',
        href: '#/character_sheet/inventory',
      },
      {
        label: 'Incantesimi',
        complete: !caster || sheet.preparedSpells.length > 0,
        hint: caster ? 'Scegli trucchetti o incantesimi iniziali' : 'Nessuna scelta magica richiesta',
        href: '#/character_sheet/spells',
      },
      {
        label: 'Riferimenti',
        complete: sheet.references.length >= 3,
        hint: 'Classe, specie, background e regole utili',
        href: '#/character_sheet/notes',
      },
    ];
  }

  function characterBuilderChecklistForSheet(sheet) {
    const current = appState.characterSheet;
    appState.characterSheet = sheet;
    try {
      return characterBuilderChecklist();
    } finally {
      appState.characterSheet = current;
    }
  }

  function characterBuilderIssues() {
    /*
     * Elenco sintetico per il futuro wizard: ogni problema ha testo,
     * destinazione e severita, cosi la UI puo diventare una coda di azioni.
     */
    const sheet = appState.characterSheet;
    const issues = [];
    const checklist = characterBuilderChecklist();
    const skillState = characterSkillChoiceState();

    checklist
      .filter((item) => !item.complete)
      .forEach((item) => {
        issues.push({
          severity: 'todo',
          label: item.label,
          hint: item.hint,
          href: item.href,
        });
      });

    if (skillState.overLimit) {
      issues.push({
        severity: 'warning',
        label: 'Competenze',
        hint: `Troppe abilita di classe: ${skillState.selected}/${skillState.required}.`,
        href: '#/character_sheet/overview',
      });
    }
    if (skillState.missingBackgroundKeys.length) {
      issues.push({
        severity: 'todo',
        label: 'Background',
        hint: `Applica abilita: ${skillState.missingBackgroundKeys.map(skillLabel).join(', ')}.`,
        href: '#/character_sheet/overview',
        action: {
          id: 'apply-background-skills',
          label: 'Applica',
        },
      });
    }
    if (Number(sheet.maxHp) > 0 && Number(sheet.maxHp) !== characterSuggestedHitPoints()) {
      issues.push({
        severity: 'notice',
        label: 'Punti ferita',
        hint: `PF suggeriti ${characterSuggestedHitPoints()}, attuali massimi ${Number(sheet.maxHp) || 0}.`,
        href: '#/character_sheet/combat',
        action: {
          id: 'apply-derived-hp',
          label: 'Applica PF',
        },
      });
    }
    if (Number(sheet.armorClass) !== characterSuggestedArmorClass()) {
      issues.push({
        severity: 'notice',
        label: 'Classe Armatura',
        hint: `CA suggerita ${characterSuggestedArmorClass()}, attuale ${Number(sheet.armorClass) || 10}.`,
        href: '#/character_sheet/combat',
        action: {
          id: 'apply-derived-ac',
          label: 'Applica CA',
        },
      });
    }
    startingEquipmentIssues().forEach((issue) => issues.push(issue));

    return issues.slice(0, 8);
  }

  function startingEquipmentIssues() {
    const issues = [];
    const classOptions = classStartingEquipmentOptions().filter((option) => !option.imported);
    const backgroundOption = backgroundStartingCoinsOption();

    if (classOptions.length === 1) {
      issues.push({
        severity: 'todo',
        label: 'Equipaggiamento',
        hint: 'Importa equipaggiamento iniziale della classe.',
        href: '#/character_sheet/inventory',
        action: {
          id: 'apply-starting-equipment',
          value: classOptions[0].key,
          label: 'Importa',
        },
      });
    } else if (classOptions.length > 1) {
      issues.push({
        severity: 'todo',
        label: 'Equipaggiamento',
        hint: 'Scegli opzione A o B per equipaggiamento iniziale.',
        href: '#/character_sheet/inventory',
      });
    }

    if (backgroundOption && !backgroundOption.imported) {
      issues.push({
        severity: 'todo',
        label: 'Monete background',
        hint: `Importa alternativa: ${backgroundStartingCoinsText()}.`,
        href: '#/character_sheet/inventory',
        action: {
          id: 'apply-starting-equipment',
          value: 'background-coins',
          label: 'Importa',
        },
      });
    }

    return issues;
  }

  function characterAbilityGuidance() {
    /*
     * Incrocia caratteristica primaria della classe e suggerimenti del background.
     * Non assegna punteggi: prepara solo indicazioni leggibili per il builder.
     */
    const classAbilities = abilityKeysFromText(selectedClassTraits()['Caratteristica primaria']);
    const backgroundAbilities = Array.isArray(characterBackgroundEntry()?.punteggi_caratteristica)
      ? characterBackgroundEntry().punteggi_caratteristica.flatMap(abilityKeysFromText)
      : [];
    const relevant = new Set([...classAbilities, ...backgroundAbilities]);

    return abilityMeta
      .filter(([key]) => relevant.has(key))
      .map(([key, label, short]) => {
        const sources = [];
        if (classAbilities.includes(key)) sources.push('Classe');
        if (backgroundAbilities.includes(key)) sources.push('Background');

        return {
          key,
          label,
          short,
          value: Number(appState.characterSheet.abilities[key]) || 10,
          modifier: abilityModifier(appState.characterSheet.abilities[key]),
          sources,
          priority: classAbilities.includes(key) ? 0 : 1,
        };
      })
      .sort((a, b) => a.priority - b.priority || a.label.localeCompare(b.label, 'it'));
  }

  function characterSpellCatalog() {
    const className = normalizeSheetLabel(String(characterClassEntry()?.nome || '').replace(/^Classe:\s*/i, ''));
    if (!className) return [];

    const spells = Array.isArray(appState.data.spells) ? appState.data.spells : [];

    return spells.filter((spell) => {
      const classes = Array.isArray(spell.classi) ? spell.classi : [];
      return classes.some((name) => normalizeSheetLabel(name) === className);
    });
  }

  function abilityKeysFromText(value) {
    const text = normalizeSheetLabel(value);
    if (!text) return [];

    return abilityMeta
      .filter(([, label]) => text.includes(normalizeSheetLabel(label)))
      .map(([key]) => key);
  }

  function skillLabel(key) {
    return skillMeta.find(([skillKey]) => skillKey === key)?.[1] || key;
  }

  function characterInitiative() {
    return abilityModifier(appState.characterSheet.abilities.dex) + (Number(appState.characterSheet.initiativeBonus) || 0);
  }

  function characterSuggestedHitPoints() {
    const level = Math.min(20, Math.max(1, Number(appState.characterSheet.level) || 1));
    const hitDie = Number(String(appState.characterSheet.hitDice || '').match(/d(\d+)/i)?.[1]) || 8;
    const con = abilityModifier(appState.characterSheet.abilities.con);
    const firstLevel = Math.max(1, hitDie + con);
    const laterLevel = Math.max(1, Math.floor(hitDie / 2) + 1 + con);

    return firstLevel + Math.max(0, level - 1) * laterLevel;
  }

  function characterSuggestedArmorClass() {
    return characterArmorLoadout().armorClass;
  }

  function characterArmorLoadout() {
    const equippedItems = appState.characterSheet.equipmentItems
      .filter((item) => item.equipped && item.armorClass);
    const armor = equippedItems.find((item) => equipmentArmorKind(item) === 'armor') || null;
    const shield = equippedItems.find((item) => equipmentArmorKind(item) === 'shield') || null;
    const baseArmorClass = armor ? armorClassFromText(armor.armorClass) : unarmoredArmorClass();
    const shieldBonus = shield ? shieldBonusFromText(shield.armorClass) || 0 : 0;

    return {
      armor,
      shield,
      baseArmorClass,
      shieldBonus,
      armorClass: (baseArmorClass || unarmoredArmorClass()) + shieldBonus,
    };
  }

  function characterCarryingLoad() {
    const itemWeights = appState.characterSheet.equipmentItems.map((item) => equipmentItemWeight(item));
    const itemWeight = itemWeights.reduce((total, entry) => total + entry.total, 0);
    const unknownItems = itemWeights.filter((entry) => entry.unknown).length;
    const coinWeight = characterCoinWeight();
    const total = roundWeight(itemWeight + coinWeight);
    const capacity = characterCarryingCapacity();
    const pushDragLift = roundWeight(capacity * 2);
    const percent = capacity ? Math.min(100, Math.round((total / capacity) * 100)) : 0;

    return {
      total,
      itemWeight: roundWeight(itemWeight),
      coinWeight,
      capacity,
      pushDragLift,
      percent,
      unknownItems,
      state: total > capacity ? 'over' : total >= capacity * 0.75 ? 'warning' : 'ok',
      size: characterCarryingSize(),
    };
  }

  function characterCarryingCapacity() {
    const strength = Math.max(0, Number(appState.characterSheet.abilities.str) || 0);
    return roundWeight(strength * carryingMultiplier(characterCarryingSize()));
  }

  function characterCarryingSize() {
    return String(characterSpeciesEntry()?.taglia || '').trim() || 'Media';
  }

  function carryingMultiplier(size) {
    const text = normalizeSheetLabel(size);
    if (text.includes('mastodontica')) return 60;
    if (text.includes('enorme')) return 30;
    if (text.includes('grande')) return 15;
    if (text.includes('minuscola')) return 3.75;
    return 7.5;
  }

  function equipmentItemWeight(item) {
    const unitWeight = parseWeightKg(item?.weight);
    const quantity = Math.max(1, Number(item?.quantity) || 1);
    return {
      total: unitWeight === null ? 0 : roundWeight(unitWeight * quantity),
      unknown: Boolean(String(item?.weight || '').trim()) && unitWeight === null,
    };
  }

  function characterCoinWeight() {
    const coins = appState.characterSheet.coins || {};
    const count = ['pp', 'mo', 'ma', 'mr']
      .reduce((total, key) => total + Math.max(0, Number(coins[key]) || 0), 0);

    return roundWeight(count * 0.01);
  }

  function parseWeightKg(value) {
    const text = String(value || '').trim().toLowerCase();
    if (!text || text === '-' || text === 'variabile') return null;

    const match = text.match(/(\d+(?:[,.]\d+)?)/);
    if (!match) return null;

    const amount = Number(match[1].replace(',', '.'));
    if (!Number.isFinite(amount)) return null;

    if (/\b(g|gramm[oi])\b/.test(text)) return amount / 1000;
    return amount;
  }

  function roundWeight(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  function armorClassFromEquipment(item) {
    if (equipmentArmorKind(item) === 'shield') {
      return characterBaseArmorClass() + (shieldBonusFromText(item?.armorClass) || 0);
    }

    return armorClassFromText(item?.armorClass);
  }

  function equipmentArmorKind(item) {
    if (!item?.armorClass) return '';
    if (shieldBonusFromText(item.armorClass) !== null) return 'shield';
    return armorClassFromText(item.armorClass) !== null ? 'armor' : '';
  }

  function characterBaseArmorClass() {
    const equippedArmor = appState.characterSheet.equipmentItems
      .find((item) => item.equipped && equipmentArmorKind(item) === 'armor');

    return equippedArmor ? armorClassFromText(equippedArmor.armorClass) || unarmoredArmorClass() : unarmoredArmorClass();
  }

  function unarmoredArmorClass() {
    return 10 + abilityModifier(appState.characterSheet.abilities.dex);
  }

  function classStartingEquipmentText() {
    const traits = characterClassEntry()?.sezioni?.find((section) => String(section.titolo || '').startsWith('Tratti '));
    const row = traits?.righe?.find((entry) => (entry.chiave || entry.Voce) === 'Equipaggiamento iniziale');
    return String(row?.valore || row?.Riepilogo || '').replace(/\.$/, '').trim();
  }

  function classStartingEquipmentOptions(text = classStartingEquipmentText()) {
    const options = [];
    if (/\bA\s*:/i.test(text)) options.push(startingEquipmentOption('class-a', 'Importa opzione A'));
    if (/\bB\s*:/i.test(text)) options.push(startingEquipmentOption('class-b', 'Importa opzione B'));
    if (!options.length && text) options.push(startingEquipmentOption('class-all', 'Importa equipaggiamento'));
    return options;
  }

  function backgroundStartingCoinsText() {
    return String(characterBackgroundEntry()?.equipaggiamento_alternativo || '').trim();
  }

  function backgroundStartingCoinsOption() {
    const text = backgroundStartingCoinsText();
    if (!text) return null;
    return startingEquipmentOption('background-coins', 'Applica monete');
  }

  function startingEquipmentOptionText(text, mode) {
    const match = String(text || '').match(/\bA\s*:\s*(.*?)(?:;\s*oppure\s*B\s*:\s*(.*)|$)/i);
    if (!match) return text;
    if (mode === 'class-a') return match[1] || '';
    if (mode === 'class-b') return match[2] || '';
    return text;
  }

  function startingEquipmentImportMarker(mode) {
    if (mode === 'class-a') return 'Importato equipaggiamento iniziale: Classe opzione A';
    if (mode === 'class-b') return 'Importato equipaggiamento iniziale: Classe opzione B';
    if (mode === 'background-coins') return 'Importato equipaggiamento iniziale: Monete background';
    return 'Importato equipaggiamento iniziale: Classe';
  }

  function startingEquipmentAlreadyImported(modeOrMarker) {
    const marker = String(modeOrMarker || '').startsWith('Importato equipaggiamento iniziale:')
      ? modeOrMarker
      : startingEquipmentImportMarker(modeOrMarker);
    return Boolean(marker && String(appState.characterSheet.equipment || '').includes(marker));
  }

  /*
   * Prepara i comandi importabili dall'inventario con stato gia risolto:
   * il renderer non deve conoscere marker tecnici o logica di parsing.
   */
  function startingEquipmentOption(key, label) {
    return {
      key,
      label,
      marker: startingEquipmentImportMarker(key),
      imported: startingEquipmentAlreadyImported(startingEquipmentImportMarker(key)),
    };
  }

  /*
   * Interpreta le formule CA delle armature; gli scudi "+2" vengono
   * classificati a parte per poterli sommare a un'armatura indossata.
   */
  function armorClassFromText(value) {
    const text = String(value || '').trim();
    if (!text) return null;

    const dex = abilityModifier(appState.characterSheet.abilities.dex);
    if (shieldBonusFromText(text) !== null) return null;

    const base = Number(text.match(/\d+/)?.[0]);
    if (!Number.isFinite(base)) return null;
    if (!/des/i.test(text)) return base;

    const maxMatch = text.match(/max\s*(\d+)/i);
    return base + (maxMatch ? Math.min(dex, Number(maxMatch[1])) : dex);
  }

  function shieldBonusFromText(value) {
    const match = String(value || '').trim().match(/^\+(\d+)/);
    return match ? Number(match[1]) : null;
  }

  return {
    armorClassFromEquipment,
    backgroundStartingCoinsOption,
    backgroundStartingCoinsText,
    characterAbilityGuidance,
    characterArmorLoadout,
    characterBackgroundEntry,
    characterBackgroundSkills,
    characterBuilderChecklist,
    characterBuilderChecklistForSheet,
    characterBuilderIssues,
    characterCarryingLoad,
    characterInitiative,
    characterOriginFeat,
    characterSkillChoiceProgress,
    characterSkillChoiceState,
    characterSpeciesEntry,
    characterSuggestedArmorClass,
    characterSuggestedHitPoints,
    classStartingEquipmentOptions,
    classStartingEquipmentText,
    equipmentArmorKind,
    selectedClassTraits,
    skillSources,
    startingEquipmentAlreadyImported,
    startingEquipmentImportMarker,
    startingEquipmentOptionText,
  };
}

export function normalizeSheetLabel(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
