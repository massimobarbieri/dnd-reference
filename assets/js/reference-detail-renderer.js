import { createReferenceSectionRenderer } from './reference-section-renderer.js';

export function createReferenceDetailRenderer({
  appState,
  analyzeRollContext,
  escapeAttr,
  escapeHtml,
  findDiceFormulas,
  formatDiceFormula,
  formatInline,
  isFavorite,
  normalizeText,
  renderSheetActions,
  spellLevel,
}) {
  const {
    renderEntries,
    renderScalingEntries,
    renderSections,
  } = createReferenceSectionRenderer({
    appState,
    escapeAttr,
    escapeHtml,
    findDiceFormulas,
    formatDiceFormula,
    formatInline,
    normalizeText,
  });

  /*
   * Smista il rendering del dettaglio in base alla sezione.
   */
  function renderDetailContent(section, item) {
    if (section === 'monsters') return renderMonster(item);
    if (section === 'spells') return renderSpell(item);
    if (section === 'classes') return renderClass(item);
    if (section === 'rules') return renderRule(item);
    if (section === 'rules_glossary') return renderGlossaryEntry(item);
    return renderMagicItem(item);
  }

  /*
   * Header comune per tutte le schede di dettaglio.
   * Include titolo, sottotitolo e pulsante preferito.
   */
  function renderHeader(section, item, kicker) {
    const pressed = isFavorite(section, item.id);

    return `
      <header class="detail-header">
        <div>
          <h2 class="detail-title">${escapeHtml(item.nome)}</h2>
          <p class="detail-kicker">${escapeHtml(kicker || '')}</p>
        </div>

        <button
          id="favorite-detail"
          class="button favorite-btn"
          type="button"
          aria-pressed="${pressed}"
        >
          ${pressed ? '★' : '☆'}
        </button>
      </header>
    `;
  }

  function renderMonster(monster) {
    const image = appState.monsterImages.get(monster.id)?.immagine;
    const showImages = appState.config.site?.show_monster_images !== false;

    return `
      <div class="monster-hero">
        <div>
          ${renderHeader(
            'monsters',
            monster,
            [monster.dimensione, monster.tipo, monster.allineamento].filter(Boolean).join(' · ')
          )}

          ${compactMeta([
            ['CA', monster.statistiche?.classe_armatura],
            ['PF', monster.statistiche?.punti_ferita],
            ['Vel.', monster.statistiche?.velocita],
            ['Iniz.', monster.statistiche?.iniziativa],
            ['GS', monster.grado_sfida_raw || monster.grado_sfida],
            ['BC', monster.bonus_competenza],
            ['Sensi', monster.sensi],
            ['Lingue', monster.lingue],
          ])}
        </div>

        ${showImages ? renderMonsterImage(image) : ''}
      </div>

      ${renderAbilityScores(monster.caratteristiche)}

      ${compactMeta([
        ['Abilità', monster.abilita],
        ['Resistenze', monster.resistenze],
        ['Immunità danni', monster.immunita_danni],
        ['Immunità condizioni', monster.immunita_condizione],
        ['Vulnerabilità', monster.vulnerabilita],
        ['Attrezzatura', monster.attrezzatura],
      ])}

      ${renderEntries('Tratti', monster.tratti)}
      ${renderEntries('Azioni', monster.azioni)}
      ${renderEntries('Azioni bonus', monster.azioni_bonus)}
      ${renderEntries('Reazioni', monster.reazioni)}
      ${renderLegendary(monster.azioni_leggendarie)}
    `;
  }

  function renderMonsterImage(src) {
    const fallback = escapeHtml(appState.config.site?.image_fallback_text || 'Immagine non disponibile');

    if (!src) {
      return `<div class="monster-image-fallback">${fallback}</div>`;
    }

    return `
      <img
        class="monster-image"
        src="${escapeAttr(src)}"
        alt="Immagine del mostro"
        loading="lazy"
        onerror="this.replaceWith(Object.assign(document.createElement('div'), {
          className: 'monster-image-fallback',
          textContent: '${escapeAttr(fallback)}'
        }))"
      >
    `;
  }

  function renderSpell(spell) {
    return `
      ${renderHeader(
        'spells',
        spell,
        [spellLevel(spell), spell.scuola].filter(Boolean).join(' · ')
      )}
      ${renderSheetActions('spells', spell)}

      ${compactMeta([
        ['Livello', spellLevel(spell)],
        ['Scuola', spell.scuola],
        ['Tempo', spell.tempo_lancio],
        ['Gittata', spell.gittata],
        ['Componenti', spell.componenti],
        ['Durata', spell.durata],
        ['Classi', spell.classi?.join(', ')],
      ])}

      <div class="description">${formatInline(spell.descrizione || '')}</div>
      ${renderRollContextNote(spell)}

      ${renderScalingEntries('Slot superiori', spell.scaling, spell)}
      ${renderSections('Sezioni', spell.sezioni)}
    `;
  }

  function renderRollContextNote(spell) {
    const context = analyzeRollContext(spellRollText(spell));

    if (!context.notes.length) return '';

    return `
      <p class="roll-context">
        <strong>Tiri situazionali.</strong>
        Ripeti il tiro ${escapeHtml(context.notes.join(' e '))}, secondo il testo dell'incantesimo.
      </p>
    `;
  }

  function spellRollText(spell) {
    const sections = Array.isArray(spell?.sezioni) ? spell.sezioni : [];
    const scaling = Array.isArray(spell?.scaling) ? spell.scaling : [];
    const parts = [
      spell?.descrizione || '',
      ...scaling.map((entry) => `${entry?.nome || ''} ${entry?.descrizione || ''}`),
      ...sections.flatMap((section) => [
        section?.titolo || '',
        section?.descrizione || '',
        ...(Array.isArray(section?.righe)
          ? section.righe.map((row) => `${row?.chiave || ''} ${row?.valore || ''}`)
          : []),
        ...(Array.isArray(section?.blocchi)
          ? section.blocchi.map((entry) => `${entry?.nome || ''} ${entry?.descrizione || ''}`)
          : []),
        ...(Array.isArray(section?.voci)
          ? section.voci.map((entry) => `${entry?.nome || ''} ${entry?.descrizione || ''}`)
          : []),
      ]),
    ];

    return parts.filter(Boolean).join('\n');
  }

  function renderMagicItem(item) {
    return `
      ${renderHeader(
        'magic_items',
        item,
        [item.tipo_base || item.tipo, item.rarita].filter(Boolean).join(' · ')
      )}
      ${renderSheetActions('magic_items', item)}

      ${compactMeta([
        ['Tipo', item.tipo],
        ['Rarità', item.rarita],
        ['Sintonia', item.richiede_sintonia ? 'Sì' : 'No'],
      ])}

      <div class="description">${formatInline(item.descrizione || '')}</div>

      ${renderEntries('Proprietà', item.proprieta)}
      ${renderSections('Tabelle e sezioni', item.sezioni)}
    `;
  }

  function renderRule(rule) {
    return `
      ${renderHeader(
        'rules',
        rule,
        [rule.categoria, rule.pagine_sorgente ? `pag. ${rule.pagine_sorgente}` : null].filter(Boolean).join(' · ')
      )}

      ${compactMeta([
        ['Capitolo', rule.capitolo],
        ['Categoria', rule.categoria],
        ['Pagine SRD', rule.pagine_sorgente],
      ])}

      <div class="description">${formatInline(rule.descrizione || '')}</div>

      ${renderSections('Dettagli', rule.sezioni)}
    `;
  }

  function renderClass(rule) {
    return `
      ${renderHeader(
        'classes',
        rule,
        [rule.categoria, rule.pagine_sorgente ? `pag. ${rule.pagine_sorgente}` : null].filter(Boolean).join(' · ')
      )}
      ${renderSheetActions('classes', rule)}

      ${compactMeta([
        ['Capitolo', rule.capitolo],
        ['Pagine SRD', rule.pagine_sorgente],
      ])}

      <div class="description">${formatInline(rule.descrizione || '')}</div>

      ${renderSections('Dettagli', rule.sezioni)}
    `;
  }

  function renderGlossaryEntry(entry) {
    return `
      ${renderHeader(
        'rules_glossary',
        entry,
        [entry.descrittore ? capitalizeFirst(entry.descrittore) : null, entry.pagine_sorgente ? `pag. ${entry.pagine_sorgente}` : null].filter(Boolean).join(' · ')
      )}

      ${compactMeta([
        ['Lettera', entry.lettera],
        ['Descrittore', entry.descrittore ? capitalizeFirst(entry.descrittore) : null],
        ['Pagine SRD', entry.pagine_sorgente],
        ['Vedi anche', Array.isArray(entry.vedi_anche) ? entry.vedi_anche.join(', ') : null],
      ])}

      <div class="description">${formatInline(entry.descrizione || '')}</div>

      ${renderSections('Dettagli', entry.sezioni)}
    `;
  }

  function compactMeta(rows) {
    const list = rows.filter(([, value]) => {
      return (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        !(Array.isArray(value) && !value.length)
      );
    });

    if (!list.length) return '';

    return `
      <ul class="meta-list">
        ${list
          .map(([label, value]) => `
            <li>
              <b>${escapeHtml(label)}:</b> ${escapeHtml(String(value))}
            </li>
          `)
          .join('')}
      </ul>
    `;
  }

  function renderAbilityScores(scores = {}) {
    const labels = {
      forza: 'FOR',
      destrezza: 'DES',
      costituzione: 'COS',
      intelligenza: 'INT',
      saggezza: 'SAG',
      carisma: 'CAR',
    };

    return `
      <div class="stats-row">
        ${Object.entries(labels)
          .map(([key, label]) => {
            const stat = scores[key] || {};

            return `
              <div class="stat">
                <b>${label}</b>
                ${escapeHtml(String(stat.valore ?? '-'))}
                <span>${escapeHtml(formatAbilityModifier(stat.modificatore))}</span>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }

  function formatAbilityModifier(modifier) {
    if (!modifier) return '';

    const text = String(modifier).trim();

    return text.startsWith('(') && text.endsWith(')')
      ? text
      : `(${text})`;
  }

  function renderLegendary(legendary) {
    if (!legendary || !Array.isArray(legendary.azioni) || !legendary.azioni.length) {
      return '';
    }

    return `
      <section class="content-section">
        <h3>
          Azioni leggendarie
          ${legendary.utilizzi ? `(${escapeHtml(legendary.utilizzi)})` : ''}
        </h3>

        ${legendary.descrizione_utilizzi
          ? `<div class="description">${formatInline(legendary.descrizione_utilizzi)}</div>`
          : ''
        }

        ${legendary.azioni
          .map((entry) => `
            <div class="entry">
              <span class="entry-title">${escapeHtml(entry.nome || '')}</span>
              <p>${formatInline(entry.descrizione || '')}</p>
            </div>
          `)
          .join('')}
      </section>
    `;
  }

  return renderDetailContent;
}

function capitalizeFirst(value) {
  const text = String(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}
