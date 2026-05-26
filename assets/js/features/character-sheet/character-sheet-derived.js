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
        label: 'Riferimenti',
        complete: sheet.references.length >= 3,
        hint: 'Classe, specie, background e regole utili',
        href: '#/character_sheet/notes',
      },
    ];
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
    const equippedArmor = appState.characterSheet.equipmentItems.find((item) => item.equipped && item.armorClass);
    const armorClass = armorClassFromEquipment(equippedArmor);
    if (armorClass !== null) return armorClass;

    return 10 + abilityModifier(appState.characterSheet.abilities.dex);
  }

  function armorClassFromEquipment(item) {
    return armorClassFromText(item?.armorClass);
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
   * Interpreta le formule CA dei dati equipaggiamento SRD, ad esempio
   * "11 + Des", "14 + Des (max 2)" o "+2" per uno scudo.
   */
  function armorClassFromText(value) {
    const text = String(value || '').trim();
    if (!text) return null;

    const dex = abilityModifier(appState.characterSheet.abilities.dex);
    const shield = text.match(/^\+(\d+)/);
    if (shield) return (Number(appState.characterSheet.armorClass) || 10) + Number(shield[1]);

    const base = Number(text.match(/\d+/)?.[0]);
    if (!Number.isFinite(base)) return null;
    if (!/des/i.test(text)) return base;

    const maxMatch = text.match(/max\s*(\d+)/i);
    return base + (maxMatch ? Math.min(dex, Number(maxMatch[1])) : dex);
  }

  return {
    armorClassFromEquipment,
    backgroundStartingCoinsOption,
    backgroundStartingCoinsText,
    characterBackgroundEntry,
    characterBackgroundSkills,
    characterBuilderChecklist,
    characterInitiative,
    characterOriginFeat,
    characterSkillChoiceProgress,
    characterSpeciesEntry,
    characterSuggestedArmorClass,
    characterSuggestedHitPoints,
    classStartingEquipmentOptions,
    classStartingEquipmentText,
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
