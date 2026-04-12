
const APP_VERSION = '2.3.7.1';
const BUILD_DATE = '2026-04-11';
const FAVORITES_KEY = 'dnd-reference-favorites';

const DATA_FILES = {
  equipment: 'data/equipment.json',
  monsters: 'data/monsters.json',
  magicItems: 'data/magic_items.json',
  spells: 'data/spells.json',
};

const CATEGORY_META = {
  equipment: { label: 'Equipaggiamento', route: 'equipment' },
  monsters: { label: 'Mostri', route: 'monsters' },
  magicItems: { label: 'Oggetti magici', route: 'magic-items' },
  spells: { label: 'Incantesimi', route: 'spells' },
};

const MONSTER_NAME_OVERRIDES = {
  'Arpia': 'Harpy',
  'Basilisco': 'Basilisk',
  'Cacciatore invisibile': 'Invisible Stalker',
  'Cavallo degli incubi': 'Nightmare',
  'Coboldo': 'Kobold',
  'Cumulo strisciante': 'Shambling Mound',
  'Diavolo barbuto': 'Bearded Devil',
  'Diavolo cornuto': 'Horned Devil',
  'Diavolo del ghiaccio': 'Ice Devil',
  'Diavolo della fossa': 'Pit Fiend',
  'Diavolo delle catene': 'Chain Devil',
  "Diavolo d'ossa": 'Bone Devil',
  'Diavolo uncinato': 'Barbed Devil',
  'Erinni': 'Erinyes',
  'Plesiosauro': 'Plesiosaurus',
  'Tirannosauro': 'Tyrannosaurus Rex',
  'Triceratopo': 'Triceratops',
  'Driade': 'Dryad',
  'Elementale del fuoco': 'Fire Elemental',
  'Elementale della terra': 'Earth Elemental',
  "Elementale dell'acqua": 'Water Elemental',
  "Elementale dell'aria": 'Air Elemental',
  'Elfo drow': 'Drow',
  'Fantasma': 'Ghost',
  'Fauce gorgogliante': 'Gibbering Mouther',
  'Boleto stridente': 'Shrieker',
  'Fungo viola': 'Violet Fungus',
  'Fuoco fatuo': "Will-o'-Wisp",
  'Fustigatore': 'Roper',
  'Gigante del fuoco': 'Fire Giant',
  'Gigante del gelo': 'Frost Giant',
  'Gigante delle colline': 'Hill Giant',
  'Gigante delle nuvole': 'Cloud Giant',
  'Gigante delle pietre': 'Stone Giant',
  'Gigante delle tempeste': 'Storm Giant',
  'Gnomo delle profondità (svirfneblin)': 'Deep Gnome (Svirfneblin)',
  'Golem di argilla': 'Clay Golem',
  'Golem di carne': 'Flesh Golem',
  'Golem di ferro': 'Iron Golem',
  'Golem di pietra': 'Stone Golem',
  'Gorgone': 'Gorgon',
  'Grifone': 'Griffon',
  'Guardiano protettore': 'Shield Guardian',
  'Idra': 'Hydra',
  'Ippogrifo': 'Hippogriff',
  'Cinghiale mannaro': 'Wereboar',
  'Lupo mannaro': 'Werewolf',
  'Orso mannaro': 'Werebear',
  'Tigre mannara': 'Weretiger',
  'Topo mannaro': 'Wererat',
  'Lucertoloide': 'Lizardfolk',
  'Manticora': 'Manticore',
  'Manto assassino': 'Cloaker',
  'Mantoscuro': 'Darkmantle',
  'Marinide': 'Merfolk',
  'Megera marina': 'Sea Hag',
  'Megera notturna': 'Night Hag',
  'Megera verde': 'Green Hag',
  'Ameba paglierina': 'Ochre Jelly',
  'Cubo gelatinoso': 'Gelatinous Cube',
  'Melma grigia': 'Gray Ooze',
  'Protoplasma nero': 'Black Pudding',
  'Mephit del ghiaccio': 'Ice Mephit',
  'Mephit del magma': 'Magma Mephit',
  'Mephit del vapore': 'Steam Mephit',
  'Mephit della polvere': 'Dust Mephit',
  'Minotauro': 'Minotaur',
  'Signore delle mummie': 'Mummy Lord',
  'Naga guardiana': 'Guardian Naga',
  'Naga spirituale': 'Spirit Naga',
  'Armatura animata': 'Animated Armor',
  'Spada volante': 'Flying Sword',
  'Tappeto soffocante': 'Rug of Smothering',
  'Ombra': 'Shadow',
  'Omuncolo': 'Homunculus',
  'Orco': 'Orc',
  'Orsogufo': 'Owlbear',
  'Pseudodrago': 'Pseudodragon',
  'Rugginofago': 'Rust Monster',
  'Satiro': 'Satyr',
  'Scheletro': 'Skeleton',
  'Scheletro di cavallo da guerra': 'Warhorse Skeleton',
  'Scheletro di minotauro': 'Minotaur Skeleton',
  'Segugio infernale': 'Hell Hound',
  'Androsfinge': 'Androsphinx',
  'Ginosfinge': 'Gynosphinx',
  'Spettro': 'Specter',
  'Spiritello': 'Sprite',
  'Succube/Incubo': 'Succubus/Incubus',
  'Testuggine dragona': 'Dragon Turtle',
  'Uccello stigeo': 'Stirge',
  'Progenie vampirica': 'Vampire Spawn',
  'Verme purpureo': 'Purple Worm',
  'Viverna': 'Wyvern',
  'Zombi': 'Zombie',
  'Zombi ogre': 'Ogre Zombie',
  'Albero risvegliato': 'Awakened Tree',
  'Alce': 'Elk',
  'Alce gigante': 'Giant Elk',
  'Allosauro': 'Allosaurus',
  'Anchilosauro': 'Ankylosaurus',
  'Aquila': 'Eagle',
  'Aquila gigante': 'Giant Eagle',
  'Arcimago': 'Archmage',
  'Avvoltoio': 'Vulture',
  'Avvoltoio gigante': 'Giant Vulture',
  'Babbuino': 'Baboon',
  'Banco di piranha': 'Swarm of Quippers',
  'Bandito': 'Bandit',
  'Beccoaguzzo': 'Axe Beak',
  'Berserker': 'Berserker',
  'Bruto': 'Thug',
  'Bugbear cacciatore': 'Bugbear',
  'Bugbear guerriero': 'Bugbear',
  'Cammello': 'Camel',
  'Cane della morte': 'Death Dog',
  'Cane intermittente': 'Blink Dog',
  'Capitano dei pirati': 'Bandit Captain',
  'Capitano delle guardie': 'Knight',
  'Capo dei banditi': 'Bandit Captain',
  'Capo dei bruti': 'Veteran',
  'Capra': 'Goat',
  'Capra gigante': 'Giant Goat',
  'Cavaliere': 'Knight',
  'Cavallo da galoppo': 'Riding Horse',
  'Cavallo da guerra': 'Warhorse',
  'Cavallo da tiro': 'Draft Horse',
  'Cavalluccio marino': 'Sea Horse',
  'Cavalluccio marino gigante': 'Giant Sea Horse',
  'Centauro combattente': 'Centaur',
  'Cespuglio risvegliato': 'Awakened Shrub',
  'Cinghiale': 'Boar',
  'Cinghiale gigante': 'Giant Boar',
  'Coboldo guerriero': 'Kobold',
  'Coccatrice': 'Cockatrice',
  'Coccodrillo': 'Crocodile',
  'Coccodrillo gigante': 'Giant Crocodile',
  'Colonia di serpenti velenosi': 'Swarm of Poisonous Snakes',
  'Colonia di topi': 'Swarm of Rats',
  'Corvo': 'Raven',
  'Cultista': 'Cultist',
  'Cultista fanatico': 'Cult Fanatic',
  'Daino': 'Deer',
  'Druido': 'Druid',
  'Elefante': 'Elephant',
  'Esploratore': 'Scout',
  'Faina': 'Weasel',
  'Faina gigante': 'Giant Weasel',
  'Falco': 'Hawk',
  'Falco di sangue': 'Blood Hawk',
  'Famiglio del vampiro': 'Vampire Familiar',
  'Gatto': 'Cat',
  'Gladiatore': 'Gladiator',
  'Gnoll guerriero': 'Gnoll',
  'Goblin capo': 'Goblin Boss',
  'Goblin guerriero': 'Goblin',
  'Goblin tirapiedi': 'Goblin',
  'Gorilla': 'Ape',
  'Gorilla gigante': 'Giant Ape',
  'Granchio': 'Crab',
  'Granchio gigante': 'Giant Crab',
  'Guardia': 'Guard',
  'Guerriero di fanteria': 'Guard',
  'Guerriero veterano': 'Veteran',
  'Gufo': 'Owl',
  'Gufo gigante': 'Giant Owl',
  'Hobgoblin capitano': 'Hobgoblin Captain',
  'Hobgoblin guerriero': 'Hobgoblin',
  'Iena': 'Hyena',
  'Iena gigante': 'Giant Hyena',
  'Incubo': 'Nightmare',
  'Ippopotamo': 'Hippopotamus',
  'Leone': 'Lion',
  'Lucertola': 'Lizard',
  'Lucertola gigante': 'Giant Lizard',
  'Lupo': 'Wolf',
  'Lupo feroce': 'Dire Wolf',
  'Lupo invernale': 'Winter Wolf',
  'Mago': 'Mage',
  'Mammut': 'Mammoth',
  'Marinide schermagliatore': 'Merfolk',
  'Mastino': 'Mastiff',
  'Melmagrigia': 'Gray Ooze',
  'Millepiedi gigante': 'Giant Centipede',
  'Mulo': 'Mule',
  'Nobile': 'Noble',
  'Orca assassina': 'Killer Whale',
  'Piovra': 'Octopus',
  'Piovra gigante': 'Giant Octopus',
  'Pipistrello': 'Bat',
  'Pipistrello gigante': 'Giant Bat',
  'Piranha': 'Quipper',
  'Pirata': 'Bandit',
  'Pony': 'Pony',
  'Popolano': 'Commoner',
  'Pteranodonte': 'Pteranodon',
  'Ragno': 'Spider',
  'Ragno gigante': 'Giant Spider',
  'Ragno lupo gigante': 'Giant Wolf Spider',
  'Ragno-fase': 'Phase Spider',
  'Rana': 'Frog',
  'Rana gigante': 'Giant Frog',
  'Rinoceronte': 'Rhinoceros',
  'Rospo gigante': 'Giant Toad',
  'Sacerdote': 'Priest',
  'Sacerdote accolito': 'Acolyte',
  'Sahuagin guerriero': 'Sahuagin',
  'Scarabeo di fuoco gigante': 'Giant Fire Beetle',
  'Sciacallo': 'Jackal',
  'Sciame di insetti': 'Swarm of Insects',
  'Sciame di pipistrelli': 'Swarm of Bats',
  'Scorpione': 'Scorpion',
  'Scorpione gigante': 'Giant Scorpion',
  'Serpente stritolatore': 'Constrictor Snake',
  'Serpente stritolatore gigante': 'Giant Constrictor Snake',
  'Serpente velenoso': 'Poisonous Snake',
  'Serpente velenoso gigante': 'Giant Poisonous Snake',
  'Serpente volante': 'Flying Snake',
  'Spada volante animata': 'Flying Sword',
  'Spia': 'Spy',
  'Squalo cacciatore': 'Hunter Shark',
  'Squalo gigante': 'Giant Shark',
  'Squalo tropicale': 'Reef Shark',
  'Stormo di corvi': 'Swarm of Ravens',
  'Succube': 'Succubus',
  'Tappeto soffocante animato': 'Rug of Smothering',
  'Tasso': 'Badger',
  'Tasso gigante': 'Giant Badger',
  'Tigre': 'Tiger',
  'Tigre dai denti a sciabola': 'Saber-Toothed Tiger',
  'Topo': 'Rat',
  'Topo gigante': 'Giant Rat',
  'Vespa gigante': 'Giant Wasp',
  'Worg': 'Worg',
};

