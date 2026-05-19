# D&D Reference

Web app statica per consultare rapidamente il materiale SRD 5.2.1 in italiano durante una sessione di Dungeons & Dragons.

L'app raccoglie in un'unica interfaccia:

- mostri
- incantesimi
- classi
- specie
- background
- scheda personaggio
- oggetti magici
- regole
- glossario delle regole

I dati SRD sono mantenuti nel submodule `data` e vengono caricati dal browser come file JSON statici. L'app non richiede backend, account o database: preferiti e impostazioni locali restano nel browser dell'utente.

## Funzionalita

- Navigazione per categoria.
- Ricerca full text nelle schede.
- Schede dettagliate per mostri, incantesimi, classi, specie, background, oggetti magici, regole e glossario.
- Scheda personaggio locale con caratteristiche, combattimento, incantesimi, inventario, import ed export JSON.
- Preferiti locali per sezione.
- Dice roller integrato.
- Riconoscimento di formule di dado nel testo, per esempio `d20`, `2d6 + 3`, `2d20kh1`, `4d6dl1`.
- Tabelle SRD renderizzate in formato tabellare, incluse le tabelle multi-colonna estratte dal PDF.
- Link diretti dagli incantesimi nelle tabelle di classe alle relative schede, con liste divise per livello.

## Requisiti

Serve solo un browser moderno e un web server statico.

Per sviluppo locale sono utili:

- `git`
- `python3`, per servire rapidamente i file statici
- `node`, per eseguire i test

## Installazione

Clona il repository e inizializza il submodule dei dati:

```bash
git clone https://github.com/massimobarbieri/dnd-reference.git
cd dnd-reference
git submodule update --init --recursive
```

## Avvio locale

Avvia un web server statico dalla root del progetto:

```bash
python3 -m http.server 8080
```

Poi apri:

```text
http://localhost:8080
```

Non aprire `index.html` direttamente con `file://`: l'app carica `config.yml` e i JSON SRD con `fetch()`, quindi deve essere servita via HTTP.

Se i dati non vengono trovati, l'app rimanda alla pagina locale [fallback.html](fallback.html) con le istruzioni per inizializzare il submodule e avviare il server statico.

Su rete locale, altri dispositivi possono collegarsi all'indirizzo IP del computer che sta servendo il progetto, per esempio:

```text
http://ip-del-tuo-server:8080
```

## Struttura

```text
.
├── assets/
│   ├── css/styles.css
│   └── js/
│       ├── app.js
│       └── dice-roller.js
├── data/                  # submodule con dati SRD
├── docs/
├── tests/
├── config.yml
├── index.html
├── legal.html
└── monster-images.yml
```

## Dati SRD

Il submodule `data` punta al repository `DND-SRD-IT` e contiene i dati strutturati. I JSON non vanno duplicati nel repository principale.

```text
data/srd/5.2.1/
├── json/   # dati caricati dall'app
├── md/     # sorgenti Markdown strutturate
└── pdf/    # PDF SRD completo originale
```

I JSON usati dall'app sono configurati in [config.yml](config.yml).

Quando modifichi contenuto SRD:

1. Aggiorna il Markdown sorgente in `data/srd/5.2.1/md/`.
2. Aggiorna il JSON corrispondente in `data/srd/5.2.1/json/`.
3. Mantieni le tabelle multi-colonna con `colonne` e righe indicizzate dagli stessi nomi colonna.
4. Esegui i test sui dati.

## Test

Esegui tutta la suite:

```bash
for test in tests/*.test.js; do node "$test" || exit 1; done
```

Test utili durante lo sviluppo:

```bash
node tests/dice-roller.test.js
node tests/character-sheet.test.js
node tests/classes-section.test.js
node tests/monster-rolls-data.test.js
node tests/rules-data.test.js
node tests/rules-glossary-data.test.js
node tests/rules-list-order.test.js
node tests/roll-accessibility.test.js
node tests/roll-tray-markup.test.js
node tests/glossary-links.test.js
node tests/table-spell-links.test.js
```

## Sviluppo

L'app e' volutamente semplice:

- `index.html` carica CSS, dice roller e app principale.
- `assets/js/app.js` gestisce caricamento dati, routing hash, ricerca, rendering schede e preferiti.
- `assets/js/dice-roller.js` contiene parser e logica dei tiri.
- `assets/css/styles.css` contiene layout e componenti visuali.
- `config.yml` definisce titoli, label e percorsi dei dati.

Le schede personaggio esportate sono JSON con `schemaVersion`. Le importazioni passano sempre da una migrazione permissiva in `normalizeCharacterSheet`, cosi' i salvataggi locali precedenti restano caricabili quando si aggiungono nuovi campi.

Non c'e' una fase di build. Dopo ogni modifica a CSS, JS o dati, ricarica la pagina servita dal web server locale.

## Licenza e contenuti

Il progetto usa materiale tratto dal System Reference Document 5.2.1. Consulta [legal.html](legal.html), [LICENSE](LICENSE) e i file di licenza nel submodule `data` per i dettagli.
