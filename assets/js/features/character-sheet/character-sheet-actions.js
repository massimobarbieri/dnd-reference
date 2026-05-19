export function createCharacterSheetActionsController({
  appState,
  normalizeText,
  saveCharacterSheet,
}) {
  /*
   * Azioni di dominio della scheda usate da bottoni e dettagli reference.
   * Il binding DOM resta in app.js; qui vivono solo mutazioni dello stato.
   */

  /*
   * Reimposta le risorse recuperabili con riposo breve o lungo.
   */
  function resetCharacterResources(restType) {
    const longRest = restType === 'long';

    appState.characterSheet.resources = appState.characterSheet.resources.map((resource) => {
      const recovery = normalizeText(resource.recovery);
      const resetsOnShortRest = recovery.includes('riposo breve');
      const resetsOnLongRest = longRest && (recovery.includes('riposo lungo') || recovery.includes('riposo breve') || !recovery);

      if (resetsOnShortRest || resetsOnLongRest) {
        return { ...resource, used: 0 };
      }

      return resource;
    });
  }

  /*
   * Aggiunge un incantesimo alla scheda evitando duplicati.
   */
  function addSpellToCharacterSheet(id) {
    if (!id || appState.characterSheet.preparedSpells.includes(id)) return false;

    appState.characterSheet.preparedSpells.push(id);
    saveCharacterSheet();
    return true;
  }

  /*
   * Collega un oggetto magico alla scheda evitando duplicati.
   */
  function addMagicItemToCharacterSheet(item) {
    if (!item?.id || appState.characterSheet.magicItems.some((entry) => entry.id === item.id)) return false;

    const summary = [item.tipo_base || item.tipo, item.rarita, item.richiede_sintonia ? 'richiede sintonia' : null]
      .filter(Boolean)
      .join(' · ');

    appState.characterSheet.magicItems.push({
      id: item.id,
      name: item.nome,
      summary,
    });
    saveCharacterSheet();
    return true;
  }

  /*
   * Importa una voce del JSON equipaggiamento nell'inventario.
   */
  function addEquipmentItemToCharacterSheet(item) {
    if (!item?.id) return false;

    const row = equipmentRowFromItem(item);
    const added = addEquipmentToCharacterSheet(
      { id: item.id, nome: item.nome || item.id },
      row,
      item.categoria || item.tipo || ''
    );

    if (!added) return false;
    addReferenceToCharacterSheet('equipment', item, { save: false });
    saveCharacterSheet();
    return true;
  }

  /*
   * Applica una specie alla scheda e la conserva anche come riferimento SRD.
   */
  function applySpeciesToCharacterSheet(species) {
    if (!species?.id) return false;

    appState.characterSheet.ancestry = species.nome || species.id;

    const speed = speedMeters(species.velocita);
    if (speed !== null) {
      appState.characterSheet.speed = speed;
    }

    addReferenceToCharacterSheet('species', species, { save: false });
    saveCharacterSheet();
    return true;
  }

  /*
   * Applica un background alla scheda e la conserva anche come riferimento SRD.
   */
  function applyBackgroundToCharacterSheet(background) {
    if (!background?.id) return false;

    appState.characterSheet.background = background.nome || background.id;
    applyBackgroundProficiencies(background);
    addReferenceToCharacterSheet('backgrounds', background, { save: false });
    saveCharacterSheet();
    return true;
  }

  /*
   * Aggiunge una lingua alle competenze linguistiche della scheda.
   */
  function applyLanguageToCharacterSheet(language) {
    if (!language?.id) return false;

    appState.characterSheet.proficiencies.languages = appendUniqueText(
      appState.characterSheet.proficiencies.languages,
      language.nome || language.id
    );
    addReferenceToCharacterSheet('languages', language, { save: false });
    saveCharacterSheet();
    return true;
  }

  /*
   * Importa una riga di equipaggiamento SRD nell'inventario libero.
   * Le armi con dado danno creano anche un attacco modificabile.
   */
  function addEquipmentToCharacterSheet(rule, row, sectionTitle = '') {
    const name = equipmentRowName(row);
    if (!rule?.id || !name) return false;

    if (!appState.characterSheet.equipmentItems.some((entry) => normalizeText(entry.name) === normalizeText(name))) {
      appState.characterSheet.equipmentItems.push(equipmentItem(rule, row, sectionTitle, name));
    }

    const attack = equipmentAttack(row, name);
    if (attack && !appState.characterSheet.attacks.some((entry) => normalizeText(entry.name) === normalizeText(attack.name))) {
      appState.characterSheet.attacks.push(attack);
    }

    saveCharacterSheet();
    return true;
  }

  /*
   * Collega qualsiasi voce SRD alla scheda come riferimento consultabile.
   */
  function addReferenceToCharacterSheet(section, item, options = {}) {
    if (!section || !item?.id) return false;
    if (appState.characterSheet.references.some((entry) => entry.section === section && entry.id === item.id)) return false;

    appState.characterSheet.references.push({
      section,
      id: item.id,
      name: item.nome || item.id,
      summary: referenceSummary(section, item),
    });
    if (options.save !== false) {
      saveCharacterSheet();
    }
    return true;
  }

  /*
   * Determina se un oggetto collegato alla scheda richiede sintonia.
   */
  function magicItemRequiresAttunement(entry, source) {
    if (source?.richiede_sintonia) return true;
    return String(entry?.summary || '').toLowerCase().includes('richiede sintonia');
  }

  function referenceSummary(section, item) {
    if (section === 'monsters') {
      return [item.dimensione, item.tipo, item.grado_sfida_raw || item.grado_sfida ? `GS ${item.grado_sfida_raw || item.grado_sfida}` : null]
        .filter(Boolean)
        .join(' · ');
    }

    if (section === 'rules') {
      return [item.capitolo, item.categoria].filter(Boolean).join(' · ');
    }

    if (section === 'species') {
      return [item.tipo_creatura, item.taglia, item.velocita].filter(Boolean).join(' · ');
    }

    if (section === 'backgrounds') {
      return [Array.isArray(item.punteggi_caratteristica) ? item.punteggi_caratteristica.join(', ') : '', item.talento_origine]
        .filter(Boolean)
        .join(' · ');
    }

    if (section === 'equipment') {
      return [item.categoria || item.tipo, item.danni, item.classe_armatura ? `CA ${item.classe_armatura}` : null]
        .filter(Boolean)
        .join(' · ');
    }

    if (section === 'feats') {
      return [item.categoria, item.prerequisito ? `Prerequisito: ${item.prerequisito}` : null]
        .filter(Boolean)
        .join(' · ');
    }

    if (section === 'languages') {
      return [item.categoria, item.tiro_casuale && item.tiro_casuale !== '—' ? `1d12 ${item.tiro_casuale}` : null]
        .filter(Boolean)
        .join(' · ');
    }

    if (section === 'rules_glossary') {
      return [item.descrittore, item.pagine_sorgente ? `pag. ${item.pagine_sorgente}` : null].filter(Boolean).join(' · ');
    }

    return [item.tipo_base || item.tipo, item.rarita, item.scuola].filter(Boolean).join(' · ');
  }

  function applyBackgroundProficiencies(background) {
    const skills = Array.isArray(background.competenze?.abilita)
      ? background.competenze.abilita
      : [];

    skills
      .map(skillKey)
      .filter(Boolean)
      .forEach((key) => {
        if (appState.characterSheet.skillProficiencies?.[key] !== undefined) {
          appState.characterSheet.skillProficiencies[key] = Math.max(1, Number(appState.characterSheet.skillProficiencies[key]) || 0);
        }
      });

    const tools = String(background.competenze?.strumenti || '').trim();
    if (tools && appState.characterSheet.proficiencies) {
      appState.characterSheet.proficiencies.tools = appendUniqueText(appState.characterSheet.proficiencies.tools, tools);
    }
  }

  function speedMeters(value) {
    const match = String(value || '').match(/\d+(?:[,.]\d+)?/);
    if (!match) return null;

    const speed = Number(match[0].replace(',', '.'));
    return Number.isFinite(speed) ? speed : null;
  }

  function skillKey(label) {
    const aliases = {
      acrobazia: 'acrobatics',
      'addestrare animali': 'animalHandling',
      arcano: 'arcana',
      atletica: 'athletics',
      inganno: 'deception',
      storia: 'history',
      intuizione: 'insight',
      intimidire: 'intimidation',
      indagare: 'investigation',
      medicina: 'medicine',
      natura: 'nature',
      percezione: 'perception',
      intrattenere: 'performance',
      persuasione: 'persuasion',
      religione: 'religion',
      'rapidita di mano': 'sleightOfHand',
      furtivita: 'stealth',
      sopravvivenza: 'survival',
    };

    return aliases[normalizeText(label)] || '';
  }

  function appendUniqueText(current, next) {
    const parts = String(current || '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    if (!parts.some((part) => normalizeText(part) === normalizeText(next))) {
      parts.push(next);
    }

    return parts.join(', ');
  }

  function equipmentRowName(row) {
    if (!row || typeof row !== 'object') return '';
    return String(row.Nome || row.Oggetto || row.Armatura || row.Voce || '').trim();
  }

  function equipmentRowFromItem(item) {
    return {
      Categoria: item.categoria || item.tipo || '',
      Nome: item.nome || item.oggetto || item.id,
      Oggetto: item.oggetto,
      Armatura: ['armatura', 'scudo'].includes(item.tipo) ? item.nome : '',
      Danni: item.danni || '',
      'Classe Armatura': item.classe_armatura || '',
      Proprietà: Array.isArray(item.proprieta) ? item.proprieta.join(', ') : item.proprieta,
      Padronanza: item.padronanza || '',
      Peso: item.peso || '',
      Costo: item.costo || '',
      Forza: item.forza || '',
      Furtività: item.furtivita || '',
      Riepilogo: item.descrizione || '',
    };
  }

  function equipmentItem(rule, row, sectionTitle, name) {
    return {
      id: `equipment-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      quantity: 1,
      weight: row?.Peso ? String(row.Peso) : '',
      cost: row?.Costo ? String(row.Costo) : '',
      source: [rule.nome, sectionTitle].filter(Boolean).join(' > '),
      notes: equipmentNotes(row),
      armorClass: row?.['Classe Armatura'] ? String(row['Classe Armatura']) : '',
      equipped: false,
    };
  }

  function equipmentNotes(row) {
    return [
      row?.Categoria,
      row?.Danni ? `Danni: ${row.Danni}` : null,
      row?.Proprietà ? `Proprietà: ${row.Proprietà}` : null,
      row?.Padronanza ? `Padronanza: ${row.Padronanza}` : null,
      row?.Riepilogo,
      row?.Forza && row.Forza !== '-' ? `Forza: ${row.Forza}` : null,
      row?.Furtività && row.Furtività !== '-' ? `Furtivita: ${row.Furtività}` : null,
    ].filter(Boolean).join(' · ');
  }

  function equipmentAttack(row, name) {
    const damageText = String(row?.Danni || '').trim();
    const match = damageText.match(/^(\d+d\d+(?:\s*[+-]\s*\d+)?)\s*(.*)$/i);

    if (!match) return null;

    return {
      id: `attack-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      ability: normalizeText(row?.Categoria).includes('distanza') ? 'dex' : 'str',
      proficient: true,
      bonus: 0,
      damage: match[1].replace(/\s+/g, ''),
      damageType: match[2] || '',
      notes: [row?.Proprietà, row?.Padronanza ? `Padronanza: ${row.Padronanza}` : null]
        .filter(Boolean)
        .join(' · '),
    };
  }

  return {
    addEquipmentItemToCharacterSheet,
    addEquipmentToCharacterSheet,
    addMagicItemToCharacterSheet,
    addReferenceToCharacterSheet,
    addSpellToCharacterSheet,
    applyBackgroundToCharacterSheet,
    applyLanguageToCharacterSheet,
    applySpeciesToCharacterSheet,
    magicItemRequiresAttunement,
    resetCharacterResources,
  };
}
