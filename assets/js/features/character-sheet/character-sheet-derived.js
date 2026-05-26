export function createCharacterSheetDerivedModel({
  appState,
  abilityMeta,
  skillMeta,
  classSkillOptions,
  classSkillChoiceCount,
  characterClassEntry,
  classTraitsMap,
}) {
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

  return {
    characterBackgroundEntry,
    characterBackgroundSkills,
    characterBuilderChecklist,
    characterOriginFeat,
    characterSkillChoiceProgress,
    characterSpeciesEntry,
    selectedClassTraits,
    skillSources,
  };
}

export function normalizeSheetLabel(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