const BOOK_IMAGE_SOURCES = ['MM', 'XMM', 'MPMM', 'VGTM', 'MTF', 'FTD', 'ToA', 'MM14', 'MM25'];
const BOOK_PAGE_SUFFIXES = ['mm', 'xmm', 'mpmm', 'vgtm', 'mtf', 'ftd', 'toa'];
const IMAGE_FALLBACK_URL = 'https://placehold.co/320x320/241d18/f5e6bf?text=Immagine+non+disponibile';

const state = {
  loaded: false,
  data: {
    equipment: [],
    monsters: [],
    magicItems: [],
    spells: [],
  },
};

const app = document.getElementById('app');
const mainNav = document.getElementById('mainNav');
document.getElementById('menuToggle').addEventListener('click', () => {
  mainNav.classList.toggle('open');
});
window.addEventListener('hashchange', renderRoute);
window.addEventListener('DOMContentLoaded', init);
document.addEventListener('click', handleGlobalClick);

async function init() {
  const entries = await Promise.all(
    Object.entries(DATA_FILES).map(async ([key, file]) => {
      const res = await fetch(file);
      const data = await res.json();
      return [key, normalizeDataset(key, data)];
    })
  );

  for (const [key, value] of entries) state.data[key] = value;
  state.loaded = true;
  renderRoute();
}

function normalizeDataset(kind, data) {
  return data
    .map((item, index) => {
      const normalized = {
        ...item,
        _kind: kind,
        _slug: slugify(item.name || `${kind}-${index}`),
        _index: index,
        _imageCandidates: getImageCandidates(kind, item),
      };

      if (kind === 'spells') delete normalized.source;
      return normalized;
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'it', { sensitivity: 'base' }));
}

function renderRoute() {
  if (!state.loaded) return;
  const hash = (location.hash || '#/').replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);
  const [route, slug] = parts;

  if (!route) {
    renderHome();
  } else if (route === 'search') {
    renderSearchPage();
  } else if (route === 'favorites') {
    renderFavoritesPage();
  } else if (route === 'equipment') {
    slug ? renderDetail('equipment', slug) : renderListPage('equipment');
  } else if (route === 'monsters') {
    slug ? renderDetail('monsters', slug) : renderListPage('monsters');
  } else if (route === 'magic-items') {
    slug ? renderDetail('magicItems', slug) : renderListPage('magicItems');
  } else if (route === 'spells') {
    slug ? renderDetail('spells', slug) : renderListPage('spells');
  } else {
    renderNotFound();
  }

  requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
}

