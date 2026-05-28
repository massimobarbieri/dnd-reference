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
  classProgressionRow,
  nextLevelSummary,
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
  characterSheetDerived,
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

    views.detail.querySelector('[data-sheet-notice-dismiss]')?.addEventListener('click', () => {
      appState.characterSheetNotice = '';
      renderCharacterSheet(appState.characterSheetTab);
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

    views.detail.querySelector('[data-sheet-apply-background-skills]')?.addEventListener('click', () => {
      applyBackgroundSkills();
    });

    views.detail.querySelector('[data-sheet-create-builder]')?.addEventListener('click', () => {
      createNewCharacterSheet();
      appState.characterSheetBuilderStep = 'identity';
      location.hash = '#/character_sheet/builder';
    });

    views.detail.querySelectorAll('[data-sheet-open-character]').forEach((node) => {
      node.addEventListener('click', (event) => {
        if (switchCharacterSheet(event.currentTarget.dataset.sheetOpenCharacter)) {
          location.hash = '#/character_sheet/overview';
        }
      });
    });

    views.detail.querySelectorAll('[data-sheet-continue-character]').forEach((node) => {
      node.addEventListener('click', (event) => {
        if (!switchCharacterSheet(event.currentTarget.dataset.sheetContinueCharacter)) return;
        appState.characterSheetBuilderStep = nextBuilderStepForActiveSheet();
        location.hash = '#/character_sheet/builder';
      });
    });

    views.detail.querySelectorAll('[data-sheet-rename-character]').forEach((node) => {
      node.addEventListener('click', (event) => {
        if (!switchCharacterSheet(event.currentTarget.dataset.sheetRenameCharacter)) return;
        const name = prompt('Nome personaggio', appState.characterSheet.name || '');
        if (name === null) return;
        appState.characterSheet.name = name.trim() || 'Nuovo personaggio';
        appState.characterSheetNotice = `Scheda rinominata in ${appState.characterSheet.name}.`;
        saveCharacterSheet();
        renderCharacterSheet('characters');
      });
    });

    views.detail.querySelectorAll('[data-sheet-duplicate-character]').forEach((node) => {
      node.addEventListener('click', (event) => {
        if (!switchCharacterSheet(event.currentTarget.dataset.sheetDuplicateCharacter)) return;
        duplicateCharacterSheet();
        appState.characterSheetNotice = `Duplicata ${appState.characterSheet.name || 'scheda personaggio'}.`;
        location.hash = '#/character_sheet/overview';
      });
    });

    views.detail.querySelectorAll('[data-sheet-export-character]').forEach((node) => {
      node.addEventListener('click', (event) => {
        if (!switchCharacterSheet(event.currentTarget.dataset.sheetExportCharacter)) return;
        exportCharacterSheet();
        renderCharacterSheet('characters');
      });
    });

    views.detail.querySelectorAll('[data-sheet-delete-character]').forEach((node) => {
      node.addEventListener('click', (event) => {
        if (appState.characterSheets.length <= 1) {
          alert('Deve restare almeno una scheda.');
          return;
        }
        if (!switchCharacterSheet(event.currentTarget.dataset.sheetDeleteCharacter)) return;
        if (!confirm(`Eliminare "${appState.characterSheet.name || 'Scheda personaggio'}"?`)) {
          renderCharacterSheet('characters');
          return;
        }
        deleteActiveCharacterSheet();
        appState.characterSheetNotice = 'Scheda eliminata.';
        renderCharacterSheet('characters');
      });
    });

    views.detail.querySelectorAll('[data-sheet-builder-action]').forEach((node) => {
      node.addEventListener('click', (event) => {
        applyBuilderAction(event.currentTarget.dataset.sheetBuilderAction, event.currentTarget.dataset.sheetBuilderActionValue);
      });
    });

    views.detail.querySelectorAll('[data-sheet-jump]').forEach((node) => {
      node.addEventListener('click', (event) => {
        const target = views.detail.querySelector(`#${event.currentTarget.dataset.sheetJump}`);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    views.detail.querySelectorAll('[data-sheet-builder-step]').forEach((node) => {
      node.addEventListener('click', (event) => {
        appState.characterSheetBuilderStep = event.currentTarget.dataset.sheetBuilderStep;
        renderCharacterSheet('builder');
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

    views.detail.querySelectorAll('[data-sheet-combat-toggle]').forEach((node) => {
      node.addEventListener('click', (event) => {
        toggleCombatState(event.currentTarget.dataset.sheetCombatToggle);
        saveCharacterSheet();
        renderCharacterSheet('combat');
      });
    });

    views.detail.querySelectorAll('[data-sheet-combat-round-delta]').forEach((node) => {
      node.addEventListener('click', (event) => {
        adjustCombatRound(Number(event.currentTarget.dataset.sheetCombatRoundDelta) || 0);
        saveCharacterSheet();
        renderCharacterSheet('combat');
      });
    });

    views.detail.querySelector('[data-sheet-combat-new-turn]')?.addEventListener('click', () => {
      resetCombatTurn();
      saveCharacterSheet();
      renderCharacterSheet('combat');
    });

    views.detail.querySelectorAll('[data-sheet-combat-movement-delta]').forEach((node) => {
      node.addEventListener('click', (event) => {
        adjustCombatMovement(Number(event.currentTarget.dataset.sheetCombatMovementDelta) || 0);
        saveCharacterSheet();
        renderCharacterSheet('combat');
      });
    });

    views.detail.querySelector('[data-sheet-combat-reset-movement]')?.addEventListener('click', () => {
      ensureCombatState().movementUsed = 0;
      saveCharacterSheet();
      renderCharacterSheet('combat');
    });

    views.detail.querySelectorAll('[data-sheet-concentration-field]').forEach((node) => {
      node.addEventListener('input', (event) => {
        appState.characterSheet.status[event.currentTarget.dataset.sheetConcentrationField] = event.currentTarget.value;
        saveCharacterSheet();
      });
    });

    views.detail.querySelectorAll('[data-sheet-concentration-number]').forEach((node) => {
      node.addEventListener('input', (event) => {
        appState.characterSheet.status[event.currentTarget.dataset.sheetConcentrationNumber] = Math.max(10, Number(event.currentTarget.value) || 10);
        saveCharacterSheet();
      });

      node.addEventListener('change', () => renderCharacterSheet('combat'));
    });

    views.detail.querySelector('[data-sheet-concentration-start]')?.addEventListener('click', () => {
      appState.characterSheet.status.concentration = true;
      appState.characterSheet.status.concentrationDc = Math.max(10, Number(appState.characterSheet.status.concentrationDc) || 10);
      saveCharacterSheet();
      renderCharacterSheet('combat');
    });

    views.detail.querySelector('[data-sheet-concentration-clear-dc]')?.addEventListener('click', () => {
      appState.characterSheet.status.concentrationDc = 10;
      saveCharacterSheet();
      renderCharacterSheet('combat');
    });

    views.detail.querySelector('[data-sheet-concentration-drop]')?.addEventListener('click', () => {
      clearConcentration();
      saveCharacterSheet();
      renderCharacterSheet('combat');
    });

    views.detail.querySelector('[data-sheet-hp-form]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const amount = Math.max(0, Number(new FormData(form).get('amount')) || 0);
      const action = event.submitter?.dataset.sheetHpAction || 'damage';
      applyHitPointAction(action, amount);
      saveCharacterSheet();
      renderCharacterSheet('combat');
    });

    views.detail.querySelectorAll('[data-sheet-undo-hp]').forEach((node) => {
      node.addEventListener('click', (event) => {
        if (!undoHitPointAction(event.currentTarget.dataset.sheetUndoHp)) return;
        saveCharacterSheet();
        renderCharacterSheet('combat');
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

    views.detail.querySelector('[data-sheet-level-up]')?.addEventListener('click', () => {
      applyLevelUp();
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
        applyRest(event.currentTarget.dataset.sheetResetResources);
        saveCharacterSheet();
        renderCharacterSheet('combat');
      });
    });

    views.detail.querySelector('[data-sheet-spend-hit-die]')?.addEventListener('click', () => {
      if (!spendHitDie()) return;
      saveCharacterSheet();
      renderCharacterSheet('combat');
    });

    views.detail.querySelectorAll('[data-sheet-hit-die-delta]').forEach((node) => {
      node.addEventListener('click', (event) => {
        if (!adjustHitDiceUsed(Number(event.currentTarget.dataset.sheetHitDieDelta) || 0)) return;
        saveCharacterSheet();
        renderCharacterSheet('combat');
      });
    });

    views.detail.querySelector('[data-sheet-apply-derived-ac]')?.addEventListener('click', () => {
      appState.characterSheet.armorClass = characterSheetDerived.characterSuggestedArmorClass();
      saveCharacterSheet();
      renderCharacterSheet('combat');
    });

    views.detail.querySelector('[data-sheet-apply-derived-hp]')?.addEventListener('click', () => {
      const hp = characterSheetDerived.characterSuggestedHitPoints();
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
        const armorClass = characterSheetDerived.armorClassFromEquipment(item);

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
        renderCharacterSheet(appState.characterSheetTab === 'builder' ? 'builder' : 'spells');
      }
    });

    views.detail.querySelectorAll('[data-sheet-add-spell-button]').forEach((node) => {
      node.addEventListener('click', (event) => {
        addSpellToCharacterSheet(event.currentTarget.dataset.sheetAddSpellButton);
        renderCharacterSheet('spells');
      });
    });

    views.detail.querySelectorAll('[data-sheet-spell-filter]').forEach((node) => {
      node.addEventListener('change', (event) => {
        appState.characterSpellFilters = {
          ...(appState.characterSpellFilters || {}),
          [event.currentTarget.dataset.sheetSpellFilter]: event.currentTarget.value,
        };
        renderCharacterSheet('spells');
      });
    });

    views.detail.querySelectorAll('[data-sheet-cast-spell]').forEach((node) => {
      node.addEventListener('click', (event) => {
        castPreparedSpell(event.currentTarget.dataset.sheetCastSpell);
        saveCharacterSheet();
        renderCharacterSheet(appState.characterSheetTab === 'combat' ? 'combat' : 'spells');
      });
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
      appState.characterSheetNotice = `Duplicata ${appState.characterSheet.name || 'scheda personaggio'}.`;
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

  function applyBuilderAction(action, value) {
    if (action === 'apply-background-skills') {
      applyBackgroundSkills();
      return;
    }
    if (action === 'apply-derived-ac') {
      appState.characterSheet.armorClass = characterSheetDerived.characterSuggestedArmorClass();
      saveCharacterSheet();
      renderCharacterSheet(appState.characterSheetTab);
      return;
    }
    if (action === 'apply-derived-hp') {
      const hp = characterSheetDerived.characterSuggestedHitPoints();
      appState.characterSheet.maxHp = hp;
      if (!Number(appState.characterSheet.currentHp)) {
        appState.characterSheet.currentHp = hp;
      }
      saveCharacterSheet();
      renderCharacterSheet(appState.characterSheetTab);
      return;
    }
    if (action === 'apply-standard-array') {
      applyStandardArray();
      saveCharacterSheet();
      renderCharacterSheet(appState.characterSheetTab);
      return;
    }
    if (action === 'apply-point-buy-base') {
      ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach((key) => {
        appState.characterSheet.abilities[key] = 8;
      });
      saveCharacterSheet();
      renderCharacterSheet(appState.characterSheetTab);
      return;
    }
    if (action === 'apply-starting-equipment') {
      applyStartingEquipment(value);
      saveCharacterSheet();
      renderCharacterSheet(appState.characterSheetTab);
    }
  }

  function applyStandardArray() {
    const preset = classStandardArrayPreset();
    if (preset) {
      appState.characterSheet.abilities = {
        ...appState.characterSheet.abilities,
        ...preset,
      };
      return;
    }

    const values = [15, 14, 13, 12, 10, 8];
    const priorities = characterSheetDerived.characterAbilityGuidance().map((ability) => ability.key);
    const fallback = ['dex', 'con', 'wis', 'str', 'int', 'cha'];
    const ordered = [...new Set([...priorities, ...fallback])].slice(0, 6);
    ordered.forEach((key, index) => {
      appState.characterSheet.abilities[key] = values[index];
    });
  }

  function classStandardArrayPreset() {
    const className = normalizeLabel(String(characterClassEntry()?.nome || '').replace(/^Classe:\s*/i, ''));
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

    return presets[className] || null;
  }

  function applyBackgroundSkills() {
    characterSheetDerived.characterSkillChoiceState().missingBackgroundKeys.forEach((key) => {
      appState.characterSheet.skillProficiencies[key] = 1;
    });
    saveCharacterSheet();
    renderCharacterSheet(appState.characterSheetTab);
  }

  function applyStartingEquipment(mode) {
    const marker = characterSheetDerived.startingEquipmentImportMarker(mode);
    if (marker && characterSheetDerived.startingEquipmentAlreadyImported(marker)) return;

    if (mode === 'background-coins') {
      applyCoinsFromText(characterSheetDerived.backgroundStartingCoinsText());
      appendEquipmentNote(marker);
      return;
    }

    const text = characterSheetDerived.classStartingEquipmentText();
    const optionText = characterSheetDerived.startingEquipmentOptionText(text, mode);
    const result = importEquipmentText(optionText || text, 'Equipaggiamento iniziale');

    if (result.unmatched.length) {
      appendEquipmentNote(`Da verificare (${result.source}): ${result.unmatched.join(', ')}`);
    }
    appendEquipmentNote(marker);
  }

  function applyHitPointAction(action, amount) {
    const max = Math.max(0, Number(appState.characterSheet.maxHp) || 0);
    const current = Math.max(0, Number(appState.characterSheet.currentHp) || 0);
    const temp = Math.max(0, Number(appState.characterSheet.tempHp) || 0);
    const before = hitPointSnapshot();

    if (action === 'heal') {
      appState.characterSheet.currentHp = max ? Math.min(max, current + amount) : current + amount;
      recordHitPointAction(action, amount, before);
      return;
    }

    if (action === 'temp') {
      appState.characterSheet.tempHp = Math.max(temp, amount);
      recordHitPointAction(action, amount, before);
      return;
    }

    const tempAbsorbed = Math.min(temp, amount);
    appState.characterSheet.tempHp = temp - tempAbsorbed;
    appState.characterSheet.currentHp = Math.max(0, current - Math.max(0, amount - tempAbsorbed));
    recordHitPointAction(action, amount, before, concentrationNote(amount));
  }

  function undoHitPointAction(id) {
    const log = Array.isArray(appState.characterSheet.hitPointLog) ? appState.characterSheet.hitPointLog : [];
    const [latest] = log;
    if (!latest || latest.id !== id) return false;

    appState.characterSheet.currentHp = Math.max(0, Number(latest.before?.currentHp) || 0);
    appState.characterSheet.tempHp = Math.max(0, Number(latest.before?.tempHp) || 0);
    if (latest.before?.hitDiceUsed !== undefined) {
      appState.characterSheet.hitDiceUsed = clampHitDiceUsed(latest.before.hitDiceUsed);
    }
    if (Array.isArray(latest.before?.resources)) {
      appState.characterSheet.resources = cloneSheetValue(latest.before.resources);
    }
    if (latest.before?.spellSlotsUsed && typeof latest.before.spellSlotsUsed === 'object') {
      appState.characterSheet.spellSlotsUsed = cloneSheetValue(latest.before.spellSlotsUsed);
    }
    if (latest.before?.status && typeof latest.before.status === 'object') {
      restoreRestStatus(latest.before.status);
    }
    appState.characterSheet.hitPointLog = log.slice(1);
    return true;
  }

  function recordHitPointAction(action, amount, before, note = '', options = {}) {
    const after = hitPointSnapshot(Boolean(options.includeRestState));
    if (hitPointSnapshotsMatch(before, after)) return;

    const log = Array.isArray(appState.characterSheet.hitPointLog) ? appState.characterSheet.hitPointLog : [];
    appState.characterSheet.hitPointLog = [
      {
        id: `hp-log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        action,
        amount,
        before,
        after,
        at: new Date().toISOString(),
        note,
      },
      ...log,
    ].slice(0, 25);
  }

  function hitPointSnapshot(includeRestState = false) {
    const snapshot = {
      currentHp: Math.max(0, Number(appState.characterSheet.currentHp) || 0),
      tempHp: Math.max(0, Number(appState.characterSheet.tempHp) || 0),
      hitDiceUsed: clampHitDiceUsed(appState.characterSheet.hitDiceUsed),
    };

    if (includeRestState) {
      snapshot.resources = cloneSheetValue(appState.characterSheet.resources || []);
      snapshot.spellSlotsUsed = cloneSheetValue(appState.characterSheet.spellSlotsUsed || {});
      snapshot.status = {
        concentration: Boolean(appState.characterSheet.status?.concentration),
        concentrationSpell: appState.characterSheet.status?.concentrationSpell ? String(appState.characterSheet.status.concentrationSpell) : '',
        concentrationDc: Math.max(10, Number(appState.characterSheet.status?.concentrationDc) || 10),
        deathSaveSuccesses: Math.min(3, Math.max(0, Number(appState.characterSheet.status?.deathSaveSuccesses) || 0)),
        deathSaveFailures: Math.min(3, Math.max(0, Number(appState.characterSheet.status?.deathSaveFailures) || 0)),
      };
    }

    return snapshot;
  }

  function hitPointSnapshotsMatch(before, after) {
    return before.currentHp === after.currentHp &&
      before.tempHp === after.tempHp &&
      before.hitDiceUsed === after.hitDiceUsed &&
      snapshotPartMatches(before.resources, after.resources) &&
      snapshotPartMatches(before.spellSlotsUsed, after.spellSlotsUsed) &&
      snapshotPartMatches(before.status, after.status);
  }

  function snapshotPartMatches(before, after) {
    return JSON.stringify(before ?? null) === JSON.stringify(after ?? null);
  }

  function restoreRestStatus(status) {
    appState.characterSheet.status = appState.characterSheet.status || {};
    appState.characterSheet.status.concentration = Boolean(status.concentration);
    appState.characterSheet.status.concentrationSpell = status.concentrationSpell ? String(status.concentrationSpell) : '';
    appState.characterSheet.status.concentrationDc = Math.max(10, Number(status.concentrationDc) || 10);
    appState.characterSheet.status.deathSaveSuccesses = Math.min(3, Math.max(0, Number(status.deathSaveSuccesses) || 0));
    appState.characterSheet.status.deathSaveFailures = Math.min(3, Math.max(0, Number(status.deathSaveFailures) || 0));
  }

  function ensureCombatState() {
    appState.characterSheet.combatState = {
      round: combatRound(),
      actionUsed: Boolean(appState.characterSheet.combatState?.actionUsed),
      bonusActionUsed: Boolean(appState.characterSheet.combatState?.bonusActionUsed),
      reactionUsed: Boolean(appState.characterSheet.combatState?.reactionUsed),
      movementUsed: movementUsed(),
    };

    return appState.characterSheet.combatState;
  }

  function toggleCombatState(field) {
    if (!['actionUsed', 'bonusActionUsed', 'reactionUsed'].includes(field)) return;
    const state = ensureCombatState();
    state[field] = !state[field];
  }

  function adjustCombatRound(delta) {
    if (!delta) return;
    const state = ensureCombatState();
    state.round = Math.min(999, Math.max(1, state.round + delta));
  }

  function resetCombatTurn() {
    const state = ensureCombatState();
    state.actionUsed = false;
    state.bonusActionUsed = false;
    state.reactionUsed = false;
    state.movementUsed = 0;
  }

  function adjustCombatMovement(delta) {
    if (!delta) return;
    const state = ensureCombatState();
    const speed = Math.max(0, Number(appState.characterSheet.speed) || 0);
    const next = Math.max(0, state.movementUsed + delta);
    state.movementUsed = speed ? Math.min(speed, next) : next;
  }

  function combatRound() {
    return Math.min(999, Math.max(1, Number(appState.characterSheet.combatState?.round) || 1));
  }

  function movementUsed() {
    const speed = Math.max(0, Number(appState.characterSheet.speed) || 0);
    const used = Math.max(0, Number(appState.characterSheet.combatState?.movementUsed) || 0);
    return speed ? Math.min(speed, used) : used;
  }

  function clearConcentration() {
    appState.characterSheet.status.concentration = false;
    appState.characterSheet.status.concentrationSpell = '';
    appState.characterSheet.status.concentrationDc = 10;
  }

  function concentrationNote(amount) {
    if (!appState.characterSheet.status?.concentration || !amount) return '';

    const dc = Math.max(10, Math.floor(amount / 2));
    appState.characterSheet.status.concentrationDc = dc;
    return `Concentrazione: TS Costituzione CD ${dc}.`;
  }

  function spendHitDie() {
    const maxHp = Math.max(0, Number(appState.characterSheet.maxHp) || 0);
    const currentHp = Math.max(0, Number(appState.characterSheet.currentHp) || 0);
    const available = hitDiceMaximum() - clampHitDiceUsed(appState.characterSheet.hitDiceUsed);
    if (available <= 0 || (maxHp > 0 && currentHp >= maxHp)) return false;

    const before = hitPointSnapshot();
    const healing = hitDieAverageHealing();
    appState.characterSheet.hitDiceUsed = clampHitDiceUsed(before.hitDiceUsed + 1);
    appState.characterSheet.currentHp = maxHp ? Math.min(maxHp, currentHp + healing) : currentHp + healing;
    recordHitPointAction('hitDie', healing, before, `Speso 1 dado vita medio (${hitDieFormula()}).`);
    return true;
  }

  function adjustHitDiceUsed(delta) {
    if (!delta) return false;

    const before = hitPointSnapshot();
    appState.characterSheet.hitDiceUsed = clampHitDiceUsed(before.hitDiceUsed + delta);
    recordHitPointAction('manual', Math.abs(delta), before, delta > 0 ? 'Dado vita segnato come speso.' : 'Dado vita recuperato manualmente.');
    return before.hitDiceUsed !== appState.characterSheet.hitDiceUsed;
  }

  function applyRest(restType) {
    if (restType !== 'long') {
      resetCharacterResources(restType);
      resetCombatTurn();
      return;
    }

    const before = hitPointSnapshot(true);
    resetCharacterResources(restType);
    resetCombatTurn();
    const recoveredHitDice = recoverHitDiceOnLongRest();

    appState.characterSheet.spellSlotsUsed = {};
    appState.characterSheet.currentHp = Number(appState.characterSheet.maxHp) || appState.characterSheet.currentHp;
    appState.characterSheet.tempHp = 0;
    clearConcentration();
    appState.characterSheet.status.deathSaveSuccesses = 0;
    appState.characterSheet.status.deathSaveFailures = 0;

    recordHitPointAction(
      'longRest',
      recoveredHitDice,
      before,
      recoveredHitDice ? recoveredHitDiceNote(recoveredHitDice) : 'PF, slot e stati di morte ripristinati.',
      { includeRestState: true }
    );
  }

  function recoveredHitDiceNote(amount) {
    return amount === 1 ? 'Recuperato 1 dado vita.' : `Recuperati ${amount} dadi vita.`;
  }

  function recoverHitDiceOnLongRest() {
    const used = clampHitDiceUsed(appState.characterSheet.hitDiceUsed);
    if (!used) return 0;

    const recovered = Math.min(used, Math.max(1, Math.floor(hitDiceMaximum() / 2)));
    appState.characterSheet.hitDiceUsed = used - recovered;
    return recovered;
  }

  function hitDiceMaximum() {
    return Math.min(20, Math.max(1, Number(appState.characterSheet.level) || 1));
  }

  function clampHitDiceUsed(value) {
    return Math.min(hitDiceMaximum(), Math.max(0, Number(value) || 0));
  }

  function hitDieFaces() {
    return Number(String(appState.characterSheet.hitDice || '').match(/d(\d+)/i)?.[1]) || 8;
  }

  function hitDieFormula() {
    const con = Math.floor(((Number(appState.characterSheet.abilities?.con) || 10) - 10) / 2);
    if (!con) return `1d${hitDieFaces()}`;
    return `1d${hitDieFaces()} ${con > 0 ? '+' : '-'} ${Math.abs(con)}`;
  }

  function hitDieAverageHealing() {
    const con = Math.floor(((Number(appState.characterSheet.abilities?.con) || 10) - 10) / 2);
    return Math.max(1, Math.floor(hitDieFaces() / 2) + 1 + con);
  }

  function cloneSheetValue(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function applyLevelUp() {
    const currentLevel = Math.min(20, Math.max(1, Number(appState.characterSheet.level) || 1));
    if (currentLevel >= 20) return;
    const classEntry = characterClassEntry();
    const nextRow = classProgressionRow?.(classEntry, currentLevel + 1);
    const summary = nextRow ? nextLevelSummary(nextRow) : `Livello ${currentLevel + 1}.`;

    const previousSuggestedHp = characterSheetDerived.characterSuggestedHitPoints();
    const previousMaxHp = Math.max(0, Number(appState.characterSheet.maxHp) || 0);
    const previousCurrentHp = Math.max(0, Number(appState.characterSheet.currentHp) || 0);

    appState.characterSheet.level = currentLevel + 1;
    syncCharacterSheetClassResources();

    const nextSuggestedHp = characterSheetDerived.characterSuggestedHitPoints();
    const hpIncrease = Math.max(1, nextSuggestedHp - previousSuggestedHp);
    appState.characterSheet.maxHp = previousMaxHp ? previousMaxHp + hpIncrease : nextSuggestedHp;
    appState.characterSheet.currentHp = Math.min(appState.characterSheet.maxHp, previousCurrentHp + hpIncrease);
    appendLevelUpNote(currentLevel + 1, hpIncrease, summary);

    saveCharacterSheet();
    renderCharacterSheet('overview');
  }

  function appendLevelUpNote(level, hpIncrease, summary) {
    const note = `Avanzamento livello ${level}: +${hpIncrease} PF. ${summary}`;
    const current = String(appState.characterSheet.notes || '').trim();
    if (current.includes(note)) return;
    appState.characterSheet.notes = current ? `${current}\n\n${note}` : note;
  }

  function castPreparedSpell(id) {
    const spell = appState.data.spells.find((entry) => entry.id === id);
    const level = Number(spell?.livello) || 0;
    if (!spell) return false;
    const requiresConcentration = spellRequiresConcentration(spell);

    if (level <= 0) {
      if (requiresConcentration) startSpellConcentration(spell);
      return true;
    }

    const slot = firstAvailableSpellSlot(level);
    if (!slot) return false;
    if (requiresConcentration) startSpellConcentration(spell);

    appState.characterSheet.spellSlotsUsed[slot.label] = Math.min(
      slot.max,
      (Number(appState.characterSheet.spellSlotsUsed[slot.label]) || 0) + 1
    );
    return true;
  }

  function spellRequiresConcentration(spell) {
    return String(spell?.durata || '').toLowerCase().includes('concentrazione');
  }

  function startSpellConcentration(spell) {
    appState.characterSheet.status.concentration = true;
    appState.characterSheet.status.concentrationSpell = spell.nome || spell.id;
    appState.characterSheet.status.concentrationDc = 10;
  }

  function firstAvailableSpellSlot(level) {
    return characterSpellSlots()
      .map(([label, value]) => ({
        label,
        level: Number(String(label).match(/\d+/)?.[0]) || 0,
        max: Math.max(0, Number(value) || 0),
      }))
      .filter((slot) => slot.level >= level && slot.max > 0)
      .sort((a, b) => a.level - b.level)
      .find((slot) => (Number(appState.characterSheet.spellSlotsUsed[slot.label]) || 0) < slot.max) || null;
  }

  function nextBuilderStepForActiveSheet() {
    const missing = characterSheetDerived.characterBuilderChecklist().find((item) => !item.complete);
    const stepByLabel = {
      Identita: 'identity',
      Caratteristiche: 'abilities',
      Competenze: 'skills',
      'Talento origine': 'identity',
      Combattimento: 'kit',
      Equipaggiamento: 'kit',
      Incantesimi: 'spells',
      Riferimenti: 'finish',
    };

    return stepByLabel[missing?.label] || 'finish';
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

  function appendEquipmentNote(note) {
    if (!note) return;
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

  function originEntry(entries, value) {
    const selected = String(value || '');
    if (!selected || !Array.isArray(entries)) return null;

    return entries.find((entry) => entry.id === selected || entry.nome === selected) || null;
  }

  return { bindCharacterSheetEvents };
}
