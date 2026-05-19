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
   * Determina se un oggetto collegato alla scheda richiede sintonia.
   */
  function magicItemRequiresAttunement(entry, source) {
    if (source?.richiede_sintonia) return true;
    return String(entry?.summary || '').toLowerCase().includes('richiede sintonia');
  }

  return {
    addMagicItemToCharacterSheet,
    addSpellToCharacterSheet,
    magicItemRequiresAttunement,
    resetCharacterResources,
  };
}