function renderHome() {
  const counts = {
    equipment: state.data.equipment.length,
    monsters: state.data.monsters.length,
    magicItems: state.data.magicItems.length,
    spells: state.data.spells.length,
  };

  app.innerHTML = `
    <section class="hero">
      <div class="button-grid">
        ${homeCard('equipment', counts.equipment, 'Armi, armature, strumenti e altro equipaggiamento.')}
        ${homeCard('monsters', counts.monsters, 'Statistiche, azioni, sensi, lingue, capacità speciali e immagine del mostro.')}
        ${homeCard('magicItems', counts.magicItems, 'Rarità, sintonia, descrizioni e tipi di oggetto.')}
        ${homeCard('spells', counts.spells, 'Livello, scuola, componenti, durata, gittata e testo completo.')}
        ${favoritesHomeCard()}
      </div>
    </section>

    <section class="panel" style="padding:1rem; margin-top:1rem;">
      <div class="section-header">
        <div>
          <h2 style="margin:0;">Ricerca rapida</h2>
          <div class="muted">Cerca per nome tra tutte le categorie.</div>
        </div>
      </div>
      <form id="homeSearchForm" class="toolbar">
        <label class="field" style="grid-column:1 / -1;">
          <span class="muted">Nome da cercare</span>
          <input class="input" id="homeSearchInput" placeholder="Es. Palla di fuoco, Spada lunga, Aboleth..." />
        </label>
      </form>
      <div class="footer-note">Suggerimento: puoi anche aprire la pagina ricerca completa per filtrare per categoria.</div>
    </section>
  `;

  document.getElementById('homeSearchForm').addEventListener('submit', onHomeSearchSubmit);
  document.getElementById('homeSearchInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') onHomeSearchSubmit(event);
  });
}

function homeCard(key, count, text) {
  const meta = CATEGORY_META[key];
  return `
    <a class="feature-card" href="#/${meta.route}">
      <h2>${meta.label}</h2>
      <div class="chip-row"><span class="chip">${count} elementi</span></div>
      <p>${text}</p>
    </a>
  `;
}

function renderListPage(kind) {
  const meta = CATEGORY_META[kind];
  const items = state.data[kind];
  const availableFilters = getAvailableFilters(kind, items);

  app.innerHTML = `
    <section class="panel" style="padding:1rem;">
      <div class="section-header section-title">
        <div>
          <h1>${meta.label}</h1>
          <div class="muted">Elenco completo con link alla singola scheda.</div>
        </div>
      </div>
      <div class="toolbar">
        <label class="field">
          <span class="muted">Cerca per nome</span>
          <input id="filterName" class="input" placeholder="Digita un nome..." />
        </label>
        <label class="field">
          <span class="muted">${escapeHtml(availableFilters.oneLabel)}</span>
          <select id="filterOne" class="select">
            <option value="">Tutti</option>
            ${availableFilters.one.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('')}
          </select>
        </label>
        <label class="field">
          <span class="muted">${escapeHtml(availableFilters.twoLabel)}</span>
          <select id="filterTwo" class="select">
            <option value="">Tutti</option>
            ${availableFilters.two.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="muted" id="listCount"></div>
      <div id="listGrid" class="list-grid" style="margin-top:.8rem;"></div>
    </section>
  `;

  const filterName = document.getElementById('filterName');
  const filterOne = document.getElementById('filterOne');
  const filterTwo = document.getElementById('filterTwo');

  const update = () => {
    const q = filterName.value.trim().toLowerCase();
    const one = filterOne.value;
    const two = filterTwo.value;
    const filtered = items.filter(item => matchesListFilters(kind, item, q, one, two));
    document.getElementById('listCount').textContent = `${filtered.length} risultati su ${items.length}`;
    document.getElementById('listGrid').innerHTML = filtered.length
      ? filtered.map(item => listItemHtml(kind, item)).join('')
      : `<div class="empty-state">Nessun elemento trovato.</div>`;
    bindFavoriteButtons();
  };

  filterName.addEventListener('input', update);
  filterOne.addEventListener('change', update);
  filterTwo.addEventListener('change', update);
  update();
  bindFavoriteButtons();
}

function getAvailableFilters(kind, items) {
  if (kind === 'equipment') {
    return { oneLabel: 'Filtro 1', twoLabel: 'Filtro 2', one: uniqueValues(items.map(i => i.category)), two: uniqueValues(items.map(i => i.subcategory)) };
  }
  if (kind === 'monsters') {
    return { oneLabel: 'Filtro 1', twoLabel: 'Filtro 2', one: uniqueValues(items.map(i => i.type)), two: uniqueValues(items.map(i => String(i.cr ?? ''))) };
  }
  if (kind === 'magicItems') {
    return { oneLabel: 'Filtro 1', twoLabel: 'Filtro 2', one: uniqueValues(items.map(i => i.rarity)), two: uniqueValues(items.map(i => i.type)) };
  }
  if (kind === 'spells') {
    return {
      oneLabel: 'Classe',
      twoLabel: 'Livello',
      one: uniqueValues(items.flatMap(i => Array.isArray(i.classes) ? i.classes : [])),
      two: uniqueValues(items.map(i => String(i.level)))
    };
  }
  return { oneLabel: 'Filtro 1', twoLabel: 'Filtro 2', one: [], two: [] };
}

function matchesListFilters(kind, item, q, one, two) {
  if (q && !(item.name || '').toLowerCase().includes(q)) return false;
  if (kind === 'equipment') return (!one || item.category === one) && (!two || item.subcategory === two);
  if (kind === 'monsters') return (!one || item.type === one) && (!two || String(item.cr ?? '') === two);
  if (kind === 'magicItems') return (!one || item.rarity === one) && (!two || item.type === two);
  if (kind === 'spells') return (!one || (Array.isArray(item.classes) && item.classes.includes(one))) && (!two || String(item.level) === two);
  return true;
}

function listItemHtml(kind, item) {
  const meta = CATEGORY_META[kind];
  return `
    <article class="list-entry">
      <a class="list-item list-item-link" href="#/${meta.route}/${item._slug}">
        <div class="list-main">
          <div class="item-title">
            <h3>${escapeHtml(item.name || 'Senza nome')}</h3>
          </div>
          <div class="item-subtitle">${escapeHtml(getSubtitle(kind, item))}</div>
          <div class="chip-row">${getChips(kind, item).map(chip => `<span class="chip">${escapeHtml(chip)}</span>`).join('')}</div>
        </div>
      </a>
      <div class="list-actions" aria-label="Azioni elemento">
        <a class="icon-action open-action" href="#/${meta.route}/${item._slug}" title="Apri scheda" aria-label="Apri scheda">↗</a>
        ${favoriteButtonHtml(item, 'icon')}
      </div>
    </article>
  `;
}

