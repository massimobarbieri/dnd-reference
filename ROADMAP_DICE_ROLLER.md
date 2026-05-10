# Roadmap Dice Roller

Obiettivo: introdurre un dice roller leggero, affidabile e progressivo per mostri, incantesimi e uso libero al tavolo, senza riscrivere subito il dataset SRD. La prima versione deve funzionare bene con parsing runtime del testo esistente; la strutturazione dei JSON arrivera dopo, quando avremo esempi e regole consolidate.

## Principi Architetturali

- [ ] Mantenere il parser piccolo, puro e testabile: input stringa, output token strutturati.
- [ ] Non mescolare parsing, rendering e generazione casuale.
- [ ] Evitare dipendenze finche la sintassi resta gestibile con codice locale.
- [ ] Rendere i roll cliccabili dove gia appaiono nel testo, senza cambiare il contenuto SRD.
- [ ] Conservare sempre il testo originale, anche quando viene arricchito con bottoni.
- [ ] Gestire errori e casi ambigui senza bloccare la scheda.
- [ ] Preparare estensioni future per vantaggio, svantaggio, critici, scaling e storico.

## Componenti

### Parser

Responsabilita: trovare formule di dado nel testo e restituire token.

- [ ] Riconoscere formule base: `d20`, `1d8`, `2d6 + 3`, `4d10-2`.
- [ ] Supportare spazi opzionali attorno agli operatori.
- [ ] Supportare piu formule nella stessa descrizione.
- [ ] Ignorare falsi positivi comuni come intervalli `01-20` e date/pagine.
- [ ] Restituire posizione nel testo: `start`, `end`, `raw`.
- [ ] Restituire parti normalizzate: `count`, `faces`, `modifier`.
- [ ] Definire un limite ragionevole: massimo dadi, massimo facce, massimo modifier.

### Roller

Responsabilita: eseguire una formula gia parsata.

- [ ] Usare `crypto.getRandomValues` quando disponibile.
- [ ] Avere fallback a `Math.random` solo se necessario.
- [ ] Restituire breakdown completo dei singoli dadi.
- [ ] Restituire totale, modifier e formula normalizzata.
- [ ] Non toccare DOM o stato globale.

### Renderer Inline

Responsabilita: trasformare testo formattato in HTML sicuro con roll cliccabili.

- [ ] Integrare il parser dentro `formatInline` o in un nuovo wrapper dedicato.
- [ ] Continuare a fare escape HTML prima di inserire markup.
- [ ] Evitare di rompere grassetto e corsivo esistenti.
- [ ] Rendere i dadi come button inline accessibili.
- [ ] Aggiungere `aria-label` con formula e azione.
- [ ] Non rendere cliccabili formule dentro tabelle percentuali tipo `1d100` se usate come intestazioni, almeno nel primo passaggio.

### UI Risultati

Responsabilita: mostrare il risultato del tiro.

- [ ] Creare un pannello compatto in dettaglio scheda o globale.
- [ ] Mostrare formula, totale e breakdown.
- [ ] Evidenziare d20 naturale, critico e fallimento critico dove applicabile.
- [ ] Permettere chiusura del pannello.
- [ ] Tenere uno storico breve in memoria durante la sessione.
- [ ] Non usare localStorage per lo storico nella prima versione.

## Fasi

### Fase 1 - MVP Inline

Scopo: cliccare una formula di dado nelle descrizioni e ottenere un risultato leggibile.

- [ ] Creare funzioni pure: `parseDiceFormula`, `findDiceFormulas`, `rollDice`.
- [ ] Aggiungere bottoni inline per formule nelle descrizioni di mostri, incantesimi e oggetti.
- [ ] Aggiungere pannello risultato minimale.
- [ ] Coprire i casi base con test manuali da console o fixture locali.
- [ ] Verificare su mobile che i bottoni inline non rompano il layout.

Criteri di accettazione:

- [ ] `2d6 + 3` viene riconosciuto e tirato.
- [ ] `1d20 + 7` viene riconosciuto e tirato.
- [ ] Le descrizioni senza dadi restano identiche.
- [ ] Le tabelle SRD restano leggibili.
- [ ] Nessun HTML non sicuro viene introdotto dal testo sorgente.

