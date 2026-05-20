export function createCharacterSheetEventsController({
  appState,
  views,
  saveCharacterSheet,
  renderCharacterSheet,
  characterClassEntry,
  applyClassToCharacterSheet,
  applySpeciesToCharacterSheet,
  applyBackgroundToCharacterSheet,
  syncCharacterSheetClassResources,
  normalizeIdList,
  resetCharacterResources,
  addSpellToCharacterSheet,
  addEquipmentItemToCharacterSheet,
  characterSpellSlots,
  exportCharacterSheet,
  importCharacterSheet,
  exportCharacterSheetArchive,
  importCharacterSheetArchive,
  exportAppBackup,
  importAppBackup,
  applyAppBackupImport,
  applyCharacterSheetArchiveImport,
  switchCharacterSheet,
  createNewCharacterSheet,
  duplicateCharacterSheet,
  deleteActiveCharacterSheet,
}) {
  function bindCharacterSheetEvents() {
    views.detail.querySelectorAll('[data-sheet-field]').forEach((node) => {
      node.addEventListener('input', (event) => {
        appState.characterSheet[event.currentTarget.dataset.sheetField] = event.currentTarget.value;
        saveCharacterSheet();
      });

      node.addEventListener('change', (event) => {
        const field = event.currentTarget.dataset.sheetField;

        if (field === 'classId') {
          const classEntry = characterClassEntry();
          if (classEntry) applyClassToCharacterSheet(classEntry);
          saveCharacterSheet();
        } else if (field === 'ancestry') {
          const species = originEntry(appState.data.species, event.currentTarget.value);
          if (species) {
            applySpeciesToCharacterSheet(species);
          } else {
            appState.characterSheet.ancestry = event.currentTarget.value;
            saveCharacterSheet();
          }
        } else if (field === 'background') {
          const background = originEntry(appState.data.backgrounds, event.currentTarget.value);
          if (background) {
            applyBackgroundToCharacterSheet(background);
          } else {
            appState.characterSheet.background = event.currentTarget.value;
            saveCharacterSheet();
          }
        }
        renderCharacterSheet(appState.characterSheetTab);
      });
    });

    views.detail.querySelectorAll('[data-sheet-number]').forEach((node) => {
      node.addEventListener('input', (event) => {
        appState.characterSheet[event.currentTarget.dataset.sheetNumber] = Number(event.currentTarget.value) || 0;
        saveCharacterSheet();
      });

      node.addEventListener('change', (event) => {
        if (event.currentTarget.dataset.sheetNumber === 'level') {
          syncCharacterSheetClassResources();
          saveCharacterSheet();
        }
        renderCharacterSheet(appState.characterSheetTab);
      });
    });

    views.detail.querySelectorAll('[data-sheet-ability]').forEach((node) => {
      node.addEventListener('input', (event) => {
        appState.characterSheet.abilities[event.currentTarget.dataset.sheetAbility] = Number(event.currentTarget.value) || 0;
        saveCharacterSheet();
      });

      node.addEventListener('change', () => renderCharacterSheet(appState.characterSheetTab));
    });

    views.detail.querySelectorAll('[data-sheet-save]').forEach((node) => {
      node.addEventListener('change', (event) => {
        appState.characterSheet.savingThrows[event.currentTarget.dataset.sheetSave] = event.currentTarget.checked;
        saveCharacterSheet();
        renderCharacterSheet(appState.characterSheetTab);
      });
    });

    views.detail.querySelectorAll('[data-sheet-skill]').forEach((node) => {
      node.addEventListener('change', (event) => {
        appState.characterSheet.skillProficiencies[event.currentTarget.dataset.sheetSkill] = Number(event.currentTarget.value) || 0;
        saveCharacterSheet();
        renderCharacterSheet(appState.characterSheetTab);
      });
    });

    views.detail.querySelectorAll('[data-sheet-suggest-skill]').forEach((node) => {
      node.addEventListener('click', (event) => {
        appState.characterSheet.skillProficiencies[event.currentTarget.dataset.sheetSuggestSkill] = 1;
        saveCharacterSheet();
        renderCharacterSheet(appState.characterSheetTab);
      });
    });

    views.detail.querySelectorAll('[data-sheet-proficiency]').forEach((node) => {
      node.addEventListener('input', (event) => {
        appState.characterSheet.proficiencies[event.currentTarget.dataset.sheetProficiency] = event.currentTarget.value;
        saveCharacterSheet();
      });
    });

    views.detail.querySelectorAll('[data-sheet-status-check]').forEach((node) => {
      node.addEventListener('change', (event) => {
        appState.characterSheet.status[event.currentTarget.dataset.sheetStatusCheck] = event.currentTarget.checked;
        saveCharacterSheet();
        renderCharacterSheet('combat');
      });
    });

    views.detail.querySelectorAll('[data-sheet-status-number]').forEach((node) => {
      node.addEventListener('input', (event) => {
        const key = event.currentTarget.dataset.sheetStatusNumber;
        const max = key === 'exhaustion' ? 6 : 3;
        appState.characterSheet.status[key] = Math.min(max, Math.max(0, Number(event.currentTarget.value) || 0));
        saveCharacterSheet();
      });

      node.addEventListener('change', () => renderCharacterSheet('combat'));
    });

    views.detail.querySelectorAll('[data-sheet-status-field]').forEach((node) => {
      node.addEventListener('input', (event) => {
        appState.characterSheet.status[event.currentTarget.dataset.sheetStatusField] = event.currentTarget.value;
        saveCharacterSheet();
      });
    });

    views.detail.querySelector('[data-sheet-add-condition]')?.addEventListener('change', (event) => {
      const id = event.currentTarget.value;
      if (!id) return;

      appState.characterSheet.status.conditions = normalizeIdList([...appState.characterSheet.status.conditions, id]);
      saveCharacterSheet();
      renderCharacterSheet('combat');
    });

    views.detail.querySelectorAll('[data-sheet-remove-condition]').forEach((node) => {
      node.addEventListener('click', (event) => {
        const id = event.currentTarget.dataset.sheetRemoveCondition;
        appState.characterSheet.status.conditions = appState.characterSheet.status.conditions.filter((conditionId) => conditionId !== id);
        saveCharacterSheet();
        renderCharacterSheet('combat');
      });
    });

    views.detail.querySelector('[data-sheet-add-resource]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();

      if (!name) return;

      appState.characterSheet.resources.push({
        id: `resource-${Date.now().toString(36)}`,
        name,
        max: Math.max(0, Number(data.get('max')) || 0),
        used: 0,
        recovery: String(data.get('recovery') || '').trim(),
      });
      saveCharacterSheet();
      renderCharacterSheet('combat');
    });

    views.detail.querySelectorAll('[data-sheet-resource-delta]').forEach((node) => {
      node.addEventListener('click', (event) => {
        const id = event.currentTarget.dataset.sheetResourceId;
        const delta = Number(event.currentTarget.dataset.sheetResourceDelta) || 0;
        const resource = appState.characterSheet.resources.find((entry) => entry.id === id);

        if (!resource) return;

        const max = Math.max(0, Number(resource.max) || 0);
        resource.used = Math.min(max, Math.max(0, (Number(resource.used) || 0) + delta));
        saveCharacterSheet();
        renderCharacterSheet('combat');
      });
    });

    views.detail.querySelectorAll('[data-sheet-resource-field]').forEach((node) => {
      node.addEventListener('input', (event) => {
        const id = event.currentTarget.dataset.sheetResourceId;
        const field = event.currentTarget.dataset.sheetResourceField;
        const resource = appState.characterSheet.resources.find((entry) => entry.id === id);

        if (!resource) return;

        if (field === 'max') {
          resource.max = Math.max(0, Number(event.currentTarget.value) || 0);
          resource.used = Math.min(resource.max, Math.max(0, Number(resource.used) || 0));
        } else if (field === 'name' || field === 'recovery') {
          resource[field] = event.currentTarget.value;
        }
        saveCharacterSheet();
      });

      node.addEventListener('change', () => renderCharacterSheet('combat'));
    });

    views.detail.querySelectorAll('[data-sheet-reset-resources]').forEach((node) => {
      node.addEventListener('click', (event) => {
        resetCharacterResources(event.currentTarget.dataset.sheetResetResources);
        if (event.currentTarget.dataset.sheetResetResources === 'long') {
          appState.characterSheet.spellSlotsUsed = {};
          appState.characterSheet.currentHp = Number(appState.characterSheet.maxHp) || appState.characterSheet.currentHp;
          appState.characterSheet.tempHp = 0;
          appState.characterSheet.status.concentration = false;
          appState.characterSheet.status.deathSaveSuccesses = 0;
          appState.characterSheet.status.deathSaveFailures = 0;
        }
        saveCharacterSheet();
        renderCharacterSheet('combat');
      });
    });

    views.detail.querySelector('[data-sheet-apply-derived-ac]')?.addEventListener('click', () => {
      appState.characterSheet.armorClass = characterSuggestedArmorClass();
      saveCharacterSheet();
      renderCharacterSheet('combat');
    });

    views.detail.querySelector('[data-sheet-apply-derived-hp]')?.addEventListener('click', () => {
      const hp = characterSuggestedHitPoints();
      appState.characterSheet.maxHp = hp;
      if (!Number(appState.characterSheet.currentHp)) {
        appState.characterSheet.currentHp = hp;
      }
      saveCharacterSheet();
      renderCharacterSheet('combat');
    });

    views.detail.querySelectorAll('[data-sheet-remove-resource]').forEach((node) => {
      node.addEventListener('click', (event) => {
        const id = event.currentTarget.dataset.sheetRemoveResource;
        appState.characterSheet.resources = appState.characterSheet.resources.filter((resource) => resource.id !== id);
        saveCharacterSheet();
        renderCharacterSheet('combat');
      });
    });

    views.detail.querySelector('[data-sheet-add-attack]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();

      if (!name) return;

      appState.characterSheet.attacks.push({
        id: `attack-${Date.now().toString(36)}`,
        name,
        ability: String(data.get('ability') || 'str'),
        proficient: data.get('proficient') === 'on',
        bonus: 0,
        damage: String(data.get('damage') || '').trim(),
        damageType: String(data.get('damageType') || '').trim(),
        notes: '',
      });
      saveCharacterSheet();
      renderCharacterSheet('combat');
    });

    views.detail.querySelectorAll('[data-sheet-remove-attack]').forEach((node) => {
      node.addEventListener('click', (event) => {
        const id = event.currentTarget.dataset.sheetRemoveAttack;
        appState.characterSheet.attacks = appState.characterSheet.attacks.filter((attack) => attack.id !== id);
        saveCharacterSheet();
        renderCharacterSheet('combat');
      });
    });

    views.detail.querySelectorAll('[data-sheet-attack-field]').forEach((node) => {
      const updateAttack = (event) => {
        const id = event.currentTarget.dataset.sheetAttackId;
        const field = event.currentTarget.dataset.sheetAttackField;
        const attack = appState.characterSheet.attacks.find((entry) => entry.id === id);

        if (!attack) return;

        if (field === 'bonus') {
          attack.bonus = Number(event.currentTarget.value) || 0;
        } else if (field === 'proficient') {
          attack.proficient = event.currentTarget.checked;
        } else if (['name', 'ability', 'damage', 'damageType', 'notes'].includes(field)) {
          attack[field] = event.currentTarget.value;
        }
        saveCharacterSheet();
      };

      node.addEventListener('input', updateAttack);
      node.addEventListener('change', (event) => {
        updateAttack(event);
        renderCharacterSheet('combat');
      });
    });

    views.detail.querySelectorAll('[data-sheet-coin]').forEach((node) => {
      node.addEventListener('input', (event) => {
        appState.characterSheet.coins[event.currentTarget.dataset.sheetCoin] = Number(event.currentTarget.value) || 0;
        saveCharacterSheet();
      });
    });

    views.detail.querySelectorAll('[data-sheet-apply-starting-equipment]').forEach((node) => {
      node.addEventListener('click', (event) => {
        applyStartingEquipment(event.currentTarget.dataset.sheetApplyStartingEquipment);
        saveCharacterSheet();
        renderCharacterSheet('inventory');
      });
    });

    views.detail.querySelector('[data-sheet-add-equipment]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();

      if (!name) return;

      appState.characterSheet.equipmentItems.push({
        id: `equipment-${Date.now().toString(36)}`,
        name,
        quantity: Math.max(1, Number(data.get('quantity')) || 1),
        weight: String(data.get('weight') || '').trim(),
        cost: String(data.get('cost') || '').trim(),
        source: '',
        notes: '',
        armorClass: '',
        equipped: false,
      });
      saveCharacterSheet();
      renderCharacterSheet('inventory');
    });

    views.detail.querySelectorAll('[data-sheet-equipment-field]').forEach((node) => {
      node.addEventListener('input', (event) => {
        const id = event.currentTarget.dataset.sheetEquipmentId;
        const field = event.currentTarget.dataset.sheetEquipmentField;
        const item = appState.characterSheet.equipmentItems.find((entry) => entry.id === id);

        if (!item) return;

        if (field === 'quantity') {
          item.quantity = Math.max(1, Number(event.currentTarget.value) || 1);
        } else if (['name', 'weight', 'cost', 'notes'].includes(field)) {
          item[field] = event.currentTarget.value;
        }
        saveCharacterSheet();
      });

      node.addEventListener('change', () => renderCharacterSheet('inventory'));
    });

    views.detail.querySelectorAll('[data-sheet-apply-armor]').forEach((node) => {
      node.addEventListener('click', (event) => {
        const id = event.currentTarget.dataset.sheetApplyArmor;
        const item = appState.characterSheet.equipmentItems.find((entry) => entry.id === id);
        const armorClass = armorClassFromEquipment(item);

        if (!item || armorClass === null) return;

        appState.characterSheet.armorClass = armorClass;
        appState.characterSheet.equipmentItems = appState.characterSheet.equipmentItems.map((entry) => ({
          ...entry,
          equipped: entry.id === id,
        }));
        saveCharacterSheet();
        renderCharacterSheet('inventory');
      });
    });

    views.detail.querySelectorAll('[data-sheet-remove-equipment]').forEach((node) => {
      node.addEventListener('click', (event) => {
        const id = event.currentTarget.dataset.sheetRemoveEquipment;
        appState.characterSheet.equipmentItems = appState.characterSheet.equipmentItems.filter((item) => item.id !== id);
        saveCharacterSheet();
        renderCharacterSheet('inventory');
      });
    });

    views.detail.querySelector('[data-sheet-add-spell]')?.addEventListener('change', (event) => {
      const id = event.currentTarget.value;
      if (id) {
        addSpellToCharacterSheet(id);
        renderCharacterSheet('spells');
      }
    });

    views.detail.querySelectorAll('[data-sheet-remove-spell]').forEach((node) => {
      node.addEventListener('click', (event) => {
        const id = event.currentTarget.dataset.sheetRemoveSpell;
        appState.characterSheet.preparedSpells = appState.characterSheet.preparedSpells.filter((spellId) => spellId !== id);
        saveCharacterSheet();
        renderCharacterSheet('spells');
      });
    });

    views.detail.querySelectorAll('[data-sheet-slot-delta]').forEach((node) => {
      node.addEventListener('click', (event) => {
        const label = event.currentTarget.dataset.sheetSlotLabel;
        const delta = Number(event.currentTarget.dataset.sheetSlotDelta) || 0;
        const max = Number(characterSpellSlots().find(([slotLabel]) => slotLabel === label)?.[1]) || 0;
        const used = Math.min(max, Math.max(0, (Number(appState.characterSheet.spellSlotsUsed[label]) || 0) + delta));

        appState.characterSheet.spellSlotsUsed[label] = used;
        saveCharacterSheet();
        renderCharacterSheet('spells');
      });
    });

    views.detail.querySelector('[data-sheet-reset-spell-slots]')?.addEventListener('click', () => {
      appState.characterSheet.spellSlotsUsed = {};
      saveCharacterSheet();
      renderCharacterSheet('spells');
    });

    views.detail.querySelectorAll('[data-sheet-remove-magic-item]').forEach((node) => {
      node.addEventListener('click', (event) => {
        const id = event.currentTarget.dataset.sheetRemoveMagicItem;
        appState.characterSheet.magicItems = appState.characterSheet.magicItems.filter((item) => item.id !== id);
        appState.characterSheet.attunedMagicItems = appState.characterSheet.attunedMagicItems.filter((itemId) => itemId !== id);
        saveCharacterSheet();
        renderCharacterSheet('inventory');
      });
    });

    views.detail.querySelectorAll('[data-sheet-toggle-attunement]').forEach((node) => {
      node.addEventListener('change', (event) => {
        const id = event.currentTarget.dataset.sheetToggleAttunement;
        if (event.currentTarget.checked) {
          appState.characterSheet.attunedMagicItems = normalizeIdList([...appState.characterSheet.attunedMagicItems, id]);
        } else {
          appState.characterSheet.attunedMagicItems = appState.characterSheet.attunedMagicItems.filter((itemId) => itemId !== id);
        }
        saveCharacterSheet();
        renderCharacterSheet('inventory');
      });
    });

    views.detail.querySelectorAll('[data-sheet-remove-reference]').forEach((node) => {
      node.addEventListener('click', (event) => {
        const section = event.currentTarget.dataset.sheetReferenceSection;
        const id = event.currentTarget.dataset.sheetRemoveReference;
        appState.characterSheet.references = appState.characterSheet.references
          .filter((entry) => entry.section !== section || entry.id !== id);
        saveCharacterSheet();
        renderCharacterSheet('notes');
      });
    });

    views.detail.querySelector('[data-sheet-export]')?.addEventListener('click', exportCharacterSheet);
    views.detail.querySelector('[data-sheet-import]')?.addEventListener('click', () => {
      views.detail.querySelector('#character-sheet-import')?.click();
    });
    views.detail.querySelector('#character-sheet-import')?.addEventListener('change', importCharacterSheet);
    views.detail.querySelector('[data-sheet-export-archive]')?.addEventListener('click', exportCharacterSheetArchive);
    views.detail.querySelector('[data-sheet-import-archive]')?.addEventListener('click', () => {
      views.detail.querySelector('#character-sheet-archive-import')?.click();
    });
    views.detail.querySelector('#character-sheet-archive-import')?.addEventListener('change', importCharacterSheetArchive);
    views.detail.querySelector('[data-app-export-backup]')?.addEventListener('click', exportAppBackup);
    views.detail.querySelector('[data-app-import-backup]')?.addEventListener('click', () => {
      views.detail.querySelector('#app-backup-import')?.click();
    });
    views.detail.querySelector('#app-backup-import')?.addEventListener('change', importAppBackup);
    views.detail.querySelector('[data-app-import-backup-apply]')?.addEventListener('click', applyAppBackupImport);
    views.detail.querySelector('[data-app-import-backup-cancel]')?.addEventListener('click', () => {
      appState.pendingAppBackup = null;
      renderCharacterSheet(appState.characterSheetTab);
    });
    views.detail.querySelectorAll('[data-sheet-import-archive-mode]').forEach((node) => {
      node.addEventListener('click', (event) => {
        applyCharacterSheetArchiveImport(event.currentTarget.dataset.sheetImportArchiveMode);
      });
    });
    views.detail.querySelector('[data-sheet-import-archive-cancel]')?.addEventListener('click', () => {
      appState.pendingCharacterSheetArchive = null;
      renderCharacterSheet(appState.characterSheetTab);
    });
    views.detail.querySelector('[data-sheet-switch-character]')?.addEventListener('change', (event) => {
      if (switchCharacterSheet(event.currentTarget.value)) renderCharacterSheet(appState.characterSheetTab);
    });
    views.detail.querySelector('[data-sheet-reset]')?.addEventListener('click', () => {
      createNewCharacterSheet();
      renderCharacterSheet('overview');
    });
    views.detail.querySelector('[data-sheet-duplicate]')?.addEventListener('click', () => {
      duplicateCharacterSheet();
      renderCharacterSheet('overview');
    });
    views.detail.querySelector('[data-sheet-delete]')?.addEventListener('click', () => {
      if (appState.characterSheets.length <= 1) {
        alert('Deve restare almeno una scheda.');
        return;
      }
      if (!confirm('Eliminare la scheda personaggio attiva?')) return;
      deleteActiveCharacterSheet();
      renderCharacterSheet('overview');
    });
  }

  function armorClassFromEquipment(item) {
    const text = String(item?.armorClass || '').trim();
    if (!text) return null;

    const dex = Math.floor(((Number(appState.characterSheet.abilities?.dex) || 10) - 10) / 2);
    const shield = text.match(/^\+(\d+)/);
    if (shield) return Math.max(0, Number(appState.characterSheet.armorClass) || 10) + Number(shield[1]);

    const base = Number(text.match(/\d+/)?.[0]);
    if (!Number.isFinite(base)) return null;
    if (!/des/i.test(text)) return base;

    const maxMatch = text.match(/max\s*(\d+)/i);
    const dexBonus = maxMatch ? Math.min(dex, Number(maxMatch[1])) : dex;

    return base + dexBonus;
  }

  function applyStartingEquipment(mode) {
    if (mode === 'background-coins') {
      applyCoinsFromText(backgroundEntry()?.equipaggiamento_alternativo || '');
      return;
    }

    const text = classStartingEquipmentText();
    const optionText = startingEquipmentOptionText(text, mode);
    const result = importEquipmentText(optionText || text, 'Equipaggiamento iniziale');

    if (result.unmatched.length) {
      appendEquipmentNote(`Da verificare (${result.source}): ${result.unmatched.join(', ')}`);
    }
  }

  function importEquipmentText(text, source) {
    const cleaned = String(text || '').replace(/^A\s*:\s*|^B\s*:\s*/i, '').trim();
    const withoutCoins = applyCoinsFromText(cleaned);
    const parts = withoutCoins
      .split(/,|\se\s/gi)
      .map((part) => part.trim().replace(/\.$/, ''))
      .filter(Boolean);
    const unmatched = [];

    parts.forEach((part) => {
      const quantityMatch = part.match(/^(\d+)\s+(.+)$/);
      const quantity = quantityMatch ? Math.max(1, Number(quantityMatch[1]) || 1) : 1;
      const name = quantityMatch ? quantityMatch[2] : part;
      const item = equipmentEntryByName(name);

      if (!item) {
        unmatched.push(part);
        return;
      }

      addEquipmentItemToCharacterSheet(item);
      const added = appState.characterSheet.equipmentItems.find((entry) => normalizeLabel(entry.name) === normalizeLabel(item.nome));
      if (added) {
        added.quantity = Math.max(Number(added.quantity) || 1, quantity);
      }
    });

    return { source, unmatched };
  }

  function applyCoinsFromText(text) {
    return String(text || '').replace(/(\d+)\s*(pp|mo|ma|mr)\b/gi, (_match, amount, coin) => {
      const key = String(coin).toLowerCase();
      appState.characterSheet.coins[key] = Math.max(0, Number(appState.characterSheet.coins[key]) || 0) + Number(amount);
      return '';
    });
  }

  function equipmentEntryByName(name) {
    const key = normalizeLabel(name);
    return appState.data.equipment.find((item) => {
      const itemName = normalizeLabel(item.nome);
      return itemName === key || pluralAliases(itemName).includes(key);
    }) || null;
  }

  function pluralAliases(value) {
    const aliases = [];
    if (value.endsWith('cia')) aliases.push(`${value.slice(0, -3)}ce`);
    if (value.endsWith('gia')) aliases.push(`${value.slice(0, -3)}ge`);
    if (value.endsWith('a')) aliases.push(`${value.slice(0, -1)}e`);
    if (value.endsWith('o')) aliases.push(`${value.slice(0, -1)}i`);
    if (value.endsWith('e')) aliases.push(`${value.slice(0, -1)}i`);
    return aliases;
  }

  function classStartingEquipmentText() {
    const traits = characterClassEntry()?.sezioni?.find((section) => String(section.titolo || '').startsWith('Tratti '));
    const row = traits?.righe?.find((entry) => (entry.chiave || entry.Voce) === 'Equipaggiamento iniziale');
    return String(row?.valore || row?.Riepilogo || '').replace(/\.$/, '').trim();
  }

  function startingEquipmentOptionText(text, mode) {
    const match = String(text || '').match(/\bA\s*:\s*(.*?)(?:;\s*oppure\s*B\s*:\s*(.*)|$)/i);
    if (!match) return text;
    if (mode === 'class-a') return match[1] || '';
    if (mode === 'class-b') return match[2] || '';
    return text;
  }

  function backgroundEntry() {
    const value = appState.characterSheet.background;
    return appState.data.backgrounds.find((entry) => entry.id === value || entry.nome === value) || null;
  }

  function appendEquipmentNote(note) {
    const text = String(appState.characterSheet.equipment || '').trim();
    if (text.includes(note)) return;
    appState.characterSheet.equipment = text ? `${text}\n\n${note}` : note;
  }

  function normalizeLabel(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’']/g, '')
      .trim();
  }

  function characterSuggestedHitPoints() {
    const level = Math.min(20, Math.max(1, Number(appState.characterSheet.level) || 1));
    const hitDie = Number(String(appState.characterSheet.hitDice || '').match(/d(\d+)/i)?.[1]) || 8;
    const con = Math.floor(((Number(appState.characterSheet.abilities?.con) || 10) - 10) / 2);
    const firstLevel = Math.max(1, hitDie + con);
    const laterLevel = Math.max(1, Math.floor(hitDie / 2) + 1 + con);

    return firstLevel + Math.max(0, level - 1) * laterLevel;
  }

  function characterSuggestedArmorClass() {
    const equippedArmor = appState.characterSheet.equipmentItems.find((item) => item.equipped && item.armorClass);
    const armorClass = armorClassFromEquipment(equippedArmor);
    if (armorClass !== null) return armorClass;

    const dex = Math.floor(((Number(appState.characterSheet.abilities?.dex) || 10) - 10) / 2);
    return 10 + dex;
  }

  function originEntry(entries, value) {
    const selected = String(value || '');
    if (!selected || !Array.isArray(entries)) return null;

    return entries.find((entry) => entry.id === selected || entry.nome === selected) || null;
  }

  return { bindCharacterSheetEvents };
}