function renderDetail(kind, slug) {
  const item = state.data[kind].find(entry => entry._slug === slug);
  if (!item) return renderNotFound();
  const meta = CATEGORY_META[kind];
  const hero = renderDetailHero(kind, item);

  app.innerHTML = `
    <article class="detail-card ${kind === 'spells' ? 'detail-card-compact detail-card-spell' : 'detail-card-compact'}" data-app-version="${APP_VERSION}" data-build-date="${BUILD_DATE}">
      <div class="breadcrumbs"><a href="#/">Home</a> / <a href="#/${meta.route}">${meta.label}</a> / ${escapeHtml(item.name || 'Dettaglio')}</div>
      ${hero}
      ${renderDetailGrid(kind, item)}
      ${renderDetailSections(kind, item)}
    </article>
  `;

  setupDetailImage(kind, item);
  bindFavoriteButtons();
}

function renderDetailHero(kind, item) {
  const hasImage = kind === 'monsters';
  const title = escapeHtml(item.name || 'Senza nome');
  const subtitle = escapeHtml(getSubtitle(kind, item));
  const imageId = `${kind}-image`;
  const linkId = `${kind}-image-link`;
  return `
    <div class="monster-hero ${hasImage ? '' : 'monster-hero-no-image'}">
      <div class="monster-hero-copy">
        <div class="detail-title-row">
          <h1 class="detail-title">${title}</h1>
          ${favoriteButtonHtml(item, 'detail')}
        </div>
        <div class="meta-line compact-meta-line">${subtitle}</div>
      </div>
      ${hasImage ? `
      <div class="monster-image-card item-image-card">
        <img id="${imageId}" class="monster-image item-image" alt="${title}" loading="lazy" />
        <div class="monster-image-note">Immagine esterna</div>
        <a id="${linkId}" class="monster-image-link" href="#" target="_blank" rel="noreferrer noopener">Apri immagine</a>
      </div>` : ''}
    </div>
  `;
}

function setupDetailImage(kind, item) {
  if (kind !== 'monsters') return;
  const img = document.getElementById(`${kind}-image`);
  const link = document.getElementById(`${kind}-image-link`);
  if (!img || !link) return;

  const candidates = [...(item._imageCandidates || [])];
  const fallback = IMAGE_FALLBACK_URL;
  let idx = 0;
  let resolved = false;

  const applyCurrentCandidate = () => {
    const url = candidates[idx] || fallback;
    img.src = url;
    link.href = url;
    link.textContent = 'Apri immagine';
  };

  img.onerror = () => {
    if (resolved) return;
    idx += 1;
    if (idx <= candidates.length) {
      applyCurrentCandidate();
    } else {
      resolved = true;
      img.src = fallback;
      link.href = fallback;
      link.textContent = 'Apri immagine';
    }
  };

  img.onload = () => {
    resolved = true;
    const current = img.currentSrc || img.src;
    link.href = current;
    link.textContent = 'Apri immagine';
  };

  applyCurrentCandidate();
}

function renderDetailGrid(kind, item) {
  const entries = [];
  if (kind === 'equipment') {
    entries.push(['Categoria', item.category], ['Sottocategoria', item.subcategory]);
  }
  if (kind === 'magicItems') {
    entries.push(['Tipo', item.type], ['Rarità', item.rarity], ['Sintonia', item.attunement ? 'Sì' : 'No']);
  }
  if (kind === 'spells') {
    entries.push(['Tempo di lancio', item.casting_time], ['Gittata', item.range], ['Durata', item.duration], ['Rituale', item.ritual ? 'Sì' : 'No']);
  }
  if (kind === 'monsters') {
    entries.push(['CA', item.ac], ['PF', item.hp], ['GS', item.cr_detail || item.cr]);
  }

  const gridClass = kind === 'spells' ? 'detail-grid detail-grid-compact spell-grid spell-meta-box' : 'detail-grid';
  return `
    <section class="${gridClass}">
      ${entries.filter(([, value]) => hasValue(value)).map(([label, value]) => `
        <div class="${kind === 'spells' ? 'spell-meta-item' : ''}">
          <span class="label">${escapeHtml(label)}</span>
          <span>${escapeHtml(formatValue(value))}</span>
        </div>
      `).join('')}
    </section>
  `;
}

function renderDetailSections(kind, item) {
  if (kind === 'equipment') {
    return section('Descrizione', renderEquipmentDescription(item));
  }
  if (kind === 'magicItems') {
    return [
      section('Descrizione', paragraphs(item.description)),
      item.attunement_details ? section('Dettagli sintonia', paragraphs(item.attunement_details)) : ''
    ].join('');
  }
  if (kind === 'spells') {
    return [
      section('Dettagli', `
        <ul>
          ${detailListItem('Classi', joinList(item.classes))}
          ${detailListItem('Componenti', joinList(item.components))}
        </ul>
      `),
      section('Descrizione', paragraphs(item.description)),
      item.at_higher_levels ? section('Livelli superiori', paragraphs(item.at_higher_levels)) : ''
    ].join('');
  }
  if (kind === 'monsters') {
    return [
      section('Statistiche', `
        <ul>
          ${detailListItem('Velocità', formatComplex(item.speed))}
          ${detailListItem('Tiri salvezza', formatAbilityBonuses(item.saving_throws))}
          ${detailListItem('Abilità', formatComplex(item.skills))}
          ${detailListItem('Sensi', formatComplex(item.senses))}
          ${detailListItem('Linguaggi', formatComplex(item.languages))}
          ${detailListItem('Immunità danni', formatComplex(item.damage_immunities))}
          ${detailListItem('Resistenze', formatComplex(item.resistances))}
          ${detailListItem('Immunità condizioni', formatComplex(item.condition_immunities))}
        </ul>
      `),
      section('Punteggi di caratteristica', abilityScoreList(item.ability_scores, item.ability_mods)),
      section('Tratti', namedEntries(item.traits)),
      section('Azioni', namedEntries(item.actions)),
      item.bonus_actions?.length ? section('Azioni bonus', namedEntries(item.bonus_actions)) : '',
      item.reactions?.length ? section('Reazioni', namedEntries(item.reactions)) : '',
      item.legendary_actions?.length ? section('Azioni leggendarie', namedEntries(item.legendary_actions)) : '',
      hasValue(item.equipment) ? section('Equipaggiamento', listHtml(item.equipment)) : ''
    ].join('');
  }
  return '';
}