### Fase 2 - Attacchi Mostri

Scopo: rendere ergonomici i blocchi di attacco dei mostri.

- [ ] Riconoscere pattern `Tiro per colpire ... +N`.
- [ ] Aggiungere bottone dedicato al tiro per colpire.
- [ ] Aggiungere supporto vantaggio/svantaggio per d20.
- [ ] Distinguere danno normale da danno extra quando sono nello stesso attacco.
- [ ] Mostrare breakdown separato per colpire e danni.

Criteri di accettazione:

- [ ] Un attacco con `+7` tira `1d20 + 7`.
- [ ] Un danno `2d8 + 4` tira solo i danni.
- [ ] Vantaggio e svantaggio mostrano entrambi i d20 e quale viene tenuto.

### Fase 3 - Incantesimi e Scaling

Scopo: gestire formule in descrizioni complesse e slot superiori.

- [ ] Identificare formule nelle descrizioni degli incantesimi.
- [ ] Analizzare sezioni `scaling` per testi come `1d6 per ogni slot`.
- [ ] Progettare UI per scegliere il livello dello slot quando applicabile.
- [ ] Supportare danni ripetuti o multi-bersaglio senza automatismi invasivi.
- [ ] Documentare i casi non automatizzabili.

Criteri di accettazione:

- [ ] Incantesimi semplici con danno diretto sono cliccabili.
- [ ] Scaling non chiaro resta testo normale o richiede conferma utente.
- [ ] Il parser non inventa formule non presenti.

### Fase 4 - Dice Tray Globale

Scopo: offrire uno strumento sempre disponibile per tiri liberi.

- [ ] Aggiungere input libero per formule.
- [ ] Validare formula prima del tiro.
- [ ] Supportare storico sessione.
- [ ] Supportare scorciatoie rapide: d4, d6, d8, d10, d12, d20, d100.
- [ ] Valutare sintassi avanzata: `2d20kh1`, `2d20kl1`, `4d6dl1`.

Criteri di accettazione:

- [ ] L'utente puo tirare una formula anche fuori dalle schede.
- [ ] Gli errori di sintassi sono chiari e non tecnici.
- [ ] Il tray non copre contenuto essenziale su mobile.

### Fase 5 - Dati Strutturati

Scopo: passare da parsing runtime a dati arricchiti dove ha senso.

- [ ] Mappare esempi reali di mostri con attacchi frequenti.
- [ ] Definire schema opzionale per `tiri`, `danni`, `cd`, `ricarica`.
- [ ] Arricchire JSON solo per campi ad alta confidenza.
- [ ] Mantenere fallback al parser runtime.
- [ ] Aggiornare gli schemi MD/JSON nel submodule dati.

Criteri di accettazione:

- [ ] Un record arricchito migliora UI senza duplicare testo.
- [ ] I dati incompleti non rompono il rendering.
- [ ] Parser runtime e dati strutturati convivono.

## Rischi e Decisioni

- [ ] Ambiguita del testo SRD: alcune formule non sono azioni di tiro ma intervalli, tabelle o spiegazioni.
- [ ] Critici: raddoppiare i dadi e non i modifier richiede contesto di attacco.
- [ ] Scaling incantesimi: spesso dipende da livello, turno o bersagli.
- [ ] Accessibilita: i bottoni inline devono essere navigabili ma non invadenti.
- [ ] Mobile: il risultato deve essere leggibile senza occupare tutta la scheda.

## Primo Task Raccomandato

- [ ] Implementare parser e roller puri in `assets/js/app.js`, dietro funzioni isolate.
- [ ] Aggiungere renderer inline dei dadi solo per descrizioni, tratti e azioni.
- [ ] Aggiungere pannello risultato minimale nella scheda dettaglio.
- [ ] Verificare manualmente con:
  - [ ] un mostro con attacco e danni
  - [ ] un incantesimo con danno
  - [ ] un oggetto con tabella `1d100`
  - [ ] una scheda senza dadi
