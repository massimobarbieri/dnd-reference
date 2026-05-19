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
  function addReferenceToCharacterSheet(section, item) {
    if (!section || !item?.id) return false;
    if (appState.characterSheet.references.some((entry) => entry.section === section && entry.id === item.id)) return false;

    appState.characterSheet.references.push({
      section,
      id: item.id,
      name: item.nome || item.id,
      summary: referenceSummary(section, item),
    });
    saveCharacterSheet();
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

    if (section === 'rules_glossary') {
      return [item.descrittore, item.pagine_sorgente ? `pag. ${item.pagine_sorgente}` : null].filter(Boolean).join(' · ');
    }

    return [item.tipo_base || item.tipo, item.rarita, item.scuola].filter(Boolean).join(' · ');
  }

  function equipmentRowName(row) {
    if (!row || typeof row !== 'object') return '';
    return String(row.Nome || row.Oggetto || row.Armatura || row.Voce || '').trim();
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
    addEquipmentToCharacterSheet,
    addMagicItemToCharacterSheet,
    addReferenceToCharacterSheet,
    addSpellToCharacterSheet,
    magicItemRequiresAttunement,
    resetCharacterResources,
  };
}