function renderSearchPage() {
  const params = new URLSearchParams((location.hash.split('?')[1] || ''));
  const initialCategory = params.get('category') || 'all';
  const allItems = getAllItems();

  app.innerHTML = `
    <section class="panel" style="padding:1rem;">
      <div class="section-header section-title">
        <div>
          <h1>Ricerca</h1>
          <div class="muted">Cerca per nome tra equipaggiamento, mostri, oggetti magici e incantesimi.</div>
        </div>
      </div>
      <div class="search-layout">
        <aside class="panel" style="padding:1rem; box-shadow:none;">
          <label class="field">
            <span class="muted">Nome</span>
            <input id="searchInput" class="input" placeholder="Digita il nome..." />
          </label>
          <label class="field" style="margin-top:.8rem;">
            <span class="muted">Categoria</span>
            <select id="searchCategory" class="select">
              <option value="all">Tutte</option>
              <option value="equipment">Equipaggiamento</option>
              <option value="monsters">Mostri</option>
              <option value="magicItems">Oggetti magici</option>
              <option value="spells">Incantesimi</option>
            </select>
          </label>
          <div class="footer-note">La ricerca confronta solo il nome, come richiesto.</div>
        </aside>
        <section>
          <div id="searchCount" class="muted" style="margin-bottom:.8rem;"></div>
          <div id="searchResults" class="search-result-list"></div>
        </section>
      </div>
    </section>
  `;

  const searchInput = document.getElementById('searchInput');
  const searchCategory = document.getElementById('searchCategory');
  searchCategory.value = initialCategory;

  const update = () => {
    const q = searchInput.value.trim().toLowerCase();
    const cat = searchCategory.value;
    let results = allItems.filter(item => (!cat || cat === 'all' || item._kind === cat));
    if (q) results = results.filter(item => (item.name || '').toLowerCase().includes(q));

    document.getElementById('searchCount').textContent = `${results.length} risultati`;
    document.getElementById('searchResults').innerHTML = results.length
      ? results.map(searchResultHtml).join('')
      : `<div class="empty-state">Nessun risultato trovato.</div>`;
    bindFavoriteButtons();
  };

  searchInput.addEventListener('input', update);
  searchCategory.addEventListener('change', update);
  update();
  bindFavoriteButtons();
}

function searchResultHtml(item) {
  const meta = CATEGORY_META[item._kind];
  return `
    <div class="search-result">
      <div class="top">
        <div>
          <div class="muted">${meta.label}</div>
          <h3 style="margin:.2rem 0 0;">${escapeHtml(item.name || 'Senza nome')}</h3>
        </div>
        <div class="search-result-actions">
          <a class="icon-action open-action" href="#/${meta.route}/${item._slug}" title="Apri scheda" aria-label="Apri scheda">↗</a>
          ${favoriteButtonHtml(item, 'icon')}
        </div>
      </div>
      <div class="item-subtitle">${escapeHtml(getSubtitle(item._kind, item))}</div>
    </div>
  `;
}


function favoritesHomeCard() {
  const count = getFavorites().length;
  return `
    <a class="feature-card" href="#/favorites">
      <h2>Preferiti</h2>
      <div class="chip-row"><span class="chip">${count} salvati</span></div>
      <p>Ogni dispositivo conserva localmente i tuoi elementi preferiti anche nelle sessioni successive.</p>
    </a>
  `;
}

function getAllItems() {
  return [...state.data.equipment, ...state.data.monsters, ...state.data.magicItems, ...state.data.spells];
}

function getItemFavoriteId(item) {
  return `${item._kind}:${item._slug}`;
}

function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setFavorites(next) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
}

function isFavorite(item) {
  return getFavorites().includes(getItemFavoriteId(item));
}

function toggleFavoriteById(id) {
  const current = getFavorites();
  const next = current.includes(id) ? current.filter(v => v !== id) : [...current, id];
  setFavorites(next);
}

function favoriteButtonHtml(item, variant = '') {
  const active = isFavorite(item);
  const label = active ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti';
  const iconOnly = String(variant).includes('icon');
  const text = iconOnly ? '' : `<span>${active ? 'Preferito' : 'Preferiti'}</span>`;
  return `<button class="favorite-toggle ${variant}" data-favorite-id="${escapeHtml(getItemFavoriteId(item))}" aria-pressed="${active ? 'true' : 'false'}" title="${label}" aria-label="${label}">${active ? '★' : '☆'}${text}</button>`;
}

function bindFavoriteButtons() {
  syncFavoriteButtons(document);
}

function handleGlobalClick(event) {
  const btn = event.target.closest('.favorite-toggle');
  if (!btn) return;
  event.preventDefault();
  event.stopPropagation();
  const id = btn.dataset.favoriteId;
  if (!id) return;
  toggleFavoriteById(id);
  syncFavoriteButtons(document);
  if (location.hash.startsWith('#/favorites')) {
    renderFavoritesPage();
  }
}

function syncFavoriteButtons(scope = document) {
  const favorites = new Set(getFavorites());
  scope.querySelectorAll('.favorite-toggle').forEach(btn => {
    const id = btn.dataset.favoriteId;
    const active = favorites.has(id);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    const icon = active ? '★' : '☆';
    const textSpan = btn.querySelector('span');
    btn.setAttribute('title', active ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti');
    btn.setAttribute('aria-label', active ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti');
    if (textSpan) {
      textSpan.textContent = active ? 'Preferito' : 'Preferiti';
      btn.innerHTML = icon + textSpan.outerHTML;
    } else {
      btn.textContent = icon;
    }
  });
}

function getFavoriteItems() {
  const ids = new Set(getFavorites());
  return getAllItems().filter(item => ids.has(getItemFavoriteId(item)));
}

function renderFavoritesPage() {
  const items = getFavoriteItems().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'it', { sensitivity: 'base' }));
  app.innerHTML = `
    <section class="panel" style="padding:1rem;">
      <div class="section-header section-title">
        <div>
          <h1>Preferiti</h1>
          <div class="muted">Salvati localmente nel browser di questo dispositivo. Non serve registrazione.</div>
        </div>
      </div>
      <div class="muted" id="favoritesCount">${items.length} elementi salvati</div>
      <div id="favoritesGrid" class="list-grid" style="margin-top:.8rem;">
        ${items.length ? items.map(item => listItemHtml(item._kind, item)).join('') : '<div class="empty-state">Non hai ancora aggiunto preferiti.</div>'}
      </div>
    </section>
  `;
  bindFavoriteButtons();
}

function renderNotFound() {
  app.innerHTML = `
    <section class="empty-state">
      <h1>Pagina non trovata</h1>
      <p>La scheda o la sezione richiesta non esiste.</p>
      <a class="button-link" href="#/">Torna alla home</a>
    </section>
  `;
}

function onHomeSearchSubmit(event) {
  event.preventDefault();
  const value = document.getElementById('homeSearchInput').value.trim();
  location.hash = '#/search';
  setTimeout(() => {
    const input = document.getElementById('searchInput');
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.focus();
    }
  }, 0);
}

function section(title, content) {
  if (!content || content === '<p>-</p>') return '';
  return `<section class="detail-section"><h2>${escapeHtml(title)}</h2>${content}</section>`;
}

function paragraphs(value) {
  const text = formatValue(value);
  if (!text) return '<p>-</p>';
  return String(text)
    .split(/\n{2,}/)
    .map(part => `<p>${renderRichText(part)}</p>`)
    .join('');
}

