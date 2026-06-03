import { activeEffectModifier } from './character-sheet-normalizers.js?v=20260531-1';

export function createCharacterSheetSelectors({
  appState,
  abilityMeta,
  normalizeText,
  classProgressionRow,
}) {
  function characterClassOptions() {
    return [
      { value: '', label: 'Nessuna classe' },
      ...appState.data.classes.map((entry) => ({ value: entry.id, label: cleanClassName(entry.nome) })),
    ];
  }

  function characterClassEntry() {
    return appState.data.classes.find((entry) => entry.id === appState.characterSheet.classId);
  }

  function characterConditionOptions() {
    return appState.data.rules_glossary
      .filter((entry) => normalizeText(entry.descrittore) === 'condizione')
      .sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'it'));
  }

  function characterSpellSlots() {
    const row = classProgressionRow(characterClassEntry(), characterLevel());

    if (!row) return [];

    return Object.entries(row)
      .filter(([label, value]) => {
        const text = String(value || '').trim();
        return /^Slot\s+/i.test(label) && text !== '' && text !== '-';
      });
  }

  function characterAttackBonus(attack) {
    const ability = abilityMeta.some(([key]) => key === attack.ability) ? attack.ability : 'str';
    const proficiency = attack.proficient ? characterProficiencyBonus() : 0;

    return abilityModifier(appState.characterSheet.abilities[ability]) +
      proficiency +
      (Number(attack.bonus) || 0) +
      activeEffectModifier(appState.characterSheet.activeEffects, 'attack');
  }

  function abilityOptions() {
    return abilityMeta.map(([value, label]) => ({ value, label }));
  }

  function characterSpellOptions() {
    const className = characterSheetClassName().toLowerCase();

    return appState.data.spells
      .filter((spell) => !className || spell.classi?.includes(className))
      .sort((a, b) => Number(a.livello) - Number(b.livello) || String(a.nome).localeCompare(String(b.nome), 'it'));
  }

  function spellOptionLabel(spell) {
    return [spell.nome, spellLevel(spell), spell.scuola].filter(Boolean).join(' · ');
  }

  function characterSheetClassName() {
    const classEntry = appState.data.classes.find((entry) => entry.id === appState.characterSheet.classId);
    return classEntry ? cleanClassName(classEntry.nome) : '';
  }

  function characterLevel() {
    return Math.min(20, Math.max(1, Number(appState.characterSheet.level) || 1));
  }

  function characterProficiencyBonus() {
    return proficiencyBonusForLevel(characterLevel());
  }

  function skillProficiencyBonus(rank) {
    return characterProficiencyBonus() * Math.min(2, Math.max(0, Number(rank) || 0));
  }

  return {
    characterClassOptions,
    characterClassEntry,
    characterConditionOptions,
    characterSpellSlots,
    characterAttackBonus,
    abilityOptions,
    characterSpellOptions,
    spellOptionLabel,
    characterSheetClassName,
    characterLevel,
    characterProficiencyBonus,
    skillProficiencyBonus,
    abilityModifier,
    formatSigned,
    rollFormula,
    spellLevel,
  };
}

export function cleanClassName(name) {
  return String(name || '').replace(/^Classe:\s*/i, '');
}

export function proficiencyBonusForLevel(level) {
  const value = Math.min(20, Math.max(1, Number(level) || 1));

  if (value >= 17) return 6;
  if (value >= 13) return 5;
  if (value >= 9) return 4;
  if (value >= 5) return 3;
  return 2;
}

export function abilityModifier(score) {
  return Math.floor(((Number(score) || 10) - 10) / 2);
}

export function formatSigned(value) {
  const number = Number(value) || 0;
  return number >= 0 ? `+${number}` : String(number);
}

export function rollFormula(faces, modifier) {
  const value = Number(modifier) || 0;
  if (!value) return `1d${faces}`;
  return `1d${faces} ${value > 0 ? '+' : '-'} ${Math.abs(value)}`;
}

export function spellLevel(spell) {
  if (spell.livello === 0) return 'Trucchetto';
  if (spell.livello === null || spell.livello === undefined) return '';
  return `${spell.livello}° livello`;
}
