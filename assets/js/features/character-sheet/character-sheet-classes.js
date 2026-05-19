export function createCharacterSheetClassController({
  appState,
  abilityMeta,
  skillMeta,
  escapeHtml,
  normalizeLegacyResources,
  normalizeText,
  characterLevel,
}) {
  /*
   * Logica classi per la scheda personaggio: progressione, risorse suggerite,
   * competenze importate e riepilogo del livello corrente.
   */

  /*
   * Recupera la sezione tabellare di progressione da una classe SRD.
   */
  function classProgressionSection(classEntry) {
    return classEntry?.sezioni?.find((section) => section.titolo === 'Progressione di classe') || null;
  }

  /*
   * Recupera la riga di progressione per uno specifico livello.
   */
  function classProgressionRow(classEntry, level) {
    const progression = classProgressionSection(classEntry);
    return progression?.righe?.find((row) => Number(row.Livello) === Number(level)) || null;
  }

  /*
   * Estrae valori numerici/contatori presenti nella riga di progressione.
   */
  function classProgressionResources(row) {
    if (!row) return [];

    return Object.entries(row)
      .filter(([label, value]) => {
        const text = String(value || '').trim();
        return (
          !['Livello', 'Bonus di competenza', 'Privilegi di classe'].includes(label) &&
          text !== '' &&
          text !== '-'
        );
      })
      .slice(0, 10);
  }

  /*
   * Divide la colonna "Privilegi di classe" in singoli privilegi.
   */
  function splitClassFeatures(value) {
    const text = String(value || '').trim();
    if (!text || text === '-') return [];

    return text
      .split(',')
      .map((feature) => feature.trim())
      .filter(Boolean);
  }

  /*
   * Restituisce i privilegi di sottoclasse gia sbloccati al livello corrente.
   */
  function classSubclassRows(classEntry, level) {
    const subclass = classEntry?.sezioni?.find((section) => String(section.titolo || '').startsWith('Sottoclasse '));

    return (subclass?.righe || [])
      .filter((row) => Number(row.Livello) <= Number(level))
      .sort((a, b) => Number(a.Livello) - Number(b.Livello));
  }

  /*
   * Sintetizza cosa arrivera al livello successivo.
   */
  function nextLevelSummary(row) {
    const features = splitClassFeatures(row?.['Privilegi di classe']);
    const prefix = `Livello ${row?.Livello || ''}`;

    if (!features.length) return `${prefix}: nessun nuovo privilegio indicato.`;
    return `${prefix}: ${features.join(', ')}.`;
  }

  /*
   * Renderizza il blocco di riepilogo avanzamento corrente/prossimo livello.
   */
  function renderLevelAdvancementSummary(classEntry, currentRow, nextRow) {
    const currentItems = levelAdvancementItems(currentRow);
    const nextItems = levelAdvancementItems(nextRow);

    if (!currentItems.length && !nextItems.length) return '';

    return `
      <div class="sheet-level-summary">
        <div>
          <h4>Nuovi al livello ${escapeHtml(String(characterLevel()))}</h4>
          ${currentItems.length ? `
            <ul class="sheet-chip-list">
              ${currentItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          ` : '<p class="sheet-empty">Nessun nuovo elemento indicato per questo livello.</p>'}
        </div>
        ${nextRow ? `
          <div>
            <h4>Da preparare per il livello ${escapeHtml(String(nextRow.Livello || characterLevel() + 1))}</h4>
            ${nextItems.length ? `
              <ul class="sheet-chip-list">
                ${nextItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
              </ul>
            ` : '<p class="sheet-empty">Nessun nuovo elemento indicato.</p>'}
          </div>
        ` : ''}
        <a class="button button--ghost" href="#/classes/${encodeURIComponent(classEntry.id)}">Dettaglio progressione</a>
      </div>
    `;
  }

  /*
   * Raccoglie privilegi e contatori tracciabili da una riga di progressione.
   */
  function levelAdvancementItems(row) {
    if (!row) return [];

    const features = splitClassFeatures(row['Privilegi di classe']);
    const trackedValues = Object.entries(row)
      .filter(([label, value]) => {
        const text = String(value || '').trim();
        return !['Livello', 'Bonus di competenza', 'Privilegi di classe'].includes(label) && text && text !== '-';
      })
      .map(([label, value]) => `${label}: ${value}`);

    return [...features, ...trackedValues].slice(0, 12);
  }

  /*
   * Applica i tratti strutturati della classe SRD alla scheda.
   * Non blocca l'utente: i valori importati restano modificabili manualmente.
   */
  function applyClassToCharacterSheet(classEntry) {
    const traits = classTraitsMap(classEntry);

    appState.characterSheet.classId = classEntry.id;
    appState.characterSheet.spellcastingAbility = classDefaultSpellcastingAbility(classEntry.id);
    appState.characterSheet.hitDice = classHitDice(traits['Dado Vita']) || appState.characterSheet.hitDice;
    appState.characterSheet.savingThrows = {
      ...appState.characterSheet.savingThrows,
      ...classSavingThrows(traits['Tiri salvezza']),
    };
    appState.characterSheet.proficiencies = {
      ...appState.characterSheet.proficiencies,
      weapons: traits.Armi || appState.characterSheet.proficiencies.weapons,
      armor: traits.Armature || appState.characterSheet.proficiencies.armor,
      tools: traits.Strumenti || appState.characterSheet.proficiencies.tools,
    };
    syncCharacterSheetClassResources(classEntry);
    appState.characterSheet.notes = mergeSheetNote(
      appState.characterSheet.notes,
      classSkillSuggestion(classEntry, traits.Abilita)
    );
  }

  /*
   * Aggiunge alla scheda risorse suggerite dalla classe senza duplicare quelle esistenti.
   */
  function syncCharacterSheetClassResources(classEntry = characterClassEntry()) {
    if (!classEntry) return false;

    appState.characterSheet.resources = mergeCharacterResources(
      appState.characterSheet.resources,
      classSuggestedResources(classEntry)
    );
    return true;
  }

  /*
   * Classe attualmente selezionata nella scheda.
   */
  function characterClassEntry() {
    return appState.data.classes.find((entry) => entry.id === appState.characterSheet.classId);
  }

  /*
   * Le sezioni "Tratti del..." sono gia righe chiave/valore nei dati.
   * Convertirle in mappa evita parsing fragile del markdown originale.
   */
  function classTraitsMap(classEntry) {
    const traits = classEntry?.sezioni?.find((section) => String(section.titolo || '').startsWith('Tratti '));

    return Object.fromEntries((traits?.righe || [])
      .filter((row) => row?.chiave)
      .map((row) => [row.chiave, String(row.valore || '').replace(/\.$/, '')]));
  }

  /*
   * Converte il dado vita della classe nel formato scheda, ad esempio 1d10.
   */
  function classHitDice(value) {
    const match = String(value || '').match(/d\d+/i);
    return match ? `1${match[0].toLowerCase()}` : '';
  }

  /*
   * Converte la riga dei tiri salvezza in mappa per caratteristica.
   */
  function classSavingThrows(value) {
    const text = normalizeText(value);

    return Object.fromEntries(abilityMeta.map(([key, label]) => [
      key,
      text.includes(normalizeText(label)),
    ]));
  }

  /*
   * Produce una nota testuale con le competenze abilita consigliate.
   */
  function classSkillSuggestion(classEntry, value) {
    const text = String(value || '').trim();
    if (!text) return '';

    const className = classEntry.nome.replace(/^Classe:\s*/i, '');
    return `Competenze abilita ${className}: ${text}`;
  }

  /*
   * Propone contatori per i privilegi di classe con usi espliciti.
   * Sono valori iniziali modificabili, non una fonte regole esaustiva.
   */
  function classSuggestedResources(classEntry) {
    const progression = classProgressionSection(classEntry);
    const level = characterLevel();
    const currentRow = classProgressionRow(classEntry, level);
    const featureResources = (progression?.righe || [])
      .filter((row) => Number(row.Livello) <= level)
      .flatMap((row) => String(row['Privilegi di Classe'] || row['Privilegi di classe'] || '').split(','))
      .map(resourceFromClassFeature)
      .filter(Boolean);
    const rowResources = classResourcesFromProgressionRow(currentRow);

    return [...featureResources, ...rowResources];
  }

  function resourceFromClassFeature(feature) {
    const text = normalizeText(feature);
    if (!text || text.includes('incremento dei punteggi') || text.includes('talento')) return null;

    if (text.includes('recuperare energie')) {
      return createClassResource('Recuperare energie', 1, 'Riposo breve o lungo');
    }
    if (text.includes('azione impetuosa')) {
      return createClassResource('Azione impetuosa', text.includes('due utilizzi') ? 2 : 1, 'Riposo breve o lungo');
    }
    if (text.includes('ispirazione bardica')) {
      return createClassResource('Ispirazione bardica', 1, 'Riposo lungo');
    }
    if (text.includes('fonte di ispirazione')) {
      return createClassResource('Ispirazione bardica', 1, 'Riposo breve o lungo');
    }
    if (text.includes('forma selvatica')) {
      return createClassResource('Forma selvatica', 2, 'Riposo breve o lungo');
    }
    if (text.includes('incanalare divinita')) {
      return createClassResource('Incanalare divinita', 1, 'Riposo breve o lungo');
    }
    if (text.includes('fonte di magia')) {
      return createClassResource('Punti stregoneria', Math.max(1, characterLevel()), 'Riposo lungo');
    }
    if (text.includes('imposizione delle mani')) {
      return createClassResource('Imposizione delle mani', characterLevel() * 5, 'Riposo lungo');
    }
    if (text.includes('indomabile')) {
      const max = text.includes('tre utilizzi') ? 3 : text.includes('due utilizzi') ? 2 : 1;
      return createClassResource('Indomabile', max, 'Riposo lungo');
    }
    if (text.includes('recupero arcano')) {
      return createClassResource('Recupero arcano', 1, 'Riposo lungo');
    }

    return null;
  }

  function classResourcesFromProgressionRow(row) {
    if (!row) return [];

    return [
      resourceFromProgressionValue(row, 'Ire', 'Ira', 'Riposo lungo'),
      resourceFromProgressionValue(row, 'Recuperare energie', 'Recuperare energie', 'Riposo breve o lungo'),
      resourceFromProgressionValue(row, 'Incanalare divinità', 'Incanalare divinita', 'Riposo breve o lungo'),
      resourceFromProgressionValue(row, 'Forma selvatica', 'Forma selvatica', 'Riposo breve o lungo'),
      resourceFromProgressionValue(row, 'Concentrazione', 'Punti concentrazione', 'Riposo breve o lungo'),
      resourceFromProgressionValue(row, 'Nemico prescelto', 'Nemico prescelto', 'Riposo lungo'),
      resourceFromProgressionValue(row, 'Punti stregoneria', 'Punti stregoneria', 'Riposo lungo'),
      resourceFromProgressionValue(row, 'Slot incantesimo', 'Slot patto', 'Riposo breve o lungo'),
    ].filter(Boolean);
  }

  function resourceFromProgressionValue(row, column, name, recovery) {
    const max = Number(row[column]);
    if (!Number.isFinite(max) || max <= 0) return null;
    return createClassResource(name, max, recovery);
  }

  /*
   * Crea una risorsa consumabile con id locale stabile per la sessione.
   */
  function createClassResource(name, max, recovery) {
    return {
      id: `resource-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      max,
      used: 0,
      recovery,
    };
  }

  /*
   * Unisce risorse correnti e suggerite aggiornando massimo/recupero per nome.
   */
  function mergeCharacterResources(current, suggested) {
    const resources = normalizeLegacyResources(current);
    const byName = new Map(resources.map((resource) => [normalizeText(resource.name), resource]));

    suggested.forEach((resource) => {
      const key = normalizeText(resource.name);
      if (!key) return;
      const existing = byName.get(key);
      if (existing) {
        existing.max = Math.max(Number(existing.max) || 0, Number(resource.max) || 0);
        existing.recovery = resource.recovery || existing.recovery;
        return;
      }
      resources.push(resource);
      byName.set(key, resource);
    });

    return normalizeLegacyResources(resources);
  }

  /*
   * Estrae le abilita nominate nella riga "Abilita" della classe.
   * Serve solo come suggerimento: le scelte finali restano nello stato scheda.
   */
  function classSkillOptions(classEntry) {
    const text = normalizeText(classTraitsMap(classEntry).Abilita || '');
    if (!text) return [];

    return skillMeta
      .filter(([, label]) => text.includes(normalizeText(label)))
      .map(([key, label]) => [key, label]);
  }

  /*
   * Aggiunge una nota evitando duplicati testuali.
   */
  function mergeSheetNote(current, note) {
    if (!note) return current || '';

    const text = String(current || '').trim();
    if (text.includes(note)) return text;
    return text ? `${text}\n\n${note}` : note;
  }

  /*
   * Caratteristica da incantatore predefinita per classe, quando nota.
   */
  function classDefaultSpellcastingAbility(classId) {
    const defaults = {
      bardo: 'cha',
      chierico: 'wis',
      druido: 'wis',
      mago: 'int',
      paladino: 'cha',
      ranger: 'wis',
      stregone: 'cha',
      warlock: 'cha',
      classe_bardo: 'cha',
      classe_chierico: 'wis',
      classe_druido: 'wis',
      classe_mago: 'int',
      classe_paladino: 'cha',
      classe_ranger: 'wis',
      classe_stregone: 'cha',
      classe_warlock: 'cha',
    };

    return defaults[classId] || appState.characterSheet.spellcastingAbility || 'int';
  }

  return {
    applyClassToCharacterSheet,
    classDefaultSpellcastingAbility,
    classProgressionResources,
    classProgressionRow,
    classProgressionSection,
    classSkillOptions,
    classSubclassRows,
    classSuggestedResources,
    classTraitsMap,
    renderLevelAdvancementSummary,
    splitClassFeatures,
    syncCharacterSheetClassResources,
    nextLevelSummary,
  };
}