function renderEquipmentDescription(item) {
  const blocks = [];
  if (item && item.properties && typeof item.properties === 'object' && !Array.isArray(item.properties)) {
    const labels = {
      cost: 'Costo',
      danni: 'Danni',
      peso: 'Peso',
      proprietà: 'Proprietà',
      proprieta: 'Proprietà'
    };
    const order = ['cost', 'danni', 'peso', 'proprietà', 'proprieta'];
    const seen = new Set();
    const lines = [];

    for (const key of order) {
      if (seen.has(key) || !hasValue(item.properties[key])) continue;
      seen.add(key);
      lines.push(`<li><strong>${escapeHtml(labels[key] || prettifyKey(key))}:</strong> ${escapeHtml(formatValue(item.properties[key]))}</li>`);
    }
    for (const [key, value] of Object.entries(item.properties)) {
      if (seen.has(key) || !hasValue(value)) continue;
      lines.push(`<li><strong>${escapeHtml(labels[key] || prettifyKey(key))}:</strong> ${escapeHtml(formatValue(value))}</li>`);
    }
    if (lines.length) blocks.push(`<ul class="compact-kv-list">${lines.join('')}</ul>`);
  }

  const desc = cleanEquipmentDescriptionText(item.description, item.properties);
  if (desc) {
    blocks.push(...String(desc)
      .split(/\n{2,}/)
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => `<p>${renderRichText(part)}</p>`));
  }

  return blocks.length ? blocks.join('') : '<p>-</p>';
}

function cleanEquipmentDescriptionText(description, properties) {
  const text = formatValue(description);
  if (!text) return '';
  let out = String(text).replace(/\*\*/g, '').trim();
  if (properties && typeof properties === 'object') {
    const propLines = Object.entries(properties)
      .filter(([, value]) => hasValue(value))
      .map(([key, value]) => `${prettifyKey(key)}: ${formatValue(value)}`);
    for (const line of propLines) {
      const escaped = line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp(`(^|\\n\\n?)${escaped}(?=$|\\n)`, 'gi'), '$1');
    }
  }
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

function prettifyKey(key) {
  const normalized = String(key).replace(/_/g, ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function namedEntries(entries) {
  if (!entries?.length) return '<p>-</p>';
  return entries.map(entry => {
    if (typeof entry === 'string') return `<p>${escapeHtml(entry)}</p>`;
    const name = entry.name ? `<strong>${escapeHtml(entry.name)}.</strong> ` : '';
    const desc = entry.desc || entry.description || entry.entries || formatComplex(entry);
    const text = formatValue(desc);
    return `<p>${name}${renderRichText(text)}</p>`;
  }).join('');
}

function abilityScoreList(scores, mods) {
  if (!scores) return '<p>-</p>';
  const map = [
    ['Forza', getAbilityValue(scores, 'strength', 'str')],
    ['Destrezza', getAbilityValue(scores, 'dexterity', 'dex')],
    ['Costituzione', getAbilityValue(scores, 'constitution', 'con')],
    ['Intelligenza', getAbilityValue(scores, 'intelligence', 'int')],
    ['Saggezza', getAbilityValue(scores, 'wisdom', 'wis')],
    ['Carisma', getAbilityValue(scores, 'charisma', 'cha')],
  ];
  const modMap = [
    getAbilityValue(mods, 'strength', 'str'),
    getAbilityValue(mods, 'dexterity', 'dex'),
    getAbilityValue(mods, 'constitution', 'con'),
    getAbilityValue(mods, 'intelligence', 'int'),
    getAbilityValue(mods, 'wisdom', 'wis'),
    getAbilityValue(mods, 'charisma', 'cha'),
  ];
  return `<ul>${map.map(([label, score], i) => {
    const mod = modMap[i];
    const modText = typeof mod === 'number' ? ` (${mod >= 0 ? '+' : ''}${mod})` : hasValue(mod) ? ` (${mod})` : '';
    return `<li><strong>${label}:</strong> ${escapeHtml(String(score ?? '-'))}${escapeHtml(modText)}</li>`;
  }).join('')}</ul>`;
}

function detailListItem(label, value) {
  return hasValue(value) ? `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(formatValue(value))}</li>` : '';
}

function listHtml(values) {
  if (!hasValue(values)) return '<p>-</p>';
  const list = Array.isArray(values) ? values : [values];
  return `<ul>${list.map(v => `<li>${escapeHtml(formatValue(v))}</li>`).join('')}</ul>`;
}

function getSubtitle(kind, item) {
  if (kind === 'equipment') return [item.category, item.subcategory].filter(Boolean).join(' · ');
  if (kind === 'monsters') return [item.size, item.type, item.alignment].filter(Boolean).join(' · ');
  if (kind === 'magicItems') return [item.type, item.rarity].filter(Boolean).join(' · ');
  if (kind === 'spells') return [spellLevelLabel(item.level), item.school].filter(Boolean).join(' · ');
  return '';
}

function getChips(kind, item) {
  if (kind === 'equipment') return [item.category, item.subcategory].filter(Boolean);
  if (kind === 'monsters') return [item.type, item.cr_detail || `GS ${item.cr}`, item.hp ? `PF ${item.hp}` : null].filter(Boolean);
  if (kind === 'magicItems') return [item.rarity, item.attunement ? 'Richiede sintonia' : null].filter(Boolean);
  if (kind === 'spells') return [spellLevelLabel(item.level), item.range, item.duration].filter(Boolean);
  return [];
}

function spellLevelLabel(level) {
  const n = Number(level);
  if (Number.isNaN(n)) return formatValue(level);
  return n === 0 ? 'Trucchetto' : `${n}° livello`;
}

function uniqueValues(values) {
  return [...new Set(values.filter(v => hasValue(v)).map(v => String(v)))].sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }));
}

function joinList(value) {
  if (!value || (Array.isArray(value) && !value.length)) return '';
  if (Array.isArray(value)) return value.map(formatValue).filter(Boolean).join(', ');
  return formatValue(value);
}

function getAbilityValue(obj, longKey, shortKey) {
  return obj?.[longKey] ?? obj?.[shortKey];
}

function formatAbilityBonuses(value) {
  if (!hasValue(value)) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(formatValue).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    const labels = {
      strength: 'Forza', str: 'Forza',
      dexterity: 'Destrezza', dex: 'Destrezza',
      constitution: 'Costituzione', con: 'Costituzione',
      intelligence: 'Intelligenza', int: 'Intelligenza',
      wisdom: 'Saggezza', wis: 'Saggezza',
      charisma: 'Carisma', cha: 'Carisma'
    };
    return Object.entries(value).map(([k, v]) => `${labels[k] || k}: ${formatValue(v)}`).join(', ');
  }
  return formatValue(value);
}

function formatComplex(value) {
  return formatValue(value);
}

function formatValue(value) {
  if (!hasValue(value)) return '';
  if (typeof value === 'string') return value.replace(/\*\*/g, '**');
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return normalizeTextSpacing(smartJoinFragments(value.map(formatValue).filter(Boolean)));
  if (typeof value === 'object') {
    if (hasValue(value.text)) return formatValue(value.text);
    if (hasValue(value.description)) return formatValue(value.description);
    if (hasValue(value.desc)) return formatValue(value.desc);
    if (hasValue(value.entries)) return formatValue(value.entries);
    return normalizeTextSpacing(Object.values(value).map(formatValue).filter(Boolean).join(', '));
  }
  return String(value);
}

function smartJoinFragments(parts) {
  if (!parts?.length) return '';
  let out = '';
  for (const rawPart of parts) {
    if (!hasValue(rawPart)) continue;
    const part = String(rawPart);
    if (!out) {
      out = part;
      continue;
    }
    const prev = out[out.length - 1] || '';
    const next = part[0] || '';
    const needsSpace = /[\p{L}\p{N}”»)]/u.test(prev) && /[\p{L}\p{N}“«(]/u.test(next);
    out += (needsSpace ? ' ' : '') + part;
  }
  return out;
}

function normalizeTextSpacing(text) {
  if (!hasValue(text)) return '';
  return String(text)
    .replace(/[ 	]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([¿¡(«“])\s+/g, '$1')
    .replace(/\s+([)»”])/g, '$1')
    .trim();
}

function renderRichText(text) {
  const safe = escapeHtml(normalizeTextSpacing(text));
  return safe
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function hasValue(value) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toEnglishMonsterName(name) {
  if (MONSTER_NAME_OVERRIDES[name]) return MONSTER_NAME_OVERRIDES[name];

  const dragon = name.match(/^Drago\s+(d'argento|di bronzo|di rame|d'oro|d'ottone|bianco|blu|nero|rosso|verde)\s+(antico|adulto|giovane|cucciolo)$/i);
  if (dragon) {
    const colorMap = {
      "d'argento": 'Silver', 'di bronzo': 'Bronze', 'di rame': 'Copper', "d'oro": 'Gold', "d'ottone": 'Brass',
      'bianco': 'White', 'blu': 'Blue', 'nero': 'Black', 'rosso': 'Red', 'verde': 'Green'
    };
    const ageMap = { antico: 'Ancient', adulto: 'Adult', giovane: 'Young', cucciolo: 'Dragon Wyrmling' };
    const color = colorMap[dragon[1].toLowerCase()];
    const age = ageMap[dragon[2].toLowerCase()];
    if (dragon[2].toLowerCase() === 'cucciolo') return `${color} ${age}`;
    return `${age} ${color} Dragon`;
  }

  const sphinx = name.match(/^Sfinge\s+(del valore|della conoscenza|della meraviglia)$/i);
  if (sphinx) {
    const map = {
      'del valore': 'Androsphinx',
      'della conoscenza': 'Gynosphinx',
      'della meraviglia': 'Sphinx of Wonder'
    };
    return map[sphinx[1].toLowerCase()] || name;
  }

  return name
    .replace(/à/g, 'a').replace(/è/g, 'e').replace(/é/g, 'e').replace(/ì/g, 'i').replace(/ò/g, 'o').replace(/ù/g, 'u');
}


function getImageCandidates(kind, item) {
  if (kind === 'monsters') return getMonsterImageCandidates(item);
  if (kind === 'equipment') return getEquipmentImageCandidates(item);
  if (kind === 'magicItems') return getMagicItemImageCandidates(item);
  return [];
}

function getMonsterImageCandidates(item) {
  const englishName = toEnglishMonsterName(item.name || 'monster');
  const encoded = encodeURIComponent(englishName);
  const slug = slugify(englishName);
  const query = getMonsterImageQuery(item, englishName);
  const tagQuery = String(query || 'fantasy creature').replace(/\s*,\s*/g, ',').replace(/\s+/g, ',').replace(/,+/g, ',').replace(/^,|,$/g, '');
  const typeTags = String(item.type || 'creature').toLowerCase().replace(/\s+/g, ',');
  const candidates = [];

  for (const src of BOOK_IMAGE_SOURCES) {
    candidates.push(`https://5e.tools/img/bestiary/tokens/${src}/${encoded}.webp`);
  }
  for (const src of BOOK_IMAGE_SOURCES) {
    candidates.push(`https://5etools.jinocenc.io/img/bestiary/tokens/${src}/${encoded}.webp`);
  }
  for (const src of BOOK_IMAGE_SOURCES) {
    candidates.push(`https://raw.githubusercontent.com/5etools-mirror-2/5etools-img/master/img/bestiary/tokens/${src}/${encoded}.webp`);
  }

  candidates.push(`https://loremflickr.com/320/320/${encodeURIComponent(tagQuery)}?lock=${slug}`);
  candidates.push(`https://loremflickr.com/320/320/${encodeURIComponent('fantasy,' + tagQuery)}?lock=${slug}-2`);
  candidates.push(`https://loremflickr.com/320/320/${encodeURIComponent('monster,' + typeTags)}?lock=${slug}-3`);
  candidates.push(`https://source.unsplash.com/featured/320x320/?${encodeURIComponent(tagQuery)}`);
  candidates.push(`https://source.unsplash.com/featured/320x320/?${encodeURIComponent('fantasy,' + tagQuery)}`);

  return [...new Set(candidates)];
}

function getMonsterImageQuery(item, englishName) {
  const lowerName = String(englishName || '').toLowerCase();
  const type = String(item.type || '').toLowerCase();
  const subtype = String(item.subtype || '').toLowerCase();
  const group = String(item.group || '').toLowerCase();
  const size = String(item.size || '').toLowerCase();

  if (lowerName.includes('archmage')) return 'fantasy,wizard,mage';
  if (lowerName.includes('mage')) return 'fantasy,wizard,mage';
  if (lowerName.includes('priest') || lowerName.includes('cleric')) return 'fantasy,cleric';
  if (lowerName.includes('knight')) return 'fantasy,knight';
  if (lowerName.includes('bandit captain')) return 'fantasy,bandit';
  if (lowerName.includes('veteran')) return 'fantasy,warrior';

  const map = [
    ['elk', 'elk'],
    ['giant elk', 'elk'],
    ['horse', 'horse'],
    ['riding horse', 'horse'],
    ['warhorse', 'horse'],
    ['draft horse', 'horse'],
    ['mastiff', 'dog'],
    ['death dog', 'dog'],
    ['blink dog', 'dog'],
    ['wolf', 'wolf'],
    ['dire wolf', 'wolf'],
    ['winter wolf', 'wolf'],
    ['boar', 'boar'],
    ['giant boar', 'boar'],
    ['deer', 'deer'],
    ['eagle', 'eagle'],
    ['hawk', 'hawk'],
    ['owl', 'owl'],
    ['vulture', 'vulture'],
    ['raven', 'raven'],
    ['goat', 'goat'],
    ['camel', 'camel'],
    ['elephant', 'elephant'],
    ['mammoth', 'mammoth'],
    ['lion', 'lion'],
    ['tiger', 'tiger'],
    ['saber-toothed tiger', 'tiger'],
    ['ape', 'gorilla'],
    ['giant ape', 'gorilla'],
    ['lizard', 'lizard'],
    ['giant lizard', 'lizard'],
    ['crocodile', 'crocodile'],
    ['giant crocodile', 'crocodile'],
    ['snake', 'snake'],
    ['constrictor snake', 'snake'],
    ['poisonous snake', 'snake'],
    ['spider', 'spider'],
    ['giant spider', 'spider'],
    ['giant wolf spider', 'spider'],
    ['rat', 'rat'],
    ['giant rat', 'rat'],
    ['quipper', 'piranha'],
    ['killer whale', 'orca'],
    ['octopus', 'octopus'],
    ['giant octopus', 'octopus'],
    ['shark', 'shark'],
    ['reef shark', 'shark'],
    ['hunter shark', 'shark'],
    ['giant shark', 'shark'],
    ['frog', 'frog'],
    ['giant frog', 'frog'],
    ['giant toad', 'toad'],
    ['scorpion', 'scorpion'],
    ['giant scorpion', 'scorpion'],
    ['cockatrice', 'cockatrice'],
    ['axe beak', 'axe beak'],
    ['ankylosaurus', 'ankylosaurus'],
    ['allosaurus', 'allosaurus'],
    ['pteranodon', 'pteranodon'],
    ['triceratops', 'triceratops'],
    ['plesiosaurus', 'plesiosaurus'],
    ['tyrannosaurus rex', 'tyrannosaurus']
  ];

  for (const [needle, query] of map) {
    if (lowerName.includes(needle)) return query;
  }

  if (type.includes('umanoide') || group.includes('banditi') || group.includes('bruti')) return 'fantasy,humanoid';
  if (type.includes('drago')) return 'dragon,fantasy';
  if (type.includes('aberrazione')) return 'aberration,monster';
  if (type.includes('melma')) return 'ooze,monster';
  if (type.includes('elementale')) return subtype ? `${subtype},elemental` : 'elemental,creature';
  if (type.includes('folgletto') || type.includes('folletto')) return 'fae,creature';
  if (type.includes('celestiale')) return 'celestial,serpent';
  if (type.includes('immondo')) return 'demon,monster';
  if (type.includes('non mort')) return 'undead,monster';
  if (type.includes('mostruosità')) return 'fantasy,beast';
  if (type.includes('bestia')) return lowerName.split(' ').slice(-1)[0] || 'animal';
  if (type.includes('sciame')) return 'swarm,creature';
  return `${size ? size + ',' : ''}${type || 'fantasy,creature'}`.trim();
}


function iconifyUrl(iconName) {
  return `https://api.iconify.design/${iconName}.svg`;
}

function getEquipmentImageCandidates(item) {
  const name = String(item.name || '').toLowerCase();
  const category = String(item.category || '').toLowerCase();
  const sub = String(item.subcategory || '').toLowerCase();
  const icons = [];

  if (category.includes('armor') || sub.includes('armature')) {
    icons.push('game-icons:breastplate', 'game-icons:shield', 'mdi:shield-outline');
  }
  if (name.includes('spada')) icons.push('game-icons:broadsword', 'mdi:sword');
  if (name.includes('arco')) icons.push('game-icons:bow-arrow', 'mdi:bow-arrow');
  if (name.includes('balestra')) icons.push('game-icons:crossbow', 'mdi:crosshairs');
  if (name.includes('pugnale')) icons.push('game-icons:plain-dagger', 'mdi:knife');
  if (name.includes('ascia')) icons.push('game-icons:battle-axe', 'mdi:axe-battle');
  if (name.includes('martello')) icons.push('game-icons:warhammer', 'mdi:hammer');
  if (name.includes('lancia')) icons.push('game-icons:spear-hook', 'mdi:spear');
  if (name.includes('mazza')) icons.push('game-icons:flanged-mace', 'mdi:hammer');
  if (name.includes('fionda')) icons.push('game-icons:sling', 'mdi:circle-outline');
  if (name.includes('frecc')) icons.push('game-icons:arrow-cluster', 'mdi:arrow-projectile');
  if (name.includes('quadrello')) icons.push('game-icons:crossbow', 'mdi:arrow-projectile');
  if (name.includes('scudo')) icons.push('game-icons:shield', 'mdi:shield-outline');
  if (name.includes('corda')) icons.push('game-icons:rope-coil', 'mdi:vector-polyline');
  if (name.includes('torcia')) icons.push('game-icons:torch', 'mdi:torch');
  if (name.includes('lanterna')) icons.push('game-icons:lantern-flame', 'mdi:lantern');
  if (name.includes('zaino')) icons.push('game-icons:backpack', 'mdi:bag-personal');
  if (name.includes('borraccia')) icons.push('game-icons:water-flask', 'mdi:flask-outline');
  if (name.includes('pozion') || name.includes('ampolla')) icons.push('game-icons:potion-ball', 'mdi:bottle-tonic-outline');
  if (name.includes('attrezzi') || name.includes('strumenti') || name.includes('arnesi')) icons.push('game-icons:toolbox', 'mdi:toolbox-outline');

  if (!icons.length) {
    if (category.includes('weapon') || sub.includes('armi')) icons.push('game-icons:crossed-swords', 'mdi:sword-cross');
    else if (category.includes('gear') || sub.includes('strumenti')) icons.push('game-icons:toolbox', 'mdi:toolbox-outline');
    else icons.push('game-icons:backpack', 'mdi:bag-personal');
  }

  return [...new Set(icons)].map(iconifyUrl);
}

function getMagicItemImageCandidates(item) {
  const name = String(item.name || '').toLowerCase();
  const type = String(item.type || '').toLowerCase();
  const icons = [];

  if (name.includes('anello')) icons.push('game-icons:ring', 'mdi:ring');
  if (name.includes('bacchetta')) icons.push('game-icons:fairy-wand', 'mdi:magic-staff');
  if (name.includes('verga')) icons.push('game-icons:rod-of-asclepius', 'mdi:magic-staff');
  if (name.includes('bastone')) icons.push('game-icons:wizard-staff', 'mdi:magic-staff');
  if (name.includes('spada')) icons.push('game-icons:broadsword', 'mdi:sword');
  if (name.includes('scudo')) icons.push('game-icons:shield', 'mdi:shield-star');
  if (name.includes('mantello')) icons.push('game-icons:cloak-dagger', 'mdi:coat-rack');
  if (name.includes('stivali')) icons.push('game-icons:boots', 'mdi:shoe-formal');
  if (name.includes('guanti') || name.includes('guanto')) icons.push('game-icons:gloves', 'mdi:hand-back-right-outline');
  if (name.includes('elmo') || name.includes('corona')) icons.push('game-icons:visored-helm', 'mdi:crown-outline');
  if (name.includes('amulet') || name.includes('collana') || name.includes('medaglione')) icons.push('game-icons:heart-necklace', 'mdi:necklace');
  if (name.includes('pozione') || name.includes('elisir')) icons.push('game-icons:magic-potion', 'mdi:bottle-tonic-plus-outline');
  if (name.includes('pergamena')) icons.push('game-icons:scroll-unfurled', 'mdi:script-text-outline');
  if (name.includes('borsa') || name.includes('sacca')) icons.push('game-icons:swap-bag', 'mdi:bag-suitcase-outline');
  if (name.includes('gemma') || name.includes('pietra')) icons.push('game-icons:crystal-ball', 'mdi:diamond-stone');
  if (name.includes('ali')) icons.push('game-icons:angel-wings', 'mdi:wing');

  if (!icons.length) {
    if (type.includes('arma')) icons.push('game-icons:crossed-swords', 'mdi:sword-cross');
    else if (type.includes('armatura')) icons.push('game-icons:breastplate', 'mdi:shield-outline');
    else if (type.includes('bacchetta') || type.includes('verga') || type.includes('bastone')) icons.push('game-icons:wizard-staff', 'mdi:magic-staff');
    else if (type.includes('pozione')) icons.push('game-icons:magic-potion', 'mdi:bottle-tonic-plus-outline');
    else icons.push('game-icons:sparkles', 'mdi:creation-outline');
  }

  return [...new Set(icons)].map(iconifyUrl);
}


// v2.3.4 defensive cleanup: do not duplicate monster subtitle fields or show spell source.
